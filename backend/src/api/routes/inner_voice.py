"""Inner Voice (Tom's Ghost) endpoints: triggers, auto-comments, direct chat."""

import logging
import random

from fastapi import APIRouter, HTTPException, Request

from src.api.helpers import (
    build_case_context,
    get_witness_history_summary,
    load_case_or_404,
    load_or_create_state,
    save_slot_state,
)
from src.api.rate_limit import LLM_RATE, limiter
from src.api.schemas import (
    InnerVoiceCheckRequest,
    InnerVoiceTriggerResponse,
    TomAutoCommentRequest,
    TomChatRequest,
    TomResponseModel,
)
from src.case_store.loader import get_all_evidence, get_location

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_evidence_details(
    case_data: dict,
    discovered_ids: list[str],
) -> list[dict]:
    """Get full details for discovered evidence across all locations."""
    all_evidence = get_all_evidence(case_data, None)
    return [e for e in all_evidence if e["id"] in discovered_ids]


def _get_location_description(case_data: dict, current_location: str) -> str:
    """Get current location description, with fallback."""
    try:
        location = get_location(case_data, current_location)
        return location.get("description", "")
    except KeyError:
        return "Unknown location"


async def _generate_tom_with_fallback(
    case_data: dict,
    state,
    inner_voice_state,
    user_message: str | None = None,
) -> tuple[str, str]:
    """Generate Tom's response via LLM with template fallback."""
    from src.context.tom_llm import generate_tom_response, get_tom_fallback_response

    case_context = build_case_context(case_data)
    evidence_discovered = _get_evidence_details(case_data, state.discovered_evidence)
    location_desc = _get_location_description(case_data, state.current_location)
    witness_history = get_witness_history_summary(state)

    try:
        return await generate_tom_response(
            case_context=case_context,
            evidence_discovered=evidence_discovered,
            trust_level=inner_voice_state.trust_level,
            conversation_history=inner_voice_state.conversation_history,
            mode=None,
            user_message=user_message,
            location_description=location_desc,
            witness_history=witness_history,
        )
    except Exception as e:
        logger.warning(f"Tom LLM failed, using fallback: {e}")
        mode_used = "helpful" if random.random() < 0.5 else "misleading"
        response_text = get_tom_fallback_response(mode_used, len(state.discovered_evidence))
        return response_text, mode_used


@router.post(
    "/case/{case_id}/inner-voice/check",
    response_model=InnerVoiceTriggerResponse,
    responses={404: {"description": "No eligible triggers available"}},
)
@limiter.limit(LLM_RATE)
async def check_inner_voice_trigger(
    request: Request,
    case_id: str,
    body: InnerVoiceCheckRequest,
    player_id: str = "default",
    slot: str = "autosave",
) -> InnerVoiceTriggerResponse:
    """Check if Tom should speak based on evidence count."""
    from src.context.inner_voice import load_tom_triggers, select_tom_trigger

    case_data = load_case_or_404(case_id)
    state = load_or_create_state(case_id, player_id, case_data, slot=slot)
    inner_voice_state = state.get_inner_voice_state()

    triggers_by_tier = load_tom_triggers(case_id)
    if not triggers_by_tier:
        raise HTTPException(status_code=404, detail="No inner voice triggers configured")

    trigger = select_tom_trigger(
        triggers_by_tier,
        body.evidence_count,
        inner_voice_state.fired_triggers,
    )

    if not trigger:
        raise HTTPException(status_code=404, detail="No eligible triggers")

    inner_voice_state.fire_trigger(
        trigger_id=trigger["id"],
        text=trigger["text"],
        trigger_type=trigger["type"],
        tier=trigger["tier"],
        evidence_count=body.evidence_count,
    )

    save_slot_state(state, player_id, slot)

    return InnerVoiceTriggerResponse(
        id=trigger["id"],
        text=trigger["text"],
        type=trigger["type"],
        tier=trigger["tier"],
        updated_state=state.model_dump(mode="json"),
    )


@router.post(
    "/case/{case_id}/tom/auto-comment",
    response_model=TomResponseModel,
    responses={404: {"description": "Tom chose not to comment (30% chance)"}},
)
@limiter.limit(LLM_RATE)
async def tom_auto_comment(
    request: Request,
    case_id: str,
    body: TomAutoCommentRequest,
    player_id: str = "default",
    slot: str = "autosave",
) -> TomResponseModel:
    """Generate Tom's automatic comment after evidence discovery."""
    from src.context.tom_llm import check_tom_should_comment

    case_data = load_case_or_404(case_id)

    should_comment = await check_tom_should_comment(body.is_critical)
    if not should_comment:
        raise HTTPException(status_code=404, detail="Tom stays quiet")

    state = load_or_create_state(case_id, player_id, case_data, slot=slot)
    inner_voice_state = state.get_inner_voice_state()

    response_text, mode_used = await _generate_tom_with_fallback(
        case_data, state, inner_voice_state,
    )

    inner_voice_state.add_tom_comment(None, response_text)
    state.add_conversation_message("tom", response_text)
    save_slot_state(state, player_id, slot)

    return TomResponseModel(
        text=response_text,
        mode=f"auto_{mode_used}",
        trust_level=inner_voice_state.get_trust_percentage(),
        updated_state=state.model_dump(mode="json"),
    )


@router.post("/case/{case_id}/tom/chat", response_model=TomResponseModel)
@limiter.limit(LLM_RATE)
async def tom_direct_chat(
    request: Request,
    case_id: str,
    body: TomChatRequest,
    player_id: str = "default",
    slot: str = "autosave",
) -> TomResponseModel:
    """Handle direct conversation with Tom."""
    case_data = load_case_or_404(case_id)
    state = load_or_create_state(case_id, player_id, case_data, slot=slot)
    inner_voice_state = state.get_inner_voice_state()

    response_text, mode_used = await _generate_tom_with_fallback(
        case_data, state, inner_voice_state, user_message=body.message,
    )

    inner_voice_state.add_tom_comment(body.message, response_text)
    state.add_conversation_message("player", body.message)
    state.add_conversation_message("tom", response_text)
    save_slot_state(state, player_id, slot)

    return TomResponseModel(
        text=response_text,
        mode=f"direct_chat_{mode_used}",
        trust_level=inner_voice_state.get_trust_percentage(),
        updated_state=state.model_dump(mode="json"),
    )
