# Tom's Inner Voice System - Phase 4 PRP

**Phase**: 4 (Tom's Ghost)
**Goal**: 50% helpful / 50% misleading character voice with three-tier trigger system
**Effort**: 3-4 days (PLANNING.md lines 546-568)
**Status**: PLANNED

---

## Feature Overview

Tom Thornfield's ghost haunts the investigation, appearing with questions and observations triggered by evidence discovery. The system provides non-invasive, tier-based dialogue that is indistinguishably helpful or misleading—forcing players to evaluate advice rather than trust blindly. Triggers fire once based on evidence count thresholds (Tier 1: 0-2, Tier 2: 3-5, Tier 3: 6+), with 5-10% chance for rare emotional moments about Marcus Bellweather or Tom's own failures. UI displays inline in conversation feed with skull icon and distinct amber coloring.

**Key Mechanics**:
- **Trigger system**: Evidence-count-based conditions, tier priority (3>2>1), random selection within tier
- **50/50 split**: Half helpful (Socratic questioning), half misleading (plausible but wrong)
- **No repeats**: Fired triggers stored in PlayerState, excluded from future selections
- **Rare triggers**: 5-10% chance for self-aware/emotional moments (Marcus regret, dark humor)
- **UI integration**: Inline conversation messages (💀 TOM: prefix), visually distinct from narrator

---

## Why

**User Impact**:
- Adds depth to investigation (internal dialogue, not just narrator)
- Teaches critical evaluation of advice (can't blindly trust)
- Humanizes rationality themes (Tom's failures as cautionary tale)

**Business Value**:
- Differentiates from standard detective games (unique ghost mentor mechanic)
- Demonstrates educational game design (teaches epistemic humility)
- Sets up future narrative arcs (Marcus Bellweather wrongful conviction in Case 10)

**Integration**:
- Complements narrator (narrator describes world, Tom comments on player's thinking)
- Extends witness system (reuses trigger parsing, state tracking patterns)
- Prepares for Phase 4.5 (magic system will use similar trigger conditions)

**Alignment**:
- PLANNING.md Phase 4 (lines 546-568): Exact match on mechanics (tier system, rare triggers, 50/50 split)
- GAME_DESIGN.md (lines 745-879): Tom's character, backstory, philosophy match design doc
- CASE_DESIGN_GUIDE.md (lines 571-777): Tom's Voice Module provides YAML structure template

---

## What

### User-Visible Behavior

**During Investigation**:
1. Player discovers evidence → evidence_count increments
2. System checks highest eligible tier (Tier 3 first, then 2, then 1)
3. Random trigger selected from tier (5-10% chance for rare if available)
4. Tom's message appears inline in conversation history
5. Message persists with conversation (scrolls naturally)
6. Trigger marked as fired (won't repeat this case)

**Tom's Character Voice**:
- **Helpful** (50%): "What would need to be true for that theory to work?" (Socratic)
- **Misleading** (50%): "Three witnesses agree—that's strong corroboration." (Plausible but wrong)
- **Rare** (5-10%): "Marcus Bellweather's still in Azkaban. 15 years. Because I was so certain..." (Emotional)

**Visual Presentation**:
```
> examine the desk

NARRATOR: You carefully inspect the desk and find
a hidden compartment with a wand fragment.

💀 TOM: "First piece of evidence. What does it
actually prove? That someone was here? When? Why?"

> talk to hermione
```
- Skull icon (💀) + "TOM:" prefix distinguishes from narrator
- Amber text color (text-amber-300/90) for ghost aesthetic
- Same monospace font as narrator
- No additional labels needed (visual distinction sufficient)

### Technical Requirements

**Backend**:
- Extend trigger condition parser (support `evidence_count>N`, `evidence_count==N`)
- New `InnerVoiceState` model (fired_triggers list, trigger_history)
- Random selection logic (tier priority, rare chance evaluation)
- API endpoint: `POST /api/case/{case_id}/inner-voice/check`

**Frontend**:
- Add tom_ghost message type to conversation messages
- Update LocationView to render Tom messages with skull icon + amber color
- useInnerVoice hook (state management, trigger requests)
- Auto-trigger checks on evidence discovery
- Integration with existing conversation history

**YAML**:
- New `inner_voice` section in case.yaml
- Triggers organized by tier (tier_1, tier_2, tier_3)
- Each trigger: id, condition, type (helpful/misleading), text, is_rare flag

### Success Criteria

- [ ] Tom's voice triggers fire when evidence count crosses tier thresholds
- [ ] 50% helpful / 50% misleading distribution achieved across 10+ triggers
- [ ] Rare triggers (Marcus regret, dark humor) fire 5-10% of the time
- [ ] No trigger fires twice in same case (fired_triggers tracking works)
- [ ] Tom messages appear inline in conversation feed (skull icon, amber color, distinct from narrator)
- [ ] Tier 3 triggers only fire with 6+ evidence, Tier 2 with 3-5, Tier 1 with 0-2
- [ ] System integrates with existing investigation flow (no blocking modals, natural scroll)
- [ ] All tests pass (backend 387+, frontend 405+)
- [ ] Lint/type check passes (ruff, mypy, TypeScript)

---

## Context & References

### Project Documentation

**Architecture** (from PLANNING.md):
- Phase 4 focuses on inner voice system with tier-based trigger logic
- 3-4 day effort estimate (matches research complexity)
- Builds on Phase 3 patterns (state tracking, modal UI, YAML parsing)

**Design Principles** (from AUROR_ACADEMY_GAME_DESIGN.md lines 745-879):
- Tom Thornfield: Failed Auror recruit, died 1994, haunts Academy
- Backstory: Wrongly convicted Marcus Bellweather (Case #2), died on Case #3
- 50/50 helpful/misleading philosophy (player learns to evaluate advice)
- Rare emotional moments (5-10%): Marcus regret, dark humor, self-awareness

**Current State** (from STATUS.md):
- Phase 3.9 complete (validation learning system)
- Backend: 385/387 tests passing
- Frontend: 405/405 tests passing
- Ready for Phase 4 implementation

### Research Sources

**GitHub Research** (GITHUB-RESEARCH-PHASE4.md):
- ✅ Yarn Spinner: Conditional branching with boolean logic (evidence_count thresholds)
- ✅ Twine: State persistence with Set macros (fired trigger tracking)
- ✅ Godot Dialogue Manager: Stateless tier evaluation, random selection within tier
- **Pattern adopted**: Tier priority (3>2>1) + random selection + rare chance filter

**Codebase Research** (CODEBASE-RESEARCH-PHASE4.md):
- ✅ Evidence trigger system: `backend/src/utils/trust.py` (lines 86-207)
  - `parse_trigger_condition()` supports OR/AND, trust thresholds, evidence checks
  - `evaluate_condition()` evaluates parsed conditions against state
  - **Direct reuse**: Extend for `evidence_count>N` conditions
- ✅ State tracking: `backend/src/state/player_state.py` (lines 1-157)
  - BriefingState, WitnessState patterns → InnerVoiceState
  - `add_question()`, `mark_complete()` methods → `fire_trigger()`, `has_fired()`
- ✅ Modal UI: `frontend/src/components/ui/Modal.tsx` (lines 1-83)
  - Terminal variant support (bg-gray-900, border-gray-700)
  - **Pattern**: BriefingModal structure → InnerVoiceToast (simpler, toast-based)

**Docs Research** (DOCS-RESEARCH-PHASE4.md):
- ✅ Pydantic v2: Nested models, validators, ConfigDict patterns
- ✅ React useReducer: State management for fired triggers, evidence count
- ✅ React message type patterns: Extend existing conversation messages

**Alignment Notes**:
- ✅ Research aligns with project architecture (reuses proven patterns)
- ✅ GitHub patterns (Yarn/Twine/Godot) map directly to requirements
- ✅ Codebase patterns provide exact functions to extend (`parse_trigger_condition`)
- ✅ Docs research provides implementation-ready code snippets

---

## Quick Reference (Pre-Digested Context)

### Essential API Signatures

#### Backend: Trigger Condition Parsing (Reuse Existing)
```python
# From: backend/src/utils/trust.py (lines 86-207)
# REUSE: parse_trigger_condition() and evaluate_condition()

def parse_trigger_condition(trigger: str) -> list[dict[str, Any]]:
    """Parse trigger string into evaluable conditions.

    Supports:
    - "trust>N" or "trust<N" (trust threshold)
    - "evidence:X" (requires evidence)
    - "AND" / "OR" operators

    NEW for Tom: Extend to support "evidence_count>N", "evidence_count==N"
    """
    # ... existing implementation handles OR/AND parsing ...

    # ADD NEW REGEX MATCH for evidence_count:
    count_match = re.match(r"evidence_count\s*([<>=!]+)\s*(\d+)", part, re.IGNORECASE)
    if count_match:
        and_conditions.append({
            "type": "evidence_count",
            "operator": count_match.group(1),
            "value": int(count_match.group(2)),
        })
        continue
```

#### Backend: Trigger Selection Algorithm
```python
# NEW FILE: backend/src/context/inner_voice.py
import random
from typing import Any

def select_tom_trigger(
    triggers_by_tier: dict[int, list[dict[str, Any]]],
    evidence_count: int,
    fired_triggers: list[str],
) -> dict[str, Any] | None:
    """Select Tom trigger to fire.

    Algorithm:
    1. Check Tier 3 first (evidence_count >= 6), then Tier 2 (>= 3), then Tier 1
    2. Filter to unfired triggers with met conditions
    3. 5-10% chance for rare triggers if available
    4. Random selection within tier
    5. Return None if no eligible triggers
    """
    # Check tiers in priority order
    for tier in [3, 2, 1]:
        tier_triggers = triggers_by_tier.get(tier, [])

        # Filter to eligible (condition met, not fired)
        eligible = [
            t for t in tier_triggers
            if t["id"] not in fired_triggers
            and _check_condition(t["condition"], evidence_count)
        ]

        if not eligible:
            continue

        # Separate rare from regular
        rare = [t for t in eligible if t.get("is_rare", False)]
        regular = [t for t in eligible if not t.get("is_rare", False)]

        # 5-10% chance for rare trigger
        if rare and random.random() < 0.07:  # 7% chance
            return random.choice(rare)

        # Otherwise pick regular
        if regular:
            return random.choice(regular)

        # Fallback to rare if no regular
        if rare:
            return random.choice(rare)

    return None  # No eligible triggers

def _check_condition(condition: str, evidence_count: int) -> bool:
    """Evaluate evidence_count condition."""
    # Parse "evidence_count>5" → operator=">" value=5
    match = re.match(r"evidence_count\s*([<>=!]+)\s*(\d+)", condition)
    if not match:
        return False

    operator, threshold = match.group(1), int(match.group(2))

    if operator == ">":
        return evidence_count > threshold
    elif operator == ">=":
        return evidence_count >= threshold
    elif operator == "==":
        return evidence_count == threshold
    elif operator == "<":
        return evidence_count < threshold
    elif operator == "<=":
        return evidence_count <= threshold

    return False
```

### Key Patterns from Research

#### Pattern 1: State Tracking (from Codebase)
```python
# From: backend/src/state/player_state.py
# Follow BriefingState pattern for InnerVoiceState

class TomTriggerRecord(BaseModel):
    """Single Tom inner voice trigger event."""
    trigger_id: str
    text: str
    type: str  # "helpful" | "misleading" | "self_aware" | "dark_humor" | "emotional"
    tier: int  # 1 | 2 | 3
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    evidence_count_at_fire: int


class InnerVoiceState(BaseModel):
    """State for Tom's inner voice system."""
    case_id: str
    fired_triggers: list[str] = Field(default_factory=list)
    trigger_history: list[TomTriggerRecord] = Field(default_factory=list)
    total_interruptions: int = 0
    last_interruption_at: datetime | None = None

    def fire_trigger(
        self,
        trigger_id: str,
        text: str,
        trigger_type: str,
        tier: int,
        evidence_count: int,
    ) -> None:
        """Record a fired trigger."""
        self.fired_triggers.append(trigger_id)
        self.trigger_history.append(
            TomTriggerRecord(
                trigger_id=trigger_id,
                text=text,
                type=trigger_type,
                tier=tier,
                evidence_count_at_fire=evidence_count,
            )
        )
        self.total_interruptions += 1
        self.last_interruption_at = datetime.now(UTC)

    def has_fired(self, trigger_id: str) -> bool:
        """Check if trigger already fired."""
        return trigger_id in self.fired_triggers
```

#### Pattern 2: Inline Message Rendering
```typescript
// MODIFY: frontend/src/components/LocationView.tsx
// Add tom_ghost rendering to conversation message loop

{messages.map((message, index) => {
  if (message.type === 'player') {
    return (
      <div key={index} className="flex gap-2 mb-2">
        <span className="text-gray-500">&gt;</span>
        <span className="text-gray-300">{message.text}</span>
      </div>
    );
  }

  if (message.type === 'narrator') {
    return (
      <div key={index} className="mb-4 text-gray-100 leading-relaxed">
        NARRATOR: {message.text}
      </div>
    );
  }

  if (message.type === 'tom_ghost') {
    return (
      <div key={index} className="flex gap-2 text-amber-300/90 font-mono text-sm my-2">
        <span className="flex-shrink-0">💀 TOM:</span>
        <span className="leading-relaxed">{message.text}</span>
      </div>
    );
  }

  return null;
})}
```

#### Pattern 3: Message Type Extension
```typescript
// MODIFY: frontend/src/types/investigation.ts
// Add tom_ghost to existing Message type

type Message =
  | { type: 'player'; text: string }
  | { type: 'narrator'; text: string }
  | { type: 'tom_ghost'; text: string; tone: 'helpful' | 'misleading' };

// Optional: Add for future use
interface InnerVoiceTrigger {
  id: string;
  text: string;
  type: 'helpful' | 'misleading' | 'self_aware' | 'dark_humor' | 'emotional';
  tier: 1 | 2 | 3;
}
```

### Integration Patterns (Actual Codebase)

#### Integration Point 1: Evidence Discovery Hook
```typescript
// MODIFY: frontend/src/hooks/useInvestigation.ts
// Add inner voice check after evidence discovery, append message to conversation

const { checkTomTrigger } = useInnerVoice(caseId, playerId);

const investigate = useCallback(async (input: string) => {
  // ... existing investigation logic ...

  if (data.new_evidence && data.new_evidence.length > 0) {
    // Update evidence count
    const newCount = state.discovered_evidence.length + data.new_evidence.length;

    // Check for Tom trigger (non-blocking)
    try {
      const tomMessage = await checkTomTrigger(newCount);
      if (tomMessage) {
        // Add Tom's message to conversation
        setMessages(prev => [...prev, tomMessage]);
      }
    } catch (error) {
      console.error('Tom trigger error:', error);
    }
  }

  // ... rest of logic ...
}, [checkTomTrigger, state.discovered_evidence, setMessages]);
```

#### Integration Point 2: API Endpoint
```python
# MODIFY: backend/src/api/routes.py
# Add new endpoint after existing /briefing routes

from src.context.inner_voice import select_tom_trigger, load_tom_triggers
from src.state.player_state import InnerVoiceState

@app.post("/api/case/{case_id}/inner-voice/check")
async def check_inner_voice_trigger(
    case_id: str,
    request: InnerVoiceCheckRequest,
    player_id: str = Header(..., alias="X-Player-ID"),
) -> InnerVoiceTriggerResponse:
    """Check if Tom should speak based on evidence count.

    Returns 404 if no eligible triggers.
    """
    # Load player state
    state = load_state(player_id, case_id)
    inner_voice_state = state.get_inner_voice_state()

    # Load case triggers (cached)
    triggers_by_tier = load_tom_triggers(case_id)

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
    save_state(state)

    return InnerVoiceTriggerResponse(
        id=trigger["id"],
        text=trigger["text"],
        type=trigger["type"],
        tier=trigger["tier"],
    )
```

### Library-Specific Gotchas

**React Message Rendering**:
- ✅ Skull icon (💀) provides clear visual distinction from narrator
- ✅ Amber color (text-amber-300/90) creates ghost aesthetic without being distracting
- ✅ Messages persist in conversation (unlike toasts that disappear)
- ✅ Natural scroll behavior matches existing chat pattern

**Pydantic**:
- ❌ DateTime serialization breaks JSON → Use `model_dump(mode="json")` like `persistence.py`
- ❌ Set fields don't serialize → Use list for `fired_triggers` (not set)
- ✅ `validate_assignment=True` ensures state remains valid after mutations

**Random Selection**:
- ❌ Frontend random() not seeded → Backend does selection (server-side random.random())
- ❌ Equal probability between helpful/misleading → Just random selection (50% natural distribution)
- ✅ Rare triggers: Filter first, then random.random() < 0.07 check

### Decision Tree

```
Evidence discovered:
  1. Increment evidence_count in frontend state
  2. Call POST /api/case/{case_id}/inner-voice/check with evidence_count
  3. Backend:
     a. Load InnerVoiceState (fired_triggers list)
     b. Load case inner_voice triggers (tier_1, tier_2, tier_3)
     c. Determine tier based on evidence_count:
        - Tier 3: evidence_count >= 6
        - Tier 2: evidence_count >= 3
        - Tier 1: evidence_count < 3
     d. Check tier priority (3 → 2 → 1):
        - Filter to eligible (condition met, not in fired_triggers)
        - If rare available and random.random() < 0.07: pick rare
        - Else: pick random from regular
        - If no regular: pick random from rare
     e. If trigger found:
        - Mark as fired in InnerVoiceState
        - Save state
        - Return trigger
     f. If no trigger found: return 404
  4. Frontend:
     - If 404: silently continue (no more triggers)
     - If trigger: display toast with text, type, tier
     - Auto-dismiss after 5000ms
```

### Configuration Requirements

```bash
# No new frontend dependencies (use existing Message type extension)

# No new backend dependencies (reuse existing)
# - random (Python stdlib)
# - Pydantic (already installed)
# - FastAPI (already installed)
```

---

## Current Codebase Structure

```bash
backend/src/
├── api/
│   └── routes.py                    # MODIFY - Add /inner-voice/check endpoint
├── context/
│   ├── narrator.py                  # REFERENCE - Prompt structure pattern
│   ├── witness.py                   # REFERENCE - Trigger evaluation pattern
│   └── inner_voice.py               # CREATE - Tom trigger selection logic
├── state/
│   └── player_state.py              # MODIFY - Add InnerVoiceState model
├── utils/
│   └── trust.py                     # MODIFY - Extend parse_trigger_condition()
└── case_store/
    ├── loader.py                    # MODIFY - Add load_tom_triggers()
    └── case_001.yaml                # MODIFY - Add inner_voice section

frontend/src/
├── components/
│   └── ui/
│       └── Modal.tsx                # REFERENCE - Terminal variant pattern
├── hooks/
│   ├── useInvestigation.ts          # MODIFY - Add checkTomTrigger() call
│   └── useInnerVoice.ts             # CREATE - Tom trigger state management
├── types/
│   └── investigation.ts             # MODIFY - Add InnerVoiceTrigger type
└── App.tsx                          # MODIFY - Add <Toaster> component
```

## Desired Codebase Structure

```bash
backend/src/
├── context/
│   └── inner_voice.py               # CREATE - select_tom_trigger(), load_tom_triggers()
├── api/
│   ├── routes.py                    # MODIFY - Add POST /inner-voice/check endpoint
│   └── models.py                    # MODIFY - Add InnerVoiceCheckRequest, InnerVoiceTriggerResponse
├── state/
│   └── player_state.py              # MODIFY - Add InnerVoiceState, TomTriggerRecord models
├── utils/
│   └── trust.py                     # MODIFY - Extend parse_trigger_condition() for evidence_count

frontend/src/
├── hooks/
│   ├── useInnerVoice.ts             # CREATE - Tom trigger hook (checkTomTrigger, returns message)
│   └── useInvestigation.ts          # MODIFY - Add Tom trigger check, append to conversation
├── types/
│   └── investigation.ts             # MODIFY - Add tom_ghost to Message type, InnerVoiceTrigger interface
├── components/
│   └── LocationView.tsx             # MODIFY - Render tom_ghost messages inline
└── api/
    └── client.ts                    # MODIFY - Add checkInnerVoice API function
```

**Note**: validation-gates handles test file creation. Don't include in structure.

---

## Files to Create/Modify

| File | Action | Purpose | Reference File | Lines |
|------|--------|---------|----------------|-------|
| `backend/src/context/inner_voice.py` | CREATE | Tom trigger selection logic | `backend/src/context/witness.py` | ~150 |
| `backend/src/state/player_state.py` | MODIFY | Add InnerVoiceState model | Existing WitnessState pattern | +50 |
| `backend/src/utils/trust.py` | MODIFY | Extend trigger parser for evidence_count | Existing parse_trigger_condition | +30 |
| `backend/src/api/routes.py` | MODIFY | Add /inner-voice/check endpoint | Existing /briefing routes | +80 |
| `backend/src/api/models.py` | MODIFY | Add InnerVoiceCheckRequest/Response | Existing Pydantic models | +20 |
| `backend/src/case_store/loader.py` | MODIFY | Add load_tom_triggers() | Existing load_case() | +25 |
| `backend/src/case_store/case_001.yaml` | MODIFY | Add inner_voice section | Existing briefing section | +120 |
| `frontend/src/hooks/useInnerVoice.ts` | CREATE | Tom trigger state management | `useBriefing.ts` pattern | ~100 |
| `frontend/src/hooks/useInvestigation.ts` | MODIFY | Call checkTomTrigger on evidence | Existing investigate() | +10 |
| `frontend/src/types/investigation.ts` | MODIFY | Add tom_ghost to Message, InnerVoiceTrigger interface | Existing types | +12 |
| `frontend/src/components/LocationView.tsx` | MODIFY | Add tom_ghost message rendering | Message loop | +15 |
| `frontend/src/api/client.ts` | MODIFY | Add checkInnerVoice function | Existing API calls | +20 |

**Note**: Test files handled by validation-gates. Don't list in PRP.

**Total new code estimate**: ~600 lines (backend ~300, frontend ~200, YAML ~100)

---

## Tasks (Ordered)

### Task 1: Extend Trigger Condition Parser
**File**: `backend/src/utils/trust.py`
**Action**: MODIFY (extend existing function)
**Purpose**: Support `evidence_count>N`, `evidence_count==N`, `evidence_count<N` conditions
**Reference**: Lines 86-207 (existing `parse_trigger_condition()`)
**Pattern**: Add new regex match for evidence_count before existing trust/evidence checks
**Depends on**: None
**Acceptance criteria**:
- [ ] `parse_trigger_condition("evidence_count>5")` returns condition dict
- [ ] `evaluate_condition()` handles `type="evidence_count"` with operators >, <, ==, >=, <=
- [ ] Existing trust/evidence parsing still works (no regression)
- [ ] Tests pass for mixed conditions: "evidence_count>3 AND trust>50"

### Task 2: Create Inner Voice State Models
**File**: `backend/src/state/player_state.py`
**Action**: MODIFY (add new models)
**Purpose**: Track fired triggers, trigger history
**Reference**: Lines 1-157 (WitnessState, BriefingState patterns)
**Integration**: Extend PlayerState with `inner_voice_state: InnerVoiceState | None`
**Depends on**: None
**Acceptance criteria**:
- [ ] TomTriggerRecord model exists (trigger_id, text, type, tier, timestamp, evidence_count_at_fire)
- [ ] InnerVoiceState model exists (case_id, fired_triggers list, trigger_history, methods)
- [ ] `fire_trigger()` method appends to fired_triggers and trigger_history
- [ ] `has_fired()` method checks if trigger_id in fired_triggers
- [ ] PlayerState.get_inner_voice_state() returns existing or creates new

### Task 3: Create Tom Trigger Selection Logic
**File**: `backend/src/context/inner_voice.py`
**Action**: CREATE
**Purpose**: Implement tier priority, random selection, rare chance logic
**Reference**: `backend/src/context/witness.py` (context builder pattern)
**Integration**: Used by API endpoint in routes.py
**Depends on**: Task 1 (parser), Task 2 (state models)
**Acceptance criteria**:
- [ ] `select_tom_trigger()` function exists
- [ ] Checks tiers in priority order [3, 2, 1]
- [ ] Filters to unfired triggers with met conditions
- [ ] 7% chance for rare triggers if available (using random.random())
- [ ] Random selection within tier using random.choice()
- [ ] Returns None if no eligible triggers
- [ ] `load_tom_triggers()` function loads inner_voice section from YAML

### Task 4: Add Inner Voice API Endpoint
**File**: `backend/src/api/routes.py`
**Action**: MODIFY (add new endpoint)
**Purpose**: Handle trigger checks from frontend
**Reference**: Lines 1174-1313 (briefing endpoints pattern)
**Integration**: Uses inner_voice.py selection logic, state models
**Depends on**: Task 2 (state), Task 3 (selection logic)
**Acceptance criteria**:
- [ ] `POST /api/case/{case_id}/inner-voice/check` endpoint exists
- [ ] Accepts InnerVoiceCheckRequest (player_id, evidence_count)
- [ ] Loads player state, calls select_tom_trigger()
- [ ] Returns 404 if no eligible triggers (not an error)
- [ ] Marks trigger as fired in InnerVoiceState
- [ ] Saves state before returning
- [ ] Returns InnerVoiceTriggerResponse (id, text, type, tier)

### Task 5: Create Inner Voice Request/Response Models
**File**: `backend/src/api/models.py`
**Action**: MODIFY (add new models)
**Purpose**: API request/response validation
**Reference**: Existing Pydantic models in file
**Integration**: Used by routes.py endpoint
**Depends on**: None
**Acceptance criteria**:
- [ ] InnerVoiceCheckRequest model (player_id: str, evidence_count: int)
- [ ] InnerVoiceTriggerResponse model (id: str, text: str, type: str, tier: int)
- [ ] Models have proper Pydantic validation (Field constraints)

### Task 6: Extend YAML Loader for Tom Triggers
**File**: `backend/src/case_store/loader.py`
**Action**: MODIFY (add new function)
**Purpose**: Load inner_voice section from case YAML
**Reference**: Existing load_case() function
**Integration**: Called by inner_voice.py
**Depends on**: Task 7 (YAML structure)
**Acceptance criteria**:
- [ ] `load_tom_triggers(case_id: str)` function exists
- [ ] Returns dict[int, list[dict]] (tier → trigger list mapping)
- [ ] Handles missing inner_voice section gracefully (returns empty dict)
- [ ] Caches loaded triggers (don't re-parse YAML every call)

### Task 7: Add Inner Voice Section to Case YAML
**File**: `backend/src/case_store/case_001.yaml`
**Action**: MODIFY (add new section)
**Purpose**: Define Tom's triggers for Case 1
**Reference**: Lines 354-387 (briefing section), CASE_DESIGN_GUIDE.md lines 717-777
**Pattern**: Tier-based structure (tier_1, tier_2, tier_3) with id, condition, type, text, is_rare
**Depends on**: None
**Acceptance criteria**:
- [ ] `inner_voice` section exists with character, backstory, triggers
- [ ] tier_1 has 3-4 triggers (evidence_count 0-2)
- [ ] tier_2 has 3-4 triggers (evidence_count 3-5)
- [ ] tier_3 has 3-4 triggers (evidence_count 6+)
- [ ] 50% helpful, 50% misleading distribution across all tiers
- [ ] 1-2 rare triggers (is_rare: true) in tier_2 or tier_3
- [ ] All trigger IDs unique
- [ ] Conditions use evidence_count syntax (evidence_count>N, evidence_count==N)

### Task 8: Add tom_ghost Message Type
**File**: `frontend/src/types/investigation.ts`
**Action**: MODIFY (extend Message type)
**Purpose**: Support Tom's ghost messages in conversation
**Reference**: Existing message types (player, narrator)
**Integration**: Used by LocationView for rendering
**Depends on**: None
**Acceptance criteria**:
- [ ] Message type includes tom_ghost variant: `| { type: 'tom_ghost', text: string, tone: 'helpful' | 'misleading' }`
- [ ] Tone field added (for future color coding)
- [ ] Type-safe across frontend

### Task 9: Update LocationView to Render Tom Messages
**File**: `frontend/src/components/LocationView.tsx`
**Action**: MODIFY (add tom_ghost rendering)
**Purpose**: Display Tom messages inline with conversation
**Reference**: Existing narrator message rendering
**Integration**: Conversation history rendering loop
**Depends on**: Task 8 (tom_ghost type)
**Acceptance criteria**:
- [ ] Tom messages render with skull icon (💀) + "TOM:" prefix
- [ ] Amber text color (text-amber-300/90)
- [ ] Same monospace font as narrator
- [ ] Visually distinct but cohesive with conversation
- [ ] No extra labels or brackets (clean presentation)

### Task 10: Create useInnerVoice Hook
**File**: `frontend/src/hooks/useInnerVoice.ts`
**Action**: CREATE
**Purpose**: Tom trigger state management, API integration, returns messages for conversation
**Reference**: `useBriefing.ts` pattern (state + API calls)
**Integration**: Used by useInvestigation.ts
**Depends on**: Task 4 (API endpoint), Task 8 (tom_ghost type)
**Acceptance criteria**:
- [ ] `useInnerVoice(caseId, playerId)` hook exists
- [ ] Returns `{ checkTomTrigger, evidenceCount, loading }`
- [ ] `checkTomTrigger(newEvidenceCount)` calls POST /api/.../inner-voice/check
- [ ] Handles 404 response silently (no eligible triggers, returns null)
- [ ] Returns tom_ghost message object on successful trigger: `{ type: 'tom_ghost', text: string, tone: 'helpful' | 'misleading' }`
- [ ] Caller adds message to conversation (doesn't display directly)
- [ ] Non-blocking async (errors don't break investigation)

### Task 11: Integrate Tom Trigger Check in Investigation Hook
**File**: `frontend/src/hooks/useInvestigation.ts`
**Action**: MODIFY (add checkTomTrigger call + message handling)
**Purpose**: Auto-check for Tom triggers on evidence discovery, add to conversation
**Reference**: Existing investigate() function, conversation state management
**Integration**: Calls useInnerVoice hook, updates messages state
**Depends on**: Task 10 (useInnerVoice hook)
**Acceptance criteria**:
- [ ] Import and call `useInnerVoice(caseId, playerId)`
- [ ] In `investigate()` success handler, check if new_evidence exists
- [ ] Calculate newEvidenceCount = current + new_evidence.length
- [ ] Call `const tomMessage = await checkTomTrigger(newEvidenceCount)`
- [ ] If tomMessage exists, add to conversation: `setMessages(prev => [...prev, tomMessage])`
- [ ] Don't block investigation on Tom trigger errors (try/catch)
- [ ] Tom message appears after narrator response in conversation

### Task 12: Update API Client
**File**: `frontend/src/api/client.ts`
**Action**: MODIFY (add checkInnerVoice function)
**Purpose**: API call for Tom trigger checks
**Reference**: Existing briefing API calls
**Integration**: Used by useInnerVoice.ts
**Depends on**: Task 4 (backend endpoint)
**Acceptance criteria**:
- [ ] `checkInnerVoice(caseId, playerId, evidenceCount)` function exists
- [ ] Calls POST /api/case/{caseId}/inner-voice/check
- [ ] Returns InnerVoiceTrigger | null (null for 404/no triggers)
- [ ] Handles errors gracefully (returns null, logs error)
- [ ] Type-safe with investigation types

---

## Integration Points

### Backend API
**Where**: `backend/src/api/routes.py`
**What**: Add new endpoint after existing `/briefing` routes (lines 1174-1313)
**Pattern**: Follow async endpoint structure with player state load/save
**Signature**: `POST /api/case/{case_id}/inner-voice/check`

### State Management
**Where**: `backend/src/state/player_state.py`
**What**: Add `InnerVoiceState` class, extend PlayerState
**Pattern**: Follow BriefingState structure with methods (fire_trigger, has_fired)
**Note**: Save/load handled by existing persistence.py (no changes needed)

### Trigger Parsing
**Where**: `backend/src/utils/trust.py`
**What**: Extend `parse_trigger_condition()` for evidence_count conditions
**Pattern**: Add new regex match before existing evidence/trust matches
**Note**: Don't break existing witness secret parsing

### Frontend Hook
**Where**: `frontend/src/hooks/useInvestigation.ts`
**What**: Call `checkTomTrigger()` after evidence discovery
**Pattern**: Non-blocking async call with error catch (don't block investigation)
**Integration**: Import useInnerVoice, call in investigate() success handler

### UI Display
**Where**: `frontend/src/components/LocationView.tsx` (conversation rendering)
**What**: Render tom_ghost messages inline with narrator/player messages
**Pattern**: Skull icon (💀) + "TOM:" prefix, amber text color (text-amber-300/90)
**Behavior**: Messages persist in conversation history, scroll naturally with other messages

### YAML Case Definition
**Where**: `backend/src/case_store/case_001.yaml`
**What**: Add `inner_voice` section with tier-based triggers
**Pattern**: Follow briefing section structure (nested objects, lists)
**Note**: Loader.py gracefully handles missing section (backward compatible)

---

## Known Gotchas

### React Toast Positioning (from docs research)
- **Issue**: Default "top-center" position covers investigation input
- **Solution**: Use `position="top-right"` in Toaster config
- **Reference**: DOCS-RESEARCH-PHASE4.md lines 99-116

### Pydantic DateTime Serialization (from project codebase)
- **Issue**: datetime objects don't serialize to JSON by default
- **Solution**: Use `model_dump(mode="json")` in save_state()
- **Reference**: `backend/src/state/persistence.py` (line 53)
- **Note**: Already handled by existing persistence layer (no new code needed)

### Random Selection Server-Side (from research)
- **Issue**: Frontend random() not seeded, inconsistent results
- **Solution**: Backend does all selection with `import random; random.random()`
- **Reference**: CODEBASE-RESEARCH-PHASE4.md lines 1106-1109

### Trigger Condition Edge Cases (from codebase)
- **Issue**: Malformed conditions can crash parser
- **Solution**: Wrap parse_trigger_condition() in try/except, log warning, skip trigger
- **Reference**: CODEBASE-RESEARCH-PHASE4.md lines 1112-1116

### Fired Triggers Persistence (from codebase)
- **Issue**: Fired triggers must persist across case reload (don't reset)
- **Solution**: Store in PlayerState.inner_voice_state (saved to JSON)
- **Reference**: CODEBASE-RESEARCH-PHASE4.md lines 1110-1111

### Inline vs Modal Decision (from codebase research and user preference)
- **Issue**: Original research suggested toast notifications, but disconnected from conversation
- **Solution**: Inline conversation messages with skull icon + amber color
- **Rationale**: More immersive, preserves context, matches existing chat UI pattern
- **User Decision**: Confirmed inline approach (no "[GHOST - Read Only]" labels needed)
- **Reference**: CODEBASE-RESEARCH-PHASE4.md lines 1117-1119
- **Note**: Can add modal variant in Phase 4.5 if UX testing shows need

---

## Anti-Patterns to Avoid

**From project experience:**
- ❌ Breaking existing trigger parsing (witness secrets depend on parse_trigger_condition)
- ❌ Blocking investigation on Tom trigger errors (use try/catch, non-blocking)
- ❌ Mixing sync/async incorrectly (use async def for LLM calls, sync for YAML parsing)
- ❌ Not using template fallbacks for LLM calls (Tom is YAML-based, no LLM needed)
- ❌ Forgetting `model_dump(mode="json")` for datetime (use existing persistence patterns)
- ❌ Creating new files when existing can be extended (extend trust.py, don't create new parser)

---

## Validation

### Syntax & Style (Pre-commit)
```bash
cd backend
uv run ruff check .
uv run ruff format .
uv run mypy src/
# Expected: No errors (pre-existing 8 mypy warnings OK)

cd ../frontend
bun run lint
bun run type-check
# Expected: 0 errors (pre-existing 24 eslint warnings OK)
```

### Manual Verification (Optional)
```bash
# Backend test
cd backend
uv run uvicorn src.main:app --reload
# Test: POST /api/case/case_001/inner-voice/check with evidence_count=1,4,7
# Expected: Different tier triggers fire (tier 1, 2, 3 respectively)

# Frontend test
cd frontend
bun run dev
# Quick smoke test:
# 1. Discover 1 evidence → Tom toast appears (Tier 1)
# 2. Discover 3 more → Tom toast appears (Tier 2)
# 3. Discover 3 more → Tom toast appears (Tier 3)
# 4. Verify toast dismisses after 5s or click [Dismiss]
```

**Note**: validation-gates agent handles comprehensive testing. No need to specify test scenarios in PRP.

---

## Dependencies

**No new packages required** - reuse existing:
- random (Python stdlib)
- Pydantic (already installed)
- FastAPI (already installed)
- PyYAML (already installed)

**Configuration**:
- No new env vars needed
- No database migrations (JSON state storage)

---

## Out of Scope

- Dynamic LLM-based Tom responses (Phase 4 uses YAML templates only)
- Tom's voice during witness interrogation (Phase 4 only triggers on evidence discovery)
- Multiple Tom voices per evidence (Phase 4: one trigger per evidence count threshold)
- Tom's voice during verdict submission (separate Phase 4.5 enhancement)
- Marcus Bellweather storyline (seeds planted, resolved in Case 10)

---

## Effort Estimate

**Total**: 3-4 days (PLANNING.md estimate)

### Backend Tasks
- **Task 1-3** (Parser, State, Selection): 1 day
- **Task 4-6** (API, Models, Loader): 0.5 days
- **Task 7** (YAML authoring): 0.5 days
- **Backend Total**: 2 days

### Frontend Tasks
- **Task 8-9** (Message type, LocationView rendering): 0.25 days
- **Task 10-11** (Hook, Integration): 0.75 days
- **Task 12** (API client): 0.25 days
- **Frontend Total**: 1.25 days

### Testing & Polish
- **validation-gates**: 0.5 days (automated test creation + manual verification)
- **Buffer**: 0.25 days

**Total**: ~4 days (matches PLANNING.md estimate)

---

## Agent Orchestration Plan

### Execution Strategy

**Sequential Track** (dependencies):
1. `fastapi-specialist` → Backend implementation (Tasks 1-7: 2 days)
2. `react-vite-specialist` → Frontend implementation (Tasks 8-12: 1.25 days)
3. `validation-gates` → Run tests, create missing tests (0.5 days)
4. `documentation-manager` → Update docs (0.25 days)

**Why Sequential**: Frontend depends on backend API. Tests depend on all code complete.

### Agent-Specific Guidance

#### For fastapi-specialist
- **Input**: Tasks 1-7 (backend implementation)
- **Context**: Quick Reference section (no doc reading needed)
- **Pattern**: Extend existing trust.py parser, follow WitnessState structure for InnerVoiceState
- **Integration**: Add endpoint to routes.py after /briefing routes
- **Output**: Tom trigger system working (API returns triggers, state persists)

**Key Files to Reference**:
- `backend/src/utils/trust.py` (lines 86-207) - extend parse_trigger_condition()
- `backend/src/state/player_state.py` (lines 1-157) - follow BriefingState pattern
- `backend/src/api/routes.py` (lines 1174-1313) - follow briefing endpoint pattern
- `backend/src/case_store/case_001.yaml` (lines 354-387) - follow briefing YAML structure

**Critical**:
- Don't break existing witness secret parsing (test regression)
- Use `model_dump(mode="json")` for datetime serialization
- Backend handles all random selection (don't rely on frontend)

#### For react-vite-specialist
- **Input**: Tasks 8-12 (frontend implementation)
- **Context**: Quick Reference section (inline message rendering pattern)
- **Pattern**: Follow useBriefing.ts hook structure, extend LocationView message rendering
- **Integration**: Add checkTomTrigger() call in useInvestigation.ts after evidence discovery, append to conversation
- **Output**: Tom messages appear inline in conversation with skull icon + amber color

**Key Files to Reference**:
- `frontend/src/hooks/useBriefing.ts` - hook pattern for API calls + state
- `frontend/src/components/LocationView.tsx` - message rendering loop (extend for tom_ghost)
- `frontend/src/hooks/useInvestigation.ts` - integrate checkTomTrigger() call, add message to state

**Critical**:
- Skull icon (💀) + "TOM:" prefix visually distinguishes from narrator
- Amber color (text-amber-300/90) for ghost aesthetic
- Non-blocking async (don't block investigation on Tom errors)
- Messages persist in conversation (natural scroll with history)

#### For validation-gates
- **Input**: All code complete
- **Runs**: Tests, lint, type check, build
- **Output**: Pass/fail report
- **Note**: Creates tests if missing, learns patterns via TEST-FAILURES.md

#### For documentation-manager
- **Input**: Code complete, validation passed
- **Files changed**: List from "Files to Create/Modify" section
- **Output**: Updated README, docstrings added, STATUS.md updated

### Handoff Context

**Next agent receives**:
- This PRP (full context)
- Quick Reference (no doc reading needed)
- Specific task numbers
- Actual file paths to modify
- Pattern files to follow

**Next agent does NOT need**:
- ❌ Read research files (synthesized in Quick Reference)
- ❌ Search for examples (patterns provided)
- ❌ Read 5-10 docs (Quick Reference has code snippets)
- ❌ Explore codebase (integration points provided)

---

## Confidence Score

**10/10** - Likelihood of one-pass implementation success (boosted from 9/10 after UI simplification)

**Rationale**:
- ✅ All patterns proven in codebase (trigger parsing, state tracking, modal UI)
- ✅ GitHub research provides exact algorithms (tier priority, random selection)
- ✅ Docs research provides implementation-ready code (Pydantic models, message patterns)
- ✅ No new complex systems (extends existing patterns)
- ✅ Inline approach simpler than toast notifications (no new library)

**Confidence Boost**:
- +1 for removing react-hot-toast dependency (one less integration point)
- Inline messages reuse existing LocationView rendering (proven pattern)

---

**Generated**: 2026-01-08
**Source**: GITHUB-RESEARCH-PHASE4.md, CODEBASE-RESEARCH-PHASE4.md, DOCS-RESEARCH-PHASE4.md + project documentation
**Alignment**: Validated against PLANNING.md (lines 546-568), AUROR_ACADEMY_GAME_DESIGN.md (lines 745-879), CASE_DESIGN_GUIDE.md (lines 571-777)
