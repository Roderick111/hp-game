"""Spell LLM context builder for spell effect narration.

Builds prompts for Claude to generate immersive spell effect descriptions.
Follows narrator.py structure with spell-specific constraints.

Phase 4.6.2: Added single-stage fuzzy + semantic phrase detection for all 7 spells.
"""

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
    "legilimency": [
        "legilimency",  # Spell name (user requirement: just typing spell name works)
        "legilimens",  # Variant
        "read mind",
        "read her mind",
        "read his mind",
        "read their mind",
        "peek into mind",
        "peek into thought",
        "search memor",  # catches "memories", "memory"
        "probe mind",
        "enter mind",
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
    search_target: str | None = None,
    secret_revealed: bool = False,
) -> str:
    """Build Legilimency narration for 4 programmatic outcomes.

    Args:
        outcome: "success_focused", "success_unfocused", "failure_focused",
                 "failure_unfocused"
        witness_name: Name of witness
        search_target: What player searched for (focused only)
        secret_revealed: Whether secret was revealed (success_focused only)

    Returns:
        Narration prompt for Claude
    """
    templates = {
        "success_focused": f"""You are narrating the outcome of a successful focused Legilimency attempt.

== CONTEXT ==
Player cast Legilimency on {witness_name} searching for: {search_target}
Trust was HIGH (70+), attempt succeeded
{"A secret memory was revealed" if secret_revealed else "No relevant memory found"}

== NARRATION ==
Describe (2-4 sentences):
1. Legilimency connection forms smoothly
2. Player navigates memories to search target
3. {"Memory revealed naturally" if secret_revealed else "Search yields nothing useful"}
4. {witness_name} unaware of the intrusion

Style: Immersive, second-person, atmospheric but concise.""",
        "success_unfocused": f"""You are narrating the outcome of a successful unfocused Legilimency attempt.

== CONTEXT ==
Player cast Legilimency on {witness_name} WITHOUT specific search target
Trust was HIGH (70+), connection forms
But no direction = overwhelming sensory flood

== NARRATION ==
Describe (2-4 sentences):
1. Legilimency connection forms
2. Memories flood in chaotically (breakfast, homework, fears)
3. Too much information, no useful revelation
4. Player withdraws, {witness_name} unaware

Style: Sensory overload, disorienting, unsuccessful but safe.""",
        "failure_focused": f"""You are narrating the outcome of a failed focused Legilimency attempt.

== CONTEXT ==
Player cast Legilimency on {witness_name} searching for: {search_target}
Trust was LOW (<70), {witness_name}'s emotional walls block connection
Player had clear intent but insufficient rapport

== NARRATION ==
Describe (2-4 sentences):
1. Legilimency attempts to connect
2. {witness_name}'s unconscious walls (fear, distrust) block access
3. Player senses resistance, no memory revealed
4. {witness_name} unaware but feels uneasy

Style: Frustration, emotional barriers, unsuccessful.""",
        "failure_unfocused": f"""You are narrating the outcome of a failed unfocused Legilimency attempt.

== CONTEXT ==
Player cast Legilimency on {witness_name} WITHOUT specific search
Trust was LOW (<70), no clear intent
Worst outcome: emotional walls + no direction = complete failure

== NARRATION ==
Describe (2-4 sentences):
1. Legilimency attempts to connect
2. {witness_name}'s emotional barriers block access
3. No clear search direction worsens the chaos
4. Player withdraws empty-handed, {witness_name} uneasy

Style: Frustration, futility, complete failure.""",
    }

    return templates.get(outcome, templates["failure_unfocused"])


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
) -> str:
    """Build prompt for spell effect narration.

    Args:
        spell_name: Spell ID (e.g., "revelio", "legilimency")
        target: Optional target of the spell (e.g., "desk", "hermione")
        location_context: Dict with location info and available evidence
        witness_context: Optional witness info for Legilimency (includes occlumency_skill)
        player_context: Optional player state (discovered_evidence, etc.)

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

    # Build base prompt
    prompt = f"""You are narrating the effect of a spell in an Auror investigation.

== SPELL CAST ==
Spell: {spell["name"]}
Effect: {spell["description"]}
Category: {spell["category"]}
Target: {target or "general area"}

== CURRENT LOCATION ==
{location_desc.strip()}

== VALID TARGETS FOR THIS SPELL AT THIS LOCATION ==
{", ".join(valid_targets) if valid_targets else "No specific targets defined"}

== EVIDENCE THIS SPELL CAN REVEAL (if target matches) ==
{evidence_section}

== ALREADY DISCOVERED (do not repeat) ==
{", ".join(discovered_evidence) if discovered_evidence else "None"}

== RULES ==
1. If target matches valid targets AND undiscovered evidence exists -> reveal it with [EVIDENCE: id] tag
2. If target is valid but no undiscovered evidence -> describe atmospheric spell effect
3. If target is not in valid targets list -> "The spell finds nothing of note here."
4. Keep responses to 2-4 sentences - atmospheric but concise
5. NEVER invent evidence not in the revealable list
6. Stay in character as immersive Auror training narrator
"""

    # Add Legilimency-specific rules
    if spell_name.lower() == "legilimency":
        prompt += _build_legilimency_section(witness_context, target)

    prompt += f"""
== PLAYER CAST ==
Player casts {spell["name"]}{f" on {target}" if target else ""}.

Respond as the narrator (2-4 sentences):"""

    return prompt


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


def _build_legilimency_section(
    witness_context: dict[str, Any] | None,
    target: str | None,
) -> str:
    """Build Legilimency-specific prompt section with dynamic risk.

    Args:
        witness_context: Witness info including occlumency_skill
        target: Target witness ID

    Returns:
        Legilimency rules section for prompt
    """
    if not witness_context:
        return """
== LEGILIMENCY RULES ==
No valid target specified for Legilimency. Respond that mind-reading requires a specific person as target.
"""

    occlumency_skill = witness_context.get("occlumency_skill", "average")
    witness_name = witness_context.get("name", target or "the suspect")

    # Build risk evaluation based on Occlumency skill
    risk_guidance = _get_occlumency_risk_guidance(occlumency_skill)

    return f"""
== LEGILIMENCY SPECIAL RULES ==
IMPORTANT CONTEXT: Legilimency is an extremely rare and obscure skill in the wizarding world. Very few witches or wizards even know it exists, let alone possess Occlumency defenses against it. Most targets will be completely vulnerable.

HOWEVER: Using Legilimency without consent is ethically questionable. Moody values trust and proper conduct - unauthorized mind-reading could damage your relationship with him and make suspects hostile.

TARGET: {witness_name}
OCCLUMENCY SKILL: {occlumency_skill}

RISK EVALUATION:
{risk_guidance}

IMPORTANT: First give a NATURAL WARNING about the ethical risks and potential consequences. Wait for player confirmation.
Example warning: "Legilimency on an unwilling subject is invasive. {witness_name} might detect the intrusion. Moody won't approve. Are you certain?"

If player confirms (this should be a follow-up message), determine outcome based on Occlumency skill and context:

POSSIBLE OUTCOMES (choose based on narrative context, NOT fixed percentages):
1. SUCCESS UNDETECTED: Reveal memory, suspect unaware (MOST LIKELY - Occlumency is extremely rare)
2. SUCCESS DETECTED: Reveal memory BUT suspect notices the mental intrusion ("You... you're in my head!") - set relationship_damaged flag
3. FAILURE BACKLASH: If target has rare Occlumency training, mental shields may hurt caster - set mental_strain flag
4. FAILURE FLEE: Suspect panics and runs or attacks (rare, only if they detect intrusion AND relationship is hostile)

Remember: In canon, Legilimency is not illegal but extremely rare. Most wizards have NO defenses. Occlumency is even rarer.

Consequences are NARRATIVE, not mechanical. Show relationship damage through dialogue, not stats.
Include flags in your response if applicable: [FLAG: relationship_damaged] or [FLAG: mental_strain]
"""


def _get_occlumency_risk_guidance(occlumency_skill: str) -> str:
    """Get risk guidance based on target's Occlumency skill.

    Args:
        occlumency_skill: "none", "weak", "average", or "strong"

    Returns:
        Risk guidance text for prompt
    """
    skill_guidance = {
        "none": """Target has NO Occlumency training (most wizards).
- Success almost certain, target completely vulnerable
- Extremely low risk of detection (they don't know what to look for)
- Very low risk of backlash
- Main risk is ETHICAL: If detected somehow, relationship damage severe
- Moody would disapprove of unauthorized intrusion""",
        "weak": """Target has WEAK Occlumency defenses (rare).
- High chance of success undetected
- Low risk of backlash
- May still notice if pushed too hard
- Primarily ethical concerns rather than safety""",
        "average": """Target has AVERAGE Occlumency training (very rare).
- Moderate chance of either outcome
- Detection is possible
- Some backlash risk if they resist
- Proceed with caution""",
        "strong": """Target has STRONG Occlumency training (extremely rare - master level).
- High risk of detection or backlash
- Mental shields may SLAM back at caster
- Target likely to notice and react hostilely
- May flee or attack if intrusion felt
- Recommend AGAINST attempting without proper preparation""",
    }

    return skill_guidance.get(
        occlumency_skill.lower(),
        skill_guidance["none"],  # Default to "none" as it's most common
    )


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
