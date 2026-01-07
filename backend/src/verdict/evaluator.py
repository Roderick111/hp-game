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
    """Score reasoning quality (0-100). HARSH grading for educational value.

    Scoring criteria (must EARN points):
    - Base: 20 (just for attempting with 50+ chars)
    - Evidence: +40 max (must cite CRITICAL evidence)
    - Coherence: +20 (2-5 sentences with logical connectors)
    - Penalties: fallacies (-20 each), vague language (-10 each), no causal words (-15)

    Args:
        reasoning: Player's reasoning text
        key_evidence_mentioned: List of key evidence IDs player cited
        solution: Solution dict (contains key_evidence list)
        fallacies_detected: List of fallacy names detected

    Returns:
        Score 0-100 (clamped)
    """
    # Start at 0 - must EARN points
    score = 0

    # Base points for attempting reasoning (very low)
    if len(reasoning.strip()) >= 50:
        score += 20  # Down from 40 - just for trying
    else:
        return 5  # Minimal effort = minimal score

    # Evidence citation (STRICT - must cite CRITICAL evidence)
    solution_key_evidence = solution.get("key_evidence", [])
    critical_cited = [e for e in key_evidence_mentioned if e in solution_key_evidence]

    if len(critical_cited) == 0:
        score -= 30  # HEAVY penalty for no critical evidence
    elif len(critical_cited) == 1:
        score += 10  # Cited SOME critical evidence
    elif len(critical_cited) == 2:
        score += 25  # Cited MOST critical evidence
    else:
        score += 40  # Cited ALL critical evidence

    # Coherence (STRICT - check for actual logical structure)
    sentence_count = _count_sentences(reasoning)

    if sentence_count < 2:
        score -= 10  # Too short
    elif sentence_count > 8:
        score -= 15  # Too rambling
    elif 2 <= sentence_count <= 5:
        # Check for logical connectors (because, therefore, since, etc.)
        logical_words = ["because", "therefore", "since", "thus", "so", "hence"]
        has_logic = any(word in reasoning.lower() for word in logical_words)
        if has_logic:
            score += 20  # Good structure
        else:
            score += 5  # Sentences exist but no logical flow

    # Fallacy penalties (HARSH)
    score -= len(fallacies_detected) * 20  # Up from -15

    # Vague language penalty (NEW)
    vague_words = ["i guess", "maybe", "probably", "i think", "seems like", "kind of"]
    vague_count = sum(1 for word in vague_words if word in reasoning.lower())
    score -= vague_count * 10

    # No explanation penalty (NEW)
    reasoning_lower = reasoning.lower()
    if "because" not in reasoning_lower and "since" not in reasoning_lower:
        score -= 15  # No causal reasoning

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
