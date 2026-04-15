"""Investigation endpoints: explore locations, cast spells, discover evidence."""

import json
import logging
import time
from dataclasses import dataclass
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
from src.case_store.loader import list_locations
from src.context.narrator import (
    build_narrator_or_spell_prompt,
    build_narrator_prompt,
    build_system_prompt,
)
from src.context.spell_llm import SAFE_INVESTIGATION_SPELLS, detect_spell_with_fuzzy
from src.location.parser import LocationCommandParser
from src.state.player_state import PlayerState
from src.telemetry.logger import log_event
from src.utils.evidence import (
    check_already_discovered,
    find_not_present_response,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Shared helpers ────────────────────────────────────────────────────────────


def _detect_location_command(
    player_input: str,
    case_data: dict[str, Any],
    current_location: str,
) -> tuple[str | None, str | None, bool]:
    """Detect "go to X" commands.

    Returns:
        (location_id, location_name, has_nav_intent)
        location_id/name are set if a valid location was matched.
        has_nav_intent is True if input looks like movement even if no match.
    """
    locations = list_locations(case_data)
    location_ids = [loc["id"] for loc in locations]
    name_to_id = {loc["name"]: loc["id"] for loc in locations if loc.get("name")}
    parser = LocationCommandParser(location_ids, name_to_id=name_to_id)
    new_location = parser.parse(player_input)

    if new_location and new_location != current_location:
        name_map = {loc["id"]: loc["name"] for loc in locations}
        return new_location, name_map.get(new_location, new_location), False

    has_intent = parser.has_navigation_intent(player_input)
    return None, None, has_intent


def _build_evidence_names(
    evidence_ids: list[str],
    hidden_evidence: list[dict[str, Any]],
) -> dict[str, str]:
    """Map evidence IDs to display names from case data."""
    if not evidence_ids:
        return {}
    name_map = {e.get("id", ""): e.get("name", "") for e in hidden_evidence}
    return {eid: name_map.get(eid, eid) for eid in evidence_ids}


@dataclass
class InvestigationContext:
    """Result of _setup_investigation — all data needed for an investigation."""

    case_data: dict[str, Any]
    target_location_id: str
    location: dict[str, Any]
    state: PlayerState
    location_desc: str
    hidden_evidence: list[dict[str, Any]]
    not_present: list[dict[str, Any]]
    surface_elements: list[dict[str, Any]]
    discovered_ids: list[str]
    world_context: str | None


def _setup_investigation(body: InvestigateRequest) -> InvestigationContext:
    """Common setup for all investigation endpoints."""
    case_data = load_case_or_404(body.case_id)
    target_location_id, location = resolve_location(body, case_data, slot=body.slot)
    body.location_id = target_location_id

    state = load_slot_state(body.case_id, body.player_id, body.slot)
    if state is None:
        state = PlayerState(case_id=body.case_id, current_location=body.location_id)

    if state.current_location != body.location_id:
        state.current_location = body.location_id

    case_section = case_data.get("case", case_data)

    return InvestigationContext(
        case_data=case_data,
        target_location_id=target_location_id,
        location=location,
        state=state,
        location_desc=location.get("description", ""),
        hidden_evidence=location.get("hidden_evidence", []),
        not_present=location.get("not_present", []),
        surface_elements=location.get("surface_elements", []),
        discovered_ids=state.discovered_evidence,
        world_context=case_section.get("world_context"),
    )


def _build_narrator_hints(
    body: InvestigateRequest,
    ctx: InvestigationContext,
    has_nav_intent: bool,
    is_spell: bool,
    spell_id: str | None,
) -> str | None:
    """Build narrator hint for soft short-circuit cases."""
    if has_nav_intent and not is_spell:
        return (
            "The player seems to be trying to leave this location or go somewhere. "
            "Do NOT narrate travel or describe arriving at a different place. "
            "Briefly acknowledge their intent in character — perhaps the path is "
            "unclear, or suggest they decide where to go. Stay in the current location. "
            "Keep it to 1-2 sentences."
        )

    if is_spell:
        already = check_spell_already_discovered(
            spell_id,
            body.player_input,
            ctx.hidden_evidence,
            ctx.discovered_ids,
        )
        if already:
            return (
                "The player is re-casting a spell on evidence they already discovered. "
                "Acknowledge briefly that they already found this. Do NOT reveal any new evidence."
            )
    elif check_already_discovered(body.player_input, ctx.hidden_evidence, ctx.discovered_ids):
        return (
            "The player is re-examining something they already discovered. "
            "Acknowledge briefly that they've already examined this. Do NOT reveal any new evidence."
        )

    not_present_response = find_not_present_response(body.player_input, ctx.not_present)
    if not_present_response:
        return (
            f"The item the player is looking for does not exist here. "
            f"Convey this naturally: {not_present_response}"
        )

    return None


def _resolve_spell_mechanics(
    body: InvestigateRequest,
    ctx: InvestigationContext,
    spell_id: str | None,
    target: str | None,
) -> tuple[str | None, dict[str, Any] | None]:
    """Calculate spell outcome and witness context for legilimency."""
    if not spell_id:
        return None, None

    spell_outcome: str | None = None
    witness_context: dict[str, Any] | None = None

    if spell_id.lower() in SAFE_INVESTIGATION_SPELLS:
        spell_outcome = calculate_spell_outcome(spell_id, body.player_input, ctx.state)
    if spell_id.lower() == "legilimency":
        witness_context = find_witness_for_legilimency(target, ctx.case_data)

    return spell_outcome, witness_context


def _build_investigation_prompt(
    body: InvestigateRequest,
    ctx: InvestigationContext,
    is_spell: bool,
    spell_id: str | None,
    spell_outcome: str | None,
    witness_context: dict[str, Any] | None,
    narrator_hint: str | None = None,
) -> tuple[str, str]:
    """Build prompt and system prompt for investigation."""
    if is_spell:
        prompt, system_prompt, _ = build_narrator_or_spell_prompt(
            location_desc=ctx.location_desc,
            hidden_evidence=ctx.hidden_evidence,
            discovered_ids=ctx.discovered_ids,
            not_present=ctx.not_present,
            player_input=body.player_input,
            surface_elements=ctx.surface_elements,
            conversation_history=ctx.state.get_narrator_history_as_dicts(
                location_id=ctx.target_location_id,
            ),
            spell_contexts=ctx.location.get("spell_contexts"),
            witness_context=witness_context,
            spell_outcome=spell_outcome,
            verbosity=ctx.state.narrator_verbosity,
            world_context=ctx.world_context,
            narrator_hint=narrator_hint,
            language=ctx.state.language,
        )
    else:
        prompt = build_narrator_prompt(
            location_desc=ctx.location_desc,
            hidden_evidence=ctx.hidden_evidence,
            discovered_ids=ctx.discovered_ids,
            not_present=ctx.not_present,
            player_input=body.player_input,
            surface_elements=ctx.surface_elements,
            conversation_history=ctx.state.get_narrator_history_as_dicts(
                location_id=ctx.target_location_id,
            ),
            verbosity=ctx.state.narrator_verbosity,
            world_context=ctx.world_context,
            narrator_hint=narrator_hint,
        )
        system_prompt = build_system_prompt(
            ctx.state.narrator_verbosity, language=ctx.state.language
        )

    return prompt, system_prompt


def _process_investigation_response(
    response: str,
    body: InvestigateRequest,
    ctx: InvestigationContext,
    is_spell: bool,
    spell_id: str | None,
    target: str | None,
) -> tuple[list[str], dict[str, str]]:
    """Post-LLM: evidence extraction, spell flags, logging.

    Returns: (new_evidence, evidence_names)
    """
    new_evidence = extract_new_evidence(response, ctx.discovered_ids, ctx.state)
    if is_spell:
        process_spell_flags(response, spell_id, target, ctx.case_data, ctx.state)

    evidence_names = _build_evidence_names(new_evidence, ctx.hidden_evidence)

    log_event(
        "investigate_action",
        body.player_id,
        body.case_id,
        {
            "location": ctx.target_location_id,
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
            {"evidence_ids": new_evidence, "location": ctx.target_location_id},
        )

    return new_evidence, evidence_names


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.post("/investigate/stream")
@limiter.limit(LLM_RATE)
async def investigate_stream(
    request: Request,
    body: InvestigateRequest,
    llm_config: UserLLMConfig = Depends(get_user_llm_config),
):
    """Stream narrator response via SSE."""
    ctx = _setup_investigation(body)

    # Location change — short-circuit with canned narrative
    new_loc_id, new_loc_name, has_nav_intent = _detect_location_command(
        body.player_input,
        ctx.case_data,
        ctx.state.current_location,
    )
    if new_loc_id:
        ctx.state.visit_location(new_loc_id)
        save_slot_state(ctx.state, body.player_id, body.slot)
        narrative = f"You make your way to the {new_loc_name}..."

        async def location_change_generator():
            yield f"data: {json.dumps({'text': narrative})}\n\n"
            yield f"data: {json.dumps({'done': True, 'new_evidence': [], 'evidence_names': {}, 'location_changed': new_loc_id, 'updated_state': ctx.state.model_dump(mode='json')})}\n\n"

        return StreamingResponse(
            location_change_generator(),
            media_type="text/event-stream",
            headers={"X-Accel-Buffering": "no"},
        )

    spell_id, target = detect_spell_with_fuzzy(body.player_input)
    is_spell = spell_id is not None

    narrator_hint = _build_narrator_hints(body, ctx, has_nav_intent, is_spell, spell_id)
    spell_outcome, witness_context = _resolve_spell_mechanics(body, ctx, spell_id, target)

    prompt, system_prompt = _build_investigation_prompt(
        body,
        ctx,
        is_spell,
        spell_id,
        spell_outcome,
        witness_context,
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

        new_evidence, evidence_names = _process_investigation_response(
            full_response,
            body,
            ctx,
            is_spell,
            spell_id,
            target,
        )

        ctx.state.add_conversation_message(
            "player",
            body.player_input,
            location_id=ctx.target_location_id,
        )
        ctx.state.add_conversation_message(
            "narrator",
            full_response,
            location_id=ctx.target_location_id,
        )
        ctx.state.add_narrator_conversation(
            body.player_input,
            full_response,
            location_id=ctx.target_location_id,
        )
        save_slot_state(ctx.state, body.player_id, body.slot)

        yield f"data: {json.dumps({'done': True, 'new_evidence': new_evidence, 'evidence_names': evidence_names, 'updated_state': ctx.state.model_dump(mode='json'), 'meta': {'model': llm_config.model, 'latency_ms': llm_elapsed_ms, 'is_spell': is_spell, 'spell_id': spell_id}})}\n\n"

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
    """Process player investigation action (non-streaming, used by tests)."""
    ctx = _setup_investigation(body)

    # Location change — short-circuit
    new_loc_id, new_loc_name, has_nav_intent = _detect_location_command(
        body.player_input,
        ctx.case_data,
        ctx.state.current_location,
    )
    if new_loc_id:
        ctx.state.visit_location(new_loc_id)
        narrative = f"You make your way to the {new_loc_name}..."
        return save_conversation_and_return(
            ctx.state,
            body.player_id,
            body.player_input,
            narrative,
            new_loc_id,
            [],
            False,
            slot=body.slot,
            location_changed=new_loc_id,
        )

    spell_id, target = detect_spell_with_fuzzy(body.player_input)
    is_spell = spell_id is not None

    # Non-stream short-circuits for already-discovered / not-present
    if is_spell:
        already_response = check_spell_already_discovered(
            spell_id,
            body.player_input,
            ctx.hidden_evidence,
            ctx.discovered_ids,
        )
        if already_response:
            return save_conversation_and_return(
                ctx.state,
                body.player_id,
                body.player_input,
                already_response,
                ctx.target_location_id,
                [],
                True,
                slot=body.slot,
            )
    elif check_already_discovered(body.player_input, ctx.hidden_evidence, ctx.discovered_ids):
        return save_conversation_and_return(
            ctx.state,
            body.player_id,
            body.player_input,
            "You've already examined this thoroughly. Nothing new to find here.",
            ctx.target_location_id,
            [],
            True,
            slot=body.slot,
        )

    not_present_response = find_not_present_response(body.player_input, ctx.not_present)
    if not_present_response:
        return save_conversation_and_return(
            ctx.state,
            body.player_id,
            body.player_input,
            not_present_response,
            ctx.target_location_id,
            [],
            False,
            slot=body.slot,
        )

    # Build narrator hint for unmatched navigation
    narrator_hint: str | None = None
    if has_nav_intent and not is_spell:
        narrator_hint = (
            "The player seems to be trying to leave this location or go somewhere. "
            "Do NOT narrate travel or describe arriving at a different place. "
            "Briefly acknowledge their intent in character — perhaps the path is "
            "unclear, or suggest they decide where to go. Stay in the current location. "
            "Keep it to 1-2 sentences."
        )

    spell_outcome, witness_context = _resolve_spell_mechanics(body, ctx, spell_id, target)

    prompt, system_prompt = _build_investigation_prompt(
        body,
        ctx,
        is_spell,
        spell_id,
        spell_outcome,
        witness_context,
        narrator_hint=narrator_hint,
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

    new_evidence, evidence_names = _process_investigation_response(
        narrator_response,
        body,
        ctx,
        is_spell,
        spell_id,
        target,
    )

    return save_conversation_and_return(
        ctx.state,
        body.player_id,
        body.player_input,
        narrator_response,
        ctx.target_location_id,
        new_evidence,
        False,
        slot=body.slot,
        evidence_names=evidence_names,
    )
