"""LLM-based verdict reasoning evaluator.

Replaces rule-based scoring with nuanced LLM assessment.
Falls back to rule-based scoring on failure.
"""

import json
import logging
import re
from typing import Any

logger = logging.getLogger(__name__)


def build_evaluator_prompt(
    correct: bool,
    reasoning: str,
    accused_id: str,
    evidence_cited: list[str],
    discovered_evidence: list[str],
    solution: dict[str, Any],
    case_context: dict[str, Any] | None = None,
) -> str:
    """Build prompt for the LLM reasoning evaluator.

    Args:
        correct: Whether the accused is actually the culprit
        reasoning: Player's written reasoning
        accused_id: Who the player accused
        evidence_cited: Evidence IDs the player selected
        discovered_evidence: All evidence the player has discovered
        solution: Full solution dict from YAML
        case_context: Optional briefing context for case background
    """
    culprit = solution.get("culprit", "unknown")
    method = solution.get("method", "")
    motive = solution.get("motive", "")
    key_evidence = solution.get("key_evidence", [])
    deductions = solution.get("deductions_required", [])
    correct_reasoning = solution.get("correct_reasoning_requires", [])
    common_mistakes = solution.get("common_mistakes", [])
    fallacies_to_catch = solution.get("fallacies_to_catch", [])

    cited_str = ", ".join(evidence_cited) if evidence_cited else "None"
    discovered_str = ", ".join(discovered_evidence) if discovered_evidence else "None"
    key_ev_str = ", ".join(key_evidence)
    deductions_str = "\n".join(f"- {d}" for d in deductions) if deductions else "None"
    reasoning_str = "\n".join(f"- {r}" for r in correct_reasoning) if correct_reasoning else "None"

    mistakes_str = ""
    for m in common_mistakes:
        mistakes_str += f"\n- {m.get('error', '')}: {m.get('why_wrong', '')}"

    fallacies_str = ""
    for f in fallacies_to_catch:
        fallacies_str += f"\n- {f.get('fallacy', '')}: {f.get('example', '')}"

    context_str = ""
    if case_context:
        context_str = f"\nCase overview: {case_context.get('case_overview', '')}"

    return f"""You are an expert evaluator assessing a detective student's verdict reasoning.
{context_str}
THE TRUTH (use for evaluation, NOT for the student):
- Actual culprit: {culprit}
- Method: {method}
- Motive: {motive}
- Key evidence: {key_ev_str}

Required deductions for a perfect score:
{deductions_str}

Correct reasoning requires:
{reasoning_str}

Common mistakes to penalize:
{mistakes_str}

Known fallacies to check for:
{fallacies_str}

STUDENT'S SUBMISSION:
- Accused: {accused_id} ({"CORRECT" if correct else "INCORRECT"})
- Reasoning: "{reasoning}"
- Evidence cited (selected from UI): {cited_str}
- All evidence discovered: {discovered_str}

EVALUATE the reasoning quality on these criteria:
1. **Correctness** (did they name the right culprit?)
2. **Causal chain** (did they explain HOW and WHY, not just WHO?)
3. **Evidence usage** (did they reference specific evidence in their reasoning text, even if not all checked in UI?)
4. **Deductive logic** (did they connect evidence to conclusions logically?)
5. **Completeness** (did they address the key deductions?)
6. **Fallacies** (did they commit any logical fallacies?)

SCORING GUIDE:
- 90-100: Correct culprit + explained mechanism + cited critical evidence + strong causal chain
- 75-89: Correct culprit + decent reasoning + some evidence gaps or minor logical issues
- 60-74: Correct culprit but weak reasoning, OR incorrect but with impressive deductive work
- 40-59: Significant reasoning flaws, missing key evidence connections
- 0-39: Lazy reasoning, no evidence, guessing

IMPORTANT: A correct answer with lazy reasoning ("he seems suspicious") should score 30-45. A correct answer with decent but incomplete reasoning should score 65-80. Only reward actual detective work.

CRITICAL output format: Respond with ONLY valid JSON, no markdown:
{{"score": <0-100>, "quality": "<excellent|good|fair|poor|failing>", "summary": "<2-3 sentences explaining the evaluation for the mentor to use>", "strengths": ["<strength 1>", "<strength 2>"], "weaknesses": ["<weakness 1>", "<weakness 2>"], "fallacies": ["<fallacy if any>"]}}"""


async def evaluate_reasoning_llm(
    correct: bool,
    reasoning: str,
    accused_id: str,
    evidence_cited: list[str],
    discovered_evidence: list[str],
    solution: dict[str, Any],
    case_context: dict[str, Any] | None = None,
    api_key: str | None = None,
    model: str | None = None,
) -> dict[str, Any]:
    """Evaluate reasoning via LLM, with rule-based fallback.

    Returns:
        Dict with keys: score, quality, summary, strengths, weaknesses, fallacies
    """
    try:
        from src.api.llm_client import get_client

        prompt = build_evaluator_prompt(
            correct=correct,
            reasoning=reasoning,
            accused_id=accused_id,
            evidence_cited=evidence_cited,
            discovered_evidence=discovered_evidence,
            solution=solution,
            case_context=case_context,
        )

        client = get_client()
        response = await client.get_response(
            prompt,
            max_tokens=400,
            temperature=0.3,
            api_key=api_key,
            model=model,
            timeout=15,
        )

        result = _parse_evaluator_response(response)
        logger.info(f"LLM evaluator: score={result['score']}, quality={result['quality']}")
        return result

    except Exception as e:
        logger.error(f"LLM evaluator failed, using rule-based fallback: {e}")
        return _rule_based_fallback(
            correct=correct,
            reasoning=reasoning,
            evidence_cited=evidence_cited,
            solution=solution,
        )


def _parse_evaluator_response(response: str) -> dict[str, Any]:
    """Parse and validate the LLM evaluator JSON response."""
    # Extract first {...} block — handles fences, preamble, trailing text
    match = re.search(r"\{[^{}]*\}", response, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON object found in response: {response[:200]}")

    data = json.loads(match.group())

    # Validate and clamp
    score = max(0, min(100, int(data.get("score", 50))))
    quality = data.get("quality", _quality_from_score(score))
    if quality not in ("excellent", "good", "fair", "poor", "failing"):
        quality = _quality_from_score(score)

    return {
        "score": score,
        "quality": quality,
        "summary": str(data.get("summary", "")),
        "strengths": list(data.get("strengths", [])),
        "weaknesses": list(data.get("weaknesses", [])),
        "fallacies": list(data.get("fallacies", [])),
    }


def _quality_from_score(score: int) -> str:
    """Derive quality label from score."""
    if score >= 90:
        return "excellent"
    elif score >= 75:
        return "good"
    elif score >= 60:
        return "fair"
    elif score >= 40:
        return "poor"
    return "failing"


def _rule_based_fallback(
    correct: bool,
    reasoning: str,
    evidence_cited: list[str],
    solution: dict[str, Any],
) -> dict[str, Any]:
    """Fallback to rule-based scoring when LLM fails."""
    from src.verdict.evaluator import score_reasoning
    from src.verdict.fallacies import detect_fallacies

    case_data_stub: dict[str, Any] = {"solution": solution}
    fallacies = detect_fallacies(
        reasoning,
        "",
        evidence_cited,
        case_data_stub,
    )
    score = score_reasoning(reasoning, evidence_cited, solution, fallacies)
    quality = _quality_from_score(score)

    return {
        "score": score,
        "quality": quality,
        "summary": f"Rule-based evaluation: score {score}/100.",
        "strengths": [],
        "weaknesses": [],
        "fallacies": fallacies,
    }
