# Witness & Narrator LLM Research - Quick Summary

**Research Date**: 2026-01-09
**Full Report**: `/PRPs/WITNESS-NARRATOR-LLM-RESEARCH.md` (14 sections, 550+ lines)

---

## Key Findings

### 1. File Locations (Where Code Lives)

**Narrator LLM**:
- `/backend/src/context/narrator.py` (171 lines)
- Routes: `POST /api/investigate` → narrator.build_narrator_prompt()

**Witness LLM** (per-witness):
- `/backend/src/context/witness.py` (236 lines)
- Routes: `POST /api/interrogate` → witness.build_witness_prompt()

**Tom Ghost LLM** (global):
- `/backend/src/context/tom_llm.py` (431 lines)
- Routes: `POST /api/case/{case_id}/tom/auto-comment` + `POST /api/case/{case_id}/tom/chat`

**State Models**:
- `/backend/src/state/player_state.py` (400+ lines)
- WitnessState (lines 92-130): per-witness conversation_history ✅
- InnerVoiceState (lines 175-290): global Tom conversation_history
- PlayerState (lines 292-399): global narrator conversation_history

---

### 2. Conversation History Management (Current State)

| Component | Storage | Per-Entity? | Passed to LLM? | Can Avoid Repetition? |
|-----------|---------|------------|-------------|-------|
| **Narrator** | PlayerState.conversation_history[] | ❌ Global | ❌ NO | ❌ Will repeat |
| **Witness** | WitnessState.conversation_history[] | ✅ Per-witness | ✅ YES (last 5) | ✅ Won't repeat |
| **Tom** | InnerVoiceState.conversation_history[] | ❌ Global | ✅ YES (last 3) | ✅ Won't repeat |

**Key Discovery**: Witness has per-witness memory already implemented ✅

---

### 3. How Conversation History Flows to LLM

**Narrator**: ❌ NO history passed
```python
# routes.py line 403-411
prompt = build_narrator_prompt(
    location_desc,
    hidden_evidence,
    discovered_ids,
    not_present,
    player_input,
    surface_elements
    # ❌ NO conversation_history parameter
)
```

**Witness**: ✅ FULL history passed (last 5 exchanges)
```python
# routes.py line 769-773
prompt = build_witness_prompt(
    witness=witness,
    trust=witness_state.trust,
    discovered_evidence=state.discovered_evidence,
    conversation_history=witness_state.get_history_as_dicts(),  # ✅ Passed
    player_input=player_question
)
```

**Tom**: ✅ FULL history passed (last 3 exchanges)
```python
# routes.py line 1603-1604
prompt = build_context_prompt(
    case_context,
    evidence_discovered,
    conversation_history=inner_voice_state.conversation_history,  # ✅ Passed
    user_message=user_msg
)
```

---

### 4. Current Architecture

```
PlayerState
├── conversation_history: list  ← GLOBAL (all narrator/tom/player mixed, 20-msg limit)
├── witness_states: dict  ← PER-WITNESS ✅
│   └── "hermione": WitnessState
│       └── conversation_history: list  ← SEPARATE per witness ✅
├── inner_voice_state: InnerVoiceState
│   └── conversation_history: list  ← GLOBAL (all Tom comments mixed)
└── discovered_evidence: list
```

---

### 5. Is Separate Memory Per Witness/Narrator Possible?

#### Answer: YES ✅ - Both theoretically AND practically

**Evidence**:
1. WitnessState pattern already exists (per-witness memory works)
2. Format functions already exist (witness.py & tom_llm.py show how)
3. Prompt integration proven (witness shows correct pattern)
4. No data model conflicts

**For Narrator Memory Per Location**:
- ✅ Feasible: 1-2 days effort
- ✅ Can replicate WitnessState pattern
- ❌ Requires: Add NarratorLocationState to player_state.py
- ❌ Requires: Pass conversation_history to build_narrator_prompt()
- ✅ No breaking changes (backward compatible)

**For Tom Memory Per Witness**:
- ✅ Feasible: 1 day effort
- ⚠️ Lower priority (less impact)
- ✅ Could extend InnerVoiceState.witness_memories dict

---

### 6. What Would Need to Change

### Minimal Change: Add Narrator History (1 day, ~60 lines)

**Files to modify**: 2 files
1. `narrator.py` (add conversation_history parameter)
2. `routes.py` (pass narrator history to prompt)

**Step-by-step**:
1. Add `conversation_history: list[dict] | None = None` parameter to build_narrator_prompt()
2. Create format_narrator_conversation_history() function (copy witness.py pattern)
3. In routes.py investigate endpoint, load location-specific history
4. Pass to build_narrator_prompt()

### Medium Change: Full Separate Architecture (3 days)

Create NarratorLocationState similar to WitnessState:
```python
class NarratorLocationState(BaseModel):
    location_id: str
    conversation_history: list[dict] = []
    last_visited: datetime | None = None

    def add_response(self, text: str, timestamp: int) -> None: ...
    def get_last_n_exchanges(self, n: int = 3) -> list[dict]: ...

class PlayerState:
    narrator_states: dict[str, NarratorLocationState] = {}  # NEW
    witness_states: dict[str, WitnessState] = {}  # EXISTING ✅
```

---

### 7. Comparison: Witness Pattern vs Others

**Why Witness Works**: Has dedicated state class
```python
witness_state = state.get_witness_state(request.witness_id)
history = witness_state.get_history_as_dicts()
prompt = build_witness_prompt(..., conversation_history=history)
witness_state.add_conversation(question, response)
state.update_witness_state(witness_state)
```

**Why Narrator Doesn't**: No dedicated state class
```python
# ❌ No location-specific state loading
# ❌ No history passed to prompt
prompt = build_narrator_prompt(...)  # Missing conversation_history param
state.add_conversation_message("narrator", response)  # Global only
```

---

### 8. Feasibility Verdict

| Question | Answer | Evidence |
|----------|--------|----------|
| Is separate memory per witness possible? | ✅ YES | Already implemented for witnesses |
| Is separate memory per narrator location possible? | ✅ YES | Can replicate WitnessState pattern |
| What's the effort? | 1-3 days | Depend on scope (minimal vs full) |
| Would it break existing code? | ❌ NO | Can make conversation_history optional param |
| Would it fix repetition? | ✅ YES | Same as witness (avoids repeating info) |
| Should we do it? | ⚠️ MAYBE | Narrator repetition is issue, but lower priority than other features |

**Recommended Priority**: Phase 4.5-5 (after current UI/UX polish)

---

### 9. Quick Technical Checklist

If implementing narrator per-location memory:

- [ ] Create NarratorLocationState class (player_state.py)
- [ ] Add narrator_states: dict to PlayerState
- [ ] Add format_narrator_conversation_history() to narrator.py
- [ ] Update build_narrator_prompt() to accept conversation_history param
- [ ] Update routes.py investigate endpoint:
  - [ ] Load NarratorLocationState for current location
  - [ ] Pass conversation_history to build_narrator_prompt()
  - [ ] Save response to narrator_states[location_id]
- [ ] Add helper: PlayerState.get_narrator_state()
- [ ] Write tests (20+ cases)

---

### 10. Data Structure Examples

**Current Witness Memory** (working):
```python
state.witness_states["hermione_granger"].conversation_history = [
    ConversationItem(question="Where were you?", response="In library", trust_delta=5),
    ConversationItem(question="Did you see anything?", response="...", trust_delta=0),
]
# Passed to prompt: last 5 exchanges
```

**Proposed Narrator Memory** (what we'd add):
```python
state.narrator_states["library"].conversation_history = [
    {type: "narrator", text: "You notice frost...", timestamp: 1234567890},
    {type: "narrator", text: "Evidence revealed...", timestamp: 1234567891},
]
# Would be passed to prompt: last 3 exchanges
```

---

### 11. Related Frontend Components

If implementing narrator memory, frontend should:
- Display location-specific conversation history (optional)
- Filter messages by location in LocationView
- useInvestigation hook could restore per-location history

Current state (Phase 4.4): All narrator messages mixed in global conversation_history

---

### 12. Risk Assessment

**Low Risk**:
- Pattern already proven (WitnessState exists)
- Can be backward compatible (make history param optional)
- No breaking API changes needed
- Isolated to 2-3 files

**Medium Risk**:
- Migration path for old saves (one-time)
- Need comprehensive tests (20+ cases)
- Frontend may need updates for UX

**No Risk Areas**:
- Other LLM contexts (already working)
- Investigation logic (unchanged)
- Verdict system (unchanged)

---

## Full Report Contents

The comprehensive research document (`WITNESS-NARRATOR-LLM-RESEARCH.md`) contains:

1. Executive Summary (current state overview)
2. File Locations & Architecture (all files listed with line numbers)
3. Conversation History Management (where it's stored)
4. History Passing to Prompts (what LLMs see)
5. Feasibility Analysis (theoretical + practical)
6. Current Architecture Overview (data flow diagrams)
7. Code Patterns & Integration Points (reusable patterns)
8. Required Changes (detailed implementation plan)
9. Witness vs Narrator vs Tom Comparison (side-by-side)
10. Data Structure Details (exact class definitions)
11. Integration Points Summary (where changes go)
12. Feasibility Verdict (final recommendation)
13. Technical Implementation Checklist (step-by-step)
14. Conclusion & Appendix (summary + references)

---

## Quick Navigation to Files

**To implement narrator per-location memory**, you'd modify:

1. `/backend/src/state/player_state.py` - Add NarratorLocationState class + narrator_states dict
2. `/backend/src/context/narrator.py` - Add conversation_history param + format function
3. `/backend/src/api/routes.py` - Update investigate endpoint (~30 lines change)

**Reference patterns from**:
- `/backend/src/state/player_state.py` lines 92-130 (WitnessState template)
- `/backend/src/context/witness.py` lines 54-75 (format_conversation_history pattern)
- `/backend/src/api/routes.py` lines 748-808 (witness integration pattern)

---

**Research Confidence**: 95% - Based on direct code analysis
**Report Date**: 2026-01-09
**Total Research Time**: ~1 hour
