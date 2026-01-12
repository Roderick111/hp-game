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
    # Legilimency removed - use fuzzy matching only
    # "legilimency": [...],
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

    Patterns:
    - "to find out about X"
    - "to learn about X"
    - "about X"

    Args:
        text: Player input

    Returns:
        Intent string or None

    Examples:
        >>> extract_intent_from_input("read her mind to find out about draco")
        'draco'
        >>> extract_intent_from_input("legilimency about the crime")
        'the crime'
    """
    # Pattern: "to find out about X", "to learn about X", "about X"
    patterns = [
        r"to\s+(?:find\s+out|learn)\s+about\s+(.+)$",
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

    # Priority 3: Semantic phrase match
    for spell_id in spell_order:
        phrases = SPELL_SEMANTIC_PHRASES.get(spell_id, [])
        for phrase in phrases:
            if phrase in text_lower:
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
    witness_name: str,
    witness_personality: str | None = None,
    witness_background: str | None = None,
    search_target: str | None = None,
    evidence_revealed: bool = False,
    available_evidence: list[dict[str, Any]] | None = None,
    discovered_evidence: list[str] | None = None,
) -> str:
    """Build Legilimency narration prompt for random-based outcomes.

    Args:
        outcome: "success_focused", "success_unfocused", "failure_detected", "failure_undetected"
        witness_name: Name of witness
        witness_personality: Character traits and behavior patterns
        witness_background: Backstory and relevant context
        search_target: What player searched for (focused only)
        evidence_revealed: Whether evidence was revealed (from random roll)
        available_evidence: Evidence that can be revealed
        discovered_evidence: Evidence already discovered

    Returns:
        Narration prompt for Claude
    """
    available_evidence = available_evidence or []
    discovered_evidence = discovered_evidence or []

    # Build character context section
    char_context = ""
    if witness_personality or witness_background:
        char_context = f"""
== {witness_name.upper()} - CHARACTER PROFILE ==
Personality: {witness_personality or "Unknown"}

Background: {witness_background or "Unknown"}
"""

    # Build evidence context (like other spells)
    evidence_context = ""
    if available_evidence and evidence_revealed:
        evidence_list = [
            f"- {ev.get('id', 'unknown')}: {ev.get('description', 'No description')}"
            for ev in available_evidence
            if ev.get("id") not in discovered_evidence
        ]
        if evidence_list:
            evidence_context = f"""
== EVIDENCE THAT CAN BE REVEALED ==
{chr(10).join(evidence_list)}

**IMPORTANT**: When revealing evidence on SUCCESS, include [EVIDENCE: id] tag.
Example: "...a memory surfaces [EVIDENCE: frost_pattern]..."
"""

    templates = {
        "success_focused": f"""You are narrating a successful focused Legilimency attempt.
{char_context}{evidence_context}
== OUTCOME ==
✓ Legilimency: SUCCESSFUL
✓ Target: {search_target}
✓ Evidence: {"YES - reveal with [EVIDENCE: id] tag" if evidence_revealed else "NO - searched but found nothing"}
✓ Detection: {witness_name} UNAWARE

== NARRATION (2-4 sentences) ==
1. **Connection** - Slip into {witness_name}'s mind smoothly
2. **Character imagery** - Show memories reflecting their personality
3. **Search** - Navigate toward "{search_target}"
4. **Result** - {"Reveal evidence with [EVIDENCE: id] tag" if evidence_revealed else "Find nothing relevant to search"}
5. **Withdrawal** - Exit undetected

Style: Immersive, second-person, character-specific details.""",
        "success_unfocused": f"""You are narrating a successful unfocused Legilimency attempt.
{char_context}{evidence_context}
== OUTCOME ==
✓ Legilimency: SUCCESSFUL
✗ Target: NONE (unfocused)
✓ Evidence: {"YES - reveal with [EVIDENCE: id] tag" if evidence_revealed else "NO - chaotic, nothing useful"}
✓ Detection: {witness_name} UNAWARE

== NARRATION (2-4 sentences) ==
1. **Connection** - Enter {witness_name}'s mind
2. **Chaos** - No search direction = memory flood
3. **Character fragments** - Show their personality through random thoughts
4. **Result** - {"Stumble upon evidence with [EVIDENCE: id] tag" if evidence_revealed else "Too chaotic, nothing useful"}
5. **Withdrawal** - Exit overwhelmed but undetected

Style: Disorienting, fragmented, character-authentic.""",
        "failure_detected": f"""You are narrating a DETECTED Legilimency attempt (20% chance).
{char_context}
== OUTCOME ==
✗ Legilimency: DETECTED
✗ Evidence: NO - witness felt intrusion
⚠ Detection: {witness_name} AWARE something happened

== NARRATION (2-4 sentences) ==
1. **Attempted connection** - Try to enter {witness_name}'s mind
2. **Resistance** - Their awareness spikes, mental defenses rise
3. **Detection** - They sense the intrusion ("Something's wrong...")
4. **Failure** - Forced withdrawal, no information gained
5. **Consequence** - {witness_name} disturbed, suspicious

Style: Tense, discovered, consequence-focused.""",
        "failure_undetected": f"""You are narrating an unsuccessful but undetected Legilimency attempt.
{char_context}
== OUTCOME ==
✗ Legilimency: UNSUCCESSFUL
✗ Evidence: NO - failed to find anything
✓ Detection: {witness_name} UNAWARE

== NARRATION (2-4 sentences) ==
1. **Connection** - Enter {witness_name}'s mind
2. **Search** - {"Look for '{search_target}' but" if search_target else "Search but"} find no useful memories
3. **Character details** - Show surface thoughts (personality-authentic)
4. **Failure** - Nothing investigation-relevant surfaces
5. **Withdrawal** - Exit empty-handed but undetected

Style: Frustration, empty search, safe withdrawal.""",
    }

    return templates.get(outcome, templates["failure_undetected"])


def build_spell_system_prompt() -> str:
    """Build system prompt for spell effect narrator.

    Returns:
        System prompt setting spell narrator persona
    """
    return """You are an immersive narrator for spell effects in a Harry Potter Auror investigation game.

Your role:
- Describe spell effects atmospherically but concisely (2-4 sentences max)
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
