# Phase 4.4: UI/UX Improvements - Product Requirement Plan

## Goal
Fix 5 identified UI/UX issues: conversation box height alignment, remove square brackets from titles, single-paragraph location descriptions, consistent title styling (yellow uppercase), and conversation history persistence between sessions.

## Why
- **User impact**: Professional UI polish, critical session continuity (losing investigation history is disruptive)
- **Business value**: Retention (persistence fix prevents lost progress frustration), polish signals quality
- **Integration**: Complements Phase 4.1-4.3 Tom conversation system (makes messages persist)
- **Alignment**: PLANNING.md Phase 4 (Tom conversation complete, polish improvements)

## What

### User-Visible Behavior
1. **Conversation box height** - Main conversation area extends to align bottom with Case Status box (better screen real estate use)
2. **Square brackets removed** - Location titles display naturally ("Hogwarts Library" not "[Hogwarts Library]"), Evidence Board title displays naturally
3. **Location description formatting** - Multi-line YAML descriptions render as single flowing paragraph (no artificial line breaks)
4. **Consistent title styling** - All section titles use same yellow uppercase style: "HOGWARTS LIBRARY - CRIME SCENE", "AVAILABLE WITNESSES", "EVIDENCE BOARD", "CASE STATUS". Exception: "AUROR ACADEMY" uses same font but white color
5. **Conversation persistence** (CRITICAL) - Narrator responses + Tom messages persist between Save/Load sessions (investigation log continues where left off)

### Technical Requirements
**Frontend**:
- LocationView.tsx: Adjust max-h-64 → max-h-96 (or dynamic calculation)
- LocationView.tsx: Remove brackets from title (line 317)
- EvidenceBoard.tsx: Remove brackets from title (line 43)
- LocationView.tsx: Change whitespace-pre-line → whitespace-normal (line 319)
- App.tsx: Save inlineMessages to backend on investigation actions
- useInvestigation.ts: Load conversation_history from backend on case load

**Backend**:
- PlayerState.conversation_history already exists (line 300) - UNUSED
- routes.py /api/investigate: Append narrator response to conversation_history
- routes.py /api/tom/* endpoints: Append Tom messages to conversation_history
- persistence.py: Ensure conversation_history included in save/load (likely already works)

### Success Criteria
- [ ] Conversation box height visually aligns with Case Status bottom
- [ ] Location title displays "HOGWARTS LIBRARY - CRIME SCENE" (no brackets, yellow, uppercase)
- [ ] Evidence Board title displays "EVIDENCE BOARD" (no brackets, yellow, uppercase)
- [ ] Available Witnesses title displays "AVAILABLE WITNESSES" (yellow, uppercase)
- [ ] Case Status title displays "CASE STATUS" (yellow, uppercase)
- [ ] AUROR ACADEMY title displays in same font but white color (not yellow)
- [ ] All section titles have consistent font size and styling
- [ ] Location description flows as single paragraph
- [ ] **CRITICAL**: Save game → Close browser → Load game → Investigation log restored (Narrator + Tom messages)
- [ ] Conversation history limited to last 20 messages (prevent infinite growth)
- [ ] All frontend tests pass (430+ tests)
- [ ] All backend tests pass (469+ tests)
- [ ] Lint/type check passes

---

## Context & References

### Project Documentation
**From project docs:**
- Architecture: React frontend + Python backend, state persistence JSON (PLANNING.md)
- Design principles: Terminal UI aesthetic, save/load critical (game design doc)
- Current state: Phase 4.3 complete (Tom personality enhancement), 899 tests passing (STATUS.md)

### Research Sources
**From codebase exploration (file-search-specialist 2026-01-09):**
- LocationView.tsx line 317: `[{locationData.name}]` → Remove brackets
- LocationView.tsx line 319: `whitespace-pre-line` → Change to `whitespace-normal`
- LocationView.tsx line 326: `max-h-64` → Increase to `max-h-96` or dynamic
- EvidenceBoard.tsx line 43: `[Evidence Board]` → Remove brackets
- App.tsx line 108: `inlineMessages` state → Never saved to backend
- PlayerState.conversation_history (line 300): EXISTS but unused
- routes.py save/load (lines 440-469): Only persists evidence/location, ignores conversation

**Alignment notes:**
- ✅ Codebase exploration complete, all file paths verified
- ✅ Backend already has conversation_history field (PlayerState line 300)
- ⚠️ Critical gap: Frontend conversation state disconnected from backend persistence

---

## Quick Reference (Pre-Digested Context)

### Essential Type Definitions
```typescript
// From frontend/src/types/investigation.ts
export interface Message {
  type: 'player' | 'narrator' | 'tom';
  text: string;
  timestamp: number; // Unix timestamp for ordering
  key: string; // Unique identifier
}

export interface InvestigationState {
  case_id: string;
  current_location: string;
  discovered_evidence: string[];
  visited_locations: string[];
  conversation_history: ConversationMessage[]; // Backend type
  // ... other fields
}

export interface ConversationMessage {
  type: 'player' | 'narrator' | 'tom';
  text: string;
  timestamp: number;
}
```

### Key Patterns from Codebase

#### Pattern 1: Save/Load Flow (from useInvestigation.ts)
```typescript
// Current implementation (lines 130-149)
const handleSaveGame = async () => {
  try {
    await saveGame({
      player_id: playerId,
      state: {
        case_id: caseId,
        current_location: state.currentLocation,
        discovered_evidence: state.evidence,
        visited_locations: state.visitedLocations,
        // ❌ conversation_history MISSING HERE
      }
    });
  } catch (error) {
    console.error('Save failed:', error);
  }
};

const handleLoadGame = async () => {
  const savedState = await loadGame(caseId, playerId);
  if (savedState) {
    dispatch({
      type: 'LOAD_STATE',
      payload: savedState
    });
    // ❌ No restoration of conversation_history to inlineMessages
  }
};
```

#### Pattern 2: Message Creation (from App.tsx)
```typescript
// When player investigates (line 145)
const newMessage: Message = {
  type: 'player',
  text: action,
  timestamp: Date.now(),
  key: `player-${Date.now()}`
};

// After narrator responds (line 161)
const narratorMessage: Message = {
  type: 'narrator',
  text: response.description,
  timestamp: Date.now(),
  key: `narrator-${Date.now()}`
};

setInlineMessages(prev => [...prev, newMessage, narratorMessage]);
// ❌ These messages never saved to backend
```

#### Pattern 3: Backend Conversation History (player_state.py)
```python
# Line 300: Field exists but unused
class PlayerState(BaseModel):
    conversation_history: list[dict[str, Any]] = Field(default_factory=list)
    # ... other fields

# Add method to append conversation message
def add_conversation_message(
    self,
    msg_type: Literal["player", "narrator", "tom"],
    text: str,
    timestamp: int | None = None
) -> None:
    """Add message to conversation history."""
    self.conversation_history.append({
        "type": msg_type,
        "text": text,
        "timestamp": timestamp or int(datetime.now(UTC).timestamp() * 1000)
    })
    self.updated_at = _utc_now()
```

### Integration Points (Actual Codebase)

#### Frontend: App.tsx (Investigation Handler)
**Where**: App.tsx lines 138-175 (handleInvestigate function)
**What**: After receiving narrator response, save both player + narrator messages
**Pattern**: Call `saveConversationMessage()` helper after state update
```typescript
// After line 166 (after setInlineMessages)
await saveConversationMessage(newMessage); // Player action
await saveConversationMessage(narratorMessage); // Narrator response
```

#### Frontend: App.tsx (Tom Message Handler)
**Where**: App.tsx lines 180-195 (handleTomMessage function)
**What**: After Tom responds, save Tom message
**Pattern**: Same as above
```typescript
await saveConversationMessage(tomMessage);
```

#### Frontend: useInvestigation.ts (Load Handler)
**Where**: useInvestigation.ts lines 130-149 (handleLoadGame)
**What**: Restore conversation_history to inlineMessages on load
**Pattern**: Map backend format → frontend Message type
```typescript
if (savedState.conversation_history) {
  const restoredMessages: Message[] = savedState.conversation_history.map((msg, idx) => ({
    type: msg.type,
    text: msg.text,
    timestamp: msg.timestamp,
    key: `${msg.type}-${msg.timestamp}-${idx}`
  }));
  // Pass to App.tsx via callback
  onConversationRestore?.(restoredMessages);
}
```

#### Backend: routes.py (Investigate Endpoint)
**Where**: routes.py lines 550-650 (POST /api/investigate)
**What**: Append player action + narrator response to conversation_history
**Pattern**: Call `state.add_conversation_message()` twice
```python
# After line 580 (after loading state)
state.add_conversation_message("player", action_text, timestamp=int(time.time() * 1000))

# After line 620 (after narrator response)
state.add_conversation_message("narrator", narrator_response, timestamp=int(time.time() * 1000))

# Save state (already happens at line 640)
save_state(state, player_id)
```

#### Backend: routes.py (Tom Endpoints)
**Where**: routes.py lines 1050-1120 (POST /api/tom/chat, POST /api/tom/auto-comment)
**What**: Append Tom messages to conversation_history
**Pattern**: Same as investigate endpoint
```python
state.add_conversation_message("tom", tom_response, timestamp=int(time.time() * 1000))
save_state(state, player_id)
```

### Library-Specific Gotchas
**Synthesized from all sources:**
- **React State**: `inlineMessages` is local state, never persists unless explicitly saved
- **TypeScript**: Must match backend dict structure (`{type, text, timestamp}`)
- **Tailwind**: `max-h-64` = 16rem = 256px, `max-h-96` = 24rem = 384px
- **CSS whitespace**: `whitespace-pre-line` preserves line breaks, `whitespace-normal` collapses them

### Decision Tree
```
User investigates location:
  1. User types action → Add to inlineMessages (player)
  2. Backend responds → Add to inlineMessages (narrator)
  3. ✅ NEW: Save both to backend conversation_history
  4. Tom may auto-comment → Add to inlineMessages (tom)
     └─ ✅ NEW: Save Tom message to backend conversation_history

User saves game:
  1. Trigger save via useInvestigation
  2. ✅ NEW: Ensure conversation_history included in payload
  3. Backend persists to JSON

User loads game:
  1. Backend returns conversation_history
  2. ✅ NEW: Map to Message[] format
  3. ✅ NEW: Restore to inlineMessages
  4. UI displays full investigation log
```

### Configuration Requirements
None - all dependencies already installed.

---

## Current Codebase Structure
```bash
frontend/src/
├── components/
│   ├── LocationView.tsx        # Lines 317 (brackets), 319 (whitespace), 326 (height)
│   └── EvidenceBoard.tsx       # Line 43 (brackets)
├── App.tsx                     # Line 108 (inlineMessages state), 145/161/166/175 (message creation)
├── hooks/
│   └── useInvestigation.ts     # Lines 130-149 (save/load handlers)
├── api/
│   └── client.ts               # Save/load API functions
└── types/
    └── investigation.ts        # Message, InvestigationState types

backend/src/
├── state/
│   └── player_state.py         # Line 300 (conversation_history field)
├── api/
│   └── routes.py               # Lines 440-469 (save/load), 550-650 (investigate), 1050-1120 (Tom)
└── persistence.py              # save_state/load_state functions
```

## Desired Codebase Structure
No new files needed. Modify existing files only.

---

## Files to Create/Modify

| File | Action | Purpose | Reference File |
|------|--------|---------|----------------|
| `frontend/src/components/LocationView.tsx` | MODIFY | Fix height (line 326), brackets (line 317), whitespace (line 319), title styling (yellow uppercase) | Existing file |
| `frontend/src/components/EvidenceBoard.tsx` | MODIFY | Remove brackets (line 43), title styling (yellow uppercase) | Existing file |
| `frontend/src/components/WitnessSelector.tsx` | MODIFY | Title styling (yellow uppercase) | Existing file |
| `frontend/src/App.tsx` | MODIFY | Save messages to backend, restore on load, "CASE STATUS" title styling (yellow uppercase), "AUROR ACADEMY" font consistency (white) | useInvestigation.ts (save/load pattern) |
| `frontend/src/hooks/useInvestigation.ts` | MODIFY | Include conversation_history in save, restore on load | Existing save/load logic |
| `frontend/src/api/client.ts` | MODIFY (minor) | Update saveGame payload type | Existing API functions |
| `backend/src/state/player_state.py` | MODIFY | Add `add_conversation_message()` helper | Existing PlayerState methods |
| `backend/src/api/routes.py` | MODIFY | Append messages in investigate/tom endpoints | Existing state update patterns |

**Note**: Tests handled by validation-gates. Don't list in PRP.

---

## Tasks (Ordered)

### Task 1: Backend Conversation History Method
**File**: `backend/src/state/player_state.py`
**Action**: MODIFY (add helper method)
**Purpose**: Provide clean API for appending conversation messages
**Reference**: Existing `add_evidence()` method (lines 309-313)
**Pattern**: Simple append with timestamp, dedupe not needed (conversation is sequential)
**Depends on**: None
**Acceptance criteria**:
- [ ] `add_conversation_message(msg_type, text, timestamp)` method exists
- [ ] Appends dict with type/text/timestamp to conversation_history list
- [ ] Updates `updated_at` timestamp
- [ ] Limits history to last 20 messages (prevent unbounded growth)
- [ ] Method has docstring with Args/Returns

**Implementation notes**:
```python
def add_conversation_message(
    self,
    msg_type: Literal["player", "narrator", "tom"],
    text: str,
    timestamp: int | None = None
) -> None:
    """Add message to conversation history.

    Args:
        msg_type: Message type (player/narrator/tom)
        text: Message text content
        timestamp: Unix timestamp in milliseconds (defaults to now)
    """
    self.conversation_history.append({
        "type": msg_type,
        "text": text,
        "timestamp": timestamp or int(datetime.now(UTC).timestamp() * 1000)
    })
    # Keep only last 20 messages
    if len(self.conversation_history) > 20:
        self.conversation_history = self.conversation_history[-20:]
    self.updated_at = _utc_now()
```

---

### Task 2: Backend Save Conversation in Investigate Endpoint
**File**: `backend/src/api/routes.py`
**Action**: MODIFY (POST /api/investigate endpoint)
**Purpose**: Persist player action + narrator response to conversation_history
**Reference**: Existing state save pattern (line 640)
**Integration**: Uses `add_conversation_message()` from Task 1
**Depends on**: Task 1
**Acceptance criteria**:
- [ ] After receiving player action, call `state.add_conversation_message("player", action, timestamp)`
- [ ] After generating narrator response, call `state.add_conversation_message("narrator", response, timestamp)`
- [ ] State saved via existing `save_state()` call
- [ ] Timestamps match frontend (milliseconds since epoch)

**Implementation location**: Lines 550-650 in routes.py
```python
# After line 580 (after loading state)
state.add_conversation_message("player", action_text)

# After line 620 (after narrator response)
state.add_conversation_message("narrator", narrator_response_text)

# Existing save_state call at line 640 persists conversation_history
```

---

### Task 3: Backend Save Conversation in Tom Endpoints
**File**: `backend/src/api/routes.py`
**Action**: MODIFY (POST /api/tom/chat, POST /api/tom/auto-comment endpoints)
**Purpose**: Persist Tom messages to conversation_history
**Reference**: Task 2 pattern
**Integration**: Uses `add_conversation_message()` from Task 1
**Depends on**: Task 1
**Acceptance criteria**:
- [ ] `/tom/chat`: Save player message + Tom response (2 calls)
- [ ] `/tom/auto-comment`: Save Tom response only (1 call, no player message)
- [ ] State saved after appending messages
- [ ] Timestamps consistent

**Implementation location**: Lines 1050-1120 in routes.py
```python
# /tom/chat endpoint (line 1070)
state.add_conversation_message("player", user_message)
tom_response = await generate_tom_response(...)
state.add_conversation_message("tom", tom_response)
save_state(state, player_id)

# /tom/auto-comment endpoint (line 1100)
tom_response = await generate_tom_response(...)
state.add_conversation_message("tom", tom_response)
save_state(state, player_id)
```

---

### Task 4: Frontend Save Conversation Messages to Backend
**File**: `frontend/src/App.tsx`
**Action**: MODIFY (handleInvestigate, handleTomMessage functions)
**Purpose**: Trigger backend conversation save after UI updates
**Reference**: Existing `saveGame()` pattern in useInvestigation.ts
**Integration**: Backend endpoints from Tasks 2-3 already save
**Depends on**: Tasks 2-3
**Acceptance criteria**:
- [ ] No changes needed - backend endpoints already save conversation_history
- [ ] Verify existing save/load calls include conversation_history in payload
- [ ] Update TypeScript types if needed

**Implementation notes**:
Actually, backend endpoints (Tasks 2-3) already handle saving. Frontend just needs to ensure load/restore works (Task 6).

**Action**: VERIFY ONLY - No code changes needed for save flow.

---

### Task 5: Frontend Restore Conversation on Load
**File**: `frontend/src/hooks/useInvestigation.ts`
**Action**: MODIFY (handleLoadGame function)
**Purpose**: Map backend conversation_history → frontend Message[] format
**Reference**: Existing LOAD_STATE action (lines 130-149)
**Pattern**: Transform backend dict → frontend Message type
**Depends on**: Tasks 2-3 (backend saves messages)
**Acceptance criteria**:
- [ ] After loading state, extract `conversation_history` from backend response
- [ ] Map each message: `{type, text, timestamp}` → `Message` type
- [ ] Generate unique `key` field (`${type}-${timestamp}-${idx}`)
- [ ] Return messages via callback or state update
- [ ] Empty history handled gracefully (no errors)

**Implementation**:
```typescript
// In useInvestigation.ts handleLoadGame (after line 140)
if (savedState.conversation_history) {
  const restoredMessages: Message[] = savedState.conversation_history.map((msg, idx) => ({
    type: msg.type as 'player' | 'narrator' | 'tom',
    text: msg.text,
    timestamp: msg.timestamp,
    key: `${msg.type}-${msg.timestamp}-${idx}`
  }));

  // Option 1: Return via callback
  onConversationRestore?.(restoredMessages);

  // Option 2: Dispatch action to include in state
  dispatch({
    type: 'LOAD_CONVERSATION',
    payload: restoredMessages
  });
}
```

---

### Task 6: Frontend Connect Restored Messages to App State
**File**: `frontend/src/App.tsx`
**Action**: MODIFY (useEffect on case load)
**Purpose**: Restore inlineMessages from backend conversation_history
**Reference**: Existing state restoration pattern (lines 114-120)
**Integration**: Uses restored messages from Task 5
**Depends on**: Task 5
**Acceptance criteria**:
- [ ] When case loads, receive restored messages from useInvestigation
- [ ] Set inlineMessages state to restored messages
- [ ] UI displays full investigation log immediately
- [ ] Messages appear in correct chronological order
- [ ] Works on fresh load (browser refresh)

**Implementation**:
```typescript
// Add to useInvestigation hook return
const { state, dispatch, saveGame, loadGame, restoredMessages } = useInvestigation(...);

// In App.tsx useEffect (after line 115)
useEffect(() => {
  if (restoredMessages && restoredMessages.length > 0) {
    setInlineMessages(restoredMessages);
  }
}, [restoredMessages]);
```

---

### Task 7: Frontend UI Polish (Height, Brackets, Whitespace, Title Styling)
**File**: `frontend/src/components/LocationView.tsx`, `frontend/src/components/EvidenceBoard.tsx`, `frontend/src/components/WitnessSelector.tsx`, `frontend/src/App.tsx`
**Action**: MODIFY (multiple styling consistency changes)
**Purpose**: Fix visual polish issues and standardize title styling across all sections
**Reference**: Existing Tailwind classes
**Depends on**: None (independent task)
**Acceptance criteria**:
- [ ] LocationView conversation box: `max-h-64` → `max-h-96` (line 326)
- [ ] LocationView title: Remove brackets, uppercase, yellow: `[{locationData.name}]` → `{locationData.name.toUpperCase()}` (line 317)
- [ ] LocationView title styling: `text-green-400` → `text-yellow-400 uppercase` (consistent with other titles)
- [ ] LocationView description: `whitespace-pre-line` → `whitespace-normal` (line 319)
- [ ] EvidenceBoard title: Remove brackets, uppercase: `[Evidence Board]` → `EVIDENCE BOARD` (line 43)
- [ ] EvidenceBoard title styling: Ensure `text-yellow-400 uppercase` (already yellow, add uppercase)
- [ ] WitnessSelector title: Uppercase: `Available Witnesses` → `AVAILABLE WITNESSES` (ensure `text-yellow-400 uppercase`)
- [ ] App.tsx Case Status title: Uppercase: `Case Status` → `CASE STATUS` (ensure `text-yellow-400 uppercase`)
- [ ] App.tsx AUROR ACADEMY: Maintain white color but ensure consistent font (already uppercase, keep `text-white`)
- [ ] All section titles have same font size (text-xl or text-lg consistent)
- [ ] Visual regression check: All titles look uniform, description flows as paragraph
- [ ] No layout breaking

**Implementation**:
```tsx
// LocationView.tsx line 317 - Remove brackets, uppercase, yellow
<h2 className="text-xl font-bold text-yellow-400 uppercase tracking-wide">
  {locationData.name} {/* Removed brackets, changed text-green-400 → text-yellow-400, added uppercase */}
</h2>

// LocationView.tsx line 319 - Single paragraph
<p className="text-sm text-gray-400 mt-1 whitespace-normal leading-relaxed">
  {/* Changed whitespace-pre-line → whitespace-normal */}
  {locationData.description}
</p>

// LocationView.tsx line 326 - Increase height
<div className="mb-4 space-y-3 max-h-96 overflow-y-auto">
  {/* Changed max-h-64 → max-h-96 */}

// EvidenceBoard.tsx line 43 - Remove brackets, uppercase
<h3 className="text-xl font-bold text-yellow-400 uppercase tracking-wide">
  EVIDENCE BOARD {/* Removed brackets, added uppercase, ensure text-xl (not text-lg) */}
</h3>

// WitnessSelector.tsx - Find "Available Witnesses" title, make uppercase
<h3 className="text-xl font-bold text-yellow-400 uppercase tracking-wide">
  AVAILABLE WITNESSES {/* Changed to uppercase, ensure text-yellow-400 */}
</h3>

// App.tsx - Find "Case Status" title, make uppercase
<h3 className="text-xl font-bold text-yellow-400 uppercase tracking-wide">
  CASE STATUS {/* Changed to uppercase, ensure text-yellow-400 */}
</h3>

// App.tsx - AUROR ACADEMY (keep white, ensure consistent font)
<h1 className="text-3xl font-bold text-white tracking-widest">
  AUROR ACADEMY {/* Keep text-white, ensure same font family as other titles */}
</h1>
```

**Note on font consistency**: Verify all titles use the same Tailwind font class (likely default sans-serif). If AUROR ACADEMY uses different font, standardize to match section titles.

---

### Task 8: Backend Tests for Conversation Persistence
**File**: `backend/tests/test_routes.py`
**Action**: CREATE (new test class)
**Purpose**: Verify conversation_history persists through save/load cycle
**Reference**: Existing save/load tests
**Depends on**: Tasks 1-3
**Acceptance criteria**:
- [ ] Test: POST /api/investigate → conversation_history includes player + narrator messages
- [ ] Test: POST /tom/chat → conversation_history includes player + Tom messages
- [ ] Test: POST /tom/auto-comment → conversation_history includes Tom message only
- [ ] Test: Save + Load → conversation_history restored
- [ ] Test: 20 message limit enforced (add 25 messages, verify only last 20 saved)

**Implementation**:
```python
class TestPhase44ConversationPersistence:
    """Test conversation history persistence (Phase 4.4)."""

    async def test_investigate_saves_conversation(self):
        """Test investigate endpoint appends player + narrator to conversation_history."""
        # POST /api/investigate
        # Load state, check conversation_history length increased by 2
        # Verify types: player, narrator
        # Verify text content matches

    async def test_tom_chat_saves_conversation(self):
        """Test Tom chat endpoint appends player + Tom to conversation_history."""
        # Similar pattern

    async def test_conversation_persists_through_save_load(self):
        """Test conversation_history survives save/load cycle."""
        # Investigate → Save → Load → Verify conversation_history intact

    async def test_conversation_history_limit_20_messages(self):
        """Test conversation_history limited to last 20 messages."""
        # Add 25 messages, save, load, verify len = 20
```

---

### Task 9: Frontend Tests for Conversation Restoration
**File**: `frontend/src/hooks/__tests__/useInvestigation.test.ts`
**Action**: MODIFY (add new test cases)
**Purpose**: Verify frontend correctly restores conversation messages
**Reference**: Existing load tests
**Depends on**: Tasks 5-6
**Acceptance criteria**:
- [ ] Test: Load with conversation_history → Messages mapped to Message[] correctly
- [ ] Test: Load with empty conversation_history → No errors
- [ ] Test: Message keys unique and stable
- [ ] Test: Timestamps preserved from backend

---

## Integration Points

### Backend State Flow
**Where**: player_state.py → routes.py → persistence.py
**What**: conversation_history field already exists, add save logic
**Pattern**: Same as evidence/location tracking

### Frontend State Flow
**Where**: App.tsx → useInvestigation.ts → client.ts → backend
**What**: inlineMessages (local state) ↔ conversation_history (backend)
**Pattern**: Save after message creation, restore on load

### Save/Load Cycle
**Where**: Full stack integration
**What**: User investigates → messages saved to backend → load restores to UI
**Pattern**: Follow existing evidence save/load pattern

---

## Known Gotchas

### React State Timing (from project experience)
- **Issue**: State updates may not be immediate for save
- **Solution**: Ensure save triggered after `setInlineMessages` completes (use useEffect or callback)
- **Reference**: Existing save pattern in useInvestigation.ts

### Backend Timestamp Format (from project codebase)
- **Issue**: Python uses seconds, JavaScript uses milliseconds
- **Solution**: Multiply Python timestamp by 1000 before sending to frontend
- **Reference**: `int(datetime.now(UTC).timestamp() * 1000)`

### Empty Conversation History (edge case)
- **Issue**: First load has no conversation_history
- **Solution**: Default to empty list in Pydantic (`Field(default_factory=list)`)
- **Reference**: Already handled in PlayerState line 300

### Message Ordering (from Phase 4.1)
- **Issue**: Messages must appear chronologically (User → Narrator → Tom)
- **Solution**: Sort by timestamp before rendering (already implemented in LocationView.tsx)
- **Reference**: LocationView.tsx line 332 (unifiedMessages sorting)

---

## Validation

### Syntax & Style (Pre-commit)
```bash
# Backend
cd backend
uv run ruff check .
uv run ruff format .
uv run mypy src/
# Expected: No new errors

# Frontend
cd frontend
bun run lint
bun run type-check
# Expected: No new errors
```

### Manual Verification
```bash
# Start servers
cd backend && uv run uvicorn src.main:app --reload
cd frontend && bun run dev

# Test conversation persistence:
1. Load case → Investigate 3 times (see 6 messages: player + narrator)
2. Ask Tom a question (see Tom message)
3. Click "Save Game" button
4. Close browser tab
5. Reopen → Load case
6. ✅ VERIFY: All 7 messages restored in conversation log

# Test UI polish:
7. ✅ VERIFY: Location title displays "HOGWARTS LIBRARY - CRIME SCENE" (no brackets, yellow, uppercase)
8. ✅ VERIFY: Evidence Board title displays "EVIDENCE BOARD" (no brackets, yellow, uppercase)
9. ✅ VERIFY: Available Witnesses title displays "AVAILABLE WITNESSES" (yellow, uppercase)
10. ✅ VERIFY: Case Status title displays "CASE STATUS" (yellow, uppercase)
11. ✅ VERIFY: AUROR ACADEMY displays in white (not yellow) with same font as section titles
12. ✅ VERIFY: All section titles have same font size and styling (except color for AUROR ACADEMY)
13. ✅ VERIFY: Location description flows as single paragraph (no artificial line breaks)
14. ✅ VERIFY: Conversation box height extends to align with Case Status bottom
```

**Note**: validation-gates handles comprehensive testing. No need to specify all test scenarios in PRP.

---

## Dependencies

**New packages**: None - reuse existing React, Pydantic, FastAPI

**Configuration**: No new env vars needed

---

## Out of Scope

- Dynamic conversation box height calculation (using fixed max-h-96 for now)
- Conversation history search/filter (future enhancement)
- Message editing/deletion (not needed)
- Conversation export (Phase 6 feature)

---

## Agent Orchestration Plan

### Execution Strategy

**Sequential Track** (dependencies):
1. `fastapi-specialist` → Backend tasks (Tasks 1-3, 8)
2. `react-vite-specialist` → Frontend tasks (Tasks 4-7, 9)
3. `validation-gates` → Run all tests
4. `documentation-manager` → Update docs

**Why Sequential**: Backend conversation_history save must work before frontend can restore.

### Agent-Specific Guidance

#### For fastapi-specialist
- **Input**: Tasks 1-3 (backend conversation persistence), Task 8 (tests)
- **Context**: Quick Reference section above (no doc reading needed)
- **Pattern**: Follow `add_evidence()` pattern for `add_conversation_message()`
- **Integration**: Append messages in investigate + tom endpoints (2-3 line changes each)
- **Output**: Conversation history persists through save/load

**Key Files to Reference**:
- `backend/src/state/player_state.py` (add method, line 309-313 pattern)
- `backend/src/api/routes.py` (investigate endpoint lines 550-650, tom endpoints 1050-1120)
- Existing `save_state()` calls already persist conversation_history

#### For react-vite-specialist
- **Input**: Tasks 4-7 (frontend restoration + UI polish + title styling), Task 9 (tests)
- **Context**: Quick Reference section (Message type, save/load pattern)
- **Pattern**: Map backend dict → frontend Message type in useInvestigation
- **Integration**: Restore messages in App.tsx on case load
- **UI Changes**: Multiple Tailwind/JSX changes:
  - Brackets removal (2 files)
  - Whitespace normalization (1 file)
  - Conversation height increase (1 file)
  - Title styling consistency: yellow uppercase for all section titles (4 files)
  - AUROR ACADEMY font consistency: white color, same font (1 file)
- **Output**: Conversation restores on load + UI polish complete + consistent title styling

**Key Files to Reference**:
- `frontend/src/hooks/useInvestigation.ts` (lines 130-149 load pattern)
- `frontend/src/App.tsx` (line 108 inlineMessages state, AUROR ACADEMY title, Case Status title)
- `frontend/src/components/LocationView.tsx` (lines 317, 319, 326 - title styling + polish)
- `frontend/src/components/EvidenceBoard.tsx` (line 43 - title styling)
- `frontend/src/components/WitnessSelector.tsx` (title styling)

#### For validation-gates
- **Input**: All code complete
- **Runs**: Backend tests (469+), frontend tests (430+), lint, type check
- **Output**: Pass/fail report
- **Critical test**: Save → Load → Verify conversation_history restored (integration test)

#### For documentation-manager
- **Input**: Code complete, validation passed
- **Files changed**: List from "Files to Create/Modify" section
- **Output**: Updated README (conversation persistence feature), STATUS.md completion entry

### Handoff Context

**Next agent receives**:
- This PRP (full context)
- Quick Reference (no doc reading needed)
- Specific task numbers
- Actual file paths + line numbers
- Pattern files to follow

**Next agent does NOT need**:
- ❌ Read research files
- ❌ Search for integration points (all provided above)
- ❌ Read 5-10 docs (Quick Reference has everything)
- ❌ Explore codebase (file-search-specialist already did this)

---

## Anti-Patterns to Avoid

**From project experience:**
- ❌ Storing conversation in localStorage (use backend for persistence)
- ❌ Unbounded conversation_history growth (limit to 20 messages)
- ❌ Mixing timestamp formats (always milliseconds)
- ❌ Not handling empty conversation_history on first load
- ❌ Forgetting to save Tom messages (auto-comments + direct chat)

---

## Before/After Examples

### Before: Conversation Lost on Reload
```
1. User investigates: "examine desk"
2. Narrator: "You find a hidden note..."
3. Tom: "Someone hid this deliberately..."
4. Save game → Close browser
5. Load game → 💥 Conversation log empty (only evidence board persists)
```

### After: Conversation Persists
```
1. User investigates: "examine desk"
2. Narrator: "You find a hidden note..."
3. Tom: "Someone hid this deliberately..."
4. Save game → Close browser
5. Load game → ✅ All 3 messages restored in Investigation Log
```

### Before: UI Polish Issues
```
Location title: "[Hogwarts Library - Crime Scene]" (green color, brackets)
Evidence Board: "[Evidence Board]" (yellow color, brackets)
Available Witnesses: "Available Witnesses" (inconsistent styling)
Case Status: "Case Status" (lowercase, inconsistent)
AUROR ACADEMY: "AUROR ACADEMY" (different font)
Description: "The library is dark.
Someone left books scattered.
A wand lies on the floor." (artificial line breaks)
Conversation box: 256px height (too short)
```

### After: UI Polish Complete
```
Location title: "HOGWARTS LIBRARY - CRIME SCENE" (yellow, uppercase, no brackets)
Evidence Board: "EVIDENCE BOARD" (yellow, uppercase, no brackets)
Available Witnesses: "AVAILABLE WITNESSES" (yellow, uppercase)
Case Status: "CASE STATUS" (yellow, uppercase)
AUROR ACADEMY: "AUROR ACADEMY" (white, same font as titles)
All titles: Consistent font size (text-xl), same font family
Description: "The library is dark. Someone left books scattered. A wand lies on the floor." (flowing paragraph)
Conversation box: 384px height (better screen usage)
```

---

**Generated**: 2026-01-09
**Source**: File-search-specialist codebase exploration + project documentation
**Confidence Score**: 9/10 (conversation_history field exists, clear integration path, one-pass implementation likely)
**Alignment**: Validated against PLANNING.md Phase 4 goals and game design principles

---

## Unresolved Questions

1. **Conversation history limit**: 20 messages sufficient, or increase to 50? (Current: 20 chosen to prevent unbounded growth)
2. **Dynamic height**: Should conversation box calculate height based on viewport, or fixed max-h-96 acceptable? (Current: Fixed chosen for simplicity)
3. **Message deduplication**: Should backend prevent duplicate consecutive messages? (Current: No, sequential conversation shouldn't have duplicates)
4. **Timestamp source**: Frontend or backend timestamp authoritative? (Current: Backend timestamp recommended for consistency)
5. **Old saves compatibility**: Should old saves without conversation_history field error or default to empty? (Current: Pydantic defaults to empty list automatically)
