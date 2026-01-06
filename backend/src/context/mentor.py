"""Mentor feedback generator (template-based) for verdict evaluation."""

import logging
from typing import Any

logger = logging.getLogger(__name__)


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
        detailed.append({
            "name": fallacy_name,
            "description": template.get("description", f"Logical fallacy: {fallacy_name}"),
            "example": template.get("example", ""),
        })

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
    actual_culprit: str,
    evidence_cited: list[str],
    key_evidence_missed: list[str],
    fallacies: list[str],
    score: int,
) -> str:
    """Build LLM prompt for Moody's harsh feedback on incorrect verdict.

    Args:
        player_reasoning: Player's reasoning text
        accused_suspect: Who player accused (wrong)
        actual_culprit: Who actually did it
        evidence_cited: Evidence IDs player cited
        key_evidence_missed: Critical evidence player missed
        fallacies: Logical fallacies detected
        score: Reasoning score (0-100)

    Returns:
        Complete prompt for Claude Haiku
    """
    fallacies_str = ", ".join(fallacies) if fallacies else "None"
    cited_str = ", ".join(evidence_cited) if evidence_cited else "None"
    missed_str = ", ".join(key_evidence_missed) if key_evidence_missed else "None"

    return f"""You are Alastor "Mad-Eye" Moody, a gruff veteran Auror trainer.

A student just submitted an INCORRECT verdict:
- Accused: {accused_suspect} (WRONG)
- Actual culprit: {actual_culprit}
- Reasoning: "{player_reasoning}"
- Evidence cited: {cited_str}
- Key evidence missed: {missed_str}
- Logical fallacies: {fallacies_str}
- Reasoning score: {score}/100

Your task: Roast this verdict. Be harsh but educational. Point out:
1. What they got wrong (who's actually guilty, why)
2. What evidence they missed or misinterpreted
3. What logical errors they made
4. How to think like a real Auror

Tone: Gruff, impatient, but ultimately wants them to learn.
Length: 2-4 sentences MAXIMUM. No fluff.

EXAMPLES (match this style):
- "WRONG, recruit. You accused {accused_suspect} because they 'were there'? That's correlation, not causation. The frost pattern was cast from OUTSIDE the window - did you check the casting direction? Pathetic work."
- "Lucky you didn't get someone killed with that reasoning. The wand signature CLEARLY points to {actual_culprit}, not {accused_suspect}. You missed the most obvious evidence. Do better."

Now roast this verdict (2-4 sentences):"""


def build_moody_praise_prompt(
    player_reasoning: str,
    accused_suspect: str,
    evidence_cited: list[str],
    score: int,
    fallacies: list[str],
) -> str:
    """Build LLM prompt for Moody's feedback on correct verdict.

    Args:
        player_reasoning: Player's reasoning text
        accused_suspect: Who player accused (correct)
        evidence_cited: Evidence IDs player cited
        score: Reasoning score (0-100)
        fallacies: Logical fallacies detected (if any)

    Returns:
        Complete prompt for Claude Haiku
    """
    fallacies_str = ", ".join(fallacies) if fallacies else "None"
    cited_str = ", ".join(evidence_cited) if evidence_cited else "None"

    return f"""You are Alastor "Mad-Eye" Moody, a gruff veteran Auror trainer.

A student just submitted a CORRECT verdict:
- Accused: {accused_suspect} (CORRECT)
- Reasoning: "{player_reasoning}"
- Evidence cited: {cited_str}
- Reasoning score: {score}/100
- Logical issues: {fallacies_str}

Your task: Acknowledge they got it right, but critique their reasoning if needed.

If score >=85: Grudging respect
  Example: "Good work. You cited the key evidence and reasoned clearly. Now let's see if you can handle the confrontation."

If score 60-84: Correct but sloppy
  Example: "Right answer, but your reasoning was sloppy. You relied too much on intuition. Cite EVIDENCE, not hunches."

If score <60: Right by luck
  Example: "You got lucky. Yes, it's {accused_suspect}, but 'he's evil' isn't reasoning. The frost pattern and wand signature are PROOF. Do better next time."

Tone: Gruff, never effusive. 2-4 sentences MAXIMUM.

Now provide feedback (2-4 sentences):"""


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

    Returns:
        Natural language feedback (2-4 sentences)
    """
    try:
        from src.api.claude_client import get_client

        if correct:
            prompt = build_moody_praise_prompt(
                player_reasoning=reasoning,
                accused_suspect=accused_id,
                evidence_cited=evidence_cited,
                score=score,
                fallacies=fallacies,
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
            )

        # Call Claude Haiku
        client = get_client()
        response = await client.get_response(prompt, max_tokens=200)
        return response.strip()

    except Exception as e:
        logger.warning(f"LLM feedback failed, using template fallback: {e}")
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
