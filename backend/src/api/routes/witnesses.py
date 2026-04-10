"""Witness interrogation, evidence presentation, and Legilimency endpoints."""

import json
import logging
import time
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from src.api.dependencies import UserLLMConfig, get_user_llm_config
from src.api.helpers import (
    detect_secrets_in_response,
    load_case_or_404,
    load_or_create_state,
    load_slot_state,
    save_slot_state,
)
from src.api.llm_client import LLMClientError as ClaudeClientError
from src.api.llm_client import get_client
from src.api.rate_limit import LLM_RATE, limiter
from src.api.routes.legilimency import handle_programmatic_legilimency
from src.api.schemas import (
    InterrogateRequest,
    InterrogateResponse,
    PresentEvidenceRequest,
    PresentEvidenceResponse,
    WitnessInfo,
)
from src.case_store.loader import get_witness, list_witnesses
from src.context.spell_llm import (
    SAFE_INVESTIGATION_SPELLS,
    calculate_spell_success,
    detect_spell_with_fuzzy,
)
from src.context.witness import build_witness_prompt, build_witness_system_prompt
from src.state.player_state import PlayerState
from src.telemetry.logger import log_event
from src.utils.trust import (
    detect_evidence_in_message,
    extract_trust_delta,
    natural_warming,
    strip_trust_tag,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _build_witness_case_context(case_data: dict[str, Any]) -> dict[str, Any]:
    """Extract basic case context for witness prompts."""
    case_inner = case_data.get("case", case_data)
    victim_info = case_inner.get("victim", {})
    crime_type = case_inner.get("crime_type", "")

    locations = case_inner.get("locations", {})
    crime_scene_loc = next(iter(locations.values()), {}) if locations else {}

    return {
        "victim_name": victim_info.get("name", ""),
        "crime_type": crime_type,
        "location": crime_scene_loc.get("name", "Unknown location"),
    }


def _lookup_evidence_full(
    evidence_id: str,
    case_data: dict[str, Any],
) -> dict[str, Any] | None:
    """Look up full evidence data (including strength, points_to) from case data."""
    case_inner = case_data.get("case", case_data)
    for location in case_inner.get("locations", {}).values():
        for ev in location.get("hidden_evidence", []):
            if ev.get("id") == evidence_id:
                return ev
    # Check additional_evidence section
    for ev in case_inner.get("additional_evidence", []):
        if ev.get("id") == evidence_id:
            return ev
    return None


def _lookup_evidence(
    witness_id: str,
    evidence_id: str,
    case_data: dict[str, Any],
) -> dict[str, Any]:
    """Look up evidence details and witness reaction from case data.

    Returns:
        Dict with keys: name, description, witness_reaction
    """
    ev = _lookup_evidence_full(evidence_id, case_data)
    if ev:
        reactions = ev.get("witness_reactions", {})
        return {
            "name": ev.get("name", evidence_id),
            "description": ev.get("description", ""),
            "witness_reaction": reactions.get(witness_id, ""),
        }
    return {"name": evidence_id, "description": "", "witness_reaction": ""}


def calculate_pressure(
    witness_id: str,
    witness_state: Any,
    case_data: dict[str, Any],
) -> tuple[int, list[dict[str, Any]]]:
    """Calculate evidence pressure against a witness from evidence shown.

    Evidence that directly implicates the witness (via points_to) contributes
    full strength. Other evidence contributes 20% (atmosphere/indirect).

    Returns:
        Tuple of (pressure_score, evidence_details_for_prompt)
    """
    pressure = 0
    details = []

    for ev_id in witness_state.evidence_shown:
        ev = _lookup_evidence_full(ev_id, case_data)
        if not ev:
            continue

        strength = ev.get("strength", 0)
        points_to = ev.get("points_to", [])
        implicates_me = witness_id in points_to

        if implicates_me:
            pressure += strength
        else:
            pressure += int(strength * 0.2)

        details.append({
            "name": ev.get("name", ev_id),
            "implicates_me": implicates_me,
        })

    return pressure, details


async def _handle_evidence_presentation(
    witness: dict[str, Any],
    evidence_id: str,
    state: PlayerState,
    witness_state: Any,
    player_id: str,
    case_data: dict[str, Any],
    llm_config: UserLLMConfig | None = None,
    slot: str = "autosave",
) -> InterrogateResponse:
    """Handle evidence presentation to witness.

    Uses the unified build_witness_prompt with evidence_presented context,
    so trust tiers, secrets, and personality all apply to the reaction.
    """
    witness_id = witness.get("id", "")
    evidence_info = _lookup_evidence(witness_id, evidence_id, case_data)
    evidence_name = evidence_info["name"]

    witness_state.mark_evidence_shown(evidence_id)

    pressure, ev_details = calculate_pressure(witness_id, witness_state, case_data)
    case_context = _build_witness_case_context(case_data)

    prompt = build_witness_prompt(
        witness=witness,
        trust=witness_state.trust,

        conversation_history=witness_state.get_history_as_dicts(),
        player_input=f"I'd like to show you this evidence: {evidence_name}",
        case_context=case_context,
        evidence_presented=evidence_info,
        pressure=pressure,
        evidence_shown_details=ev_details,
    )
    system_prompt = build_witness_system_prompt(witness.get("name", "Unknown"))

    try:
        client = get_client()
        _key = llm_config.api_key if llm_config else None
        _model = llm_config.model if llm_config else None
        witness_response = await client.get_response(
            prompt,
            system=system_prompt,
            api_key=_key,
            model=_model,
        )
    except ClaudeClientError as e:
        raise HTTPException(status_code=503, detail=f"LLM service error: {e}")

    # Extract LLM-decided trust delta, fallback to 0
    trust_delta = extract_trust_delta(witness_response) or 0
    witness_state.adjust_trust(trust_delta)

    # Strip trust tag before storing/returning
    clean_response = strip_trust_tag(witness_response)

    secrets_revealed, secret_texts = detect_secrets_in_response(
        clean_response, witness, witness_state
    )

    witness_state.add_conversation(
        question=f"[Evidence presented: {evidence_name}]",
        response=clean_response,
        trust_delta=trust_delta,
    )

    state.update_witness_state(witness_state)
    save_slot_state(state, player_id, slot)

    return InterrogateResponse(
        response=clean_response,
        trust=witness_state.trust,
        trust_delta=trust_delta,
        secrets_revealed=secrets_revealed,
        secret_texts=secret_texts,
        updated_state=state.model_dump(mode="json"),
    )


@router.post("/interrogate/stream")
@limiter.limit(LLM_RATE)
async def interrogate_witness_stream(
    request: Request,
    body: InterrogateRequest,
    llm_config: UserLLMConfig = Depends(get_user_llm_config),
):
    """Stream witness interrogation response via SSE."""
    case_data = load_case_or_404(body.case_id)
    try:
        witness = get_witness(case_data, body.witness_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Witness not found: {body.witness_id}")

    state = load_or_create_state(body.case_id, body.player_id, case_data, slot=body.slot)
    base_trust = witness.get("base_trust", 50)
    witness_state = state.get_witness_state(body.witness_id, base_trust)

    witness_id = witness.get("id", body.witness_id)
    pressure, ev_details = calculate_pressure(witness_id, witness_state, case_data)
    case_context = _build_witness_case_context(case_data)

    prompt = build_witness_prompt(
        witness=witness,
        trust=witness_state.trust,

        conversation_history=witness_state.get_history_as_dicts(),
        player_input=body.question,
        case_context=case_context,
        pressure=pressure,
        evidence_shown_details=ev_details,
    )
    system_prompt = build_witness_system_prompt(witness.get("name", "Unknown"))
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
                    "endpoint": "interrogate_stream",
                    "error": str(e)[:200],
                    "model": llm_config.model,
                },
            )
            logger.error("LLM stream error in interrogate: %s", e)
            yield f"data: {json.dumps({'error': 'An error occurred while processing your request.'})}\n\n"
            return

        llm_elapsed_ms = int((time.monotonic() - t0) * 1000)

        # Extract LLM-decided trust delta, fallback to natural warming
        trust_delta = extract_trust_delta(full_response)
        if trust_delta is None:
            trust_delta = natural_warming()
        witness_state.adjust_trust(trust_delta)

        clean_response = strip_trust_tag(full_response)
        secrets_revealed, _ = detect_secrets_in_response(clean_response, witness, witness_state)

        witness_state.add_conversation(
            question=body.question,
            response=clean_response,
            trust_delta=trust_delta,
        )
        state.update_witness_state(witness_state)
        save_slot_state(state, body.player_id, body.slot)

        log_event(
            "witness_questioned",
            body.player_id,
            body.case_id,
            {
                "witness_id": body.witness_id,
                "question": body.question[:100],
            },
        )
        if secrets_revealed:
            log_event(
                "secret_revealed",
                body.player_id,
                body.case_id,
                {
                    "witness_id": body.witness_id,
                    "secrets": secrets_revealed,
                },
            )

        yield f"data: {json.dumps({'done': True, 'trust': witness_state.trust, 'trust_delta': trust_delta, 'secrets_revealed': secrets_revealed, 'updated_state': state.model_dump(mode='json'), 'meta': {'model': llm_config.model, 'latency_ms': llm_elapsed_ms}})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"X-Accel-Buffering": "no"},
    )


@router.post("/interrogate", response_model=InterrogateResponse)
@limiter.limit(LLM_RATE)
async def interrogate_witness(
    request: Request,
    body: InterrogateRequest,
    llm_config: UserLLMConfig = Depends(get_user_llm_config),
) -> InterrogateResponse:
    """Interrogate a witness with a question."""
    case_data = load_case_or_404(body.case_id)
    try:
        witness = get_witness(case_data, body.witness_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Witness not found: {body.witness_id}")

    state = load_or_create_state(body.case_id, body.player_id, case_data, slot=body.slot)
    base_trust = witness.get("base_trust", 50)
    witness_state = state.get_witness_state(body.witness_id, base_trust)

    # Check for evidence reference in question
    evidence_id = detect_evidence_in_message(
        body.question, state.discovered_evidence, case_data,
    )
    if evidence_id:
        return await _handle_evidence_presentation(
            witness=witness,
            evidence_id=evidence_id,
            state=state,
            witness_state=witness_state,
            player_id=body.player_id,
            case_data=case_data,
            llm_config=llm_config,
            slot=body.slot,
        )

    # Spell detection
    spell_id, target = detect_spell_with_fuzzy(body.question)
    spell_outcome: str | None = None

    if spell_id == "legilimency":
        return await handle_programmatic_legilimency(
            body=body,
            witness=witness,
            state=state,
            witness_state=witness_state,
            llm_config=llm_config,
            slot=body.slot,
        )
    elif spell_id and spell_id in SAFE_INVESTIGATION_SPELLS:
        spell_key = spell_id.lower()
        attempts = witness_state.spell_attempts.get(spell_key, 0)
        spell_success = calculate_spell_success(
            spell_id=spell_key,
            player_input=body.question,
            attempts_in_location=attempts,
            location_id=f"witness_{body.witness_id}",
        )
        spell_outcome = "SUCCESS" if spell_success else "FAILURE"
        witness_state.spell_attempts[spell_key] = attempts + 1
        logger.info(
            f"Spell Cast on Witness: {spell_id} | Witness: {body.witness_id} | "
            f"Attempt #{attempts + 1} | Outcome: {spell_outcome}"
        )

    witness_id_str = witness.get("id", body.witness_id)
    pressure, ev_details = calculate_pressure(witness_id_str, witness_state, case_data)
    case_context = _build_witness_case_context(case_data)

    prompt = build_witness_prompt(
        witness=witness,
        trust=witness_state.trust,

        conversation_history=witness_state.get_history_as_dicts(),
        player_input=body.question,
        spell_id=spell_id,
        spell_outcome=spell_outcome,
        case_context=case_context,
        pressure=pressure,
        evidence_shown_details=ev_details,
    )

    try:
        client = get_client()
        system_prompt = build_witness_system_prompt(witness.get("name", "Unknown"))
        witness_response = await client.get_response(
            prompt,
            system=system_prompt,
            api_key=llm_config.api_key,
            model=llm_config.model,
        )
    except ClaudeClientError as e:
        raise HTTPException(status_code=503, detail=f"LLM service error: {e}")

    # Extract LLM-decided trust delta, fallback to natural warming
    trust_delta = extract_trust_delta(witness_response)
    if trust_delta is None:
        trust_delta = natural_warming()
    witness_state.adjust_trust(trust_delta)

    clean_response = strip_trust_tag(witness_response)

    secrets_revealed, secret_texts = detect_secrets_in_response(
        clean_response, witness, witness_state
    )

    witness_state.add_conversation(
        question=body.question,
        response=clean_response,
        trust_delta=trust_delta,
    )

    state.update_witness_state(witness_state)
    save_slot_state(state, body.player_id, body.slot)

    log_event(
        "witness_questioned",
        body.player_id,
        body.case_id,
        {
            "witness_id": body.witness_id,
            "question": body.question[:100],
        },
    )
    if secrets_revealed:
        log_event(
            "secret_revealed",
            body.player_id,
            body.case_id,
            {
                "witness_id": body.witness_id,
                "secrets": secrets_revealed,
            },
        )

    return InterrogateResponse(
        response=clean_response,
        trust=witness_state.trust,
        trust_delta=trust_delta,
        secrets_revealed=secrets_revealed,
        secret_texts=secret_texts,
        updated_state=state.model_dump(mode="json"),
    )


@router.post("/present-evidence", response_model=PresentEvidenceResponse)
@limiter.limit(LLM_RATE)
async def present_evidence(
    request: Request,
    body: PresentEvidenceRequest,
    llm_config: UserLLMConfig = Depends(get_user_llm_config),
) -> PresentEvidenceResponse:
    """Present evidence to a witness."""
    case_data = load_case_or_404(body.case_id)
    try:
        witness = get_witness(case_data, body.witness_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Witness not found: {body.witness_id}")

    state = load_or_create_state(body.case_id, body.player_id, case_data, slot=body.slot)

    if body.evidence_id not in state.discovered_evidence:
        raise HTTPException(status_code=400, detail=f"Evidence not discovered: {body.evidence_id}")

    base_trust = witness.get("base_trust", 50)
    witness_state = state.get_witness_state(body.witness_id, base_trust)

    result = await _handle_evidence_presentation(
        witness=witness,
        evidence_id=body.evidence_id,
        state=state,
        witness_state=witness_state,
        player_id=body.player_id,
        case_data=case_data,
        llm_config=llm_config,
        slot=body.slot,
    )

    return PresentEvidenceResponse(
        response=result.response,
        trust=result.trust,
        trust_delta=result.trust_delta,
        secrets_revealed=result.secrets_revealed,
        secret_texts=result.secret_texts,
        updated_state=result.updated_state,
    )


@router.post("/present-evidence/stream")
@limiter.limit(LLM_RATE)
async def present_evidence_stream(
    request: Request,
    body: PresentEvidenceRequest,
    llm_config: UserLLMConfig = Depends(get_user_llm_config),
):
    """Stream evidence presentation response via SSE."""
    case_data = load_case_or_404(body.case_id)
    try:
        witness = get_witness(case_data, body.witness_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Witness not found: {body.witness_id}")

    state = load_or_create_state(body.case_id, body.player_id, case_data, slot=body.slot)

    if body.evidence_id not in state.discovered_evidence:
        raise HTTPException(status_code=400, detail=f"Evidence not discovered: {body.evidence_id}")

    base_trust = witness.get("base_trust", 50)
    witness_state = state.get_witness_state(body.witness_id, base_trust)

    witness_id = witness.get("id", body.witness_id)
    evidence_info = _lookup_evidence(witness_id, body.evidence_id, case_data)
    evidence_name = evidence_info["name"]

    witness_state.mark_evidence_shown(body.evidence_id)

    pressure, ev_details = calculate_pressure(witness_id, witness_state, case_data)
    case_context = _build_witness_case_context(case_data)

    prompt = build_witness_prompt(
        witness=witness,
        trust=witness_state.trust,

        conversation_history=witness_state.get_history_as_dicts(),
        player_input=f"I'd like to show you this evidence: {evidence_name}",
        case_context=case_context,
        evidence_presented=evidence_info,
        pressure=pressure,
        evidence_shown_details=ev_details,
    )
    system_prompt = build_witness_system_prompt(witness.get("name", "Unknown"))
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
                    "endpoint": "present_evidence_stream",
                    "error": str(e)[:200],
                    "model": llm_config.model,
                },
            )
            logger.error("LLM stream error in present_evidence: %s", e)
            yield f"data: {json.dumps({'error': 'An error occurred while processing your request.'})}\n\n"
            return

        llm_elapsed_ms = int((time.monotonic() - t0) * 1000)

        # Extract LLM-decided trust delta, fallback to 0
        trust_delta = extract_trust_delta(full_response) or 0
        witness_state.adjust_trust(trust_delta)

        clean_response = strip_trust_tag(full_response)
        secrets_revealed, _ = detect_secrets_in_response(
            clean_response, witness, witness_state
        )

        witness_state.add_conversation(
            question=f"[Evidence presented: {evidence_name}]",
            response=clean_response,
            trust_delta=trust_delta,
        )
        state.update_witness_state(witness_state)
        save_slot_state(state, body.player_id, body.slot)

        log_event(
            "evidence_presented",
            body.player_id,
            body.case_id,
            {
                "witness_id": body.witness_id,
                "evidence_id": body.evidence_id,
            },
        )

        yield f"data: {json.dumps({'done': True, 'trust': witness_state.trust, 'trust_delta': trust_delta, 'secrets_revealed': secrets_revealed, 'updated_state': state.model_dump(mode='json'), 'meta': {'model': llm_config.model, 'latency_ms': llm_elapsed_ms}})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"X-Accel-Buffering": "no"},
    )


@router.get("/witnesses", response_model=list[WitnessInfo])
async def get_witnesses(
    case_id: str = "case_001",
    player_id: str = "default",
    slot: str = "autosave",
) -> list[WitnessInfo]:
    """List available witnesses with current trust levels."""
    case_data = load_case_or_404(case_id)
    witness_ids = list_witnesses(case_data)
    state = load_slot_state(case_id, player_id, slot)

    witnesses: list[WitnessInfo] = []
    for witness_id in witness_ids:
        witness = get_witness(case_data, witness_id)

        if state and witness_id in state.witness_states:
            ws = state.witness_states[witness_id]
            trust = ws.trust
            secrets_revealed = ws.secrets_revealed
        else:
            trust = witness.get("base_trust", 50)
            secrets_revealed = []

        witnesses.append(
            WitnessInfo(
                id=witness_id,
                name=witness.get("name", "Unknown"),
                trust=trust,
                secrets_revealed=secrets_revealed,
            )
        )

    return witnesses


@router.get("/witness/{witness_id}", response_model=WitnessInfo)
async def get_witness_info(
    witness_id: str,
    case_id: str = "case_001",
    player_id: str = "default",
    slot: str = "autosave",
) -> WitnessInfo:
    """Get single witness info with current trust level."""
    case_data = load_case_or_404(case_id)
    try:
        witness = get_witness(case_data, witness_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Witness not found: {witness_id}")

    state = load_slot_state(case_id, player_id, slot)

    if state and witness_id in state.witness_states:
        ws = state.witness_states[witness_id]
        trust = ws.trust
        secrets_revealed = ws.secrets_revealed
        conversation_history = [item.model_dump() for item in ws.conversation_history]
    else:
        trust = witness.get("base_trust", 50)
        secrets_revealed = []
        conversation_history = []

    return WitnessInfo(
        id=witness_id,
        name=witness.get("name", "Unknown"),
        trust=trust,
        secrets_revealed=secrets_revealed,
        conversation_history=conversation_history,
        personality=witness.get("description") or witness.get("personality"),
    )
