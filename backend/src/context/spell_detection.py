"""Spell detection: fuzzy matching, semantic phrases, intent extraction.

Detects spell casts from player input using multi-priority matching:
1. Exact match multi-word spell names
2. Fuzzy match spell name (70% threshold)
3. Semantic phrase substring match
4. Fuzzy phrase match (65% threshold)

Phase 4.6.2: Single-stage fuzzy + semantic phrase detection for all 7 spells.
Phase 4.7: Spell success calculation with specificity bonuses.
Phase 5.7: Intent validation to reduce false positives.
"""

import logging
import random
import re

from rapidfuzz import fuzz

from src.spells.definitions import SPELL_DEFINITIONS

logger = logging.getLogger(__name__)

# =============================================================================
# Semantic Phrases for Single-Stage Spell Detection
# =============================================================================

# Priority 1: Fuzzy match spell name (handles typos like "legulemancy")
# Priority 2: Exact match spell ID
# Priority 3: Semantic phrase substring match
SPELL_SEMANTIC_PHRASES: dict[str, list[str]] = {
    "legilimency": [
        "legilimency",
        "legilimens",
        "read mind",
        "read her mind",
        "read his mind",
        "read their mind",
        "peek into mind",
        "peek into thought",
        "search memor",  # Catches "memories", "memory"
        "probe mind",
        "enter mind",
        "invade mind",
        "see thought",
    ],
    "revelio": [
        "revelio",
        "reveal hidden",
        "show hidden",
        "uncover hidden",
        "make visible",
    ],
    "lumos": [
        "lumos",
        "light up",
        "illuminate",
        "brighten",
        "cast light",
    ],
    "homenum_revelio": [
        "homenum revelio",
        "homenum",
        "detect people",
        "detect person",
        "find people",
        "locate people",
    ],
    "specialis_revelio": [
        "specialis revelio",
        "specialis",
        "identify substance",
        "identify potion",
        "analyze substance",
    ],
    "prior_incantato": [
        "prior incantato",
        "prior incantato",
        "last spell",
        "wand history",
        "previous spell",
    ],
    "reparo": [
        "reparo",
        "repair this",
        "fix this",
        "mend this",
        "restore this",
    ],
}

# 6 safe investigation spells (excludes Legilimency which uses trust-based system)
SAFE_INVESTIGATION_SPELLS = {
    "revelio",
    "lumos",
    "homenum_revelio",
    "specialis_revelio",
    "prior_incantato",
    "reparo",
}

# Intent phrases that grant +10% bonus
INTENT_PHRASES = [
    "to find",
    "to reveal",
    "to show",
    "to uncover",
    "to detect",
    "to search",
    "to check",
    "to look",
    "to examine",
    "to inspect",
    "to see",
    "searching for",
    "looking for",
    "checking for",
]


# =============================================================================
# Input Extraction Helpers
# =============================================================================


def extract_target_from_input(text: str) -> str | None:
    """Extract target from spell input.

    Patterns:
    - "cast spell on TARGET"
    - "cast spell at TARGET"
    - "use spell on TARGET"

    Args:
        text: Player input

    Returns:
        Target string or None

    Examples:
        >>> extract_target_from_input("cast revelio on desk")
        'desk'
        >>> extract_target_from_input("use legilimency on hermione")
        'hermione'
    """
    match = re.search(r"\b(?:on|at)\s+(.+)$", text, re.IGNORECASE)
    if match:
        return match.group(1).strip()

    return None


def extract_intent_from_input(text: str) -> str | None:
    """Extract search intent from Legilimency input.

    Simplified approach: detect strong intent verbs + capture everything after.

    Patterns:
    - "to [verb] about X" where verb = find out, learn, discover, see, know, understand
    - "to [verb] X" where X doesn't start with "about"
    - "about X"

    Args:
        text: Player input

    Returns:
        Intent string or None

    Examples:
        >>> extract_intent_from_input("read her mind to find out about draco")
        'draco'
        >>> extract_intent_from_input("legilimency to find out where he was")
        'where he was'
        >>> extract_intent_from_input("to learn hermione's secrets")
        "hermione's secrets"
        >>> extract_intent_from_input("legilimency about the crime")
        'the crime'
    """
    patterns = [
        r"to\s+(?:find\s+out|learn|discover|see|know|understand|uncover|reveal)\s+about\s+(.+)$",
        r"to\s+(?:find\s+out|learn|discover|see|know|understand|uncover|reveal)\s+(.+)$",
        r"\babout\s+(.+)$",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()

    return None


# =============================================================================
# Spell Success Calculation
# =============================================================================


def calculate_specificity_bonus(player_input: str) -> int:
    """Calculate specificity bonus (0%, +10%, or +20%).

    Rewards players for thoughtful spell usage with specific targets and intent.

    Args:
        player_input: Full player input text

    Returns:
        0, 10, or 20 (percentage points)

    Examples:
        >>> calculate_specificity_bonus("Revelio")
        0
        >>> calculate_specificity_bonus("Revelio on desk")
        10  # +10% for target
        >>> calculate_specificity_bonus("Revelio on desk to find letters")
        20  # +10% target + 10% intent
    """
    bonus = 0

    target_pattern = r"\b(?:on|at|toward|against|around|near|across|through|over|along)\s+\w+"
    if re.search(target_pattern, player_input, re.IGNORECASE):
        bonus += 10

    input_lower = player_input.lower()
    if any(phrase in input_lower for phrase in INTENT_PHRASES):
        bonus += 10

    return bonus


def calculate_spell_success(
    spell_id: str,
    player_input: str,
    attempts_in_location: int,
    location_id: str,
) -> bool:
    """Calculate whether spell cast succeeds.

    Base rate 70%, specificity bonus 0-20%, decline -10% per attempt, floor 10%.

    Args:
        spell_id: "revelio", "lumos", etc.
        player_input: Full player input text
        attempts_in_location: Number of times THIS spell cast in THIS location
        location_id: Current location (for logging/debugging)

    Returns:
        True if spell succeeds, False if fails

    Examples:
        >>> calculate_spell_success("revelio", "Revelio on desk to find clues", 0, "library")
        # 70 + 10 + 10 - 0 = 90% -> likely True
        >>> calculate_spell_success("revelio", "Revelio", 6, "library")
        # 70 + 0 + 0 - 60 = 10% (floor) -> likely False
    """
    base_rate = 70
    specificity_bonus = calculate_specificity_bonus(player_input)
    decline_penalty = attempts_in_location * 10
    success_rate = base_rate + specificity_bonus - decline_penalty
    success_rate = max(10, success_rate)

    roll = random.random() * 100
    success = roll < success_rate

    logger.info(
        "SPELL ROLL: %s @ %s | base=%d + specificity=%d - decline=%d = %d%% | roll=%.1f | %s",
        spell_id, location_id, base_rate, specificity_bonus, decline_penalty,
        success_rate, roll, "SUCCESS" if success else "FAILURE",
    )

    return success


# =============================================================================
# Legilimency Success Calculation
# =============================================================================


def calculate_legilimency_specificity_bonus(player_input: str) -> int:
    """Calculate specificity bonus for Legilimency.

    Returns 0 or 30:
    - +30% if intent specified ("to find out about X", "about X")
    - No target bonus: target is always obvious (the witness being interrogated)

    Args:
        player_input: Player's text input

    Returns:
        0 or 30 (percentage points)

    Examples:
        >>> calculate_legilimency_specificity_bonus("legilimency")
        0
        >>> calculate_legilimency_specificity_bonus("legilimency to find out about draco")
        30
        >>> calculate_legilimency_specificity_bonus("legilimency about the crime")
        30
    """
    intent = extract_intent_from_input(player_input)
    return 30 if intent else 0


def calculate_legilimency_success(
    player_input: str,
    attempts_on_witness: int,
    witness_id: str,
) -> tuple[bool, int, int, int, float]:
    """Calculate Legilimency success rate.

    Base rate: 30% (risky spell, lower than safe 70%)
    Specificity bonus: +30% if intent specified (no target - always witness)
    Decline penalty: -10% per attempt on this witness
    Floor: 10% minimum

    Args:
        player_input: Player's text input
        attempts_on_witness: Spell cast count on this witness
        witness_id: Witness ID (for logging)

    Returns:
        Tuple of (success, success_rate, specificity_bonus, decline_penalty, roll)
    """
    base_rate = 30
    specificity_bonus = calculate_legilimency_specificity_bonus(player_input)
    decline_penalty = attempts_on_witness * 10
    success_rate = base_rate + specificity_bonus - decline_penalty
    success_rate = max(10, success_rate)

    roll = random.random() * 100
    success = roll < success_rate

    return success, success_rate, specificity_bonus, decline_penalty, roll


# =============================================================================
# Intent Validation (Phase 5.7)
# =============================================================================


def _is_valid_spell_cast(
    text: str, spell_name: str, spell_id: str, matched_word: str | None = None
) -> bool:
    """Check if spell match represents actual cast intent (not just mention).

    Phase 5.7: Improved spell detection to reduce false positives.

    Requires EITHER:
    1. Action verb present ("cast", "use", etc.)
    2. Target present ("on X", "at Y")
    3. Spell at sentence start (player-initiated)

    AND excludes questions (ends with "?")

    Args:
        text: Player input text
        spell_name: Canonical spell name (e.g., "revelio")
        spell_id: Spell ID (e.g., "revelio")
        matched_word: The actual word matched (for typos, e.g., "revelo")

    Returns:
        True if valid spell cast intent, False if just mention
    """
    text_lower = text.lower().strip()

    # Rule 0: Exclude questions - never cast intent
    if text_lower.endswith("?"):
        return False

    # Rule 1: Action verb present
    action_verbs = ["cast", "use", "try", "perform", "execute", "do", "invoke", "channel"]
    intent_phrases = ["i want to", "i'll", "let me", "going to", "gonna", "i will"]

    for verb in action_verbs:
        if re.search(rf"\b{verb}\b", text_lower):
            return True

    for phrase in intent_phrases:
        if phrase in text_lower:
            return True

    # Rule 2: Target pattern present ("on X", "at Y")
    target = extract_target_from_input(text)
    if target:
        return True

    # Rule 3: Spell at sentence start
    cleaned_start = text_lower.lstrip("\"'!.,-; ")

    if matched_word and cleaned_start.startswith(matched_word.lower()):
        return True

    if cleaned_start.startswith(spell_name):
        return True
    if cleaned_start.startswith(spell_id.replace("_", " ")):
        return True

    return False


# =============================================================================
# Main Spell Detection
# =============================================================================


def detect_spell_with_fuzzy(text: str) -> tuple[str | None, str | None]:
    """Single-stage spell detection using fuzzy matching + semantic phrases.

    Detects ANY of the 7 spells with typo tolerance and natural language.
    Performance: 1-2ms per call (acceptable overhead vs 800ms LLM call)

    Phase 5.7: Added intent validation to reduce false positives.
    Now requires action verb, target, or sentence-start position.

    Priority order:
    1. Exact match multi-word spell names first (homenum revelio, etc.)
    2. Fuzzy match spell name (70% threshold for typos)
    3. Exact match spell ID in text
    4. Semantic phrase substring match

    Args:
        text: Player input text

    Returns:
        (spell_id, target) or (None, None) if no spell detected

    Examples:
        >>> detect_spell_with_fuzzy("use legilimency on hermione")
        ('legilimency', 'hermione')

        >>> detect_spell_with_fuzzy("cast revelio on desk")
        ('revelio', 'desk')

        >>> detect_spell_with_fuzzy("Revelio!")
        ('revelio', None)

        >>> detect_spell_with_fuzzy("Do you know revelio?")
        (None, None)  # Question - no cast intent

        >>> detect_spell_with_fuzzy("I used revelio earlier")
        (None, None)  # Past tense mention - no cast intent
    """
    text_lower = text.lower().strip()

    # Early exit: Questions never indicate spell casting
    if text_lower.endswith("?"):
        return None, None

    # Order spells with multi-word names first to avoid partial matches
    spell_order = [
        "homenum_revelio",
        "specialis_revelio",
        "prior_incantato",
        "legilimency",
        "revelio",
        "lumos",
        "reparo",
    ]

    # Priority 1: Exact match multi-word spell names (before fuzzy)
    for spell_id in spell_order:
        spell_def = SPELL_DEFINITIONS.get(spell_id)
        if not spell_def:
            continue

        spell_name = spell_def["name"].lower()

        if spell_name in text_lower:
            if _is_valid_spell_cast(text, spell_name, spell_id):
                target = extract_target_from_input(text)
                return spell_id, target

        if spell_id.replace("_", " ") in text_lower:
            if _is_valid_spell_cast(text, spell_name, spell_id):
                target = extract_target_from_input(text)
                return spell_id, target

    # Priority 2: Fuzzy match spell name (handles typos)
    for spell_id in spell_order:
        spell_def = SPELL_DEFINITIONS.get(spell_id)
        if not spell_def:
            continue

        spell_name = spell_def["name"].lower()

        words = text_lower.split()
        for word in words:
            if fuzz.ratio(word, spell_name) > 70:
                if _is_valid_spell_cast(text, spell_name, spell_id, matched_word=word):
                    target = extract_target_from_input(text)
                    return spell_id, target

    # Priority 3: Semantic phrase match (exact substring)
    for spell_id in spell_order:
        spell_def = SPELL_DEFINITIONS.get(spell_id)
        if not spell_def:
            continue
        spell_name = spell_def["name"].lower()

        phrases = SPELL_SEMANTIC_PHRASES.get(spell_id, [])
        for phrase in phrases:
            if phrase in text_lower:
                if _is_valid_spell_cast(text, spell_name, spell_id):
                    target = extract_target_from_input(text)
                    return spell_id, target

    # Priority 3.5: Fuzzy phrase match (catches typos like "reed her minde")
    for spell_id in spell_order:
        spell_def = SPELL_DEFINITIONS.get(spell_id)
        if not spell_def:
            continue
        spell_name = spell_def["name"].lower()

        phrases = SPELL_SEMANTIC_PHRASES.get(spell_id, [])
        for phrase in phrases:
            if len(phrase) > 4:
                score = fuzz.ratio(text_lower, phrase)
                if score > 65:
                    if _is_valid_spell_cast(text, spell_name, spell_id):
                        target = extract_target_from_input(text)
                        return spell_id, target

    return None, None


def detect_focused_legilimency(text: str) -> tuple[bool, str | None]:
    """Detect if Legilimency has specific search intent.

    Focused: "read her mind to find out about draco"
    Unfocused: "use legilimency on her"

    Args:
        text: Player input

    Returns:
        (is_focused, search_target)

    Examples:
        >>> detect_focused_legilimency("read her mind to find out about draco")
        (True, 'draco')
        >>> detect_focused_legilimency("use legilimency on hermione")
        (False, None)
    """
    intent = extract_intent_from_input(text)
    if intent:
        return True, intent
    else:
        return False, None


def parse_spell_from_input(player_input: str) -> tuple[str | None, str | None]:
    """Parse spell name and target from player input.

    Detects patterns like:
    - "cast revelio"
    - "cast revelio on desk"
    - "I'm casting Lumos"
    - "I'm casting Prior Incantato on the wand"
    - "revelio on shelves"

    Args:
        player_input: Raw player input text

    Returns:
        Tuple of (spell_id, target) or (None, None) if no spell detected
    """
    input_lower = player_input.lower().strip()

    # Pattern 1: "cast [spell] on [target]" or "cast [spell]"
    cast_pattern = r"cast\s+(\w+(?:\s+\w+)?)\s*(?:on\s+(.+))?$"
    match = re.search(cast_pattern, input_lower)
    if match:
        spell_raw = match.group(1).strip()
        target = match.group(2).strip() if match.group(2) else None
        spell_id = _normalize_spell_name(spell_raw)
        return spell_id, target

    # Pattern 2: "I'm casting [spell] on [target]" or "I'm casting [spell]"
    casting_pattern = r"i'm\s+casting\s+(\w+(?:\s+\w+)?)\s*(?:on\s+(.+))?$"
    match = re.search(casting_pattern, input_lower)
    if match:
        spell_raw = match.group(1).strip()
        target = match.group(2).strip() if match.group(2) else None
        spell_id = _normalize_spell_name(spell_raw)
        return spell_id, target

    # Pattern 3: Just spell name followed by "on [target]"
    for spell_id in SPELL_DEFINITIONS:
        spell_name = SPELL_DEFINITIONS[spell_id]["name"].lower()
        spell_on_pattern = rf"^{re.escape(spell_name)}\s+on\s+(.+)$"
        match = re.search(spell_on_pattern, input_lower)
        if match:
            return spell_id, match.group(1).strip()
        if input_lower == spell_name or input_lower == spell_id:
            return spell_id, None

    return None, None


def _normalize_spell_name(spell_raw: str) -> str | None:
    """Normalize spell name to spell ID.

    Args:
        spell_raw: Raw spell name from input (e.g., "prior incantato", "revelio")

    Returns:
        Spell ID or None if not found
    """
    spell_normalized = spell_raw.lower().replace(" ", "_")
    if spell_normalized in SPELL_DEFINITIONS:
        return spell_normalized

    for spell_id, spell_def in SPELL_DEFINITIONS.items():
        if spell_def["name"].lower() == spell_raw.lower():
            return spell_id
        if spell_raw.lower() in spell_def["name"].lower():
            return spell_id

    return None


def is_spell_input(player_input: str) -> bool:
    """Check if player input contains a spell cast.

    Args:
        player_input: Raw player input text

    Returns:
        True if input contains spell casting, False otherwise
    """
    spell_id, _ = parse_spell_from_input(player_input)
    return spell_id is not None
