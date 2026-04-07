"""Evidence listing and detail endpoints."""

import logging

from fastapi import APIRouter, HTTPException

from src.api.helpers import load_slot_state
from src.api.schemas import EvidenceDetailItem, EvidenceDetailResponse, EvidenceResponse
from src.case_store.loader import get_all_evidence, get_evidence_by_id, load_case

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/evidence", response_model=EvidenceResponse)
async def get_evidence(
    case_id: str = "case_001",
    player_id: str = "default",
    slot: str = "autosave",
) -> EvidenceResponse:
    """Get list of discovered evidence."""
    state = load_slot_state(case_id, player_id, slot)
    if state is None:
        return EvidenceResponse(case_id=case_id, discovered_evidence=[])

    return EvidenceResponse(
        case_id=state.case_id,
        discovered_evidence=state.discovered_evidence,
    )


@router.get("/evidence/details", response_model=EvidenceDetailResponse)
async def get_evidence_details(
    case_id: str = "case_001",
    location_id: str | None = None,
    player_id: str = "default",
    slot: str = "autosave",
) -> EvidenceDetailResponse:
    """Get detailed evidence info for discovered evidence."""
    try:
        case_data = load_case(case_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case not found: {case_id}")

    state = load_slot_state(case_id, player_id, slot)
    discovered_ids = state.discovered_evidence if state else []

    all_evidence = get_all_evidence(case_data, location_id)
    discovered_evidence = [
        EvidenceDetailItem(
            id=evidence["id"],
            name=evidence["name"],
            location_found=evidence["location_found"],
            description=evidence["description"],
            type=evidence["type"],
        )
        for evidence in all_evidence
        if evidence["id"] in discovered_ids
    ]

    return EvidenceDetailResponse(case_id=case_id, evidence=discovered_evidence)


@router.get("/evidence/{evidence_id}")
async def get_single_evidence(
    evidence_id: str,
    case_id: str = "case_001",
    location_id: str | None = None,
    player_id: str = "default",
    slot: str = "autosave",
) -> EvidenceDetailItem:
    """Get single evidence item with full metadata."""
    try:
        case_data = load_case(case_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case not found: {case_id}")

    state = load_slot_state(case_id, player_id, slot)
    discovered_ids = state.discovered_evidence if state else []

    if evidence_id not in discovered_ids:
        raise HTTPException(status_code=404, detail=f"Evidence not discovered: {evidence_id}")

    evidence = get_evidence_by_id(case_data, location_id, evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail=f"Evidence not found: {evidence_id}")

    return EvidenceDetailItem(
        id=evidence["id"],
        name=evidence["name"],
        location_found=evidence["location_found"],
        description=evidence["description"],
        type=evidence["type"],
    )
