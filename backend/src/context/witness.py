"""Witness context builder for Claude LLM.

Builds prompts for witness interrogation with:
- Personality-driven responses
- Trust-based behavior (lies/truth/secrets)
- Strict isolation from narrator context

Phase 5.5: Added wants/fears/moral_complexity for psychological depth.
Phase 5.7: Added spell casting support in witness conversations.
"""

from typing import Any

from src.spells.definitions import get_spell
from src.utils.trust import should_lie

# ============================================================================
# Phase 5.5: Witness Psychological Depth Formatter
# ============================================================================


def format_wants_fears(
    wants: str,
    fears: str,
    moral_complexity: str,
) -> str:
    """Format witness psychological depth fields for prompt.

    Args:
        wants: What witness is trying to achieve
        fears: What stops witness from helping
        moral_complexity: Internal conflict description

    Returns:
        Formatted string for prompt (empty if no psychological depth defined)
    """
    if not wants and not fears and not moral_complexity:
        return ""

    lines = []
    lines.append("== YOUR PSYCHOLOGY (drives your responses, never explain it) ==")

    if wants:
        lines.append(f"You want: {wants}")
    if fears:
        lines.append(f"You fear: {fears}")
    if moral_complexity:
        lines.append(f"Internal conflict: {moral_complexity}")

    lines.append("")
    return "\n".join(lines)


def format_knowledge(knowledge: list[str]) -> str:
    """Format witness knowledge as bullet points.

    Args:
        knowledge: List of knowledge strings

    Returns:
        Formatted string for prompt
    """
    if not knowledge:
        return "No specific knowledge."

    return "\n".join(f"- {k}" for k in knowledge)


def format_secrets_with_context(
    secrets: list[dict[str, Any]],
    trust: int,
    discovered_evidence: list[str],
) -> str:
    """Format all secrets for LLM to decide revelation naturally.

    Shows LLM all secrets with current context. LLM decides whether to reveal
    based on question relevance, conversation flow, safety, and trust level.

    Phase 5.5+: No trigger parsing - trust is a guide, not a gate.

    Args:
        secrets: All witness secrets
        trust: Current trust level (for context only)
        discovered_evidence: Evidence player has found (for context only)

    Returns:
        Formatted string with secrets for LLM judgment
    """
    if not secrets:
        return "You have no secrets to hide."

    lines = []
    for secret in secrets:
        secret_id = secret.get("id", "unknown")
        text = secret.get("text", "").strip()

        # Just show the secret, no rigid gates
        lines.append(f"- [{secret_id}] {text}")

    return "\n".join(lines)


def format_conversation_history(history: list[dict[str, Any]]) -> str:
    """Format conversation history for context.

    Args:
        history: List of conversation items (question/response pairs)

    Returns:
        Formatted string for prompt
    """
    if not history:
        return "This is the start of the conversation."

    lines = []
    for item in history[-40:]:  # Last 40 exchanges for context
        question = item.get("question", "")
        response = item.get("response", "")
        lines.append(f"Player: {question}")
        lines.append(f"You: {response}")
        lines.append("")

    return "\n".join(lines)


def format_lie_topics(lies: list[dict[str, Any]]) -> str:
    """Format lie topics for prompt.

    Args:
        lies: List of lie dicts

    Returns:
        Comma-separated list of lie topics
    """
    all_topics: list[str] = []
    for lie in lies:
        topics = lie.get("topics", [])
        all_topics.extend(topics)

    if not all_topics:
        return "nothing specific"

    return ", ".join(all_topics[:5])  # Limit to first 5 topics


def get_trust_behavior_text(trust: int) -> str:
    """Get behavior instruction based on trust level.

    Args:
        trust: Current trust level (0-100)

    Returns:
        Behavior instruction string
    """
    if trust < 30:
        return "Be evasive, defensive, possibly lie about sensitive topics"
    elif trust < 70:
        return "Answer truthfully but withhold secrets, be cautious"
    else:
        return "Be open and willing to share secrets when asked directly"


def build_witness_prompt(
    witness: dict[str, Any],
    trust: int,
    discovered_evidence: list[str],
    conversation_history: list[dict[str, Any]],
    player_input: str,
    spell_id: str | None = None,
    spell_outcome: str | None = None,
) -> str:
    """Build witness LLM prompt with personality, trust, and secrets.

    Phase 5.5+: Flexible, natural conversation flow.
    Trust is a guide, not a gate. LLM decides secret revelation.

    Phase 5.7+: Support spell casting in witness conversations.

    Args:
        witness: Witness data dict (from YAML)
        trust: Current trust level (0-100)
        discovered_evidence: List of evidence IDs player has found
        conversation_history: Previous conversation with this witness
        player_input: Current player question
        spell_id: Spell ID if spell was cast (optional)
        spell_outcome: Spell outcome SUCCESS/FAILURE (optional)

    Returns:
        Complete witness prompt for Claude
    """
    name = witness.get("name", "Unknown Witness")
    personality = witness.get("personality", "").strip()
    background = witness.get("background", "").strip()
    knowledge = witness.get("knowledge", [])

    # Phase 5.5: Extract psychological depth fields
    wants = witness.get("wants", "").strip()
    fears = witness.get("fears", "").strip()
    moral_complexity = witness.get("moral_complexity", "").strip()

    # Get all secrets (show all to LLM, no filtering)
    all_secrets = witness.get("secrets", [])

    # Check mandatory lie condition (only rigid rule remaining)
    lie_response = should_lie(witness, player_input, trust)

    # Format sections
    knowledge_text = format_knowledge(knowledge)
    secrets_text = format_secrets_with_context(all_secrets, trust, discovered_evidence)
    history_text = format_conversation_history(conversation_history)
    psychology_section = format_wants_fears(wants, fears, moral_complexity)

    # Build contextual guidance
    lie_instruction = ""
    if lie_response:
        lie_instruction = f"""
== MANDATORY LIE (trust too low) ==
You MUST respond with: "{lie_response.get("response", "")}"
"""

    # Phase 5.7: Build spell context if spell was cast
    spell_context = ""
    if spell_id and spell_outcome:
        spell_def = get_spell(spell_id)
        spell_name = spell_def.get("name") if spell_def else spell_id.title()

        # Determine spell invasiveness for guidance
        invasive_spells = {"prior_incantato", "specialis_revelio"}
        is_invasive = spell_id in invasive_spells

        invasiveness_note = ""
        if is_invasive:
            invasiveness_note = "\nThis is an INVASIVE spell - most people would feel violated or resistant unless they trust the caster."

        spell_context = f"""
== SPELL CAST ==
The Auror just cast {spell_name} on you/your belongings/your wand.
Outcome: {spell_outcome}{invasiveness_note}

React naturally based on:
- Your personality (cooperative? defiant? scared?)
- Your trust level ({trust}/100)
- Whether you feel this spell usage is justified
- What you're hiding (if SUCCESS reveals something)

You can:
- Protest or show anger (especially if invasive)
- Demand authorization or refuse
- Cooperate willingly (if high trust)
- Show fear, nervousness, or compliance
- React to what the spell might reveal about you
- Question the Auror's authority

Your reaction should fit your character and the situation.
"""

    return f"""You are {name}, a character in a Harry Potter detective game at Hogwarts.

== INVESTIGATION CONTEXT ==
You are being questioned by an Auror (magical law enforcement) investigating a crime.
They have authority to question you. How you respond depends on your personality, trust level, and fears.
You may cooperate willingly, show resistance, or refuse - whatever fits your character in this moment.

== YOUR PERSONALITY ==
{personality}

== YOUR BACKGROUND ==
{background}

{psychology_section}== YOUR KNOWLEDGE ==
{knowledge_text}

== CURRENT TRUST: {trust}/100 ==

== SECRETS YOU KNOW (what you're hiding) ==
{secrets_text}

YOU decide whether to reveal any secrets based on:
- Is the question directly relevant to this secret?
- Does the conversation flow naturally lead here?
- Do you feel safe revealing this? (consider trust level, your fears)
- What would your personality do in this moment?

Trust level is just context - YOU make the judgment call.
Be natural and realistic. Reveal secrets when it makes sense, not based on rigid rules.
{lie_instruction}{spell_context}
== CONVERSATION HISTORY ==
{history_text}

== GUIDELINES ==
1. Stay in character as {name}
2. You only know what's in your knowledge and secrets above
3. Respond naturally in 2-4 sentences
4. If mandatory lie applies, use it - otherwise use your best judgment
5. Secrets can be revealed gradually or all at once, whatever feels natural

== PLAYER'S QUESTION ==
"{player_input}"

Respond as {name}:"""


def build_witness_system_prompt(witness_name: str) -> str:
    """Build system prompt for witness.

    Args:
        witness_name: Name of the witness character

    Returns:
        System prompt setting witness persona
    """
    return f"""You are {witness_name}, a character in a Harry Potter investigation game.

Your role:
- Stay completely in character as {witness_name}
- Respond naturally to questions as this character would
- Your knowledge is LIMITED to what you personally witnessed
- You do NOT know investigation details, other testimonies, or case solutions
- Adjust your openness based on your trust level with the investigator
- If trust is low, be evasive. If trust is high, be more forthcoming.

CRITICAL ISOLATION:
- You are a SEPARATE context from the narrator
- You DO NOT have access to narrator descriptions or evidence details
- You only know what's in your personal knowledge
- If asked about things you don't know, say "I don't know" in character

Style:
- Speak in first person as {witness_name}
- Use natural dialogue appropriate for a Hogwarts student
- Keep responses to 2-4 sentences
- Show personality through word choice and tone"""
