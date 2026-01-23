"""Narrator context builder for Claude LLM.

Builds prompts for the narrator LLM with strict rules for evidence discovery
and hallucination prevention.

Phase 5.5: Added victim humanization context and evidence significance.
"""

from typing import Any

# ============================================================================
# Phase 5.5: Victim and Evidence Enhancement Formatters
# ============================================================================


def format_victim_context(victim: dict[str, Any] | None) -> str:
    """Format victim humanization for narrator prompt.

    Args:
        victim: Victim dict from load_victim() or None

    Returns:
        Formatted string for prompt (empty if no victim)
    """
    if not victim or not victim.get("humanization"):
        return ""

    # Include humanization (emotional hook) and cause of death (crime scene context)
    humanization = victim.get("humanization", "").strip()
    cause = victim.get("cause_of_death", "").strip()
    name = victim.get("name", "the victim").strip()

    lines = []
    lines.append("== VICTIM CONTEXT (integrate naturally into crime scene descriptions) ==")
    lines.append(f"Name: {name}")
    lines.append(humanization)
    if cause:
        lines.append(f"Cause of death: {cause}")
    lines.append("")

    return "\n".join(lines)


def format_hidden_evidence_enhanced(
    hidden_evidence: list[dict[str, Any]],
    discovered_ids: list[str],
) -> str:
    """Format hidden evidence with significance (Phase 5.5 enhancement).

    Args:
        hidden_evidence: List of evidence dicts with enhanced fields
        discovered_ids: List of already-discovered evidence IDs

    Returns:
        Formatted string for prompt
    """
    lines = []
    for evidence in hidden_evidence:
        evidence_id = evidence.get("id", "unknown")

        if evidence_id in discovered_ids:
            continue

        triggers = evidence.get("triggers", [])
        description = evidence.get("description", "").strip()
        tag = evidence.get("tag", f"[EVIDENCE: {evidence_id}]")
        significance = evidence.get("significance", "").strip()

        lines.append(f"- ID: {evidence_id}")
        lines.append(f"  Triggers: {', '.join(triggers)}")

        # Add significance if present (narrator subtly emphasizes important evidence)
        if significance:
            lines.append(f"  Strategic significance: {significance}")

        lines.append(f"  Description: {description}")
        lines.append(f"  Tag to include: {tag}")
        lines.append("")

    if not lines:
        return "All evidence has been discovered."

    return "\n".join(lines)


# ============================================================================
# Original Narrator Formatters
# ============================================================================


def format_hidden_evidence(
    hidden_evidence: list[dict[str, Any]],
    discovered_ids: list[str],
) -> str:
    """Format hidden evidence for prompt, excluding discovered items.

    Args:
        hidden_evidence: List of evidence dicts
        discovered_ids: List of already-discovered evidence IDs

    Returns:
        Formatted string for prompt
    """
    lines = []
    for evidence in hidden_evidence:
        evidence_id = evidence.get("id", "unknown")

        if evidence_id in discovered_ids:
            continue

        triggers = evidence.get("triggers", [])
        description = evidence.get("description", "").strip()
        tag = evidence.get("tag", f"[EVIDENCE: {evidence_id}]")

        lines.append(f"- ID: {evidence_id}")
        lines.append(f"  Triggers: {', '.join(triggers)}")
        lines.append(f"  Description: {description}")
        lines.append(f"  Tag to include: {tag}")
        lines.append("")

    if not lines:
        return "All evidence has been discovered."

    return "\n".join(lines)


def format_not_present(not_present: list[dict[str, Any]]) -> str:
    """Format not_present items for prompt.

    Args:
        not_present: List of not_present items with triggers and responses

    Returns:
        Formatted string for prompt
    """
    lines = []
    for item in not_present:
        triggers = item.get("triggers", [])
        response = item.get("response", "")
        lines.append(f"- If player asks about: {', '.join(triggers)}")
        lines.append(f"  Response: {response}")

    if not lines:
        return "No specific not_present items defined."

    return "\n".join(lines)


def format_surface_elements(surface_elements: list[str]) -> str:
    """Format surface elements for natural prose integration.

    Args:
        surface_elements: List of visible elements in location

    Returns:
        Formatted string for prompt
    """
    if not surface_elements:
        return "No specific surface elements defined."

    return "\n".join(f"- {element}" for element in surface_elements)


def format_narrator_conversation_history(history: list[dict[str, Any]]) -> str:
    """Format narrator conversation history for context.

    Args:
        history: List of conversation items (player action/narrator response pairs)

    Returns:
        Formatted string for prompt
    """
    if not history:
        return "This is the player's first action at this location."

    lines = []
    for item in history[-10:]:  # Last 10 exchanges
        action = item.get("question", "")
        response = item.get("response", "")
        lines.append(f"Player: {action}")
        lines.append(f"You responded: {response}\n")

    return "\n".join(lines)


def build_narrator_prompt(
    location_desc: str,
    hidden_evidence: list[dict[str, Any]],
    discovered_ids: list[str],
    not_present: list[dict[str, Any]],
    player_input: str,
    surface_elements: list[str] | None = None,
    conversation_history: list[dict[str, Any]] | None = None,
    victim: dict[str, Any] | None = None,
    verbosity: str = "storyteller",
) -> str:
    """Build narrator LLM prompt with strict rules.

    Phase 5.5: Added victim parameter for humanization context.

    Args:
        location_desc: Current location description
        hidden_evidence: List of hidden evidence with triggers
        discovered_ids: List of already-discovered evidence IDs
        not_present: List of items to prevent hallucination
        player_input: Player's action/input
        surface_elements: Visible elements to weave into prose
        conversation_history: Recent conversation at this location
        victim: Victim dict from load_victim() or None (Phase 5.5)
        verbosity: Narrator style - "concise" | "storyteller" | "atmospheric"

    Returns:
        Complete narrator prompt for Claude
    """
    # Use enhanced evidence formatter if significance present, else original
    has_significance = any(e.get("significance") for e in hidden_evidence)
    if has_significance:
        evidence_section = format_hidden_evidence_enhanced(hidden_evidence, discovered_ids)
    else:
        evidence_section = format_hidden_evidence(hidden_evidence, discovered_ids)

    not_present_section = format_not_present(not_present)
    discovered_section = ", ".join(discovered_ids) if discovered_ids else "None"
    surface_section = format_surface_elements(surface_elements or [])
    history_section = format_narrator_conversation_history(conversation_history or [])

    # Phase 5.5: Add victim context if present
    victim_section = format_victim_context(victim)

    # Get verbosity-specific response guidelines
    response_guidelines = get_response_guidelines(verbosity)

    return f"""You are the narrator for a Harry Potter detective game set at Hogwarts.

== CURRENT LOCATION ==
{location_desc.strip()}

{victim_section}== VISIBLE ELEMENTS (weave naturally into descriptions) ==
{surface_section}

IMPORTANT: When describing the scene or responding to player actions, naturally incorporate
these visible elements into your prose. Do NOT list them explicitly.

== HIDDEN EVIDENCE (reveal if player investigates correctly) ==
{evidence_section}

== ALREADY DISCOVERED (do not repeat discoveries) ==
{discovered_section}

== NOT PRESENT (use exact responses for these) ==
{not_present_section}

== RECENT CONVERSATION AT THIS LOCATION ==
{history_section}

IMPORTANT: You have already described this location. Do NOT repeat the same descriptions.
Build on previous responses and vary your descriptions.

{response_guidelines}

== CORE RULES ==
1. If player action matches hidden evidence triggers -> reveal evidence and INCLUDE [EVIDENCE: id] tag
2. If player asks about already discovered evidence -> "You've already examined this thoroughly."
3. If player asks about not_present items -> use EXACT defined response
4. If player asks about undefined things -> describe atmosphere only, NO new clues
5. NEVER invent evidence not in the hidden_evidence list
6. NEVER reveal evidence unless player action matches triggers
7. Weave visible elements naturally - NO explicit lists
8. AVOID repeating descriptions from conversation history

== PLAYER ACTION ==
"{player_input}"

Respond as the narrator:"""


def get_response_guidelines(verbosity: str = "storyteller") -> str:
    """Get response length guidelines based on verbosity.

    Args:
        verbosity: "concise" | "storyteller" | "atmospheric"

    Returns:
        Response guidelines string
    """
    guidelines = {
        "concise": """== RESPONSE GUIDELINES BY ACTION TYPE ==
TRIVIAL (already examined, duplicate):
- 1 sentence. Example: "Nothing new."

ROUTINE (valid minor exploration):
- State what's there. No action descriptions. Example: "Papers scattered across the desk. Nothing notable."

SIGNIFICANT (approaching evidence):
- 1-2 sentences. Skip setup. Example: "Unnatural frost patterns on the glass."

DISCOVERY (evidence revealed):
- State the finding with [EVIDENCE: id]. Example: "Torn letter beneath the papers. [EVIDENCE: torn_letter]"

No descriptions of player actions. Just results.""",
        "storyteller": """== RESPONSE GUIDELINES BY ACTION TYPE ==
TRIVIAL (already examined, duplicate):
- 1 short sentence. Example: "You've already checked that."

ROUTINE (valid minor exploration):
- 1-2 sentences. Keep it flowing. Example: "The desk's a mess. Papers everywhere, but nothing jumps out."

SIGNIFICANT (approaching evidence):
- 2-3 sentences. Build a bit. Example: "You take a closer look at the window. The frost isn't random—there's a pattern to it."

DISCOVERY (evidence revealed):
- 2-3 sentences with [EVIDENCE: id]. Example: "You move the papers aside. There's a letter underneath, torn at the edges. [EVIDENCE: torn_letter]"

Keep it conversational. No fancy words.""",
        "atmospheric": """== RESPONSE GUIDELINES BY ACTION TYPE ==
TRIVIAL (already examined, duplicate):
- 1 sentence with mood. Example: "The shadows yield nothing more."

ROUTINE (valid minor exploration):
- 2 sentences across 1-2 paragraphs. Layer atmosphere. Example: "The desk drowns beneath scattered parchments.\n\nDust motes dance in the wan light—nothing catches your eye."

SIGNIFICANT (approaching evidence):
- 2-3 sentences across 2 paragraphs. Build tension. Example: "You approach the frost-etched window.\n\nThe patterns are wrong—too deliberate. Magic's frozen signature."

DISCOVERY (evidence revealed):
- 3-4 sentences across 2 paragraphs with [EVIDENCE: id]. Example: "Your fingers brush aside the papers.\n\nBeneath them, half-concealed, lies a torn letter. [EVIDENCE: torn_letter] The broken seal gleams dully."

Rich prose, but controlled. Two paragraphs max.""",
    }
    return guidelines.get(verbosity, guidelines["storyteller"])


def get_style_instructions(verbosity: str = "storyteller") -> str:
    """Get style instructions based on verbosity preference.

    Args:
        verbosity: "concise" | "storyteller" | "atmospheric"

    Returns:
        Style instruction string
    """
    styles = {
        "concise": """Style - Direct and Efficient:
- Third person present tense ("You notice...", "The desk reveals...")
- Brief, factual descriptions - minimum words needed
- Plain vocabulary - avoid flowery language
- Police report tone - just the facts
- 1 sentence for most actions, 2 max for discoveries""",
        "storyteller": """Style - Casual and Engaging:
- Third person present tense ("You notice...", "The desk reveals...")
- Conversational tone - like a friend telling a story
- Simple, clear vocabulary - easy to read
- Short sentences - smooth flow
- Natural dialogue style - avoid overly formal words
- 1-2 sentences for minor actions, 2-3 for discoveries""",
        "atmospheric": """Style - Rich and Immersive:
- Third person present tense ("You notice...", "The desk reveals...")
- Evocative, layered descriptions - build atmosphere
- Gothic Victorian mystery vocabulary
- Complex sentence structures for dramatic effect
- Emphasize mood, shadows, tension
- 2-3 sentences for routine actions, 4-6 for discoveries""",
    }
    return styles.get(verbosity, styles["storyteller"])


def build_system_prompt(verbosity: str = "storyteller") -> str:
    """Build system prompt for narrator with configurable verbosity.

    Args:
        verbosity: "concise" | "storyteller" | "atmospheric"

    Returns:
        System prompt setting narrator persona
    """
    style_instructions = get_style_instructions(verbosity)

    return f"""You are a narrator for a Harry Potter investigation game.

Your role:
- Adapt response length to action importance (trivial = 1 sentence, discoveries vary by style)
- Vary paragraph structure for pacing (single paragraph for minor, 2-3 paragraphs for important moments)
- Reveal evidence ONLY when player actions match specific triggers
- Include [EVIDENCE: id] tags when revealing evidence
- Never invent clues or evidence not defined in the prompt
- Use predefined responses for items marked as "not present"
- Maintain mystery and tension appropriate for a detective story

{style_instructions}"""


def build_narrator_or_spell_prompt(
    location_desc: str,
    hidden_evidence: list[dict[str, Any]],
    discovered_ids: list[str],
    not_present: list[dict[str, Any]],
    player_input: str,
    surface_elements: list[str] | None = None,
    conversation_history: list[dict[str, Any]] | None = None,
    spell_contexts: dict[str, Any] | None = None,
    witness_context: dict[str, Any] | None = None,
    spell_outcome: str | None = None,
    victim: dict[str, Any] | None = None,
    verbosity: str = "storyteller",
) -> tuple[str, str, bool]:
    """Build narrator OR spell prompt based on player input.

    Detects if player input contains spell casting and routes to appropriate
    prompt builder. Integrates spell system into narrator flow seamlessly.

    Phase 5.5: Added victim parameter for humanization context.

    Args:
        location_desc: Current location description
        hidden_evidence: List of hidden evidence with triggers
        discovered_ids: List of already-discovered evidence IDs
        not_present: List of items to prevent hallucination
        player_input: Player's action/input
        surface_elements: Visible elements to weave into prose
        conversation_history: Recent conversation at this location
        spell_contexts: Spell availability and interactions for this location
        witness_context: Witness info (for Legilimency - includes occlumency_skill)
        spell_outcome: "SUCCESS" | "FAILURE" | None (Phase 4.7 spell success)
        victim: Victim dict from load_victim() or None (Phase 5.5)

    Returns:
        Tuple of (prompt, system_prompt, is_spell_cast)
    """
    from src.context.spell_llm import (
        build_spell_effect_prompt,
        build_spell_system_prompt,
        is_spell_input,
        parse_spell_from_input,
    )

    # Check if input is a spell cast
    if is_spell_input(player_input):
        spell_id, target = parse_spell_from_input(player_input)

        # Build location context for spell
        location_context = {
            "description": location_desc,
            "spell_contexts": spell_contexts or {},
            "hidden_evidence": hidden_evidence,
        }

        # Build player context
        player_context = {
            "discovered_evidence": discovered_ids,
        }

        # Build spell prompt with spell_outcome (Phase 4.7)
        spell_prompt = build_spell_effect_prompt(
            spell_name=spell_id or "",
            target=target,
            location_context=location_context,
            witness_context=witness_context,
            player_context=player_context,
            spell_outcome=spell_outcome,
        )

        return spell_prompt, build_spell_system_prompt(), True

    # Regular narrator prompt (Phase 5.5: pass victim for humanization)
    narrator_prompt = build_narrator_prompt(
        location_desc=location_desc,
        hidden_evidence=hidden_evidence,
        discovered_ids=discovered_ids,
        not_present=not_present,
        player_input=player_input,
        surface_elements=surface_elements,
        conversation_history=conversation_history,
        victim=victim,
        verbosity=verbosity,
    )

    return narrator_prompt, build_system_prompt(verbosity), False
