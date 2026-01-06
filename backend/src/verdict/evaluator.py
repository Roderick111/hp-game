"""Verdict evaluation logic for checking player submissions."""

from typing import Any


def check_verdict(
    accused_suspect_id: str,
    solution: dict[str, Any],
) -> bool:
    """Check if accused suspect matches actual culprit.

    Args:
        accused_suspect_id: Suspect ID player accused
        solution: Solution dict from YAML (contains culprit)

    Returns:
        True if correct, False if wrong
    """
    culprit = solution.get("culprit", "")
    return accused_suspect_id.lower() == culprit.lower()


def score_reasoning(
    reasoning: str,
    key_evidence_mentioned: list[str],
    solution: dict[str, Any],
    fallacies_detected: list[str],
) -> int:
    """Score reasoning quality (0-100).

    Scoring criteria:
    - Base score: 40 (harsh baseline)
    - +10 for each key evidence mentioned (max +30)
    - -15 if NO evidence cited when key evidence exists
    - +20 for logical coherence (2-5 sentences)
    - -10 for rambling (>5 sentences)
    - -15 for each fallacy detected (max -45)

    Args:
        reasoning: Player's reasoning text
        key_evidence_mentioned: List of key evidence IDs player cited
        solution: Solution dict (contains key_evidence list)
        fallacies_detected: List of fallacy names detected

    Returns:
        Score 0-100 (clamped)
    """
    score = 40  # Harsh baseline

    # Key evidence bonus (+10 each, max +30)
    solution_key_evidence = solution.get("key_evidence", [])
    key_evidence_count = len(
        [e for e in key_evidence_mentioned if e in solution_key_evidence]
    )
    score += min(key_evidence_count * 10, 30)

    # No evidence penalty (-15) - only if key evidence exists but none cited
    if len(solution_key_evidence) > 0 and len(key_evidence_mentioned) == 0:
        score -= 15

    # Logical coherence bonus/penalty
    sentence_count = _count_sentences(reasoning)
    if 2 <= sentence_count <= 5:
        score += 20
    elif sentence_count > 5:  # Rambling penalty
        score -= 10

    # Fallacy penalty (-15 each, max -45)
    fallacy_penalty = min(len(fallacies_detected) * 15, 45)
    score -= fallacy_penalty

    # Clamp to 0-100
    return max(0, min(100, score))


def _count_sentences(text: str) -> int:
    """Count sentences in text based on terminal punctuation.

    Args:
        text: Text to analyze

    Returns:
        Number of sentences
    """
    if not text or not text.strip():
        return 0

    count = 0
    for char in text:
        if char in ".!?":
            count += 1

    # Handle edge case where text ends without terminal punctuation
    text_stripped = text.strip()
    if text_stripped and text_stripped[-1] not in ".!?":
        count += 1

    return max(count, 1) if text.strip() else 0


def calculate_attempts_hint_level(attempts_remaining: int) -> str:
    """Calculate hint specificity based on attempts remaining.

    Args:
        attempts_remaining: How many attempts left (0-10)

    Returns:
        "harsh" (7-10 left), "specific" (4-6 left), "direct" (1-3 left)
    """
    if attempts_remaining >= 7:
        return "harsh"
    elif attempts_remaining >= 4:
        return "specific"
    else:
        return "direct"
