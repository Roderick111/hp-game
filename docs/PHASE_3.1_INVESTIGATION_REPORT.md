# Phase 3.1 Investigation Report: Verdict Blocking + UX Issues

**Date**: 2026-01-06
**Investigator**: planner agent
**Scope**: Root cause analysis for verdict submission blocking + state persistence issues

---

## 🔍 Executive Summary

**Critical Bug Found**: User cannot submit second verdict after solving case.

**Root Cause**: `case_solved=True` flag persists to disk. On server restart, backend loads saved state and rejects verdict submissions with `HTTPException(400, "Case already solved.")`.

**Impact**: Game becomes unplayable after first correct verdict. User locked out, cannot test different verdicts for learning.

**Fix Complexity**: LOW (2-3 days)

---

## 📋 Issues Identified

### Issue 1: Verdict Submission Blocked

**User Report**: "I still cannot submit my verdict"

**Symptoms**:
- User submits correct verdict → case marked solved
- Server restarts
- User attempts second verdict → blocked

**Root Cause Analysis**:

**File**: `backend/src/api/routes.py`
**Lines**: 938-944

```python
# Check if case already solved
if verdict_state.case_solved:
    raise HTTPException(
        status_code=400,
        detail="Case already solved.",
    )
```

**Flow**:
1. User submits verdict → `VerdictState.add_attempt()` called
2. If `correct=True` → `self.case_solved = True` (line 79 in `player_state.py`)
3. State saved to `backend/saves/case_001_default.json` (line 1041 in `routes.py`)
4. Server restarts → `load_state()` loads JSON with `"case_solved": true`
5. Next verdict attempt → `if verdict_state.case_solved: raise HTTPException`

**Evidence**: `backend/saves/case_001_default.json` line 67:
```json
"case_solved": true
```

**Design Flaw**: `case_solved` check prevents educational retries. Game should encourage learning from mistakes, not lock user out after first success.

---

### Issue 2: No Restart Mechanism

**User Report**: "Cannot restart mission"

**Current State**:
- State auto-saves after every action (investigation, interrogation, verdict)
- Save location: `backend/saves/{case_id}_{player_id}.json`
- No endpoint to reset/clear saved state
- No "Restart Case" button in frontend

**Functions Available**:
- ✅ `save_state()` - exists, works
- ✅ `load_state()` - exists, works
- ✅ `delete_state()` - **exists but no API endpoint calls it**

**Gap**: `delete_state()` function exists in `backend/src/state/persistence.py` (lines 59-77) but no REST endpoint exposes it.

**User Workaround**: Manually delete `backend/saves/case_001_default.json` file (not user-friendly).

---

### Issue 3: Mechanical Mentor Feedback

**User Report**: "Feedback too mechanical, want natural LLM-generated Moody responses"

**Current Implementation**: `backend/src/context/mentor.py`

```python
def build_mentor_feedback(...) -> dict:
    analysis = f"You accused {accused_id} because: {reasoning_preview}"
    # Template-based strings, not contextual
```

**Limitations**:
- Fixed templates don't reference player's specific reasoning
- Generic fallacy descriptions ("You focused only on evidence supporting...")
- Doesn't adapt tone to player's attempt (harsh vs helpful)
- Feels robotic, not like gruff Moody character

**User Expectation**:
- Natural language feedback: "WRONG. You accused Granger because she was there? That's correlation, not causation."
- References player's exact words
- Moody's personality shines through
- Educational but harsh (character-authentic)

---

## 🏗️ Current Architecture

### State Persistence

**Save Location**: `backend/saves/` (project root)
**File Format**: JSON
**Naming**: `{case_id}_{player_id}.json`

**Save Triggers**:
- Evidence discovery
- Witness interrogation
- Verdict submission (line 1041 in `routes.py`)

**Save Function** (`persistence.py:14-33`):
```python
def save_state(state: PlayerState, player_id: str, saves_dir: Path | None = None) -> Path:
    save_path = save_dir / f"{state.case_id}_{player_id}.json"
    with open(save_path, "w", encoding="utf-8") as f:
        json.dump(state.model_dump(mode="json"), f, indent=2, default=str)
    return save_path
```

**Load Function** (`persistence.py:36-56`):
```python
def load_state(case_id: str, player_id: str, saves_dir: Path | None = None) -> PlayerState | None:
    save_path = save_dir / f"{case_id}_{player_id}.json"
    if not save_path.exists():
        return None
    with open(save_path, encoding="utf-8") as f:
        data: dict[str, Any] = json.load(f)
    return PlayerState(**data)
```

**Delete Function** (`persistence.py:59-77`):
```python
def delete_state(case_id: str, player_id: str, saves_dir: Path | None = None) -> bool:
    save_path = save_dir / f"{case_id}_{player_id}.json"
    if save_path.exists():
        save_path.unlink()
        return True
    return False
```

**Gap**: No REST endpoint calls `delete_state()`.

---

### Verdict Flow

**Endpoint**: `POST /api/submit-verdict`
**File**: `backend/src/api/routes.py:883-1049`

**Flow**:
1. Load case data + solution
2. Load or create `PlayerState`
3. Initialize `VerdictState` if needed
4. **Check `attempts_remaining > 0`** ✅ Works
5. **Check `case_solved == False`** ❌ **BUG HERE**
6. Evaluate verdict (correct/incorrect)
7. Detect fallacies
8. Score reasoning
9. Add attempt to `VerdictState`
10. Build mentor feedback (templates)
11. Load confrontation if applicable
12. Save state
13. Return response

**Problem Line** (938-944):
```python
if verdict_state.case_solved:
    raise HTTPException(status_code=400, detail="Case already solved.")
```

**Impact**: After first correct verdict, all future verdicts blocked.

---

### Mentor Feedback System

**Current**: Template-based (`mentor.py:5-67`)

**Structure**:
```python
{
    "analysis": str,           # "You accused X because: Y"
    "fallacies_detected": [],  # [{"name": "...", "description": "...", "example": "..."}]
    "score": int,              # 0-100
    "quality": str,            # "excellent" / "good" / "fair" / "poor" / "failing"
    "critique": str,           # What player missed
    "praise": str,             # What player did well
    "hint": str | None         # Adaptive hint (attempts 4-7)
}
```

**Quality Levels** (by score):
- 85-100: "excellent"
- 70-84: "good"
- 50-69: "fair"
- 30-49: "poor"
- 0-29: "failing"

**Adaptive Hints** (by attempts remaining):
- 7-10: Harsh roast, no hints
- 4-6: Moderate hint ("Check the frost pattern origin")
- 1-3: Direct hint ("The culprit is Draco. The frost was cast from outside.")

**YAML Config** (`case_001.yaml:275+`):
```yaml
mentor_feedback_templates:
  fallacies:
    confirmation_bias:
      description: "You focused only on evidence supporting your theory..."
      example: "You emphasized {suspect}'s presence but dismissed..."
```

---

## ✅ Recommendations

### Fix 1: Remove `case_solved` Check

**File**: `backend/src/api/routes.py`
**Action**: Delete lines 938-944 OR make check conditional

**Option A** (Recommended): Remove entirely
```python
# Delete these lines:
if verdict_state.case_solved:
    raise HTTPException(status_code=400, detail="Case already solved.")
```

**Rationale**: Educational game benefits from retries. Let users test different verdicts, learn from mistakes. Keep 10-attempt limit as constraint.

**Option B**: Make check optional (via query param)
```python
if verdict_state.case_solved and not request.allow_retry:
    raise HTTPException(...)
```

**Recommendation**: **Option A** (simpler, aligns with educational goals).

---

### Fix 2: Add Reset Endpoint

**File**: `backend/src/api/routes.py`
**Action**: Add new endpoint

```python
@router.post("/case/{case_id}/reset", response_model=ResetResponse)
async def reset_case(case_id: str, player_id: str = "default") -> ResetResponse:
    """Reset case progress (delete saved state).

    Args:
        case_id: Case identifier
        player_id: Player identifier (query param)

    Returns:
        Success status and message
    """
    deleted = delete_state(case_id, player_id)

    if deleted:
        return ResetResponse(
            success=True,
            message=f"Case {case_id} reset. All progress cleared."
        )
    else:
        return ResetResponse(
            success=False,
            message=f"No saved progress found for case {case_id}."
        )
```

**Response Model**:
```python
class ResetResponse(BaseModel):
    success: bool
    message: str
```

**Frontend Integration**:
- Add "Restart Case" button (header or settings)
- Confirm dialog: "Reset all progress? Evidence and verdicts will be lost."
- Call `POST /api/case/{case_id}/reset?player_id=default`
- Reload page or reset React state

---

### Fix 3: LLM Mentor Feedback

**File**: `backend/src/context/mentor.py`
**Action**: Replace `build_mentor_feedback()` with LLM prompt builder

**Hybrid Approach** (Recommended):
1. Keep fallacy detection logic (templates)
2. Keep scoring logic (templates)
3. Replace feedback text generation with LLM
4. Fallback to templates on LLM error

**New Function**:
```python
def build_moody_feedback_llm(
    correct: bool,
    score: int,
    fallacies: list[dict],
    reasoning: str,
    accused_id: str,
    solution: dict,
    attempts_remaining: int,
) -> str:
    """Generate Moody's feedback via Claude Haiku.

    Returns natural language feedback (2-4 sentences).
    Falls back to template on error.
    """
    prompt = _build_moody_prompt(...)  # See PRP for full prompt

    try:
        response = call_claude_haiku(prompt)
        return response
    except Exception as e:
        logger.warning(f"LLM feedback failed, using template: {e}")
        return _build_template_feedback(...)  # Existing logic
```

**Prompt Structure** (see PRP for full prompts):
- Context: Player reasoning, accused, actual culprit, evidence cited/missed, fallacies, score
- Tone: Gruff Moody (harsh but educational)
- Length: 2-4 sentences max
- Examples: Provided in prompt for consistency

---

## 📊 Impact Analysis

### Bug Severity

| Issue | Severity | Impact | User Workaround |
|-------|----------|--------|-----------------|
| Verdict blocking | CRITICAL | Game unplayable after first correct verdict | Delete save file manually |
| No restart | HIGH | Cannot start fresh | Delete save file manually |
| Mechanical feedback | MEDIUM | Reduced engagement | None |

### Fix Effort

| Fix | Effort | Risk | Priority |
|-----|--------|------|----------|
| Remove `case_solved` check | 10 min | LOW | CRITICAL |
| Add reset endpoint | 2 hours | LOW | HIGH |
| LLM mentor feedback | 1-2 days | MEDIUM | MEDIUM |

**Total**: 2-3 days

---

## 🧪 Testing Requirements

### Unit Tests

**New Tests Needed**:
1. `test_reset_endpoint_deletes_state()` - Reset clears saved file
2. `test_reset_endpoint_nonexistent_file()` - Reset handles missing file
3. `test_verdict_allows_retry_after_solved()` - No `case_solved` block
4. `test_llm_feedback_generation()` - LLM prompt works
5. `test_llm_feedback_fallback()` - Template fallback on error

### Integration Tests

**Scenarios**:
1. Submit correct verdict → restart → submit again (should work)
2. Submit 10 incorrect verdicts → restart → fresh 10 attempts
3. LLM feedback matches tone/content expectations
4. Template fallback produces valid feedback

### Manual Testing

**User Flow**:
1. Investigate case
2. Submit incorrect verdict → receive Moody roast
3. Submit correct verdict → receive Moody feedback + confrontation
4. Click "Restart Case" → confirm dialog
5. Verify: evidence cleared, witnesses reset, verdict attempts = 10

---

## 📝 Files Modified

### Backend

| File | Change | Lines |
|------|--------|-------|
| `src/api/routes.py` | Remove `case_solved` check | -7 |
| `src/api/routes.py` | Add `reset_case` endpoint | +20 |
| `src/api/models.py` | Add `ResetResponse` model | +3 |
| `src/context/mentor.py` | Add `build_moody_feedback_llm()` | +80 |
| `src/context/mentor.py` | Add prompt builders | +60 |
| `tests/test_routes.py` | Add reset endpoint tests | +30 |
| `tests/test_mentor.py` | Add LLM feedback tests | +40 |

**Total Backend**: ~226 lines changed/added

### Frontend

| File | Change | Lines |
|------|--------|-------|
| `src/api/client.ts` | Add `resetCase()` function | +10 |
| `src/components/Header.tsx` | Add "Restart" button | +15 |
| `src/components/ConfirmDialog.tsx` | Create confirmation dialog | +40 |
| `src/components/MentorFeedback.tsx` | Add loading spinner | +10 |
| `src/components/__tests__/Header.test.tsx` | Test restart button | +20 |

**Total Frontend**: ~95 lines

---

## 🎯 Success Criteria

### Functional

- [ ] User can submit multiple verdicts (no `case_solved` block)
- [ ] "Restart Case" button visible in UI
- [ ] Restart confirmation dialog appears
- [ ] Reset clears: evidence, witnesses, verdict attempts
- [ ] Reset preserves case structure (locations, suspects, etc.)
- [ ] LLM feedback feels natural (Moody's voice)
- [ ] Template fallback works on LLM error

### Quality

- [ ] All existing tests pass (374 tests)
- [ ] New tests pass (reset, LLM feedback)
- [ ] No console errors
- [ ] Loading spinner shows during LLM call (~2-3s)
- [ ] User testing confirms: "Can restart", "Feedback feels natural"

### Performance

- [ ] LLM feedback responds in <5 seconds
- [ ] Reset completes in <500ms
- [ ] No state corruption after reset

---

## 🚀 Next Steps

1. **Immediate** (10 min): Remove `case_solved` check → Deploy → Unblock user
2. **Phase 3.1** (2-3 days): Implement reset endpoint + LLM feedback
3. **User Testing**: Validate fixes resolve issues

---

**Report Complete** | **Status**: Ready for implementation
