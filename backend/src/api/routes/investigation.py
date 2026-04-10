"""Investigation endpoints: explore locations, cast spells, discover evidence."""

import json
import logging
import time
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from src.api.dependencies import UserLLMConfig, get_user_llm_config
from src.api.helpers import (
    calculate_spell_outcome,
    check_spell_already_discovered,
    extract_new_evidence,
    find_witness_for_legilimency,
    load_case_or_404,
    load_slot_state,
    process_spell_flags,
    resolve_location,
    save_conversation_and_return,
    save_slot_state,
)
from src.api.llm_client import LLMClientError as ClaudeClientError
from src.api.llm_client import get_client
from src.api.rate_limit import LLM_RATE, limiter
from src.api.schemas import InvestigateRequest, InvestigateResponse
from src.context.narrator import (
    build_narrator_or_spell_prompt,
    build_narrator_prompt,
    build_system_prompt,
)
from src.context.spell_llm import SAFE_INVESTIGATION_SPELLS, detect_spell_with_fuzzy
from src.state.player_state import PlayerState
from src.telemetry.logger import log_event
from src.utils.evidence import (
    check_already_discovered,
    find_not_present_response,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _build_evidence_names(
    evidence_ids: list[str],
    hidden_evidence: list[dict[str, Any]],
) -> dict[str, str]:
    """Map evidence IDs to display names from case data."""
    if not evidence_ids:
        return {}
    name_map = {e.get("id", ""): e.get("name", "") for e in hidden_evidence}
    return {eid: name_map.get(eid, eid) for eid in evidence_ids}


def _setup_investigation(
    body: InvestigateRequest,
) -> tuple[
    dict[str, Any],  # case_data
    str,  # target_location_id
    dict[str, Any],  # location
    PlayerState,  # state
    str,  # location_desc
    list[dict[str, Any]],  # hidden_evidence
    list[dict[str, Any]],  # not_present
    list[dict[str, Any]],  # surface_elements
    list[str],  # discovered_ids
    str | None,  # world_context
]:
    """Common setup for investigate and investigate_stream."""
    case_data = load_case_or_404(body.case_id)
    target_location_id, location = resolve_location(body, case_data, slot=body.slot)
    body.location_id = target_location_id

    state = load_slot_state(body.case_id, body.player_id, body.slot)
    if state is None:
        state = PlayerState(case_id=body.case_id, current_location=body.location_id)

    if state.current_location != body.location_id:
        state.current_location = body.location_id

    case_section = case_data.get("case", case_data)
    world_context = case_section.get("world_context")

    return (
        case_data,
        target_location_id,
        location,
        state,
        location.get("description", ""),
        location.get("hidden_evidence", []),
        location.get("not_present", []),
        location.get("surface_elements", []),
        state.discovered_evidence,
        world_context,
    )


def _build_investigation_prompt(
    body: InvestigateRequest,
    state: PlayerState,
    location: dict[str, Any],
    target_location_id: str,
    location_desc: str,
    hidden_evidence: list[dict[str, Any]],
    not_present: list[dict[str, Any]],
    surface_elements: list[dict[str, Any]],
    discovered_ids: list[str],
    is_spell: bool,
    spell_id: str | None,
    spell_outcome: str | None,
    witness_context: dict[str, Any] | None,
    world_context: str | None = None,
    narrator_hint: str | None = None,
) -> tuple[str, str]:
    """Build prompt and system prompt for investigation."""
    if is_spell:
        prompt, system_prompt, _ = build_narrator_or_spell_prompt(
            location_desc=location_desc,
            hidden_evidence=hidden_evidence,
            discovered_ids=discovered_ids,
            not_present=not_present,
            player_input=body.player_input,
            surface_elements=surface_elements,
            conversation_history=state.get_narrator_history_as_dicts(
                location_id=target_location_id
            ),
            spell_contexts=location.get("spell_contexts"),
            witness_context=witness_context,
            spell_outcome=spell_outcome,
            verbosity=state.narrator_verbosity,
            world_context=world_context,
            narrator_hint=narrator_hint,
        )
    else:
        prompt = build_narrator_prompt(
            location_desc=location_desc,
            hidden_evidence=hidden_evidence,
            discovered_ids=discovered_ids,
            not_present=not_present,
            player_input=body.player_input,
            surface_elements=surface_elements,
            conversation_history=state.get_narrator_history_as_dicts(
                location_id=target_location_id
            ),
            verbosity=state.narrator_verbosity,
            world_context=world_context,
            narrator_hint=narrator_hint,
        )
        system_prompt = build_system_prompt(state.narrator_verbosity)

    return prompt, system_prompt


@router.post("/investigate/stream")
@limiter.limit(LLM_RATE)
async def investigate_stream(
    request: Request,
    body: InvestigateRequest,
    llm_config: UserLLMConfig = Depends(get_user_llm_config),
):
    """Stream narrator response via SSE."""
    (
        case_data,
        target_location_id,
        location,
        state,
        location_desc,
        hidden_evidence,
        not_present,
        surface_elements,
        discovered_ids,
        world_context,
    ) = _setup_investigation(body)

    # Detect spells and build narrator hints for short-circuit cases
    spell_id, target = detect_spell_with_fuzzy(body.player_input)
    is_spell = spell_id is not None
    narrator_hint: str | None = None

    if is_spell:
        already_response = check_spell_already_discovered(
            spell_id, body.player_input, hidden_evidence, discovered_ids
        )
        if already_response:
            narrator_hint = (
                "The player is re-casting a spell on evidence they already discovered. "
                "Acknowledge briefly that they already found this. Do NOT reveal any new evidence."
            )
    elif check_already_discovered(body.player_input, hidden_evidence, discovered_ids):
        narrator_hint = (
            "The player is re-examining something they already discovered. "
            "Acknowledge briefly that they've already examined this. Do NOT reveal any new evidence."
        )

    not_present_response = find_not_present_response(body.player_input, not_present)
    if not_present_response:
        narrator_hint = (
            f"The item the player is looking for does not exist here. "
            f"Convey this naturally: {not_present_response}"
        )

    spell_outcome: str | None = None
    witness_context: dict[str, Any] | None = None

    if is_spell and spell_id:
        if spell_id.lower() in SAFE_INVESTIGATION_SPELLS:
            spell_outcome = calculate_spell_outcome(spell_id, body.player_input, state)
        if spell_id.lower() == "legilimency":
            witness_context = find_witness_for_legilimency(target, case_data)

    prompt, system_prompt = _build_investigation_prompt(
        body,
        state,
        location,
        target_location_id,
        location_desc,
        hidden_evidence,
        not_present,
        surface_elements,
        discovered_ids,
        is_spell,
        spell_id,
        spell_outcome,
        witness_context,
        world_context=world_context,
        narrator_hint=narrator_hint,
    )
    client = get_client()

    async def event_generator():
        full_response = ""
        t0 = time.monotonic()
        try:
            async for chunk in client.get_response_stream(
                prompt,
                system=system_prompt,
                api_key=llm_config.api_key,
                model=llm_config.model,
            ):
                full_response += chunk
                yield f"data: {json.dumps({'text': chunk})}\n\n"
        except Exception as e:
            log_event(
                "llm_error",
                body.player_id,
                body.case_id,
                {
                    "endpoint": "investigate_stream",
                    "error": str(e)[:200],
                    "model": llm_config.model,
                },
            )
            logger.error("LLM stream error in investigate: %s", e)
            yield f"data: {json.dumps({'error': 'An error occurred while processing your request.'})}\n\n"
            return

        llm_elapsed_ms = int((time.monotonic() - t0) * 1000)

        new_evidence = extract_new_evidence(full_response, discovered_ids, state)
        if is_spell:
            process_spell_flags(full_response, spell_id, target, case_data, state)

        # Build evidence name map for frontend display
        evidence_names = _build_evidence_names(new_evidence, hidden_evidence)

        state.add_conversation_message("player", body.player_input, location_id=target_location_id)
        state.add_conversation_message("narrator", full_response, location_id=target_location_id)
        state.add_narrator_conversation(
            body.player_input, full_response, location_id=target_location_id
        )
        save_slot_state(state, body.player_id, body.slot)

        log_event(
            "investigate_action",
            body.player_id,
            body.case_id,
            {
                "location": target_location_id,
                "input": body.player_input[:100],
                "is_spell": is_spell,
                "spell_id": spell_id,
            },
        )
        if new_evidence:
            log_event(
                "evidence_discovered",
                body.player_id,
                body.case_id,
                {
                    "evidence_ids": new_evidence,
                    "location": target_location_id,
                },
            )

        yield f"data: {json.dumps({'done': True, 'new_evidence': new_evidence, 'evidence_names': evidence_names, 'updated_state': state.model_dump(mode='json'), 'meta': {'model': llm_config.model, 'latency_ms': llm_elapsed_ms, 'is_spell': is_spell, 'spell_id': spell_id}})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"X-Accel-Buffering": "no"},
    )


@router.post("/investigate", response_model=InvestigateResponse)
@limiter.limit(LLM_RATE)
async def investigate(
    request: Request,
    body: InvestigateRequest,
    llm_config: UserLLMConfig = Depends(get_user_llm_config),
) -> InvestigateResponse:
    """Process player investigation action."""
    (
        case_data,
        target_location_id,
        location,
        state,
        location_desc,
        hidden_evidence,
        not_present,
        surface_elements,
        discovered_ids,
        world_context,
    ) = _setup_investigation(body)

    spell_id, target = detect_spell_with_fuzzy(body.player_input)
    is_spell = spell_id is not None

    # Handle already-discovered evidence
    if is_spell:
        already_response = check_spell_already_discovered(
            spell_id, body.player_input, hidden_evidence, discovered_ids
        )
        if already_response:
            return save_conversation_and_return(
                state,
                body.player_id,
                body.player_input,
                already_response,
                target_location_id,
                [],
                True,
                slot=body.slot,
            )
    elif check_already_discovered(body.player_input, hidden_evidence, discovered_ids):
        return save_conversation_and_return(
            state,
            body.player_id,
            body.player_input,
            "You've already examined this thoroughly. Nothing new to find here.",
            target_location_id,
            [],
            True,
            slot=body.slot,
        )

    # Check not_present items
    not_present_response = find_not_present_response(body.player_input, not_present)
    if not_present_response:
        return save_conversation_and_return(
            state,
            body.player_id,
            body.player_input,
            not_present_response,
            target_location_id,
            [],
            False,
            slot=body.slot,
        )

    # Process spell mechanics
    spell_outcome: str | None = None
    witness_context: dict[str, Any] | None = None

    if is_spell and spell_id:
        if spell_id.lower() in SAFE_INVESTIGATION_SPELLS:
            spell_outcome = calculate_spell_outcome(spell_id, body.player_input, state)
        if spell_id.lower() == "legilimency":
            witness_context = find_witness_for_legilimency(target, case_data)

    # Build prompt and get narrator response
    prompt, system_prompt = _build_investigation_prompt(
        body,
        state,
        location,
        target_location_id,
        location_desc,
        hidden_evidence,
        not_present,
        surface_elements,
        discovered_ids,
        is_spell,
        spell_id,
        spell_outcome,
        witness_context,
        world_context=world_context,
    )

    try:
        client = get_client()
        narrator_response = await client.get_response(
            prompt,
            system=system_prompt,
            api_key=llm_config.api_key,
            model=llm_config.model,
        )
    except ClaudeClientError as e:
        raise HTTPException(status_code=503, detail=f"LLM service error: {e}")

    new_evidence = extract_new_evidence(narrator_response, discovered_ids, state)

    if is_spell:
        process_spell_flags(narrator_response, spell_id, target, case_data, state)

    log_event(
        "investigate_action",
        body.player_id,
        body.case_id,
        {
            "location": target_location_id,
            "input": body.player_input[:100],
            "is_spell": is_spell,
            "spell_id": spell_id,
        },
    )
    if new_evidence:
        log_event(
            "evidence_discovered",
            body.player_id,
            body.case_id,
            {
                "evidence_ids": new_evidence,
                "location": target_location_id,
            },
        )

    evidence_names = _build_evidence_names(new_evidence, hidden_evidence)
    return save_conversation_and_return(
        state,
        body.player_id,
        body.player_input,
        narrator_response,
        target_location_id,
        new_evidence,
        False,
        slot=body.slot,
        evidence_names=evidence_names,
    )
