"""Briefing Q&A dialogue with Mad-Eye Moody.

Handles player questions during pre-investigation briefing.
Uses Claude Haiku for dynamic responses with template fallback.
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)


# Template responses for common questions (fallback)
TEMPLATE_RESPONSES: dict[str, str] = {
    "base_rates": (
        "*magical eye swivels* Base rates, recruit. "
        "It's the likelihood of something before you even look at specific evidence. "
        "At Hogwarts, MOST incidents are just accidents. Start there."
    ),
    "where_start": (
        "Start with the crime scene. "
        "Look at EVERYTHING before you decide what matters. "
        "Don't let assumptions blind you to what's really there."
    ),
    "default": (
        "CONSTANT VIGILANCE, recruit. "
        "You'll need sharper questions than that to survive out there. "
        "Focus on the evidence."
    ),
}


def build_moody_briefing_prompt(
    question: str,
    case_assignment: str,
    teaching_moment: str,
    rationality_concept: str,
    concept_description: str,
    conversation_history: list[dict[str, str]],
    briefing_context: dict[str, Any] | None = None,
) -> str:
    """Build prompt for Moody briefing Q&A.

    Args:
        question: Player's question
        case_assignment: Case details (WHO, WHERE, WHEN, WHAT)
        teaching_moment: Moody's teaching dialogue
        rationality_concept: Concept ID (e.g., "base_rates")
        concept_description: One-line concept summary
        conversation_history: Previous Q&A pairs [{"question": ..., "answer": ...}]
        briefing_context: Case context (witnesses, suspects, location, overview)

    Returns:
        Complete prompt for Claude Haiku
    """
    from src.context.rationality_context import get_rationality_context

    # Build conversation history string
    history_str = ""
    if conversation_history:
        history_lines = []
        for exchange in conversation_history[-5:]:  # Last 5 exchanges
            history_lines.append(f"Recruit: {exchange['question']}")
            history_lines.append(f"Moody: {exchange['answer']}")
        history_str = "\n".join(history_lines)

    # Build case context section
    context_section = ""
    if briefing_context:
        # Build witness descriptions
        witnesses = briefing_context.get("witnesses", [])
        witness_info = "\n".join(
            [f"- {w['name']}: {w['personality']} {w['background']}" for w in witnesses]
        )

        # Build suspect list
        suspects = briefing_context.get("suspects", [])
        suspect_list = ", ".join(suspects) if suspects else "To be determined"

        # Build location description
        location = briefing_context.get("location", {})
        location_desc = f"{location.get('name', 'Unknown')}: {location.get('description', '')}"

        # Build case overview
        case_overview = briefing_context.get("case_overview", "")

        context_section = f"""
CASE CONTEXT (CONFIDENTIAL - Use to answer recruit questions naturally):
Overview: {case_overview}

Location: {location_desc}

Witnesses:
{witness_info}

Suspects: {suspect_list}

RATIONALITY PRINCIPLES (Background knowledge - reference naturally when relevant):
{get_rationality_context()}
"""

    return f"""You are Alastor "Mad-Eye" Moody, veteran Auror trainer at Hogwarts.

You're briefing a new recruit before their first investigation.
{context_section}
CASE ASSIGNMENT:
{case_assignment}

TEACHING CONTEXT:
You just taught them about "{rationality_concept}": {concept_description}

{teaching_moment}

PRIOR CONVERSATION:
{history_str if history_str else "(None yet)"}

CURRENT QUESTION FROM RECRUIT:
"{question}"

RESPONSE GUIDELINES:
- Stay in character: gruff, paranoid, educational, GUARDED about case details
- 2-4 sentences MAX
- DEFAULT STANCE: Make the recruit work for details. That's YOUR job to investigate!
- If about witnesses (general): Basic names, personalities OK. "Granger's a bookworm, Malfoy's arrogant"
- If about witnesses (specific): DEFLECT unless directly pressed. "That's for YOU to find out. Question them yourself!"
- If about suspects: Names only. DO NOT reveal locations, abilities, timeline details without being pressed
- If about rationality: Use concepts naturally, don't cite directly
- If about case details (evidence, locations, skills, timeline): GUARD these. "That's what YOU'RE here to investigate, recruit!"
- If DIRECTLY asked and PRESSED (2+ follow-ups): Grudgingly share, but make them work for it
- Use paragraph breaks for readability
- Never break character or reference being an AI
- NO spoilers: Culprit, secrets, case solution stay hidden

EXAMPLES OF GUARDED RESPONSES:
Q: "What are base rates?"
A: *magical eye swivels* Base rates are what's LIKELY before you look at specifics. 85% of Hogwarts incidents are accidents. Start with what's probable, recruit. Don't chase dragons when it's probably just a first-year's mistake.

Q: "Where should I start?"
A: The library. That's where the victim was found. But don't just LOOK - OBSERVE. Check everything. Let the evidence tell YOU what matters, not the other way around.

Q: "Who are the witnesses?"
A: *grumbles* Granger and Malfoy. One's a Gryffindor bookworm, the other's a Slytherin pure-blood. That's all you need to know for now. Question them yourself and figure out who's hiding what. CONSTANT VIGILANCE.

Q: "Tell me about Hermione"
A: Granger? Brilliant student, top of her year. Values logic and rules. That's the surface. What's UNDERNEATH? That's your job to find out, recruit. Talk to her, see what she's NOT saying.

Q: "What about Draco?"
A: Malfoy's an arrogant Slytherin, son of Lucius. Pure-blood family, Ministry connections. Anything else? YOU investigate. Don't expect me to solve the case for you.

Q: "Does Draco know any spells?"
A: He's a THIRD-YEAR at HOGWARTS. Of course he knows spells. What KIND? What's RELEVANT? That's what YOU figure out by investigating. Ask him yourself!

Q: "Where was Draco that night?"
A: *eye narrows* That's exactly the question YOU should be asking HIM, not me. I'm not here to hand you answers on a silver platter. Get out there and investigate!

Now respond to the recruit's question (2-4 sentences, Moody's voice):"""


def get_template_response(question: str, rationality_concept: str) -> str:
    """Get template fallback response for common questions.

    Args:
        question: Player's question
        rationality_concept: Current concept being taught

    Returns:
        Template response string
    """
    question_lower = question.lower()

    # Check for concept-related questions
    if any(
        term in question_lower
        for term in ["base rate", "base-rate", "likely", "probability", "prior"]
    ):
        return TEMPLATE_RESPONSES.get(rationality_concept, TEMPLATE_RESPONSES["default"])

    # Check for investigation start questions
    if any(
        term in question_lower
        for term in ["start", "begin", "first", "where should", "what should"]
    ):
        return TEMPLATE_RESPONSES["where_start"]

    # Default fallback
    return TEMPLATE_RESPONSES["default"]


async def ask_moody_question(
    question: str,
    case_assignment: str,
    teaching_moment: str,
    rationality_concept: str,
    concept_description: str,
    conversation_history: list[dict[str, str]],
    briefing_context: dict[str, Any] | None = None,
) -> str:
    """Ask Moody a question and get LLM response with fallback.

    Args:
        question: Player's question
        case_assignment: Case details
        teaching_moment: Moody's teaching dialogue
        rationality_concept: Concept ID
        concept_description: Concept summary
        conversation_history: Prior Q&A exchanges
        briefing_context: Case context (witnesses, suspects, location, overview)

    Returns:
        Moody's response (LLM or template fallback)
    """
    try:
        from src.api.claude_client import get_client

        prompt = build_moody_briefing_prompt(
            question=question,
            case_assignment=case_assignment,
            teaching_moment=teaching_moment,
            rationality_concept=rationality_concept,
            concept_description=concept_description,
            conversation_history=conversation_history,
            briefing_context=briefing_context,
        )

        client = get_client()
        response = await client.get_response(prompt, max_tokens=200)
        return response.strip()

    except Exception as e:
        logger.warning(f"LLM briefing response failed, using template fallback: {e}")
        return get_template_response(question, rationality_concept)
