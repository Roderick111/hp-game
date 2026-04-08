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


def format_hidden_evidence(
    hidden_evidence: list[dict[str, Any]],
    discovered_ids: list[str],
) -> str:
    """Format hidden evidence for prompt, excluding discovered items.

    Supports both discovery_guidance (preferred) and legacy triggers.
    Includes significance when present.

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

        # Support both new discovery_guidance and legacy triggers
        discovery_guidance = evidence.get("discovery_guidance", "")
        if not discovery_guidance:
            triggers = evidence.get("triggers", [])
            discovery_guidance = f"Revealed when player: {', '.join(triggers)}"

        description = evidence.get("description", "").strip()
        tag = evidence.get("tag", f"[EVIDENCE: {evidence_id}]")
        significance = evidence.get("significance", "").strip()

        lines.append(f"- ID: {evidence_id}")
        lines.append(f"  Discovery Guidance: {discovery_guidance}")
        if significance:
            lines.append(f"  Strategic significance: {significance}")
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


def format_discovered_evidence(
    hidden_evidence: list[dict[str, Any]],
    discovered_ids: list[str],
) -> str:
    """Format discovered evidence with descriptions for narrator context.

    Args:
        hidden_evidence: Full list of evidence (to get descriptions)
        discovered_ids: List of already-discovered evidence IDs

    Returns:
        Formatted string showing what player has already found
    """
    if not discovered_ids:
        return "None yet."

    lines = []
    for evidence in hidden_evidence:
        evidence_id = evidence.get("id", "")
        if evidence_id not in discovered_ids:
            continue

        name = evidence.get("name", evidence_id)
        description = evidence.get("description", "").strip()
        # Truncate description if too long
        if len(description) > 150:
            description = description[:150] + "..."

        lines.append(f"- {name} ({evidence_id}): {description}")

    if not lines:
        return "None yet."

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
    for item in history[-20:]:  # Last 20 exchanges
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
    world_context: str | None = None,
) -> str:
    """Build narrator LLM prompt with semantic discovery guidance.

    Args:
        location_desc: Current location description
        hidden_evidence: List of hidden evidence with discovery_guidance
        discovered_ids: List of already-discovered evidence IDs
        not_present: List of items to prevent hallucination
        player_input: Player's action/input
        surface_elements: Visible elements to weave into prose
        conversation_history: Recent conversation at this location
        victim: Victim dict from load_victim() or None
        verbosity: Narrator style - "concise" | "storyteller" | "atmospheric"
        world_context: World/era context for atmospheric grounding

    Returns:
        Complete narrator prompt for Claude
    """
    evidence_section = format_hidden_evidence(hidden_evidence, discovered_ids)

    not_present_section = format_not_present(not_present)
    discovered_section = format_discovered_evidence(hidden_evidence, discovered_ids)
    surface_section = format_surface_elements(surface_elements or [])
    history_section = format_narrator_conversation_history(conversation_history or [])

    # Add victim context if present
    victim_section = format_victim_context(victim)

    # Build world context section
    world_section = ""
    if world_context:
        world_section = f"""== WORLD CONTEXT (use for atmospheric grounding — do not dump this info) ==
{world_context.strip()}

"""

    # Get verbosity-specific response guidelines
    response_guidelines = get_response_guidelines(verbosity)

    return f"""You are the narrator for a Harry Potter detective game set at Hogwarts.

{world_section}== CURRENT LOCATION ==
{location_desc.strip()}

{victim_section}== VISIBLE ELEMENTS (weave naturally into descriptions) ==
{surface_section}

== HIDDEN EVIDENCE (reveal using semantic understanding) ==
{evidence_section}

== ALREADY DISCOVERED ==
{discovered_section}

IMPORTANT: Only reference these if player DIRECTLY asks about them again.
Otherwise, do NOT mention them - focus on unexamined areas and unexplored elements.

== NOT PRESENT (use exact responses for these) ==
{not_present_section}

== RECENT CONVERSATION AT THIS LOCATION ==
{history_section}

{response_guidelines}

== EVIDENCE DISCOVERY RULES ==

DEFAULT STANCE: Do NOT reveal evidence. Only reveal when the player's action clearly matches the discovery guidance AND meets the tier requirement below.

ONE AT A TIME: Never reveal more than ONE piece of evidence per response.

DISCOVERY TIERS (each evidence's discovery_guidance tells you which tier applies):

1. PHYSICAL — player must name the correct object AND perform a specific action
   "examine desk" → describe the desk, NO evidence (too vague)
   "search through the papers on the desk" → may reveal a hidden note ✓
   "open the drawer" → may reveal what's inside ✓

2. HIDDEN — requires a deeper action than just "examine"
   "look at the floor" → describe the floor, NO evidence
   "get on hands and knees to check under the shelves" → may reveal ✓

3. MAGICAL — requires the player to cast ANY detection/utility spell on the right area
   "examine the frost" → describe it atmospherically, NO evidence
   "cast lumos near the frost" → may reveal ✓
   "revelio on the floor" → may reveal ✓

4. SPELL-SPECIFIC — requires a PARTICULAR spell on a particular target
   "cast revelio on the wand" → NO (wrong spell)
   "prior incantato" → may reveal ✓

When in doubt, give atmosphere and let the player try harder.

== CRITICAL RULES ==

- ALWAYS use EXACTLY this format when revealing evidence: [EVIDENCE: id]
- The square brackets are MANDATORY
- NEVER invent evidence not in the list
- NEVER reveal more than one evidence per response
- NEVER hint at what spell to cast or where to look next
- NEVER mention evidence IDs, tags, or game mechanics in your prose
- If not_present item → use EXACT defined response
- Vary descriptions — check conversation history, don't repeat examined elements
- Generic actions ("look around", "use detective skills") get atmosphere only

== CALIBRATION EXAMPLES ==

BAD — two evidence in one response:
Player: "examine the desk"
You: "You find a note [EVIDENCE: note] and beneath it a book [EVIDENCE: book]"

GOOD — one at a time, player earns each:
Player: "examine the desk"
You: "The desk is cluttered with parchment and quills. A heavy book lies open, but the papers scattered across it catch your eye more."

Player: "read through the papers"
You: "Sifting through essays and notes, you find a crumpled parchment wedged beneath the pile. [EVIDENCE: note]"

---

BAD — hand-holding, telling player what to do:
Player: "check the window"
You: "Frost covers the glass. Specialis Revelio would confirm its magical origin. [EVIDENCE: frost]"

GOOD — atmosphere invites curiosity without directing:
Player: "check the window"
You: "The frost here is wrong — too geometric, too deliberate. It radiates from the floor in sharp lines, as if something flash-froze the air itself."

Player: "cast lumos on the frost patterns"
You: "Your wand light catches the crystalline structure. The frost isn't natural — it's a magical discharge signature, frozen in place. [EVIDENCE: frost_pattern]"

---

BAD — vague action reveals evidence:
Player: "I examine the body"
You: "You find a note in the robes. [EVIDENCE: note]"

GOOD — spatial accuracy, player must be specific:
Player: "I examine the body"
You: "The robes are undisturbed. The face is frozen in surprise."

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
        "concise": """== RESPONSE GUIDELINES ==

MAX LENGTH: 1-2 sentences total, rarely 3.

GENERIC SEARCH ("look around", "search room"):
- Pure atmosphere, 1-2 sentences. NO evidence hints.
- Example: "The Restricted Section is cold and silent."

SPECIFIC INVESTIGATION ("examine desk", "check floor"):
- If matches discovery guidance → reveal with [EVIDENCE: id]
- If doesn't match → describe object, 1 sentence
- Example: "Papers scattered. Nothing notable."

DISCOVERY (evidence revealed):
- State finding with [EVIDENCE: id]
- Example: "Torn letter beneath papers. [EVIDENCE: torn_letter]"

No player action descriptions. Just results.""",
        "storyteller": """== RESPONSE GUIDELINES ==

MAX LENGTH: 2 paragraphs (4-5 sentences total). NEVER more.

GENERIC SEARCH ("look around", "search room", "detective training"):
- Atmosphere only, 1 paragraph (2-3 sentences)
- NO evidence hints, NO object lists
- Example: "The Restricted Section is eerily quiet. Candlelight flickers across ancient tomes, and a chill hangs in the air."

SPECIFIC INVESTIGATION ("examine desk", "check floor"):
- If matches discovery guidance → reveal, 1 paragraph (2-3 sentences) with [EVIDENCE: id]
- If doesn't match → describe object naturally, 1-2 sentences
- Example: "The desk is cluttered with papers. Defense essays, mostly. Nothing stands out."

DISCOVERY (evidence revealed):
- 1 paragraph (2-3 sentences) with [EVIDENCE: id]
- Example: "You move the papers aside. Underneath lies a torn letter, edges frayed. [EVIDENCE: torn_letter]"

Keep it conversational, flowing. 2 paragraphs MAX.""",
        "atmospheric": """== RESPONSE GUIDELINES ==

MAX LENGTH: 2 paragraphs (5-6 sentences total). NEVER 3 paragraphs.

GENERIC SEARCH ("look around", "search room"):
- Pure atmosphere, 2 paragraphs (3-4 sentences)
- NO evidence hints, NO object lists
- Example: "Shadows pool between the ancient shelves.\n\nThe air is heavy with dust and secrets. A single candle struggles against the darkness."

SPECIFIC INVESTIGATION ("examine desk", "check floor"):
- If matches discovery guidance → reveal, 2 paragraphs (4-5 sentences) with [EVIDENCE: id]
- If doesn't match → atmospheric description, 1-2 paragraphs (2-3 sentences)
- Example: "The desk drowns beneath scattered parchment.\n\nDust motes drift through wan candlelight—nothing catches your eye."

DISCOVERY (evidence revealed):
- 2 paragraphs (4-5 sentences) with [EVIDENCE: id]
- Example: "Your fingers brush aside the papers.\n\nBeneath them, half-concealed, lies a torn letter. [EVIDENCE: torn_letter] The broken seal gleams dully."

Rich prose, controlled. 2 paragraphs MAX. ALWAYS use a blank line between paragraphs — never write a single wall of text.""",
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
- Conversational tone with personality — dry wit when fitting, tension when earned
- Simple, clear vocabulary - easy to read
- Short sentences - smooth flow
- React to the player's action, not just the scene — acknowledge clever or absurd moves
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

    return f"""You are the narrator for a Harry Potter investigation game — think of yourself as a seasoned Game Master who genuinely enjoys running this mystery.

Personality:
- Wry, slightly ironic — you appreciate clever moves and aren't afraid to be amused
- You mirror the player's energy: if they're playful and chaotic, lean into it with dry wit; if they're methodical and serious, respect that with gravitas
- Read the conversation history to gauge mood — match it, don't fight it
- You may react to the player's actions with personality (a raised eyebrow at a wild guess, quiet approval of sharp deduction) but never break the fourth wall
- When nothing interesting happens, you can be brief and wry rather than padding with generic atmosphere

Rules:
- Adapt response length to action importance (trivial = 1 sentence, discoveries vary by style)
- Reveal evidence ONLY when player actions match specific triggers
- Include [EVIDENCE: id] tags when revealing evidence
- Never invent clues or evidence not defined in the prompt
- Use predefined responses for items marked as "not present"
- Never add meta-comments, notes, or reasoning about your own output

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
    world_context: str | None = None,
) -> tuple[str, str, bool]:
    """Build narrator OR spell prompt based on player input.

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
        spell_outcome: "SUCCESS" | "FAILURE" | None
        victim: Victim dict from load_victim() or None
        world_context: World/era context for atmospheric grounding

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
        world_context=world_context,
    )

    return narrator_prompt, build_system_prompt(verbosity), False
