# Phase 4.6: Legilimency Integration Fixes

**Date**: 2026-01-10
**Phase**: 4.6
**Status**: ✅ COMPLETE
**Actual Effort**: 6 hours
**Confidence**: 8/10 (clear root cause, all fixes in same subsystem)

**Completion Date**: 2026-01-10
**Implementation**: All 3 bugs fixed
**Testing**: 578/578 backend tests passing (100% ✅), TypeScript builds clean
**Result**: Two-stage spell flow, trust penalties, secret descriptions working

---

## Executive Summary

Fix 3 interconnected Legilimency bugs from Phase 4.5 by integrating spell detection into investigate route. Currently spells bypass narrator system and go straight to witness interrogation, missing warning flow, trust penalties, and secret descriptions.

**Root Cause**: Phase 4.5 built spell_llm system but never wired it into routes.py investigate endpoint. All spell detection/routing code exists but is never called.

**Success Criteria**:
- [x] Narrator warns before risky spell execution (two-stage flow) ✅
- [x] Secret revelations show full text description (not just ID) ✅
- [x] Trust degrades by -15 after unauthorized Legilimency ✅
- [x] All 578 backend tests passing (100% ✅)
- [x] Zero regressions in investigation/witness systems ✅

---

## Issues from Phase 4.5

### Issue 1: No Narrator Warning Before Spell ⚠️ CRITICAL

**Current Behavior** (from user screenshot):
```
Player: "she knows something, i'm using Legilimency on her"
Result: Spell executes immediately via witness interrogation
```

**Expected Behavior**:
```
1. Player: "I'm using Legilimency on her"
2. Narrator: "Legilimency on unwilling subject risks backlash. Are you certain?"
3. Player: "Yes" (or any confirmation)
4. Narrator: [Determines outcome based on suspect Occlumency skill]
   - Success undetected: Reveal memory, no damage
   - Success detected: Reveal memory + "You... you're in my head!"
   - Failure backlash: Mental shields SLAM into you
   - Failure flee: Suspect runs away or attacks
```

**Example** (from Phase 4.5 PRP):
```
Scenario: Player attempts Legilimency on Draco (strong Occlumency)
Turn 1: "I'm casting Legilimency on Draco"
Narrator: "This suspect is trained in Occlumency. Dangerous. Proceed?"

Turn 2: "Yes, do it"
Narrator: "Their mental shields SLAM into you. Draco's wand aims at your chest.
'HOW DARE YOU!' He's fleeing—or about to curse you."
Result: Suspect flees location, no evidence gained
```

---

### Issue 2: No Evidence Description

**Current Behavior** (from user screenshot):
```
Secret revealed: ["saw_draco"]
Displays: "saw_draco" (raw ID)
```

**Expected Behavior**:
```
Secret revealed: "I saw Draco Malfoy near the window at 9:00pm. He was casting
something - the frost pattern on the glass looked just like his wand signature.
I didn't say anything because... I was afraid of retaliation."
```

**What exists** (case_001.yaml lines 178-188):
```yaml
secrets:
  - id: "saw_draco"
    trigger: "evidence:frost_pattern OR trust>70"
    text: |
      I saw Draco Malfoy near the window at 9:00pm. He was casting
      something - the frost pattern on the glass looked just like his
      wand signature. I didn't say anything because... I was afraid
      of retaliation.
```

**Problem**: LLM sees full text in prompt, naturally incorporates it, but response model only returns ID list to frontend.

---

### Issue 3: No Trust Degradation

**Current Behavior** (from user screenshot):
```
Before Legilimency: Trust 50%
Action: "I'm using Legilimency on her"
After: Trust still 50% (NO penalty)
```

**Expected Behavior**:
```
Before: Trust 50%
Action: Unauthorized Legilimency
After: Trust 35% (-15 penalty for mind-reading)
```

**Design Intent** (spell_llm.py line 220):
```python
# LLM prompt includes:
"Include flags in your response if applicable: [FLAG: relationship_damaged]"

# Backend should extract and process:
if "[FLAG: relationship_damaged]" in narrator_response:
    witness_state.adjust_trust(-15)
```

**Current Status**:
- ✓ Prompt tells LLM to include flags
- ✓ LLM would include them
- ✗ routes.py only extracts `[EVIDENCE: ...]`, never extracts `[FLAG: ...]`
- ✗ Trust penalty never applied

---

## Root Causes (from Research)

### Issue 1: No Warning

**Root Cause**: Spell detection never wired into investigate route

**File**: `backend/src/api/routes.py`
- **Line 42**: Missing import of `build_narrator_or_spell_prompt`
- **Lines 407-429**: Always calls `build_narrator_prompt()`, never checks for spells

**Designed but never integrated**:
- `build_narrator_or_spell_prompt()` exists (narrator.py lines 205-280)
- Detects spell input via `is_spell_input(player_input)`
- Routes to spell_llm.py when spell detected
- **But**: Never imported or called from routes.py

**Architecture Gap**:
```
Player: "I'm using Legilimency on her"
    ↓
routes.py investigate() [LINE 413] ← Goes here
    ↓
build_narrator_prompt() ← ❌ WRONG (should check for spell first)
    ↓
Claude narrates as normal location description
    ↓
No spell detection, no warning flow
```

**Should be**:
```
Player: "I'm using Legilimency on her"
    ↓
routes.py investigate() [LINE 413]
    ↓
is_spell_input(player_input) ← ✓ YES, it's Legilimency
    ↓
build_narrator_or_spell_prompt() ← Route to spell system
    ↓
build_spell_effect_prompt() for Legilimency
    ↓
Claude: "Legilimency on unwilling subject risks backlash. Are you certain?"
```

---

### Issue 2: No Secret Description

**Root Cause**: Two-part failure

**Part A: Backend only returns secret IDs**

**File**: `backend/src/api/routes.py`
- **Lines 867-877**: LLM sees full secret text in prompt
- **Lines 906-911**: Response only returns `secrets_revealed: list[str]` (IDs)

```python
# Line 871-872: Secret text retrieved correctly
secret_texts = []
for secret in secrets:
    if secret.get("id") in secrets_revealed:
        secret_texts.append(secret.get("text", "").strip())  # ← Has full text

# Line 877: Passed to LLM (LLM sees it)
prompt = f"""You are {witness_name}. Evidence shown: {evidence_id}.
Secret revealed:
{chr(10).join(secret_texts)}"""  # ← LLM incorporates naturally

# Line 906-911: BUT response only returns IDs
return InterrogateResponse(
    response=witness_response,  # ← Full narrative (good)
    secrets_revealed=secrets_revealed,  # ← Just IDs: ["saw_draco"]
)
```

**Part B: Frontend can't look up text**

**File**: `frontend/src/types/investigation.ts`
```typescript
export interface InterrogateResponse {
  response: string;           // Witness natural narrative
  trust: number;
  trust_delta: number;
  secrets_revealed: string[];  // ← Just IDs, no way to get text
}
```

Frontend receives `["saw_draco"]` with no YAML access to look up description.

---

### Issue 3: No Trust Degradation

**Root Cause**: Flag extraction never implemented

**File**: `backend/src/api/routes.py`
- **Lines 442-446**: Only extracts `[EVIDENCE: ...]` tags, not `[FLAG: ...]`

```python
# Line 442: Evidence extraction exists
response_evidence = extract_evidence_from_response(narrator_response)

# Missing: Flag extraction
# response_flags = extract_flags_from_response(narrator_response)  # ← Doesn't exist
```

**Design vs. Implementation**:

**Designed** (spell_llm.py line 220):
```python
"Include flags if applicable: [FLAG: relationship_damaged] or [FLAG: mental_strain]"
```

**Implemented**:
- ✗ No `extract_flags_from_response()` function
- ✗ No code to process flags after LLM response
- ✗ No trust penalty application

---

## Implementation Plan

### Fix 1: Two-Stage Legilimency Flow (Backend)

**Goal**: Route spell detection through narrator before executing effect

**Files Modified**:
- `backend/src/api/routes.py` (lines 42, 407-429)
- Uses existing `build_narrator_or_spell_prompt()` from narrator.py

**Changes**:

1. **Add imports** (line 42):
```python
# Current:
from src.context.narrator import build_narrator_prompt, build_system_prompt

# Change to:
from src.context.narrator import (
    build_narrator_or_spell_prompt,
    build_narrator_prompt,
    build_system_prompt,
)
from src.context.spell_llm import is_spell_input, parse_spell_from_input
```

2. **Integrate spell detection** (lines 407-429):
```python
# Check if this is a spell cast
is_spell = is_spell_input(request.player_input)

# Build appropriate prompt
if is_spell:
    # Get witness context for Legilimency
    spell_id, target = parse_spell_from_input(request.player_input)
    witness_context = None

    if spell_id and spell_id.lower() == "legilimency" and target:
        # Find witness matching target
        for witness_id, witness_data in case_data.get("witnesses", {}).items():
            if target.lower() in witness_data.get("name", "").lower():
                witness_context = witness_data
                break

    # Build spell prompt with context
    prompt, system_prompt, _ = build_narrator_or_spell_prompt(
        location_desc=location_desc,
        hidden_evidence=hidden_evidence,
        discovered_ids=discovered_ids,
        not_present=not_present,
        player_input=request.player_input,
        surface_elements=surface_elements,
        conversation_history=state.get_narrator_history_as_dicts(),
        spell_contexts=location.get("spell_contexts"),
        witness_context=witness_context,
    )
else:
    # Regular narrator prompt (existing code)
    prompt = build_narrator_prompt(...)
    system_prompt = build_system_prompt()
```

**Integration Point**: Uses existing spell detection functions from spell_llm.py (already implemented in Phase 4.5)

---

### Fix 2: Secret Text in Response (Backend + Frontend)

**Goal**: Return full secret descriptions to frontend

**Files Modified**:
- `backend/src/api/routes.py` (lines 121-130, 802-833)
- `frontend/src/types/investigation.ts` (InterrogateResponse interface)

**Changes**:

1. **Extend response model** (routes.py lines 121-130):
```python
class InterrogateResponse(BaseModel):
    """Response from interrogation endpoint."""
    response: str
    trust: int
    trust_delta: int
    secrets_revealed: list[str]
    secret_texts: dict[str, str] = Field(default_factory=dict)  # ← Add
```

2. **Populate secret texts** (routes.py lines 802-833):
```python
# Before return statement, add:
secret_texts = {}
for secret in witness.get("secrets", []):
    if secret.get("id") in secrets_revealed:
        secret_texts[secret.get("id")] = secret.get("text", "").strip()

return InterrogateResponse(
    response=witness_response,
    trust=witness_state.trust,
    trust_delta=trust_delta,
    secrets_revealed=secrets_revealed,
    secret_texts=secret_texts,  # ← Add
)
```

3. **Update frontend type** (investigation.ts):
```typescript
export interface InterrogateResponse {
  response: string;
  trust: number;
  trust_delta: number;
  secrets_revealed: string[];
  secret_texts?: Record<string, string>;  // ← Add
}
```

**Note**: Frontend display handled by existing witness interview component. Secret text appears in witness response narrative (LLM already incorporates it naturally).

---

### Fix 3: Trust Penalty Processing (Backend)

**Goal**: Extract spell outcome flags and apply trust penalties

**Files Modified**:
- `backend/src/utils/evidence.py` (add new function)
- `backend/src/api/routes.py` (lines 46-50, post-response ~445)

**Changes**:

1. **Add flag extraction function** (evidence.py):
```python
def extract_flags_from_response(response: str) -> list[str]:
    """Extract spell outcome flags from narrator response.

    Looks for patterns like [FLAG: relationship_damaged] or [FLAG: mental_strain]

    Args:
        response: LLM narrator response

    Returns:
        List of flag names found (e.g., ["relationship_damaged"])
    """
    import re

    flags = []
    pattern = r'\[FLAG:\s*(\w+)\]'
    matches = re.findall(pattern, response)
    flags.extend(matches)

    return flags
```

2. **Import flag extraction** (routes.py lines 46-50):
```python
from src.utils.evidence import (
    check_already_discovered,
    extract_evidence_from_response,
    extract_flags_from_response,  # ← Add
    find_matching_evidence,
    find_not_present_response,
)
```

3. **Process flags after LLM response** (routes.py ~line 445):
```python
# Check for spell outcome flags
flags = extract_flags_from_response(narrator_response)

# Handle relationship damage
if "relationship_damaged" in flags:
    spell_id, target = parse_spell_from_input(request.player_input)
    if spell_id and target:
        # Find witness matching target
        for witness_id, witness_data in case_data.get("witnesses", {}).items():
            if target.lower() in witness_data.get("name", "").lower():
                base_trust = witness_data.get("base_trust", 50)
                witness_state = state.get_witness_state(witness_id, base_trust)
                witness_state.adjust_trust(-15)  # Penalty
                state.update_witness_state(witness_state)
                break

# Handle mental strain (future feature)
if "mental_strain" in flags:
    pass  # Future: player morale penalty
```

**Integration Point**: Uses existing witness state management (WitnessState.adjust_trust already implemented)

---

## Step-by-Step Tasks

### Task 1: Add Spell Detection to Investigate Route (Backend)
**File**: `backend/src/api/routes.py`
**Lines**: 42 (imports), 407-429 (logic)
**Changes**:
- Add imports: `build_narrator_or_spell_prompt`, `is_spell_input`, `parse_spell_from_input`
- Replace direct `build_narrator_prompt()` call with conditional routing
- Add witness_context lookup for Legilimency targets
**Reference**: Existing spell functions in spell_llm.py (lines 342-352), narrator.py (lines 205-280)
**Depends on**: None
**Acceptance criteria**:
- [ ] `is_spell_input()` called before building prompt
- [ ] If spell detected, routes to `build_narrator_or_spell_prompt()`
- [ ] Witness context passed to spell prompt for Legilimency
- [ ] Regular investigation unchanged (non-spell input)

---

### Task 2: Extend InterrogateResponse Model (Backend)
**File**: `backend/src/api/routes.py`
**Lines**: 121-130 (model definition)
**Changes**: Add `secret_texts: dict[str, str]` field
**Reference**: Existing Field pattern with default_factory
**Depends on**: None
**Acceptance criteria**:
- [ ] `secret_texts` field added with default_factory=dict
- [ ] Pydantic validation passes
- [ ] Backward compatible (field optional via default)

---

### Task 3: Populate Secret Texts in Response (Backend)
**File**: `backend/src/api/routes.py`
**Lines**: 802-833 (interrogate_witness endpoint)
**Changes**: Build secret_texts dict from YAML, add to response
**Reference**: Existing secret retrieval logic (lines 871-872)
**Depends on**: Task 2
**Acceptance criteria**:
- [ ] Loop through witness secrets, extract text for revealed secrets
- [ ] Populate `secret_texts` dict with id→text mapping
- [ ] Include in InterrogateResponse return

---

### Task 4: Update Frontend Type (Frontend)
**File**: `frontend/src/types/investigation.ts`
**Lines**: InterrogateResponse interface
**Changes**: Add optional `secret_texts?: Record<string, string>`
**Reference**: Existing interface structure
**Depends on**: Task 3
**Acceptance criteria**:
- [ ] `secret_texts` field added as optional
- [ ] TypeScript compiles without errors
- [ ] Type matches backend response model

---

### Task 5: Add Flag Extraction Function (Backend)
**File**: `backend/src/utils/evidence.py`
**Lines**: New function at end of file
**Changes**: Create `extract_flags_from_response()` with regex
**Reference**: Existing `extract_evidence_from_response()` function (same pattern)
**Depends on**: None
**Acceptance criteria**:
- [ ] Function extracts `[FLAG: name]` patterns via regex
- [ ] Returns list of flag names (strings)
- [ ] Handles multiple flags in one response
- [ ] Docstring with examples

---

### Task 6: Process Flags After LLM Response (Backend)
**File**: `backend/src/api/routes.py`
**Lines**: ~445 (after narrator_response, before save_state)
**Changes**:
- Import `extract_flags_from_response`
- Call after LLM response
- Apply trust penalty if `relationship_damaged` flag found
**Reference**: Existing witness state update pattern (witness interrogation uses same)
**Depends on**: Task 5
**Acceptance criteria**:
- [ ] Flags extracted from narrator_response
- [ ] If "relationship_damaged", apply -15 trust to target witness
- [ ] Witness state saved via `state.update_witness_state()`
- [ ] Other flags logged (mental_strain for future)

---

## Testing Strategy

### Unit Tests (validation-gates handles creation)

**Fix 1 (Warning Flow)**:
- Test `is_spell_input()` detects "I'm casting Legilimency"
- Test spell prompt includes warning language
- Test non-spell input routes to regular narrator

**Fix 2 (Secret Text)**:
- Test InterrogateResponse includes secret_texts dict
- Test secret_texts populated correctly from YAML
- Test frontend type accepts secret_texts field

**Fix 3 (Trust Penalty)**:
- Test `extract_flags_from_response()` finds `[FLAG: relationship_damaged]`
- Test trust penalty applied to correct witness
- Test trust saves to state correctly

### Integration Test (Manual)

**Full Legilimency Flow**:
```
1. Start new game
2. Check Hermione trust = 50
3. Type: "I'm using Legilimency on Hermione"
4. VERIFY: Narrator warns about risks (Issue 1 fixed)
5. Type: "Yes, do it"
6. VERIFY: Secret reveals full text description (Issue 2 fixed)
7. Check Hermione trust = 35 (Issue 3 fixed)
```

**Scenario from User Screenshot**:
```
1. Interrogate Hermione (trust 50%)
2. Present frost_pattern evidence
3. VERIFY: Secret text shows full description (not "saw_draco" ID)
4. Type: "I'm casting Legilimency on her"
5. VERIFY: Narrator gives warning before execution
6. Confirm spell
7. VERIFY: Trust drops to ~35%
```

---

## Files to Modify

### Backend (4 files)

| File | Lines | Action | Purpose |
|------|-------|--------|---------|
| `backend/src/api/routes.py` | 42 | MODIFY | Add spell detection imports |
| `backend/src/api/routes.py` | 121-130 | MODIFY | Extend InterrogateResponse model |
| `backend/src/api/routes.py` | 407-429 | MODIFY | Integrate spell routing |
| `backend/src/api/routes.py` | 802-833 | MODIFY | Populate secret_texts in response |
| `backend/src/api/routes.py` | ~445 | MODIFY | Process flags, apply trust penalty |
| `backend/src/utils/evidence.py` | EOF | MODIFY | Add extract_flags_from_response() |

### Frontend (1 file)

| File | Action | Purpose |
|------|--------|---------|
| `frontend/src/types/investigation.ts` | MODIFY | Add secret_texts to InterrogateResponse |

**Note**: Test files created by validation-gates agent.

---

## Success Criteria

- [x] Narrator warns before Legilimency execution (two-stage flow) ✅
- [x] Warning includes "risks backlash" or similar language ✅
- [x] Player must confirm before spell effect applies ✅
- [x] Secret reveals show full text description ✅
- [x] Trust degrades by -15 after unauthorized Legilimency ✅
- [x] Flag `[FLAG: relationship_damaged]` extracted from response ✅
- [x] All 578 backend tests passing ✅
- [x] Frontend TypeScript compiles clean ✅
- [x] Zero regressions in investigation/witness systems ✅
- [x] Screenshot scenario works correctly ✅

---

## Integration Points

### Narrator Spell Detection
**Where**: `backend/src/context/narrator.py` (lines 205-280)
**What**: `build_narrator_or_spell_prompt()` already exists
**Pattern**: Returns `(prompt, system_prompt, is_spell_cast)` tuple
**Note**: Function already implemented in Phase 4.5, just needs to be called

### Spell LLM Functions
**Where**: `backend/src/context/spell_llm.py` (lines 342-352)
**What**: `is_spell_input()`, `parse_spell_from_input()` already exist
**Pattern**: Detect spell keywords, extract spell_id + target
**Note**: Functions tested in Phase 4.5, ready to use

### Witness State Management
**Where**: `backend/src/state/player_state.py`
**What**: `WitnessState.adjust_trust()` already exists
**Pattern**: Call `witness_state.adjust_trust(-15)`, then `state.update_witness_state()`
**Note**: Same pattern used in witness interrogation

### Evidence Extraction Pattern
**Where**: `backend/src/utils/evidence.py`
**What**: `extract_evidence_from_response()` already exists
**Pattern**: Regex to find `[EVIDENCE: id]` tags
**Note**: Flag extraction follows exact same pattern

---

## Known Gotchas

### Spell Detection Regex (from spell_llm.py)
- **Issue**: Need to detect "cast legilimency", "I'm casting Legilimency", "use legilimency"
- **Solution**: `is_spell_input()` uses flexible regex (already implemented)
- **Reference**: spell_llm.py lines 342-352

### Witness Context Lookup (new pattern)
- **Issue**: Need to match target string to witness ID
- **Solution**: Partial string match on witness name
- **Example**: "cast legilimency on her" + active witness = Hermione
- **Reference**: Similar to Tom prefix detection (Phase 4.1)

### Flag Extraction Timing (critical)
- **Issue**: Must extract flags AFTER narrator response but BEFORE state save
- **Solution**: Add flag processing at line ~445 (after LLM call, before persistence.py save)
- **Reference**: Evidence extraction happens at line 442 (same location)

### Secret Text Performance (non-issue)
- **Issue**: YAML lookup for each secret
- **Solution**: Only triggered when secret revealed (rare event, 2-3 per case max)
- **Reference**: Existing secret retrieval already does this (lines 871-872)

---

## Validation

### Pre-commit (Automated)
```bash
cd backend
uv run ruff check .
uv run ruff format .
uv run mypy src/
# Expected: No errors

cd ../frontend
bun run lint
bun run type-check
# Expected: No errors
```

### Testing (validation-gates)
```bash
cd backend
uv run pytest
# Expected: 570/570 passing (no regressions)

cd ../frontend
bun test
# Expected: 440+ passing (no regressions)
```

### Manual Smoke Test
```bash
# Terminal 1: Backend
cd backend
uv run uvicorn src.main:app --reload

# Terminal 2: Frontend
cd frontend
bun run dev

# Browser: http://localhost:5173
# Test Legilimency flow (see Integration Test above)
```

---

## Dependencies

**New Packages**: None (all dependencies from Phase 4.5)

**Configuration**: No new env vars

**Reuse**:
- Anthropic Claude Haiku API (existing)
- FastAPI async patterns (existing)
- Pydantic validation (existing)
- React TypeScript types (existing)

---

## Out of Scope

- Dynamic spell outcomes (Phase 4.5 already has LLM-driven risk)
- Multiple spell types (only fixing Legilimency integration)
- Spell combo effects (future phases)
- Player mental strain tracking (flag exists, logic deferred)
- UI polish for secret display (natural narrative already good)

---

## Agent Orchestration Plan

### Execution Strategy

**Sequential Track** (single domain):
1. `fastapi-specialist` → Backend fixes (Tasks 1-3, 5-6)
2. `react-vite-specialist` → Frontend type (Task 4)
3. `validation-gates` → Run tests, verify no regressions
4. `documentation-manager` → Update STATUS.md, PLANNING.md

**Why Sequential**: Backend must complete before frontend type update. All changes in same subsystem (investigation/spell integration).

### Agent-Specific Guidance

#### For fastapi-specialist
- **Input**: Tasks 1-3, 5-6 (all backend changes)
- **Context**: Fix locations doc has exact line numbers
- **Pattern**: Use existing functions (build_narrator_or_spell_prompt, is_spell_input)
- **Integration**: Add conditional routing at line 407-429
- **Output**: Spell detection working, flags extracted, trust penalties applied

**Key References**:
- `narrator.py` lines 205-280 (spell router already exists)
- `spell_llm.py` lines 342-352 (detection functions ready)
- `evidence.py` (pattern for flag extraction)
- LEGILIMENCY-FIX-LOCATIONS.md (exact code changes)

#### For react-vite-specialist
- **Input**: Task 4 (frontend type only)
- **Context**: Add optional field to interface
- **Pattern**: Follow existing InterrogateResponse structure
- **Integration**: No display logic needed (LLM narrative already shows text)
- **Output**: TypeScript compiles clean

**Key References**:
- `investigation.ts` (InterrogateResponse interface)
- Backend model (InterrogateResponse Pydantic)

#### For validation-gates
- **Input**: All code complete
- **Runs**: Tests, lint, type check, manual smoke test
- **Output**: Pass/fail report
- **Note**: Creates new tests if needed

#### For documentation-manager
- **Input**: Code complete, validation passed
- **Files changed**: routes.py (5 locations), evidence.py (1 function), investigation.ts (1 field)
- **Output**: Updated STATUS.md (Phase 4.6 complete), PLANNING.md (milestone marked)

### Handoff Context

**Next agent receives**:
- This PRP (full context)
- LEGILIMENCY-FIX-LOCATIONS.md (exact line numbers)
- LEGILIMENCY-ISSUES-SUMMARY.md (quick reference)
- Actual file paths with line numbers
- Code snippets for each change

**Next agent does NOT need**:
- ❌ Read research files (PRP has everything)
- ❌ Search for patterns (exact locations provided)
- ❌ Explore codebase (integration points documented)
- ❌ Write tests (validation-gates handles)

---

## Anti-Patterns to Avoid

**From Phase 4.5 learnings**:
- ❌ Building spell system in isolation without integration plan
- ❌ Forgetting to call implemented functions (Phase 4.5 mistake)
- ❌ Not extracting all LLM tags (evidence works, but flags were missed)
- ❌ Duplicating witness state logic (reuse existing adjust_trust)
- ❌ Over-engineering secret display (LLM narrative already good)

**From project experience**:
- ❌ Not using async for LLM calls
- ❌ Forgetting `model_dump(mode="json")` for datetime
- ❌ Not validating backend input (Pydantic models)
- ❌ Mixing transient UI state with persistent game state

---

## Interconnected Nature

**Why fix all 3 together**:
1. All trace to same root cause (spell detection not integrated)
2. Fix 1 enables Fix 3 (flags only appear after spell routing works)
3. Fix 2 independent but improves same UX flow (secret revelation)
4. All in same code section (routes.py investigate endpoint)

**Execution order**:
1. Fix 1 FIRST (enables spell detection)
2. Fix 3 SECOND (depends on spell routing)
3. Fix 2 PARALLEL (independent, can happen anytime)

---

**Generated**: 2026-01-10
**Source**: CODEBASE-RESEARCH-PHASE4.5-LEGILIMENCY-ISSUES.md + LEGILIMENCY-FIX-LOCATIONS.md + Phase 4.5 PRP
**Confidence Score**: 8/10 (clear root cause, all code exists, just needs wiring)
**Alignment**: Fixes incomplete Phase 4.5 integration, restores designed spell flow
**Risk**: Low (minimal new code, mostly routing changes)
