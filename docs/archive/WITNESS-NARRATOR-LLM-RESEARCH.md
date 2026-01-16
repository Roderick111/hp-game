# Witness & Narrator LLM Implementation Research

**Date**: 2026-01-09
**Research Scope**: Backend LLM context builders, conversation memory management, architecture feasibility for separate memory per witness/narrator

---

## Executive Summary

### Current Architecture

**Narrator System** (Isolated):
- File: `/backend/src/context/narrator.py` (171 lines)
- Integration: Routes POST `/api/investigate` → narrator.build_narrator_prompt()
- Conversation Memory: **NOT STORED** per narrator
- State: Single conversation_history array in PlayerState (all messages mixed)

**Witness System** (Isolated per witness):
- File: `/backend/src/context/witness.py` (236 lines)
- Integration: Routes POST `/api/interrogate` → witness.build_witness_prompt()
- Conversation Memory: **PER-WITNESS** in WitnessState.conversation_history
- State: `witness_states: dict[str, WitnessState]` in PlayerState

**Key Finding**: Witness already has per-witness conversation memory. Narrator does NOT. Separating narrator memory per witness would require architectural changes.

### Conversation Memory Current State

```
PlayerState {
  conversation_history: list[dict]  # MIXED: player/narrator/tom (20-msg limit)
  witness_states: {
    witness_id_1: WitnessState {
      conversation_history: list[ConversationItem]  # SEPARATE per witness ✅
    },
    witness_id_2: WitnessState { ... }
  }
}
```

**Status**: Partially separate. Witness memory = isolated per witness. Narrator memory = global mixed.

---

## 1. File Locations & Architecture

### Backend Context Builder Files

**Narrator**: `/backend/src/context/narrator.py` (171 lines)
- Lines 10-43: format_hidden_evidence(), format_not_present(), format_surface_elements()
- Lines 83-148: build_narrator_prompt() - **NO conversation history parameter**
- Lines 150-171: build_system_prompt()

**Witness**: `/backend/src/context/witness.py` (236 lines)
- Lines 14-27: format_knowledge()
- Lines 29-52: format_secrets_for_prompt()
- Lines 54-75: format_conversation_history() - **Takes conversation_history param** ✅
- Lines 77-95: format_lie_topics()
- Lines 97-112: get_trust_behavior_text()
- Lines 114-203: build_witness_prompt() - **Includes conversation_history param at line 118**
- Lines 206-236: build_witness_system_prompt()

**Tom (LLM Ghost)**: `/backend/src/context/tom_llm.py` (431 lines)
- Lines 213-243: format_tom_conversation_history() - **Formats last 3 exchanges**
- Lines 245-312: build_context_prompt() - **Takes conversation_history param**
- Lines 315-386: generate_tom_response() - **Async LLM call with history**

**Mentor (Feedback)**: `/backend/src/context/mentor.py` (537 lines)
- Lines 234-322: build_moody_roast_prompt() - NO conversation history
- Lines 325-406: build_moody_praise_prompt() - NO conversation history
- Lines 409-497: build_moody_feedback_llm() - NO conversation history (LLM-based)

### API Routes Integration

**File**: `/backend/src/api/routes.py` (1600+ lines)

**Narrator Integration** (Lines 337-448):
- POST /api/investigate endpoint
- Lines 403-411: `prompt = build_narrator_prompt(...)` - **NO conversation_history passed**
- Lines 417-440: LLM call → response → save message
- Line 440: `state.add_conversation_message("narrator", narrator_response)`

**Witness Integration** (Lines 716-895):
- POST /api/interrogate endpoint (Lines 716-820)
- Lines 748-750: `witness_state = state.get_witness_state(request.witness_id, base_trust)`
- Lines 757-760: Pass witness_state to context builder
- Lines 769-773: `prompt = build_witness_prompt(witness=witness, trust=witness_state.trust, discovered_evidence=state.discovered_evidence, conversation_history=witness_state.get_history_as_dicts())`
- Lines 801-808: Save to witness_state.add_conversation()

**Tom Integration** (Lines 1550-1692):
- POST /api/case/{case_id}/tom/auto-comment (Lines 1550-1616)
- POST /api/case/{case_id}/tom/chat (Lines 1650-1702)
- Lines 1603-1604: Pass conversation_history from inner_voice_state
- Lines 1690-1692: Save response via add_tom_comment()

### State Models

**File**: `/backend/src/state/player_state.py` (400+ lines)

**WitnessState** (Lines 92-130):
- witness_id: str
- trust: int (0-100)
- conversation_history: list[ConversationItem] ✅
- secrets_revealed: list[str]
- Methods: add_conversation(), reveal_secret(), adjust_trust(), get_history_as_dicts()

**InnerVoiceState** (Lines 175-290):
- case_id: str
- conversation_history: list[dict] ✅
- trust_level: float (0.0-1.0)
- cases_completed: int
- Methods: add_tom_comment(), get_trust_percentage()

**PlayerState** (Lines 292-399):
- case_id: str
- current_location: str
- discovered_evidence: list[str]
- **conversation_history: list[dict]** - **GLOBAL** (all narrator/tom mixed)
- witness_states: dict[str, WitnessState] - **SEPARATE per witness** ✅
- inner_voice_state: InnerVoiceState - **GLOBAL** (Tom's history)
- briefing_state: BriefingState
- Methods: add_conversation_message(), get_witness_state(), get_inner_voice_state()

---

## 2. Conversation History Management

### Current Storage Locations

**Witness Conversation** (SEPARATE per witness):
```python
# In witness_states dict
player_state.witness_states["hermione_granger"].conversation_history = [
  ConversationItem(question="Where were you?", response="In library", trust_delta=5),
  ConversationItem(question="Did you see anything?", response="...", trust_delta=0),
]

# Retrieved for prompt
witness_state.get_history_as_dicts()  # Returns list[{"question": str, "response": str}]
```

**Narrator Conversation** (MIXED in global):
```python
# In conversation_history array (20-msg limit)
player_state.conversation_history = [
  {"type": "player", "text": "examine desk", "timestamp": ...},
  {"type": "narrator", "text": "You find...", "timestamp": ...},
  {"type": "narrator", "text": "Another discovery...", "timestamp": ...},
]
```

**Tom Conversation** (MIXED in inner_voice):
```python
# In inner_voice_state
player_state.inner_voice_state.conversation_history = [
  {"user": "Tom, what do you think?", "tom": "Consider...", "timestamp": ...},
  {"user": "[auto-comment]", "tom": "Be careful...", "timestamp": ...},
]
```

### How History is Passed to LLM

**Narrator**: ❌ NO history passed
- Routes.py line 403-411: build_narrator_prompt() called WITHOUT conversation_history
- Function signature (narrator.py:83): `build_narrator_prompt(location_desc, hidden_evidence, discovered_ids, not_present, player_input, surface_elements)`
- **Result**: Narrator doesn't know previous responses, repeats info

**Witness**: ✅ FULL history passed (last 5 exchanges)
- Routes.py line 773: `build_witness_prompt(..., conversation_history=witness_state.get_history_as_dicts())`
- Function signature (witness.py:114): includes `conversation_history: list[dict[str, Any]]`
- Witness.py line 151: Passes to format_conversation_history()
- Format function (witness.py:54): Takes `history[-5:]` (last 5 exchanges)
- **Result**: Witness avoids repetition, builds on context

**Tom**: ✅ FULL history passed (last 3 exchanges)
- Routes.py line 1603-1604: `inner_voice_state.conversation_history` passed
- Tom_llm.py line 246-312: build_context_prompt() includes conversation_history param
- Tom_llm.py line 282: `history_str = format_tom_conversation_history(conversation_history)`
- Format function (tom_llm.py:213): Takes `history[-3:]` (last 3 exchanges)
- **Result**: Tom avoids repetition, remembers case-specific details

### Storage Format Comparison

| Component | Storage Model | Per-Entity? | Format | Limit | Prompt Included? |
|-----------|---------------|------------|--------|-------|-----------------|
| **Narrator** | PlayerState.conversation_history | ❌ Global | {type, text, timestamp} | 20 msgs | ❌ NO |
| **Witness** | WitnessState.conversation_history | ✅ Per-witness | {question, response, timestamp} | Unlimited* | ✅ YES (last 5) |
| **Tom** | InnerVoiceState.conversation_history | ❌ Global | {user, tom, timestamp} | Unlimited* | ✅ YES (last 3) |

*No explicit limit, but cleaned up periodically

---

## 3. Conversation History Passing to Prompts

### Narrator Context (Current)

```python
# NARRATOR: NO conversation history
# narrator.py:83-147
def build_narrator_prompt(
    location_desc: str,
    hidden_evidence: list[dict],
    discovered_ids: list[str],
    not_present: list[dict],
    player_input: str,
    surface_elements: list[str] | None = None,
) -> str:
    # ... formats evidence, not_present, surface_elements
    # NO history parameter or variable
    # Result: prompt has no previous responses
```

**Consequence**: If player asks about same location twice, narrator might:
- Repeat the same description
- Forget what was already discovered
- Hallucinate different details

### Witness Context (Current)

```python
# WITNESS: FULL conversation history
# witness.py:114-203
def build_witness_prompt(
    witness: dict,
    trust: int,
    discovered_evidence: list[str],
    conversation_history: list[dict[str, Any]],  # ✅ Included
    player_input: str,
) -> str:
    # ...
    history_text = format_conversation_history(conversation_history)
    # Included in prompt template at line 182
    # "== CONVERSATION HISTORY == {history_text}"
    # Result: witness knows previous exchanges, avoids repetition
```

**Integration in prompt** (witness.py:182):
```
== CONVERSATION HISTORY ==
{history_text}

== CRITICAL RULES (DO NOT VIOLATE) ==
1. You are {name} - stay in character at ALL times
```

### Tom Context (Current)

```python
# TOM: FULL conversation history
# tom_llm.py:245-312
def build_context_prompt(
    case_context: dict,
    evidence_discovered: list,
    conversation_history: list[dict[str, str]],  # ✅ Included
    user_message: str | None = None,
) -> str:
    history_str = format_tom_conversation_history(conversation_history)
    context = f"""...
RECENT CONVERSATION (avoid repetition, build on previous exchanges):
{history_str}
"""
    # Explicitly tells Tom to avoid repetition and build on context
```

---

## 4. Feasibility Analysis: Separate Memory Per Entity

### Current State Summary

```
✅ = Feasible/Implemented
❌ = Would require changes
⚠️  = Partially implemented
```

| Feature | Narrator | Witness | Tom | Effort |
|---------|----------|---------|-----|--------|
| **Separate per entity** | ❌ (global) | ✅ (per-witness) | ❌ (global) | HIGH |
| **Conversation history storage** | ⚠️ (exists but unused) | ✅ (full) | ⚠️ (exists) | LOW |
| **History passed to LLM** | ❌ (NO) | ✅ (YES) | ✅ (YES) | MEDIUM |
| **Format function exists** | ❌ (NO) | ✅ (YES) | ✅ (YES) | LOW |
| **Avoids repetition** | ❌ (will repeat) | ✅ (won't repeat) | ✅ (won't repeat) | - |

### Option 1: Separate Narrator Memory Per Location (HIGH effort)

**Proposed Structure**:
```python
class NarratorLocationState(BaseModel):
    location_id: str
    conversation_history: list[ConversationItem]
    last_visited: datetime

class PlayerState:
    narrator_states: dict[str, NarratorLocationState]  # location_id -> history
```

**Changes Required**:
1. Add narrator_states dict to PlayerState (player_state.py)
2. Update build_narrator_prompt() to accept conversation_history (narrator.py:83)
3. Update routes.py interrogate to pass history
4. Add format_narrator_conversation_history() function (narrator.py)
5. Update all narrator calls to pass location-specific history

**Files to modify**: 4 files (player_state.py, narrator.py, routes.py, + tests)
**Lines of code**: ~150 lines new/modified
**Breaking changes**: API signatures change (minor), data model changes (minor)

### Option 2: Separate Tom Memory Per Witness (MEDIUM effort)

**Currently**: Tom's history is global (all investigations mixed)
**Proposed**: Per-witness Tom reactions

```python
class InnerVoiceState:
    witness_memories: dict[str, list[dict]]  # witness_id -> Tom's past comments on that witness
```

**Changes Required**:
1. Modify InnerVoiceState to track per-witness Tom history
2. Update generate_tom_response() to accept witness_id parameter
3. Update routes POST /api/interrogate to pass witness context to Tom
4. Update format_tom_conversation_history() to filter by witness

**Files to modify**: 3 files (player_state.py, tom_llm.py, routes.py + tests)
**Lines of code**: ~80 lines new/modified
**Breaking changes**: None (backward compatible)

### Option 3: Unified Conversation Model (HIGHEST effort, best UX)

**Goal**: Single conversation_history with metadata for each message

```python
class ConversationMessage(BaseModel):
    """Unified conversation message across all entities."""
    type: str  # "narrator", "witness", "tom", "player"
    speaker_id: str | None  # witness_id for witness messages, None for narrator/tom
    location_id: str | None  # location for narrator messages
    text: str
    timestamp: datetime
    metadata: dict  # context-specific data

class PlayerState:
    unified_conversation_history: list[ConversationMessage]
```

**Benefits**:
- Single source of truth
- Easy to query per-entity conversations
- Chronological investigation log
- Better for frontend display

**Drawbacks**:
- Large refactor (affects 20+ functions)
- Breaking API changes
- Migration path needed for existing saves

**Files to modify**: 8+ files (player_state.py, routes.py, narrator.py, witness.py, tom_llm.py, + frontend)
**Lines of code**: ~300+ lines new/modified
**Timeline**: 2-3 days

---

## 5. Is Separate Memory Per Witness/Narrator Possible?

### Theoretical Feasibility: YES ✅

**Evidence**:
1. **Witness structure exists**: WitnessState already implements per-witness history (lines 92-130 player_state.py)
2. **Format functions exist**: Both witness.py and tom_llm.py have history formatting functions
3. **Prompt integration proven**: witness.py shows how to pass history to LLM prompts
4. **Storage pattern established**: PlayerState.witness_states dict pattern can be replicated

### Practical Feasibility Analysis

**Per-Witness Narrator Memory**:
- ✅ Storage: Add `narrator_states: dict[str, NarratorState]`
- ✅ Retrieval: Location-based key lookup
- ⚠️ Prompt integration: Requires modifying build_narrator_prompt() signature
- ⚠️ Routes: Requires passing location context to prompt builder
- **Verdict**: FEASIBLE (3-4 days effort)

**Per-Witness Tom Memory**:
- ✅ Storage: Extend InnerVoiceState to track witness-specific comments
- ✅ Retrieval: Dict lookup by witness_id
- ✅ Prompt integration: format_tom_conversation_history() already flexible
- ⚠️ Routes: Requires witness_id context when generating Tom responses
- **Verdict**: FEASIBLE (1-2 days effort)

**Data Migration Required**: Old saves with global histories need conversion (one-time migration)

---

## 6. Current Architecture Overview

### Context Flow for Each Entity

**Narrator Investigation** (locations/general):
```
Frontend (player input)
  ↓
Routes POST /api/investigate
  ↓
build_narrator_prompt(location_desc, hidden_evidence, discovered_ids, not_present, player_input, surface_elements)
  ↓ [NO CONVERSATION HISTORY]
Claude Haiku (system prompt + user prompt)
  ↓
Save to: PlayerState.conversation_history[] (mixed with all narrator/tom)
```

**Witness Interrogation**:
```
Frontend (question to specific witness)
  ↓
Routes POST /api/interrogate
  ↓
Load: PlayerState.witness_states["witness_id"]
  ↓
build_witness_prompt(witness, trust, discovered_evidence, conversation_history ✅, player_input)
  ↓
Claude Haiku (system prompt + user prompt)
  ↓
Save to: WitnessState.conversation_history[] (SEPARATE per witness)
```

**Tom Ghost Comments**:
```
Frontend (evidence discovered OR direct "Tom, ..." question)
  ↓
Routes POST /api/case/{case_id}/tom/auto-comment OR tom/chat
  ↓
Load: PlayerState.inner_voice_state
  ↓
build_context_prompt(case_context, evidence_discovered, conversation_history ✅, user_message)
  ↓
Claude Haiku (system prompt + user prompt)
  ↓
Save to: InnerVoiceState.conversation_history[] (GLOBAL, not per-witness)
```

### Data Flow Diagram

```
PlayerState
├── conversation_history: list (20 msgs)  ← Mixed narrator/tom/player
│   └── type: "narrator" | "tom" | "player"
├── witness_states: dict
│   └── "hermione_granger": WitnessState
│       └── conversation_history: list  ← SEPARATE per witness ✅
│           └── {question, response, timestamp}
├── inner_voice_state: InnerVoiceState
│   └── conversation_history: list  ← Global Tom history
│       └── {user, tom, timestamp}
└── discovered_evidence: list
    └── ["frost_window_1", "wand_trace_2", ...]
```

---

## 7. Code Patterns & Integration Points

### Pattern 1: Witness State Isolation (Current Best Practice)

**Pattern** (witness.py + routes.py):
```python
# Step 1: Get witness-specific state
witness_state = state.get_witness_state(request.witness_id, base_trust)

# Step 2: Extract conversation history
history = witness_state.get_history_as_dicts()

# Step 3: Pass to prompt builder
prompt = build_witness_prompt(
    witness=witness,
    trust=witness_state.trust,
    discovered_evidence=state.discovered_evidence,
    conversation_history=history,  # ✅ Per-witness
    player_input=request.question,
)

# Step 4: Save response back to witness state
witness_state.add_conversation(question, response, trust_delta)
state.update_witness_state(witness_state)
```

**Locations**:
- Routes: /backend/src/api/routes.py lines 748-808
- State: /backend/src/state/player_state.py lines 92-130
- Context: /backend/src/context/witness.py lines 114-203

### Pattern 2: Tom Global History (Different Pattern)

```python
# Get global inner voice state
inner_voice_state = state.get_inner_voice_state()

# Pass entire conversation history (not per-witness)
prompt = build_context_prompt(
    case_context=case_context,
    evidence_discovered=evidence,
    conversation_history=inner_voice_state.conversation_history,  # GLOBAL
    user_message=user_msg,
)

# Add response
inner_voice_state.add_tom_comment(user_msg, response)
```

**Locations**:
- Routes: /backend/src/api/routes.py lines 1550-1692
- State: /backend/src/state/player_state.py lines 175-290
- Context: /backend/src/context/tom_llm.py lines 245-312

### Pattern 3: Narrator No History (Gap to Fill)

```python
# ❌ No state loading for narrator

# ❌ No conversation history passed
prompt = build_narrator_prompt(
    location_desc=location.get("description", ""),
    hidden_evidence=location.get("hidden_evidence", []),
    discovered_ids=state.discovered_evidence,
    not_present=location.get("not_present", []),
    player_input=request.player_input,
    surface_elements=location.get("surface_elements", []),
    # ❌ conversation_history NOT included
)

# Save response but no location context
state.add_conversation_message("narrator", narrator_response)
```

**Location**: /backend/src/api/routes.py lines 337-448

---

## 8. Required Changes to Support Separate Memory

### Minimal Change: Add Narrator History (1 day)

**Files to modify**: 2 files, ~60 lines

1. **narrator.py** (add param):
```python
def build_narrator_prompt(
    location_desc: str,
    hidden_evidence: list[dict],
    discovered_ids: list[str],
    not_present: list[dict],
    player_input: str,
    surface_elements: list[str] | None = None,
    conversation_history: list[dict] | None = None,  # NEW
) -> str:
    # Format history similar to witness.py lines 54-75
    history_text = format_narrator_conversation_history(conversation_history or [])
    # Include in prompt template
```

2. **routes.py** (pass history):
```python
# Line 403-411: Load location-specific history
narrator_history = get_location_narrator_history(state, location_id)  # NEW

prompt = build_narrator_prompt(
    ...,
    conversation_history=narrator_history,  # NEW
)
```

3. **player_state.py** (add tracking):
```python
class PlayerState:
    narrator_location_history: dict[str, list[dict]] = {}  # NEW
```

### Medium Change: Full Separate Architecture (3 days)

Add dedicated NarratorLocationState similar to WitnessState:
- New class: NarratorLocationState in player_state.py (lines 92-130 as template)
- New dict: PlayerState.narrator_states = {location_id: NarratorLocationState}
- Update routes to use per-location state pattern
- Add tests (20+ test cases)

### Breaking Changes Analysis

**NONE if done incrementally**:
- Can add conversation_history parameter as optional (default None)
- New narrator_states dict alongside existing conversation_history
- Old saves work fine (use fallback to empty history)
- Backward compatible API endpoints

---

## 9. Witness vs Narrator vs Tom Comparison

| Aspect | Witness | Narrator | Tom |
|--------|---------|----------|-----|
| **Memory Type** | Per-witness ✅ | Global ❌ | Global ❌ |
| **Storage Location** | witness_states dict | conversation_history array | inner_voice_state |
| **History Passed to LLM** | YES ✅ (last 5) | NO ❌ | YES ✅ (last 3) |
| **Conversation Format** | {question, response} | {type, text, timestamp} | {user, tom} |
| **Format Function** | format_conversation_history() | (missing) | format_tom_conversation_history() |
| **Avoids Repetition** | YES ✅ | NO ❌ | YES ✅ |
| **Context Isolation** | YES ✅ | YES ✅ | NO ❌ (sees all) |
| **Can Reference Previous** | YES ✅ | NO ❌ | YES ✅ |
| **Example Response** | "As I said before, I was in library" | "You can see frost on window" (repeated) | "Like Case #1, you're assuming too much" |

---

## 10. Data Structure Details

### WitnessState (Template for Narrator Separation)

```python
class ConversationItem(BaseModel):
    question: str
    response: str
    timestamp: datetime
    trust_delta: int = 0

class WitnessState(BaseModel):
    witness_id: str
    trust: int
    conversation_history: list[ConversationItem] = []
    secrets_revealed: list[str] = []

    def add_conversation(self, question: str, response: str, trust_delta: int = 0) -> None:
        self.conversation_history.append(ConversationItem(...))

    def get_history_as_dicts(self) -> list[dict]:
        return [{"question": item.question, "response": item.response}
                for item in self.conversation_history]
```

**Location**: /backend/src/state/player_state.py lines 23-130

### How to Replicate for Narrator

```python
class NarratorLocationState(BaseModel):
    """Separate conversation history per location."""
    location_id: str
    conversation_history: list[dict] = []  # [{type, text, timestamp}]
    discovered_evidence_count: int = 0  # For context
    last_visited: datetime | None = None

    def add_response(self, text: str, timestamp: int) -> None:
        self.conversation_history.append({
            "type": "narrator",
            "text": text,
            "timestamp": timestamp,
        })

    def get_last_n_exchanges(self, n: int = 3) -> list[dict]:
        return self.conversation_history[-n:]
```

### Where to Add

In PlayerState (player_state.py line 292+):
```python
class PlayerState(BaseModel):
    # ... existing fields ...
    narrator_states: dict[str, NarratorLocationState] = {}  # NEW: location_id -> history
    witness_states: dict[str, WitnessState] = {}  # EXISTING: witness_id -> history
    inner_voice_state: InnerVoiceState | None = None
```

---

## 11. Integration Points Summary

### Where Changes Would Be Made

**Backend Context Builders**:
1. `narrator.py` - Add conversation_history parameter (line 83)
2. `witness.py` - Already integrated ✅
3. `tom_llm.py` - Already integrated ✅

**Routes/API**:
1. `routes.py` investigate endpoint (lines 337-448) - Load/pass narrator history
2. `routes.py` interrogate endpoint (lines 716-820) - Already correct ✅
3. `routes.py` tom endpoints (lines 1550-1692) - Already correct ✅

**State Management**:
1. `player_state.py` - Add narrator_states dict (line 292+)
2. `player_state.py` - Add NarratorLocationState class (new)

**Frontend** (optional for Phase 4.4+):
1. `LocationView.tsx` - Display location-specific conversation history
2. `useInvestigation.ts` - Filter narrator messages by location

---

## 12. Feasibility Verdict

### For Separate Narrator Memory Per Location

**Theoretical**: ✅ YES - Fully possible
**Practical**: ✅ YES - 1-2 days effort
**Breaking Changes**: ❌ NO - Can be backward compatible
**Recommended Priority**: MEDIUM (Phase 5+)

**Reason**: Current narrator repetition (due to no history) is noticeable in testing. Witness and Tom don't repeat because they have memory. Narrator should too.

### For Separate Tom Memory Per Witness

**Theoretical**: ✅ YES - Fully possible
**Practical**: ✅ YES - 1 day effort
**Breaking Changes**: ❌ NO - Can be backward compatible
**Recommended Priority**: LOW (Phase 4.5+)

**Reason**: Would require Tom to understand witness-specific context. Nice-to-have but lower impact.

### Implementation Approach

**Recommended**: Do narrator memory first (faster, solves repetition problem)

1. **Phase 4.5a** (1 day): Add narrator location history
   - Add NarratorLocationState to player_state.py
   - Update narrator.py to accept conversation_history
   - Update routes.py investigate endpoint
   - Add 15 tests

2. **Phase 4.5b** (1 day): Refine Tom per-witness context
   - Update InnerVoiceState for per-witness tracking (optional)
   - Update generate_tom_response() signature
   - 10 tests

3. **Phase 5+**: Consider unified conversation model
   - Larger refactor but better long-term UX

---

## 13. Technical Implementation Checklist

### For Narrator Location Memory

- [ ] Create NarratorLocationState class (player_state.py)
- [ ] Add narrator_states dict to PlayerState
- [ ] Add format_narrator_conversation_history() to narrator.py
- [ ] Update build_narrator_prompt() signature to accept conversation_history
- [ ] Update routes.py investigate to:
  - [ ] Load or create NarratorLocationState
  - [ ] Pass conversation_history to build_narrator_prompt()
  - [ ] Save response to narrator_states[location_id]
- [ ] Add get_narrator_state() helper to PlayerState
- [ ] Update tests (20+ cases)
- [ ] Update frontend if needed (optional)

### For Tom Per-Witness Context

- [ ] Update InnerVoiceState to track witness-specific context (dict[witness_id])
- [ ] Update generate_tom_response() to accept witness_id param
- [ ] Update routes.py to pass witness context when available
- [ ] Update format_tom_conversation_history() to filter by witness
- [ ] Add 10 tests

---

## 14. Conclusion

**Summary**:
- Witness already has per-witness memory ✅
- Narrator has NO history (global messages) ❌
- Tom has global history (not per-witness) ⚠️

**Key Finding**: Separate memory per entity is architecturally possible and partially already implemented. The witness pattern (WitnessState + conversation_history per ID) can be directly copied for narrator locations.

**Recommendation**: Implement narrator location-specific history in Phase 4.5-5 to fix repetition issue. Tom per-witness is lower priority but could follow same pattern.

**Effort**:
- Narrator memory: 1-2 days
- Tom per-witness: 1 day
- Unified model: 2-3 days

**Files Required**:
- player_state.py (add class + dict)
- narrator.py (add param + format function)
- routes.py (update 1 endpoint)
- tests (20+ cases)

---

## Appendix: Code References

### File Paths
- Narrator: `/backend/src/context/narrator.py` (171 lines)
- Witness: `/backend/src/context/witness.py` (236 lines)
- Tom: `/backend/src/context/tom_llm.py` (431 lines)
- Mentor: `/backend/src/context/mentor.py` (537 lines)
- Routes: `/backend/src/api/routes.py` (1600+ lines)
- State: `/backend/src/state/player_state.py` (400+ lines)

### Key Line Numbers
- Narrator integration: routes.py 337-448
- Witness integration: routes.py 716-895
- Tom integration: routes.py 1550-1692
- Witness state: player_state.py 92-130
- Tom state: player_state.py 175-290
- Player state: player_state.py 292-399

### Key Functions
- witness.py:54 - format_conversation_history()
- witness.py:114 - build_witness_prompt()
- tom_llm.py:213 - format_tom_conversation_history()
- tom_llm.py:245 - build_context_prompt()
- narrator.py:83 - build_narrator_prompt() (needs update)
- routes.py:769 - witness prompt call (correct pattern)
- routes.py:403 - narrator prompt call (missing history)

---

**Research Complete**: 2026-01-09
**Confidence Level**: HIGH (95%) - Based on code analysis + existing patterns
**Ready for**: Phase 4.5+ implementation planning
