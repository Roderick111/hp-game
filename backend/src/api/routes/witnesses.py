"""Witness interrogation, evidence presentation, and Legilimency endpoints."""

import json
import logging
import random
import time
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from src.api.dependencies import UserLLMConfig, get_user_llm_config
from src.api.helpers import (
    detect_keyword_match,
    detect_secret_by_consecutive_words,
    detect_secrets_in_response,
    load_case_or_404,
    load_or_create_state,
    load_slot_state,
    save_slot_state,
)
from src.api.llm_client import LLMClientError as ClaudeClientError
from src.api.llm_client import get_client
from src.api.rate_limit import LLM_RATE, limiter
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
    build_legilimency_narration_prompt,
    build_spell_system_prompt,
    calculate_legilimency_success,
    calculate_spell_success,
    detect_spell_with_fuzzy,
    extract_intent_from_input,
)
from src.context.witness import build_witness_prompt, build_witness_system_prompt
from src.state.player_state import PlayerState
from src.telemetry.logger import log_event
from src.utils.evidence import extract_evidence_from_response
from src.utils.trust import (
    EVIDENCE_PRESENTATION_BONUS,
    adjust_trust,
    detect_evidence_presentation,
    match_evidence_to_inventory,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _build_witness_case_context(case_data: dict[str, Any]) -> dict[str, Any]:
    """Extract basic case context for witness prompts."""
    victim_info = case_data.get("victim", {})
    cause_of_death = victim_info.get("cause_of_death", "")
    crime_type = cause_of_death.split()[0] if cause_of_death else "Victim found"

    locations = case_data.get("locations", {})
    crime_scene_loc = next(iter(locations.values()), {}) if locations else {}

    return {
        "victim_name": victim_info.get("name", ""),
        "crime_type": crime_type,
        "location": crime_scene_loc.get("name", "Unknown location"),
    }


def _build_evidence_prompt(
    witness: dict[str, Any],
    evidence_id: str,
    witness_state: Any,
    case_data: dict[str, Any],
) -> tuple[str, str, str, int]:
    """Build prompt for evidence presentation. Returns (prompt, system, evidence_name, trust_delta)."""
    witness_id = witness.get("id", "")
    case_inner = case_data.get("case", case_data)
    evidence_name = evidence_id
    evidence_desc = ""
    witness_reaction = ""
    found = False
    for location in case_inner.get("locations", {}).values():
        if found:
            break
        for ev in location.get("hidden_evidence", []):
            if ev.get("id") == evidence_id:
                evidence_name = ev.get("name", evidence_id)
                evidence_desc = ev.get("description", "")
                reactions = ev.get("witness_reactions", {})
                witness_reaction = reactions.get(witness_id, "")
                found = True
                break

    is_first_time = witness_state.mark_evidence_shown(evidence_id)
    trust_delta = EVIDENCE_PRESENTATION_BONUS if is_first_time else 0
    witness_state.adjust_trust(trust_delta)

    witness_name = witness.get("name", "Unknown")

    reaction_section = ""
    if witness_reaction:
        reaction_section = f"""
== YOUR REACTION (you MUST convey this) ==
{witness_reaction}

Deliver this reaction in your own voice. You may add body language, pauses, or emotion, but the substance of what you say MUST match the reaction above.
"""
    else:
        reaction_section = """
React based on your personality and what you know about this type of evidence.
"""

    prompt = f"""You are {witness_name}. The Auror shows you evidence: "{evidence_name}".

Evidence description: {evidence_desc}

Your personality: {witness.get("personality", "")}
Your trust level: {witness_state.trust}/100
{reaction_section}
Respond in 2-4 sentences as {witness_name}. Stay in character. Never break the fourth wall."""

    system_prompt = build_witness_system_prompt(witness_name)
    return prompt, system_prompt, evidence_name, trust_delta


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
    """Handle evidence presentation to witness."""
    prompt, system_prompt, evidence_name, trust_delta = _build_evidence_prompt(
        witness, evidence_id, witness_state, case_data,
    )

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

    secrets_revealed, secret_texts = detect_secrets_in_response(
        witness_response, witness, witness_state
    )

    witness_state.add_conversation(
        question=f"What do you know about {evidence_name}?",
        response=witness_response,
        trust_delta=trust_delta,
    )

    state.update_witness_state(witness_state)
    save_slot_state(state, player_id, slot)

    return InterrogateResponse(
        response=witness_response,
        trust=witness_state.trust,
        trust_delta=trust_delta,
        secrets_revealed=secrets_revealed,
        secret_texts=secret_texts,
        updated_state=state.model_dump(mode="json"),
    )


async def _handle_programmatic_legilimency(
    body: InterrogateRequest,
    witness: dict[str, Any],
    state: PlayerState,
    witness_state: Any,
    llm_config: UserLLMConfig | None = None,
    slot: str = "autosave",
) -> InterrogateResponse:
    """Handle Legilimency with formula-based outcomes."""
    witness_name = witness.get("name", "the witness")
    witness_id = witness.get("id", "unknown")
    witness_personality = witness.get("personality")
    witness_background = witness.get("background")

    search_intent = extract_intent_from_input(body.question)
    attempts = witness_state.spell_attempts.get("legilimency", 0)

    success, success_rate, specificity_bonus, decline_penalty, success_roll = (
        calculate_legilimency_success(
            player_input=body.question,
            attempts_on_witness=attempts,
            witness_id=witness_id,
        )
    )

    # Detection chance (Occlumency-based)
    base_detection = 20
    occlumency_raw = witness.get("occlumency_skill", 0)
    occlumency_skill = 0 if isinstance(occlumency_raw, str) else int(occlumency_raw)
    skill_bonus = (occlumency_skill / 100) * 30
    detection_chance = base_detection + skill_bonus

    repeat_penalty = 0
    if witness_state.legilimency_detected:
        repeat_penalty = 20
        detection_chance += repeat_penalty

    detection_chance = min(95, detection_chance)
    detection_roll = random.random() * 100
    detected = detection_roll < detection_chance

    outcome = "success" if success else "failure"

    # Trust penalty
    trust_delta = 0
    if detected:
        trust_delta = -random.choice([5, 10, 15, 20])
        witness_state.legilimency_detected = True
        witness_state.adjust_trust(trust_delta)
    elif not success:
        trust_delta = -random.choice([5, 10])
        witness_state.adjust_trust(trust_delta)

    witness_state.spell_attempts["legilimency"] = attempts + 1

    logger.info(
        f"Legilimency: {witness_name} | Input: '{body.question}' | "
        f"Attempt #{attempts + 1} | "
        f"Success: {success_rate}% (30+{specificity_bonus}-{decline_penalty}) | "
        f"roll={success_roll:.1f} | {'SUCCESS' if success else 'FAILURE'} | "
        f"Detection: {detection_chance:.0f}% | roll={detection_roll:.1f} | "
        f"{'DETECTED' if detected else 'UNDETECTED'} | Trust: {trust_delta:+d}"
    )

    # Check for secrets revealed
    secrets_revealed: list[str] = []
    secret_texts: dict[str, str] = {}
    discovered_ids = list(state.discovered_evidence)

    if success and search_intent:
        secrets = witness.get("secrets", [])
        for secret in secrets:
            secret_id = secret.get("id", "")
            secret_text = secret.get("text", "")
            secret_keywords = secret.get("keywords", [])

            if secret_id and secret_id not in witness_state.secrets_revealed:
                keyword_match = detect_keyword_match(search_intent, secret_keywords)
                consecutive_match = detect_secret_by_consecutive_words(
                    search_intent, secret_text, window_size=5
                )
                if keyword_match or consecutive_match:
                    witness_state.reveal_secret(secret_id)
                    secrets_revealed.append(secret_id)
                    secret_texts[secret_id] = secret_text.strip()

    # Build narration prompt
    narration_prompt = build_legilimency_narration_prompt(
        outcome=outcome,
        detected=detected,
        witness_name=witness_name,
        witness_personality=witness_personality,
        witness_background=witness_background,
        search_intent=search_intent,
        available_evidence=[],
        discovered_evidence=discovered_ids,
        secrets_revealed=secrets_revealed,
        secret_texts=secret_texts,
    )

    try:
        client = get_client()
        system_prompt = build_spell_system_prompt()
        _key = llm_config.api_key if llm_config else None
        _model = llm_config.model if llm_config else None
        narrator_text = await client.get_response(
            narration_prompt,
            system=system_prompt,
            max_tokens=200,
            api_key=_key,
            model=_model,
        )
    except ClaudeClientError:
        if detected:
            narrator_text = (
                f"{witness_name}'s eyes widen. They sensed your intrusion. Trust damaged."
            )
        else:
            narrator_text = (
                f"You attempt to slip into {witness_name}'s mind, "
                "but their thoughts remain closed to you."
            )

    response_evidence = extract_evidence_from_response(narrator_text)
    for eid in response_evidence:
        if eid not in discovered_ids:
            state.add_evidence(eid)

    witness_state.add_conversation(
        question=f"[Legilimency: {search_intent or 'unfocused'}]",
        response=narrator_text,
        trust_delta=trust_delta,
    )

    state.update_witness_state(witness_state)
    save_slot_state(state, body.player_id, slot)

    return InterrogateResponse(
        response=narrator_text,
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

    case_context = _build_witness_case_context(case_data)

    prompt = build_witness_prompt(
        witness=witness,
        trust=witness_state.trust,
        discovered_evidence=state.discovered_evidence,
        conversation_history=witness_state.get_history_as_dicts(),
        player_input=body.question,
        case_context=case_context,
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

        secrets_revealed, _ = detect_secrets_in_response(full_response, witness, witness_state)

        trust_delta = adjust_trust(body.question, witness.get("personality", ""))
        witness_state.adjust_trust(trust_delta)
        witness_state.add_conversation(
            question=body.question,
            response=full_response,
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

        yield f"data: {json.dumps({'done': True, 'trust': witness_state.trust, 'secrets_revealed': secrets_revealed, 'updated_state': state.model_dump(mode='json'), 'meta': {'model': llm_config.model, 'latency_ms': llm_elapsed_ms}})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


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

    # Check for evidence presentation in question
    evidence_word = detect_evidence_presentation(body.question)
    if evidence_word:
        evidence_id = match_evidence_to_inventory(
            extracted_word=evidence_word,
            discovered_evidence=state.discovered_evidence,
            case_data=case_data,
        )
        if evidence_id and evidence_id in state.discovered_evidence:
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
        return await _handle_programmatic_legilimency(
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

    # Trust adjustment
    trust_delta = 0
    if spell_id:
        invasive_spells = {"prior_incantato", "specialis_revelio"}
        if spell_id in invasive_spells and witness_state.trust < 70:
            trust_delta = -5
    else:
        trust_delta = adjust_trust(body.question, witness.get("personality", ""))

    witness_state.adjust_trust(trust_delta)

    case_context = _build_witness_case_context(case_data)

    prompt = build_witness_prompt(
        witness=witness,
        trust=witness_state.trust,
        discovered_evidence=state.discovered_evidence,
        conversation_history=witness_state.get_history_as_dicts(),
        player_input=body.question,
        spell_id=spell_id,
        spell_outcome=spell_outcome,
        case_context=case_context,
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

    secrets_revealed, secret_texts = detect_secrets_in_response(
        witness_response, witness, witness_state
    )

    witness_state.add_conversation(
        question=body.question,
        response=witness_response,
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
        response=witness_response,
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

    prompt, system_prompt, evidence_name, trust_delta = _build_evidence_prompt(
        witness, body.evidence_id, witness_state, case_data,
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
                    "endpoint": "present_evidence_stream",
                    "error": str(e)[:200],
                    "model": llm_config.model,
                },
            )
            logger.error("LLM stream error in present_evidence: %s", e)
            yield f"data: {json.dumps({'error': 'An error occurred while processing your request.'})}\n\n"
            return

        llm_elapsed_ms = int((time.monotonic() - t0) * 1000)

        secrets_revealed, _ = detect_secrets_in_response(
            full_response, witness, witness_state
        )

        witness_state.add_conversation(
            question=f"What do you know about {evidence_name}?",
            response=full_response,
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

    return StreamingResponse(event_generator(), media_type="text/event-stream")


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
