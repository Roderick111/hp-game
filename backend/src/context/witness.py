"""Witness context builder for Claude LLM.

Builds prompts for witness interrogation with:
- Personality-driven responses
- Trust-based behavior (lies/truth/secrets)
- Strict isolation from narrator context
"""

from typing import Any

from src.utils.trust import get_available_secrets, should_lie


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


def format_secrets_for_prompt(
    available_secrets: list[dict[str, Any]],
    trust: int,
) -> str:
    """Format available secrets for prompt.

    Args:
        available_secrets: Secrets whose triggers are met
        trust: Current trust level

    Returns:
        Formatted string for prompt
    """
    if not available_secrets:
        return "No secrets available to reveal at current trust level."

    lines = []
    for secret in available_secrets:
        secret_id = secret.get("id", "unknown")
        text = secret.get("text", "").strip()
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
    for item in history[-5:]:  # Last 5 exchanges for context
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
) -> str:
    """Build witness LLM prompt with personality, trust, and secrets.

    CRITICAL: This prompt is ISOLATED from narrator context.
    Witness does NOT know investigation details, case solution, or narrator content.

    Args:
        witness: Witness data dict (from YAML)
        trust: Current trust level (0-100)
        discovered_evidence: List of evidence IDs player has found
        conversation_history: Previous conversation with this witness
        player_input: Current player question

    Returns:
        Complete witness prompt for Claude
    """
    name = witness.get("name", "Unknown Witness")
    personality = witness.get("personality", "").strip()
    background = witness.get("background", "").strip()
    knowledge = witness.get("knowledge", [])
    lies = witness.get("lies", [])

    # Get available secrets based on trust + evidence
    available_secrets = get_available_secrets(witness, trust, discovered_evidence)

    # Check if witness should lie
    lie_response = should_lie(witness, player_input, trust)

    # Format sections
    knowledge_text = format_knowledge(knowledge)
    secrets_text = format_secrets_for_prompt(available_secrets, trust)
    history_text = format_conversation_history(conversation_history)
    lie_topics_text = format_lie_topics(lies)
    trust_behavior = get_trust_behavior_text(trust)

    # Build lie instruction if applicable
    lie_instruction = ""
    if lie_response:
        lie_instruction = f"""
== MANDATORY LIE ==
Because trust is low and the question touches a sensitive topic, you MUST respond with:
"{lie_response.get("response", "")}"
Do not deviate from this response.
"""

    return f"""You are {name}, a character in a Harry Potter detective game at Hogwarts.

== YOUR PERSONALITY ==
{personality}

== YOUR BACKGROUND ==
{background}

== YOUR KNOWLEDGE (what you remember from that night) ==
{knowledge_text}

== CURRENT TRUST LEVEL: {trust}/100 ==
Behavior at this trust level: {trust_behavior}

== AVAILABLE SECRETS (reveal ONLY if player asks directly and trust is sufficient) ==
{secrets_text}
{lie_instruction}
== CONVERSATION HISTORY ==
{history_text}

== CRITICAL RULES (DO NOT VIOLATE) ==
1. You are {name} - stay in character at ALL times
2. You DO NOT know:
   - Investigation details beyond your personal knowledge
   - What other witnesses have said
   - The case solution or who committed the crime
   - What the narrator has described
   - Evidence the player hasn't shown you
3. Respond naturally in 2-4 sentences as {name} would speak
4. If asked about things outside your knowledge, say "I don't know" in character
5. If trust is LOW (<30): Be evasive about lie topics: {lie_topics_text}
6. If trust is HIGH (>70) and a secret is available: You MAY reveal it naturally
7. Do NOT reveal secrets unless directly asked and trust threshold is met
8. NEVER break character or acknowledge you are an AI

== PLAYER'S QUESTION ==
"{player_input}"

Respond as {name} (2-4 sentences, in character):"""


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
