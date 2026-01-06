"""Evidence trigger matching utilities.

Matches player input to evidence triggers and extracts evidence tags from responses.
"""
import re
from typing import Any

# Regex pattern for [EVIDENCE: id] tags
EVIDENCE_TAG_PATTERN = re.compile(r"\[EVIDENCE:\s*([^\]]+)\]", re.IGNORECASE)


def matches_trigger(player_input: str, triggers: list[str]) -> bool:
    """Check if player input matches any trigger keyword.

    Uses case-insensitive substring matching.

    Args:
        player_input: Raw player action text
        triggers: List of trigger phrases to match

    Returns:
        True if any trigger is found in player input
    """
    input_lower = player_input.lower()
    return any(trigger.lower() in input_lower for trigger in triggers)


def find_matching_evidence(
    player_input: str,
    hidden_evidence: list[dict[str, Any]],
    discovered_ids: list[str],
) -> dict[str, Any] | None:
    """Find first undiscovered evidence matching player input.

    Args:
        player_input: Raw player action text
        hidden_evidence: List of evidence dicts with 'id', 'triggers', 'description'
        discovered_ids: List of already-discovered evidence IDs

    Returns:
        Matching evidence dict, or None if no match
    """
    for evidence in hidden_evidence:
        evidence_id = evidence.get("id", "")

        # Skip already discovered
        if evidence_id in discovered_ids:
            continue

        triggers = evidence.get("triggers", [])
        if matches_trigger(player_input, triggers):
            return evidence

    return None


def find_not_present_response(
    player_input: str,
    not_present: list[dict[str, Any]],
) -> str | None:
    """Find not_present response for player input (hallucination prevention).

    Args:
        player_input: Raw player action text
        not_present: List of not_present items with 'triggers' and 'response'

    Returns:
        Predefined response if triggers match, None otherwise
    """
    for item in not_present:
        triggers = item.get("triggers", [])
        if matches_trigger(player_input, triggers):
            response: str = item.get("response", "You search but find nothing of note.")
            return response

    return None


def extract_evidence_from_response(response: str) -> list[str]:
    """Extract evidence IDs from LLM response.

    Parses [EVIDENCE: id] tags from response text.

    Args:
        response: LLM response text

    Returns:
        List of evidence IDs found in response
    """
    matches = EVIDENCE_TAG_PATTERN.findall(response)
    # Clean up extracted IDs (strip whitespace)
    return [m.strip() for m in matches]


def check_already_discovered(
    player_input: str,
    hidden_evidence: list[dict[str, Any]],
    discovered_ids: list[str],
) -> bool:
    """Check if player is asking about already-discovered evidence.

    Args:
        player_input: Raw player action text
        hidden_evidence: List of evidence dicts
        discovered_ids: List of already-discovered evidence IDs

    Returns:
        True if player is investigating something already found
    """
    for evidence in hidden_evidence:
        evidence_id = evidence.get("id", "")

        if evidence_id not in discovered_ids:
            continue

        triggers = evidence.get("triggers", [])
        if matches_trigger(player_input, triggers):
            return True

    return False
