"""Narrator context builder for Claude LLM.

Builds prompts for the narrator LLM with strict rules for evidence discovery
and hallucination prevention.
"""

from typing import Any


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
    for item in history[-5:]:  # Last 5 exchanges
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
) -> str:
    """Build narrator LLM prompt with strict rules.

    Args:
        location_desc: Current location description
        hidden_evidence: List of hidden evidence with triggers
        discovered_ids: List of already-discovered evidence IDs
        not_present: List of items to prevent hallucination
        player_input: Player's action/input
        surface_elements: Visible elements to weave into prose
        conversation_history: Recent conversation at this location

    Returns:
        Complete narrator prompt for Claude
    """
    evidence_section = format_hidden_evidence(hidden_evidence, discovered_ids)
    not_present_section = format_not_present(not_present)
    discovered_section = ", ".join(discovered_ids) if discovered_ids else "None"
    surface_section = format_surface_elements(surface_elements or [])
    history_section = format_narrator_conversation_history(conversation_history or [])

    return f"""You are the narrator for a Harry Potter detective game set at Hogwarts.

== CURRENT LOCATION ==
{location_desc.strip()}

== VISIBLE ELEMENTS (weave naturally into descriptions) ==
{surface_section}

IMPORTANT: When describing the scene or responding to player actions, naturally incorporate
these visible elements into your atmospheric prose. Do NOT list them explicitly. Instead of
"You can see: a desk, books, a window" write something like "The heavy oak desk dominates
the center of the room, its surface scattered with papers. Dark arts books line the shelves,
and frost creeps across the nearby window."

== HIDDEN EVIDENCE (reveal if player investigates correctly) ==
{evidence_section}

== ALREADY DISCOVERED (do not repeat discoveries) ==
{discovered_section}

== NOT PRESENT (use exact responses for these) ==
{not_present_section}

== RECENT CONVERSATION AT THIS LOCATION ==
{history_section}

IMPORTANT: You have already described this location. Do NOT repeat the same descriptions.
Build on previous responses and vary your descriptions. If the player examines something
you already described, acknowledge it briefly and add new atmospheric details.

== RULES ==
1. If player action matches hidden evidence triggers -> reveal the evidence and INCLUDE the [EVIDENCE: id] tag in your response
2. If player asks about already discovered evidence -> respond with "You've already examined this thoroughly."
3. If player asks about not_present items -> use the EXACT defined response (prevents hallucination)
4. If player asks about undefined/random things -> describe the atmosphere only, NO new clues or discoveries
5. Keep responses to 2-4 sentences - atmospheric but concise
6. For failed/vague searches -> "You search but find nothing of note."
7. Stay in character as an immersive narrator
8. NEVER invent evidence not in the hidden_evidence list
9. NEVER reveal evidence unless player action matches triggers
10. Weave visible elements into prose naturally - NO explicit lists in your responses
11. AVOID repeating descriptions from the recent conversation - vary your prose

== PLAYER ACTION ==
"{player_input}"

Respond as the narrator (2-4 sentences):"""


def build_system_prompt() -> str:
    """Build system prompt for narrator.

    Returns:
        System prompt setting narrator persona
    """
    return """You are an immersive narrator for a Harry Potter investigation game.

Your role:
- Describe scenes atmospherically but concisely (2-4 sentences max)
- Reveal evidence ONLY when player actions match specific triggers
- Include [EVIDENCE: id] tags when revealing evidence
- Never invent clues or evidence not defined in the prompt
- Use predefined responses for items marked as "not present"
- Maintain mystery and tension appropriate for a detective story

Style:
- Third person present tense ("You notice...", "The desk reveals...")
- Evocative but brief descriptions
- Harry Potter universe vocabulary and atmosphere
- Professional detective fiction tone"""
