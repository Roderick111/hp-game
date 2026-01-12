"""Spell LLM context builder for spell effect narration.

Builds prompts for Claude to generate immersive spell effect descriptions.
Follows narrator.py structure with spell-specific constraints.

Phase 4.6.2: Added single-stage fuzzy + semantic phrase detection for all 7 spells.
Phase 4.7: Added spell success calculation with specificity bonuses.
"""

import random
import re
from typing import Any

from rapidfuzz import fuzz

from src.spells.definitions import SPELL_DEFINITIONS, get_spell

# =============================================================================
# Phase 4.6.2: Semantic Phrases for Single-Stage Spell Detection
# =============================================================================

# Semantic phrases for each spell (action-oriented + spell name)
# Priority 1: Fuzzy match spell name (handles typos like "legulemancy")
# Priority 2: Exact match spell ID
# Priority 3: Semantic phrase substring match
SPELL_SEMANTIC_PHRASES: dict[str, list[str]] = {
    # Phase 4.8: Legilimency semantic phrases for fuzzy detection
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
        "revelio",  # Spell name
        "reveal hidden",
        "show hidden",
        "uncover hidden",
        "make visible",
    ],
    "lumos": [
        "lumos",  # Spell name
        "light up",
        "illuminate",
        "brighten",
        "cast light",
    ],
    "homenum_revelio": [
        "homenum revelio",  # Spell name
        "homenum",
        "detect people",
        "detect person",
        "find people",
        "locate people",
    ],
    "specialis_revelio": [
        "specialis revelio",  # Spell name
        "specialis",
        "identify substance",
        "identify potion",
        "analyze substance",
    ],
    "prior_incantato": [
        "prior incantato",  # Spell name
        "prior incantato",
        "last spell",
        "wand history",
        "previous spell",
    ],
    "reparo": [
        "reparo",  # Spell name
        "repair this",
        "fix this",
        "mend this",
        "restore this",
    ],
}


# =============================================================================
# Phase 4.6.2: Single-Stage Spell Detection Functions
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
    # Pattern: "on X" or "at X"
    match = re.search(r"\b(?:on|at)\s+(.+)$", text, re.IGNORECASE)
    if match:
        return match.group(1).strip()

    return None


def extract_intent_from_input(text: str) -> str | None:
    """Extract search intent from Legilimency input.

    Simplified approach: detect strong intent verbs + capture everything after.

    Patterns:
    - "to [verb] X" where verb = find out, learn, discover, see, know, understand
    - "about X"

    Args:
        text: Player input

    Returns:
        Intent string or None

    Examples:
        >>> extract_intent_from_input("read her mind to find out about draco")
        'about draco'
        >>> extract_intent_from_input("legilimency to find out where he was")
        'where he was'
        >>> extract_intent_from_input("to learn hermione's secrets")
        "hermione's secrets"
        >>> extract_intent_from_input("legilimency about the crime")
        'the crime'
    """
    # Pattern matching (ordered by specificity)
    patterns = [
        # "to [verb] X" - flexible, catches most natural language
        r"to\s+(?:find\s+out|learn|discover|see|know|understand|uncover|reveal)\s+(.+)$",
        # Fallback: "about X"
        r"\babout\s+(.+)$",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()

    return None


# =============================================================================
# Phase 4.7: Spell Success Calculation with Specificity Bonuses
# =============================================================================

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
]


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

    # Target bonus: +10% if has "on X", "at X", "toward X", "against X"
    target_pattern = r"\b(?:on|at|toward|against)\s+\w+"
    if re.search(target_pattern, player_input, re.IGNORECASE):
        bonus += 10

    # Intent bonus: +10% if has "to find", "to reveal", "to show", "to uncover", "to detect"
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
    # Base rate
    base_rate = 70

    # Specificity bonus (0, 10, or 20)
    specificity_bonus = calculate_specificity_bonus(player_input)

    # Per-location decline: -10% per prior attempt
    decline_penalty = attempts_in_location * 10

    # Calculate final rate
    success_rate = base_rate + specificity_bonus - decline_penalty

    # Apply floor (never below 10%)
    success_rate = max(10, success_rate)

    # Roll (0.0-100.0)
    roll = random.random() * 100
    return roll < success_rate


# =============================================================================
# Phase 4.8: Legilimency Success Calculation
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
        Tuple of (success: bool, success_rate: int, specificity_bonus: int, decline_penalty: int, roll: float)

    Examples:
        "legilimency to find out about draco" (1st cast)
        -> 30% + 30% (intent) - 0% = 60% success

        Same input, 3rd cast:
        -> 30% + 30% - 20% = 40% success

        "legilimency" (no intent, 1st cast):
        -> 30% + 0% - 0% = 30% success
    """
    base_rate = 30
    specificity_bonus = calculate_legilimency_specificity_bonus(player_input)
    decline_penalty = attempts_on_witness * 10
    success_rate = base_rate + specificity_bonus - decline_penalty
    success_rate = max(10, success_rate)  # Floor at 10%

    roll = random.random() * 100
    success = roll < success_rate

    return success, success_rate, specificity_bonus, decline_penalty, roll


def detect_spell_with_fuzzy(text: str) -> tuple[str | None, str | None]:
    """Single-stage spell detection using fuzzy matching + semantic phrases.

    Detects ANY of the 7 spells with typo tolerance and natural language.
    Performance: 1-2ms per call (acceptable overhead vs 800ms LLM call)

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

        >>> detect_spell_with_fuzzy("legulemancy on her")  # typo
        ('legilimency', 'her')

        >>> detect_spell_with_fuzzy("I want to read her mind")
        ('legilimency', 'her')

        >>> detect_spell_with_fuzzy("cast revelo on desk")  # typo
        ('revelio', 'desk')

        >>> detect_spell_with_fuzzy("What's in your mind?")
        (None, None)  # No false positive
    """
    text_lower = text.lower().strip()

    # Order spells with multi-word names first to avoid partial matches
    # e.g., "homenum revelio" should match before "revelio"
    spell_order = [
        "homenum_revelio",  # Multi-word first
        "specialis_revelio",
        "prior_incantato",
        "legilimency",  # Then single-word
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

        # Exact match for multi-word spells
        if spell_name in text_lower:
            target = extract_target_from_input(text)
            return spell_id, target

        # Also check spell_id with spaces (e.g., "homenum revelio")
        if spell_id.replace("_", " ") in text_lower:
            target = extract_target_from_input(text)
            return spell_id, target

    # Priority 2: Fuzzy match spell name (handles typos)
    # Check single-word spells for typo tolerance
    for spell_id in spell_order:
        spell_def = SPELL_DEFINITIONS.get(spell_id)
        if not spell_def:
            continue

        spell_name = spell_def["name"].lower()

        # Extract words from input to check fuzzy match
        words = text_lower.split()
        for word in words:
            # Fuzzy match individual words against spell name
            # Use ratio (not partial_ratio) for word-to-word comparison
            if fuzz.ratio(word, spell_name) > 70:
                target = extract_target_from_input(text)
                return spell_id, target

    # Priority 3: Semantic phrase match (exact substring)
    for spell_id in spell_order:
        phrases = SPELL_SEMANTIC_PHRASES.get(spell_id, [])
        for phrase in phrases:
            if phrase in text_lower:
                target = extract_target_from_input(text)
                return spell_id, target

    # Priority 3.5: Fuzzy phrase match (catches typos like "reed her minde")
    # Use ratio (not partial_ratio) with 70% threshold to avoid false positives
    # partial_ratio can match too broadly (e.g., "mind" in "What's in your mind?")
    for spell_id in spell_order:
        phrases = SPELL_SEMANTIC_PHRASES.get(spell_id, [])
        for phrase in phrases:
            # Only match if the phrase is substantially present in the input
            # Use regular ratio which considers the full phrase length
            if len(phrase) > 4:  # Only fuzzy match longer phrases
                score = fuzz.ratio(text_lower, phrase)
                if score > 65:
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


def build_legilimency_narration_prompt(
    outcome: str,
    detected: bool,
    witness_name: str,
    witness_personality: str | None = None,
    witness_background: str | None = None,
    search_intent: str | None = None,
    available_evidence: list[dict[str, Any]] | None = None,
    discovered_evidence: list[str] | None = None,
    secrets_revealed: list[str] | None = None,
    secret_texts: dict[str, str] | None = None,
) -> str:
    """Build narration prompt for Legilimency outcomes (Phase 4.8).

    Simplified to 2 outcomes (success/failure) with detection status.

    Args:
        outcome: "success" or "failure"
        detected: Whether witness detected the intrusion
        witness_name: Name of witness
        witness_personality: Character traits (defaults if None)
        witness_background: Backstory (defaults if None)
        search_intent: What player searched for (from intent extraction)
        available_evidence: Evidence that could be revealed
        discovered_evidence: Evidence already discovered
        secrets_revealed: List of secret IDs that will be revealed
        secret_texts: Dict mapping secret IDs to their text descriptions

    Returns:
        Narration prompt for Claude
    """
    available_evidence = available_evidence or []
    discovered_evidence = discovered_evidence or []
    secrets_revealed = secrets_revealed or []
    secret_texts = secret_texts or {}

    # Default values for missing YAML fields
    if not witness_personality:
        witness_personality = "Guarded, cautious during interrogation"
    if not witness_background:
        witness_background = f"{witness_name} is a key figure in this investigation"

    # Character context
    character_profile = f"""
== CHARACTER PROFILE ==
Name: {witness_name}
Personality: {witness_personality}
Background: {witness_background}
"""

    # Secrets context (what MUST be revealed)
    secrets_context = ""
    if secrets_revealed and secret_texts:
        secrets_list = "\n".join(
            [f"- {secret_id}: {secret_texts.get(secret_id, '')}" for secret_id in secrets_revealed]
        )
        secrets_context = f"""
== SECRETS TO REVEAL ==
CRITICAL: You MUST naturally incorporate these secrets into the narration:
{secrets_list}

These are the memories/knowledge you discover. Weave them into the narrative organically.
"""

    # Evidence context (if success)
    evidence_context = ""
    if outcome == "success" and available_evidence:
        undiscovered = [e for e in available_evidence if e.get("id") not in discovered_evidence]
        if undiscovered:
            evidence_list = "\n".join(
                [
                    f"- {e.get('id', 'unknown')}: {e.get('name', 'Unknown')} - {e.get('description', '')}"
                    for e in undiscovered[:3]  # Limit to 3
                ]
            )
            evidence_context = f"""
== AVAILABLE EVIDENCE ==
You may reveal ONE of these with [EVIDENCE: id] tag:
{evidence_list}

IMPORTANT: Use [EVIDENCE: id] tag ONLY if narrative supports it.
"""

    if outcome == "success":
        detection_status = "✓ Detection: UNDETECTED" if not detected else "⚠ Detection: DETECTED"
        search_status = (
            f"✓ Search target: {search_intent}" if search_intent else "○ Search: UNFOCUSED"
        )
        withdrawal_note = (
            "Withdrawal: Exit undetected, they never knew"
            if not detected
            else "Detection: They realize what happened, eyes widen"
        )
        style = (
            "Immersive, smooth, successful"
            if not detected
            else "Tense, detected mid-search, consequence"
        )

        return f"""You are narrating the outcome of a Legilimency spell cast on {witness_name}.
{character_profile}
{secrets_context}
{evidence_context}
== OUTCOME ==
✓ Legilimency: SUCCESSFUL
{detection_status}
{search_status}

== NARRATION STRUCTURE ==
CRITICAL: Write exactly 3 paragraphs. Put TWO newline characters (\\n\\n) between each paragraph.

PARAGRAPH 1 - Connection (1 sentence):
Describe slipping into {witness_name}'s mind. Use creative imagery (silvery threads, ethereal glow, etc).

[INSERT: \\n\\n HERE]

PARAGRAPH 2 - Discovery (1-3 sentences):
{"Navigate toward: " + search_intent + ". " if search_intent else ""}{"MUST reveal the secrets listed above naturally. " if secrets_context else ""}Describe memories, thoughts, or knowledge discovered.{"Use [EVIDENCE: id] if appropriate." if evidence_context else ""}

[INSERT: \\n\\n HERE]

PARAGRAPH 3 - Withdrawal (1 sentence):
{withdrawal_note}. Describe exiting their consciousness.

Style: {style}
Format: Paragraph 1\\n\\nParagraph 2\\n\\nParagraph 3

Respond as narrator:"""

    else:  # failure
        detection_status = "⚠ Detection: DETECTED" if detected else "○ Detection: UNDETECTED"
        search_status = (
            f"✗ Search target: {search_intent} (not found)" if search_intent else "✗ Search: FAILED"
        )
        barrier_note = (
            "Barrier: Mind is closed, Occlumency shields strong"
            if not detected
            else "Detection: They sense intrusion immediately"
        )
        withdrawal_note = (
            "Withdrawal: Exit empty-handed"
            if not detected
            else "Consequence: They glare, trust damaged"
        )
        style = "Frustration, empty search" if not detected else "Detected, tense, consequence"

        return f"""You are narrating the outcome of a failed Legilimency spell on {witness_name}.
{character_profile}
== OUTCOME ==
✗ Legilimency: FAILED
{detection_status}
{search_status}

== NARRATION STRUCTURE ==
CRITICAL: Write exactly 3 paragraphs. Put TWO newline characters (\\n\\n) between each paragraph.

PARAGRAPH 1 - Attempt (1 sentence):
Describe attempting to slip into {witness_name}'s mind. Use creative imagery.

[INSERT: \\n\\n HERE]

PARAGRAPH 2 - Resistance (1-2 sentences):
{barrier_note}. Describe the frustration of being blocked. No secrets found.

[INSERT: \\n\\n HERE]

PARAGRAPH 3 - Withdrawal (1 sentence):
{withdrawal_note}. Describe exiting without success.

Style: {style}
Format: Paragraph 1\\n\\nParagraph 2\\n\\nParagraph 3

Respond as narrator:"""


def build_spell_system_prompt() -> str:
    """Build system prompt for spell effect narrator.

    Returns:
        System prompt setting spell narrator persona
    """
    return """You are an immersive narrator for spell effects in a Harry Potter Auror investigation game.

Your role:
- Describe spell effects atmospherically but concisely (1-2 sentences max)
- Reveal evidence ONLY when spell targets match the location's hidden evidence
- Include [EVIDENCE: id] tags when a spell reveals evidence
- Never invent evidence not defined in the allowed evidence list
- For Legilimency: Give natural warnings before risky mind-reading attempts
- Maintain mystery and tension appropriate for a detective story

Style:
- Second person present tense ("Your wand glows...", "The spell reveals...")
- Evocative but brief descriptions
- Harry Potter universe vocabulary and atmosphere
- Professional Auror training tone"""


def build_spell_effect_prompt(
    spell_name: str,
    target: str | None,
    location_context: dict[str, Any],
    witness_context: dict[str, Any] | None = None,
    player_context: dict[str, Any] | None = None,
    spell_outcome: str | None = None,
) -> str:
    """Build prompt for spell effect narration.

    Args:
        spell_name: Spell ID (e.g., "revelio", "legilimency")
        target: Optional target of the spell (e.g., "desk", "hermione")
        location_context: Dict with location info and available evidence
        witness_context: Optional witness info for Legilimency (includes occlumency_skill)
        player_context: Optional player state (discovered_evidence, etc.)
        spell_outcome: "SUCCESS" | "FAILURE" | None (Phase 4.7 spell success)

    Returns:
        Complete prompt for Claude spell narration
    """
    spell = get_spell(spell_name)
    if spell is None:
        return _build_unknown_spell_prompt(spell_name)

    # Extract context
    location_desc = location_context.get("description", "An investigation location.")
    spell_interactions = location_context.get("spell_contexts", {}).get("special_interactions", {})
    discovered_evidence = (player_context or {}).get("discovered_evidence", [])

    # Get spell-specific interactions for this location
    spell_interaction = spell_interactions.get(spell_name.lower(), {})
    valid_targets = spell_interaction.get("targets", [])
    reveals_evidence = spell_interaction.get("reveals_evidence", [])

    # Filter out already discovered evidence
    undiscovered_evidence = [e for e in reveals_evidence if e not in discovered_evidence]

    # Build evidence section
    evidence_section = _format_revealable_evidence(
        undiscovered_evidence,
        target,
        valid_targets,
    )

    # Build spell outcome section (Phase 4.7)
    outcome_section = _build_spell_outcome_section(spell_outcome)

    # Build base prompt
    prompt = f"""You are narrating the effect of a spell in an Auror investigation.

== SPELL CAST ==
Spell: {spell["name"]}
Effect: {spell["description"]}
Category: {spell["category"]}
Target: {target or "general area"}

== SPELL OUTCOME (Phase 4.7) ==
{outcome_section}

== CURRENT LOCATION ==
{location_desc.strip()}

== VALID TARGETS FOR THIS SPELL AT THIS LOCATION ==
{", ".join(valid_targets) if valid_targets else "No specific targets defined"}

== EVIDENCE THIS SPELL CAN REVEAL (if target matches AND spell succeeded) ==
{evidence_section}

== ALREADY DISCOVERED (do not repeat) ==
{", ".join(discovered_evidence) if discovered_evidence else "None"}

== RULES ==
1. IMPORTANT: Check SPELL OUTCOME first!
   - If outcome is "FAILURE" -> "The spell fizzles and dissipates. Nothing revealed." (regardless of target)
   - If outcome is "SUCCESS" -> proceed to evidence revelation rules below
   - If outcome is not specified -> use old behavior (treat as always succeeds)
2. On SUCCESS: If target matches valid targets AND undiscovered evidence exists -> reveal it with [EVIDENCE: id] tag
3. On SUCCESS: If target is valid but no undiscovered evidence -> describe atmospheric spell effect only
4. On SUCCESS: If target is not in valid targets list -> "The spell finds nothing of note here."
5. Keep responses to 2-4 sentences - atmospheric but concise
6. NEVER invent evidence not in the revealable list
7. Stay in character as immersive Auror training narrator
8. NEVER mention mechanical terms like "roll", "percentage", "success rate" - describe naturally
"""

    prompt += f"""
== PLAYER CAST ==
Player casts {spell["name"]}{f" on {target}" if target else ""}.

Respond as the narrator (2-4 sentences):"""

    return prompt


def _build_spell_outcome_section(spell_outcome: str | None) -> str:
    """Build spell outcome section for prompt.

    Args:
        spell_outcome: "SUCCESS" | "FAILURE" | None

    Returns:
        Formatted outcome section
    """
    if spell_outcome == "SUCCESS":
        return """Outcome: SUCCESS
The spell executes successfully. Proceed with evidence revelation rules below."""
    elif spell_outcome == "FAILURE":
        return """Outcome: FAILURE
The spell fails to manifest properly. The charm sputters and fades.
Response: Describe the spell fizzling out atmospherically. NO evidence revealed regardless of target."""
    else:
        return """Outcome: Not calculated (legacy flow)
Use old behavior - treat spell as always succeeding, check target validity for evidence."""


def _build_unknown_spell_prompt(spell_name: str) -> str:
    """Build prompt for unknown/invalid spell.

    Args:
        spell_name: The unknown spell name

    Returns:
        Prompt for handling unknown spell
    """
    return f"""The player attempted to cast "{spell_name}" but this spell is not recognized.

Respond briefly (1-2 sentences) that the spell is unknown or not available for investigation use.
Stay in character as an Auror training narrator."""


def _format_revealable_evidence(
    evidence_ids: list[str],
    target: str | None,
    valid_targets: list[str],
) -> str:
    """Format evidence that can be revealed by this spell.

    Args:
        evidence_ids: List of evidence IDs this spell can reveal
        target: The target of the spell
        valid_targets: Valid targets for this spell at this location

    Returns:
        Formatted string describing revealable evidence
    """
    if not evidence_ids:
        return "No new evidence can be revealed by this spell here."

    # Check if target matches any valid target
    target_matches = False
    if target:
        target_lower = target.lower()
        for valid in valid_targets:
            if valid.lower() in target_lower or target_lower in valid.lower():
                target_matches = True
                break

    if not target_matches and target:
        return f"Target '{target}' is not a valid target for this spell at this location."

    return f"Can reveal: {', '.join(evidence_ids)}"


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
    import re

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
        # Check for "[spell] on [target]"
        spell_on_pattern = rf"^{re.escape(spell_name)}\s+on\s+(.+)$"
        match = re.search(spell_on_pattern, input_lower)
        if match:
            return spell_id, match.group(1).strip()
        # Check for just spell name
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
    # Direct match
    spell_normalized = spell_raw.lower().replace(" ", "_")
    if spell_normalized in SPELL_DEFINITIONS:
        return spell_normalized

    # Try matching by name
    for spell_id, spell_def in SPELL_DEFINITIONS.items():
        if spell_def["name"].lower() == spell_raw.lower():
            return spell_id
        # Partial match (e.g., "prior" for "prior incantato")
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
