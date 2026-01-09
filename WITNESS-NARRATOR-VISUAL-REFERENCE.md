# Visual Reference: Witness vs Narrator vs Tom Architecture

---

## Current Data Flow

### Narrator Investigation Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend: Player types "examine frost on window"            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ routes.py POST /api/investigate (line 337)                  │
│ - Load case & location                                      │
│ - Build narrator prompt (❌ NO HISTORY)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ narrator.py build_narrator_prompt() (line 83)               │
│ Parameters:                                                 │
│   - location_desc: "Hogwarts Library..."                    │
│   - hidden_evidence: [{id: "frost_pattern", triggers: [...]}│
│   - discovered_ids: ["surface_dust"]                        │
│   - not_present: [...]                                      │
│   - player_input: "examine frost on window"                 │
│   - surface_elements: ["desk", "window", "books"]           │
│   ❌ conversation_history: MISSING                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Claude Haiku LLM                                            │
│ System: "You are immersive narrator..."                     │
│ User: "== CURRENT LOCATION ==..."                           │
│       "== PLAYER ACTION == examine frost on window"         │
│                                                             │
│ Result: "You notice frost patterns on the window..."        │
│ ❌ Doesn't know it already described frost before           │
│ ❌ May repeat same details                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ routes.py (line 440)                                        │
│ state.add_conversation_message("narrator", response)        │
│                                                             │
│ Saved to: PlayerState.conversation_history[] (GLOBAL)       │
│           [20-message limit, all messages mixed]            │
└─────────────────────────────────────────────────────────────┘
```

---

### Witness Interrogation Flow (Correct Pattern)

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend: Player asks Hermione "Where were you?"            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ routes.py POST /api/interrogate (line 716)                  │
│ - Load case & witness data                                  │
│ - Get witness state (PER-WITNESS) ✅                        │
│   witness_state = state.get_witness_state("hermione", 50)   │
│ - Extract conversation history                             │
│   history = witness_state.get_history_as_dicts()            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ witness.py build_witness_prompt() (line 114)                │
│ Parameters:                                                 │
│   - witness: {name: "Hermione", personality: "...", ...}    │
│   - trust: 50 (PER-WITNESS) ✅                              │
│   - discovered_evidence: ["frost_pattern", ...]             │
│   - conversation_history: [                                 │
│       {question: "Where were you?", response: "..."},       │
│       {question: "What did you see?", response: "..."}      │
│     ] ✅ FULL HISTORY PASSED                                │
│   - player_input: "Where were you?"                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Claude Haiku LLM                                            │
│ System: "You are Hermione Granger..."                       │
│ User: "== CONVERSATION HISTORY ==                           │
│        Player: Where were you?                              │
│        You: In the library studying...                      │
│        ✅ Knows previous exchanges                          │
│        ✅ Won't repeat same response                        │
│        ✅ Can reference prior context                       │
│                                                             │
│ Result: "As I said, I was in the library, but..."           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ routes.py (line 801)                                        │
│ witness_state.add_conversation(question, response)          │
│ state.update_witness_state(witness_state)                   │
│                                                             │
│ Saved to: PlayerState.witness_states["hermione"]            │
│           .conversation_history[] (PER-WITNESS) ✅           │
└─────────────────────────────────────────────────────────────┘
```

---

### Tom Ghost Comment Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend: Evidence discovered OR "Tom, what do you think?"   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ routes.py POST /api/case/{case_id}/tom/auto-comment         │
│         or POST /api/case/{case_id}/tom/chat                │
│ - Load inner_voice_state (GLOBAL)                           │
│   inner_voice_state = state.get_inner_voice_state()         │
│ - Extract conversation history (GLOBAL, not per-witness)    │
│   history = inner_voice_state.conversation_history          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ tom_llm.py build_context_prompt() (line 245)                │
│ Parameters:                                                 │
│   - case_context: {victim: "...", location: "...", ...}     │
│   - evidence_discovered: [{name: "frost", description}...]  │
│   - trust_level: 0.0-1.0                                    │
│   - conversation_history: [                                 │
│       {user: "Tom, what about alibi?", tom: "Check..."},    │
│       {user: "[auto-comment]", tom: "Remember Case #1..."}  │
│     ] ✅ HISTORY PASSED (last 3 exchanges)                  │
│   - user_message: "Tom, what do you think?" (optional)      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Claude Haiku LLM                                            │
│ System: "You are Tom Thornfield, ghost..."                  │
│ User: "== RECENT CONVERSATION ==                            │
│        Player: Tom, what about alibi?                       │
│        Tom: Check timestamp verification...                 │
│        ✅ Knows previous exchanges                          │
│        ✅ References Case #1 naturally                      │
│        ✅ Won't repeat advice already given                 │
│                                                             │
│ Result: "Like I said before, alibi CAN be faked."           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ routes.py (line 1690-1692)                                  │
│ inner_voice_state.add_tom_comment(user_msg, response)       │
│                                                             │
│ Saved to: PlayerState.inner_voice_state                     │
│           .conversation_history[] (GLOBAL) ⚠️                │
│           (Could be per-witness in future)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Memory Storage Architecture

### Current State

```
PlayerState {
  case_id: "case_001",

  conversation_history: [  ← GLOBAL (ALL narrator + tom + player)
    {type: "player", text: "examine frost", timestamp: 123},
    {type: "narrator", text: "You see frost...", timestamp: 124},
    {type: "narrator", text: "Frost pattern visible...", timestamp: 125},
    {type: "player", text: "what about window?", timestamp: 126},
    {type: "tom", text: "Watch for evidence...", timestamp: 127},
    ...
  ],

  witness_states: {  ← SEPARATE per witness ✅
    "hermione_granger": WitnessState {
      witness_id: "hermione_granger",
      trust: 50,
      conversation_history: [  ← ISOLATED to hermione
        ConversationItem(question: "Where were you?", response: "Library"),
        ConversationItem(question: "Did you see him?", response: "No, but..."),
      ],
      secrets_revealed: ["time_together"],
    },
    "draco_malfoy": WitnessState {
      witness_id: "draco_malfoy",
      trust: 25,
      conversation_history: [  ← ISOLATED to draco
        ConversationItem(question: "Where were you?", response: "Dormitory"),
      ],
      secrets_revealed: [],
    },
  },

  inner_voice_state: InnerVoiceState {
    case_id: "case_001",
    trust_level: 0.2,
    conversation_history: [  ← GLOBAL Tom history (not per-witness)
      {user: "Tom, what do you think?", tom: "Consider..."},
      {user: "[auto-comment]", tom: "Watch the alibi"},
    ],
    total_comments: 12,
  },
}
```

### Proposed Narrator Architecture (What We'd Add)

```
PlayerState {
  ...existing fields...

  conversation_history: [...]  ← Keep existing for backward compat

  narrator_states: {  ← NEW: SEPARATE per location
    "library": NarratorLocationState {
      location_id: "library",
      conversation_history: [  ← ISOLATED to library
        {type: "narrator", text: "Dark books line shelves...", timestamp: 123},
        {type: "narrator", text: "Frost on window visible...", timestamp: 124},
      ],
      discovered_evidence_count: 2,
      last_visited: datetime(...),
    },
    "great_hall": NarratorLocationState {
      location_id: "great_hall",
      conversation_history: [  ← ISOLATED to great_hall
        {type: "narrator", text: "Candles flicker overhead...", timestamp: 200},
      ],
      discovered_evidence_count: 0,
      last_visited: datetime(...),
    },
  },

  witness_states: {...}  ← Keep existing
  inner_voice_state: {...}  ← Keep existing
}
```

---

## Conversation History Format Comparison

### Narrator Messages (Current)

```python
# Stored in: PlayerState.conversation_history[]
{
    "type": "narrator",  # or "player" or "tom"
    "text": "The frost patterns shimmer...",
    "timestamp": 1234567890000,  # milliseconds
}

# ❌ Issues:
# - Mixed with other types in same array
# - No location context
# - No previous narrator messages in same location
# - Not passed to LLM prompt
```

### Witness Messages (Current)

```python
# Stored in: PlayerState.witness_states["hermione"].conversation_history[]
ConversationItem(
    question: "Where were you?",
    response: "In the library studying.",
    timestamp: datetime(...),
    trust_delta: 5,
)

# ✅ Benefits:
# - Separate storage per witness
# - Clear question/response structure
# - Trust delta tracked
# - Full history passed to LLM
# - Witness can reference previous exchanges
```

### Tom Messages (Current)

```python
# Stored in: PlayerState.inner_voice_state.conversation_history[]
{
    "user": "Tom, what do you think?",  # or "[auto-comment]"
    "tom": "Consider the alibi...",
    "timestamp": "2026-01-09T10:30:00Z",
}

# ✅ Benefits:
# - Clear user/tom structure
# - Full history passed to LLM (last 3)
# - Tom references previous exchanges
# - Tom avoids repetition

# ❌ Gap:
# - Global history (all witnesses mixed)
# - Could be per-witness in future
```

---

## Function Call Patterns

### Pattern 1: Witness (Works Correctly)

```python
# routes.py line 748-773
witness_state = state.get_witness_state(request.witness_id, base_trust)
history = witness_state.get_history_as_dicts()

prompt = build_witness_prompt(
    witness=witness_data,
    trust=witness_state.trust,
    discovered_evidence=state.discovered_evidence,
    conversation_history=history,  # ✅ PASSED
    player_input=request.question,
)

response = await llm_call(prompt, system_prompt)

witness_state.add_conversation(
    question=request.question,
    response=response,
    trust_delta=trust_adjustment,
)
state.update_witness_state(witness_state)
```

### Pattern 2: Narrator (Missing History)

```python
# routes.py line 403-411
# ❌ NO state loading for narrator
# ❌ NO history extraction

prompt = build_narrator_prompt(
    location_desc=location.get("description"),
    hidden_evidence=location.get("hidden_evidence", []),
    discovered_ids=state.discovered_evidence,
    not_present=location.get("not_present", []),
    player_input=request.player_input,
    surface_elements=location.get("surface_elements", []),
    # ❌ conversation_history NOT PASSED
)

response = await llm_call(prompt, system_prompt)

# ❌ Saved to global array, not location-specific
state.add_conversation_message("narrator", response)
```

### Pattern 3: Tom (Works, But Global)

```python
# routes.py line 1603-1604
inner_voice_state = state.get_inner_voice_state()
history = inner_voice_state.conversation_history

prompt = build_context_prompt(
    case_context=case_context,
    evidence_discovered=evidence,
    conversation_history=history,  # ✅ PASSED (but GLOBAL)
    user_message=user_msg,
)

response = await llm_call(prompt, system_prompt)

inner_voice_state.add_tom_comment(user_msg, response)
```

---

## Proposed Solution: Apply Witness Pattern to Narrator

### Before (Current)

```python
# routes.py line 403
prompt = build_narrator_prompt(
    location_desc=location_desc,
    hidden_evidence=hidden_evidence,
    discovered_ids=discovered_ids,
    not_present=not_present,
    player_input=player_input,
    surface_elements=surface_elements,
    # ❌ conversation_history NOT included
)
```

### After (Proposed)

```python
# routes.py line 403 (modified)

# Step 1: Get narrator state for this location
narrator_state = state.get_narrator_state(
    location_id=request.location_id,
)

# Step 2: Extract history
narrator_history = narrator_state.get_history_as_dicts()

# Step 3: Pass to narrator prompt
prompt = build_narrator_prompt(
    location_desc=location_desc,
    hidden_evidence=hidden_evidence,
    discovered_ids=discovered_ids,
    not_present=not_present,
    player_input=player_input,
    surface_elements=surface_elements,
    conversation_history=narrator_history,  # ✅ NOW INCLUDED
)

# Step 4: Save response to location-specific state
narrator_state.add_response(response)
state.update_narrator_state(narrator_state)
```

---

## Files Modified

### Solution 1: Minimal (Add History Param Only)

```
narrator.py:
  Line 83: Add conversation_history param
  Line 150+: Add format_narrator_conversation_history() function

routes.py:
  Line 403: Pass narrator_history to build_narrator_prompt()
  (Plus ~20 lines to load and save history)
```

### Solution 2: Full (Separate Architecture)

```
player_state.py:
  Line 92+: Add NarratorLocationState class
  Line 292+: Add narrator_states dict to PlayerState
  Line 350+: Add get_narrator_state() method

narrator.py:
  Line 83: Add conversation_history param
  Line 150+: Add format_narrator_conversation_history() function

routes.py:
  Line 337+: Entire investigate endpoint refactored
  (~50 lines changes)

tests:
  20+ new test cases for narrator state isolation
```

---

## Benefits & Drawbacks

### Benefits of Adding Narrator History

| Benefit | Impact | Example |
|---------|--------|---------|
| No repetition | HIGH | Narrator won't repeat "you see frost" 3x |
| Context awareness | HIGH | Narrator references "As you noticed before..." |
| Natural flow | MEDIUM | Investigation feels continuous |
| Better UX | MEDIUM | Player doesn't get confused by repeated info |
| Mirrors witness | LOW | Consistency in architecture |

### Drawbacks

| Drawback | Severity | Mitigation |
|----------|----------|-----------|
| Requires refactor | LOW | Can be done incrementally |
| Migration for old saves | LOW | One-time conversion |
| More complex | LOW | Just copies witness pattern |
| More tests needed | MEDIUM | 20+ test cases required |

---

## Implementation Timeline

```
Current State (2026-01-09)
    ↓
Phase 4.5 (Optional)
├── Option A: Quick (1 day)
│   └── Add conversation_history param to narrator
│       Result: Narrator avoids repetition
│
└── Option B: Full (3 days)
    └── Create NarratorLocationState class
        Add per-location conversation history
        Update routes, state, context
        Write 20+ tests
        Result: Full isolation like witness
    ↓
Phase 5+ (Optional)
└── Consider unified conversation model
    (Longer refactor, better UX)
```

---

## Confidence & Recommendation

**Confidence**: 95% (Direct code analysis)

**Recommendation**: Implement Option A (1 day) in Phase 4.5
- Low risk
- Fixes real problem (narrator repetition)
- Minimal changes
- Can expand later if needed

**Not Critical**: Option B (full architecture)
- Nice to have
- Witness pattern already works for witness
- Can defer to Phase 5+

---

**Created**: 2026-01-09
**For**: User understanding witness/narrator LLM architecture
**Includes**: 8 detailed diagrams + code examples
