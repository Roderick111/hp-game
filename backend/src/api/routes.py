"""FastAPI routes for investigation game.

Phase 1 endpoints:
- POST /api/investigate - Player input -> narrator response
- GET /api/load/{case_id} - Load game state
- POST /api/save - Save game state
- GET /api/evidence - List discovered evidence

Phase 2 endpoints:
- POST /api/interrogate - Question witness -> witness response
- POST /api/present-evidence - Present evidence to witness
- GET /api/witnesses - List available witnesses

Phase 3 endpoints:
- POST /api/submit-verdict - Submit verdict for case resolution
"""

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from src.api.claude_client import ClaudeClientError, get_client
from src.case_store.loader import (
    get_all_evidence,
    get_evidence_by_id,
    get_first_location_id,
    get_location,
    get_witness,
    list_locations,
    list_witnesses,
    load_case,
    load_confrontation,
    load_mentor_templates,
    load_solution,
    load_wrong_verdict_info,
)
from src.context.briefing import ask_moody_question
from src.context.mentor import (
    build_mentor_feedback,
    build_moody_feedback_llm,
    get_wrong_suspect_response,
)
from src.context.narrator import (
    build_narrator_or_spell_prompt,
    build_narrator_prompt,
    build_system_prompt,
)
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
from src.state.persistence import (
    delete_player_save,
    delete_state,
    list_player_saves,
    load_player_state,
    load_state,
    migrate_old_save,
    save_player_state,
    save_state,
)
from src.state.player_state import PlayerState, VerdictState
from src.utils.evidence import (
    check_already_discovered,
    extract_evidence_from_response,
    extract_flags_from_response,
    find_matching_evidence,
    find_not_present_response,
)
from src.utils.trust import (
    EVIDENCE_PRESENTATION_BONUS,
    adjust_trust,
    detect_evidence_presentation,
    match_evidence_to_inventory,
)
from src.verdict.evaluator import check_verdict, score_reasoning
from src.verdict.fallacies import detect_fallacies

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["game"])


# Request/Response models
class InvestigateRequest(BaseModel):
    """Request for investigate endpoint."""

    player_input: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Player's action/input (max 1000 chars, ~250 tokens)",
    )
    case_id: str = Field(
        default="case_001",
        max_length=64,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Case identifier",
    )
    location_id: str | None = Field(
        default=None,
        max_length=64,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Current location (optional, defaults to saved state or first location)",
    )
    player_id: str = Field(
        default="default",
        max_length=64,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Player identifier",
    )


class InvestigateResponse(BaseModel):
    """Response from investigate endpoint."""

    narrator_response: str = Field(..., description="LLM narrator response")
    new_evidence: list[str] = Field(
        default_factory=list, description="Newly discovered evidence IDs"
    )
    already_discovered: bool = Field(default=False, description="Was this already found?")


class SaveRequest(BaseModel):
    """Request for save endpoint."""

    player_id: str = Field(
        default="default",
        max_length=64,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Player identifier",
    )
    state: dict[str, Any] = Field(..., description="Player state to save")


class SaveResponse(BaseModel):
    """Response from save endpoint."""

    success: bool
    message: str
    slot: str | None = None


class EvidenceItem(BaseModel):
    """Evidence item in evidence list."""

    id: str
    found_at: str | None = None


class EvidenceDetailItem(BaseModel):
    """Evidence item with full metadata."""

    id: str
    name: str
    location_found: str
    description: str
    type: str


class EvidenceResponse(BaseModel):
    """Response from evidence endpoint."""

    case_id: str
    discovered_evidence: list[str]


class EvidenceDetailResponse(BaseModel):
    """Response with full evidence details."""

    case_id: str
    evidence: list[EvidenceDetailItem]


class StateResponse(BaseModel):
    """Response containing player state."""

    case_id: str
    current_location: str
    discovered_evidence: list[str]
    visited_locations: list[str]
    conversation_history: list[dict[str, Any]] = []


# Phase 2: Interrogation models
class InterrogateRequest(BaseModel):
    """Request for interrogate endpoint."""

    witness_id: str = Field(
        ...,
        min_length=1,
        max_length=64,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Witness identifier",
    )
    question: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Player's question (max 1000 chars, ~250 tokens)",
    )
    case_id: str = Field(
        default="case_001",
        max_length=64,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Case identifier",
    )
    player_id: str = Field(
        default="default",
        max_length=64,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Player identifier",
    )


class InterrogateResponse(BaseModel):
    """Response from interrogate endpoint."""

    response: str = Field(..., description="Witness response")
    trust: int = Field(..., description="Current trust level (0-100)")
    trust_delta: int = Field(default=0, description="Change in trust from this question")
    secrets_revealed: list[str] = Field(
        default_factory=list, description="Secrets revealed in this response"
    )
    secret_texts: dict[str, str] = Field(
        default_factory=dict, description="Secret ID to full text description mapping"
    )


class PresentEvidenceRequest(BaseModel):
    """Request for present-evidence endpoint."""

    witness_id: str = Field(
        ...,
        min_length=1,
        max_length=64,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Witness identifier",
    )
    evidence_id: str = Field(
        ...,
        min_length=1,
        max_length=64,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Evidence to present",
    )
    case_id: str = Field(
        default="case_001",
        max_length=64,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Case identifier",
    )
    player_id: str = Field(
        default="default",
        max_length=64,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Player identifier",
    )


class PresentEvidenceResponse(BaseModel):
    """Response from present-evidence endpoint."""

    response: str = Field(..., description="Witness response")
    secret_revealed: str | None = Field(default=None, description="Secret revealed (if any)")
    trust: int = Field(..., description="Current trust level")


class WitnessInfo(BaseModel):
    """Public witness information."""

    id: str
    name: str
    trust: int = Field(default=50, description="Current trust level")
    secrets_revealed: list[str] = Field(default_factory=list)
    conversation_history: list[dict[str, Any]] = Field(default_factory=list)
    personality: str | None = None


# Phase 3: Verdict models
class SubmitVerdictRequest(BaseModel):
    """Request for submit-verdict endpoint."""

    case_id: str = Field(
        default="case_001",
        max_length=64,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Case identifier",
    )
    player_id: str = Field(
        default="default",
        max_length=64,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Player identifier",
    )
    accused_suspect_id: str = Field(
        ...,
        min_length=1,
        max_length=64,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Suspect ID being accused",
    )
    reasoning: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Player's reasoning for accusation (max 2000 chars, ~500 tokens)",
    )
    evidence_cited: list[str] = Field(default_factory=list, description="Evidence IDs player cites")


class FallacyDetail(BaseModel):
    """Detailed fallacy information."""

    name: str
    description: str
    example: str = ""


class MentorFeedback(BaseModel):
    """Mentor feedback for verdict."""

    analysis: str
    fallacies_detected: list[FallacyDetail]
    score: int
    quality: str
    critique: str
    praise: str
    hint: str | None = None


class ConfrontationDialogue(BaseModel):
    """Confrontation dialogue after verdict."""

    dialogue: list[dict[str, str]]
    aftermath: str


class SubmitVerdictResponse(BaseModel):
    """Response from submit-verdict endpoint."""

    correct: bool
    attempts_remaining: int
    case_solved: bool
    mentor_feedback: MentorFeedback
    confrontation: ConfrontationDialogue | None = None
    reveal: str | None = None  # If wrong, what's the answer?
    wrong_suspect_response: str | None = None  # Pre-written response for wrong suspect


class ResetResponse(BaseModel):
    """Response for case reset endpoint."""

    success: bool
    message: str


# Phase 3.5: Briefing models
class TeachingChoice(BaseModel):
    """Single choice for teaching question."""

    id: str
    text: str
    response: str


class TeachingQuestion(BaseModel):
    """Teaching question with multiple choice answers."""

    prompt: str
    choices: list[TeachingChoice]
    concept_summary: str


class CaseDossier(BaseModel):
    """Structured case details for the briefing dossier."""

    title: str = "CLASSIFIED"
    victim: str
    location: str
    time: str
    status: str
    synopsis: str


class BriefingContent(BaseModel):
    """Briefing content from YAML."""

    case_id: str
    dossier: CaseDossier
    teaching_questions: list[TeachingQuestion]
    rationality_concept: str
    concept_description: str
    transition: str = ""
    briefing_completed: bool = False


class BriefingQuestionRequest(BaseModel):
    """Request for briefing question endpoint."""

    question: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Player's question for Moody (max 1000 chars, ~250 tokens)",
    )
    player_id: str = Field(
        default="default",
        max_length=64,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Player identifier",
    )


class BriefingQuestionResponse(BaseModel):
    """Response from briefing question endpoint."""

    answer: str = Field(..., description="Moody's response")


class BriefingCompleteResponse(BaseModel):
    """Response from briefing complete endpoint."""

    success: bool


# Phase 4: Inner Voice (Tom's Ghost) models
class InnerVoiceCheckRequest(BaseModel):
    """Request for inner voice check endpoint."""

    evidence_count: int = Field(..., ge=0, description="Current evidence count")


class InnerVoiceTriggerResponse(BaseModel):
    """Response from inner voice check endpoint (LEGACY YAML system)."""

    id: str = Field(..., description="Trigger ID")
    text: str = Field(..., description="Tom's message text")
    type: str = Field(..., description="Trigger type (helpful/misleading/etc.)")
    tier: int = Field(..., ge=1, le=3, description="Trigger tier (1/2/3)")


# Phase 4.1: Tom LLM-powered endpoints
class TomAutoCommentRequest(BaseModel):
    """Request for Tom auto-comment after evidence discovery."""

    is_critical: bool = Field(default=False, description="Force Tom to comment?")
    last_evidence_id: str | None = Field(
        default=None,
        max_length=64,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Evidence just discovered",
    )


class TomChatRequest(BaseModel):
    """Request for direct Tom conversation."""

    message: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Player's question to Tom (max 1000 chars, ~250 tokens)",
    )


class TomResponseModel(BaseModel):
    """Tom's response (LLM-powered)."""

    text: str = Field(..., description="Tom's comment/response")
    mode: str = Field(
        ..., description="Response mode: 'auto', 'direct_chat', 'helpful', 'misleading'"
    )
    trust_level: int = Field(..., ge=0, le=100, description="Current trust level (0-100)")


# ============================================================================
# Phase 5.3: Save Slot System models
# ============================================================================


class SaveSlotMetadata(BaseModel):
    """Metadata for a single save slot."""

    slot: str = Field(..., description="Slot identifier (slot_1, slot_2, slot_3, autosave)")
    case_id: str = Field(..., description="Case identifier (e.g., case_001)")
    timestamp: str | None = Field(None, description="Last save timestamp (ISO format)")
    location: str = Field(default="unknown", description="Current location in save")
    evidence_count: int = Field(default=0, description="Number of discovered evidence")
    witnesses_interrogated: int = Field(default=0, description="Number of witnesses interrogated")
    progress_percent: int = Field(default=0, ge=0, le=100, description="Progress percentage")
    version: str = Field(default="1.0.0", description="Save file version")


class SaveSlotsListResponse(BaseModel):
    """Response listing all save slots."""

    case_id: str
    saves: list[SaveSlotMetadata] = Field(default_factory=list)


class SaveSlotResponse(BaseModel):
    """Response from save/delete slot operations."""

    success: bool
    slot: str
    message: str | None = None


# ============================================================================
# Helper functions for investigate endpoint (refactored for readability)
# ============================================================================


def _resolve_location(
    request: InvestigateRequest,
    case_data: dict[str, Any],
) -> tuple[str, dict[str, Any]]:
    """Resolve and validate target location for investigation.

    Args:
        request: Investigation request
        case_data: Loaded case data

    Returns:
        Tuple of (location_id, location_data)

    Raises:
        HTTPException: If location not found or case has no locations
    """
    target_location_id = request.location_id
    all_locations = list_locations(case_data)
    location_ids = [loc["id"] for loc in all_locations]

    # Handle missing or legacy location IDs
    if not target_location_id or target_location_id == "library":
        if target_location_id == "library" and "library" in location_ids:
            pass  # Library exists, use it
        else:
            # Fallback to saved state or first location
            existing_state = load_state(request.case_id, request.player_id)
            if existing_state and existing_state.current_location:
                target_location_id = existing_state.current_location
            elif location_ids:
                target_location_id = location_ids[0]
            else:
                raise HTTPException(status_code=500, detail="Case has no locations")

    # Validate location exists in case
    if target_location_id not in location_ids:
        logger.warning(
            f"Invalid location '{target_location_id}' requested. "
            f"Falling back to default: {location_ids[0]}"
        )
        target_location_id = location_ids[0]

    # Load location data
    try:
        location = get_location(case_data, target_location_id)
        return target_location_id, location
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Location not found: {target_location_id}")


def _save_conversation_and_return(
    state: PlayerState,
    player_id: str,
    player_input: str,
    narrator_response: str,
    location_id: str,
    new_evidence: list[str],
    already_discovered: bool,
) -> InvestigateResponse:
    """Save conversation to state and return investigation response.

    Args:
        state: Player state to update
        player_id: Player identifier
        player_input: Player's input text
        narrator_response: Narrator's response text
        location_id: Current location ID
        new_evidence: List of newly discovered evidence IDs
        already_discovered: Whether this was already discovered

    Returns:
        InvestigateResponse with the results
    """
    state.add_conversation_message("player", player_input, location_id=location_id)
    state.add_conversation_message("narrator", narrator_response, location_id=location_id)
    state.add_narrator_conversation(player_input, narrator_response, location_id=location_id)
    save_state(state, player_id)
    return InvestigateResponse(
        narrator_response=narrator_response,
        new_evidence=new_evidence,
        already_discovered=already_discovered,
    )


def _check_spell_already_discovered(
    spell_id: str | None,
    player_input: str,
    hidden_evidence: list[dict[str, Any]],
    discovered_ids: list[str],
) -> str | None:
    """Check if spell targets already-discovered evidence.

    Args:
        spell_id: Detected spell ID (or None)
        player_input: Player's input text
        hidden_evidence: List of hidden evidence at location
        discovered_ids: List of already discovered evidence IDs

    Returns:
        Already-discovered response message, or None if not applicable
    """
    if not spell_id:
        return None

    if not check_already_discovered(player_input, hidden_evidence, discovered_ids):
        return None

    # Get spell name for natural response
    from backend.src.spells.definitions import get_spell

    spell_def = get_spell(spell_id)
    spell_name = spell_def.get("name") if spell_def else "the spell"
    return (
        f"You cast {spell_name}, but it reveals nothing new. "
        "The evidence has already given up its secrets."
    )


def _calculate_spell_outcome(
    spell_id: str,
    player_input: str,
    state: PlayerState,
) -> str:
    """Calculate spell success/failure and update attempt counter.

    Args:
        spell_id: Spell identifier
        player_input: Player's input text
        state: Player state (modified in-place)

    Returns:
        Spell outcome: "SUCCESS" or "FAILURE"
    """
    spell_key = spell_id.lower()
    location_key = state.current_location
    attempts = state.spell_attempts_by_location.get(location_key, {}).get(spell_key, 0)

    success = calculate_spell_success(
        spell_id=spell_key,
        player_input=player_input,
        attempts_in_location=attempts,
        location_id=location_key,
    )
    spell_outcome = "SUCCESS" if success else "FAILURE"

    logger.info(
        f"Spell Cast: {spell_id} | Input: '{player_input}' | "
        f"Attempt #{attempts + 1} @ {location_key} | Outcome: {spell_outcome}"
    )

    # Increment attempt counter
    if location_key not in state.spell_attempts_by_location:
        state.spell_attempts_by_location[location_key] = {}
    state.spell_attempts_by_location[location_key][spell_key] = attempts + 1

    return spell_outcome


def _find_witness_for_legilimency(
    target: str | None,
    case_data: dict[str, Any],
) -> dict[str, Any] | None:
    """Find witness data for Legilimency spell target.

    Args:
        target: Target name from spell detection
        case_data: Loaded case data

    Returns:
        Witness data dict, or None if not found
    """
    if not target:
        return None

    for _, witness_data in case_data.get("witnesses", {}).items():
        witness_name = witness_data.get("name", "")
        if target.lower() in witness_name.lower():
            return witness_data
    return None


def _process_spell_flags(
    narrator_response: str,
    spell_id: str | None,
    target: str | None,
    case_data: dict[str, Any],
    state: PlayerState,
) -> None:
    """Process spell outcome flags from narrator response.

    Args:
        narrator_response: LLM response text
        spell_id: Detected spell ID
        target: Spell target
        case_data: Loaded case data
        state: Player state (modified in-place)
    """
    flags = extract_flags_from_response(narrator_response)

    # Handle relationship damage from unauthorized Legilimency
    if "relationship_damaged" in flags and spell_id and target:
        for witness_id, witness_data in case_data.get("witnesses", {}).items():
            witness_name = witness_data.get("name", "")
            if target.lower() in witness_name.lower():
                base_trust = witness_data.get("base_trust", 50)
                witness_state = state.get_witness_state(witness_id, base_trust)
                witness_state.adjust_trust(-15)
                state.update_witness_state(witness_state)
                break

    # Handle mental strain (future feature)
    if "mental_strain" in flags:
        pass  # Future: player morale/health penalty


def _extract_new_evidence(
    matching_evidence: dict[str, Any] | None,
    narrator_response: str,
    discovered_ids: list[str],
    state: PlayerState,
) -> list[str]:
    """Extract newly discovered evidence from response.

    Args:
        matching_evidence: Pre-matched evidence from triggers
        narrator_response: LLM response text
        discovered_ids: Already discovered evidence IDs
        state: Player state (modified in-place)

    Returns:
        List of newly discovered evidence IDs
    """
    new_evidence: list[str] = []

    # Add pre-matched evidence
    if matching_evidence:
        evidence_id = matching_evidence["id"]
        if evidence_id not in discovered_ids:
            state.add_evidence(evidence_id)
            new_evidence.append(evidence_id)

    # Check for evidence tags in LLM response
    response_evidence = extract_evidence_from_response(narrator_response)
    for eid in response_evidence:
        if eid not in discovered_ids and eid not in new_evidence:
            state.add_evidence(eid)
            new_evidence.append(eid)

    return new_evidence


@router.post("/investigate", response_model=InvestigateResponse)
async def investigate(request: InvestigateRequest) -> InvestigateResponse:
    """Process player investigation action.

    Orchestrates: location resolution, evidence checks, spell processing,
    narrator response generation, and state updates.

    Args:
        request: Player input and context

    Returns:
        Narrator response and discovered evidence
    """
    # 1. Load case data
    try:
        case_data = load_case(request.case_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case not found: {request.case_id}")

    # 2. Resolve and validate location
    target_location_id, location = _resolve_location(request, case_data)
    request.location_id = target_location_id

    # 3. Load or create player state
    state = load_state(request.case_id, request.player_id)
    if state is None:
        state = PlayerState(case_id=request.case_id, current_location=request.location_id)

    # Update location if changed (history now per-location, not cleared)
    if state.current_location != request.location_id:
        state.current_location = request.location_id

    # 4. Extract location data
    location_desc = location.get("description", "")
    hidden_evidence = location.get("hidden_evidence", [])
    not_present = location.get("not_present", [])
    surface_elements = location.get("surface_elements", [])
    discovered_ids = state.discovered_evidence

    # 5. Detect spell cast
    spell_id, target = detect_spell_with_fuzzy(request.player_input)
    is_spell = spell_id is not None

    # 6. Handle already-discovered evidence (spell and non-spell)
    if is_spell:
        already_response = _check_spell_already_discovered(
            spell_id, request.player_input, hidden_evidence, discovered_ids
        )
        if already_response:
            return _save_conversation_and_return(
                state,
                request.player_id,
                request.player_input,
                already_response,
                target_location_id,
                [],
                True,
            )
    elif check_already_discovered(request.player_input, hidden_evidence, discovered_ids):
        already_response = "You've already examined this thoroughly. Nothing new to find here."
        return _save_conversation_and_return(
            state,
            request.player_id,
            request.player_input,
            already_response,
            target_location_id,
            [],
            True,
        )

    # 7. Check not_present items (hallucination prevention)
    not_present_response = find_not_present_response(request.player_input, not_present)
    if not_present_response:
        return _save_conversation_and_return(
            state,
            request.player_id,
            request.player_input,
            not_present_response,
            target_location_id,
            [],
            False,
        )

    # 8. Check for evidence triggers
    matching_evidence = find_matching_evidence(
        request.player_input, hidden_evidence, discovered_ids
    )

    # 9. Process spell mechanics (success calculation, witness context)
    spell_outcome: str | None = None
    witness_context: dict[str, Any] | None = None

    if is_spell and spell_id:
        if spell_id.lower() in SAFE_INVESTIGATION_SPELLS:
            spell_outcome = _calculate_spell_outcome(spell_id, request.player_input, state)

        if spell_id.lower() == "legilimency":
            witness_context = _find_witness_for_legilimency(target, case_data)

    # 10. Build prompt and get narrator response
    if is_spell:
        prompt, system_prompt, _ = build_narrator_or_spell_prompt(
            location_desc=location_desc,
            hidden_evidence=hidden_evidence,
            discovered_ids=discovered_ids,
            not_present=not_present,
            player_input=request.player_input,
            surface_elements=surface_elements,
            conversation_history=state.get_narrator_history_as_dicts(
                location_id=target_location_id
            ),
            spell_contexts=location.get("spell_contexts"),
            witness_context=witness_context,
            spell_outcome=spell_outcome,
        )
    else:
        prompt = build_narrator_prompt(
            location_desc=location_desc,
            hidden_evidence=hidden_evidence,
            discovered_ids=discovered_ids,
            not_present=not_present,
            player_input=request.player_input,
            surface_elements=surface_elements,
            conversation_history=state.get_narrator_history_as_dicts(
                location_id=target_location_id
            ),
        )
        system_prompt = build_system_prompt()

    try:
        client = get_client()
        narrator_response = await client.get_response(prompt, system=system_prompt)
    except ClaudeClientError as e:
        raise HTTPException(status_code=503, detail=f"LLM service error: {e}")

    # 11. Extract and save new evidence
    new_evidence = _extract_new_evidence(
        matching_evidence, narrator_response, discovered_ids, state
    )

    # 12. Process spell flags (trust penalties, etc.)
    if is_spell:
        _process_spell_flags(narrator_response, spell_id, target, case_data, state)

    # 13. Save and return
    return _save_conversation_and_return(
        state,
        request.player_id,
        request.player_input,
        narrator_response,
        target_location_id,
        new_evidence,
        False,
    )


@router.post("/save", response_model=SaveResponse)
async def save_game(
    request: SaveRequest,
    slot: str = Query(
        default="default",
        description="Save slot: slot_1, slot_2, slot_3, autosave, default",
    ),
) -> SaveResponse:
    """Save player game state to specific slot.

    Phase 5.3: Added slot parameter for multi-slot save system.

    Args:
        request: Player ID and state data
        slot: Save slot (slot_1, slot_2, slot_3, autosave, default)

    Returns:
        Success status with slot info
    """
    try:
        case_id = request.state.get("case_id", "case_001")

        # Load existing state to preserve conversation_history
        # Use slot-aware loading for non-default slots
        if slot == "default":
            existing_state = load_state(case_id, request.player_id)
        else:
            existing_state = load_player_state(case_id, request.player_id, slot)

        if existing_state:
            # Update existing state with new data, preserve conversation_history
            state = existing_state
            state.current_location = request.state.get("current_location", state.current_location)
            state.discovered_evidence = request.state.get(
                "discovered_evidence", state.discovered_evidence
            )
            state.visited_locations = request.state.get(
                "visited_locations", state.visited_locations
            )
            # conversation_history preserved from existing_state
        else:
            # New state, create from request
            state = PlayerState(**request.state)

        # Use slot-aware saving for non-default slots
        if slot == "default":
            save_state(state, request.player_id)
        else:
            success = save_player_state(case_id, request.player_id, state, slot)
            if not success:
                return SaveResponse(success=False, message=f"Failed to save to slot {slot}", slot=slot)

        return SaveResponse(success=True, message=f"Saved to {slot}", slot=slot)
    except ValueError as e:
        return SaveResponse(success=False, message=str(e), slot=slot)
    except Exception as e:
        return SaveResponse(success=False, message=f"Failed to save: {e}", slot=slot)


@router.get("/load/{case_id}", response_model=StateResponse | None)
async def load_game(
    case_id: str,
    player_id: str = Query(default="default", description="Player identifier"),
    slot: str = Query(
        default="default",
        description="Save slot: slot_1, slot_2, slot_3, autosave, default",
    ),
    location_id: str | None = Query(default=None, description="Current location context"),
) -> StateResponse | None:
    """Load player game state from specific slot.

    Phase 5.3: Added slot parameter for multi-slot save system.

    Args:
        case_id: Case identifier
        player_id: Player identifier (query param)
        slot: Save slot (slot_1, slot_2, slot_3, autosave, default)
        location_id: Optional location ID to get specific history for

    Returns:
        Player state or None if not found

    Raises:
        HTTPException 400: If save file is corrupted
    """
    try:
        # Use slot-aware loading for non-default slots
        if slot == "default":
            state = load_state(case_id, player_id)
        else:
            state = load_player_state(case_id, player_id, slot)

        if state is None:
            return None

        # Determine which history to return
        # If location_id provided (frontend context), use that
        # Otherwise fall back to saved current_location
        target_loc = location_id or state.current_location

        return StateResponse(
            case_id=state.case_id,
            current_location=state.current_location,
            discovered_evidence=state.discovered_evidence,
            visited_locations=state.visited_locations,
            # Phase 5.6: Return location-specific history if available, fall back to global
            conversation_history=state.location_chat_history.get(target_loc, []),
        )
    except ValueError as e:
        # Corrupted save file
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/state/{case_id}")
async def delete_game(case_id: str, player_id: str = "default") -> dict[str, bool]:
    """Delete player game state.

    Args:
        case_id: Case identifier
        player_id: Player identifier (query param)

    Returns:
        Success status
    """
    result = delete_state(case_id, player_id)
    return {"deleted": result}


@router.post("/case/{case_id}/reset", response_model=ResetResponse)
async def reset_case(case_id: str, player_id: str = "default") -> ResetResponse:
    """Reset case progress (delete saved state).

    Args:
        case_id: Case identifier (path param)
        player_id: Player identifier (query param)

    Returns:
        Success status and message
    """
    # Delete default slot (active state)
    deleted_default = delete_state(case_id, player_id)

    # Also delete autosave to prevent "zombie" state resurrection
    deleted_autosave = delete_player_save(case_id, player_id, "autosave")

    if deleted_default or deleted_autosave:
        return ResetResponse(
            success=True,
            message=f"Case {case_id} reset successfully (active + autosave cleared).",
        )
    else:
        return ResetResponse(
            success=False,
            message=f"No active progress found for case {case_id}.",
        )


# ============================================================================
# Phase 5.3: Save Slot System Endpoints
# ============================================================================


@router.get("/case/{case_id}/saves/list", response_model=SaveSlotsListResponse)
async def list_saves_endpoint(
    case_id: str,
    player_id: str = Query(default="default", description="Player identifier"),
) -> SaveSlotsListResponse:
    """List all save slots with metadata for a player.

    Returns metadata for all existing save slots (slot_1, slot_2, slot_3, autosave).
    Automatically migrates old saves to autosave slot on first access.

    Args:
        case_id: Case identifier (path param)
        player_id: Player identifier (query param)

    Returns:
        SaveSlotsListResponse with list of slot metadata
    """
    # Auto-migrate old saves on first access
    migrate_old_save(case_id, player_id)

    # Get all save slots with metadata
    saves_data = list_player_saves(case_id, player_id)

    # Convert to response model
    saves = [
        SaveSlotMetadata(
            slot=s["slot"],
            case_id=s.get("case_id", case_id),
            timestamp=s.get("timestamp"),
            location=s.get("location", "unknown"),
            evidence_count=s.get("evidence_count", 0),
            witnesses_interrogated=s.get("witnesses_interrogated", 0),
            progress_percent=s.get("progress_percent", 0),
            version=s.get("version", "1.0.0"),
        )
        for s in saves_data
    ]

    return SaveSlotsListResponse(case_id=case_id, saves=saves)


@router.delete("/case/{case_id}/saves/{slot}", response_model=SaveSlotResponse)
async def delete_save_slot_endpoint(
    case_id: str,
    slot: str,
    player_id: str = Query(default="default", description="Player identifier"),
) -> SaveSlotResponse:
    """Delete a specific save slot.

    Args:
        case_id: Case identifier (path param)
        slot: Save slot to delete (slot_1, slot_2, slot_3, autosave)
        player_id: Player identifier (query param)

    Returns:
        SaveSlotResponse with success status

    Raises:
        HTTPException 404: If slot not found
        HTTPException 400: If invalid slot name
    """
    # Validate slot
    valid_slots = {"slot_1", "slot_2", "slot_3", "autosave"}
    if slot not in valid_slots:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid slot: {slot}. Must be one of: {', '.join(valid_slots)}",
        )

    success = delete_player_save(case_id, player_id, slot)

    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"Save slot '{slot}' not found for case {case_id}",
        )

    return SaveSlotResponse(
        success=True,
        slot=slot,
        message=f"Deleted save slot {slot}",
    )


@router.get("/evidence", response_model=EvidenceResponse)
async def get_evidence(
    case_id: str = "case_001",
    player_id: str = "default",
) -> EvidenceResponse:
    """Get list of discovered evidence.

    Args:
        case_id: Case identifier
        player_id: Player identifier

    Returns:
        List of discovered evidence IDs
    """
    state = load_state(case_id, player_id)

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
) -> EvidenceDetailResponse:
    """Get detailed evidence info for discovered evidence.

    Returns full metadata (name, description, location) for each discovered evidence.

    Args:
        case_id: Case identifier
        location_id: Location identifier
        player_id: Player identifier

    Returns:
        List of evidence with full metadata
    """
    try:
        case_data = load_case(case_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case not found: {case_id}")

    state = load_state(case_id, player_id)
    discovered_ids = state.discovered_evidence if state else []

    # Get all evidence from location
    all_evidence = get_all_evidence(case_data, location_id)

    # Filter to only discovered evidence and convert to response model
    discovered_evidence = []
    for evidence in all_evidence:
        if evidence["id"] in discovered_ids:
            discovered_evidence.append(
                EvidenceDetailItem(
                    id=evidence["id"],
                    name=evidence["name"],
                    location_found=evidence["location_found"],
                    description=evidence["description"],
                    type=evidence["type"],
                )
            )

    return EvidenceDetailResponse(case_id=case_id, evidence=discovered_evidence)


@router.get("/evidence/{evidence_id}")
async def get_single_evidence(
    evidence_id: str,
    case_id: str = "case_001",
    location_id: str | None = None,
    player_id: str = "default",
) -> EvidenceDetailItem:
    """Get single evidence item with full metadata.

    Args:
        evidence_id: Evidence identifier
        case_id: Case identifier
        location_id: Location identifier
        player_id: Player identifier

    Returns:
        Evidence with full metadata

    Raises:
        404: If evidence not found or not discovered
    """
    try:
        case_data = load_case(case_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case not found: {case_id}")

    state = load_state(case_id, player_id)
    discovered_ids = state.discovered_evidence if state else []

    # Check if evidence is discovered
    if evidence_id not in discovered_ids:
        raise HTTPException(
            status_code=404,
            detail=f"Evidence not discovered: {evidence_id}",
        )

    # Get evidence details
    evidence = get_evidence_by_id(case_data, location_id, evidence_id)
    if not evidence:
        raise HTTPException(
            status_code=404,
            detail=f"Evidence not found: {evidence_id}",
        )

    return EvidenceDetailItem(
        id=evidence["id"],
        name=evidence["name"],
        location_found=evidence["location_found"],
        description=evidence["description"],
        type=evidence["type"],
    )


class CaseListResponse(BaseModel):
    """Response from GET /api/cases endpoint."""

    cases: list[dict[str, Any]] = Field(default_factory=list, description="List of case metadata")
    count: int = Field(default=0, description="Number of valid cases")
    errors: list[str] | None = Field(default=None, description="Validation errors (if any)")


@router.get("/cases", response_model=CaseListResponse)
async def list_cases_endpoint() -> CaseListResponse:
    """List all available cases with metadata.

    Phase 5.4: Enhanced to return CaseMetadata[] instead of string[].

    Scans case_store/*.yaml, validates each case, and returns metadata.
    Handles malformed YAML gracefully (logs warning, continues with valid cases).

    Returns:
        CaseListResponse with:
        - cases: List of case metadata (id, title, difficulty, description)
        - count: Number of valid cases discovered
        - errors: List of validation/parse errors (null if none)

    Raises:
        HTTPException 500: If case discovery completely fails
    """
    from src.case_store.loader import list_cases_with_metadata

    try:
        cases, errors = list_cases_with_metadata()

        return CaseListResponse(
            cases=[case.model_dump() for case in cases],
            count=len(cases),
            errors=errors if errors else None,
        )
    except Exception as e:
        logger.error(f"Case discovery failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to load cases")


@router.get("/case/{case_id}/location/{location_id}")
async def get_location_info(case_id: str, location_id: str) -> dict[str, Any]:
    """Get location information (for initial load).

    Args:
        case_id: Case identifier
        location_id: Location identifier

    Returns:
        Location description, surface elements, and witnesses (no hidden evidence)
    """
    try:
        case_data = load_case(case_id)
        location = get_location(case_data, location_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case not found: {case_id}")
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Location not found: {location_id}")

    return {
        "id": location.get("id", location_id),
        "name": location.get("name", "Unknown Location"),
        "description": location.get("description", ""),
        "surface_elements": location.get("surface_elements", []),
        "witnesses_present": location.get("witnesses_present", []),
    }


# ============================================================================
# Phase 5.2: Location Management endpoints
# ============================================================================


class LocationInfo(BaseModel):
    """Location metadata for LocationSelector."""

    id: str
    name: str
    type: str = "micro"


class ChangeLocationRequest(BaseModel):
    """Request for change-location endpoint."""

    location_id: str = Field(
        ...,
        min_length=1,
        max_length=64,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Target location ID",
    )
    player_id: str = Field(
        default="default",
        max_length=64,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Player identifier",
    )


class ChangeLocationResponse(BaseModel):
    """Response from change-location endpoint."""

    success: bool
    location: dict[str, Any]


@router.get("/case/{case_id}/locations", response_model=list[LocationInfo])
async def get_locations(case_id: str) -> list[LocationInfo]:
    """Get all locations for LocationSelector.

    Args:
        case_id: Case identifier

    Returns:
        List of location metadata (id, name, type)

    Raises:
        HTTPException 404: If case not found
    """
    try:
        case_data = load_case(case_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case not found: {case_id}")

    locations = list_locations(case_data)
    return [LocationInfo(**loc) for loc in locations]


@router.post("/case/{case_id}/change-location", response_model=ChangeLocationResponse)
async def change_location(case_id: str, request: ChangeLocationRequest) -> ChangeLocationResponse:
    """Change player location, clear narrator history.

    1. Validate case and location exist
    2. Load or create player state
    3. Call visit_location() and clear_narrator_conversation()
    4. Save state
    5. Return location data

    Args:
        case_id: Case identifier (path param)
        request: Target location and player ID

    Returns:
        Success status and location metadata

    Raises:
        HTTPException 404: If case or location not found
    """
    # Load case and validate location
    try:
        case_data = load_case(case_id)
        location = get_location(case_data, request.location_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case not found: {case_id}")
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Location not found: {request.location_id}")

    # Load or create player state
    state = load_state(case_id, request.player_id)
    if state is None:
        state = PlayerState(case_id=case_id, current_location=request.location_id)

    # Change location (Phase 5.6: No longer clearing global history)
    state.visit_location(request.location_id)

    # Save state
    save_state(state, request.player_id)

    return ChangeLocationResponse(
        success=True,
        location={
            "id": location.get("id", request.location_id),
            "name": location.get("name", "Unknown Location"),
            "description": location.get("description", ""),
            "surface_elements": location.get("surface_elements", []),
            "witnesses_present": location.get("witnesses_present", []),
        },
    )


# Phase 2: Witness interrogation endpoints


@router.post("/interrogate", response_model=InterrogateResponse)
async def interrogate_witness(request: InterrogateRequest) -> InterrogateResponse:
    """Interrogate a witness with a question.

    1. Load case and witness data
    2. Check for evidence presentation in question
    3. Adjust trust based on question tone
    4. Build witness prompt (isolated from narrator)
    5. Get Claude response as witness character
    6. Check for triggered secrets
    7. Update and save state

    Args:
        request: Witness ID, question, and context

    Returns:
        Witness response, trust level, and any secrets revealed
    """
    # Load case data
    try:
        case_data = load_case(request.case_id)
        witness = get_witness(case_data, request.witness_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case not found: {request.case_id}")
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Witness not found: {request.witness_id}")

    # Load or create player state
    state = load_state(request.case_id, request.player_id)
    if state is None:
        first_location = get_first_location_id(case_data)
        state = PlayerState(case_id=request.case_id, current_location=first_location)

    # Get or create witness state with base_trust from YAML
    base_trust = witness.get("base_trust", 50)
    witness_state = state.get_witness_state(request.witness_id, base_trust)

    # Check if question contains evidence presentation
    evidence_word = detect_evidence_presentation(request.question)

    if evidence_word:
        # Fuzzy match to actual evidence ID
        evidence_id = match_evidence_to_inventory(
            extracted_word=evidence_word,
            discovered_evidence=state.discovered_evidence,
            case_data=case_data,
        )

        if evidence_id and evidence_id in state.discovered_evidence:
            # Redirect to present-evidence flow
            return await _handle_evidence_presentation(
                witness=witness,
                evidence_id=evidence_id,
                state=state,
                witness_state=witness_state,
                player_id=request.player_id,
                case_data=case_data,
            )

    # Phase 4.6.2: Single-stage fuzzy + semantic phrase detection for all spells
    spell_id, target = detect_spell_with_fuzzy(request.question)
    spell_outcome: str | None = None
    spell_success: bool = False

    if spell_id == "legilimency":
        # Phase 4.6.2: Programmatic Legilimency outcomes
        return await _handle_programmatic_legilimency(
            request=request,
            witness=witness,
            state=state,
            witness_state=witness_state,
        )
    elif spell_id and spell_id in SAFE_INVESTIGATION_SPELLS:
        # Phase 5.7: Safe spells allowed in witness interrogation
        # Calculate spell success (same logic as narrator)
        spell_key = spell_id.lower()
        attempts = witness_state.spell_attempts.get(spell_key, 0)

        # Calculate success with diminishing returns per attempt
        spell_success = calculate_spell_success(
            spell_id=spell_key,
            player_input=request.question,
            attempts_in_location=attempts,
            location_id=f"witness_{request.witness_id}",  # Use witness ID as location
        )
        spell_outcome = "SUCCESS" if spell_success else "FAILURE"

        # Increment attempt counter
        witness_state.spell_attempts[spell_key] = attempts + 1

        logger.info(
            f"🪄 Spell Cast on Witness: {spell_id} | Witness: {request.witness_id} | "
            f"Attempt #{attempts + 1} | Outcome: {spell_outcome}"
        )

    # Adjust trust based on question tone (or spell invasiveness)
    trust_delta = 0
    if spell_id:
        # Trust penalty for invasive spells on low-trust witnesses
        invasive_spells = {"prior_incantato", "specialis_revelio"}
        if spell_id in invasive_spells and witness_state.trust < 70:
            trust_delta = -5
            logger.info(f"Trust penalty: {trust_delta} for casting {spell_id} at low trust")
        # No penalty for cooperative witnesses or neutral spells
    else:
        # Normal trust adjustment for non-spell questions
        trust_delta = adjust_trust(request.question, witness.get("personality", ""))

    witness_state.adjust_trust(trust_delta)

    # Extract basic case context (public knowledge)
    victim_info = case_data.get("victim", {})

    # Get simplified crime type from cause_of_death
    cause_of_death = victim_info.get("cause_of_death", "")
    crime_type = cause_of_death.split()[0] if cause_of_death else "Victim found"

    # Get first location as crime scene (where investigation starts)
    locations = case_data.get("locations", {})
    crime_scene_loc = next(iter(locations.values()), {}) if locations else {}

    case_context = {
        "victim_name": victim_info.get("name", ""),
        "crime_type": crime_type,
        "location": crime_scene_loc.get("name", "Unknown location"),
    }

    # Build witness prompt (isolated context)
    prompt = build_witness_prompt(
        witness=witness,
        trust=witness_state.trust,
        discovered_evidence=state.discovered_evidence,
        conversation_history=witness_state.get_history_as_dicts(),
        player_input=request.question,
        spell_id=spell_id,
        spell_outcome=spell_outcome,
        case_context=case_context,
    )

    # Get Claude response
    try:
        client = get_client()
        system_prompt = build_witness_system_prompt(witness.get("name", "Unknown"))
        witness_response = await client.get_response(prompt, system=system_prompt)
    except ClaudeClientError as e:
        raise HTTPException(status_code=503, detail=f"LLM service error: {e}")

    # TEMPORARILY DISABLED: Automatic secret detection
    # TODO: Implement proper detection (multi-word consecutive or semantic similarity)
    # Let conversation be natural without false positives
    secrets_revealed: list[str] = []
    all_secrets = witness.get("secrets", [])
    #
    # for secret in all_secrets:
    #     secret_id = secret.get("id", "")
    #     if secret_id and secret_id not in witness_state.secrets_revealed:
    #         # Check if secret content appears in response (LLM chose to reveal)
    #         secret_text = secret.get("text", "").lower()
    #         if any(phrase in witness_response.lower() for phrase in secret_text.split()[:3]):
    #             witness_state.reveal_secret(secret_id)
    #             secrets_revealed.append(secret_id)

    # Add to conversation history
    witness_state.add_conversation(
        question=request.question,
        response=witness_response,
        trust_delta=trust_delta,
    )

    # Build secret_texts dict for revealed secrets
    secret_texts: dict[str, str] = {}
    for secret in all_secrets:
        secret_id = secret.get("id", "")
        if secret_id in secrets_revealed:
            secret_texts[secret_id] = secret.get("text", "").strip()

    # Save updated state
    state.update_witness_state(witness_state)
    save_state(state, request.player_id)

    return InterrogateResponse(
        response=witness_response,
        trust=witness_state.trust,
        trust_delta=trust_delta,
        secrets_revealed=secrets_revealed,
        secret_texts=secret_texts,
    )


async def _handle_evidence_presentation(
    witness: dict[str, Any],
    evidence_id: str,
    state: PlayerState,
    witness_state: Any,
    player_id: str,
    case_data: dict[str, Any],
) -> InterrogateResponse:
    """Handle evidence presentation to witness.

    Trust bonus only given first time evidence shown to this witness.
    Phase 5.5+: One-time bonus logic.

    Args:
        witness: Witness data dict
        evidence_id: Evidence ID being presented
        state: Player state
        witness_state: Current witness state
        player_id: Player ID for saving
        case_data: Full case data for evidence lookup

    Returns:
        Interrogate response with witness reaction
    """
    # Get evidence details from case data
    evidence_name = evidence_id
    evidence_desc = ""
    for location in case_data.get("locations", {}).values():
        for ev in location.get("hidden_evidence", []):
            if ev.get("id") == evidence_id:
                evidence_name = ev.get("name", evidence_id)
                evidence_desc = ev.get("description", "")
                break

    # Check if evidence already shown to this witness (one-time bonus)
    is_first_time = witness_state.mark_evidence_shown(evidence_id)

    # Calculate trust delta (bonus only first time)
    trust_delta = EVIDENCE_PRESENTATION_BONUS if is_first_time else 0
    witness_state.adjust_trust(trust_delta)

    witness_name = witness.get("name", "Unknown")

    # Build prompt with evidence context
    prompt = f"""You are {witness_name}. The Auror shows you {evidence_name}.

Evidence description: {evidence_desc}

How do you respond? Stay in character. Consider:
- Your personality: {witness.get("personality", "")}
- Your knowledge about this evidence
- Your trust level: {witness_state.trust}/100
- What you're hiding (your secrets)

Respond naturally in 2-4 sentences as {witness_name}:"""

    # Get Claude response
    try:
        client = get_client()
        system_prompt = build_witness_system_prompt(witness_name)
        witness_response = await client.get_response(prompt, system=system_prompt)
    except ClaudeClientError as e:
        raise HTTPException(status_code=503, detail=f"LLM service error: {e}")

    # Check for secret revelation (LLM may have naturally revealed)
    secrets_revealed: list[str] = []
    all_secrets = witness.get("secrets", [])

    for secret in all_secrets:
        secret_id = secret.get("id", "")
        if secret_id and secret_id not in witness_state.secrets_revealed:
            secret_text = secret.get("text", "").lower()
            if any(phrase in witness_response.lower() for phrase in secret_text.split()[:3]):
                witness_state.reveal_secret(secret_id)
                secrets_revealed.append(secret_id)

    # Add to conversation history
    witness_state.add_conversation(
        question=f"[SHOWED EVIDENCE: {evidence_name}]",
        response=witness_response,
        trust_delta=trust_delta,
    )

    # Build secret_texts dict
    secret_texts: dict[str, str] = {}
    for secret in all_secrets:
        secret_id = secret.get("id", "")
        if secret_id in secrets_revealed:
            secret_texts[secret_id] = secret.get("text", "").strip()

    # Save updated state
    state.update_witness_state(witness_state)
    save_state(state, player_id)

    return InterrogateResponse(
        response=witness_response,
        trust=witness_state.trust,
        trust_delta=trust_delta,
        secrets_revealed=secrets_revealed,
        secret_texts=secret_texts,
    )


async def _handle_programmatic_legilimency(
    request: InterrogateRequest,
    witness: dict[str, Any],
    state: PlayerState,
    witness_state: Any,
) -> InterrogateResponse:
    """Handle Legilimency with formula-based outcomes (Phase 4.8).

    Formula-based system:
    - Success: 30% base + 30% intent bonus - 10% per attempt, floor 10%
    - Detection: 20% + (occlumency_skill/100)*30% + 20% if repeat
    - Trust: random.choice([5,10,15,20]) if detected, 0 if undetected

    Args:
        request: Interrogate request with player's question
        witness: Witness data dict
        state: Player state
        witness_state: Witness-specific state

    Returns:
        InterrogateResponse with LLM-narrated programmatic outcome
    """
    import random

    witness_name = witness.get("name", "the witness")
    witness_id = witness.get("id", "unknown")
    witness_personality = witness.get("personality")
    witness_background = witness.get("background")

    # Extract intent from input
    search_intent = extract_intent_from_input(request.question)

    # Get attempt count for decline penalty
    attempts = witness_state.spell_attempts.get("legilimency", 0)

    # Calculate success (30% base + specificity - decline, floor 10%)
    success, success_rate, specificity_bonus, decline_penalty, success_roll = (
        calculate_legilimency_success(
            player_input=request.question,
            attempts_on_witness=attempts,
            witness_id=witness_id,
        )
    )

    # Calculate detection chance (Occlumency-based)
    base_detection = 20
    # Handle occlumency_skill: could be int or string "none"
    occlumency_raw = witness.get("occlumency_skill", 0)
    if isinstance(occlumency_raw, str):
        occlumency_skill = 0  # "none" or invalid string -> 0
    else:
        occlumency_skill = int(occlumency_raw)
    skill_bonus = (occlumency_skill / 100) * 30

    detection_chance = base_detection + skill_bonus

    # Repeat invasion penalty (+20% if previously detected)
    repeat_penalty = 0
    if witness_state.legilimency_detected:
        repeat_penalty = 20
        detection_chance += repeat_penalty

    # Cap at 95%
    detection_chance = min(95, detection_chance)

    # Roll detection
    detection_roll = random.random() * 100
    detected = detection_roll < detection_chance

    # Determine outcome
    outcome = "success" if success else "failure"

    # Apply trust penalty
    trust_delta = 0
    if detected:
        trust_delta = -random.choice([5, 10, 15, 20])  # Big penalty: caught red-handed
        witness_state.legilimency_detected = True  # Set flag
        witness_state.adjust_trust(trust_delta)
    elif not success:
        trust_delta = -random.choice(
            [5, 10]
        )  # Medium penalty: felt intrusion attempt, didn't catch you
        witness_state.adjust_trust(trust_delta)
    # else: success + undetected = 0 trust penalty (clean infiltration)

    # Track attempts (increment BEFORE logging so attempt #1 shows correctly)
    witness_state.spell_attempts["legilimency"] = attempts + 1

    # Debug logging (visible in uvicorn terminal)
    success_str = "SUCCESS" if success else "FAILURE"
    detect_str = "DETECTED" if detected else "UNDETECTED"
    logger.info(
        f"Legilimency: {witness_name} | Input: '{request.question}' | "
        f"Attempt #{attempts + 1} | "
        f"Success: {success_rate}% (30+{specificity_bonus}-{decline_penalty}) | "
        f"roll={success_roll:.1f} | {success_str} | "
        f"Detection: {detection_chance:.0f}% | roll={detection_roll:.1f} | "
        f"{detect_str} | Trust: {trust_delta:+d}"
    )

    # Load available evidence (witness secrets, not location evidence)
    # For Legilimency, we pass witness secrets as "evidence" for narrative purposes
    available_evidence: list[dict[str, Any]] = []
    discovered_ids = list(state.discovered_evidence)

    # Check for secrets revealed (keyword matching) - BEFORE narration so LLM can incorporate them
    secrets_revealed: list[str] = []
    secret_texts: dict[str, str] = {}

    if success and search_intent:
        # Check if search_intent matches any secret keywords
        secrets = witness.get("secrets", [])
        for secret in secrets:
            secret_id = secret.get("id", "")
            secret_text = secret.get("text", "")
            secret_keywords = secret.get("keywords", [])

            if secret_id and secret_id not in witness_state.secrets_revealed:
                # Check if search intent matches secret keywords
                intent_lower = search_intent.lower()
                keyword_match = any(kw.lower() in intent_lower for kw in secret_keywords)
                text_match = any(
                    word.lower() in intent_lower for word in secret_text.lower().split()[:5]
                )

                if keyword_match or text_match:
                    witness_state.reveal_secret(secret_id)
                    secrets_revealed.append(secret_id)
                    secret_texts[secret_id] = secret_text.strip()

    # Build narration prompt (Phase 4.8: 2 outcomes with secrets)
    narration_prompt = build_legilimency_narration_prompt(
        outcome=outcome,
        detected=detected,
        witness_name=witness_name,
        witness_personality=witness_personality,
        witness_background=witness_background,
        search_intent=search_intent,
        available_evidence=available_evidence,
        discovered_evidence=discovered_ids,
        secrets_revealed=secrets_revealed,
        secret_texts=secret_texts,
    )

    # Get LLM narration
    try:
        client = get_client()
        system_prompt = build_spell_system_prompt()
        narrator_text = await client.get_response(
            narration_prompt,
            system=system_prompt,
            max_tokens=200,  # Limit: 3 paragraphs (~150-225 tokens) + buffer
        )
    except ClaudeClientError:
        # Template fallback on LLM error
        if detected:
            narrator_text = (
                f"{witness_name}'s eyes widen. They sensed your intrusion. Trust damaged."
            )
        else:
            narrator_text = (
                f"You attempt to slip into {witness_name}'s mind, "
                "but their thoughts remain closed to you."
            )

    # Extract evidence from [EVIDENCE: id] tags (like other spells)
    response_evidence = extract_evidence_from_response(narrator_text)
    for eid in response_evidence:
        if eid not in discovered_ids:
            state.add_evidence(eid)

    # Add to conversation history
    witness_state.add_conversation(
        question=f"[Legilimency: {search_intent or 'unfocused'}]",
        response=narrator_text,
        trust_delta=trust_delta,
    )

    # Save state
    state.update_witness_state(witness_state)
    save_state(state, request.player_id)

    return InterrogateResponse(
        response=narrator_text,
        trust=witness_state.trust,
        trust_delta=trust_delta,
        secrets_revealed=secrets_revealed,
        secret_texts=secret_texts,
    )


@router.post("/present-evidence", response_model=PresentEvidenceResponse)
async def present_evidence(request: PresentEvidenceRequest) -> PresentEvidenceResponse:
    """Present evidence to a witness.

    Explicit endpoint for presenting evidence (vs detection in question text).

    Args:
        request: Witness ID, evidence ID, and context

    Returns:
        Witness response and any secret revealed
    """
    # Load case data
    try:
        case_data = load_case(request.case_id)
        witness = get_witness(case_data, request.witness_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case not found: {request.case_id}")
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Witness not found: {request.witness_id}")

    # Load or create player state
    state = load_state(request.case_id, request.player_id)
    if state is None:
        first_location = get_first_location_id(case_data)
        state = PlayerState(case_id=request.case_id, current_location=first_location)

    # Verify player has discovered this evidence
    if request.evidence_id not in state.discovered_evidence:
        raise HTTPException(
            status_code=400,
            detail=f"Evidence not discovered: {request.evidence_id}",
        )

    # Get witness state
    base_trust = witness.get("base_trust", 50)
    witness_state = state.get_witness_state(request.witness_id, base_trust)

    # Handle evidence presentation
    result = await _handle_evidence_presentation(
        witness=witness,
        evidence_id=request.evidence_id,
        state=state,
        witness_state=witness_state,
        player_id=request.player_id,
        case_data=case_data,
    )

    return PresentEvidenceResponse(
        response=result.response,
        secret_revealed=result.secrets_revealed[0] if result.secrets_revealed else None,
        trust=result.trust,
    )


@router.get("/witnesses", response_model=list[WitnessInfo])
async def get_witnesses(
    case_id: str = "case_001",
    player_id: str = "default",
) -> list[WitnessInfo]:
    """List available witnesses with current trust levels.

    Args:
        case_id: Case identifier
        player_id: Player identifier

    Returns:
        List of witness info with current trust
    """
    try:
        case_data = load_case(case_id)
        witness_ids = list_witnesses(case_data)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case not found: {case_id}")

    # Load player state for trust levels
    state = load_state(case_id, player_id)

    witnesses: list[WitnessInfo] = []
    for witness_id in witness_ids:
        witness = get_witness(case_data, witness_id)

        # Get current trust from player state or use base
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
) -> WitnessInfo:
    """Get single witness info with current trust level.

    Args:
        witness_id: Witness identifier
        case_id: Case identifier
        player_id: Player identifier

    Returns:
        Witness info with current trust
    """
    try:
        case_data = load_case(case_id)
        witness = get_witness(case_data, witness_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case not found: {case_id}")
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Witness not found: {witness_id}")

    # Load player state for trust level
    state = load_state(case_id, player_id)

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
        personality=witness.get("personality"),
    )


# Phase 3: Verdict endpoint


@router.post("/submit-verdict", response_model=SubmitVerdictResponse)
async def submit_verdict(request: SubmitVerdictRequest) -> SubmitVerdictResponse:
    """Submit verdict and get Moody mentor feedback.

    1. Load case data and solution
    2. Load/create player and verdict state
    3. Check if out of attempts
    4. Evaluate verdict (correct/incorrect)
    5. Detect fallacies in reasoning
    6. Score reasoning quality
    7. Build mentor feedback
    8. Load confrontation if applicable
    9. Save state
    10. Return response

    Args:
        request: Verdict submission (suspect, reasoning, evidence)

    Returns:
        Verdict result with mentor feedback and optional confrontation
    """
    # Load case data
    try:
        case_data = load_case(request.case_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case not found: {request.case_id}")

    solution = load_solution(case_data)
    mentor_templates = load_mentor_templates(case_data)

    if not solution:
        raise HTTPException(
            status_code=500,
            detail="Case solution not configured",
        )

    # Load or create player state
    state = load_state(request.case_id, request.player_id)
    if state is None:
        first_location = get_first_location_id(case_data)
        state = PlayerState(case_id=request.case_id, current_location=first_location)

    # Initialize verdict state if needed
    if state.verdict_state is None:
        state.verdict_state = VerdictState(case_id=request.case_id)

    verdict_state = state.verdict_state

    # Check if out of attempts
    if verdict_state.attempts_remaining <= 0:
        raise HTTPException(
            status_code=400,
            detail="No attempts remaining. Case resolution complete.",
        )

    # Evaluate verdict
    correct = check_verdict(request.accused_suspect_id, solution)

    # Detect fallacies in reasoning
    fallacies = detect_fallacies(
        request.reasoning,
        request.accused_suspect_id,
        request.evidence_cited,
        case_data.get("case", case_data),
    )

    # Score reasoning quality
    score = score_reasoning(
        request.reasoning,
        request.evidence_cited,
        solution,
        fallacies,
    )

    # Add attempt to state
    verdict_state.add_attempt(
        request.accused_suspect_id,
        request.reasoning,
        request.evidence_cited,
        correct,
        score,
        fallacies,
    )

    # Build mentor feedback (template-based for structured data)
    mentor_feedback_dict = build_mentor_feedback(
        correct=correct,
        score=score,
        fallacies=fallacies,
        reasoning=request.reasoning,
        accused_id=request.accused_suspect_id,
        solution=solution,
        feedback_templates=mentor_templates,
        attempts_remaining=verdict_state.attempts_remaining,
    )

    # Generate LLM-based natural language feedback (with fallback)
    moody_text = await build_moody_feedback_llm(
        correct=correct,
        score=score,
        fallacies=fallacies,
        reasoning=request.reasoning,
        accused_id=request.accused_suspect_id,
        solution=solution,
        attempts_remaining=verdict_state.attempts_remaining,
        evidence_cited=request.evidence_cited,
        feedback_templates=mentor_templates,
        case_id=request.case_id,
    )

    # Note: fallacies_detected, critique, praise, hint are now empty
    # All feedback is integrated into the LLM-generated analysis field
    mentor_feedback = MentorFeedback(
        analysis=moody_text,  # LLM-generated natural language (all feedback integrated)
        fallacies_detected=[],  # Empty - LLM integrates into analysis
        score=mentor_feedback_dict["score"],
        quality=mentor_feedback_dict["quality"],
        critique="",  # Empty - LLM integrates into analysis
        praise="",  # Empty - LLM integrates into analysis
        hint=None,  # Empty - LLM integrates into analysis
    )

    # Load confrontation if applicable
    confrontation_response: ConfrontationDialogue | None = None
    if correct or verdict_state.attempts_remaining == 0:
        confrontation_data = load_confrontation(case_data, request.accused_suspect_id, correct)
        if confrontation_data:
            confrontation_response = ConfrontationDialogue(
                dialogue=confrontation_data["dialogue"],
                aftermath=confrontation_data["aftermath"],
            )

    # Get pre-written wrong suspect response if applicable
    wrong_suspect_response: str | None = None
    if not correct:
        wrong_suspect_response = get_wrong_suspect_response(
            request.accused_suspect_id,
            mentor_templates,
            verdict_state.attempts_remaining,
        )

    # Reveal answer if out of attempts
    reveal: str | None = None
    if not correct and verdict_state.attempts_remaining == 0:
        culprit = solution.get("culprit", "unknown")
        method = solution.get("method", "")
        reveal = f"The actual culprit was {culprit}. {method}"

        # Also load wrong verdict info for teaching moment
        wrong_info = load_wrong_verdict_info(case_data, request.accused_suspect_id)
        if wrong_info and wrong_info.get("reveal"):
            reveal = wrong_info["reveal"]

    # Save updated state
    save_state(state, request.player_id)

    return SubmitVerdictResponse(
        correct=correct,
        attempts_remaining=verdict_state.attempts_remaining,
        case_solved=verdict_state.case_solved,
        mentor_feedback=mentor_feedback,
        confrontation=confrontation_response,
        reveal=reveal,
        wrong_suspect_response=wrong_suspect_response,
    )


# ============================================================================
# Phase 3.5: Briefing endpoints
# ============================================================================


def _load_briefing_content(case_id: str) -> dict[str, Any]:
    """Load briefing content from case YAML.

    Args:
        case_id: Case identifier

    Returns:
        Briefing dict with case_assignment, teaching_moment, etc.

    Raises:
        HTTPException: If case not found or no briefing section
    """
    try:
        case_data = load_case(case_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case not found: {case_id}")

    case_section = case_data.get("case", case_data)
    briefing: dict[str, Any] | None = case_section.get("briefing")

    if not briefing:
        raise HTTPException(status_code=404, detail=f"No briefing section in case: {case_id}")

    return briefing


@router.get("/briefing/{case_id}", response_model=BriefingContent)
async def get_briefing(case_id: str, player_id: str = "default") -> BriefingContent:
    """Load briefing content for a case.

    Args:
        case_id: Case identifier
        player_id: Player identifier (query param)

    Returns:
        BriefingContent with case assignment, teaching question, and completion status.

    Raises:
        HTTPException 404: If case or briefing not found
    """
    briefing = _load_briefing_content(case_id)

    # Parse dossier from YAML
    dossier_data = briefing.get("dossier", {})
    dossier = CaseDossier(
        title=dossier_data.get("title", "CLASSIFIED"),
        victim=dossier_data.get("victim", "Unknown"),
        location=dossier_data.get("location", "Unknown"),
        time=dossier_data.get("time", "Unknown"),
        status=dossier_data.get("status", "Unknown"),
        synopsis=dossier_data.get("synopsis", ""),
    )

    # Parse teaching_questions from YAML (list support)
    questions_data = briefing.get("teaching_questions", [])
    # Fallback for old single-question format if migration is partial
    if not questions_data and "teaching_question" in briefing:
        questions_data = [briefing["teaching_question"]]

    teaching_questions = []
    for q_data in questions_data:
        choices_data = q_data.get("choices", [])
        choices = [
            TeachingChoice(
                id=c.get("id", ""),
                text=c.get("text", ""),
                response=c.get("response", ""),
            )
            for c in choices_data
        ]
        teaching_questions.append(
            TeachingQuestion(
                prompt=q_data.get("prompt", ""),
                choices=choices,
                concept_summary=q_data.get("concept_summary", ""),
            )
        )

    # Load player state to check briefing completion status
    state = load_state(case_id, player_id)
    briefing_completed = False
    if state and state.briefing_state:
        briefing_completed = state.briefing_state.briefing_completed

    return BriefingContent(
        case_id=case_id,
        dossier=dossier,
        teaching_questions=teaching_questions,
        rationality_concept=briefing.get("rationality_concept", ""),
        concept_description=briefing.get("concept_description", ""),
        transition=briefing.get("transition", ""),
        briefing_completed=briefing_completed,
    )


@router.post("/briefing/{case_id}/question", response_model=BriefingQuestionResponse)
async def ask_briefing_question(
    case_id: str,
    request: BriefingQuestionRequest,
) -> BriefingQuestionResponse:
    """Ask Moody a question during briefing.

    1. Load case briefing content and context
    2. Load or create player state
    3. Get/create briefing state
    4. Call LLM for Moody's response with case context
    5. Save Q&A to conversation history
    6. Return response

    Args:
        case_id: Case identifier
        request: Question request

    Returns:
        Moody's response

    Raises:
        HTTPException 404: If case or briefing not found
    """
    # Load briefing content
    briefing = _load_briefing_content(case_id)

    # Load briefing context (Phase 3.8)
    try:
        case_data = load_case(case_id)
        case_section = case_data.get("case", case_data)
        briefing_context = case_section.get("briefing_context", {})
    except Exception:
        briefing_context = {}

    # Load or create player state
    state = load_state(case_id, request.player_id)
    if state is None:
        # Get first available location from case for new player state
        locations = case_section.get("locations", {})
        first_location = next(iter(locations.keys()), "unknown")
        state = PlayerState(case_id=case_id, current_location=first_location)

    # Get or create briefing state
    briefing_state = state.get_briefing_state()

    # Extract teaching data from new schema
    dossier = briefing.get("dossier", {})
    teaching_questions = briefing.get("teaching_questions", [])
    first_question = teaching_questions[0] if teaching_questions else {}

    # Build case_assignment from dossier for LLM context
    case_assignment = f"""VICTIM: {dossier.get("victim", "Unknown")}
LOCATION: {dossier.get("location", "Unknown")}
TIME: {dossier.get("time", "Unknown")}
STATUS: {dossier.get("status", "Unknown")}
SYNOPSIS: {dossier.get("synopsis", "")}"""

    # Get Moody's response (LLM with fallback)
    answer = await ask_moody_question(
        question=request.question,
        case_assignment=case_assignment,
        teaching_moment=first_question.get("prompt", ""),
        rationality_concept=first_question.get("concept_summary", ""),
        concept_description=first_question.get("concept_summary", ""),
        conversation_history=briefing_state.conversation_history,
        briefing_context=briefing_context,
    )

    # Save Q&A to history
    briefing_state.add_question(request.question, answer)

    # Save state
    save_state(state, request.player_id)

    return BriefingQuestionResponse(answer=answer)


@router.post("/briefing/{case_id}/complete", response_model=BriefingCompleteResponse)
async def complete_briefing(
    case_id: str,
    player_id: str = "default",
) -> BriefingCompleteResponse:
    """Mark briefing as completed.

    Args:
        case_id: Case identifier
        player_id: Player identifier

    Returns:
        Success response

    Raises:
        HTTPException 404: If case not found
    """
    # Verify case exists
    try:
        case_data = load_case(case_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case not found: {case_id}")

    # Load or create player state
    state = load_state(case_id, player_id)
    if state is None:
        first_location = get_first_location_id(case_data)
        state = PlayerState(case_id=case_id, current_location=first_location)

    # Mark briefing complete
    state.mark_briefing_complete()

    # Save state
    save_state(state, player_id)

    return BriefingCompleteResponse(success=True)


# ============================================================================
# Phase 4: Inner Voice (Tom's Ghost) endpoints
# ============================================================================


@router.post(
    "/case/{case_id}/inner-voice/check",
    response_model=InnerVoiceTriggerResponse,
    responses={404: {"description": "No eligible triggers available"}},
)
async def check_inner_voice_trigger(
    case_id: str,
    request: InnerVoiceCheckRequest,
    player_id: str = "default",
) -> InnerVoiceTriggerResponse:
    """Check if Tom should speak based on evidence count.

    Algorithm:
    1. Load player state and inner voice state
    2. Load case triggers (cached)
    3. Check tiers in priority order (3 > 2 > 1)
    4. Filter to unfired triggers with met conditions
    5. 7% chance for rare triggers if available
    6. Random selection within tier

    Args:
        case_id: Case identifier
        request: Contains evidence_count
        player_id: Player identifier (query param)

    Returns:
        InnerVoiceTriggerResponse with trigger data

    Raises:
        HTTPException 404: If no eligible triggers (not an error condition)
    """
    from src.context.inner_voice import load_tom_triggers, select_tom_trigger

    # Verify case exists
    try:
        case_data = load_case(case_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case not found: {case_id}")

    # Load or create player state
    state = load_state(case_id, player_id)
    if state is None:
        first_location = get_first_location_id(case_data)
        state = PlayerState(case_id=case_id, current_location=first_location)

    # Get inner voice state
    inner_voice_state = state.get_inner_voice_state()

    # Load case triggers (cached)
    triggers_by_tier = load_tom_triggers(case_id)

    if not triggers_by_tier:
        raise HTTPException(status_code=404, detail="No inner voice triggers configured")

    # Select trigger
    trigger = select_tom_trigger(
        triggers_by_tier,
        request.evidence_count,
        inner_voice_state.fired_triggers,
    )

    if not trigger:
        raise HTTPException(status_code=404, detail="No eligible triggers")

    # Mark as fired
    inner_voice_state.fire_trigger(
        trigger_id=trigger["id"],
        text=trigger["text"],
        trigger_type=trigger["type"],
        tier=trigger["tier"],
        evidence_count=request.evidence_count,
    )

    # Save state
    save_state(state, player_id)

    return InnerVoiceTriggerResponse(
        id=trigger["id"],
        text=trigger["text"],
        type=trigger["type"],
        tier=trigger["tier"],
    )


# ============================================================================
# Phase 4.1: Tom LLM-Powered Endpoints
# ============================================================================


def _build_case_context(case_data: dict[str, Any]) -> dict[str, Any]:
    """Build case context dict for Tom LLM.

    Args:
        case_data: Loaded case dictionary

    Returns:
        Context dict with victim, location, suspects, witnesses
    """
    case_section = case_data.get("case", case_data)

    # Get victim info
    victim = case_section.get("victim", {})
    victim_str = victim.get("name", "Unknown victim")
    if victim.get("status"):
        victim_str += f" ({victim['status']})"

    # Get location
    metadata = case_section.get("metadata", {})
    location = metadata.get("location", "Unknown location")

    # Get suspects
    suspects_list = case_section.get("suspects", [])
    suspects = [s.get("name", s.get("id", "Unknown")) for s in suspects_list]

    # Get witnesses
    witnesses_list = case_section.get("witnesses", [])
    witnesses = [w.get("name", w.get("id", "Unknown")) for w in witnesses_list]

    return {
        "victim": victim_str,
        "location": location,
        "suspects": suspects,
        "witnesses": witnesses,
    }


def _get_evidence_details(
    case_data: dict[str, Any],
    discovered_ids: list[str],
    location_id: str | None,
) -> list[EvidenceDetailItem]:
    """Get full details for discovered evidence.

    Args:
        case_data: Full case data
        discovered_ids: List of evidence IDs the player has found
        location_id: Location to check (None for all locations)

    Returns:
        List of evidence dicts with name, description
    """
    all_evidence = get_all_evidence(case_data, location_id)
    return [e for e in all_evidence if e["id"] in discovered_ids]


def _get_witness_history_summary(state: PlayerState) -> str:
    """Aggregate recent witness conversation history.

    Collects last 5 interactions across all witnesses, sorted by time.

    Args:
        state: Current player state

    Returns:
        Formatted history string
    """
    all_exchanges = []

    for witness_id, w_state in state.witness_states.items():
        for interaction in w_state.conversation_history:
            # Add witness_id to context
            all_exchanges.append(
                {
                    "witness": witness_id,
                    "question": interaction.question,
                    "response": interaction.response,
                    "timestamp": interaction.timestamp,
                }
            )

    # Sort by timestamp (oldest to newest)
    all_exchanges.sort(key=lambda x: x["timestamp"])

    # Take last 5
    recent = all_exchanges[-5:]

    if not recent:
        return ""

    lines = []
    for ex in recent:
        lines.append(f"Player: {ex['question']}")
        lines.append(f"Witness ({ex['witness']}): {ex['response']}")
        lines.append("")  # Spacer

    return "\n".join(lines).strip()


@router.post(
    "/case/{case_id}/tom/auto-comment",
    response_model=TomResponseModel,
    responses={404: {"description": "Tom chose not to comment (30% chance)"}},
)
async def tom_auto_comment(
    case_id: str,
    request: TomAutoCommentRequest,
    player_id: str = "default",
) -> TomResponseModel:
    """Generate Tom's automatic comment after evidence discovery.

    Called by frontend after narrator response.
    Returns 404 if Tom decides not to comment (70% chance unless critical).

    Algorithm:
    1. 30% chance Tom comments (or always on critical evidence)
    2. Load case context and discovered evidence
    3. Call Claude Haiku with Tom character prompt
    4. Return response with mode (50/50 helpful/misleading)

    Args:
        case_id: Case identifier
        request: Contains is_critical flag and last_evidence_id
        player_id: Player identifier (query param)

    Returns:
        TomResponseModel with text, mode, trust_level

    Raises:
        HTTPException 404: If Tom stays quiet or case not found
    """
    from src.context.tom_llm import (
        check_tom_should_comment,
        generate_tom_response,
        get_tom_fallback_response,
    )

    # Verify case exists
    try:
        case_data = load_case(case_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case not found: {case_id}")

    # Check if Tom should comment (30% chance, always on critical)
    should_comment = await check_tom_should_comment(request.is_critical)
    if not should_comment:
        raise HTTPException(status_code=404, detail="Tom stays quiet")

    # Load or create player state
    state = load_state(case_id, player_id)
    if state is None:
        first_location = get_first_location_id(case_data)
        state = PlayerState(case_id=case_id, current_location=first_location)

    # Get inner voice state
    inner_voice_state = state.get_inner_voice_state()

    # Build case context
    case_context = _build_case_context(case_data)

    # Phase 6.1: Fix Object Permanence Bug - Pass None to search ALL locations
    # (Previously passed state.current_location which hid valid evidence found elsewhere)
    evidence_discovered = _get_evidence_details(case_data, state.discovered_evidence, None)

    # Phase 6.1: Get Location Description
    try:
        location = get_location(case_data, state.current_location)
        location_desc = location.get("description", "")
    except KeyError:
        location_desc = "Unknown location"

    # Phase 6.1: Get Witness History
    witness_history = _get_witness_history_summary(state)

    # Generate Tom's response via LLM
    try:
        response_text, mode_used = await generate_tom_response(
            case_context=case_context,
            evidence_discovered=evidence_discovered,
            trust_level=inner_voice_state.trust_level,
            conversation_history=inner_voice_state.conversation_history,
            mode=None,  # Random 50/50 split
            user_message=None,  # Auto-comment, no user message
            location_description=location_desc,
            witness_history=witness_history,
        )
    except Exception as e:
        # Fallback to template if LLM fails
        import logging
        import random

        logger = logging.getLogger(__name__)
        logger.warning(f"Tom LLM failed, using fallback: {e}")

        mode_used = "helpful" if random.random() < 0.5 else "misleading"
        response_text = get_tom_fallback_response(mode_used, len(state.discovered_evidence))

    # Track comment in state
    inner_voice_state.add_tom_comment(None, response_text)

    # Save Tom's message to conversation history (no player message for auto-comment)
    state.add_conversation_message("tom", response_text)

    # Save state
    save_state(state, player_id)

    return TomResponseModel(
        text=response_text,
        mode=f"auto_{mode_used}",
        trust_level=inner_voice_state.get_trust_percentage(),
    )


@router.post(
    "/case/{case_id}/tom/chat",
    response_model=TomResponseModel,
)
async def tom_direct_chat(
    case_id: str,
    request: TomChatRequest,
    player_id: str = "default",
) -> TomResponseModel:
    """Handle direct conversation with Tom ("Tom, what do you think?").

    Always responds (unlike auto-comment which has 30% chance).
    Trust level affects how much Tom shares.

    Args:
        case_id: Case identifier
        request: Contains player's message to Tom
        player_id: Player identifier (query param)

    Returns:
        TomResponseModel with text, mode, trust_level

    Raises:
        HTTPException 404: If case not found
    """
    from src.context.tom_llm import (
        generate_tom_response,
        get_tom_fallback_response,
    )

    # Verify case exists
    try:
        case_data = load_case(case_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case not found: {case_id}")

    # Load or create player state
    state = load_state(case_id, player_id)
    if state is None:
        first_location = get_first_location_id(case_data)
        state = PlayerState(case_id=case_id, current_location=first_location)

    # Get inner voice state
    inner_voice_state = state.get_inner_voice_state()

    # Build case context
    case_context = _build_case_context(case_data)

    # Phase 6.1: Fix Object Permanence Bug - Pass None to search ALL locations
    evidence_discovered = _get_evidence_details(case_data, state.discovered_evidence, None)

    # Phase 6.1: Get Location Description
    try:
        location = get_location(case_data, state.current_location)
        location_desc = location.get("description", "")
    except KeyError:
        location_desc = "Unknown location"

    # Phase 6.1: Get Witness History
    witness_history = _get_witness_history_summary(state)

    # Generate Tom's response via LLM
    try:
        response_text, mode_used = await generate_tom_response(
            case_context=case_context,
            evidence_discovered=evidence_discovered,
            trust_level=inner_voice_state.trust_level,
            conversation_history=inner_voice_state.conversation_history,
            mode=None,  # Random 50/50 split
            user_message=request.message,  # Player's question
            location_description=location_desc,
            witness_history=witness_history,
        )
    except Exception as e:
        # Fallback to template if LLM fails
        import logging
        import random

        logger = logging.getLogger(__name__)
        logger.warning(f"Tom LLM failed, using fallback: {e}")

        mode_used = "helpful" if random.random() < 0.5 else "misleading"
        response_text = get_tom_fallback_response(mode_used, len(state.discovered_evidence))

    # Track conversation in state
    inner_voice_state.add_tom_comment(request.message, response_text)

    # Save conversation to main history (player message + Tom's response)
    state.add_conversation_message("player", request.message)
    state.add_conversation_message("tom", response_text)

    # Save state
    save_state(state, player_id)

    return TomResponseModel(
        text=response_text,
        mode=f"direct_chat_{mode_used}",
        trust_level=inner_voice_state.get_trust_percentage(),
    )
