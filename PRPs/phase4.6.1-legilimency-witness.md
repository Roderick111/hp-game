# Phase 4.6.1: Legilimency Support in Witness Interrogation

**Date**: 2026-01-10
**Phase**: 4.6.1
**Status**: PLANNED
**Estimated Effort**: 1 day
**Confidence**: 9/10 (clear pattern from Phase 4.6, same architecture)

---

## Executive Summary

Add Legilimency spell support to witness interrogation modal (`/api/interrogate` endpoint). Currently, 6 investigation spells work correctly via `/api/investigate` (Phase 4.5 ✅), but Legilimency during witness conversations is not implemented. Player types "i use legilimency" in witness modal → nothing happens.

**Architecture Clarification** (CRITICAL):
- **6 Investigation Spells** (Revelio, Lumos, etc.) → `/api/investigate` endpoint → Phase 4.5 ✅ WORKING
- **1 Conversation Spell** (Legilimency) → `/api/interrogate` endpoint → Phase 4.6.1 ❌ NOT IMPLEMENTED

**Goal**: Two-stage flow (warning → confirmation → execution) with trust penalties (-15) on unauthorized use. Reuse existing spell detection patterns from Phase 4.6.

**Success Criteria**:
- [ ] Type "i use legilimency" in witness modal → warning appears
- [ ] Confirm → spell executes, secret revealed (if available)
- [ ] Trust drops by -15 on unauthorized use
- [ ] All existing tests pass (578 backend + 440+ frontend)
- [ ] Works in screenshot scenario (Hermione interrogation)

---

## Context & References

### Project Documentation
**From PLANNING.md**:
- Magic System (lines 806-860): 7 investigation spells, text-only casting, LLM-driven outcomes
- Phase 4.5 COMPLETE: Spell detection via narrator, two-stage warnings, trust penalties
- Phase 4.6 COMPLETE: Fixed spell routing in `/api/investigate` (investigation endpoint)

**From STATUS.md**:
- Current version: 0.6.8
- Phase 4.6 complete: Two-stage spell flow working in investigation (not interrogation)
- Tests: 578 backend, 440+ frontend (1018+ total)

**From game-design/AUROR_ACADEMY_GAME_DESIGN.md**:
- Legilimency: Restricted spell, requires warning before execution
- Trust mechanics: Unauthorized mind-reading damages relationships (-15 penalty)

### Research Sources (Validated)
**From PRPs/CODEBASE-RESEARCH-PHASE4.6.md**:
- ✅ Witness interrogation flow documented (lines 20-92)
- ✅ Integration points identified (lines 388-443)
- ✅ Existing patterns: spell detection, flag extraction, trust penalties
- ✅ Witness state management: `adjust_trust(-15)` pattern

**Alignment notes**:
- ✅ Research aligns with project architecture
- ✅ Phase 4.6 already implemented same pattern for `/api/investigate`
- ✅ Reuse existing functions: `parse_spell_from_input()`, `extract_flags_from_response()`

---

## Quick Reference (Pre-Digested Context)

### Essential API Signatures

**Witness Interrogation Endpoint** (routes.py lines 792-900):
```python
@router.post("/interrogate", response_model=InterrogateResponse)
async def interrogate_witness(request: InterrogateRequest) -> InterrogateResponse:
    """
    Handle witness interrogation questions.

    Flow:
    1. Load witness data + player state
    2. Check for evidence presentation (special flow)
    3. Adjust trust based on question tone
    4. Build witness prompt (isolated context)
    5. Get Claude response
    6. Check for secret triggers
    7. Update conversation history
    8. Return response with trust, secrets
    """
```

**Request Model** (routes.py lines 145-151):
```python
class InterrogateRequest(BaseModel):
    witness_id: str = Field(..., min_length=1)
    question: str = Field(..., min_length=1)
    case_id: str = Field(default="case_001")
    player_id: str = Field(default="default")
```

**Response Model** (routes.py lines 154-165):
```python
class InterrogateResponse(BaseModel):
    response: str                           # Witness response text
    trust: int                             # Current trust (0-100)
    trust_delta: int = 0                   # Trust change from this question
    secrets_revealed: list[str] = []       # List of secret IDs revealed
    secret_texts: dict[str, str] = {}      # Secret ID → full text mapping (Phase 4.6)
```

### Key Patterns from Research

**Spell Detection** (from spell_llm.py):
```python
from src.context.spell_llm import is_spell_input, parse_spell_from_input

# Check if input contains spell casting
is_spell = is_spell_input(player_input)  # Returns bool
spell_id, target = parse_spell_from_input(player_input)  # Returns (str|None, str|None)

# Patterns detected:
# - "cast legilimency"
# - "I'm casting Legilimency on her"
# - "use legilimency"
```

**Flag Extraction** (from evidence.py - Phase 4.6):
```python
from src.utils.evidence import extract_flags_from_response

# Extract outcome flags from LLM response
flags = extract_flags_from_response(narrator_response)

# Flags supported:
# - "relationship_damaged" → -15 trust penalty
# - "mental_strain" → future player morale penalty
```

**Trust Penalty Application** (from player_state.py):
```python
# Get witness state
witness_state = state.get_witness_state(witness_id, base_trust)

# Apply penalty
witness_state.adjust_trust(-15)

# Save
state.update_witness_state(witness_state)
save_state(state, player_id)
```

### Integration Patterns (Actual Codebase)

**Phase 4.6 Spell Routing** (routes.py lines 417-429 - `/api/investigate`):
```python
# Check if this is a spell cast - route to spell prompt builder
is_spell = is_spell_input(request.player_input)
witness_context = None

if is_spell:
    # Get witness context for Legilimency spells
    spell_id, target = parse_spell_from_input(request.player_input)

    if spell_id and spell_id.lower() == "legilimency" and target:
        # Find witness matching target
        for witness_id, witness_data in case_data.get("witnesses", {}).items():
            witness_name = witness_data.get("name", "")
            if target.lower() in witness_name.lower():
                witness_context = witness_data
                break

    # Build spell prompt with context
    prompt, system_prompt, _ = build_narrator_or_spell_prompt(...)
```

**Phase 4.6 Flag Processing** (routes.py lines 489-501):
```python
if is_spell:
    flags = extract_flags_from_response(narrator_response)

    if "relationship_damaged" in flags:
        # Find witness and apply trust penalty
        spell_id, target = parse_spell_from_input(request.player_input)
        if target:
            for witness_id, witness_data in case_data.get("witnesses", {}).items():
                if target.lower() in witness_data.get("name", "").lower():
                    base_trust = witness_data.get("base_trust", 50)
                    witness_state = state.get_witness_state(witness_id, base_trust)
                    witness_state.adjust_trust(-15)  # Legilimency penalty
                    state.update_witness_state(witness_state)
                    break
```

### Library-Specific Gotchas

**Claude API** (from Phase 4.6 experience):
- Rate limits: Always have template fallback
- Async calls: Use `async def` for all LLM interactions
- Context isolation: Witness doesn't know narrator details

**Pydantic Serialization**:
- `model_dump(mode="json")` for datetime objects
- Field defaults with `Field(default_factory=dict)`

**FastAPI Async**:
- Use `async def` for I/O-bound (LLM calls)
- `def` for CPU-bound (parsing, validation)

### Decision Tree

```
If player submits question in witness modal:
  1. Check if question contains spell casting (is_spell_input)
     ├─ NOT spell → Continue to witness interrogation (existing flow)
     └─ IS spell → Check spell type
        ├─ NOT Legilimency → Return "use investigation view for this spell"
        └─ IS Legilimency → Check state
           ├─ First mention → Return warning, set awaiting_confirmation flag
           └─ Confirmation detected → Execute spell
              1. Build spell prompt (reuse spell_llm.py)
              2. Get LLM response with outcome
              3. Extract flags ([FLAG: relationship_damaged])
              4. Apply trust penalty if unauthorized (-15)
              5. Return response with secrets revealed
```

### Configuration Requirements

**No new dependencies** - reuse existing:
```bash
# Already in pyproject.toml:
# - anthropic>=0.40.0
# - fastapi>=0.109.0
# - pydantic>=2.0

# No new env vars needed
# - ANTHROPIC_API_KEY (already exists)
```

---

## Current Witness Interrogation Flow

**File**: `/Users/danielmedina/Documents/claude_projects/hp_game/backend/src/api/routes.py`

**Endpoint**: `/api/interrogate` (lines 792-900)

### Step-by-Step Current Flow

1. **Load case and witness data** (lines 804-809)
   ```python
   case_data = load_case(request.case_id)
   witness = get_witness(case_data, request.witness_id)
   ```

2. **Load or create player state** (lines 811-819)
   ```python
   state = load_state(request.player_id, request.case_id)
   witness_state = state.get_witness_state(request.witness_id, base_trust)
   ```

3. **Check for evidence presentation** (lines 821-830)
   ```python
   evidence_id = detect_evidence_presentation(request.question)
   if evidence_id:
       return _handle_evidence_presentation(...)  # Special flow
   ```

4. **Adjust trust based on question tone** (lines 832-834)
   ```python
   trust_delta = adjust_trust(request.question, witness.personality)
   witness_state.adjust_trust(trust_delta)
   ```

5. **Build witness prompt** (lines 836-843)
   ```python
   prompt = build_witness_prompt(
       witness, trust, discovered_evidence,
       conversation_history, request.question
   )
   ```

6. **Get Claude response** (lines 845-850)
   ```python
   response = await client.get_response(prompt, system=system_prompt)
   ```

7. **Check for secret triggers** (lines 852-869)
   ```python
   available_secrets = get_available_secrets(witness, trust, evidence)
   secrets_revealed = [s["id"] for s in available_secrets if s["text"] in response]
   ```

8. **Update conversation history** (lines 871-877)
   ```python
   witness_state.add_conversation(request.question, response)
   state.update_witness_state(witness_state)
   ```

9. **Return response** (lines 879-885)
   ```python
   return InterrogateResponse(
       response=response,
       trust=witness_state.trust,
       trust_delta=trust_delta,
       secrets_revealed=secrets_revealed,
       secret_texts=secret_texts
   )
   ```

---

## Where Legilimency Integrates

### Integration Point 1: Spell Detection (Before witness prompt)

**Location**: After line 830 (after evidence check, before trust adjustment)

**Why here**: Evidence presentation is special flow (redirects). Spell casting is also special flow.

**New Logic**:
```python
# After evidence check (line 830), BEFORE trust adjustment (line 832)
# NEW: Check if question contains spell cast
is_spell = is_spell_input(request.question)

if is_spell:
    spell_id, target = parse_spell_from_input(request.question)

    if spell_id and spell_id.lower() == "legilimency":
        # Stage 1: Return warning (if first mention)
        # Stage 2: Execute spell (if confirmation)
        # See Implementation Plan for full logic
```

### Integration Point 2: Trust Penalty (After witness response)

**Location**: After line 877 (after conversation update, before return)

**Why here**: Need to process LLM response for flags before saving state.

**New Logic**:
```python
# After witness response received (line ~877), BEFORE return (line 879)
# NEW: Check for Legilimency flags
if is_spell and spell_id.lower() == "legilimency":
    flags = extract_flags_from_response(witness_response)

    if "relationship_damaged" in flags:
        witness_state.adjust_trust(-15)  # Unauthorized mind-reading penalty
        state.update_witness_state(witness_state)
```

---

## Two-Stage Legilimency Flow Challenge

### The Problem

**Investigation endpoint** (`/api/investigate`): Player in location view, single input field
- Stage 1: "i use legilimency" → Narrator warns
- Stage 2: "yes" → Narrator executes spell
- **State**: Can track "awaiting confirmation" between narrator calls (same endpoint)

**Interrogation endpoint** (`/api/interrogate`): Player in witness modal, conversation interface
- Stage 1: "i use legilimency on hermione" → Need to warn
- Stage 2: "yes, do it" → Need to execute
- **Challenge**: How to track "awaiting confirmation" between interrogate calls?

### Solution: State Flag in WitnessState

**Option A: Add to WitnessState** (RECOMMENDED)
```python
# In player_state.py WitnessState class
class WitnessState(BaseModel):
    witness_id: str
    trust: int
    conversation_history: list[ConversationItem]
    secrets_revealed: list[str]
    awaiting_spell_confirmation: str | None = None  # NEW: "legilimency" or None
```

**Flow**:
1. First "i use legilimency" → Set `awaiting_spell_confirmation = "legilimency"`, return warning
2. Next question → Check if confirmation + spell matches
   - If "yes" or similar + `awaiting_spell_confirmation == "legilimency"` → Execute
   - If different question → Clear flag, continue normal interrogation

**Pros**:
- Persistent across calls
- Witness-specific (different witnesses, different states)
- Clean architecture (state management where it belongs)

**Cons**:
- Requires WitnessState model change

**Option B: Session-based tracking** (REJECTED)
- Store in backend session/cache
- More complex, requires external state management
- Not aligned with current architecture

**Decision**: Use Option A (WitnessState flag)

---

## Implementation Plan

### Task 1: Extend WitnessState Model
**File**: `backend/src/state/player_state.py`
**Location**: WitnessState class (lines ~200-230)
**Action**: Add `awaiting_spell_confirmation` field
**Purpose**: Track pending spell confirmation between interrogate calls

**Changes**:
```python
class WitnessState(BaseModel):
    """Witness-specific state for interrogation."""
    witness_id: str
    trust: int
    conversation_history: list[ConversationItem] = Field(default_factory=list)
    secrets_revealed: list[str] = Field(default_factory=list)
    awaiting_spell_confirmation: str | None = None  # NEW: Spell awaiting confirmation
```

**Acceptance criteria**:
- [ ] Field added with correct type (`str | None`)
- [ ] Default value `None` (no pending spell)
- [ ] Pydantic validation passes
- [ ] Backward compatible (existing saves load correctly)

---

### Task 2: Add Spell Detection to Interrogate Endpoint
**File**: `backend/src/api/routes.py`
**Location**: Lines 42 (imports), 830-850 (interrogate_witness logic)
**Action**: Import spell functions, add detection before witness prompt
**Purpose**: Route Legilimency to spell flow instead of normal interrogation

**Changes**:

1. **Add imports** (line 42):
```python
# Add to existing imports:
from src.context.spell_llm import is_spell_input, parse_spell_from_input, build_spell_effect_prompt
```

2. **Add detection logic** (after line 830):
```python
# After evidence presentation check (line 830), BEFORE trust adjustment

# Check if question contains spell cast
is_spell = is_spell_input(request.question)

if is_spell:
    spell_id, target = parse_spell_from_input(request.question)

    if spell_id and spell_id.lower() == "legilimency":
        # Stage 1: First mention → Return warning
        if not witness_state.awaiting_spell_confirmation:
            warning_text = (
                f"You're about to use Legilimency on {witness.get('name')}. "
                f"Unauthorized mind-reading can severely damage trust and may trigger "
                f"defensive reactions. Are you certain you want to proceed?"
            )

            # Set flag for next call
            witness_state.awaiting_spell_confirmation = "legilimency"
            state.update_witness_state(witness_state)
            save_state(state, request.player_id)

            return InterrogateResponse(
                response=warning_text,
                trust=witness_state.trust,
                trust_delta=0,
                secrets_revealed=[],
                secret_texts={}
            )

    else:
        # Other spells not supported in interrogation
        return InterrogateResponse(
            response="That spell is meant for investigating locations, not conversations. "
                    "Use the main investigation view to cast it.",
            trust=witness_state.trust,
            trust_delta=0,
            secrets_revealed=[],
            secret_texts={}
        )
```

**Acceptance criteria**:
- [ ] `is_spell_input()` called on question
- [ ] If Legilimency detected first time → warning returned
- [ ] `awaiting_spell_confirmation` flag set in state
- [ ] Other spells rejected with helpful message
- [ ] Non-spell questions continue to normal flow

---

### Task 3: Handle Spell Confirmation
**File**: `backend/src/api/routes.py`
**Location**: After spell detection (continuation of Task 2)
**Action**: Check for confirmation if spell pending
**Purpose**: Execute spell on player confirmation

**Changes** (continuation in interrogate_witness):
```python
# Check if confirmation for pending spell
if witness_state.awaiting_spell_confirmation == "legilimency":
    # Check if player is confirming (yes, proceed, do it, etc.)
    confirmation_keywords = ["yes", "proceed", "do it", "confirm", "continue"]
    is_confirming = any(kw in request.question.lower() for kw in confirmation_keywords)

    if is_confirming:
        # Stage 2: Execute Legilimency
        # Build spell effect prompt
        spell_prompt = build_spell_effect_prompt(
            spell_id="legilimency",
            location_context="",  # Not in location, in conversation
            witness_context=witness,  # Target witness
            player_input=request.question,
            discovered_evidence=state.evidence_ids
        )

        # Get LLM response (spell outcome)
        spell_response = await client.get_response(spell_prompt)

        # Extract flags for trust penalty
        flags = extract_flags_from_response(spell_response)

        if "relationship_damaged" in flags:
            witness_state.adjust_trust(-15)  # Unauthorized Legilimency penalty

        # Clear pending spell flag
        witness_state.awaiting_spell_confirmation = None

        # Check for secrets revealed in spell response
        available_secrets = get_available_secrets(witness, witness_state.trust, state.evidence_ids)
        secrets_revealed = []
        secret_texts = {}

        for secret in available_secrets:
            if secret.get("text", "") in spell_response:
                secret_id = secret.get("id", "")
                secrets_revealed.append(secret_id)
                secret_texts[secret_id] = secret.get("text", "").strip()

        # Update conversation history
        witness_state.add_conversation(request.question, spell_response)
        state.update_witness_state(witness_state)
        save_state(state, request.player_id)

        return InterrogateResponse(
            response=spell_response,
            trust=witness_state.trust,
            trust_delta=-15 if "relationship_damaged" in flags else 0,
            secrets_revealed=secrets_revealed,
            secret_texts=secret_texts
        )

    else:
        # Player asking different question, retracted spell
        witness_state.awaiting_spell_confirmation = None
        state.update_witness_state(witness_state)
        # Continue to normal witness interrogation below
```

**Acceptance criteria**:
- [ ] Confirmation keywords detected (yes, proceed, do it, etc.)
- [ ] Spell executes on confirmation
- [ ] Flags extracted from spell response
- [ ] Trust penalty applied if relationship_damaged
- [ ] Secrets revealed if present
- [ ] Pending spell flag cleared
- [ ] Non-confirmation clears flag, continues normal flow

---

### Task 4: Add Spell LLM Support for Interrogation Context
**File**: `backend/src/context/spell_llm.py`
**Location**: `build_spell_effect_prompt()` function
**Action**: Ensure function handles witness_context for Legilimency
**Purpose**: Generate appropriate spell outcomes in conversation context

**Note**: Phase 4.5 already supports witness_context parameter. Verify it handles interrogation context correctly.

**Verification**:
```python
# Check spell_llm.py lines 194-261 (Legilimency section)
# Should already handle witness_context
# If missing, add interrogation-specific guidance
```

**Acceptance criteria**:
- [ ] `build_spell_effect_prompt()` accepts witness_context
- [ ] Legilimency prompt includes witness personality, occlumency_skill
- [ ] Outcomes appropriate for conversation (not location exploration)
- [ ] Flags included in LLM response ([FLAG: relationship_damaged])

---

### Task 5: Update Frontend Types (Optional)
**File**: `frontend/src/types/investigation.ts`
**Location**: InterrogateResponse interface
**Action**: Document that spell warnings can appear in response field
**Purpose**: No code change needed, just clarity

**Note**: Frontend already handles response text display. Spell warnings appear as regular witness responses. No UI changes needed.

**Acceptance criteria**:
- [ ] TypeScript compiles clean (no new fields needed)
- [ ] Existing WitnessInterview component displays warnings correctly

---

## Testing Strategy

**Note**: validation-gates agent handles test creation. This section documents what to test.

### Unit Tests

**WitnessState extension**:
- Test `awaiting_spell_confirmation` field serialization
- Test backward compatibility (old saves without field)

**Spell detection in interrogate**:
- Test `is_spell_input()` with "i use legilimency"
- Test warning returned on first mention
- Test flag set in state
- Test other spells rejected

**Confirmation handling**:
- Test confirmation keywords ("yes", "proceed", etc.)
- Test spell execution on confirmation
- Test flag cleared after execution
- Test retraction (different question clears flag)

**Trust penalty**:
- Test `extract_flags_from_response()` finds relationship_damaged
- Test -15 penalty applied to witness
- Test state saved correctly

### Integration Tests

**Full Legilimency flow**:
```python
# Test scenario:
1. POST /interrogate with "i use legilimency on hermione"
   → Response: warning text
   → State: awaiting_spell_confirmation = "legilimency"

2. POST /interrogate with "yes, proceed"
   → Response: spell outcome (LLM-generated)
   → State: awaiting_spell_confirmation = None
   → Trust: reduced by 15
   → Secrets: may be revealed

3. POST /interrogate with "what did you see?"
   → Response: normal witness interrogation
   → State: no spell flag
```

**Retraction flow**:
```python
1. POST /interrogate with "i use legilimency"
   → Warning, flag set

2. POST /interrogate with "never mind, what did you see?"
   → Normal interrogation, flag cleared
```

### Manual Testing

**Screenshot scenario** (from user):
```
1. Start new game
2. Navigate to witness interrogation (Hermione)
3. Type: "i use legilimency on hermione"
   VERIFY: Warning appears (not regular question response)
4. Type: "yes, do it"
   VERIFY: Spell executes, outcome appears
   VERIFY: Trust drops (check witness selector)
5. Ask normal question
   VERIFY: Regular interrogation works
```

---

## Files to Modify

| File | Action | Purpose | Reference File |
|------|--------|---------|----------------|
| `backend/src/state/player_state.py` | MODIFY | Add `awaiting_spell_confirmation` field to WitnessState | Existing WitnessState model |
| `backend/src/api/routes.py` | MODIFY | Add spell detection + confirmation handling to interrogate_witness | `/api/investigate` pattern (lines 417-501) |

**Note**: Test files created by validation-gates. No frontend changes needed.

---

## Current Codebase Structure (Relevant Files)

```bash
backend/src/
├── api/
│   └── routes.py                      # MODIFY - Add Legilimency to interrogate endpoint
├── state/
│   └── player_state.py                # MODIFY - Add awaiting_spell_confirmation field
├── context/
│   ├── spell_llm.py                   # REFERENCE - Spell detection functions
│   └── witness.py                     # REFERENCE - Witness prompt builder
├── utils/
│   └── evidence.py                    # REFERENCE - extract_flags_from_response()
└── tests/
    ├── test_routes.py                 # validation-gates will add tests
    └── test_player_state.py           # validation-gates will add tests

frontend/src/
└── types/
    └── investigation.ts               # NO CHANGE - Already handles response text
```

---

## Success Criteria

- [ ] Type "i use legilimency" in witness modal → warning appears (not regular response)
- [ ] Warning mentions "unauthorized mind-reading", "damage trust", "are you certain"
- [ ] Type "yes" → spell executes with LLM-generated outcome
- [ ] Trust drops by -15 after unauthorized Legilimency
- [ ] Secrets revealed if available (with full text descriptions)
- [ ] Type different question after warning → spell retracted, normal interrogation
- [ ] All 578 backend tests passing (no regressions)
- [ ] All 440+ frontend tests passing (no regressions)
- [ ] TypeScript compiles clean
- [ ] Screenshot scenario works correctly

---

## Integration Points

### Spell Detection Functions
**Where**: `backend/src/context/spell_llm.py`
**What**: `is_spell_input()`, `parse_spell_from_input()` (lines 342-352)
**Pattern**: Already implemented in Phase 4.5, used in Phase 4.6
**Integration**: Import and call in interrogate_witness endpoint

### Flag Extraction
**Where**: `backend/src/utils/evidence.py`
**What**: `extract_flags_from_response()` (Phase 4.6 addition)
**Pattern**: Regex to find `[FLAG: relationship_damaged]`
**Integration**: Call after spell LLM response

### Witness State Management
**Where**: `backend/src/state/player_state.py`
**What**: `WitnessState.adjust_trust()`, `get_witness_state()`, `update_witness_state()`
**Pattern**: Same as trust mechanics from witness interrogation
**Integration**: Apply -15 penalty when relationship_damaged flag found

### Spell Effect Prompt
**Where**: `backend/src/context/spell_llm.py`
**What**: `build_spell_effect_prompt()` (lines 85-192)
**Pattern**: Builds LLM prompt for spell execution with witness context
**Integration**: Call when confirmation detected

---

## Known Gotchas

### Confirmation Detection (from research)
- **Issue**: Player might say "yes" to previous question, not spell confirmation
- **Solution**: Only check for confirmation if `awaiting_spell_confirmation` flag set
- **Pattern**: Confirmation keywords + flag check (both required)

### State Persistence (critical)
- **Issue**: Flag must persist between API calls
- **Solution**: Save state after setting flag, load on next interrogate call
- **Pattern**: `save_state(state, player_id)` after flag set

### Spell Context in Interrogation (new)
- **Issue**: Spell prompts designed for location investigation, not conversation
- **Solution**: `build_spell_effect_prompt()` already accepts witness_context
- **Pattern**: Pass witness data to spell prompt builder

### Trust Penalty Timing (from Phase 4.6)
- **Issue**: Must apply penalty AFTER spell executes, not on warning
- **Solution**: Only adjust_trust() on confirmation, not on first mention
- **Pattern**: Check flags in spell response, then apply penalty

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
# Expected: 578+ tests passing (no regressions + new tests)

cd ../frontend
bun test
# Expected: 440+ tests passing (no regressions)
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
1. Start new game
2. Click on witness (Hermione)
3. Type: "i use legilimency on hermione"
   → VERIFY: Warning appears
4. Type: "yes, do it"
   → VERIFY: Spell executes, trust drops
5. Ask normal question
   → VERIFY: Interrogation works normally
```

---

## Dependencies

**New Packages**: None (reuse existing)

**Configuration**: No new env vars

**Reuse**:
- Anthropic Claude Haiku API (existing)
- FastAPI async patterns (existing)
- Pydantic validation (existing)
- Spell detection functions (Phase 4.5)
- Flag extraction (Phase 4.6)

---

## Out of Scope

- Multiple spell types in interrogation (only Legilimency this phase)
- Spell combo effects (future enhancement)
- Player mental strain tracking (flag exists, logic deferred)
- Dynamic confirmation detection (simple keyword matching sufficient)
- UI polish for spell warnings (regular response display works)

---

## Agent Orchestration Plan

### Execution Strategy

**Sequential Track** (single domain):
1. `fastapi-specialist` → Backend implementation (Tasks 1-4)
2. `validation-gates` → Run tests, verify no regressions
3. `documentation-manager` → Update STATUS.md, PLANNING.md

**Why Sequential**: All changes in backend. Frontend requires no changes (existing UI handles text display).

### Agent-Specific Guidance

#### For fastapi-specialist
- **Input**: Tasks 1-4 (all backend changes)
- **Context**: This PRP + CODEBASE-RESEARCH-PHASE4.6.md (integration points documented)
- **Pattern**: Follow Phase 4.6 spell routing pattern (routes.py lines 417-501)
- **Integration**: Add to interrogate_witness endpoint (lines 792-900)
- **Output**: Legilimency works in witness modal

**Key Files to Reference**:
- `backend/src/api/routes.py` (interrogate_witness function)
- `backend/src/api/routes.py` (investigate endpoint - spell routing pattern)
- `backend/src/context/spell_llm.py` (spell detection + prompt builder)
- `backend/src/utils/evidence.py` (flag extraction)

**Critical Points**:
1. Add `awaiting_spell_confirmation` to WitnessState (player_state.py)
2. Import spell functions at top of routes.py
3. Add detection AFTER evidence check (line 830), BEFORE trust adjustment
4. Handle both warning (first mention) and execution (confirmation)
5. Apply trust penalty only on confirmation
6. Clear flag after execution or retraction

#### For validation-gates
- **Input**: All code complete
- **Runs**: Tests, lint, type check, build
- **Output**: Pass/fail report
- **Note**: Creates tests for spell detection, confirmation, trust penalty

#### For documentation-manager
- **Input**: Code complete, validation passed
- **Files changed**: player_state.py (1 field), routes.py (spell detection + confirmation)
- **Output**: Updated STATUS.md (Phase 4.6.1 complete), PLANNING.md (milestone marked)

### Handoff Context

**Next agent receives**:
- This PRP (full context)
- CODEBASE-RESEARCH-PHASE4.6.md (witness interrogation flow)
- Actual file paths with line numbers
- Code snippets for each change
- Phase 4.6 reference (same pattern)

**Next agent does NOT need**:
- ❌ Read research files (PRP has everything)
- ❌ Search for patterns (exact locations provided)
- ❌ Explore codebase (integration points documented)
- ❌ Write tests (validation-gates handles)

---

## Anti-Patterns to Avoid

**From Phase 4.6 learnings**:
- ❌ Not saving state after flag set (confirmation won't work)
- ❌ Applying penalty on warning instead of confirmation (wrong timing)
- ❌ Not clearing flag after execution (spell will re-execute)
- ❌ Using modal popup for warning (use text response instead)

**From project experience**:
- ❌ Not using async for LLM calls
- ❌ Forgetting Pydantic Field default for new fields
- ❌ Not handling backward compatibility (old saves without new field)
- ❌ Duplicating spell logic (reuse existing functions)

---

**Generated**: 2026-01-10
**Source**: CODEBASE-RESEARCH-PHASE4.6.md + Phase 4.6 PRP + user clarification
**Confidence Score**: 9/10 (clear pattern from Phase 4.6, same architecture, known integration points)
**Alignment**: Extends Phase 4.5 magic system to witness interrogation (missing piece)
**Risk**: Low (well-understood pattern, minimal new code)
