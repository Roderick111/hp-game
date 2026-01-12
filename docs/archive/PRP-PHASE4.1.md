# Phase 4.1: LLM-Powered Tom Thornfield Conversation System

**Date**: 2026-01-09
**Status**: Ready for Implementation
**Confidence**: 9/10

---

## Goal

Replace scripted YAML trigger system with real-time LLM agent playing Tom Thornfield's character. Tom responds naturally to THIS investigation (not generic psychology dumps) while maintaining 50% helpful/50% misleading split and trust-based progression.

**End State**: Player can investigate Case 1 with Tom commenting naturally on evidence/actions OR player can directly chat with Tom ("Tom, what do you think?"). Tom's psychology shows through behavior, not exposition. UI fixes message ordering (Tom appears right after narrator, not stacked at bottom).

---

## Why

### User Impact
- **Natural conversation**: Tom reacts to Draco, Hermione, frost pattern specifically (not generic "check evidence")
- **Character believability**: Tom sounds like failed Auror haunting THIS library, not exposition bot
- **Direct interaction**: Player can ask Tom questions mid-investigation
- **Proper UI flow**: Messages appear in conversation order (User → Narrator → Tom → User)

### Business Value
- Delivers on "unreliable mentor" core mechanic with authentic personality
- Enables 11 cases with Tom evolving (trust system progression)
- Creates memorable character moment ("I don't believe him" → "I trust Tom's judgment")

### Integration
- Trust system (0-100%) controls personal story sharing (Case 1: 0%, Case 11: 100%)
- 50/50 split maintained across multiple runs
- Message ordering fixes apply to future dialogue systems

### Alignment
- **PLANNING.md Phase 4**: "Tom's Inner Voice (Enhanced) - 50% helpful / 50% misleading ghost character"
- **TOM_THORNFIELD_CHARACTER.md lines 205-221**: "Cannot admit uncertainty - core flaw" (shows through action, not exposition)
- **CASE_DESIGN_GUIDE.md lines 792-820**: Natural dialogue rules (no therapy dumps, contextual only, show don't tell)

---

## What

### User-Visible Behavior

**Scenario 1: Investigation Comment**
```
> examine frost pattern

NARRATOR: Frost covers the inside of the window. The pattern radiates from
a single point - someone cast this spell from outside the library.

TOM (💀): Hermione was INSIDE the library. The frost pattern is on the
OUTSIDE of the window. Direction matters, recruit. Where was the spell
cast FROM? I never asked that question with Marcus.
```

**Scenario 2: Direct Chat**
```
> Tom, should I trust Hermione?

TOM (💀): Trust? [pause] Hermione helped me pass Potions when I was failing.
Brilliant mind. But brilliant doesn't mean truthful - Samuel taught me that.
Well, the version of Samuel I invented did.

What's the evidence say? Not your feelings. The evidence.
```

**Scenario 3: UI Ordering (FIXED)**
```
BEFORE (Phase 4.0):
┌───────────────────────────────────┐
│ [Narrator describes frost]       │
│ [User input box]                  │
│ [Tom message 1]                   │ ← Stacked at bottom
│ [Tom message 2]                   │
│ [Tom message 3]                   │
└───────────────────────────────────┘

AFTER (Phase 4.1):
┌───────────────────────────────────┐
│ [Narrator describes frost]       │
│ [Tom comment on frost]            │ ← Right after narrator
│ [User input: "Tom, what now?"]   │
│ [Tom responds naturally]          │ ← Right after user
│ [User input box]                  │
└───────────────────────────────────┘
```

### Technical Requirements

**Backend**:
- Replace `select_tom_trigger()` YAML selection with LLM prompt
- New endpoint: `POST /api/case/{case_id}/chat-with-tom` (direct chat)
- Context builder: Case facts + evidence discovered + trust level
- Modify `POST /api/case/{case_id}/inner-voice/check` to call LLM (not YAML)
- Character prompt enforces 50/50 split, unconscious patterns, trust level

**Frontend**:
- Fix `LocationView.tsx` message ordering (Tom messages inline, not stacked)
- Input routing: "Tom, ..." → direct chat. Everything else → narrator
- Chat history management (conversation with Tom persists)
- Loading states ("Tom thinking...")

**Database**: No changes (trust already tracked in `player_state.json`)

### Success Criteria
- [ ] Tom responds naturally to current investigation (not scripted)
- [ ] Messages appear in correct order (after narrator, not stacked)
- [ ] User can talk to Tom directly ("Tom, should I trust Hermione?")
- [ ] Context grows with investigation (Tom learns evidence as player does)
- [ ] Trust system implemented (0-100%, affects personal story sharing)
- [ ] 50% helpful / 50% misleading maintained
- [ ] Psychological patterns shown through behavior, not explained
- [ ] Fast response (<2s, doesn't block investigation)
- [ ] Rare Samuel/Marcus references (contextual only)
- [ ] Tom cannot articulate his own patterns

---

## Context & References

### Project Documentation

**Architecture** (PLANNING.md):
- Claude Haiku for LLM calls (proven in narrator, witness, mentor)
- Async API pattern (FastAPI + Claude SDK)
- State persistence via JSON (PlayerState model)

**Design Principles** (AUROR_ACADEMY_GAME_DESIGN.md lines 745-879):
- Tom's Ghost: Failed Auror, Marcus Bellweather wrongful conviction, warehouse death
- 50/50 helpful/misleading split (both sound equally valid)
- Trust 0% Case 1 → 100% Case 11 (controls personal story sharing)

**Current State** (STATUS.md):
- Phase 4 complete (YAML trigger system working, 421 backend tests)
- Phase 4.1 fixes: UI ordering + LLM replacement

### Research Sources

**From research files (validated)**:
- **CODEBASE-RESEARCH-PHASE4.md**: Trigger parsing in `trust.py`, state tracking in `player_state.py`, modal UI in `BriefingModal.tsx`
- **TOM_THORNFIELD_CHARACTER.md lines 205-221**: "Cannot admit uncertainty" - shows through action ("I went in because admitting 'I don't know if this is safe' felt impossible")
- **CASE_DESIGN_GUIDE.md lines 792-820**: Natural dialogue rules (indirect reference, contextual only, no therapy dumps, show don't tell, specifics not abstracts)

**Alignment notes**:
- ✅ Research aligns with project architecture (Claude Haiku, async, state persistence)
- ✅ Character document provides psychology WITHOUT explaining it
- ⚠️ UI ordering issue confirmed by user screenshot (needs fix)

---

## Quick Reference (Pre-Digested Context)

### Essential API Signatures

```python
# From DOCS_RESEARCH.md + project codebase
from anthropic import AsyncAnthropic

client = AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

async def get_tom_response(
    case_context: str,
    evidence_discovered: list[str],
    player_input: str,
    trust_level: int,
) -> str:
    """Generate Tom's response via LLM."""
    message = await client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=300,  # Tom is concise (2-4 sentences)
        temperature=0.8,  # Natural variation
        messages=[
            {"role": "user", "content": build_tom_prompt(
                case_context, evidence_discovered, player_input, trust_level
            )}
        ]
    )
    return message.content[0].text
```

### Key Patterns from Research

**Pattern 1: LLM Context Builder (from mentor.py)**
```python
# backend/src/context/mentor.py (lines 50-120)
def build_moody_roast_prompt(...) -> str:
    """Pattern: System prompt + rules + context + player input."""
    return f"""You are Mad-Eye Moody...

== RULES ==
1. 2-3 sentences only
2. Reference specific evidence (not generic)
3. No culprit revelation

== CONTEXT ==
{case_context}
{evidence_discovered}

== PLAYER ==
"{player_reasoning}"

Respond:"""
```

**Pattern 2: Character Prompt Structure**
```python
# Adapted from witness.py pattern (lines 81-156)
def build_tom_prompt(
    case_context: str,
    evidence_discovered: list[str],
    player_input: str,
    trust_level: int,
) -> str:
    """Tom's character prompt with unconscious patterns."""

    # Context injection (what Tom knows)
    context = f"""== CASE FACTS ==
Victim: Third-year student (petrified)
Location: Hogwarts Library
Suspects: Hermione Granger (inside), Draco Malfoy (seen outside)
Witnesses: Hermione (nervous), Madam Pince (saw Draco)

== EVIDENCE DISCOVERED ==
{', '.join(evidence_discovered) if evidence_discovered else 'None yet'}

== TOM'S BACKGROUND ==
- Died 1994, warehouse collapse (Case #3)
- Wrongly convicted Marcus Bellweather (Case #1, poisoning)
- Cannot admit uncertainty (core flaw)
- Samuel Thornfield (idealized dead brother)
- Trust level: {trust_level}% (0% = no personal stories, 100% = may share if asked)
"""

    # Character rules (enforces 50/50, psychology)
    rules = """== CHARACTER RULES ==
1. React to THIS case (frost pattern, Hermione, Draco, oak desk, library)
2. 50% chance helpful (Socratic question), 50% misleading (plausible wrong)
3. Cannot admit uncertainty ("I don't know" impossible for Tom)
4. Show patterns through action (deflection, false confidence, Samuel idealization)
5. Samuel/Marcus references ONLY when contextually relevant
6. 2-4 sentences max
7. Natural conversational tone (pauses, self-corrections, dark humor)
8. Specifics not abstracts ("Cell Block D, Azkaban" not "prison")
9. 90% professional/casual, 10% vulnerability (if trust allows)
10. Tom does NOT explain his psychology ("I'm defensive because..." ❌)
"""

    # Response format
    response_format = f"""== PLAYER INPUT ==
"{player_input}"

Respond as Tom (2-4 sentences):"""

    return context + rules + response_format
```

**Pattern 3: 50/50 Split Enforcement**
```python
# From character document + Godot Dialogue Manager pattern
import random

def should_be_helpful() -> bool:
    """50% chance helper, 50% chance misleading."""
    return random.random() < 0.5

# In character prompt:
if should_be_helpful():
    rules += "\n11. MODE: Helpful - Ask Socratic question that prompts critical thinking"
else:
    rules += "\n11. MODE: Misleading - Make plausible but wrong assertion that sounds professional"
```

### Integration Patterns (Actual Codebase)

**Pattern 1: Message Ordering Fix (LocationView.tsx)**
```typescript
// CURRENT (Phase 4.0 - BROKEN):
// backend/src/components/LocationView.tsx (lines 48-120)
<div className="space-y-4">
  {/* Narrator text */}
  <div className="prose">{locationDescription}</div>

  {/* User input box */}
  <form onSubmit={handleSubmit}>...</form>

  {/* Tom messages stacked at bottom */}
  {messages.filter(m => m.type === 'tom_ghost').map(msg => (
    <div key={msg.id}>{msg.text}</div>
  ))}
</div>

// FIXED (Phase 4.1 - CORRECT ORDER):
<div className="space-y-4">
  {inlineMessages.map((msg, idx) => {
    if (msg.type === 'narrator') {
      return <div key={idx} className="prose">{msg.text}</div>
    }
    if (msg.type === 'tom_ghost') {
      return (
        <div key={idx} className="text-amber-300/90 text-sm">
          💀 {msg.text}
        </div>
      )
    }
    if (msg.type === 'user') {
      return <div key={idx} className="text-gray-400">&gt; {msg.text}</div>
    }
  })}

  {/* Input box at bottom */}
  <form onSubmit={handleSubmit}>...</form>
</div>
```

**Pattern 2: Input Routing (App.tsx)**
```typescript
// backend/src/App.tsx (new routing logic)
const handleInvestigationInput = async (input: string) => {
  const trimmed = input.trim();

  // Route to Tom if starts with "tom" (case insensitive)
  if (trimmed.toLowerCase().startsWith('tom')) {
    const tomQuestion = trimmed.slice(3).trim();  // Remove "tom" prefix
    const response = await client.chatWithTom(caseId, playerId, tomQuestion);

    // Add to inline messages
    setInlineMessages(prev => [
      ...prev,
      { type: 'user', text: input },
      { type: 'tom_ghost', text: response.text }
    ]);
  } else {
    // Route to narrator (existing logic)
    const response = await client.investigate(caseId, playerId, trimmed);

    // Add narrator response
    setInlineMessages(prev => [
      ...prev,
      { type: 'user', text: input },
      { type: 'narrator', text: response.description }
    ]);

    // Check if Tom should comment (not every action)
    if (response.evidence_discovered && Math.random() < 0.3) {  // 30% chance
      const tomComment = await client.checkInnerVoice(caseId, playerId);
      if (tomComment) {
        setInlineMessages(prev => [
          ...prev,
          { type: 'tom_ghost', text: tomComment.text }
        ]);
      }
    }
  }
};
```

**Pattern 3: Trust System (player_state.py)**
```python
# backend/src/state/player_state.py (extend existing InnerVoiceState)
class InnerVoiceState(BaseModel):
    """Tom's ghost state."""
    case_id: str
    fired_triggers: list[str] = Field(default_factory=list)  # Keep for compatibility
    trigger_history: list[TomTriggerRecord] = Field(default_factory=list)
    total_interruptions: int = 0
    last_interruption_at: datetime | None = None

    # NEW: Trust progression
    cases_completed: int = 0  # Track across saves
    trust_level: int = 0  # 0-100%, grows 10% per case (0% Case 1, 100% Case 11)

    def calculate_trust(self) -> int:
        """10% per completed case (0% → 100% over 10 cases)."""
        return min(100, self.cases_completed * 10)

    def mark_case_complete(self) -> None:
        """Increment case count, recalculate trust."""
        self.cases_completed += 1
        self.trust_level = self.calculate_trust()
```

### Library-Specific Gotchas

**Synthesized from all sources:**

**Claude API** (from project experience + DOCS_RESEARCH.md):
- **Rate limits**: 429 errors → Always have template fallback
- **Token limits**: `max_tokens=300` for Tom (2-4 sentences = ~50-150 tokens, buffer for safety)
- **Temperature**: 0.8 for natural variation (0.7 = too robotic, 0.9 = too wild)
- **Model**: `claude-haiku-4-5` (fast, cheap, proven in narrator/witness/mentor)

**FastAPI** (from backend codebase):
- **Async**: Use `async def` for all LLM calls (don't block event loop)
- **Error handling**: Wrap LLM calls in `try/except` with template fallback
- **State**: Load PlayerState at start, save after modification

**React** (from frontend codebase):
- **Message ordering**: Use single `inlineMessages` array (not separate lists)
- **Loading states**: Show "Tom thinking..." during LLM call (~1-2s)
- **Input routing**: Check prefix BEFORE sending to narrator (avoid wasted API call)

### Decision Tree

```
User types input:
  ├─ Starts with "tom"? (case insensitive)
  │   ├─ YES → POST /api/chat-with-tom
  │   │   └─ Display Tom response inline
  │   └─ NO → POST /api/investigate (narrator)
  │       ├─ Evidence discovered?
  │       │   ├─ YES → 30% chance Tom comments
  │       │   │   └─ POST /api/inner-voice/check (LLM)
  │       │   └─ NO → Skip Tom comment
  │       └─ Display narrator response inline

Tom comment generation:
  1. Load case context (victim, suspects, witnesses)
  2. Get evidence discovered list
  3. Get trust level (0-100%)
  4. Roll 50/50 helpful vs misleading
  5. Build character prompt
  6. Call Claude Haiku (async, max_tokens=300, temp=0.8)
  7. Return response (2-4 sentences)
  8. Fallback to template if LLM fails
```

### Configuration Requirements

```bash
# .env (no new vars needed)
ANTHROPIC_API_KEY=sk-ant-...  # Already exists

# pyproject.toml (no new packages)
# anthropic>=0.40.0 already installed

# frontend package.json (no new packages)
# All TypeScript patterns use existing React
```

---

## Current Codebase Structure

```bash
# FROM CODEBASE_RESEARCH.md
backend/src/
├── api/
│   ├── routes.py           # MODIFY - Add /chat-with-tom endpoint
│   └── claude_client.py    # KEEP - Reuse existing Claude client
├── context/
│   ├── narrator.py         # KEEP - Reference prompt pattern
│   ├── witness.py          # KEEP - Reference character prompt pattern
│   ├── mentor.py           # KEEP - Reference LLM call pattern
│   └── inner_voice.py      # MODIFY - Replace YAML selection with LLM call
├── state/
│   ├── player_state.py     # MODIFY - Add trust_level, cases_completed
│   └── persistence.py      # KEEP - save_state, load_state (reuse)
└── tests/
    ├── test_routes.py      # MODIFY - Add /chat-with-tom tests
    └── test_inner_voice.py # MODIFY - Update tests for LLM calls

frontend/src/
├── components/
│   └── LocationView.tsx    # MODIFY - Fix message ordering (inline display)
├── api/
│   └── client.ts           # MODIFY - Add chatWithTom() function
├── types/
│   └── investigation.ts    # MODIFY - Add tom_chat message type
└── App.tsx                 # MODIFY - Add input routing logic
```

## Desired Codebase Structure

```bash
backend/src/
├── context/
│   └── inner_voice.py      # MODIFY - Replace select_tom_trigger() with call_tom_llm()
├── api/
│   ├── routes.py           # MODIFY - Add POST /chat-with-tom endpoint
│   └── models.py           # MODIFY - Add TomChatRequest, TomChatResponse
├── state/
│   └── player_state.py     # MODIFY - Add trust_level, cases_completed to InnerVoiceState

frontend/src/
├── components/
│   └── LocationView.tsx    # MODIFY - Inline message display (not stacked)
├── api/
│   └── client.ts           # MODIFY - Add chatWithTom() function
├── types/
│   └── investigation.ts    # MODIFY - Extend Message type with 'tom_chat'
└── App.tsx                 # MODIFY - Add input routing ("tom" → Tom, else → narrator)
```

**Note**: validation-gates handles test file creation. Don't include tests in structure.

---

## Files to Create/Modify

| File | Action | Purpose | Reference File |
|------|--------|---------|----------------|
| `backend/src/context/inner_voice.py` | MODIFY | Replace YAML selection with LLM prompt | `backend/src/context/mentor.py` (LLM call pattern) |
| `backend/src/api/routes.py` | MODIFY | Add POST /chat-with-tom endpoint | Existing patterns in same file |
| `backend/src/api/models.py` | MODIFY | Add TomChatRequest, TomChatResponse | Existing Pydantic models |
| `backend/src/state/player_state.py` | MODIFY | Add trust_level, cases_completed | Existing InnerVoiceState model |
| `frontend/src/components/LocationView.tsx` | MODIFY | Fix message ordering (inline display) | Existing LocationView pattern |
| `frontend/src/api/client.ts` | MODIFY | Add chatWithTom() function | Existing API client functions |
| `frontend/src/types/investigation.ts` | MODIFY | Extend Message type | Existing type definitions |
| `frontend/src/App.tsx` | MODIFY | Add input routing logic | Existing handleInvestigationInput |

**Note**: Test files handled by validation-gates. Don't list in PRP.

---

## Tasks (Ordered)

### Task 1: Add Trust System to State Model
**File**: `backend/src/state/player_state.py`
**Action**: MODIFY (extend InnerVoiceState)
**Purpose**: Track trust progression (0% → 100% over 11 cases)
**Reference**: `backend/src/state/player_state.py` (lines 50-80, InnerVoiceState)
**Pattern**: Add fields + helper methods (calculate_trust, mark_case_complete)
**Depends on**: None
**Acceptance criteria**:
- [ ] `trust_level: int = 0` field added to InnerVoiceState
- [ ] `cases_completed: int = 0` field added
- [ ] `calculate_trust()` method returns min(100, cases_completed * 10)
- [ ] `mark_case_complete()` increments cases_completed, recalculates trust
- [ ] Trust 0% at Case 1, 100% at Case 11

### Task 2: Build Tom Character Prompt
**File**: `backend/src/context/inner_voice.py`
**Action**: MODIFY (add build_tom_prompt function)
**Purpose**: Generate character prompt with case context + trust level
**Reference**: `backend/src/context/mentor.py` (lines 50-120, build_moody_roast_prompt)
**Integration**: Uses trust_level from InnerVoiceState (Task 1)
**Depends on**: Task 1
**Acceptance criteria**:
- [ ] `build_tom_prompt(case_context, evidence, player_input, trust_level)` exists
- [ ] Includes case facts (victim, suspects, witnesses, location)
- [ ] Includes evidence discovered list
- [ ] Includes character rules (50/50 split, unconscious patterns, trust)
- [ ] Includes 10 behavioral rules (from Quick Reference)
- [ ] Returns formatted prompt string (ready for Claude API)
- [ ] No psychology exposition (shows through action, not explanation)

### Task 3: Implement LLM Call Function
**File**: `backend/src/context/inner_voice.py`
**Action**: MODIFY (replace select_tom_trigger with call_tom_llm)
**Purpose**: Call Claude Haiku with character prompt, return response
**Reference**: `backend/src/context/mentor.py` (lines 150-200, async LLM call)
**Integration**: Uses build_tom_prompt from Task 2
**Depends on**: Task 2
**Acceptance criteria**:
- [ ] `async def call_tom_llm(case_context, evidence, player_input, trust_level)` exists
- [ ] Calls Claude Haiku (model="claude-haiku-4-5", max_tokens=300, temp=0.8)
- [ ] Uses existing AsyncAnthropic client (from claude_client.py)
- [ ] Wraps in try/except with template fallback
- [ ] Returns 2-4 sentence response
- [ ] Logs LLM errors (doesn't crash)
- [ ] <2s response time (measured in tests)

### Task 4: Modify Inner Voice Endpoint for LLM
**File**: `backend/src/api/routes.py`
**Action**: MODIFY (update POST /inner-voice/check to call LLM)
**Purpose**: Replace YAML trigger selection with LLM call
**Reference**: `backend/src/api/routes.py` (lines 250-300, existing /inner-voice/check)
**Integration**: Uses call_tom_llm from Task 3
**Depends on**: Task 3
**Acceptance criteria**:
- [ ] POST /inner-voice/check now calls call_tom_llm (not select_tom_trigger)
- [ ] Passes case_context, evidence_discovered, "comment on evidence", trust_level
- [ ] Returns InnerVoiceTriggerResponse with text, type, tier (dummy tier for compatibility)
- [ ] Returns 404 if LLM call fails AND template fails
- [ ] No breaking changes to response format (frontend expects same structure)

### Task 5: Add Chat With Tom Endpoint
**File**: `backend/src/api/routes.py`
**Action**: MODIFY (add new endpoint)
**Purpose**: Handle direct chat with Tom ("Tom, what do you think?")
**Reference**: `backend/src/api/routes.py` (lines 883-1049, /investigate pattern)
**Integration**: Uses call_tom_llm from Task 3
**Depends on**: Task 3
**Acceptance criteria**:
- [ ] `POST /api/case/{case_id}/chat-with-tom` endpoint exists
- [ ] Accepts TomChatRequest (player_id, question)
- [ ] Loads PlayerState, InnerVoiceState, trust_level
- [ ] Calls call_tom_llm with question as player_input
- [ ] Returns TomChatResponse (text, type: "chat")
- [ ] Saves conversation to state (optional, for history)

### Task 6: Add Request/Response Models
**File**: `backend/src/api/models.py`
**Action**: MODIFY (add Pydantic models)
**Purpose**: Type-safe request/response for /chat-with-tom
**Reference**: `backend/src/api/models.py` (existing models)
**Integration**: Used by Task 5 endpoint
**Depends on**: None
**Acceptance criteria**:
- [ ] `TomChatRequest(player_id, question)` model exists
- [ ] `TomChatResponse(text, type)` model exists
- [ ] Both have proper type hints, docstrings

### Task 7: Fix Message Ordering in LocationView
**File**: `frontend/src/components/LocationView.tsx`
**Action**: MODIFY (inline message display)
**Purpose**: Show Tom messages right after narrator (not stacked at bottom)
**Reference**: `frontend/src/components/LocationView.tsx` (existing structure)
**Integration**: Uses inlineMessages array from App.tsx (Task 9)
**Depends on**: Task 9 (App.tsx passes inlineMessages prop)
**Acceptance criteria**:
- [ ] Renders `inlineMessages` array in order (not separate tom_ghost list)
- [ ] Each message displays based on type (narrator, tom_ghost, user)
- [ ] Tom messages have skull icon (💀) + amber text
- [ ] Input box stays at bottom
- [ ] No more stacking of Tom messages

### Task 8: Add Chat With Tom API Client Function
**File**: `frontend/src/api/client.ts`
**Action**: MODIFY (add new function)
**Purpose**: Call POST /chat-with-tom endpoint
**Reference**: `frontend/src/api/client.ts` (existing functions)
**Integration**: Used by App.tsx input routing (Task 9)
**Depends on**: Task 5 (backend endpoint)
**Acceptance criteria**:
- [ ] `chatWithTom(caseId, playerId, question)` function exists
- [ ] Calls POST /api/case/{case_id}/chat-with-tom
- [ ] Returns Promise<{ text: string, type: string }>
- [ ] Handles 404/500 errors gracefully
- [ ] Has proper TypeScript types

### Task 9: Add Input Routing in App.tsx
**File**: `frontend/src/App.tsx`
**Action**: MODIFY (add routing logic to handleInvestigationInput)
**Purpose**: Route "Tom, ..." to Tom chat, everything else to narrator
**Reference**: `frontend/src/App.tsx` (existing handleInvestigationInput)
**Integration**: Uses chatWithTom from Task 8, checkInnerVoice (modify Task 4)
**Depends on**: Task 4, Task 5, Task 8
**Acceptance criteria**:
- [ ] Checks if input starts with "tom" (case insensitive)
- [ ] Routes to chatWithTom() if yes, investigate() if no
- [ ] Appends messages to inlineMessages array (preserves order)
- [ ] After narrator response, 30% chance Tom comments (checkInnerVoice)
- [ ] Shows loading state during LLM calls
- [ ] Passes inlineMessages to LocationView as prop

### Task 10: Extend Message Type Definition
**File**: `frontend/src/types/investigation.ts`
**Action**: MODIFY (add 'tom_chat' to Message type)
**Purpose**: Support direct chat messages (not just comments)
**Reference**: `frontend/src/types/investigation.ts` (existing Message type)
**Integration**: Used by App.tsx (Task 9) and LocationView (Task 7)
**Depends on**: None
**Acceptance criteria**:
- [ ] `Message` type includes `type: 'narrator' | 'tom_ghost' | 'tom_chat' | 'user'`
- [ ] `tom_chat` distinguishes direct chat from automatic comments
- [ ] All existing uses of Message type remain compatible

---

## Integration Points

### Backend API
**Where**: `backend/src/api/routes.py`
**What**: Modify /inner-voice/check + add /chat-with-tom endpoint
**Pattern**: Async endpoint → load state → call LLM → save state → return response

### State Management
**Where**: `backend/src/state/player_state.py`
**What**: Extend InnerVoiceState with trust_level, cases_completed
**Pattern**: Pydantic model with helper methods (calculate_trust)

### LLM Context
**Where**: `backend/src/context/inner_voice.py`
**What**: Character prompt builder + LLM call function
**Pattern**: Same structure as mentor.py (system prompt + rules + context + input)

### Frontend Message Flow
**Where**: `frontend/src/App.tsx` → `frontend/src/components/LocationView.tsx`
**What**: Single inlineMessages array passed as prop
**Pattern**: App manages state, LocationView renders in order

---

## Known Gotchas

### Claude API (from research + project experience)
- **Issue**: Rate limits during high usage
- **Solution**: Template fallback in try/except (pattern: try LLM → except → return template)
- **Reference**: `backend/src/context/narrator.py` - already has error handling

### Character Consistency (from TOM_THORNFIELD_CHARACTER.md)
- **Issue**: Tom might explain his psychology ("I'm defensive because...")
- **Solution**: Rule #10 in character prompt: "Tom does NOT explain his psychology"
- **Test**: Run 10 samples, verify 0 exposition dumps

### 50/50 Split Verification (from user requirements)
- **Issue**: LLM might drift toward helpful (more natural)
- **Solution**: Random roll before prompt + explicit MODE rule (#11)
- **Test**: Run 100 samples, count helpful vs misleading (should be 45-55% range)

### Message Ordering (from user screenshot)
- **Issue**: Tom messages currently stack at bottom (Phase 4.0 bug)
- **Solution**: Single inlineMessages array, render in order (Task 7)
- **Test**: Visual verification - Tom message appears right after narrator

### Trust System Edge Case (from user requirements)
- **Issue**: Trust 0% but LLM might still share personal stories
- **Solution**: Prompt rule: "Trust level: 0% (no personal stories, ever)"
- **Test**: Run at trust=0%, verify 0 Samuel/Marcus references unless contextual

### Context Injection Scope (from user requirements)
- **Issue**: Tom might know evidence player hasn't discovered yet
- **Solution**: Pass only `evidence_discovered` list (not all case evidence)
- **Test**: Start new case, check Tom comments → should reference 0 evidence

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
# 1. Discover evidence → Tom comments naturally (not scripted)
# 2. Type "Tom, should I trust Hermione?" → Tom responds in character
# 3. Check message order in UI → Tom message after narrator (not stacked)
```

**Note**: validation-gates agent handles comprehensive testing. No need to specify test scenarios in PRP.

---

## Dependencies

**New packages**: None - reuse existing anthropic, fastapi, pydantic, react

**Configuration**:
- No new env vars needed
- Reuse existing `ANTHROPIC_API_KEY`

---

## Out of Scope

- Dynamic trust calculation based on player choices (Phase 4.1 uses case count only)
- Multi-turn conversation memory (Tom doesn't remember previous chats in same case)
- Tom's character arc progression (Cases 1-10, Phase 5+)
- Voice mode selection UI (helpful/misleading shown visually, Phase 5.5)

---

## Agent Orchestration Plan

### Execution Strategy

**Sequential Track** (dependencies):
1. `fastapi-specialist` → Backend changes (Tasks 1-6)
2. `react-vite-specialist` → Frontend changes (Tasks 7-10)
3. `validation-gates` → Run all tests
4. `documentation-manager` → Update docs

**Why Sequential**: Backend must exist before frontend can call API.

### Agent-Specific Guidance

#### For fastapi-specialist
- **Input**: Tasks 1-6 (backend implementation)
- **Context**: Quick Reference section (LLM call pattern, character prompt structure)
- **Pattern**: Follow `backend/src/context/mentor.py` structure (async LLM call with fallback)
- **Integration**: Extend InnerVoiceState, modify routes.py, add models.py
- **Output**: /chat-with-tom endpoint + modified /inner-voice/check (LLM-based)

**Key Files to Reference**:
- `backend/src/context/mentor.py` (LLM call pattern)
- `backend/src/context/witness.py` (character prompt pattern)
- `backend/src/state/player_state.py` (state extension pattern)
- `backend/src/api/routes.py` (endpoint pattern)

#### For react-vite-specialist
- **Input**: Tasks 7-10 (frontend implementation)
- **Context**: Quick Reference section (message ordering fix, input routing)
- **Pattern**: Single inlineMessages array, type-based rendering
- **Integration**: App.tsx manages state, LocationView.tsx renders
- **Output**: Fixed message ordering + input routing

**Key Files to Reference**:
- `frontend/src/components/LocationView.tsx` (message rendering)
- `frontend/src/api/client.ts` (API client pattern)
- `frontend/src/App.tsx` (state management)

#### For validation-gates
- **Input**: All code complete
- **Runs**: Tests, lint, type check, build
- **Output**: Pass/fail report
- **Note**: validation-gates creates tests if needed

#### For documentation-manager
- **Input**: Code complete, validation passed
- **Files changed**: List from "Files to Create/Modify" section
- **Output**: Updated README, docstrings added

### Handoff Context

**Next agent receives**:
- This PRP (full context)
- Quick Reference (no doc reading needed)
- Specific task numbers
- Actual file paths to modify
- Pattern files to follow

**Next agent does NOT need**:
- ❌ Read research files
- ❌ Search for examples
- ❌ Read 5-10 docs (Quick Reference has everything)
- ❌ Explore codebase (integration points provided)

---

## Anti-Patterns to Avoid

**From project experience + character document:**
- ❌ Tom explaining his psychology ("I'm defensive because of Samuel")
- ❌ Generic advice ("Check the evidence") instead of case-specific ("Hermione was INSIDE")
- ❌ Stacking Tom messages at bottom (single inlineMessages array fixes this)
- ❌ Synchronous LLM calls (use async def everywhere)
- ❌ No template fallback (wrap in try/except)
- ❌ Trust level ignored (pass to prompt as explicit rule)

---

## Character Prompt Example (Full)

```python
def build_tom_prompt(
    case_context: dict,
    evidence_discovered: list[str],
    player_input: str,
    trust_level: int,
) -> str:
    """Build Tom's character prompt with full context."""

    # Context injection
    context = f"""== CASE FACTS (What Tom knows) ==
Victim: {case_context['victim_name']} ({case_context['victim_status']})
Location: {case_context['location_name']}
Suspects: {', '.join(case_context['suspects'])}
Witnesses: {', '.join(case_context['witnesses'])}

== EVIDENCE DISCOVERED ==
{', '.join(evidence_discovered) if evidence_discovered else 'None yet'}

== TOM'S BACKGROUND ==
Tom Thornfield, died 1994 (warehouse collapse, Case #3)
- Wrongly convicted Marcus Bellweather (Case #1, poisoning, 15 years Azkaban)
- Idealized dead brother Samuel (died 1997, Battle of Dept of Mysteries)
- Core flaw: Cannot admit uncertainty ("I don't know" impossible)
- Haunts Hogwarts Library (died in similar setting)
- Trust level: {trust_level}% (0% = no personal stories, 100% = may share if asked)
"""

    # Character rules (enforces psychology without explaining it)
    rules = """== CHARACTER RULES ==
1. React to THIS case (specific people, evidence, location - not generic advice)
2. 2-4 sentences max (concise, conversational)
3. Natural tone (pauses, self-corrections, dark humor occasional)
4. Specifics not abstracts ("Cell Block D, Azkaban" not "prison")
5. Show patterns through action:
   - Deflection: "Actually, your evidence is stronger. You're fine."
   - False confidence: "Sometimes the obvious answer really is correct."
   - Samuel idealization: "Samuel always checked that. Well, the version I invented did."
6. Samuel/Marcus references ONLY when contextually relevant
   - ✅ Player overconfident → "I was that sure about Marcus"
   - ❌ Random → "This reminds me of Samuel..." (no)
7. Trust level behavior:
   - 0-30%: No personal stories ever
   - 40-70%: Brief references if directly asked
   - 80-100%: May share deeper moments if relevant
8. Emotional distribution:
   - 90% Professional/casual
   - 5% Self-aware ("I'm doing what I did in Case #2, aren't I?")
   - 3% Dark humor ("Check the floor. Trust me on that.")
   - 2% Deep vulnerability (only high trust)
9. Tom does NOT explain his psychology
   - ❌ "I'm defensive because of Samuel's shadow"
   - ❌ "I have trauma from the warehouse collapse"
   - ✅ Shows through action, deflection, specific references
10. Case-specific references:
    - Library setting (Tom died in different library, triggers him)
    - Frost pattern (directional evidence, Marcus case lacked this)
    - Hermione vs Draco (inside vs outside, location matters)
    - Oak desk (specific detail shows engagement)
"""

    # 50/50 mode selection
    mode = "HELPFUL" if random.random() < 0.5 else "MISLEADING"

    if mode == "HELPFUL":
        rules += """
11. MODE: Helpful - Ask Socratic question prompting critical thinking
    - "What would need to be true for that theory to work?"
    - "How do you verify the alibi isn't faked?"
    - "Which piece of evidence is weakest? How do you strengthen it?"
"""
    else:
        rules += """
11. MODE: Misleading - Make plausible but wrong assertion (sounds professional)
    - "Three witnesses agree - that's strong corroboration"
    - "Physical evidence at scene usually points to culprit"
    - "Defensive behavior is classic guilty tell"
"""

    # Response format
    response = f"""== PLAYER INPUT ==
"{player_input}"

Respond as Tom Thornfield (2-4 sentences, conversational):"""

    return context + rules + response
```

---

**Generated**: 2026-01-09
**Source**: User requirements + research files + project documentation + character document
**Confidence Score**: 9/10 (likelihood of one-pass implementation success)
**Alignment**: Validated against PLANNING.md, TOM_THORNFIELD_CHARACTER.md, and user screenshot

---

## Unresolved Questions

1. **When should Tom comment automatically?**
   - Current: 30% chance after evidence discovered
   - User may prefer: Every evidence? Only critical evidence? Threshold (3+ pieces)?
   - **Recommendation**: Start 30%, tune based on playtest (too chatty vs too quiet)

2. **Should Tom conversation history persist across investigation?**
   - Current PRP: Stateless (Tom doesn't remember previous chats in same case)
   - User may prefer: Memory ("You asked me about Hermione earlier...")
   - **Recommendation**: Phase 4.1 stateless, add memory in Phase 5 if needed

3. **How to handle Tom at trust=0% but player asks "Tom, tell me about Marcus"?**
   - Option A: Refuse ("I don't want to talk about that.")
   - Option B: Brief factual answer ("15 years Azkaban. Wrong man.") but no emotion
   - **Recommendation**: Option B (shows Tom is defensive, not silent)

4. **Should 50/50 split be enforced per message or across session?**
   - Option A: Random per message (might get 5 helpful in row by chance)
   - Option B: Track ratio, force balance (alternating if ratio drifts)
   - **Recommendation**: Option A (more natural, statistical balance over 10+ interactions)

5. **What if LLM generates exposition dump despite prompt rules?**
   - Detection: Check response for phrases like "because of", "trauma", "I feel"
   - Mitigation: Retry with stronger rule? Filter response? Fallback to template?
   - **Recommendation**: Log violation, use template fallback (safer than retry)

---

*End of PRP*
