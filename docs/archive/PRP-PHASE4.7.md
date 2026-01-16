# Phase 4.7: Spell Success System with Specificity Bonuses - Product Requirement Plan

## Goal

Add programmatic spell success mechanics for 6 safe investigation spells with per-location declining success rates and specificity bonuses. Narrator provides immersive success/failure descriptions without UI indicators.

## Why

- **User impact**: Spells feel like investigative tools requiring skill, not magic buttons. Specificity rewards thoughtful gameplay ("Revelio on desk to find letters" vs "Revelio").
- **Business value**: Adds depth to magic system without complexity. Natural consequences for overusing spells in same location.
- **Integration**: Fits existing spell detection (Phase 4.6.2), narrator flow (Phase 1), state persistence (Phase 4.4)
- **Alignment**: PLANNING.md Phase 4.5-4.6.2 magic system completed. This adds success mechanics.

## What

### User-Visible Behavior

**Spell Success Mechanics**:
- 6 safe spells: Revelio, Lumos, Homenum Revelio, Specialis Revelio, Prior Incantato, Reparo
- Base success: 70% (first cast in new location)
- Per-location decline: -10% per attempt (library: 1st=70%, 2nd=60%, 3rd=50%, ...)
- Minimum floor: 10% (never goes below)
- Location reset: Moving to new location resets to 70% base

**Specificity Bonuses** (additive):
- Target bonus: +10% if has "on X", "at X", "toward X", "against X"
- Intent bonus: +10% if has "to find", "to reveal", "to show", "to uncover", "to detect"
- Maximum: 90% (70% base + 10% target + 10% intent)

**Example Calculations**:
```
Location: Library (first visit)

Attempt 1: "Revelio on desk to find clues"
→ 70% + 10% (target) + 10% (intent) - 0% (first) = 90%

Attempt 2: "Revelio on window"
→ 70% + 10% (target) + 0% (no intent) - 10% (second) = 70%

Attempt 3: "Revelio"
→ 70% + 0% + 0% - 20% (third) = 50%

Attempt 7: "Revelio" (would be negative)
→ 70% - 60% (seventh) = 10% (floor applied)

[Move to Dormitory]
Attempt 1: "Revelio"
→ 70% - 0% (resets!) = 70%
```

**Narrator Integration**:
- Success: Narrator describes spell revealing evidence (existing mechanism)
- Failure: Narrator describes spell fizzling out ("The charm sputters and fades—nothing revealed.")
- NO UI indicators (no percentage shown, no "roll" text)
- Pure narrative feedback

**Legilimency** (NO CHANGES):
- Keep existing trust-based system (70% trust threshold)
- This phase only affects 6 safe investigation spells

**Evidence Revelation Flow** (HOW SUCCESS MAPS TO EVIDENCE):
1. **Spell fails (roll < success_rate)** → Narrator: "The spell fizzles and dissipates." NO evidence, regardless of target
2. **Spell succeeds + target matches valid targets + evidence available** → Narrator reveals evidence with [EVIDENCE: id] tag
3. **Spell succeeds + target matches valid targets + no evidence** → Narrator describes atmospheric spell effect only
4. **Spell succeeds + target invalid** → Narrator: "The spell finds nothing of note here."

**Example** (Revelio in library):
- `reveals_evidence: ["hidden_note"]` (from case_001.yaml spell_contexts)
- Valid targets: `["desk", "shelves", "window", "victim"]`
- User casts: "Revelio on desk to find clues" (90% success, first attempt)
  - Roll succeeds (e.g., 85 < 90) → spell_outcome = "SUCCESS"
  - Target "desk" matches valid targets ✅
  - Evidence "hidden_note" not yet discovered ✅
  - **Result**: Narrator reveals hidden_note with [EVIDENCE: hidden_note] tag
- User casts: "Revelio on floor" (70% success, second attempt)
  - Roll succeeds (e.g., 65 < 70) → spell_outcome = "SUCCESS"
  - Target "floor" NOT in valid targets ["desk", "shelves", "window", "victim"] ❌
  - **Result**: Narrator says "The spell finds nothing of note here."
- User casts: "Revelio" (50% success, third attempt)
  - Roll fails (e.g., 60 > 50) → spell_outcome = "FAILURE"
  - **Result**: Narrator says "The spell fizzles and dissipates." (target irrelevant)

### Technical Requirements

**Backend**:
1. **spell_llm.py**:
   - `calculate_spell_success(spell_id, player_input, attempts_in_location, location_id) -> bool`
   - `calculate_specificity_bonus(player_input) -> int` (returns 0, 10, or 20)
   - Pure programmatic calculation (no LLM calls)
   - Modify `build_spell_effect_prompt()` to accept `spell_outcome` parameter

2. **routes.py** (investigation endpoint):
   - Track spell attempts per location in PlayerState
   - Call spell success calculation BEFORE building spell prompt
   - Pass success/failure outcome to `build_spell_effect_prompt()` via `build_narrator_or_spell_prompt()`
   - Increment attempt counter after spell execution

3. **spell_llm.py** (`build_spell_effect_prompt`):
   - Add `spell_outcome` parameter ("SUCCESS" | "FAILURE" | None)
   - SUCCESS + target matches + evidence available → reveal with [EVIDENCE: id]
   - SUCCESS + target matches + no evidence → atmospheric effect
   - FAILURE → spell fizzles regardless of target

4. **player_state.py**:
   - Add `spell_attempts_by_location: dict[str, dict[str, int]]` field
   - Example: `{"library": {"revelio": 2, "lumos": 1}, "dormitory": {"revelio": 0}}`
   - Default to empty dict for backward compatibility

**Frontend**:
- NO CHANGES (backend drives everything via narrator)

**Tests**:
- Specificity detection (target, intent, both, neither)
- Declining success rate (1st, 2nd, 3rd attempts)
- Location reset (library → dormitory)
- Minimum floor (7+ attempts)
- All 6 safe spells
- Legilimency unchanged

### Success Criteria

- [ ] Base 70% success rate for first spell cast in location
- [ ] Per-location decline (-10% per attempt, separate tracking per spell)
- [ ] Target bonus (+10% if "on X", "at X", etc.)
- [ ] Intent bonus (+10% if "to find", "to reveal", etc.)
- [ ] Maximum 90% (70% + 10% + 10%)
- [ ] Minimum 10% (never below)
- [ ] Location reset (moving locations resets to 70% base)
- [ ] Narrator describes success/failure naturally (no UI indicators)
- [ ] Legilimency unchanged (keep trust-based system)
- [ ] All tests pass (backend 603+ tests, frontend 440+ tests)
- [ ] Lint/type check passes
- [ ] Zero regressions

---

## Context & References

### Project Documentation

**From PLANNING.md**:
- Phase 4.5-4.6.2 (Magic System) complete - 7 spells with fuzzy detection, instant Legilimency
- Current architecture: Spells integrated into narrator flow (not separate API endpoint)
- State persistence: PlayerState extensions via Field(default_factory=...)
- Tests: 603 backend, 440+ frontend (1043+ total)

**From game design doc**:
- Philosophy: "Magic is a tool, not a crutch" - spells supplement deduction
- Narrator-only feedback (no UI indicators for mechanics)
- Simple > complex (KISS principle)

**From STATUS.md**:
- Version 0.6.10 (Phase 4.6.2 Programmatic Legilimency complete)
- Backend: 603/603 tests passing (100%)
- Frontend: 440+ tests passing
- All quality gates passing (lint, type check, build)

### Research Sources (Validated)

**From CODEBASE_RESEARCH.md**:
- PlayerState extension pattern: Add nested model with `Field(default_factory=...)`
- Narrator integration: Pass spell outcomes via build_narrator_prompt parameters
- spell_llm.py already has detection functions (extract_target_from_input, extract_intent_from_input)
- routes.py investigate endpoint: Lines 371-438 handle spell detection + narrator calls

**From GITHUB_RESEARCH.md**:
- Simple state tracking: dict[str, int] for attempt counters (no over-engineering)
- Random rolls: Python's random.random() < success_rate (standard approach)
- Backward compatibility: default_factory ensures old saves don't break

**From DOCS_RESEARCH.md**:
- Pydantic defaults: Field(default_factory=dict) for empty dicts
- Type hints: dict[str, dict[str, int]] for nested spell tracking
- Python random: Use random.random() for success rolls (0.0-1.0 float)

**Alignment notes**:
- ✅ Research aligns with project architecture (narrator-driven, state persistence, KISS)
- ✅ Existing spell_llm.py has target/intent extraction (reuse for specificity detection)
- ✅ PlayerState extension pattern proven in Phase 4.4 (conversation_history), Phase 4.42 (narrator_conversation_history)

---

## Quick Reference (Pre-Digested Context)

### Essential Type Definitions

```python
# From backend/src/state/player_state.py (add this)
class PlayerState(BaseModel):
    # ... existing fields ...
    spell_attempts_by_location: dict[str, dict[str, int]] = Field(default_factory=dict)
    # Example: {"library": {"revelio": 2, "lumos": 1}, "dormitory": {}}
```

### Specificity Detection (Reuse Existing Functions)

```python
# From backend/src/context/spell_llm.py (lines 89-148)
# Already implemented - just reuse these!

def extract_target_from_input(text: str) -> str | None:
    """Pattern: "on X" or "at X" → returns X"""
    match = re.search(r"\b(?:on|at)\s+(.+)$", text, re.IGNORECASE)
    return match.group(1).strip() if match else None

def extract_intent_from_input(text: str) -> str | None:
    """Pattern: "to find about X", "about X" → returns X"""
    patterns = [
        r"to\s+(?:find\s+out|learn)\s+about\s+(.+)$",
        r"\babout\s+(.+)$",
    ]
    # ... pattern matching ...
```

### Success Calculation Algorithm

```python
# New function in backend/src/context/spell_llm.py
def calculate_specificity_bonus(player_input: str) -> int:
    """Calculate specificity bonus (0%, +10%, or +20%).

    Returns:
        0, 10, or 20 (percentage points)

    Examples:
        >>> calculate_specificity_bonus("Revelio")
        0
        >>> calculate_specificity_bonus("Revelio on desk")
        10  # +10% for target
        >>> calculate_specificity_bonus("Revelio on desk to find letters")
        20  # +10% target + 10% intent
    """
    has_target = extract_target_from_input(player_input) is not None
    has_intent = extract_intent_from_input(player_input) is not None

    bonus = 0
    if has_target:
        bonus += 10
    if has_intent:
        bonus += 10

    return bonus


def calculate_spell_success(
    spell_id: str,
    player_input: str,
    attempts_in_location: int,
    location_id: str
) -> bool:
    """Calculate whether spell cast succeeds.

    Args:
        spell_id: "revelio", "lumos", etc.
        player_input: Full player input text
        attempts_in_location: Number of times THIS spell cast in THIS location
        location_id: Current location (for logging/debugging)

    Returns:
        True if spell succeeds, False if fails

    Examples:
        >>> calculate_spell_success("revelio", "Revelio on desk to find clues", 0, "library")
        # 70 + 10 + 10 - 0 = 90% → likely True
        >>> calculate_spell_success("revelio", "Revelio", 6, "library")
        # 70 + 0 + 0 - 60 = 10% (floor) → likely False
    """
    import random

    # Base rate
    BASE_RATE = 70

    # Specificity bonus
    specificity_bonus = calculate_specificity_bonus(player_input)

    # Per-location decline
    decline_penalty = attempts_in_location * 10

    # Calculate final rate
    success_rate = BASE_RATE + specificity_bonus - decline_penalty

    # Apply floor
    success_rate = max(10, success_rate)

    # Roll
    roll = random.random() * 100  # 0.0-100.0
    return roll < success_rate
```

### Spell Effect Prompt Integration Pattern

```python
# From backend/src/context/spell_llm.py (lines 377-460)
# MODIFY this existing function:

def build_spell_effect_prompt(
    spell_name: str,
    target: str | None,
    location_context: dict[str, Any],
    witness_context: dict[str, Any] | None = None,
    player_context: dict[str, Any] | None = None,
    spell_outcome: str | None = None,  # NEW: "SUCCESS" | "FAILURE" | None
) -> str:
    """Build prompt for spell effect narration with success/failure."""

    # ... existing code for spell lookup, evidence formatting ...

    prompt = f"""You are narrating the effect of a spell in an Auror investigation.

== SPELL CAST ==
Spell: {spell["name"]}
Effect: {spell["description"]}
Category: {spell["category"]}
Target: {target or "general area"}

== SPELL OUTCOME ==
{spell_outcome or "Not calculated (old flow)"}

== RULES ==
1. If spell_outcome == "FAILURE" → "The spell fizzles and dissipates. Nothing revealed."
2. If spell_outcome == "SUCCESS":
   - If target matches valid targets AND undiscovered evidence exists → reveal with [EVIDENCE: id]
   - If target matches but no evidence → atmospheric effect only
   - If target invalid → "The spell finds nothing of note here."
3. If spell_outcome is None → use old behavior (always attempt reveal based on target)

== EVIDENCE THIS SPELL CAN REVEAL ==
{evidence_section}

Respond as the narrator (2-4 sentences):"""

    return prompt
```

### Integration in routes.py

```python
# From backend/src/api/routes.py (investigate endpoint, lines 428-467)
# MODIFY existing spell detection logic:

@router.post("/investigate")
async def investigate(req: InvestigateRequest) -> InvestigateResponse:
    # ... load state, location, etc. ...

    # Phase 4.6.2: Detect spell using fuzzy matching
    spell_id, target = detect_spell_with_fuzzy(req.player_input)
    is_spell = spell_id is not None

    # NEW: Calculate spell success for safe spells (not Legilimency)
    spell_outcome = None
    if is_spell and spell_id and spell_id.lower() != "legilimency":
        # Get attempt count for THIS spell in THIS location
        attempts = state.spell_attempts_by_location.get(
            state.current_location, {}
        ).get(spell_id.lower(), 0)

        # Calculate success
        success = calculate_spell_success(
            spell_id=spell_id.lower(),
            player_input=req.player_input,
            attempts_in_location=attempts,
            location_id=state.current_location
        )

        spell_outcome = "SUCCESS" if success else "FAILURE"

        # Increment attempt counter (AFTER calculation)
        if state.current_location not in state.spell_attempts_by_location:
            state.spell_attempts_by_location[state.current_location] = {}
        state.spell_attempts_by_location[state.current_location][spell_id.lower()] = attempts + 1

    if is_spell:
        # Get witness context for Legilimency (existing code)
        witness_context = None
        if spell_id and spell_id.lower() == "legilimency" and target:
            # ... existing witness lookup code ...
            pass

        # Build spell prompt with spell_outcome
        # IMPORTANT: build_narrator_or_spell_prompt routes to build_spell_effect_prompt for spells
        prompt, system_prompt, _ = build_narrator_or_spell_prompt(
            location_desc=location_desc,
            hidden_evidence=hidden_evidence,
            discovered_ids=discovered_ids,
            not_present=not_present,
            player_input=req.player_input,
            surface_elements=surface_elements,
            conversation_history=state.get_narrator_history_as_dicts(),
            spell_contexts=location.get("spell_contexts"),
            witness_context=witness_context,
            spell_outcome=spell_outcome,  # NEW: Pass success/failure to spell prompt
        )
    else:
        # Regular narrator prompt (no spell)
        prompt = build_narrator_prompt(
            location_desc=location_desc,
            hidden_evidence=hidden_evidence,
            discovered_ids=discovered_ids,
            not_present=not_present,
            player_input=req.player_input,
            surface_elements=surface_elements,
            conversation_history=state.get_narrator_history_as_dicts(),
        )
        system_prompt = build_system_prompt()

    # ... call narrator LLM, process response, save state ...
```

### State Persistence (Backward Compatible)

```python
# From backend/src/state/player_state.py (lines 1-400)
# Add to PlayerState model:

class PlayerState(BaseModel):
    """Main player state container"""
    player_id: str
    case_id: str
    current_location: str
    discovered_evidence: list[str]
    # ... existing fields ...

    # NEW FIELD (Phase 4.7)
    spell_attempts_by_location: dict[str, dict[str, int]] = Field(default_factory=dict)
    # Tracks spell usage per location per spell
    # Example: {"library": {"revelio": 2, "lumos": 1}, "dormitory": {"revelio": 1}}
    # Default empty dict ensures backward compatibility with old saves
```

---

## Current Codebase Structure

```bash
backend/src/
├── context/
│   ├── narrator.py              # MODIFY - Add spell_outcome to build_narrator_or_spell_prompt (lines 205-280)
│   └── spell_llm.py             # MODIFY - Add success calculation + spell_outcome to build_spell_effect_prompt (lines 377-460)
├── api/
│   └── routes.py                # MODIFY - Integrate success checks in investigate endpoint (lines 428-467)
├── state/
│   └── player_state.py          # MODIFY - Add spell_attempts_by_location field (lines 1-400)
└── tests/
    ├── test_spell_llm.py        # MODIFY - Add 15+ tests for success mechanics (62 classes → 77+)
    ├── test_narrator.py         # MODIFY - Add 5 tests for spell_outcome handling
    └── test_routes.py           # MODIFY - Add 8 integration tests for spell success flow (64 classes → 72)
```

**Note**: validation-gates handles comprehensive testing. No need to specify exact test scenarios here.

---

## Desired Codebase Structure

No new files. All changes modify existing files:

```bash
backend/src/
├── context/
│   ├── narrator.py              # MODIFIED - spell_outcome parameter added to build_narrator_or_spell_prompt
│   └── spell_llm.py             # MODIFIED - 2 new functions + spell_outcome parameter to build_spell_effect_prompt
├── api/
│   └── routes.py                # MODIFIED - Success calculation + spell_outcome passed to prompt builders
└── state/
    └── player_state.py          # MODIFIED - 1 new field (spell_attempts_by_location)
```

---

## Files to Create/Modify

| File | Action | Purpose | Reference Pattern |
|------|--------|---------|-------------------|
| `backend/src/context/spell_llm.py` | MODIFY | Add success calculation + spell_outcome to build_spell_effect_prompt | Reuse extract_target/intent (lines 89-148); modify build_spell_effect_prompt (lines 377-460) |
| `backend/src/api/routes.py` | MODIFY | Calculate success before spell prompt, pass to prompt builders | Existing spell detection logic (lines 428-467) |
| `backend/src/context/narrator.py` | MODIFY | Add spell_outcome to build_narrator_or_spell_prompt | Existing routing function (lines 205-280) |
| `backend/src/state/player_state.py` | MODIFY | Add spell_attempts_by_location field | Existing nested state pattern (lines 1-400) |
| `backend/tests/test_spell_llm.py` | MODIFY | Add success calculation tests | Existing spell detection tests (62 test classes) |
| `backend/tests/test_narrator.py` | MODIFY | Add spell_outcome tests | Existing narrator prompt tests |
| `backend/tests/test_routes.py` | MODIFY | Add integration tests for spell success | Existing investigate endpoint tests (64 test classes) |

**Note**: Test files handled by validation-gates. PRP provides acceptance criteria, not exact test implementation.

---

## Tasks (Ordered)

### Task 1: Add Success Calculation Functions
**File**: `backend/src/context/spell_llm.py`
**Action**: MODIFY (add 2 new functions)
**Purpose**: Calculate specificity bonus + spell success programmatically
**Reference**: Reuse extract_target_from_input, extract_intent_from_input (lines 89-148)
**Pattern**: Pure functions (no LLM calls, no state mutation)
**Depends on**: None
**Acceptance criteria**:
- [ ] `calculate_specificity_bonus(player_input)` returns 0, 10, or 20
- [ ] Detects target: "on X", "at X", "toward X", "against X"
- [ ] Detects intent: "to find", "to reveal", "to show", "to uncover", "to detect"
- [ ] `calculate_spell_success(spell_id, player_input, attempts, location)` returns bool
- [ ] Base rate 70%, specificity bonus 0-20%, decline -10% per attempt
- [ ] Floor at 10% (never below)
- [ ] Uses random.random() for roll (0.0-1.0)
- [ ] Pure functions (no side effects)

### Task 2: Extend PlayerState with Spell Tracking
**File**: `backend/src/state/player_state.py`
**Action**: MODIFY (add 1 new field)
**Purpose**: Track spell attempts per location per spell
**Reference**: Existing nested state pattern (conversation_history, narrator_conversation_history)
**Pattern**: `Field(default_factory=dict)` for backward compatibility
**Depends on**: None
**Acceptance criteria**:
- [ ] `spell_attempts_by_location: dict[str, dict[str, int]]` field exists
- [ ] Default empty dict (Field(default_factory=dict))
- [ ] Structure: `{"library": {"revelio": 2, "lumos": 1}}`
- [ ] Old saves load without error (backward compatible)
- [ ] Type hints correct (dict[str, dict[str, int]])

### Task 3: Integrate Success Checks in Investigation Endpoint
**File**: `backend/src/api/routes.py`
**Action**: MODIFY (add success logic to investigate endpoint)
**Purpose**: Calculate spell success before spell prompt, track attempts
**Reference**: Existing spell detection logic (lines 428-467)
**Integration**: Uses spell_llm.calculate_spell_success from Task 1
**Depends on**: Task 1, Task 2
**Acceptance criteria**:
- [ ] Detect spell using detect_spell_with_fuzzy (reuse existing)
- [ ] Skip Legilimency (only process 6 safe spells)
- [ ] Get attempt count from state.spell_attempts_by_location
- [ ] Call calculate_spell_success
- [ ] Set spell_outcome = "SUCCESS" or "FAILURE"
- [ ] Increment attempt counter AFTER calculation
- [ ] Initialize nested dicts if missing
- [ ] Pass spell_outcome to build_narrator_or_spell_prompt (which routes to build_spell_effect_prompt)

### Task 4: Add Spell Outcome to Spell Prompts
**File**: `backend/src/context/narrator.py` AND `backend/src/context/spell_llm.py`
**Action**: MODIFY (add spell_outcome parameter to routing and spell prompt functions)
**Purpose**: Spell narrator describes success/failure naturally, controls evidence revelation
**Reference**: build_narrator_or_spell_prompt (lines 205-280); build_spell_effect_prompt (lines 377-460)
**Integration**: Receives spell_outcome from routes.py (Task 3)
**Depends on**: Task 3
**Acceptance criteria**:
- [ ] `spell_outcome: str | None` parameter added to build_narrator_or_spell_prompt
- [ ] `spell_outcome` passed through to build_spell_effect_prompt
- [ ] `spell_outcome: str | None` parameter added to build_spell_effect_prompt
- [ ] Spell prompt includes spell outcome section (SUCCESS/FAILURE/None)
- [ ] SUCCESS rule: if target matches + evidence exists → reveal with [EVIDENCE: id]
- [ ] SUCCESS rule: if target matches + no evidence → atmospheric effect
- [ ] FAILURE rule: "The spell fizzles and dissipates. Nothing revealed."
- [ ] No mechanical language ("roll", "percentage", etc.)

### Task 5: Add Unit Tests for Success Calculation
**File**: `backend/tests/test_spell_llm.py`
**Action**: MODIFY (add 15+ test cases)
**Purpose**: Verify specificity detection and success calculation
**Reference**: Existing spell detection tests (62 test classes)
**Integration**: Tests functions from Task 1
**Depends on**: Task 1
**Acceptance criteria**:
- [ ] Test calculate_specificity_bonus: target only (+10%)
- [ ] Test calculate_specificity_bonus: intent only (+10%)
- [ ] Test calculate_specificity_bonus: both (+20%)
- [ ] Test calculate_specificity_bonus: neither (0%)
- [ ] Test calculate_spell_success: 1st attempt (70-90%)
- [ ] Test calculate_spell_success: 2nd attempt (60-80%)
- [ ] Test calculate_spell_success: 3rd attempt (50-70%)
- [ ] Test calculate_spell_success: 7th attempt (10% floor)
- [ ] Test all 6 safe spells (revelio, lumos, homenum_revelio, specialis_revelio, prior_incantato, reparo)
- [ ] Test specificity patterns: "on desk", "at window", "to find letters"

### Task 6: Add Narrator Prompt Tests
**File**: `backend/tests/test_narrator.py`
**Action**: MODIFY (add 5+ test cases)
**Purpose**: Verify narrator prompt includes spell outcome correctly
**Reference**: Existing narrator prompt tests
**Integration**: Tests narrator.py changes from Task 4
**Depends on**: Task 4
**Acceptance criteria**:
- [ ] Test prompt with spell_outcome="SUCCESS" (contains success rule)
- [ ] Test prompt with spell_outcome="FAILURE" (contains failure rule)
- [ ] Test prompt with spell_outcome=None (no spell section)
- [ ] Verify no mechanical language in prompts
- [ ] Verify prompt structure unchanged (backward compatible)

### Task 7: Add Integration Tests for Spell Success Flow
**File**: `backend/tests/test_routes.py`
**Action**: MODIFY (add 8+ test cases)
**Purpose**: Test full flow: spell detected → success calculated → narrator called → state updated
**Reference**: Existing investigate endpoint tests (64 test classes)
**Integration**: Tests full Task 3 integration
**Depends on**: Task 1, Task 2, Task 3, Task 4
**Acceptance criteria**:
- [ ] Test spell success increments attempt counter
- [ ] Test spell failure increments attempt counter (both success/fail increment)
- [ ] Test location reset (library → dormitory resets to 70%)
- [ ] Test nested dict initialization (first spell in new location)
- [ ] Test specificity bonus applied (input with "on desk" increases success rate)
- [ ] Test decline applied (3rd attempt lower than 1st)
- [ ] Test floor applied (7th attempt = 10%)
- [ ] Test Legilimency unchanged (not affected by success system)

---

## Integration Points

### Backend API
**Where**: `backend/src/api/routes.py` (investigate endpoint, lines 428-467)
**What**: Calculate spell success before spell prompt, pass to build_narrator_or_spell_prompt
**Pattern**: Reuse existing spell detection (detect_spell_with_fuzzy), add success calculation, pass outcome

### State Management
**Where**: `backend/src/state/player_state.py`
**What**: Add spell_attempts_by_location field
**Pattern**: Field(default_factory=dict) for backward compatibility (same pattern as conversation_history)

### Spell Prompt Routing
**Where**: `backend/src/context/narrator.py` (build_narrator_or_spell_prompt, lines 205-280)
**What**: Add spell_outcome parameter, pass through to spell prompt builder
**Pattern**: Optional parameter (str | None) with default None (backward compatible)

### Spell Effect Narration
**Where**: `backend/src/context/spell_llm.py` (build_spell_effect_prompt, lines 377-460)
**What**: Add spell_outcome parameter to control evidence revelation logic
**Pattern**: SUCCESS + target match + evidence → reveal; FAILURE → fizzle regardless

### Success Calculation
**Where**: `backend/src/context/spell_llm.py` (new functions)
**What**: Add success calculation functions (reuse existing target/intent extraction)
**Pattern**: Pure functions (no side effects, no LLM calls)

---

## Known Gotchas

### Random Seed for Tests
**Issue**: random.random() is non-deterministic, tests can be flaky
**Solution**: Mock random.random() in tests with `unittest.mock.patch("random.random")`
**Reference**: Standard Python testing pattern for randomness

**Example**:
```python
from unittest.mock import patch

def test_spell_success_90_percent():
    with patch("random.random", return_value=0.85):  # 85% roll
        success = calculate_spell_success("revelio", "Revelio on desk to find clues", 0, "library")
        assert success is True  # 90% rate > 85% roll → success

    with patch("random.random", return_value=0.95):  # 95% roll
        success = calculate_spell_success("revelio", "Revelio on desk to find clues", 0, "library")
        assert success is False  # 90% rate < 95% roll → failure
```

### Attempt Counter Timing
**Issue**: Increment AFTER calculation (not before), otherwise first cast counts as second
**Solution**: Get count, calculate success, THEN increment
**Reference**: Pattern from Phase 4.4 (conversation_history appending)

**Correct Order**:
```python
# 1. Get current count (0 for first cast)
attempts = state.spell_attempts_by_location.get(location, {}).get(spell, 0)

# 2. Calculate success (uses 0 for first cast → 70% base)
success = calculate_spell_success(spell, input, attempts, location)

# 3. Increment counter (now becomes 1)
state.spell_attempts_by_location[location][spell] = attempts + 1
```

### Location Change Detection
**Issue**: Need to track location changes to reset spell attempts
**Solution**: spell_attempts_by_location keyed by location_id. New location = new dict key = automatic reset
**Reference**: Dict structure naturally resets (no need for explicit reset logic)

**Example**:
```python
# Library (3 revelio attempts)
state.spell_attempts_by_location = {
    "library": {"revelio": 3}
}

# Player moves to dormitory
state.current_location = "dormitory"

# First revelio in dormitory
attempts = state.spell_attempts_by_location.get("dormitory", {}).get("revelio", 0)
# attempts = 0 (dormitory key doesn't exist yet) → 70% base rate ✅
```

### Intent Detection Overlap
**Issue**: extract_intent_from_input looks for "about X". "to find out about" vs "about" might overlap
**Solution**: Check specific patterns first ("to find out about"), then generic ("about")
**Reference**: spell_llm.py lines 137-148 already implements this (ordered pattern matching)

### Legilimency Exclusion
**Issue**: Legilimency should NOT use success system (keep trust-based)
**Solution**: Skip if spell_detected == "legilimency" (check before calculating success)
**Reference**: Phase 4.6.2 Legilimency programmatic outcomes (instant execution, trust threshold)

---

## Validation

### Syntax & Style (Pre-commit)
```bash
cd backend
uv run ruff check .
uv run ruff format .
uv run mypy src/
# Expected: No errors
```

### Manual Verification (Optional)
```bash
cd backend
uv run uvicorn src.main:app --reload
# Quick smoke test:
# 1. Cast "Revelio" in library → 70% success
# 2. Cast "Revelio on desk to find clues" in library → 90% success (specificity bonus)
# 3. Cast "Revelio" 3 more times in library → declining success (50% on 4th attempt)
# 4. Move to dormitory, cast "Revelio" → 70% success (reset!)
```

**Note**: validation-gates agent handles comprehensive testing. No need to specify full test scenarios in PRP.

---

## Dependencies

**New packages**: None (uses random from stdlib, reuses existing imports)

**Configuration**: No new env vars needed

---

## Out of Scope

- **UI indicators for success rate**: Not showing percentages to player (narrator-only feedback)
- **Spell cooldowns**: Just declining success, not preventing casts
- **Different success rates per spell**: All 6 safe spells use same 70% base
- **Dynamic success rates**: No LLM evaluation of "good" vs "bad" targets (static bonus rules)
- **Spell combinations**: No bonuses for casting multiple spells in sequence
- **Evidence-based success modifiers**: Success rate doesn't depend on evidence discovered

---

## Agent Orchestration Plan

### Execution Strategy

**Sequential Track** (dependencies):
1. `fastapi-specialist` → Backend implementation (Tasks 1-7)
2. `validation-gates` → Run all tests (603+ backend, 440+ frontend)
3. `documentation-manager` → Update docs (README, STATUS, CHANGELOG)

**Why Sequential**: All tasks are backend-only. No frontend changes = no parallel work needed.

### Agent-Specific Guidance

#### For fastapi-specialist
- **Input**: Tasks 1-7 (all backend implementation)
- **Context**: Quick Reference section (specificity detection, success algorithm, integration patterns)
- **Pattern**: Reuse existing spell_llm.py functions (extract_target_from_input, extract_intent_from_input)
- **Integration**: Modify investigate endpoint (routes.py lines 428-467) with success checks
- **Output**: Spell success system working (70% base, specificity bonuses, per-location decline)

**Key Files to Reference**:
- `backend/src/context/spell_llm.py` (lines 89-148 for target/intent extraction; lines 377-460 for build_spell_effect_prompt)
- `backend/src/api/routes.py` (lines 428-467 for existing spell detection)
- `backend/src/state/player_state.py` (lines 1-400 for nested state pattern)
- `backend/src/context/narrator.py` (lines 205-280 for build_narrator_or_spell_prompt routing)

**Critical Patterns**:
- Reuse existing functions (don't reimplement target/intent detection)
- Pure functions for success calculation (no side effects)
- Increment attempt AFTER calculation (not before)
- Skip Legilimency (only 6 safe spells)
- Field(default_factory=dict) for backward compatibility
- spell_outcome flows: routes.py → build_narrator_or_spell_prompt → build_spell_effect_prompt
- Evidence revelation controlled by spell_outcome + existing reveals_evidence system

#### For validation-gates
- **Input**: All code complete
- **Runs**: Backend tests (603+ → 630+ expected), lint (ruff), type check (mypy), frontend build
- **Output**: Pass/fail report with coverage
- **Note**: validation-gates creates tests if coverage gaps found

**Expected Test Coverage**:
- 15+ new tests in test_spell_llm.py (specificity, success calculation)
- 5+ new tests in test_narrator.py (spell_outcome parameter)
- 8+ new tests in test_routes.py (integration flow)
- Total: 630+ backend tests (603 current + 27+ new)

#### For documentation-manager
- **Input**: Code complete, validation passed
- **Files changed**: List from "Files to Create/Modify" section
- **Output**: Updated README (Phase 4.7 entry), STATUS.md (completion), CHANGELOG.md (v0.7.0)

**Documentation Updates**:
- README.md: Add "Spell Success System" feature (v0.7.0)
- STATUS.md: Mark Phase 4.7 complete, update test counts
- CHANGELOG.md: New entry with Task 1-7 details
- PLANNING.md: Update effort estimates (Phase 4.7 actual vs estimated)

### Handoff Context

**Next agent receives**:
- This PRP (full context)
- Quick Reference (no doc reading needed)
- Specific task numbers (Tasks 1-7)
- Actual file paths with line numbers (from Codebase Structure section)
- Pattern files to follow (spell_llm.py, routes.py, player_state.py, narrator.py)

**Next agent does NOT need**:
- ❌ Read research files (Quick Reference has everything)
- ❌ Search for examples (integration patterns provided)
- ❌ Read 5-10 docs (all APIs pre-digested)
- ❌ Explore codebase (file paths + line numbers provided)

---

## Anti-Patterns to Avoid

**From project experience**:
- ❌ Rewriting existing functions (reuse extract_target_from_input, extract_intent_from_input)
- ❌ Incrementing attempt counter BEFORE calculation (causes off-by-one error)
- ❌ Using LLM for success calculation (should be pure programmatic logic)
- ❌ Forgetting Field(default_factory=dict) for new state fields (breaks old saves)
- ❌ Applying success system to Legilimency (should remain trust-based)
- ❌ Showing percentages to player (narrator-only feedback, no UI indicators)

**From CLAUDE.md**:
- ❌ Adding complexity without need (KISS principle - simple dict tracking)
- ❌ Over-engineering state management (flat dict[str, dict[str, int]] is sufficient)
- ❌ Skipping type hints (all functions need proper type annotations)

---

## Confidence Score

**9/10** - Likelihood of one-pass implementation success

**Why high confidence**:
- ✅ All patterns proven in Phases 4.4-4.6.2 (state extension, spell detection, narrator integration)
- ✅ Reusing existing functions (extract_target_from_input, extract_intent_from_input)
- ✅ Simple algorithm (70% base + bonuses - decline = success rate)
- ✅ No new dependencies (uses stdlib random)
- ✅ Backend-only changes (no frontend complexity)
- ✅ Clear acceptance criteria (testable, measurable)

**Why not 10/10**:
- ⚠️ Random seed mocking required for deterministic tests (minor complexity)
- ⚠️ First time tracking attempts per location per spell (new nested dict structure)

---

**Generated**: 2026-01-11
**Source**: User requirements + PLANNING.md + STATUS.md + research files (CODEBASE, GITHUB, DOCS)
**Alignment**: Validated against PLANNING.md Phase 4.5-4.6.2 magic system architecture
**Next Agent**: fastapi-specialist (Tasks 1-7)

---

*"Magic is a tool, not a crutch. Your mind is the weapon." - Alastor "Mad-Eye" Moody*
