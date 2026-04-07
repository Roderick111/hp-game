"""Investigation endpoints: explore locations, cast spells, discover evidence."""

import json
import logging
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
    process_spell_flags,
    resolve_location,
    save_conversation_and_return,
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
from src.state.persistence import load_state, save_state
from src.state.player_state import PlayerState
from src.utils.evidence import (
    check_already_discovered,
    find_matching_evidence,
    find_not_present_response,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _setup_investigation(body: InvestigateRequest) -> tuple[
    dict[str, Any],  # case_data
    str,  # target_location_id
    dict[str, Any],  # location
    PlayerState,  # state
    str,  # location_desc
    list[dict[str, Any]],  # hidden_evidence
    list[dict[str, Any]],  # not_present
    list[dict[str, Any]],  # surface_elements
    list[str],  # discovered_ids
]:
    """Common setup for investigate and investigate_stream."""
    case_data = load_case_or_404(body.case_id)
    target_location_id, location = resolve_location(body, case_data)
    body.location_id = target_location_id

    state = load_state(body.case_id, body.player_id)
    if state is None:
        state = PlayerState(case_id=body.case_id, current_location=body.location_id)

    if state.current_location != body.location_id:
        state.current_location = body.location_id

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
        case_data, target_location_id, location, state,
        location_desc, hidden_evidence, not_present, surface_elements, discovered_ids,
    ) = _setup_investigation(body)

    # Check for non-LLM responses
    spell_id, target = detect_spell_with_fuzzy(body.player_input)
    is_spell = spell_id is not None

    if is_spell:
        already_response = check_spell_already_discovered(
            spell_id, body.player_input, hidden_evidence, discovered_ids
        )
        if already_response:
            result = save_conversation_and_return(
                state, body.player_id, body.player_input,
                already_response, target_location_id, [], True,
            )

            async def _single():
                yield f"data: {json.dumps({'text': result.narrator_response})}\n\n"
                yield f"data: {json.dumps({'done': True})}\n\n"

            return StreamingResponse(_single(), media_type="text/event-stream")
    elif check_already_discovered(body.player_input, hidden_evidence, discovered_ids):
        already_response = "You've already examined this thoroughly. Nothing new to find here."
        result = save_conversation_and_return(
            state, body.player_id, body.player_input,
            already_response, target_location_id, [], True,
        )

        async def _single_already():
            yield f"data: {json.dumps({'text': result.narrator_response})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"

        return StreamingResponse(_single_already(), media_type="text/event-stream")

    not_present_response = find_not_present_response(body.player_input, not_present)
    if not_present_response:

        async def _single_np():
            yield f"data: {json.dumps({'text': not_present_response})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"

        return StreamingResponse(_single_np(), media_type="text/event-stream")

    matching_evidence = find_matching_evidence(body.player_input, hidden_evidence, discovered_ids)

    spell_outcome: str | None = None
    witness_context: dict[str, Any] | None = None

    if is_spell and spell_id:
        if spell_id.lower() in SAFE_INVESTIGATION_SPELLS:
            spell_outcome = calculate_spell_outcome(spell_id, body.player_input, state)
        if spell_id.lower() == "legilimency":
            witness_context = find_witness_for_legilimency(target, case_data)

    prompt, system_prompt = _build_investigation_prompt(
        body, state, location, target_location_id,
        location_desc, hidden_evidence, not_present, surface_elements,
        discovered_ids, is_spell, spell_id, spell_outcome, witness_context,
    )
    client = get_client()

    async def event_generator():
        full_response = ""
        try:
            async for chunk in client.get_response_stream(
                prompt, system=system_prompt,
                api_key=llm_config.api_key, model=llm_config.model,
            ):
                full_response += chunk
                yield f"data: {json.dumps({'text': chunk})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return

        new_evidence = extract_new_evidence(
            matching_evidence, full_response, discovered_ids, state
        )
        if is_spell:
            process_spell_flags(full_response, spell_id, target, case_data, state)

        state.add_conversation_message("player", body.player_input, location_id=target_location_id)
        state.add_conversation_message("narrator", full_response, location_id=target_location_id)
        state.add_narrator_conversation(
            body.player_input, full_response, location_id=target_location_id
        )
        save_state(state, body.player_id)

        yield f"data: {json.dumps({'done': True, 'new_evidence': new_evidence})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/investigate", response_model=InvestigateResponse)
@limiter.limit(LLM_RATE)
async def investigate(
    request: Request,
    body: InvestigateRequest,
    llm_config: UserLLMConfig = Depends(get_user_llm_config),
) -> InvestigateResponse:
    """Process player investigation action."""
    (
        case_data, target_location_id, location, state,
        location_desc, hidden_evidence, not_present, surface_elements, discovered_ids,
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
                state, body.player_id, body.player_input,
                already_response, target_location_id, [], True,
            )
    elif check_already_discovered(body.player_input, hidden_evidence, discovered_ids):
        return save_conversation_and_return(
            state, body.player_id, body.player_input,
            "You've already examined this thoroughly. Nothing new to find here.",
            target_location_id, [], True,
        )

    # Check not_present items
    not_present_response = find_not_present_response(body.player_input, not_present)
    if not_present_response:
        return save_conversation_and_return(
            state, body.player_id, body.player_input,
            not_present_response, target_location_id, [], False,
        )

    # Check for evidence triggers
    matching_evidence = find_matching_evidence(body.player_input, hidden_evidence, discovered_ids)

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
        body, state, location, target_location_id,
        location_desc, hidden_evidence, not_present, surface_elements,
        discovered_ids, is_spell, spell_id, spell_outcome, witness_context,
    )

    try:
        client = get_client()
        narrator_response = await client.get_response(
            prompt, system=system_prompt,
            api_key=llm_config.api_key, model=llm_config.model,
        )
    except ClaudeClientError as e:
        raise HTTPException(status_code=503, detail=f"LLM service error: {e}")

    new_evidence = extract_new_evidence(
        matching_evidence, narrator_response, discovered_ids, state
    )

    if is_spell:
        process_spell_flags(narrator_response, spell_id, target, case_data, state)

    return save_conversation_and_return(
        state, body.player_id, body.player_input,
        narrator_response, target_location_id, new_evidence, False,
    )
