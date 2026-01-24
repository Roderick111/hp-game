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

    Phase 5.8: Changed from triggers to discovery_guidance for semantic understanding.

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
            # Fallback to triggers for legacy cases
            triggers = evidence.get("triggers", [])
            discovery_guidance = f"Revealed when player: {', '.join(triggers)}"

        description = evidence.get("description", "").strip()
        tag = evidence.get("tag", f"[EVIDENCE: {evidence_id}]")

        lines.append(f"- ID: {evidence_id}")
        lines.append(f"  Discovery Guidance: {discovery_guidance}")
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
    """Build narrator LLM prompt with semantic discovery guidance.

    Phase 5.5: Added victim parameter for humanization context.
    Phase 5.8: Replaced rigid triggers with semantic discovery guidance.
    Phase 5.8.1: Added stricter spatial accuracy and discovery requirements.
    Phase 5.8.2: Streamlined prompt - removed verbose sections, prioritized atmosphere.

    Args:
        location_desc: Current location description
        hidden_evidence: List of hidden evidence with discovery_guidance
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
    discovered_section = format_discovered_evidence(hidden_evidence, discovered_ids)
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

== CORE PRINCIPLES ==

1. ATMOSPHERE FIRST
   - Prioritize immersion, tension, and detective atmosphere
   - Describe sensory details: lighting, sounds, temperature, mood
   - Vary your descriptions - don't repeat the same objects every time
   - Sometimes just describe the scene without mentioning evidence

2. DEPRIORITIZE ALREADY-INVESTIGATED ELEMENTS
   - Check conversation history - what has player already examined?
   - If player examined the desk → don't keep mentioning the desk
   - If player found frost_pattern → don't keep mentioning frost
   - Only mention investigated elements if player DIRECTLY asks about them again
   - Focus on unexamined areas and unexplored objects
   - If player re-examines something → "You've already examined this thoroughly"

3. SPATIAL ACCURACY
   - Evidence has a SPECIFIC LOCATION - player must investigate THAT location
   - "examine body" ≠ "examine desk" (different objects)
   - "look at arm" ≠ "examine frost on floor" (different locations)
   - Proximity is NOT enough - player must name the correct object/area

4. DISCOVERY REQUIREMENTS
   
   MAGICAL EVIDENCE:
   - Requires specific spell OR explicit magical examination
   - "Specialis Revelio on floor" → reveal ✓
   - "examine frost patterns" → reveal ✓
   - "look around" → atmospheric description, NO evidence ✗
   
   PHYSICAL EVIDENCE:
   - Requires specific location + action
   - "search floor near body" → reveal badge ✓
   - "examine desk papers" → reveal note ✓
   - "use detective skills" → atmospheric description, NO evidence ✗
   
   TESTIMONIAL EVIDENCE:
   - Requires direct social interaction
   - "question students" → reveal testimony ✓
   - "look around room" → NO testimony ✗

5. SEMANTIC UNDERSTANDING
   - Use synonyms: "examine" = "search" = "inspect" = "look at"
   - Understand intent and context
   - But require spatial accuracy and specificity

== CRITICAL RULES ==

- ALWAYS include exact [EVIDENCE: id] tag when revealing
- NEVER invent evidence not in the list
- If not_present item → use EXACT defined response
- Check conversation history - avoid mentioning already-examined elements
- Generic actions get atmosphere, not evidence hints
- Trust the player - don't hand-hold or list evidence locations

== CALIBRATION EXAMPLES ==

BAD - Too easy, wrong location:
Player: "I use my detective skills"
You: "You notice a badge on the floor. [EVIDENCE: dropped_badge]"

GOOD - Atmospheric, no hand-holding:
Player: "I use my detective skills"
You: "The Restricted Section is eerily quiet. Candlelight flickers across ancient tomes, and a chill seems to emanate from the frost-covered window."

---

BAD - Wrong location:
Player: "I examine Snape's body"
You: "In his robes, you find a crumpled note. [EVIDENCE: hidden_note]"

GOOD - Spatial accuracy:
Player: "I examine Snape's body"
You: "His black robes are undisturbed, wand still on his belt. Nothing in his pockets."

Then when player examines desk:
Player: "I search the desk"
You: "Among the scattered papers, you find a crumpled note. [EVIDENCE: hidden_note]"

---

BAD - Proximity isn't enough:
Player: "I look at Snape's arm"
You: "His arm points toward frost patterns on the floor. Dark magic residue detected. [EVIDENCE: frost_pattern]"

GOOD - Requires specificity:
Player: "I look at Snape's arm"
You: "His arm is frozen mid-reach, pointing toward a spot on the floor."

Then when player is specific:
Player: "I examine the frost patterns on the floor"
You: "The frost radiates from a specific point. You detect dark magic - signature of a Hand of Glory. [EVIDENCE: frost_pattern]"

---

BAD - Repeating already-examined elements:
Conversation history shows player examined: arm, floor, frost patterns (found evidence)
Player: "I look around carefully"
You: "The desk has scattered papers. The frost patterns on the floor look unusual. Snape's arm is outstretched."

GOOD - Focus on unexamined elements:
Conversation history shows player examined: arm, floor, frost patterns (found evidence)
Player: "I look around carefully"
You: "The Restricted Section is dimly lit by a single candle on the reading desk. Dark oak shelves tower around you, casting long shadows. The air feels unnaturally cold."

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

Rich prose, controlled. 2 paragraphs MAX.""",
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
