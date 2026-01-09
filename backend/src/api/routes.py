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

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.api.claude_client import ClaudeClientError, get_client
from src.case_store.loader import (
    get_all_evidence,
    get_evidence_by_id,
    get_location,
    get_witness,
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
from src.context.narrator import build_narrator_prompt, build_system_prompt
from src.context.witness import build_witness_prompt, build_witness_system_prompt
from src.state.persistence import delete_state, load_state, save_state
from src.state.player_state import PlayerState, VerdictState
from src.utils.evidence import (
    check_already_discovered,
    extract_evidence_from_response,
    find_matching_evidence,
    find_not_present_response,
)
from src.utils.trust import (
    adjust_trust,
    check_secret_triggers,
    detect_evidence_presentation,
    get_available_secrets,
)
from src.verdict.evaluator import check_verdict, score_reasoning
from src.verdict.fallacies import detect_fallacies

router = APIRouter(prefix="/api", tags=["game"])


# Request/Response models
class InvestigateRequest(BaseModel):
    """Request for investigate endpoint."""

    player_input: str = Field(..., min_length=1, description="Player's action/input")
    case_id: str = Field(default="case_001", description="Case identifier")
    location_id: str = Field(default="library", description="Current location")
    player_id: str = Field(default="default", description="Player identifier")


class InvestigateResponse(BaseModel):
    """Response from investigate endpoint."""

    narrator_response: str = Field(..., description="LLM narrator response")
    new_evidence: list[str] = Field(
        default_factory=list, description="Newly discovered evidence IDs"
    )
    already_discovered: bool = Field(default=False, description="Was this already found?")


class SaveRequest(BaseModel):
    """Request for save endpoint."""

    player_id: str = Field(default="default", description="Player identifier")
    state: dict[str, Any] = Field(..., description="Player state to save")


class SaveResponse(BaseModel):
    """Response from save endpoint."""

    success: bool
    message: str


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

    witness_id: str = Field(..., min_length=1, description="Witness identifier")
    question: str = Field(..., min_length=1, description="Player's question")
    case_id: str = Field(default="case_001", description="Case identifier")
    player_id: str = Field(default="default", description="Player identifier")


class InterrogateResponse(BaseModel):
    """Response from interrogate endpoint."""

    response: str = Field(..., description="Witness response")
    trust: int = Field(..., description="Current trust level (0-100)")
    trust_delta: int = Field(default=0, description="Change in trust from this question")
    secrets_revealed: list[str] = Field(
        default_factory=list, description="Secrets revealed in this response"
    )


class PresentEvidenceRequest(BaseModel):
    """Request for present-evidence endpoint."""

    witness_id: str = Field(..., min_length=1, description="Witness identifier")
    evidence_id: str = Field(..., min_length=1, description="Evidence to present")
    case_id: str = Field(default="case_001", description="Case identifier")
    player_id: str = Field(default="default", description="Player identifier")


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


# Phase 3: Verdict models
class SubmitVerdictRequest(BaseModel):
    """Request for submit-verdict endpoint."""

    case_id: str = Field(default="case_001", description="Case identifier")
    player_id: str = Field(default="default", description="Player identifier")
    accused_suspect_id: str = Field(..., min_length=1, description="Suspect ID being accused")
    reasoning: str = Field(..., min_length=1, description="Player's reasoning for accusation")
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


class BriefingContent(BaseModel):
    """Briefing content from YAML."""

    case_id: str
    case_assignment: str
    teaching_question: TeachingQuestion
    rationality_concept: str
    concept_description: str
    transition: str = ""
    briefing_completed: bool = False


class BriefingQuestionRequest(BaseModel):
    """Request for briefing question endpoint."""

    question: str = Field(..., min_length=1, description="Player's question for Moody")
    player_id: str = Field(default="default", description="Player identifier")


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
    last_evidence_id: str | None = Field(default=None, description="Evidence just discovered")


class TomChatRequest(BaseModel):
    """Request for direct Tom conversation."""

    message: str = Field(..., min_length=1, description="Player's question to Tom")


class TomResponseModel(BaseModel):
    """Tom's response (LLM-powered)."""

    text: str = Field(..., description="Tom's comment/response")
    mode: str = Field(
        ..., description="Response mode: 'auto', 'direct_chat', 'helpful', 'misleading'"
    )
    trust_level: int = Field(..., ge=0, le=100, description="Current trust level (0-100)")


@router.post("/investigate", response_model=InvestigateResponse)
async def investigate(request: InvestigateRequest) -> InvestigateResponse:
    """Process player investigation action.

    1. Load case and location data
    2. Check for evidence triggers
    3. Generate narrator response via Claude
    4. Update and save player state
    5. Return response with any new evidence

    Args:
        request: Player input and context

    Returns:
        Narrator response and discovered evidence
    """
    # Load case data
    try:
        case_data = load_case(request.case_id)
        location = get_location(case_data, request.location_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case not found: {request.case_id}")
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Location not found: {request.location_id}")

    # Load or create player state
    state = load_state(request.case_id, request.player_id)
    if state is None:
        state = PlayerState(
            case_id=request.case_id,
            current_location=request.location_id,
        )

    # Get location data
    location_desc = location.get("description", "")
    hidden_evidence = location.get("hidden_evidence", [])
    not_present = location.get("not_present", [])
    surface_elements = location.get("surface_elements", [])
    discovered_ids = state.discovered_evidence

    # Check if asking about already discovered evidence
    if check_already_discovered(request.player_input, hidden_evidence, discovered_ids):
        already_response = "You've already examined this thoroughly. Nothing new to find here."
        # Save conversation (player + narrator)
        state.add_conversation_message("player", request.player_input)
        state.add_conversation_message("narrator", already_response)
        # Save state (updates timestamp)
        save_state(state, request.player_id)
        return InvestigateResponse(
            narrator_response=already_response,
            new_evidence=[],
            already_discovered=True,
        )

    # Check for not_present items (hallucination prevention)
    not_present_response = find_not_present_response(request.player_input, not_present)
    if not_present_response:
        # Save conversation (player + narrator)
        state.add_conversation_message("player", request.player_input)
        state.add_conversation_message("narrator", not_present_response)
        save_state(state, request.player_id)
        return InvestigateResponse(
            narrator_response=not_present_response,
            new_evidence=[],
            already_discovered=False,
        )

    # Check for evidence triggers
    matching_evidence = find_matching_evidence(
        request.player_input, hidden_evidence, discovered_ids
    )

    # Build narrator prompt
    prompt = build_narrator_prompt(
        location_desc=location_desc,
        hidden_evidence=hidden_evidence,
        discovered_ids=discovered_ids,
        not_present=not_present,
        player_input=request.player_input,
        surface_elements=surface_elements,
    )

    # Get Claude response
    try:
        client = get_client()
        system_prompt = build_system_prompt()
        narrator_response = await client.get_response(prompt, system=system_prompt)
    except ClaudeClientError as e:
        raise HTTPException(status_code=503, detail=f"LLM service error: {e}")

    # Extract evidence from response
    new_evidence: list[str] = []

    # If we pre-matched evidence, ensure it's added
    if matching_evidence:
        evidence_id = matching_evidence["id"]
        if evidence_id not in discovered_ids:
            state.add_evidence(evidence_id)
            new_evidence.append(evidence_id)

    # Also check for evidence tags in LLM response
    response_evidence = extract_evidence_from_response(narrator_response)
    for eid in response_evidence:
        if eid not in discovered_ids and eid not in new_evidence:
            state.add_evidence(eid)
            new_evidence.append(eid)

    # Save conversation (player + narrator)
    state.add_conversation_message("player", request.player_input)
    state.add_conversation_message("narrator", narrator_response)

    # Save updated state
    save_state(state, request.player_id)

    return InvestigateResponse(
        narrator_response=narrator_response,
        new_evidence=new_evidence,
        already_discovered=False,
    )


@router.post("/save", response_model=SaveResponse)
async def save_game(request: SaveRequest) -> SaveResponse:
    """Save player game state.

    Args:
        request: Player ID and state data

    Returns:
        Success status
    """
    try:
        # Load existing state to preserve conversation_history
        existing_state = load_state(request.state.get("case_id", "case_001"), request.player_id)

        if existing_state:
            # Update existing state with new data, preserve conversation_history
            state = existing_state
            state.current_location = request.state.get("current_location", state.current_location)
            state.discovered_evidence = request.state.get("discovered_evidence", state.discovered_evidence)
            state.visited_locations = request.state.get("visited_locations", state.visited_locations)
            # conversation_history preserved from existing_state
        else:
            # New state, create from request
            state = PlayerState(**request.state)

        save_state(state, request.player_id)
        return SaveResponse(success=True, message="State saved successfully")
    except Exception as e:
        return SaveResponse(success=False, message=f"Failed to save: {e}")


@router.get("/load/{case_id}", response_model=StateResponse | None)
async def load_game(case_id: str, player_id: str = "default") -> StateResponse | None:
    """Load player game state.

    Args:
        case_id: Case identifier
        player_id: Player identifier (query param)

    Returns:
        Player state or None if not found
    """
    state = load_state(case_id, player_id)

    if state is None:
        return None

    return StateResponse(
        case_id=state.case_id,
        current_location=state.current_location,
        discovered_evidence=state.discovered_evidence,
        visited_locations=state.visited_locations,
        conversation_history=state.conversation_history,
    )


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
    deleted = delete_state(case_id, player_id)

    if deleted:
        return ResetResponse(
            success=True,
            message=f"Case {case_id} reset successfully.",
        )
    else:
        return ResetResponse(
            success=False,
            message=f"No saved progress found for case {case_id}.",
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
    location_id: str = "library",
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
    location_id: str = "library",
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


@router.get("/cases")
async def list_cases() -> dict[str, list[str]]:
    """List available cases.

    Returns:
        List of case IDs
    """
    from src.case_store.loader import list_cases

    cases = list_cases()
    return {"cases": cases}


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
        state = PlayerState(case_id=request.case_id)

    # Get or create witness state with base_trust from YAML
    base_trust = witness.get("base_trust", 50)
    witness_state = state.get_witness_state(request.witness_id, base_trust)

    # Check if question contains evidence presentation
    evidence_id = detect_evidence_presentation(request.question)
    if evidence_id and evidence_id in state.discovered_evidence:
        # Redirect to present-evidence flow
        return await _handle_evidence_presentation(
            witness=witness,
            evidence_id=evidence_id,
            state=state,
            witness_state=witness_state,
            player_id=request.player_id,
        )

    # Adjust trust based on question tone
    trust_delta = adjust_trust(request.question, witness.get("personality", ""))
    witness_state.adjust_trust(trust_delta)

    # Build witness prompt (isolated context)
    prompt = build_witness_prompt(
        witness=witness,
        trust=witness_state.trust,
        discovered_evidence=state.discovered_evidence,
        conversation_history=witness_state.get_history_as_dicts(),
        player_input=request.question,
    )

    # Get Claude response
    try:
        client = get_client()
        system_prompt = build_witness_system_prompt(witness.get("name", "Unknown"))
        witness_response = await client.get_response(prompt, system=system_prompt)
    except ClaudeClientError as e:
        raise HTTPException(status_code=503, detail=f"LLM service error: {e}")

    # Check for newly available secrets in this response
    secrets_revealed: list[str] = []
    available_secrets = get_available_secrets(
        witness, witness_state.trust, state.discovered_evidence
    )

    for secret in available_secrets:
        secret_id = secret.get("id", "")
        if secret_id and secret_id not in witness_state.secrets_revealed:
            # Check if secret content appears in response (LLM chose to reveal)
            secret_text = secret.get("text", "").lower()
            if any(phrase in witness_response.lower() for phrase in secret_text.split()[:3]):
                witness_state.reveal_secret(secret_id)
                secrets_revealed.append(secret_id)

    # Add to conversation history
    witness_state.add_conversation(
        question=request.question,
        response=witness_response,
        trust_delta=trust_delta,
    )

    # Save updated state
    state.update_witness_state(witness_state)
    save_state(state, request.player_id)

    return InterrogateResponse(
        response=witness_response,
        trust=witness_state.trust,
        trust_delta=trust_delta,
        secrets_revealed=secrets_revealed,
    )


async def _handle_evidence_presentation(
    witness: dict[str, Any],
    evidence_id: str,
    state: PlayerState,
    witness_state: Any,
    player_id: str,
) -> InterrogateResponse:
    """Handle evidence presentation within interrogation.

    Called when player question contains 'show X' or 'present X'.
    """
    secrets = witness.get("secrets", [])
    secrets_revealed: list[str] = []
    trust_bonus = 5  # Evidence presentation builds trust

    # Check which secrets this evidence triggers
    for secret in secrets:
        secret_id = secret.get("id", "")
        if secret_id in witness_state.secrets_revealed:
            continue

        # Check if this evidence triggers the secret
        if check_secret_triggers(secret, witness_state.trust, state.discovered_evidence):
            witness_state.reveal_secret(secret_id)
            secrets_revealed.append(secret_id)

    witness_state.adjust_trust(trust_bonus)

    # Build response prompt for evidence presentation
    witness_name = witness.get("name", "Unknown")

    if secrets_revealed:
        # Get secret text for revealed secrets
        secret_texts = []
        for secret in secrets:
            if secret.get("id") in secrets_revealed:
                secret_texts.append(secret.get("text", "").strip())

        prompt = f"""You are {witness_name}. The investigator has shown you evidence: {evidence_id}.

This evidence has triggered you to reveal a secret:
{chr(10).join(secret_texts)}

Respond in character, naturally revealing this information as {witness_name} would react.
Keep response to 2-4 sentences."""
    else:
        prompt = f"""You are {witness_name}. The investigator has shown you evidence: {evidence_id}.

You recognize the evidence but it doesn't trigger any secrets at your current trust level.
Respond in character, acknowledging the evidence but not revealing anything significant.
Keep response to 2-4 sentences."""

    try:
        client = get_client()
        system_prompt = build_witness_system_prompt(witness_name)
        witness_response = await client.get_response(prompt, system=system_prompt)
    except ClaudeClientError as e:
        raise HTTPException(status_code=503, detail=f"LLM service error: {e}")

    # Add to conversation history
    witness_state.add_conversation(
        question=f"[Presented evidence: {evidence_id}]",
        response=witness_response,
        trust_delta=trust_bonus,
    )

    # Save state
    state.update_witness_state(witness_state)
    save_state(state, player_id)

    return InterrogateResponse(
        response=witness_response,
        trust=witness_state.trust,
        trust_delta=trust_bonus,
        secrets_revealed=secrets_revealed,
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
        state = PlayerState(case_id=request.case_id)

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
    else:
        trust = witness.get("base_trust", 50)
        secrets_revealed = []

    return WitnessInfo(
        id=witness_id,
        name=witness.get("name", "Unknown"),
        trust=trust,
        secrets_revealed=secrets_revealed,
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
        state = PlayerState(case_id=request.case_id)

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

    # Parse teaching_question from YAML
    teaching_q_data = briefing.get("teaching_question", {})
    choices_data = teaching_q_data.get("choices", [])
    choices = [
        TeachingChoice(
            id=c.get("id", ""),
            text=c.get("text", ""),
            response=c.get("response", ""),
        )
        for c in choices_data
    ]
    teaching_question = TeachingQuestion(
        prompt=teaching_q_data.get("prompt", ""),
        choices=choices,
        concept_summary=teaching_q_data.get("concept_summary", ""),
    )

    # Load player state to check briefing completion status
    state = load_state(case_id, player_id)
    briefing_completed = False
    if state and state.briefing_state:
        briefing_completed = state.briefing_state.briefing_completed

    return BriefingContent(
        case_id=case_id,
        case_assignment=briefing.get("case_assignment", ""),
        teaching_question=teaching_question,
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
        state = PlayerState(case_id=case_id)

    # Get or create briefing state
    briefing_state = state.get_briefing_state()

    # Get Moody's response (LLM with fallback)
    answer = await ask_moody_question(
        question=request.question,
        case_assignment=briefing.get("case_assignment", ""),
        teaching_moment=briefing.get("teaching_moment", ""),
        rationality_concept=briefing.get("rationality_concept", ""),
        concept_description=briefing.get("concept_description", ""),
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
        load_case(case_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case not found: {case_id}")

    # Load or create player state
    state = load_state(case_id, player_id)
    if state is None:
        state = PlayerState(case_id=case_id)

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
        load_case(case_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case not found: {case_id}")

    # Load or create player state
    state = load_state(case_id, player_id)
    if state is None:
        state = PlayerState(case_id=case_id)

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
    location_id: str = "library",
) -> list[dict[str, Any]]:
    """Get evidence details for discovered evidence.

    Args:
        case_data: Loaded case dictionary
        discovered_ids: List of discovered evidence IDs
        location_id: Location to check (default library)

    Returns:
        List of evidence dicts with name, description
    """
    all_evidence = get_all_evidence(case_data, location_id)
    return [e for e in all_evidence if e["id"] in discovered_ids]


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
        state = PlayerState(case_id=case_id)

    # Get inner voice state
    inner_voice_state = state.get_inner_voice_state()

    # Build case context
    case_context = _build_case_context(case_data)

    # Get evidence details for discovered evidence
    evidence_discovered = _get_evidence_details(case_data, state.discovered_evidence, "library")

    # Generate Tom's response via LLM
    try:
        response_text, mode_used = await generate_tom_response(
            case_context=case_context,
            evidence_discovered=evidence_discovered,
            trust_level=inner_voice_state.trust_level,
            conversation_history=inner_voice_state.conversation_history,
            mode=None,  # Random 50/50 split
            user_message=None,  # Auto-comment, no user message
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
        state = PlayerState(case_id=case_id)

    # Get inner voice state
    inner_voice_state = state.get_inner_voice_state()

    # Build case context
    case_context = _build_case_context(case_data)

    # Get evidence details for discovered evidence
    evidence_discovered = _get_evidence_details(case_data, state.discovered_evidence, "library")

    # Generate Tom's response via LLM
    try:
        response_text, mode_used = await generate_tom_response(
            case_context=case_context,
            evidence_discovered=evidence_discovered,
            trust_level=inner_voice_state.trust_level,
            conversation_history=inner_voice_state.conversation_history,
            mode=None,  # Random 50/50 split
            user_message=request.message,  # Player's question
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
