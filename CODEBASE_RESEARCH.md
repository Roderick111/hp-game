# Codebase Pattern Research: Phase 3.5 Intro Briefing System
**Feature**: Intro Briefing System - Moody rationality lessons before each case
**Date**: 2026-01-07
**Analysis Scope**: Frontend (React/TypeScript), Backend (Python/FastAPI), YAML case structure
**Version**: Phase 3.1+ (v0.4.1)

---

## Executive Summary

Phase 3.5 requires implementing a **CaseBriefing component** that teaches rationality concepts before investigation. This research identifies:

1. **3 existing dialogue/UI patterns** to follow (MentorFeedback, ConfrontationDialogue, WitnessInterview)
2. **YAML structure** for briefing module (mirrors existing case structure)
3. **API endpoint pattern** (`/api/briefing/{case_id}`)
4. **State management** for briefing completion tracking
5. **Testing conventions** (Vitest frontend, pytest backend)

---

## Directory Structure

```
hp_game/
├── frontend/src/
│   ├── components/
│   │   ├── ui/                      # Reusable primitives
│   │   │   ├── Card.tsx             # Container (dark terminal style)
│   │   │   ├── Button.tsx           # Actions (primary/secondary variants)
│   │   │   ├── Modal.tsx            # Overlay dialogs (dark theme)
│   │   │   └── [others]
│   │   ├── MentorFeedback.tsx        # ✓ Feedback display pattern (FOLLOW THIS)
│   │   ├── ConfrontationDialogue.tsx # ✓ Dialogue pattern (FOLLOW THIS)
│   │   ├── WitnessInterview.tsx      # ✓ Conversation pattern (FOLLOW THIS)
│   │   ├── VerdictSubmission.tsx     # Verdict input pattern
│   │   └── __tests__/               # Test files mirror components
│   ├── hooks/
│   │   ├── useInvestigation.ts       # Investigation state + API
│   │   ├── useWitnessInterrogation.ts # Witness state + API
│   │   ├── useVerdictFlow.ts         # Verdict state + API
│   │   └── __tests__/
│   ├── api/
│   │   └── client.ts                # Type-safe fetch wrappers (FOLLOW THIS)
│   ├── types/
│   │   └── investigation.ts          # Request/response interfaces
│   └── App.tsx                       # Main component integration
├── backend/src/
│   ├── case_store/
│   │   ├── case_001.yaml            # ✓ YAML structure (FOLLOW THIS)
│   │   └── loader.py                # YAML → dict parser
│   ├── context/
│   │   ├── mentor.py                # ✓ LLM feedback builder (FOLLOW THIS)
│   │   ├── narrator.py              # Location/investigation LLM
│   │   └── witness.py               # Witness interrogation LLM
│   ├── state/
│   │   ├── player_state.py           # ✓ State models (FOLLOW THIS)
│   │   └── persistence.py            # JSON save/load
│   ├── api/
│   │   ├── routes.py                 # ✓ API patterns (FOLLOW THIS)
│   │   └── claude_client.py          # LLM client wrapper
│   └── verdict/
│       ├── evaluator.py              # Verdict checking logic
│       └── fallacies.py              # Fallacy detection
└── cases/                            # Case YAML files (planned)
```

---

## Existing Dialogue/UI Patterns

### Pattern 1: MentorFeedback Component (FOLLOW THIS)

**File**: `frontend/src/components/MentorFeedback.tsx`
**Purpose**: Display structured mentor response with feedback, score, retry button
**Use For**: Briefing should follow this card-based pattern

#### Structure
```typescript
// Interface
export interface MentorFeedbackData {
  analysis: string;                          // LLM-generated natural prose
  fallacies_detected: Fallacy[];             // Educational fallacy list
  score: number;                             // 0-100 reasoning quality
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'failing' | string;
  critique: string;                          // What missed (EMPTY in LLM mode)
  praise: string;                            // What done well (EMPTY in LLM mode)
  hint: string | null;                       // Adaptive hint (EMPTY in LLM mode)
}

export interface MentorFeedbackProps {
  feedback?: MentorFeedbackData;
  correct: boolean;
  attemptsRemaining: number;
  wrongSuspectResponse?: string | null;
  onRetry?: () => void;
  isLoading?: boolean;                       // Shows spinner while LLM calls
}
```

#### Rendering Pattern
```tsx
// Loading state (show spinner)
if (isLoading) {
  return (
    <div className="bg-gray-900 rounded-lg p-6 font-mono" role="status" aria-busy="true">
      <div className="flex items-center gap-4">
        <div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" />
        <p className="text-amber-400 font-bold">Moody is evaluating your verdict...</p>
      </div>
    </div>
  );
}

// Main content (dark gray box with amber accents)
<div className="bg-gray-900 rounded-lg p-6 space-y-4 font-mono">
  {/* Verdict result banner (green/red) */}
  <div className={`text-lg font-bold p-3 rounded border ${correct ? '...' : '...'}`}>
    {correct ? '* CORRECT VERDICT' : '* INCORRECT'}
  </div>

  {/* Moody's Response (natural prose, NOT structured sections) */}
  <div className="bg-gray-800 border border-amber-900 rounded p-4">
    <h3 className="text-sm font-bold text-amber-400 mb-2">Moody's Response:</h3>
    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
      {feedback.analysis}
    </p>
  </div>

  {/* Score meter with color coding */}
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-400">Reasoning Quality:</span>
      <span className={`text-lg font-bold ${getScoreColor(feedback.score)}`}>
        {feedback.score}/100
      </span>
    </div>
    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
      <div
        className={`h-3 rounded-full transition-all duration-500 ${getScoreBarColor(feedback.score)}`}
        style={{ width: `${feedback.score}%` }}
        role="progressbar"
      />
    </div>
  </div>

  {/* Retry button (only if incorrect and attempts > 0) */}
  {!correct && attemptsRemaining > 0 && (
    <button onClick={onRetry} className="w-full mt-4 bg-blue-700 hover:bg-blue-600...">
      Try Again
    </button>
  )}
</div>
```

**Key Patterns**:
- ✅ **Dark terminal theme**: `bg-gray-900`, `text-gray-300`, amber accents (`text-amber-400`)
- ✅ **Monospace font**: `font-mono` throughout
- ✅ **Loading state**: Spinner while waiting for async LLM call
- ✅ **Whitespace-preserved prose**: `whitespace-pre-wrap` for LLM text
- ✅ **Color-coded metrics**: Green/Yellow/Red based on score thresholds
- ✅ **Accessibility**: `role="status"`, `aria-live="polite"`, `aria-busy`, progress bar roles
- ✅ **Responsive buttons**: Primary/secondary variants with disabled states

---

### Pattern 2: ConfrontationDialogue Component (REFERENCE)

**File**: `frontend/src/components/ConfrontationDialogue.tsx`
**Purpose**: Display multi-speaker dialogue exchange
**Why Relevant**: Briefing might show Moody teaching (similar dialogue format)

#### Structure
```typescript
export interface DialogueLine {
  speaker: string;
  text: string;
  tone?: 'defiant' | 'remorseful' | 'broken' | 'angry' | 'resigned' | string;
}

export interface ConfrontationDialogueData {
  dialogue: DialogueLine[];
  aftermath: string;
}
```

#### Rendering Pattern
```tsx
<div className="bg-gray-900 border border-amber-700 rounded-lg p-6 font-mono">
  {/* Header */}
  <h2 className="text-xl font-bold text-amber-400 mb-4 tracking-wide">
    [Post-Verdict Confrontation]
  </h2>

  {/* Dialogue bubbles (speaker color-coded) */}
  <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
    {dialogue.map((line) => (
      <div key={...} className={isPlayer ? 'text-right' : 'text-left'}>
        <div className={`inline-block max-w-[85%] p-3 rounded border ${getSpeakerBgClass(line.speaker)}`}>
          <div className={`text-xs font-bold mb-1 ${getSpeakerColor(line.speaker)}`}>
            {line.speaker}
            {line.tone && <span className="text-gray-500 font-normal ml-1">({line.tone})</span>}
          </div>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {line.text}
          </p>
        </div>
      </div>
    ))}
  </div>

  {/* Aftermath text */}
  <div className="bg-gray-800 border border-gray-700 rounded p-4 mb-4">
    <h3 className="text-sm font-bold text-gray-400 mb-2">Aftermath:</h3>
    <p className="text-sm text-gray-300 italic leading-relaxed whitespace-pre-wrap">
      {aftermath}
    </p>
  </div>
</div>
```

**Key Patterns**:
- ✅ **Speaker color-coding**: Moody (amber), Player (blue), Suspects (red)
- ✅ **Tone indicators**: Optional emotional context in parentheses
- ✅ **Scrollable history**: `max-h-80 overflow-y-auto` for long dialogue
- ✅ **Bubble layout**: Player right-aligned, others left-aligned

---

### Pattern 3: WitnessInterview Component (REFERENCE)

**File**: `frontend/src/components/WitnessInterview.tsx`
**Purpose**: Conversation UI with trust meter, history, input, evidence button
**Why Relevant**: Briefing needs similar conversation display (but read-only, skip input)

#### Key Sub-components to Reuse
```typescript
// Trust Meter (relevant for briefing engagement/understanding?)
function TrustMeter({ trust, trustDelta }: TrustMeterProps) {
  const getBarColor = (level: number): string => {
    if (level < 30) return 'bg-red-500';
    if (level < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400 uppercase tracking-wider">Trust Level</span>
        <span className={`text-sm font-mono ${getTextColor(trust)}`}>{trust}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-300 ${getBarColor(trust)}`} style={{ width: `${trust}%` }} />
      </div>
    </div>
  );
}

// Conversation Bubble (message display)
function ConversationBubble({ item, witnessName }: ConversationBubbleProps) {
  return (
    <div className="space-y-2">
      {/* Player message (blue, right-aligned) */}
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-blue-600/20 border border-blue-600/40 rounded-lg px-3 py-2">
          <p className="text-sm text-blue-300">{item.question}</p>
        </div>
      </div>

      {/* Witness response (gray, left-aligned) */}
      <div className="flex justify-start">
        <div className="max-w-[80%] bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2">
          <p className="text-xs text-gray-400 mb-1">{witnessName}</p>
          <p className="text-sm text-gray-200 leading-relaxed">{item.response}</p>
        </div>
      </div>
    </div>
  );
}
```

**Key Patterns**:
- ✅ **Chat-like layout**: Bubbles with speaker label
- ✅ **Auto-scroll**: `useEffect` to scroll to latest message
- ✅ **Disabled states**: Show when loading
- ✅ **Keyboard shortcuts**: Ctrl+Enter to submit (won't apply to briefing but pattern noted)

---

## State Management Patterns

### Backend: PlayerState Model

**File**: `backend/src/state/player_state.py`

#### Pattern for Briefing State
```python
from pydantic import BaseModel, Field
from datetime import datetime, UTC
from typing import Any

class BriefingState(BaseModel):
    """Track briefing completion per case."""
    case_id: str
    briefing_completed: bool = False
    concepts_taught: list[str] = Field(default_factory=list)  # ["base_rates", "updating", ...]
    teaching_variant: int = 0  # For dynamic variants based on performance
    completed_at: datetime | None = None
    player_performance: dict[str, Any] = Field(default_factory=dict)  # Prior case data

class PlayerState(BaseModel):
    """Main player investigation state (EXTEND THIS)."""
    state_id: str
    case_id: str
    current_location: str = "great_hall"
    discovered_evidence: list[str] = Field(default_factory=list)
    visited_locations: list[str] = Field(default_factory=list)
    witness_states: dict[str, WitnessState] = Field(default_factory=dict)
    verdict_state: VerdictState | None = None

    # ✅ ADD FOR PHASE 3.5:
    briefing_state: BriefingState | None = None

    # Methods
    def get_briefing_state(self) -> BriefingState:
        """Get or create briefing state."""
        if self.briefing_state is None:
            self.briefing_state = BriefingState(case_id=self.case_id)
        return self.briefing_state

    def mark_briefing_complete(self, concepts: list[str]) -> None:
        """Mark briefing as completed."""
        briefing = self.get_briefing_state()
        briefing.briefing_completed = True
        briefing.concepts_taught = concepts
        briefing.completed_at = datetime.now(UTC)
```

---

## YAML Case Structure Pattern

### Existing Pattern from case_001.yaml

**File**: `backend/src/case_store/case_001.yaml`

```yaml
case:
  id: "case_001"
  title: "The Restricted Section"
  difficulty: beginner

  locations:
    library:
      id: "library"
      name: "Hogwarts Library - Crime Scene"
      # ...

  witnesses:
    - id: "hermione"
      name: "Hermione Granger"
      personality: |
        [Character description]
      background: |
        [Background context]
      base_trust: 50
      knowledge:
        - "Fact 1"
        - "Fact 2"
      secrets:
        - id: "secret_id"
          trigger: "evidence:X OR trust>70"
          text: |
            [Secret revelation text]

  solution:
    culprit: "draco"
    method: "Freezing charm from outside window"
    critical_evidence: ["frost_pattern", "wand_signature"]
    reasoning: |
      [Correct reasoning explanation]
    fallacies_to_watch: ["confirmation_bias"]

  post_verdict:
    confrontation:
      dialogue: [...]
      aftermath: "..."

  # ✅ ADD FOR PHASE 3.5 (NEW MODULE):
  briefing:
    concepts:
      - id: "base_rates"
        title: "Base Rate Fallacy"
        teaching: |
          Moody's explanation of base rates...
        example: "In this investigation..."
        progression: 1  # Teaching order

      - id: "updating"
        title: "Bayesian Updating"
        teaching: |
          How to update beliefs with evidence...
        example: "Consider the frost pattern..."
        progression: 2

    # Dynamic variants based on player performance
    variants:
      - case_number: 1
        concepts: ["base_rates"]
        moody_tone: "harsh_but_fair"
      - case_number: 2
        concepts: ["base_rates", "updating"]
        prerequisite_score: 60  # Only if Case 1 score >= 60
        moody_tone: "encouraging"

    # Skip option for returning players
    skippable: true
    skip_after_plays: 2  # Allow skip after 2 complete playthroughs
```

**Key Patterns**:
- ✅ **Hierarchical structure**: Mirrors `locations`, `witnesses`, `solution` modules
- ✅ **ID-based references**: `concept: "base_rates"` not "Base Rate Fallacy"
- ✅ **Progression field**: Controls teaching order
- ✅ **Dynamic variants**: Different briefing per case number
- ✅ **Prerequisites**: `prerequisite_score` for progression
- ✅ **Natural prose**: `teaching` and `example` fields (LLM input or template)
- ✅ **Conditional display**: `skippable`, `case_number` gates

---

## API Endpoint Patterns

### Existing Endpoint Pattern from routes.py

**File**: `backend/src/api/routes.py`

#### Pattern 1: Simple GET with Case ID
```python
@router.get("/case/{case_id}/location/{location_id}", response_model=LocationResponse)
async def get_location_info(case_id: str, location_id: str) -> LocationResponse:
    """Get location details.

    Args:
        case_id: Case identifier
        location_id: Location identifier

    Returns:
        Location data (name, description, surface elements)

    Raises:
        HTTPException(404): Case or location not found
    """
    try:
        case_data = load_case(case_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case not found: {case_id}")

    # Extract location from case data
    locations = case_data.get("case", {}).get("locations", {})
    location = locations.get(location_id)

    if not location:
        raise HTTPException(status_code=404, detail=f"Location not found: {location_id}")

    return LocationResponse(
        name=location.get("name", ""),
        description=location.get("description", ""),
        surface_elements=location.get("surface_elements", []),
        witnesses_present=location.get("witnesses_present", []),
    )
```

#### Pattern 2: POST with Async LLM Call
```python
@router.post("/submit-verdict", response_model=SubmitVerdictResponse)
async def submit_verdict(request: SubmitVerdictRequest) -> SubmitVerdictResponse:
    """Submit verdict and get Moody mentor feedback.

    Pattern:
    1. Load case data and solution
    2. Load/create player state
    3. Validate request (out of attempts?)
    4. Call LLM asynchronously with feedback_templates fallback
    5. Save updated state
    6. Return response with feedback
    """
    # 1. Load case data
    try:
        case_data = load_case(request.case_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case not found: {request.case_id}")

    # 2. Load/create player state
    state = load_state(request.case_id, request.player_id)
    if state is None:
        state = PlayerState(case_id=request.case_id)

    # 3. Validate/check
    if state.verdict_state and state.verdict_state.attempts_remaining <= 0:
        raise HTTPException(status_code=400, detail="No attempts remaining.")

    # 4. Call LLM with try/except and fallback
    try:
        moody_text = await build_moody_feedback_llm(
            correct=...,
            score=...,
            # ... parameters
        )
    except Exception as e:
        logger.warning(f"LLM failed: {e}")
        moody_text = _build_template_feedback(...)  # Fallback

    # 5. Save state
    save_state(state, request.player_id)

    # 6. Return response
    return SubmitVerdictResponse(
        correct=...,
        mentor_feedback=MentorFeedback(...),
        # ...
    )
```

#### Pattern for Briefing Endpoint (NEW)
```python
# ✅ ADD THIS ENDPOINT FOR PHASE 3.5

from pydantic import BaseModel

class BriefingRequest(BaseModel):
    """Request briefing for a case."""
    case_id: str
    player_id: str = "default"
    skip: bool = False  # Skip if returning player

class BriefingConcept(BaseModel):
    """Single teaching concept."""
    id: str
    title: str
    teaching: str  # Moody's explanation
    example: str   # Case-specific example
    order: int

class BriefingResponse(BaseModel):
    """Complete briefing for a case."""
    case_id: str
    concepts: list[BriefingConcept]
    skippable: bool
    dialogue: list[DialogueLine]  # Optional: Moody dialogue (LLM-generated)
    moody_greeting: str  # "Alright, listen up..." etc

@router.post("/briefing/{case_id}", response_model=BriefingResponse)
async def get_briefing(
    case_id: str,
    request: BriefingRequest,
) -> BriefingResponse:
    """Get briefing content for a case.

    Logic:
    1. Load case YAML briefing module
    2. Load player state to check prior performance
    3. Select appropriate variant based on:
       - case_number
       - player_score from previous case
       - whether briefing already completed
    4. Optionally generate LLM dialogue (Moody teaching voice)
    5. Return briefing with concepts, skippable flag, dialogue

    Args:
        case_id: Case identifier
        request: Player ID, skip flag

    Returns:
        Briefing data with concepts and optional dialogue

    Raises:
        HTTPException(404): Case not found
    """
    # 1. Load case data
    try:
        case_data = load_case(case_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case not found: {case_id}")

    briefing_module = case_data.get("case", {}).get("briefing", {})
    if not briefing_module:
        raise HTTPException(status_code=404, detail=f"No briefing configured for {case_id}")

    # 2. Load player state
    state = load_state(case_id, request.player_id)

    # 3. Select variant
    variant = _select_briefing_variant(briefing_module, state)

    # 4. Generate greeting + dialogue (optional LLM)
    moody_greeting = await _build_moody_greeting(
        case_id=case_id,
        variant=variant,
    )

    # 5. Return response
    concepts = [BriefingConcept(...) for concept_id in variant["concepts"]]

    return BriefingResponse(
        case_id=case_id,
        concepts=concepts,
        skippable=briefing_module.get("skippable", True),
        moody_greeting=moody_greeting,
    )

@router.post("/briefing/{case_id}/complete", response_model=dict)
async def mark_briefing_complete(
    case_id: str,
    request: BriefingRequest,
) -> dict[str, bool]:
    """Mark briefing as completed (for analytics/progression).

    Args:
        case_id: Case identifier
        request: Player ID

    Returns:
        {"success": True}
    """
    state = load_state(case_id, request.player_id)
    if state is None:
        state = PlayerState(case_id=case_id)

    briefing_state = state.get_briefing_state()
    briefing_state.briefing_completed = True

    save_state(state, request.player_id)

    return {"success": True}
```

**Key Patterns**:
- ✅ **Type-safe requests/responses**: Pydantic models
- ✅ **HTTPException for errors**: Status codes (404, 400, 500)
- ✅ **Async/await for LLM calls**: `async def`, `await` for Claude API
- ✅ **Try/except + fallback**: LLM call with template backup
- ✅ **Separate "complete" endpoint**: Mark achievement after showing briefing
- ✅ **Player ID defaulting**: `player_id = "default"` parameter

---

## Frontend API Client Patterns

**File**: `frontend/src/api/client.ts`

### Pattern: Type-Safe Fetch Wrapper
```typescript
// 1. Define custom ApiError class
class ApiError extends Error implements ApiErrorType {
  status: number;
  details?: string;

  constructor(status: number, message: string, details?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// 2. Define request/response interfaces (in types/investigation.ts)
interface SubmitVerdictRequest {
  case_id: string;
  player_id: string;
  accused_suspect_id: string;
  reasoning: string;
  evidence_cited: string[];
}

interface SubmitVerdictResponse {
  correct: boolean;
  attempts_remaining: number;
  case_solved: boolean;
  mentor_feedback: MentorFeedback;
  confrontation?: ConfrontationDialogue;
  reveal?: string;
}

// 3. Export async function with proper error handling
export async function submitVerdict(request: SubmitVerdictRequest): Promise<SubmitVerdictResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/submit-verdict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw await createApiError(response);
    }

    return (await response.json()) as SubmitVerdictResponse;
  } catch (error) {
    if (isApiError(error)) throw error;
    throw handleFetchError(error);
  }
}

// ✅ ADD THIS FOR PHASE 3.5:
export async function getBriefing(
  caseId: string,
  playerId = 'default'
): Promise<BriefingResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/briefing/${encodeURIComponent(caseId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ case_id: caseId, player_id: playerId, skip: false }),
    });

    if (!response.ok) {
      throw await createApiError(response);
    }

    return (await response.json()) as BriefingResponse;
  } catch (error) {
    if (isApiError(error)) throw error;
    throw handleFetchError(error);
  }
}

export async function markBriefingComplete(
  caseId: string,
  playerId = 'default'
): Promise<{ success: boolean }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/briefing/${encodeURIComponent(caseId)}/complete`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseId, player_id: playerId }),
      }
    );

    if (!response.ok) {
      throw await createApiError(response);
    }

    return (await response.json()) as { success: boolean };
  } catch (error) {
    if (isApiError(error)) throw error;
    throw handleFetchError(error);
  }
}
```

**Key Patterns**:
- ✅ **Centralized error handling**: Custom `ApiError` class for all endpoint errors
- ✅ **404 special case**: Some endpoints return `null` on 404 (e.g., `loadState`)
- ✅ **Type safety**: All requests/responses typed with Pydantic models
- ✅ **Fetch error handling**: Network errors caught separately
- ✅ **Base URL constant**: `API_BASE_URL = 'http://localhost:8000'`

---

## Component Integration Pattern

**File**: `frontend/src/App.tsx`

### State Hook Pattern
```typescript
// 1. Create custom hook (useVerdictFlow pattern to follow)
export function useBriefing(caseId: string) {
  const [state, setState] = useState<BriefingState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBriefing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const briefing = await getBriefing(caseId);
      setState({ briefing, completed: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load briefing');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  const markComplete = useCallback(async () => {
    try {
      await markBriefingComplete(caseId);
      setState(prev => prev ? { ...prev, completed: true } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark complete');
    }
  }, [caseId]);

  return { state, loading, error, loadBriefing, markComplete };
}

// 2. Use in App.tsx
export default function App() {
  const { state: briefingState, loading: briefingLoading, loadBriefing, markComplete } = useBriefing(CASE_ID);
  const [briefingModalOpen, setBriefingModalOpen] = useState(true);

  useEffect(() => {
    if (briefingModalOpen && !briefingState) {
      void loadBriefing();
    }
  }, [briefingModalOpen, briefingState, loadBriefing]);

  return (
    <>
      {/* Briefing Modal (shows first, before investigation) */}
      <Modal open={briefingModalOpen && !briefingState?.completed} onClose={() => {}}>
        <CaseBriefing
          briefing={briefingState?.briefing}
          loading={briefingLoading}
          onComplete={() => {
            void markComplete();
            setBriefingModalOpen(false);
          }}
          onSkip={() => setBriefingModalOpen(false)}
        />
      </Modal>

      {/* Main investigation UI (shown after briefing or if skipped) */}
      {!briefingModalOpen && (
        <>
          <LocationView ... />
          <EvidenceBoard ... />
          {/* ... rest of UI ... */}
        </>
      )}
    </>
  );
}
```

**Key Patterns**:
- ✅ **Custom hook for feature state**: `useBriefing(caseId)`
- ✅ **Modal-based display**: Show briefing in Modal before investigation
- ✅ **Loading/error states**: Show spinner, handle errors
- ✅ **Completion tracking**: `onComplete()` and `onSkip()` callbacks
- ✅ **useEffect for side effects**: Load briefing when modal opens

---

## Testing Conventions

### Backend: pytest Pattern

**File**: `backend/tests/test_mentor.py` (reference)

```python
import pytest
from src.context.mentor import build_mentor_feedback, _determine_quality

class TestMentorFeedback:
    """Test suite for mentor feedback generator."""

    def test_determine_quality_excellent(self):
        """Score >= 90 returns 'excellent'."""
        assert _determine_quality(95) == "excellent"

    def test_determine_quality_good(self):
        """Score 75-89 returns 'good'."""
        assert _determine_quality(80) == "good"

    def test_build_mentor_feedback_correct(self):
        """Build feedback for correct verdict."""
        feedback = build_mentor_feedback(
            correct=True,
            score=85,
            fallacies=[],
            reasoning="The evidence points to Draco...",
            accused_id="draco",
            solution={"culprit": "draco"},
            feedback_templates={},
            attempts_remaining=10,
        )

        assert feedback["score"] == 85
        assert feedback["quality"] == "good"

    def test_build_mentor_feedback_incorrect(self):
        """Build feedback for incorrect verdict."""
        feedback = build_mentor_feedback(
            correct=False,
            score=35,
            fallacies=["confirmation_bias"],
            reasoning="...",
            accused_id="hermione",
            solution={"culprit": "draco"},
            feedback_templates={},
            attempts_remaining=5,
        )

        assert feedback["score"] == 35
        assert feedback["quality"] == "poor"
```

**Key Patterns**:
- ✅ **Class-based test organization**: `class TestFeatureName`
- ✅ **Descriptive names**: `test_determine_quality_excellent` (not `test_quality`)
- ✅ **Single assertion principle**: One assert per test (mostly)
- ✅ **Fixtures for common data**: `@pytest.fixture` for mock objects
- ✅ **Docstring per test**: Explain what's being tested

---

### Frontend: Vitest + React Testing Library Pattern

**File**: `frontend/src/components/__tests__/MentorFeedback.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MentorFeedback, type MentorFeedbackData } from '../MentorFeedback';

// ============================================
// Test Data (Mock Objects)
// ============================================

const mockFeedbackExcellent: MentorFeedbackData = {
  analysis: 'You correctly identified the culprit and provided strong reasoning.',
  fallacies_detected: [],
  score: 85,
  quality: 'excellent',
  critique: '',
  praise: 'Your deduction was thorough and logical.',
  hint: null,
};

const defaultProps = {
  feedback: mockFeedbackExcellent,
  correct: true,
  attemptsRemaining: 10,
  onRetry: vi.fn(),
  isLoading: false,
};

// ============================================
// Test Suite
// ============================================

describe('MentorFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ------------------------------------------
  // Rendering Tests
  // ------------------------------------------

  describe('Rendering', () => {
    it('renders correct verdict banner', () => {
      render(<MentorFeedback {...defaultProps} />);

      expect(screen.getByText('* CORRECT VERDICT')).toBeInTheDocument();
    });

    it('renders incorrect verdict banner when correct=false', () => {
      render(<MentorFeedback {...defaultProps} correct={false} />);

      expect(screen.getByText('* INCORRECT')).toBeInTheDocument();
    });

    it('renders score meter', () => {
      render(<MentorFeedback {...defaultProps} />);

      expect(screen.getByText('85/100')).toBeInTheDocument();
    });

    it('renders Moody\'s Response text', () => {
      render(<MentorFeedback {...defaultProps} />);

      expect(screen.getByText(/You correctly identified the culprit/i)).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Loading State Tests
  // ------------------------------------------

  describe('Loading State', () => {
    it('shows spinner when isLoading=true', () => {
      render(<MentorFeedback {...defaultProps} isLoading={true} feedback={undefined} />);

      expect(screen.getByText(/Moody is evaluating your verdict/i)).toBeInTheDocument();
    });

    it('shows loading message', () => {
      render(<MentorFeedback {...defaultProps} isLoading={true} feedback={undefined} />);

      expect(screen.getByText(/Analyzing reasoning quality/i)).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Interaction Tests
  // ------------------------------------------

  describe('Interactions', () => {
    it('calls onRetry when retry button clicked', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      render(
        <MentorFeedback
          {...defaultProps}
          correct={false}
          onRetry={onRetry}
          attemptsRemaining={5}
        />
      );

      const retryButton = screen.getByRole('button', { name: /Try Again/i });
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalledOnce();
    });

    it('does not show retry button when correct=true', () => {
      render(<MentorFeedback {...defaultProps} correct={true} />);

      expect(screen.queryByRole('button', { name: /Try Again/i })).not.toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Accessibility Tests
  // ------------------------------------------

  describe('Accessibility', () => {
    it('has proper ARIA labels for loading state', () => {
      const { container } = render(
        <MentorFeedback {...defaultProps} isLoading={true} feedback={undefined} />
      );

      const status = container.querySelector('[role="status"]');
      expect(status).toHaveAttribute('aria-busy', 'true');
    });

    it('has progressbar role for score meter', () => {
      const { container } = render(<MentorFeedback {...defaultProps} />);

      const bar = container.querySelector('[role="progressbar"]');
      expect(bar).toHaveAttribute('aria-valuenow', '85');
      expect(bar).toHaveAttribute('aria-valuemin', '0');
      expect(bar).toHaveAttribute('aria-valuemax', '100');
    });
  });
});
```

**Key Patterns**:
- ✅ **Test data objects**: Mock objects at top for reusability
- ✅ **Descriptive `describe` blocks**: Organize by feature/behavior
- ✅ **Setup/teardown**: `beforeEach`, `afterEach` for cleanup
- ✅ **Render then assert**: `render()` then `screen.getBy*()`
- ✅ **User interactions**: `userEvent.setup()` and `await user.click()`
- ✅ **Accessibility checks**: ARIA attributes, roles, labels
- ✅ **vi.fn() for mocks**: Track function calls with `expect(fn).toHaveBeenCalledOnce()`

---

## Type Definitions Pattern

**File**: `frontend/src/types/investigation.ts` (excerpt)

```typescript
/**
 * Type definitions for Phase 1-3 investigation system.
 */

// ============================================
// API Request/Response Types
// ============================================

export interface SubmitVerdictRequest {
  case_id: string;
  player_id: string;
  accused_suspect_id: string;
  reasoning: string;
  evidence_cited: string[];
}

export interface SubmitVerdictResponse {
  correct: boolean;
  attempts_remaining: number;
  case_solved: boolean;
  mentor_feedback: MentorFeedback;
  confrontation?: ConfrontationDialogue;
  reveal?: string;
  wrong_suspect_response?: string | null;
}

// ============================================
// Component Props Types (Always export)
// ============================================

export interface MentorFeedbackProps {
  feedback?: MentorFeedbackData;
  correct: boolean;
  attemptsRemaining: number;
  onRetry?: () => void;
  isLoading?: boolean;
}

// ============================================
// ✅ ADD FOR PHASE 3.5:
// ============================================

export interface BriefingConcept {
  id: string;
  title: string;
  teaching: string;        // Moody's explanation
  example: string;         // Case-specific example
  order: number;
}

export interface BriefingRequest {
  case_id: string;
  player_id?: string;
  skip?: boolean;
}

export interface BriefingResponse {
  case_id: string;
  concepts: BriefingConcept[];
  skippable: boolean;
  moody_greeting: string;
  dialogue?: DialogueLine[];  // Optional LLM-generated
}

export interface CaseBriefingProps {
  briefing: BriefingResponse | undefined;
  loading: boolean;
  onComplete: () => void;
  onSkip: () => void;
}
```

**Key Patterns**:
- ✅ **Separation**: Request/response types separate from component props
- ✅ **Required vs optional**: `string` vs `string | undefined`
- ✅ **Descriptive names**: `accused_suspect_id` not just `suspect`
- ✅ **Comments for clarity**: Explain what each field is
- ✅ **Export all public types**: Not just components

---

## Styling/Theme Constants

### Terminal UI Theme (Dark Aesthetic)

**Applied Across All Components**:

```typescript
// Colors (Tailwind classes)
const THEME = {
  background: 'bg-gray-900',          // Deep dark
  card: 'bg-gray-800',                // Slightly lighter
  border: 'border-gray-700',          // Visible but subtle
  text: 'text-gray-300',              // Readable gray
  textMuted: 'text-gray-500',         // Subtle
  textAccent: 'text-amber-400',       // Moody/warning color
  textSuccess: 'text-green-400',      // Correct verdicts
  textError: 'text-red-400',          // Incorrect/error
  textInfo: 'text-blue-400',          // Player actions

  // Semantic colors
  scoreExcellent: 'bg-green-500',     // >= 75
  scoreGood: 'bg-yellow-500',         // 50-74
  scorePoor: 'bg-red-500',            // < 50
};

// Font
const FONT = 'font-mono';             // Monospace throughout

// Spacing
const SPACING = {
  card: 'p-6',
  section: 'p-4',
  element: 'p-3',
};
```

**Key Patterns**:
- ✅ **Monospace font**: `font-mono` everywhere (terminal aesthetic)
- ✅ **Gray palette**: Gray-900 (bg), Gray-800 (cards), Gray-300 (text)
- ✅ **Accent color**: Amber-400 for Moody, indicating authority/warning
- ✅ **Semantic colors**: Green (success), Red (error), Blue (player), Amber (authority)
- ✅ **Subtle borders**: Gray-700 borders only for visual separation

---

## Integration Points for Phase 3.5

### Where Briefing Connects

1. **App.tsx Entry Point**
   - Load briefing when app first opens
   - Show modal before investigation begins
   - Skip to investigation when complete or skipped

2. **Player State Extension**
   - Add `briefing_state: BriefingState | None` field
   - Track completion and taught concepts

3. **Case YAML**
   - Add `briefing:` module to case_001.yaml
   - Define concepts, variants, skippable flag

4. **API Routes**
   - `POST /api/briefing/{case_id}` - Get briefing content
   - `POST /api/briefing/{case_id}/complete` - Mark completed

5. **Component Hierarchy**
   - `App.tsx` (controller) → `Modal` (UI wrapper) → `CaseBriefing` (new component)
   - Reuse existing Card, Button components

6. **LLM Context** (Optional enhancement)
   - `src/context/mentor.py` - Add `build_moody_greeting_llm()`
   - Generates Moody's opening line ("Alright, listen up...")

---

## Critical Files Reference

| File | Purpose | Pattern |
|------|---------|---------|
| `frontend/src/components/MentorFeedback.tsx` | Feedback display pattern | Follow this for card UI |
| `frontend/src/components/ConfrontationDialogue.tsx` | Dialogue pattern | Multi-speaker dialogue |
| `frontend/src/components/WitnessInterview.tsx` | Conversation pattern | Chat bubbles, trust meter |
| `frontend/src/api/client.ts` | API wrapper pattern | Type-safe fetch functions |
| `backend/src/context/mentor.py` | LLM feedback builder | build_moody_feedback_llm() |
| `backend/src/state/player_state.py` | State models | Extend PlayerState |
| `backend/src/case_store/case_001.yaml` | Case structure | Add briefing: module |
| `backend/src/api/routes.py` | API endpoints | POST pattern for LLM |
| `frontend/src/components/__tests__/MentorFeedback.test.tsx` | Testing pattern | Vitest + RTL |
| `backend/tests/test_mentor.py` | Backend testing pattern | pytest pattern |

---

## Success Criteria for CaseBriefing Component

### Functional Requirements
- [ ] Briefing loads from YAML case_001.briefing module
- [ ] Player can view 1-3 rationality concepts before investigation
- [ ] Each concept shows: title, teaching explanation, case-specific example
- [ ] "Skip" button available for returning players (after 2 playthroughs)
- [ ] "Continue" button marks briefing complete and starts investigation
- [ ] Loading spinner while fetching briefing from backend
- [ ] Briefing state persisted (no re-show on page reload if completed)

### Design Requirements
- [ ] Follows existing dark terminal theme (gray-900, amber accents)
- [ ] Monospace font throughout (`font-mono`)
- [ ] Card-based layout matching MentorFeedback pattern
- [ ] Dialogue-style presentation (optional: Moody greeting text)
- [ ] Mobile responsive (max-w-[85%] bubbles, scrollable on small screens)

### Code Quality
- [ ] TypeScript strict mode, no `any`
- [ ] Comprehensive Vitest tests (50+ test cases)
- [ ] Accessibility: ARIA labels, keyboard navigation
- [ ] Error handling: Network failures, missing YAML data
- [ ] All tests passing (frontend + backend)

---

## Gotchas & Warnings

- ⚠️ **YAML module new**: Ensure `briefing:` key added to case_001.yaml structure (otherwise 404)
- ⚠️ **No phase gates**: Briefing is ALWAYS shown (not part of phased system anymore)
- ⚠️ **State persistence**: Must call `/api/briefing/{case_id}/complete` to avoid re-showing
- ⚠️ **LLM fallback**: If Claude API fails, use template greeting (not pure error)
- ⚠️ **Skip logic**: Only allow skip after player completes case 2x (track in player_state)
- ⚠️ **Modal blocking**: Briefing modal should prevent investigation interaction (z-index)
- ⚠️ **Performance**: Don't load all case data on briefing request (separate endpoint)

---

## Confidence Level

**HIGH** - Analysis based on:
- ✅ 643 existing tests (348 backend, 295 frontend)
- ✅ 5 complete phases implemented + tested
- ✅ Consistent patterns across MentorFeedback, ConfrontationDialogue, WitnessInterview
- ✅ YAML case structure well-established
- ✅ API endpoint patterns proven with /submit-verdict, /interrogate
- ✅ State model patterns clear from PlayerState, VerdictState

---

**Files Analyzed**: 18
**Symbols Extracted**: 40+
**Integration Points Identified**: 6
**Pattern Confidence**: HIGH
