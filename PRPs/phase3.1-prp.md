# Phase 3.1: State Management Fixes + LLM Mentor Feedback - PRP

## Goal

Fix critical UX bugs blocking verdict retries + replace mechanical mentor feedback with natural LLM-generated Moody responses.

## Why

**User Impact**:
- **CRITICAL BUG**: Cannot submit second verdict after solving case (game becomes unplayable)
- **No restart**: Cannot reset progress to start fresh
- **Poor engagement**: Template feedback feels robotic, not educational/immersive

**Business Value**:
- Unblocks user from testing/learning (educational game core value)
- Natural Moody feedback increases immersion (character authenticity)
- Retry/restart enables iterative learning (pedagogical benefit)

**Integration**:
- Builds on Phase 3 (verdict system complete)
- Enables user testing/iteration (critical for quality)
- Sets LLM feedback pattern for future features (Tom's voice, briefings)

## What

### User-Visible Behavior

1. **Verdict Retries**:
   - User submits correct verdict → case marked solved
   - User can still submit more verdicts (up to 10 total attempts)
   - No "Case already solved" error blocking submission

2. **Restart Case**:
   - "Restart Case" button visible in header
   - Click → confirmation dialog: "Reset all progress? Evidence, witnesses, and verdicts will be lost."
   - Confirm → all state cleared (fresh investigation)
   - Evidence board empty, witnesses reset, 10 attempts available

3. **Natural LLM Feedback**:
   - **Incorrect verdict**: Moody roasts player with specific critique
     - Example: "WRONG. You accused Granger because she was there? That's correlation, not causation. The frost was cast from OUTSIDE - check your evidence angles."
   - **Correct verdict (strong)**: Grudging respect
     - Example: "Solid work, recruit. You cited the key evidence and reasoned clearly. Let's see if you can handle the confrontation."
   - **Correct verdict (weak)**: Right answer, sloppy reasoning
     - Example: "Lucky guess. Yes, it's Malfoy, but 'he's evil' isn't reasoning. Cite EVIDENCE next time - frost pattern, wand signature. Do better."
   - Loading spinner shows during LLM call (~2-3 seconds)
   - Fallback to templates if LLM fails (no user-visible error)

### Technical Requirements

- Remove `case_solved` validation check (allow educational retries)
- Add `POST /api/case/{case_id}/reset` endpoint
- Replace `build_mentor_feedback()` with LLM prompt + fallback
- Frontend button + confirmation dialog
- Tests for reset flow + LLM feedback generation

### Success Criteria

- [ ] User can submit multiple verdicts after case_solved
- [ ] "Restart Case" button works (clears all state)
- [ ] LLM feedback feels natural (Moody's voice)
- [ ] Feedback references player's specific reasoning
- [ ] Template fallback works (no crashes)
- [ ] Loading state shown during LLM call
- [ ] All tests pass (existing + new)
- [ ] User testing: "Can retry", "Can restart", "Feedback feels real"

---

## Context & References

### Documentation (URLs for AI agent)

```yaml
- url: backend/src/context/narrator.py (lines 81-145)
  why: Pattern for LLM prompt structure (apply to mentor)

- url: backend/src/api/claude_client.py
  why: Existing Claude Haiku client (reuse for mentor)

- url: backend/src/state/persistence.py (lines 59-77)
  why: delete_state() function already exists (expose via API)

- url: backend/src/api/routes.py (lines 938-944)
  why: Bug location (case_solved check to remove)
```

### Codebase Patterns

```yaml
- file: backend/src/api/routes.py
  why: Existing endpoint patterns (follow for /reset)
  symbol: submit_verdict (lines 883-1049)

- file: backend/src/context/mentor.py
  why: Current template system (replace with LLM)
  symbol: build_mentor_feedback (lines 5-67)

- file: backend/src/context/narrator.py
  why: LLM prompt pattern (rules, examples, strict instructions)
  symbol: build_narrator_prompt (lines 81-145)

- file: backend/tests/test_persistence.py
  why: Testing pattern for delete_state() (lines 101-118)
```

### Research

- Internal: Investigation report at `docs/PHASE_3.1_INVESTIGATION_REPORT.md` (root cause analysis)
- Pattern: Narrator LLM uses strict rules + examples + context isolation (apply to mentor)

---

## Quick Reference (Context Package)

### Essential API Signatures

```python
# From claude_client.py - Existing client
def get_response(prompt: str, model: str = DEFAULT_MODEL, max_tokens: int = DEFAULT_MAX_TOKENS) -> str:
    """Call Claude API with prompt, return response text."""
    # Pattern: Use for mentor feedback generation

# From persistence.py - Already exists
def delete_state(case_id: str, player_id: str, saves_dir: Path | None = None) -> bool:
    """Delete saved state file. Returns True if deleted, False if not found."""
    # Pattern: Expose via new /reset endpoint

# From mentor.py - Current template system
def build_mentor_feedback(
    correct: bool,
    score: int,
    fallacies: list[str],
    reasoning: str,
    accused_id: str,
    solution: dict[str, Any],
    feedback_templates: dict[str, Any],
    attempts_remaining: int,
) -> dict[str, Any]:
    """Returns: {analysis, fallacies_detected, score, quality, critique, praise, hint}"""
    # Pattern: Keep structure, replace text generation with LLM
```

### Key Patterns from Research

```python
# From narrator.py - LLM prompt pattern
def build_narrator_prompt(...) -> str:
    return f"""You are the narrator for a Harry Potter detective game.

== RULES ==
1. If X then Y (clear conditional logic)
2. NEVER invent content not in provided data
3. Stay in character
4. Keep responses 2-4 sentences

== CONTEXT ==
{context_data}

== PLAYER INPUT ==
"{player_input}"

Respond as narrator (2-4 sentences):"""

# Pattern: Apply to mentor prompts (strict rules, examples, context isolation)
```

### Library-Specific Gotchas

- **Claude API**: Rate limits apply (429 errors) → Fallback to templates gracefully
- **JSON serialization**: `PlayerState.model_dump(mode="json")` handles datetime conversion
- **State validation**: Pydantic validates on load → corrupt JSON raises ValidationError

### Decision Tree

```
If verdict submission AND case_solved=True:
  → REMOVE check (allow retries) [lines 938-944 in routes.py]

If user clicks "Restart Case":
  → Show confirm dialog
  → If confirmed → POST /api/case/{case_id}/reset
  → Backend deletes save file
  → Frontend resets state (reload or manual reset)

If building mentor feedback:
  → Try LLM prompt (call_claude_haiku)
  → If LLM fails (timeout, rate limit, error) → Fallback to templates
  → If LLM succeeds → Use response
```

### Configuration Requirements

```python
# backend/.env (existing)
ANTHROPIC_API_KEY=sk-ant-...  # Already configured (Phase 1)
DEFAULT_MODEL=claude-3-haiku-20240307  # Existing

# No new config needed - reuse narrator client
```

---

## Current Codebase Structure

```bash
backend/src/
├── api/
│   ├── routes.py              # submit_verdict endpoint (BUG HERE line 938)
│   ├── claude_client.py       # Existing Claude Haiku client
│   └── models.py              # API request/response models
├── context/
│   ├── narrator.py            # LLM prompt pattern (REFERENCE)
│   ├── mentor.py              # Template feedback (REPLACE WITH LLM)
│   └── witness.py             # Witness LLM context
├── state/
│   ├── player_state.py        # VerdictState class
│   └── persistence.py         # save_state, load_state, delete_state
└── tests/
    ├── test_routes.py         # API endpoint tests
    ├── test_mentor.py         # Mentor feedback tests
    └── test_persistence.py    # Persistence tests

frontend/src/
├── components/
│   ├── Header.tsx             # Add "Restart" button here
│   ├── MentorFeedback.tsx     # Show loading spinner
│   └── Modal.tsx              # Reuse for confirm dialog
├── api/
│   └── client.ts              # Add resetCase() function
└── __tests__/
    └── Header.test.tsx        # Test restart button
```

---

## Desired Codebase Structure

```bash
backend/src/
├── api/
│   ├── routes.py              # MODIFY: Remove case_solved check, add reset endpoint
│   ├── models.py              # CREATE: ResetResponse model
├── context/
│   ├── mentor.py              # MODIFY: Add build_moody_llm_prompt(), fallback logic
└── tests/
    ├── test_routes.py         # CREATE: test_reset_endpoint
    ├── test_mentor.py         # CREATE: test_llm_feedback_generation, test_fallback

frontend/src/
├── components/
│   ├── Header.tsx             # MODIFY: Add "Restart Case" button
│   ├── ConfirmDialog.tsx      # CREATE: Reusable confirm dialog
│   ├── MentorFeedback.tsx     # MODIFY: Add loading spinner state
└── api/
    └── client.ts              # CREATE: resetCase() function
```

---

## Files to Create/Modify

| File | Action | Purpose | Dependencies |
|------|--------|---------|--------------|
| `backend/src/api/routes.py` | MODIFY | Remove case_solved check (lines 938-944), add reset endpoint | delete_state() |
| `backend/src/api/models.py` | MODIFY | Add ResetResponse Pydantic model | None |
| `backend/src/context/mentor.py` | MODIFY | Add LLM prompt builders, fallback logic | claude_client.py |
| `backend/tests/test_routes.py` | MODIFY | Add reset endpoint tests (3 tests) | None |
| `backend/tests/test_mentor.py` | MODIFY | Add LLM feedback tests (5 tests) | None |
| `frontend/src/components/Header.tsx` | MODIFY | Add "Restart Case" button | ConfirmDialog |
| `frontend/src/components/ConfirmDialog.tsx` | CREATE | Reusable confirmation modal | Modal.tsx |
| `frontend/src/components/MentorFeedback.tsx` | MODIFY | Add loading state (isGenerating) | None |
| `frontend/src/api/client.ts` | MODIFY | Add resetCase() API function | None |
| `frontend/src/__tests__/Header.test.tsx` | CREATE | Test restart button + confirm flow | None |

---

## Tasks (ordered)

### Task 1: Remove case_solved Check (Backend)
**File**: `backend/src/api/routes.py`
**Action**: MODIFY
**Purpose**: Allow educational retries after solving case
**Pattern**: Delete lines 938-944
**Depends on**: None
**Acceptance criteria**:
- [ ] Lines 938-944 deleted (`if verdict_state.case_solved: raise HTTPException...`)
- [ ] Verdict submission works after case_solved=True
- [ ] Existing tests pass

### Task 2: Add Reset Endpoint (Backend)
**File**: `backend/src/api/routes.py`
**Action**: MODIFY (add new endpoint)
**Purpose**: Expose delete_state() via REST API
**Pattern**: Follow submit_verdict endpoint structure
**Depends on**: Task 1
**Acceptance criteria**:
- [ ] `POST /api/case/{case_id}/reset` endpoint exists
- [ ] Query param: `player_id` (default: "default")
- [ ] Calls `delete_state(case_id, player_id)`
- [ ] Returns `ResetResponse` model
- [ ] Test: `test_reset_deletes_state()` passes

**Implementation**:
```python
@router.post("/case/{case_id}/reset", response_model=ResetResponse)
async def reset_case(case_id: str, player_id: str = "default") -> ResetResponse:
    """Reset case progress (delete saved state).

    Query params:
        player_id: Player identifier (default: "default")
    """
    from src.state.persistence import delete_state

    deleted = delete_state(case_id, player_id)

    if deleted:
        return ResetResponse(
            success=True,
            message=f"Case {case_id} reset successfully."
        )
    else:
        return ResetResponse(
            success=False,
            message=f"No saved progress found for case {case_id}."
        )
```

### Task 3: Add ResetResponse Model (Backend)
**File**: `backend/src/api/models.py`
**Action**: MODIFY (add model)
**Purpose**: Type-safe response for reset endpoint
**Depends on**: None
**Acceptance criteria**:
- [ ] `ResetResponse` Pydantic model exists
- [ ] Fields: `success: bool`, `message: str`

**Implementation**:
```python
class ResetResponse(BaseModel):
    """Response for case reset endpoint."""
    success: bool
    message: str
```

### Task 4: Add LLM Prompt Builders (Backend)
**File**: `backend/src/context/mentor.py`
**Action**: MODIFY (add functions)
**Purpose**: Generate natural Moody feedback via Claude Haiku
**Pattern**: Follow narrator.py prompt structure (strict rules, examples)
**Depends on**: None
**Acceptance criteria**:
- [ ] `build_moody_roast_prompt()` function exists (incorrect verdict)
- [ ] `build_moody_praise_prompt()` function exists (correct verdict)
- [ ] Prompts include: context, rules, examples, tone guidance
- [ ] Length: 2-4 sentences max

**Implementation** (see Quick Reference for full prompts):
```python
def build_moody_roast_prompt(
    player_reasoning: str,
    accused_suspect: str,
    actual_culprit: str,
    evidence_cited: list[str],
    key_evidence_missed: list[str],
    fallacies: list[str],
    score: int,
) -> str:
    """Build LLM prompt for Moody's harsh feedback on incorrect verdict."""

    fallacies_str = ", ".join(fallacies) if fallacies else "None"
    cited_str = ", ".join(evidence_cited) if evidence_cited else "None"
    missed_str = ", ".join(key_evidence_missed) if key_evidence_missed else "None"

    return f"""You are Alastor "Mad-Eye" Moody, a gruff veteran Auror trainer.

A student just submitted an INCORRECT verdict:
- Accused: {accused_suspect} (WRONG)
- Actual culprit: {actual_culprit}
- Reasoning: "{player_reasoning}"
- Evidence cited: {cited_str}
- Key evidence missed: {missed_str}
- Logical fallacies: {fallacies_str}
- Reasoning score: {score}/100

Your task: Roast this verdict. Be harsh but educational. Point out:
1. What they got wrong (who's actually guilty, why)
2. What evidence they missed or misinterpreted
3. What logical errors they made
4. How to think like a real Auror

Tone: Gruff, impatient, but ultimately wants them to learn.
Length: 2-4 sentences MAXIMUM. No fluff.

EXAMPLES (match this style):
- "WRONG, recruit. You accused {accused_suspect} because they 'were there'? That's correlation, not causation. The frost pattern was cast from OUTSIDE the window - did you check the casting direction? Pathetic work."
- "Lucky you didn't get someone killed with that reasoning. The wand signature CLEARLY points to {actual_culprit}, not {accused_suspect}. You missed the most obvious evidence. Do better."

Now roast this verdict (2-4 sentences):"""


def build_moody_praise_prompt(
    player_reasoning: str,
    accused_suspect: str,
    evidence_cited: list[str],
    score: int,
    fallacies: list[str],
) -> str:
    """Build LLM prompt for Moody's feedback on correct verdict."""

    fallacies_str = ", ".join(fallacies) if fallacies else "None"
    cited_str = ", ".join(evidence_cited) if evidence_cited else "None"

    return f"""You are Alastor "Mad-Eye" Moody, a gruff veteran Auror trainer.

A student just submitted a CORRECT verdict:
- Accused: {accused_suspect} (CORRECT)
- Reasoning: "{player_reasoning}"
- Evidence cited: {cited_str}
- Reasoning score: {score}/100
- Logical issues: {fallacies_str}

Your task: Acknowledge they got it right, but critique their reasoning if needed.

If score ≥85: Grudging respect
  Example: "Good work. You cited the key evidence and reasoned clearly. Now let's see if you can handle the confrontation."

If score 60-84: Correct but sloppy
  Example: "Right answer, but your reasoning was sloppy. You {point out fallacy}. Cite EVIDENCE, not hunches."

If score <60: Right by luck
  Example: "You got lucky. Yes, it's {accused_suspect}, but 'he's evil' isn't reasoning. The frost pattern and wand signature are PROOF. Do better next time."

Tone: Gruff, never effusive. 2-4 sentences MAXIMUM.

Now provide feedback (2-4 sentences):"""
```

### Task 5: Add LLM Feedback Generator with Fallback (Backend)
**File**: `backend/src/context/mentor.py`
**Action**: MODIFY (add function)
**Purpose**: Call LLM for feedback, fallback to templates on error
**Depends on**: Task 4
**Acceptance criteria**:
- [ ] `build_moody_feedback_llm()` function exists
- [ ] Tries LLM first (call Claude Haiku)
- [ ] Falls back to templates on error (timeout, rate limit, etc.)
- [ ] Logs errors but doesn't crash
- [ ] Returns natural language string (not structured dict)

**Implementation**:
```python
import logging
from src.api.claude_client import get_response

logger = logging.getLogger(__name__)


def build_moody_feedback_llm(
    correct: bool,
    score: int,
    fallacies: list[str],
    reasoning: str,
    accused_id: str,
    solution: dict[str, Any],
    attempts_remaining: int,
    evidence_cited: list[str],
    feedback_templates: dict[str, Any],
) -> str:
    """Generate Moody's feedback via Claude Haiku with template fallback.

    Args:
        correct: Whether verdict was correct
        score: Reasoning quality score (0-100)
        fallacies: List of fallacy IDs detected
        reasoning: Player's reasoning text
        accused_id: Who player accused
        solution: Solution dict from YAML (culprit, critical_evidence, etc.)
        attempts_remaining: Attempts left
        evidence_cited: Evidence IDs player selected
        feedback_templates: Templates for fallback

    Returns:
        Natural language feedback (2-4 sentences)
    """
    try:
        if correct:
            prompt = build_moody_praise_prompt(
                player_reasoning=reasoning,
                accused_suspect=accused_id,
                evidence_cited=evidence_cited,
                score=score,
                fallacies=fallacies,
            )
        else:
            # Extract key evidence from solution
            critical_evidence = solution.get("critical_evidence", [])
            cited_set = set(evidence_cited)
            key_missed = [e for e in critical_evidence if e not in cited_set]
            actual_culprit = solution.get("culprit", "unknown")

            prompt = build_moody_roast_prompt(
                player_reasoning=reasoning,
                accused_suspect=accused_id,
                actual_culprit=actual_culprit,
                evidence_cited=evidence_cited,
                key_evidence_missed=key_missed,
                fallacies=fallacies,
                score=score,
            )

        # Call Claude Haiku
        response = get_response(prompt, max_tokens=200)
        return response.strip()

    except Exception as e:
        logger.warning(f"LLM feedback failed, using template fallback: {e}")
        # Fallback to existing template logic
        return _build_template_feedback(
            correct=correct,
            score=score,
            fallacies=fallacies,
            reasoning=reasoning,
            accused_id=accused_id,
            solution=solution,
            attempts_remaining=attempts_remaining,
        )


def _build_template_feedback(
    correct: bool,
    score: int,
    fallacies: list[str],
    reasoning: str,
    accused_id: str,
    solution: dict[str, Any],
    attempts_remaining: int,
) -> str:
    """Template-based feedback fallback (existing logic)."""
    quality = _determine_quality(score)

    if not correct:
        culprit = solution.get("culprit", "unknown")
        return f"Incorrect, recruit. The actual culprit was {culprit}. You accused {accused_id} with reasoning: '{reasoning[:100]}...'. Quality: {quality}. Attempts remaining: {attempts_remaining}."
    else:
        return f"Correct. You identified {accused_id} as guilty. Reasoning quality: {quality}. Good work."
```

### Task 6: Integrate LLM Feedback into Endpoint (Backend)
**File**: `backend/src/api/routes.py`
**Action**: MODIFY
**Purpose**: Use LLM feedback in submit_verdict response
**Pattern**: Replace `build_mentor_feedback()` call with `build_moody_feedback_llm()`
**Depends on**: Task 5
**Acceptance criteria**:
- [ ] `submit_verdict` endpoint calls `build_moody_feedback_llm()`
- [ ] Response includes LLM-generated text
- [ ] Template fallback works silently (no errors visible to user)

**Implementation** (in `submit_verdict` function, around line 990):
```python
# OLD (line 990-1000):
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

# NEW:
moody_text = build_moody_feedback_llm(
    correct=correct,
    score=score,
    fallacies=fallacies,
    reasoning=request.reasoning,
    accused_id=request.accused_suspect_id,
    solution=solution,
    attempts_remaining=verdict_state.attempts_remaining,
    evidence_cited=request.evidence_cited,
    feedback_templates=mentor_templates,
)

# Convert fallacies to FallacyDetail (keep existing logic)
fallacies_detailed = [
    FallacyDetail(
        name=f["name"],
        description=f["description"],
        example=f.get("example", ""),
    )
    for f in mentor_feedback_dict["fallacies_detected"]  # Still need to call build_mentor_feedback for structured data
]

# Update MentorFeedback to include LLM text
mentor_feedback = MentorFeedback(
    analysis=moody_text,  # LLM-generated natural language
    fallacies_detected=fallacies_detailed,
    score=score,
    quality=_determine_quality(score),
    critique="",  # LLM text covers this
    praise="",    # LLM text covers this
    hint=None,    # LLM text covers this
)
```

**Note**: May need to adjust MentorFeedback model to make critique/praise/hint optional if using LLM text.

### Task 7: Add Backend Tests (Backend)
**File**: `backend/tests/test_routes.py`, `backend/tests/test_mentor.py`
**Action**: MODIFY (add tests)
**Purpose**: Verify reset endpoint + LLM feedback
**Depends on**: Tasks 2, 5
**Acceptance criteria**:
- [ ] `test_reset_endpoint_deletes_state()` passes
- [ ] `test_reset_endpoint_nonexistent_file()` passes
- [ ] `test_verdict_allows_retry_after_solved()` passes
- [ ] `test_llm_feedback_generation()` passes (mock LLM call)
- [ ] `test_llm_feedback_fallback()` passes (mock LLM error)

**Implementation** (test_routes.py):
```python
def test_reset_endpoint_deletes_state(client, test_case_data):
    """Reset endpoint deletes saved state."""
    # Create state
    state = PlayerState(case_id="case_001")
    save_state(state, "player_1")

    # Reset
    response = client.post("/api/case/case_001/reset?player_id=player_1")

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "reset" in data["message"].lower()

    # Verify deleted
    loaded = load_state("case_001", "player_1")
    assert loaded is None


def test_reset_endpoint_nonexistent_file(client):
    """Reset endpoint handles missing file gracefully."""
    response = client.post("/api/case/case_999/reset?player_id=player_999")

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert "no saved progress" in data["message"].lower()


def test_verdict_allows_retry_after_solved(client, test_case_data):
    """Can submit verdict after case_solved=True."""
    # Create state with case_solved=True
    state = PlayerState(case_id="case_001")
    state.verdict_state = VerdictState(case_id="case_001")
    state.verdict_state.add_attempt(
        accused_id="draco",
        reasoning="Test",
        evidence_cited=[],
        correct=True,
        score=90,
        fallacies=[],
    )
    assert state.verdict_state.case_solved is True
    save_state(state, "default")

    # Try second verdict
    response = client.post("/api/submit-verdict", json={
        "case_id": "case_001",
        "player_id": "default",
        "accused_suspect_id": "hermione",
        "reasoning": "Second attempt",
        "evidence_cited": [],
    })

    # Should work (no 400 error)
    assert response.status_code == 200
```

**Implementation** (test_mentor.py):
```python
from unittest.mock import patch


def test_llm_feedback_generation():
    """LLM feedback calls Claude and returns natural text."""
    with patch("src.context.mentor.get_response") as mock_claude:
        mock_claude.return_value = "WRONG. You missed the key evidence. Do better."

        feedback = build_moody_feedback_llm(
            correct=False,
            score=50,
            fallacies=["confirmation_bias"],
            reasoning="Test reasoning",
            accused_id="hermione",
            solution={"culprit": "draco", "critical_evidence": ["frost_pattern"]},
            attempts_remaining=8,
            evidence_cited=[],
            feedback_templates={},
        )

        assert "WRONG" in feedback
        assert mock_claude.called


def test_llm_feedback_fallback():
    """LLM failure falls back to templates gracefully."""
    with patch("src.context.mentor.get_response") as mock_claude:
        mock_claude.side_effect = Exception("API timeout")

        feedback = build_moody_feedback_llm(
            correct=False,
            score=50,
            fallacies=[],
            reasoning="Test",
            accused_id="hermione",
            solution={"culprit": "draco"},
            attempts_remaining=8,
            evidence_cited=[],
            feedback_templates={},
        )

        # Should return template fallback (not crash)
        assert isinstance(feedback, str)
        assert len(feedback) > 0
```

### Task 8: Add Restart Button (Frontend)
**File**: `frontend/src/components/Header.tsx`
**Action**: MODIFY
**Purpose**: Visible restart button in UI
**Depends on**: None
**Acceptance criteria**:
- [ ] "Restart Case" button visible in header
- [ ] Click opens confirmation dialog
- [ ] Styled consistently with existing buttons

**Implementation**:
```tsx
import { useState } from 'react';
import ConfirmDialog from './ConfirmDialog';

export function Header({ caseTitle, onRestart }: { caseTitle: string, onRestart: () => void }) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <header className="border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{caseTitle}</h1>
        <button
          onClick={() => setShowConfirm(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
        >
          Restart Case
        </button>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Restart Case"
        message="Reset all progress? Evidence, witnesses, and verdicts will be lost."
        onConfirm={() => {
          setShowConfirm(false);
          onRestart();
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </header>
  );
}
```

### Task 9: Create ConfirmDialog Component (Frontend)
**File**: `frontend/src/components/ConfirmDialog.tsx`
**Action**: CREATE
**Purpose**: Reusable confirmation modal
**Pattern**: Use existing Modal.tsx component
**Depends on**: None
**Acceptance criteria**:
- [ ] Modal with title, message, Confirm/Cancel buttons
- [ ] Accessible (keyboard navigation, ARIA)
- [ ] Styled consistently (terminal theme)

**Implementation**:
```tsx
import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <Modal onClose={onCancel}>
      <div className="space-y-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-gray-300">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
}
```

### Task 10: Add resetCase API Function (Frontend)
**File**: `frontend/src/api/client.ts`
**Action**: MODIFY
**Purpose**: Call /reset endpoint from frontend
**Depends on**: Task 2
**Acceptance criteria**:
- [ ] `resetCase()` function exists
- [ ] Calls `POST /api/case/{case_id}/reset?player_id={id}`
- [ ] Returns success status

**Implementation**:
```typescript
export async function resetCase(caseId: string, playerId: string = 'default'): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/case/${caseId}/reset?player_id=${playerId}`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to reset case');
  }

  return response.json();
}
```

### Task 11: Add Loading Spinner to MentorFeedback (Frontend)
**File**: `frontend/src/components/MentorFeedback.tsx`
**Action**: MODIFY
**Purpose**: Show loading state during LLM call (~2-3s)
**Depends on**: None
**Acceptance criteria**:
- [ ] Loading spinner shows while waiting for feedback
- [ ] Spinner disappears when feedback arrives
- [ ] Accessible (ARIA labels)

**Implementation**:
```tsx
export function MentorFeedback({ feedback, isLoading }: { feedback?: string; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-4 border border-gray-700 rounded">
        <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
        <span className="text-gray-400">Moody is evaluating your verdict...</span>
      </div>
    );
  }

  if (!feedback) return null;

  return (
    <div className="p-4 border border-gray-700 rounded bg-gray-800">
      <h3 className="font-bold mb-2">Moody's Feedback:</h3>
      <p className="text-gray-300">{feedback}</p>
    </div>
  );
}
```

### Task 12: Integrate Restart into App.tsx (Frontend)
**File**: `frontend/src/App.tsx`
**Action**: MODIFY
**Purpose**: Wire restart button to state reset
**Depends on**: Tasks 8, 10
**Acceptance criteria**:
- [ ] Restart button calls `resetCase()` API
- [ ] On success, clears all frontend state
- [ ] User returns to fresh investigation

**Implementation**:
```tsx
import { resetCase } from './api/client';

function App() {
  const [state, setState] = useState(initialState);

  const handleRestart = async () => {
    try {
      const result = await resetCase('case_001');
      if (result.success) {
        // Reset all state
        setState(initialState);
        // Or: window.location.reload();  // Simpler but less elegant
      } else {
        console.error('Reset failed:', result.message);
      }
    } catch (error) {
      console.error('Error resetting case:', error);
    }
  };

  return (
    <div>
      <Header caseTitle="Case 001" onRestart={handleRestart} />
      {/* Rest of app */}
    </div>
  );
}
```

### Task 13: Add Frontend Tests (Frontend)
**File**: `frontend/src/__tests__/Header.test.tsx`, `ConfirmDialog.test.tsx`
**Action**: CREATE
**Purpose**: Test restart button flow
**Depends on**: Tasks 8, 9
**Acceptance criteria**:
- [ ] Test: Restart button opens confirm dialog
- [ ] Test: Confirm calls onRestart callback
- [ ] Test: Cancel closes dialog without action

**Implementation**:
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../components/Header';

test('restart button opens confirmation dialog', () => {
  render(<Header caseTitle="Test Case" onRestart={() => {}} />);

  const button = screen.getByText('Restart Case');
  fireEvent.click(button);

  expect(screen.getByText(/reset all progress/i)).toBeInTheDocument();
});

test('confirm dialog calls onRestart', () => {
  const mockRestart = jest.fn();
  render(<Header caseTitle="Test Case" onRestart={mockRestart} />);

  fireEvent.click(screen.getByText('Restart Case'));
  fireEvent.click(screen.getByText('Confirm'));

  expect(mockRestart).toHaveBeenCalled();
});
```

### Task 14: Integration Testing (Full Stack)
**File**: Manual testing + integration tests
**Action**: TEST
**Purpose**: Verify end-to-end flow
**Depends on**: All tasks
**Acceptance criteria**:
- [ ] Submit verdict → restart → verdict works
- [ ] LLM feedback feels natural (manual review)
- [ ] Template fallback works (simulate LLM error)
- [ ] All 374 existing tests still pass
- [ ] New tests pass (reset, LLM, UI)

**Manual Test Script**:
1. Start backend + frontend
2. Investigate case, submit incorrect verdict
3. Verify: Moody roast appears (natural language)
4. Submit correct verdict
5. Verify: Moody feedback + confrontation
6. Click "Restart Case" → Confirm
7. Verify: Evidence cleared, witnesses reset, 10 attempts
8. Submit another verdict
9. Verify: Works (no "case already solved" error)

---

## Integration Points

### State Management
- **Where**: `backend/src/api/routes.py` (submit_verdict, reset_case endpoints)
- **What**: Remove case_solved check, add reset endpoint
- **Pattern**: Follow existing endpoint patterns (request models, error handling)

### LLM Integration
- **Where**: `backend/src/context/mentor.py`
- **What**: Call Claude Haiku for feedback generation
- **Pattern**: Reuse narrator prompt structure (strict rules, examples, context isolation)

### Frontend State
- **Where**: `frontend/src/App.tsx`
- **What**: Reset all state on restart
- **Pattern**: Either `setState(initialState)` or `window.location.reload()`

---

## Known Gotchas

### Category: API Rate Limits
- **Issue**: Claude API rate limits (429 errors) during high usage
- **Solution**: Fallback to templates gracefully, log errors, don't crash

### Category: State Corruption
- **Issue**: Partial state reset (e.g., evidence cleared but verdict state remains)
- **Solution**: `delete_state()` deletes entire file atomically (no partial deletes)

### Category: Loading UX
- **Issue**: LLM call takes 2-3 seconds (feels slow)
- **Solution**: Show loading spinner immediately, set user expectation

### Category: Prompt Engineering
- **Issue**: LLM might generate too-long feedback (>4 sentences)
- **Solution**: Set `max_tokens=200` (limits output), include "2-4 sentences MAX" in prompt

---

## Validation Loop

### Level 1: Syntax & Style
```bash
cd backend
uv run ruff check .
uv run ruff format .
uv run mypy src/

cd frontend
bun run lint
bun run type-check
# Expected: No errors
```

### Level 2: Unit Tests
- Test file locations:
  - Backend: `backend/tests/test_routes.py`, `test_mentor.py`
  - Frontend: `frontend/src/__tests__/Header.test.tsx`, `ConfirmDialog.test.tsx`
- Coverage target: 80%+
- Scenarios tested:
  - Reset endpoint deletes state
  - Reset handles missing file
  - Verdict works after case_solved
  - LLM feedback generation
  - LLM fallback on error
  - Restart button flow
  - Confirm dialog flow

```bash
cd backend
uv run pytest
# Expected: All tests pass (existing 317 + new ~8 = 325)

cd frontend
bun run test
# Expected: All tests pass (existing 287 + new ~3 = 290)
```

### Level 3: Integration/Manual
```bash
cd backend
uv run uvicorn src.main:app --reload

cd frontend
bun run dev

# Manual verification steps:
# 1. Submit incorrect verdict → Moody roast (natural, harsh, educational)
# 2. Submit correct verdict → Moody feedback (acknowledges success)
# 3. Click "Restart Case" → Confirm dialog → State cleared
# 4. Submit verdict after restart → Works (10 attempts available)
# 5. Simulate LLM error (disable API key) → Template fallback works
```

---

## Dependencies

- `anthropic` library (existing - Phase 1)
- `delete_state()` function (existing - persistence.py)
- Modal component (existing - frontend)
- Claude Haiku API key (existing - .env)

**No new dependencies needed.**

---

## Out of Scope

- Multiple save slots (defer to Phase 6)
- Undo last verdict (complexity >> value)
- Replay confrontation after solved (not requested)
- Dynamic LLM-based confrontation (keep static YAML for now)
- Bayesian probability tracker integration (Phase 5.5)

---

## Agent Orchestration Plan

### Execution Strategy

**Sequential Track** (dependencies):
1. `fastapi-specialist` → Backend changes (Tasks 1-7)
2. `react-vite-specialist` → Frontend changes (Tasks 8-13)
3. `validation-gates` → Full test suite (Task 14)

**Why Sequential**: Backend API must exist before frontend can call it.

### Agent-Specific Guidance

#### For fastapi-specialist
- **Input**: Tasks 1-7 (backend)
- **Pattern**: Follow `submit_verdict` endpoint structure for `/reset`
- **Context**: Use narrator.py prompt pattern for mentor prompts
- **Output**: Reset endpoint + LLM feedback working

**Key Files**:
- `src/api/routes.py` (remove check, add endpoint)
- `src/api/models.py` (add ResetResponse)
- `src/context/mentor.py` (add LLM prompts + fallback)
- `tests/test_routes.py`, `tests/test_mentor.py` (add tests)

**Acceptance**:
- [ ] `POST /api/case/{case_id}/reset` works
- [ ] Verdict submission works after case_solved
- [ ] LLM feedback generates natural text
- [ ] Template fallback works
- [ ] All backend tests pass

#### For react-vite-specialist
- **Input**: Tasks 8-13 (frontend)
- **Dependencies**: Wait for fastapi-specialist (reset endpoint must exist)
- **Pattern**: Follow existing Modal.tsx pattern for ConfirmDialog
- **Context**: Use Quick Reference API signatures for resetCase()

**Key Files**:
- `src/components/Header.tsx` (restart button)
- `src/components/ConfirmDialog.tsx` (create)
- `src/components/MentorFeedback.tsx` (loading spinner)
- `src/api/client.ts` (resetCase function)
- `src/App.tsx` (integrate restart)
- `src/__tests__/Header.test.tsx` (tests)

**Acceptance**:
- [ ] "Restart Case" button visible
- [ ] Confirm dialog works
- [ ] Restart calls API + clears state
- [ ] Loading spinner shows during LLM call
- [ ] All frontend tests pass

#### For validation-gates
- **Input**: All tasks complete
- **Scenarios**: Listed in Level 2 tests section
- **Success**: All tests pass (existing + new), manual flow works

**Test Commands**:
```bash
cd backend && uv run pytest
cd frontend && bun run test
# Manual: Submit verdict → Restart → Verify
```

### Handoff Context

**Next agent receives**:
- This PRP (full context)
- Quick Reference (API signatures, patterns)
- Investigation report (root cause analysis)
- Specific task numbers to implement

**Next agent does NOT need**:
- ❌ Read INITIAL.md (summarized in PRP)
- ❌ Search for examples (patterns provided)
- ❌ Research architecture (already analyzed)
- ❌ Read full library docs (Quick Reference sufficient)

---

## Anti-Patterns to Avoid

- ❌ Keeping `case_solved` check (blocks educational retries)
- ❌ Crashing on LLM error (always fallback to templates)
- ❌ Not showing loading state (user thinks app froze)
- ❌ Partial state reset (clear ALL state or none)
- ❌ Too-long LLM feedback (set max_tokens=200)
- ❌ Confirm dialog without clear message (user confusion)

---

**Generated**: 2026-01-06
**Source**: `PRPs/phase3.1-state-fixes-llm-feedback.md` (INITIAL)
**Research**: `docs/PHASE_3.1_INVESTIGATION_REPORT.md`
**Confidence Score**: 9/10 (high - clear bugs identified, solutions validated, patterns exist)

---

## Quick Decision Summary

| Decision Point | Choice | Rationale |
|----------------|--------|-----------|
| Retry policy | Remove case_solved check ✅ | Educational game benefits from retries |
| LLM fallback | Always try LLM, fallback templates ✅ | Reliability without sacrificing quality |
| Button placement | Header (always visible) ✅ | Easy to find, consistent UX |
| Keep attempt history | Yes ✅ | Analytics value, debugging |
| Confirm dialog | Yes ✅ | Prevent accidental resets |
| Loading state | Show spinner ✅ | Set expectation for 2-3s delay |
| Template reuse | Hybrid (LLM + templates) ✅ | Best of both worlds |
