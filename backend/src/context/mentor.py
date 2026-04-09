"""Mentor feedback generator (template-based) for verdict evaluation.

Phase 5.5: Enhanced with common_mistakes, fallacies_to_catch, timeline, and victim context.
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)


# ============================================================================
# Phase 5.5: Enhanced Solution Field Formatters
# ============================================================================


def format_common_mistakes(common_mistakes: list[dict[str, str]]) -> str:
    """Format common mistakes for Moody prompt.

    Args:
        common_mistakes: List of {error, reason, why_wrong} dicts

    Returns:
        Formatted string for prompt
    """
    if not common_mistakes:
        return "No common mistakes defined."

    lines = []
    for i, mistake in enumerate(common_mistakes, 1):
        error = mistake.get("error", "Unknown error")
        reason = mistake.get("reason", "")
        why_wrong = mistake.get("why_wrong", "")

        lines.append(f"{i}. Error: {error}")
        if reason:
            lines.append(f"   Why players make this: {reason}")
        if why_wrong:
            lines.append(f"   Why it's wrong: {why_wrong}")

    return "\n".join(lines)


def format_fallacies_to_catch(fallacies: list[dict[str, str]]) -> str:
    """Format fallacies to catch for Moody prompt.

    Args:
        fallacies: List of {fallacy, example} dicts

    Returns:
        Formatted string for prompt
    """
    if not fallacies:
        return "No specific fallacies defined."

    lines = []
    for fallacy_dict in fallacies:
        name = fallacy_dict.get("fallacy", "Unknown")
        example = fallacy_dict.get("example", "")

        if example:
            lines.append(f"- {name}: {example}")
        else:
            lines.append(f"- {name}")

    return "\n".join(lines)


def format_timeline(timeline: list[dict[str, Any]]) -> str:
    """Format timeline for Moody alibi evaluation.

    Args:
        timeline: List of timeline entry dicts

    Returns:
        Formatted string for prompt
    """
    if not timeline:
        return "No timeline available."

    lines = []
    for entry in timeline:
        time = entry.get("time", "?")
        event = entry.get("event", "Unknown event")
        witnesses = entry.get("witnesses", [])

        witness_str = f" (witnesses: {', '.join(witnesses)})" if witnesses else ""
        lines.append(f"- {time}: {event}{witness_str}")

    return "\n".join(lines)


def format_deductions_required(deductions: list[str]) -> str:
    """Format required deductions for Moody prompt.

    Args:
        deductions: List of deduction strings

    Returns:
        Formatted string for prompt
    """
    if not deductions:
        return "No specific deductions required."

    return "\n".join(f"- {d}" for d in deductions)


def format_correct_reasoning(reasoning_list: list[str]) -> str:
    """Format correct reasoning requirements for Moody prompt.

    Args:
        reasoning_list: List of reasoning requirement strings

    Returns:
        Formatted string for prompt
    """
    if not reasoning_list:
        return "No specific reasoning requirements."

    return "\n".join(f"- {r}" for r in reasoning_list)


def build_mentor_feedback(
    correct: bool,
    score: int,
    fallacies: list[str],
    reasoning: str,
    accused_id: str,
    solution: dict[str, Any],
    feedback_templates: dict[str, Any],
    attempts_remaining: int,
) -> dict[str, Any]:
    """Build Moody's mentor feedback (template-based).

    Args:
        correct: Whether verdict was correct
        score: Reasoning quality score (0-100)
        fallacies: List of fallacies detected
        reasoning: Player's reasoning text
        accused_id: Who player accused
        solution: Solution dict from YAML
        feedback_templates: Templates from YAML
        attempts_remaining: How many attempts left

    Returns:
        {
            "analysis": str,  # Summary of reasoning
            "fallacies_detected": [{"name": str, "description": str, "example": str}],
            "score": int,
            "quality": str,  # "excellent", "good", "fair", "poor", "failing"
            "critique": str,  # What player missed
            "praise": str,   # What player did well
            "hint": str | None,  # Adaptive hint if incorrect
        }
    """
    # Determine quality level
    quality = _determine_quality(score)

    # Build analysis (summary of player reasoning)
    reasoning_preview = reasoning[:100] + "..." if len(reasoning) > 100 else reasoning
    analysis = f"You accused {accused_id} because: {reasoning_preview}"

    # Build fallacies with descriptions from templates
    fallacies_detailed = _build_fallacies_detailed(fallacies, feedback_templates)

    # Generate praise
    praise = _generate_praise(score, correct, fallacies)

    # Generate critique
    critique = _generate_critique(correct, accused_id, solution, fallacies)

    # Generate adaptive hint (if incorrect)
    hint = None
    if not correct:
        hint = _generate_adaptive_hint(attempts_remaining, solution)

    return {
        "analysis": analysis,
        "fallacies_detected": fallacies_detailed,
        "score": score,
        "quality": quality,
        "critique": critique,
        "praise": praise,
        "hint": hint,
    }


def _determine_quality(score: int) -> str:
    """Determine quality level from score.

    Args:
        score: Reasoning score 0-100

    Returns:
        Quality level string
    """
    if score >= 90:
        return "excellent"
    elif score >= 75:
        return "good"
    elif score >= 60:
        return "fair"
    elif score >= 40:
        return "poor"
    else:
        return "failing"


def _build_fallacies_detailed(
    fallacies: list[str],
    feedback_templates: dict[str, Any],
) -> list[dict[str, str]]:
    """Build detailed fallacy list with descriptions.

    Args:
        fallacies: List of fallacy names
        feedback_templates: Templates from YAML

    Returns:
        List of fallacy dicts with name, description, example
    """
    fallacies_dict = feedback_templates.get("fallacies", {})
    detailed = []

    for fallacy_name in fallacies:
        template = fallacies_dict.get(fallacy_name, {})
        detailed.append(
            {
                "name": fallacy_name,
                "description": template.get("description", f"Logical fallacy: {fallacy_name}"),
                "example": template.get("example", ""),
            }
        )

    return detailed


def _generate_praise(score: int, correct: bool, fallacies: list[str]) -> str:
    """Generate praise for what player did well (Moody-style conditional).

    Args:
        score: Reasoning score
        correct: Whether verdict was correct
        fallacies: Fallacies detected

    Returns:
        Praise text
    """
    if score >= 90:
        return "Outstanding. This is what I expect from a competent Auror."
    elif score >= 75:
        return "Good work. You cited relevant evidence and reasoned clearly."
    elif score >= 60:
        return "Adequate. You got there, but barely."
    elif correct and len(fallacies) == 0:
        return "Correct, but I've seen better reasoning from first-years."
    elif correct:
        return "Right answer, wrong path. Don't rely on luck."
    else:
        return "Try harder. This is embarrassing."


def _generate_critique(
    correct: bool,
    accused_id: str,
    solution: dict[str, Any],
    fallacies: list[str],
) -> str:
    """Generate critique for what player missed (Moody-style harsh).

    Args:
        correct: Whether verdict was correct
        accused_id: Who player accused
        solution: Solution dict
        fallacies: Fallacies detected

    Returns:
        Critique text
    """
    if correct and len(fallacies) == 0:
        return "Acceptable work. But don't let it go to your head."
    elif correct:
        fallacy_str = ", ".join(fallacies) if fallacies else "some logical gaps"
        return (
            f"Right answer, WRONG reasoning. Your logic was riddled with "
            f"{fallacy_str}. Sloppy work, Auror."
        )
    else:
        actual_culprit = solution.get("culprit", "unknown")
        key_evidence = solution.get("key_evidence", [])
        evidence_str = ", ".join(key_evidence) if key_evidence else "key evidence"
        return (
            f"WRONG. You accused {accused_id} when the evidence clearly points to "
            f"{actual_culprit}. Did you even LOOK at the {evidence_str}? Pathetic."
        )


def _generate_adaptive_hint(attempts_remaining: int, solution: dict[str, Any]) -> str:
    """Generate adaptive hint based on attempts remaining.

    Args:
        attempts_remaining: How many attempts left
        solution: Solution dict

    Returns:
        Hint text (more specific as attempts decrease)
    """
    key_evidence = solution.get("key_evidence", [])
    method = solution.get("method", "unknown method")

    if attempts_remaining >= 7:
        # Harsh - very vague
        return "Think harder. Review all evidence carefully."
    elif attempts_remaining >= 4:
        # Specific - point to evidence
        evidence_hint = ", ".join(key_evidence[:2]) if key_evidence else "key evidence"
        return f"Focus on the key evidence: {evidence_hint}."
    else:
        # Direct - almost give away
        return f"The {method.lower()} points directly to the culprit. Check who had the capability."


def get_wrong_suspect_response(
    accused_id: str,
    feedback_templates: dict[str, Any],
    attempts_remaining: int,
) -> str | None:
    """Get pre-written response for wrong suspect accusation.

    Args:
        accused_id: Who player accused
        feedback_templates: Templates from YAML
        attempts_remaining: Attempts left (for substitution)

    Returns:
        Pre-written response or None if not found
    """
    wrong_suspect_responses = feedback_templates.get("wrong_suspect_responses", {})
    response_template = wrong_suspect_responses.get(accused_id.lower())

    if response_template:
        # Substitute attempts_remaining placeholder
        return response_template.format(attempts_remaining=attempts_remaining)

    return None


def build_moody_roast_prompt(
    player_reasoning: str,
    accused_suspect: str,
    actual_culprit: str,  # Keep param for signature compat but don't use
    evidence_cited: list[str],
    key_evidence_missed: list[str],
    fallacies: list[str],
    score: int,
    briefing_context: dict[str, Any] | None = None,
    enhanced_solution: dict[str, Any] | None = None,
    victim: dict[str, Any] | None = None,
    timeline: list[dict[str, Any]] | None = None,
    attempt_number: int = 1,
    evaluator_result: dict[str, Any] | None = None,
) -> str:
    """Build LLM prompt for Moody's harsh feedback on incorrect verdict.

    Phase 5.5: Added enhanced_solution, victim, and timeline parameters.

    Args:
        player_reasoning: Player's reasoning text
        accused_suspect: Who player accused (wrong)
        actual_culprit: Who actually did it (NOT revealed in prompt)
        evidence_cited: Evidence IDs player cited
        key_evidence_missed: Critical evidence player missed
        fallacies: Logical fallacies detected
        score: Reasoning score (0-100)
        briefing_context: Case context for natural Q&A
        enhanced_solution: Enhanced solution dict (Phase 5.5)
        victim: Victim dict for humanization (Phase 5.5)
        timeline: Timeline entries for alibi checking (Phase 5.5)
        attempt_number: Which attempt this is (1-based)

    Returns:
        Complete prompt for Claude Haiku
    """
    from src.context.rationality_context import get_rationality_context

    cited_str = ", ".join(evidence_cited) if evidence_cited else "None"
    missed_str = ", ".join(key_evidence_missed) if key_evidence_missed else "None"

    # Build case context section
    context_section = ""
    if briefing_context:
        witnesses = briefing_context.get("witnesses", [])
        witness_info = "\n".join([f"- {w['name']}: {w.get('personality', '')}" for w in witnesses])
        suspects = briefing_context.get("suspects", [])
        suspect_list = ", ".join(suspects) if suspects else "To be determined"
        location = briefing_context.get("location", {})
        location_desc = f"{location.get('name', 'Unknown')}: {location.get('description', '')}"
        case_overview = briefing_context.get("case_overview", "")

        context_section = f"""
CASE CONTEXT (for natural reference - DO NOT reveal culprit):
Overview: {case_overview}
Location: {location_desc}
Witnesses:
{witness_info}
Suspects: {suspect_list}

RATIONALITY PRINCIPLES (reference naturally when relevant):
{get_rationality_context()}
"""

    # Phase 5.5: Add enhanced solution context
    enhanced_section = ""
    if enhanced_solution:
        common_mistakes = enhanced_solution.get("common_mistakes", [])
        fallacies_to_catch = enhanced_solution.get("fallacies_to_catch", [])
        deductions = enhanced_solution.get("deductions_required", [])
        correct_reasoning = enhanced_solution.get("correct_reasoning_requires", [])

        enhanced_section = f"""
COMMON MISTAKES (if player made one, call it out specifically):
{format_common_mistakes(common_mistakes)}

FALLACIES TO WATCH FOR:
{format_fallacies_to_catch(fallacies_to_catch)}

REQUIRED DEDUCTIONS (player should have made these):
{format_deductions_required(deductions)}

CORRECT REASONING REQUIRES:
{format_correct_reasoning(correct_reasoning)}
"""

    # Phase 5.5: Add victim context for emotional grounding
    victim_section = ""
    if victim and victim.get("name"):
        victim_section = f"""
VICTIM (reference naturally if player seems disconnected from stakes):
{victim.get("name", "")}: {victim.get("humanization", "")}
"""

    # Phase 5.5: Add timeline for alibi evaluation
    timeline_section = ""
    if timeline:
        timeline_section = f"""
TIMELINE (for evaluating alibi arguments):
{format_timeline(timeline)}
"""

    # Build evaluator context section
    evaluator_section = ""
    if evaluator_result:
        ev_summary = evaluator_result.get("summary", "")
        ev_weaknesses = evaluator_result.get("weaknesses", [])
        ev_fallacies = evaluator_result.get("fallacies", [])
        weaknesses_str = "\n".join(f"- {w}" for w in ev_weaknesses) if ev_weaknesses else "None"
        eval_fallacies_str = "\n".join(f"- {f}" for f in ev_fallacies) if ev_fallacies else "None"
        evaluator_section = f"""
EVALUATOR ASSESSMENT (use this to inform your feedback):
Summary: {ev_summary}
Weaknesses found:
{weaknesses_str}
Fallacies detected:
{eval_fallacies_str}
"""

    return f"""You are Alastor "Mad-Eye" Moody, a gruff veteran Auror trainer.
{context_section}{enhanced_section}{victim_section}{timeline_section}{evaluator_section}
A student submitted an INCORRECT verdict (attempt #{attempt_number}):
- Accused: {accused_suspect} (WRONG - but don't reveal who IS guilty)
- Reasoning: "{player_reasoning}"
- Evidence cited: {cited_str}
- Key evidence missed: {missed_str}
- Reasoning score: {score}/100

Your task: ROAST this verdict hard, then nudge them toward the truth without giving away the answer.

REQUIREMENTS (weave together naturally, no separate sections):
1. Mock their flawed reasoning — quote their bad logic back at them
2. If they missed key evidence, mention AT MOST 1-2 pieces they should look at — describe them naturally (e.g. "the shimmer on his skin" not "dual_shimmer"). NEVER list all missed evidence.
3. ONE subtle hint toward the correct path (without naming the culprit)
4. ONE rationality principle woven in naturally
5. If attempt >= 3, show growing exasperation — they keep making the same mistakes

RULES:
- 3-4 sentences MAXIMUM. Punchy, direct, savage.
- NEVER list evidence as tags or IDs. Always refer to evidence naturally in prose (e.g. "the torn letter" not "torn_letter").
- NEVER include examples, parenthetical notes, meta-commentary, or instructions.
- Use paragraph breaks (double newlines) for readability.
- Stay fully in character as Moody. Output ONLY Moody's words."""


def build_moody_praise_prompt(
    player_reasoning: str,
    accused_suspect: str,
    evidence_cited: list[str],
    score: int,
    fallacies: list[str],
    briefing_context: dict[str, Any] | None = None,
    enhanced_solution: dict[str, Any] | None = None,
    victim: dict[str, Any] | None = None,
    attempt_number: int = 1,
    evaluator_result: dict[str, Any] | None = None,
) -> str:
    """Build LLM prompt for Moody's feedback on correct verdict.

    Phase 5.5: Added enhanced_solution and victim parameters.

    Args:
        player_reasoning: Player's reasoning text
        accused_suspect: Who player accused (correct)
        evidence_cited: Evidence IDs player cited
        score: Reasoning score (0-100)
        fallacies: Logical fallacies detected (if any)
        briefing_context: Case context for natural Q&A
        enhanced_solution: Enhanced solution dict (Phase 5.5)
        victim: Victim dict for humanization (Phase 5.5)

    Returns:
        Complete prompt for Claude Haiku
    """
    from src.context.rationality_context import get_rationality_context

    cited_str = ", ".join(evidence_cited) if evidence_cited else "None"

    # Build case context section
    context_section = ""
    if briefing_context:
        witnesses = briefing_context.get("witnesses", [])
        witness_info = "\n".join([f"- {w['name']}: {w.get('personality', '')}" for w in witnesses])
        suspects = briefing_context.get("suspects", [])
        suspect_list = ", ".join(suspects) if suspects else "To be determined"
        location = briefing_context.get("location", {})
        location_desc = f"{location.get('name', 'Unknown')}: {location.get('description', '')}"
        case_overview = briefing_context.get("case_overview", "")

        context_section = f"""
CASE CONTEXT (for natural reference):
Overview: {case_overview}
Location: {location_desc}
Witnesses:
{witness_info}
Suspects: {suspect_list}

RATIONALITY PRINCIPLES (reference naturally when relevant):
{get_rationality_context()}
"""

    # Phase 5.5: Add enhanced solution context for quality evaluation
    enhanced_section = ""
    if enhanced_solution:
        deductions = enhanced_solution.get("deductions_required", [])
        correct_reasoning = enhanced_solution.get("correct_reasoning_requires", [])

        enhanced_section = f"""
DEDUCTIONS PLAYER SHOULD HAVE MADE (evaluate if they demonstrated these):
{format_deductions_required(deductions)}

CORRECT REASONING REQUIRES:
{format_correct_reasoning(correct_reasoning)}
"""

    # Phase 5.5: Add victim context for closure acknowledgment
    victim_section = ""
    if victim and victim.get("name"):
        victim_section = f"""
VICTIM (acknowledge justice if appropriate):
{victim.get("name", "")}: {victim.get("humanization", "")}
"""

    # Build evaluator context section
    evaluator_section = ""
    if evaluator_result:
        ev_summary = evaluator_result.get("summary", "")
        ev_strengths = evaluator_result.get("strengths", [])
        ev_weaknesses = evaluator_result.get("weaknesses", [])
        ev_fallacies = evaluator_result.get("fallacies", [])
        strengths_str = "\n".join(f"- {s}" for s in ev_strengths) if ev_strengths else "None"
        weaknesses_str = "\n".join(f"- {w}" for w in ev_weaknesses) if ev_weaknesses else "None"
        eval_fallacies_str = "\n".join(f"- {f}" for f in ev_fallacies) if ev_fallacies else "None"
        evaluator_section = f"""
EVALUATOR ASSESSMENT (use this to inform your feedback — trust the score):
Summary: {ev_summary}
Strengths found:
{strengths_str}
Weaknesses found:
{weaknesses_str}
Fallacies detected:
{eval_fallacies_str}
"""

    return f"""You are Alastor "Mad-Eye" Moody, a gruff veteran Auror trainer.
{context_section}{enhanced_section}{victim_section}{evaluator_section}
A student just submitted a CORRECT verdict (attempt #{attempt_number}):
- Accused: {accused_suspect} (CORRECT)
- Reasoning: "{player_reasoning}"
- Evidence cited: {cited_str}
- Reasoning score: {score}/100

Your task: Acknowledge they got it right, then calibrate your tone to the score.

TONE TIERS (follow the score STRICTLY):
- Score >=85: Grudging respect. Briefly acknowledge solid detective work, but stay gruff. Never gush. "Not bad" is high praise from Moody.
- Score 70-84: Gruff acknowledgment with mild criticism. They did decent work but missed some things. Point out what they could improve. A nod, not praise.
- Score 50-69: Dismissive. They stumbled into the right answer with weak reasoning. Mock the sloppy parts. Dare them to try again and prove it wasn't a fluke.
- Score <50: Savage. They got LUCKY and you know it. Tear apart every weak argument. Taunt them to try again with actual evidence-backed reasoning.
- If attempt >= 3: Show growing impatience that they keep submitting weak reasoning.

RULES:
- 3-4 sentences MAXIMUM. Punchy, direct.
- Weave in ONE rationality principle naturally — don't name-drop it like a textbook.
- If the evaluator found specific weaknesses or fallacies, address those — don't invent different ones.
- If score < 85 and they missed key evidence, mention AT MOST 1-2 pieces naturally (e.g. "the frost pattern" not "frost_pattern"). NEVER dump a list of evidence IDs.
- For scores < 70, end with a challenge to retry — make it about pride, not instructions.
- NEVER include examples, parenthetical notes, meta-commentary, or instructions to the player.
- NEVER start with "Good work" or praise if score < 85.
- Use paragraph breaks (double newlines) for readability.
- Stay fully in character as Moody. Output ONLY Moody's words."""


async def build_moody_feedback_llm(
    correct: bool,
    score: int,
    fallacies: list[str],
    reasoning: str,
    accused_id: str,
    solution: dict[str, Any],
    attempts_remaining: int,
    evidence_cited: list[str],
    feedback_templates: dict[str, Any],
    case_id: str = "case_001",
    api_key: str | None = None,
    model: str | None = None,
    evaluator_result: dict[str, Any] | None = None,
) -> str:
    """Generate Moody's feedback via Claude Haiku with template fallback.

    Args:
        correct: Whether verdict was correct
        score: Reasoning quality score (0-100)
        fallacies: List of fallacy IDs detected
        reasoning: Player's reasoning text
        accused_id: Who player accused
        solution: Solution dict from YAML (culprit, critical_evidence, etc.)
        attempts_remaining: Attempts left
        evidence_cited: Evidence IDs player selected
        feedback_templates: Templates for fallback
        case_id: Case identifier for loading context (Phase 3.8)

    Returns:
        Natural language feedback (2-4 sentences)
    """
    try:
        from src.api.llm_client import get_client
        from src.case_store.loader import load_case

        # Load case context (Phase 3.8)
        try:
            case_data = load_case(case_id)
            case_section = case_data.get("case", case_data)
            briefing_context = case_section.get("briefing_context", {})
        except Exception:
            briefing_context = {}

        attempt_number = 10 - attempts_remaining + 1

        if correct:
            prompt = build_moody_praise_prompt(
                player_reasoning=reasoning,
                accused_suspect=accused_id,
                evidence_cited=evidence_cited,
                score=score,
                fallacies=fallacies,
                briefing_context=briefing_context,
                attempt_number=attempt_number,
                evaluator_result=evaluator_result,
            )
        else:
            # Extract key evidence from solution
            critical_evidence = solution.get("critical_evidence", [])
            # Also check key_evidence for backward compatibility
            if not critical_evidence:
                critical_evidence = solution.get("key_evidence", [])
            cited_set = set(evidence_cited)
            key_missed = [e for e in critical_evidence if e not in cited_set]
            actual_culprit = solution.get("culprit", "unknown")

            prompt = build_moody_roast_prompt(
                player_reasoning=reasoning,
                accused_suspect=accused_id,
                actual_culprit=actual_culprit,
                evidence_cited=evidence_cited,
                key_evidence_missed=key_missed,
                fallacies=fallacies,
                score=score,
                briefing_context=briefing_context,
                attempt_number=attempt_number,
                evaluator_result=evaluator_result,
            )

        client = get_client()
        response = await client.get_response(
            prompt,
            max_tokens=200,
            api_key=api_key,
            model=model,
        )
        return response.strip()

    except Exception as e:
        logger.error(f"LLM feedback failed, using template fallback: {e}")
        logger.error(f"Exception type: {type(e).__name__}")
        import traceback

        logger.error(f"Full traceback:\n{traceback.format_exc()}")
        # Fallback to existing template logic
        return _build_template_feedback(
            correct=correct,
            score=score,
            fallacies=fallacies,
            reasoning=reasoning,
            accused_id=accused_id,
            solution=solution,
            attempts_remaining=attempts_remaining,
        )


def _build_template_feedback(
    correct: bool,
    score: int,
    fallacies: list[str],
    reasoning: str,
    accused_id: str,
    solution: dict[str, Any],
    attempts_remaining: int,
) -> str:
    """Template-based feedback fallback (existing logic).

    Args:
        correct: Whether verdict was correct
        score: Reasoning score (0-100)
        fallacies: Fallacy IDs
        reasoning: Player reasoning
        accused_id: Who was accused
        solution: Solution dict
        attempts_remaining: Attempts left

    Returns:
        Fallback feedback string
    """
    quality = _determine_quality(score)

    if not correct:
        culprit = solution.get("culprit", "unknown")
        reasoning_preview = reasoning[:100] + "..." if len(reasoning) > 100 else reasoning
        return (
            f"Incorrect, recruit. The actual culprit was {culprit}. "
            f"You accused {accused_id} with reasoning: '{reasoning_preview}'. "
            f"Quality: {quality}. Attempts remaining: {attempts_remaining}."
        )
    else:
        return (
            f"Correct. You identified {accused_id} as guilty. "
            f"Reasoning quality: {quality}. Good work."
        )
