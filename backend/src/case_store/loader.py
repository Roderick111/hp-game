"""YAML case file loader.

Loads case definitions from YAML files in the case_store directory.
"""

from pathlib import Path
from typing import Any

import yaml

# Case store directory (same directory as this file)
CASE_STORE_DIR = Path(__file__).parent


def load_case(case_id: str) -> dict[str, Any]:
    """Load a case definition from YAML.

    Args:
        case_id: Case identifier (e.g., "case_001")

    Returns:
        Case dictionary with locations, evidence, triggers

    Raises:
        FileNotFoundError: If case file doesn't exist
        yaml.YAMLError: If YAML is malformed
    """
    case_path = CASE_STORE_DIR / f"{case_id}.yaml"

    if not case_path.exists():
        raise FileNotFoundError(f"Case file not found: {case_path}")

    with open(case_path, encoding="utf-8") as f:
        data: dict[str, Any] = yaml.safe_load(f)

    return data


def get_location(case_data: dict[str, Any], location_id: str) -> dict[str, Any]:
    """Get a specific location from case data.

    Args:
        case_data: Loaded case dictionary
        location_id: Location identifier (e.g., "library")

    Returns:
        Location dictionary with description, evidence, not_present, witnesses_present

    Raises:
        KeyError: If location doesn't exist
    """
    case: dict[str, Any] = case_data.get("case", case_data)
    locations: dict[str, dict[str, Any]] = case.get("locations", {})

    if location_id not in locations:
        raise KeyError(f"Location not found: {location_id}")

    location = locations[location_id]

    # Ensure witnesses_present field exists (backward compatibility)
    if "witnesses_present" not in location:
        location["witnesses_present"] = []

    return location


def list_cases() -> list[str]:
    """List all available case IDs.

    Returns:
        List of case IDs (without .yaml extension)
    """
    return [p.stem for p in CASE_STORE_DIR.glob("*.yaml")]


def load_witnesses(case_data: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """Load witnesses from case data as a dict keyed by witness ID.

    Args:
        case_data: Loaded case dictionary

    Returns:
        Dictionary of witness_id -> witness data
    """
    case: dict[str, Any] = case_data.get("case", case_data)
    witnesses_list: list[dict[str, Any]] = case.get("witnesses", [])

    return {w["id"]: w for w in witnesses_list if "id" in w}


def get_witness(case_data: dict[str, Any], witness_id: str) -> dict[str, Any]:
    """Get a specific witness from case data.

    Args:
        case_data: Loaded case dictionary
        witness_id: Witness identifier (e.g., "hermione", "draco")

    Returns:
        Witness dictionary with personality, knowledge, secrets, lies

    Raises:
        KeyError: If witness doesn't exist
    """
    witnesses = load_witnesses(case_data)

    if witness_id not in witnesses:
        raise KeyError(f"Witness not found: {witness_id}")

    return witnesses[witness_id]


def list_witnesses(case_data: dict[str, Any]) -> list[str]:
    """List all witness IDs in a case.

    Args:
        case_data: Loaded case dictionary

    Returns:
        List of witness IDs
    """
    witnesses = load_witnesses(case_data)
    return list(witnesses.keys())


def get_evidence_by_id(
    case_data: dict[str, Any],
    location_id: str,
    evidence_id: str,
) -> dict[str, Any] | None:
    """Get evidence item by ID with full metadata.

    Args:
        case_data: Loaded case dictionary
        location_id: Location identifier
        evidence_id: Evidence identifier

    Returns:
        Evidence dict with name, location_found, description, etc. or None if not found
    """
    location = get_location(case_data, location_id)
    hidden_evidence = location.get("hidden_evidence", [])

    for evidence in hidden_evidence:
        if evidence.get("id") == evidence_id:
            # Ensure all metadata fields exist (backward compatibility)
            return {
                "id": evidence.get("id", ""),
                "name": evidence.get("name", evidence.get("id", "Unknown")),
                "location_found": evidence.get("location_found", location_id),
                "description": evidence.get("description", "").strip(),
                "type": evidence.get("type", "unknown"),
                "triggers": evidence.get("triggers", []),
                "tag": evidence.get("tag", ""),
            }

    return None


def get_all_evidence(
    case_data: dict[str, Any],
    location_id: str,
) -> list[dict[str, Any]]:
    """Get all evidence items from a location with full metadata.

    Args:
        case_data: Loaded case dictionary
        location_id: Location identifier

    Returns:
        List of evidence dicts with name, location_found, description
    """
    location = get_location(case_data, location_id)
    hidden_evidence = location.get("hidden_evidence", [])

    result = []
    for evidence in hidden_evidence:
        result.append(
            {
                "id": evidence.get("id", ""),
                "name": evidence.get("name", evidence.get("id", "Unknown")),
                "location_found": evidence.get("location_found", location_id),
                "description": evidence.get("description", "").strip(),
                "type": evidence.get("type", "unknown"),
                "triggers": evidence.get("triggers", []),
                "tag": evidence.get("tag", ""),
            }
        )

    return result


def load_solution(case_data: dict[str, Any]) -> dict[str, Any]:
    """Load solution from case data.

    Args:
        case_data: Loaded case dictionary

    Returns:
        Solution dict with culprit, method, motive, key_evidence, deductions_required
    """
    case: dict[str, Any] = case_data.get("case", case_data)
    return case.get("solution", {})


def load_wrong_suspects(case_data: dict[str, Any]) -> list[dict[str, Any]]:
    """Load wrong suspects list from case data.

    Args:
        case_data: Loaded case dictionary

    Returns:
        List of wrong suspect dicts with id, why_innocent, common_mistakes, exoneration_evidence
    """
    case: dict[str, Any] = case_data.get("case", case_data)
    return case.get("wrong_suspects", [])


def load_confrontation(
    case_data: dict[str, Any],
    accused_id: str,
    correct: bool,
) -> dict[str, Any] | None:
    """Load confrontation dialogue.

    Args:
        case_data: Full case data
        accused_id: Who player accused
        correct: Whether verdict was correct

    Returns:
        {
            "dialogue": [{"speaker": str, "text": str, "tone": str}],
            "aftermath": str,
        }
        or None if no confrontation available
    """
    case: dict[str, Any] = case_data.get("case", case_data)
    post_verdict = case.get("post_verdict", {})

    if correct:
        correct_data = post_verdict.get("correct", {})
        dialogue = correct_data.get("confrontation", [])
        aftermath = correct_data.get("aftermath", "")
        if dialogue or aftermath:
            return {
                "dialogue": dialogue,
                "aftermath": aftermath,
            }
        return None
    else:
        # Check if we show confrontation anyway for wrong verdict
        incorrect_list = post_verdict.get("incorrect", [])
        for item in incorrect_list:
            if item.get("suspect_accused", "").lower() == accused_id.lower():
                if item.get("confrontation_anyway", False):
                    # Show real culprit confrontation (educational)
                    correct_data = post_verdict.get("correct", {})
                    return {
                        "dialogue": correct_data.get("confrontation", []),
                        "aftermath": correct_data.get("aftermath", ""),
                    }
        return None


def load_mentor_templates(case_data: dict[str, Any]) -> dict[str, Any]:
    """Load mentor feedback templates from case data.

    Args:
        case_data: Loaded case dictionary

    Returns:
        Templates dict with fallacies, reasoning_quality, wrong_suspect_responses
    """
    case: dict[str, Any] = case_data.get("case", case_data)
    return case.get("mentor_feedback_templates", {})


def load_wrong_verdict_info(
    case_data: dict[str, Any],
    accused_id: str,
) -> dict[str, Any] | None:
    """Load info for wrong verdict accusation.

    Args:
        case_data: Loaded case dictionary
        accused_id: Who player (wrongly) accused

    Returns:
        Dict with reveal, teaching_moment, confrontation_anyway, or None if not found
    """
    case: dict[str, Any] = case_data.get("case", case_data)
    post_verdict = case.get("post_verdict", {})
    incorrect_list = post_verdict.get("incorrect", [])

    for item in incorrect_list:
        if item.get("suspect_accused", "").lower() == accused_id.lower():
            return {
                "reveal": item.get("reveal", ""),
                "teaching_moment": item.get("teaching_moment", ""),
                "confrontation_anyway": item.get("confrontation_anyway", False),
            }

    return None
