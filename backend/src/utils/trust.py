"""Trust mechanics for witness interrogation.

Handles trust adjustment based on question tone and secret trigger evaluation.
"""

import re
from typing import Any

# Keywords that affect trust
AGGRESSIVE_KEYWORDS = [
    "lie",
    "lying",
    "liar",
    "accuse",
    "guilty",
    "did it",
    "admit",
    "confess",
    "know you",
    "hiding",
    "suspect",
    "criminal",
]

EMPATHETIC_KEYWORDS = [
    "understand",
    "help",
    "remember",
    "tell me",
    "please",
    "sorry",
    "difficult",
    "must be hard",
    "appreciate",
    "thank",
    "trust",
    "believe",
]

# Trust adjustment values
AGGRESSIVE_PENALTY = -10
EMPATHETIC_BONUS = 5
NEUTRAL_ADJUSTMENT = 0

# Trust boundaries
MIN_TRUST = 0
MAX_TRUST = 100


def adjust_trust(question: str, personality: str | None = None) -> int:
    """Calculate trust delta based on question tone.

    Args:
        question: Player's question text
        personality: Optional witness personality (for future personality-specific adjustments)

    Returns:
        Trust delta (positive for empathetic, negative for aggressive, 0 for neutral)
    """
    question_lower = question.lower()

    # Check for aggressive keywords
    if any(kw in question_lower for kw in AGGRESSIVE_KEYWORDS):
        return AGGRESSIVE_PENALTY

    # Check for empathetic keywords
    if any(kw in question_lower for kw in EMPATHETIC_KEYWORDS):
        return EMPATHETIC_BONUS

    # Neutral questions
    return NEUTRAL_ADJUSTMENT


def clamp_trust(trust: int) -> int:
    """Clamp trust to valid range [0, 100].

    Args:
        trust: Raw trust value

    Returns:
        Clamped trust value
    """
    return max(MIN_TRUST, min(MAX_TRUST, trust))


def parse_trigger_condition(trigger: str) -> list[dict[str, Any]]:
    """Parse trigger string into evaluable conditions.

    Supports:
    - "trust>N" or "trust<N" (trust threshold)
    - "evidence:X" (requires evidence)
    - "evidence_count>N", "evidence_count>=N", "evidence_count==N", etc. (evidence count)
    - "AND" / "OR" operators

    Args:
        trigger: Trigger string (e.g., "evidence:frost_pattern OR trust>70")

    Returns:
        List of condition dicts with type, operator, value
    """
    conditions: list[dict[str, Any]] = []

    # Split by OR first (lower precedence)
    or_parts = re.split(r"\s+OR\s+", trigger, flags=re.IGNORECASE)

    for or_part in or_parts:
        # Split by AND (higher precedence)
        and_parts = re.split(r"\s+AND\s+", or_part, flags=re.IGNORECASE)
        and_conditions: list[dict[str, Any]] = []

        for part in and_parts:
            part = part.strip()

            # Parse evidence_count condition: evidence_count>N, evidence_count>=N, etc.
            # Must check BEFORE trust to avoid matching "trust" in evidence_count
            count_match = re.match(
                r"evidence_count\s*([<>=!]+)\s*(\d+)", part, re.IGNORECASE
            )
            if count_match:
                and_conditions.append(
                    {
                        "type": "evidence_count",
                        "operator": count_match.group(1),
                        "value": int(count_match.group(2)),
                    }
                )
                continue

            # Parse trust condition: trust>N or trust<N
            trust_match = re.match(r"trust\s*([<>])\s*(\d+)", part, re.IGNORECASE)
            if trust_match:
                and_conditions.append(
                    {
                        "type": "trust",
                        "operator": trust_match.group(1),
                        "value": int(trust_match.group(2)),
                    }
                )
                continue

            # Parse evidence condition: evidence:X
            evidence_match = re.match(r"evidence:(\w+)", part, re.IGNORECASE)
            if evidence_match:
                and_conditions.append(
                    {
                        "type": "evidence",
                        "value": evidence_match.group(1),
                    }
                )
                continue

        if and_conditions:
            conditions.append(
                {
                    "type": "and_group",
                    "conditions": and_conditions,
                }
            )

    return conditions


def evaluate_condition(
    condition: dict[str, Any],
    trust: int,
    discovered_evidence: list[str],
    evidence_count: int | None = None,
) -> bool:
    """Evaluate a single parsed condition.

    Args:
        condition: Parsed condition dict
        trust: Current trust level
        discovered_evidence: List of discovered evidence IDs
        evidence_count: Optional explicit evidence count (defaults to len(discovered_evidence))

    Returns:
        True if condition is met
    """
    cond_type = condition.get("type")

    # Default evidence_count to len of discovered_evidence if not provided
    if evidence_count is None:
        evidence_count = len(discovered_evidence)

    if cond_type == "trust":
        operator = condition.get("operator")
        threshold = condition.get("value", 0)

        if operator == ">":
            return trust > threshold
        elif operator == "<":
            return trust < threshold

    elif cond_type == "evidence":
        evidence_id = condition.get("value", "")
        return evidence_id in discovered_evidence

    elif cond_type == "evidence_count":
        operator = condition.get("operator")
        threshold = condition.get("value", 0)

        if operator == ">":
            return evidence_count > threshold
        elif operator == ">=":
            return evidence_count >= threshold
        elif operator == "==":
            return evidence_count == threshold
        elif operator == "<":
            return evidence_count < threshold
        elif operator == "<=":
            return evidence_count <= threshold
        elif operator == "!=":
            return evidence_count != threshold

    elif cond_type == "and_group":
        # All conditions in AND group must be true
        sub_conditions = condition.get("conditions", [])
        return all(
            evaluate_condition(c, trust, discovered_evidence, evidence_count)
            for c in sub_conditions
        )

    return False


def check_secret_triggers(
    secret: dict[str, Any],
    trust: int,
    discovered_evidence: list[str],
) -> bool:
    """Check if secret trigger conditions are met.

    Args:
        secret: Secret dict with 'trigger' field
        trust: Current trust level (0-100)
        discovered_evidence: List of discovered evidence IDs

    Returns:
        True if trigger conditions are met and secret should be revealed
    """
    trigger = secret.get("trigger", "")
    if not trigger:
        return False

    conditions = parse_trigger_condition(trigger)

    # OR logic: any condition group being true triggers the secret
    return any(evaluate_condition(cond, trust, discovered_evidence) for cond in conditions)


def get_available_secrets(
    witness: dict[str, Any],
    trust: int,
    discovered_evidence: list[str],
) -> list[dict[str, Any]]:
    """Get list of secrets available to reveal based on trust and evidence.

    Args:
        witness: Witness data dict
        trust: Current trust level
        discovered_evidence: List of discovered evidence IDs

    Returns:
        List of secrets whose trigger conditions are met
    """
    secrets = witness.get("secrets", [])
    return [s for s in secrets if check_secret_triggers(s, trust, discovered_evidence)]


def should_lie(
    witness: dict[str, Any],
    question: str,
    trust: int,
) -> dict[str, Any] | None:
    """Check if witness should lie based on trust level and question topic.

    Args:
        witness: Witness data dict
        question: Player's question
        trust: Current trust level

    Returns:
        Lie dict with 'response' if witness should lie, None otherwise
    """
    lies = witness.get("lies", [])
    question_lower = question.lower()

    for lie in lies:
        condition = lie.get("condition", "")
        topics = lie.get("topics", [])

        # Parse trust condition from lie (e.g., "trust<30")
        trust_match = re.match(r"trust\s*([<>])\s*(\d+)", condition, re.IGNORECASE)
        if not trust_match:
            continue

        operator = trust_match.group(1)
        threshold = int(trust_match.group(2))

        # Check if trust condition is met
        trust_met = (operator == "<" and trust < threshold) or (
            operator == ">" and trust > threshold
        )

        if not trust_met:
            continue

        # Check if question matches any lie topic
        if any(topic.lower() in question_lower for topic in topics):
            return lie

    return None


def detect_evidence_presentation(player_input: str) -> str | None:
    """Check if player is presenting evidence to witness.

    Pattern: "show X", "present X", "give X", "reveal X"

    Args:
        player_input: Raw player input text

    Returns:
        Evidence ID if detected, None otherwise
    """
    patterns = [
        r"show\s+(?:the\s+)?(\w+)",
        r"present\s+(?:the\s+)?(\w+)",
        r"give\s+(?:the\s+)?(\w+)",
        r"reveal\s+(?:the\s+)?(\w+)",
    ]

    input_lower = player_input.lower()

    for pattern in patterns:
        match = re.search(pattern, input_lower)
        if match:
            return match.group(1)

    return None
