# Tom Conversation Memory Analysis

## Problem Statement

Tom currently has no memory of past conversations. Each response is isolated, leading to:
- **Repetitions**: Asking same questions multiple times
- **Unnatural dialogue**: No reference to previous exchanges
- **Lost context**: Player asks follow-up, Tom doesn't remember original question

Example broken flow:
```
Player: "Tom, what do you think about the frost?"
Tom: "Frost on OUTSIDE of window. Where was spell cast from?"
Player: "I think it was cast from inside."
Tom: "Frost on OUTSIDE of window. Where was spell cast from?" [REPEATS]
```

---

## Current Architecture

### Message Storage (✅ Already Works)

**Location**: `backend/src/state/player_state.py`

```python
class InnerVoiceState(BaseModel):
    conversation_history: list[dict[str, str]] = Field(default_factory=list)

    def add_tom_comment(self, user_msg: str | None, tom_response: str) -> None:
        self.conversation_history.append({
            "user": user_msg or "[auto-comment]",
            "tom": tom_response,
            "timestamp": _utc_now().isoformat(),
        })
```

**Storage format**:
```json
{
  "user": "Tom, what do you think about the frost?",
  "tom": "Frost on OUTSIDE of window. Where was spell cast from?",
  "timestamp": "2024-01-09T12:34:56.789Z"
}
```

✅ Tom messages are already being saved to `InnerVoiceState.conversation_history`
✅ Both auto-comments and direct chat are tracked
✅ Timestamps are recorded

### Message Retrieval (✅ Already Works)

**Endpoint**: `POST /api/case/{case_id}/tom/auto-comment`
**Endpoint**: `POST /api/case/{case_id}/tom/chat`

Both endpoints:
1. Load `PlayerState` from save file
2. Get `InnerVoiceState` via `state.get_inner_voice_state()`
3. Access `inner_voice_state.conversation_history`

✅ Conversation history is available in both endpoints
✅ History persists across sessions via save/load

### LLM Prompt Building (❌ Gap Found)

**File**: `backend/src/context/tom_llm.py`

**Current function signature**:
```python
def build_context_prompt(
    case_context: dict[str, Any],
    evidence_discovered: list[dict[str, Any]],
    user_message: str | None = None,
) -> str:
```

**❌ Missing parameter**: `conversation_history`

**Current prompt structure**:
```
CASE FACTS (what you know):
Victim: ...
Suspects: ...
Witnesses: ...

EVIDENCE DISCOVERED SO FAR:
- Evidence 1
- Evidence 2

PLAYER'S QUESTION TO YOU:
"Tom, what do you think?"
```

**❌ No conversation history section**

### LLM Call (❌ Gap Found)

**File**: `backend/src/api/routes.py`

```python
response_text, mode_used = await generate_tom_response(
    case_context=case_context,
    evidence_discovered=evidence_discovered,
    trust_level=inner_voice_state.trust_level,
    mode=None,
    user_message=request.message,
)
```

**❌ Not passing**: `inner_voice_state.conversation_history`

---

## Gap Analysis

| Component | Current State | Required State |
|-----------|---------------|----------------|
| **Message storage** | ✅ Working | ✅ No changes needed |
| **Message retrieval** | ✅ Working | ✅ No changes needed |
| **History formatting** | ❌ Missing | ⚠️ Need to add function |
| **Prompt building** | ❌ No history | ⚠️ Need to add parameter |
| **LLM call** | ❌ Not passing history | ⚠️ Need to pass history |
| **Token budget** | ⚠️ Unknown impact | ⚠️ Need to analyze |

---

## Token Budget Analysis

### Current Prompt Size

**System prompt**: ~2400 tokens (Tom's character, psychology, rules)
**Context prompt**: ~200-400 tokens (case facts, evidence, player message)
**Total**: ~2600-2800 tokens (user-side only)

**Max tokens**: 120 (response limit)

**Total request**: ~2800 + 120 = ~2920 tokens per call

### Conversation History Impact

**Conversation format** (3 exchanges):
```
RECENT CONVERSATION (last 3 exchanges):
Player: "Tom, what do you think about the frost?"
Tom: "Frost on OUTSIDE of window. Where was spell cast from?"

Player: "I think it was cast from inside."
Tom: "Check the sill for residue. Proof matters more than theory."

Player: "Found scorch marks inside."
Tom: "There's your answer. Evidence over instinct."
```

**Estimated tokens per exchange**: ~40-60 tokens
**3 exchanges**: ~120-180 tokens
**5 exchanges**: ~200-300 tokens

### Proposed Token Budget

| Component | Current | With 3 exchanges | With 5 exchanges |
|-----------|---------|------------------|------------------|
| System prompt | 2400 | 2400 | 2400 |
| Context prompt | 200-400 | 200-400 | 200-400 |
| Conversation history | 0 | 120-180 | 200-300 |
| Response | 120 | 120 | 120 |
| **Total** | **2720-2920** | **2840-3100** | **2920-3220** |

**Recommendation**: Start with **last 3 exchanges** (~150 tokens added)
**Safety margin**: 3100 tokens well within Claude Haiku 4.5 limits (200k context)
**Future scaling**: Can increase to 5 exchanges if needed

---

## Proposed Solution

### Design Principles

1. **Minimal changes**: Reuse existing storage, add history to prompts
2. **Token-efficient**: Format conversation concisely
3. **No breaking changes**: Backward compatible with saves without history
4. **Witness-pattern**: Follow existing `witness.py` conversation history approach

### Implementation Changes

#### 1. Add History Formatting Function

**File**: `backend/src/context/tom_llm.py`

**New function** (similar to `witness.py:format_conversation_history`):
```python
def format_tom_conversation_history(history: list[dict[str, str]]) -> str:
    """Format Tom's conversation history for prompt.

    Args:
        history: List of exchanges from InnerVoiceState.conversation_history

    Returns:
        Formatted conversation history string
    """
    if not history:
        return "No previous conversation"

    # Take last 3 exchanges (most recent)
    recent = history[-3:]

    lines = []
    for exchange in recent:
        user_msg = exchange.get("user", "")
        tom_msg = exchange.get("tom", "")

        # Skip auto-comments (no player input)
        if user_msg == "[auto-comment]":
            lines.append(f"Tom (earlier): {tom_msg}")
        else:
            lines.append(f"Player: {user_msg}")
            lines.append(f"Tom: {tom_msg}")
            lines.append("")  # Blank line between exchanges

    return "\n".join(lines).strip()
```

#### 2. Update `build_context_prompt`

**File**: `backend/src/context/tom_llm.py`

**Modified signature**:
```python
def build_context_prompt(
    case_context: dict[str, Any],
    evidence_discovered: list[dict[str, Any]],
    conversation_history: list[dict[str, str]],  # NEW
    user_message: str | None = None,
) -> str:
```

**Modified body**:
```python
def build_context_prompt(
    case_context: dict[str, Any],
    evidence_discovered: list[dict[str, Any]],
    conversation_history: list[dict[str, str]],
    user_message: str | None = None,
) -> str:
    """Build context message for Tom's response.

    Args:
        case_context: Case facts (victim, location, suspects, witnesses)
        evidence_discovered: List of evidence dicts with descriptions
        conversation_history: Previous exchanges with Tom  # NEW
        user_message: If player directly asked Tom something

    Returns:
        Formatted context prompt
    """
    # ... existing evidence/suspect formatting ...

    context = f"""CASE FACTS (what you know):
Victim: {case_context.get("victim", "Unknown")}
Location: {case_context.get("location", "Unknown")}
Suspects: {suspects_str}
Witnesses: {witnesses_str}

EVIDENCE DISCOVERED SO FAR:
{evidence_str}

RECENT CONVERSATION (last 3 exchanges):
{format_tom_conversation_history(conversation_history)}
"""

    # ... rest of function unchanged ...
```

#### 3. Update `generate_tom_response`

**File**: `backend/src/context/tom_llm.py`

**Modified signature**:
```python
async def generate_tom_response(
    case_context: dict[str, Any],
    evidence_discovered: list[dict[str, Any]],
    trust_level: float,
    conversation_history: list[dict[str, str]],  # NEW
    mode: str | None = None,
    user_message: str | None = None,
) -> tuple[str, str]:
```

**Modified body**:
```python
    # Build prompts
    system_prompt = build_tom_system_prompt(trust_level, mode)
    user_prompt = build_context_prompt(
        case_context,
        evidence_discovered,
        conversation_history,  # NEW
        user_message
    )
```

#### 4. Update API Endpoints

**File**: `backend/src/api/routes.py`

**Both endpoints** (`tom_auto_comment` and `tom_direct_chat`):

```python
# OLD
response_text, mode_used = await generate_tom_response(
    case_context=case_context,
    evidence_discovered=evidence_discovered,
    trust_level=inner_voice_state.trust_level,
    mode=None,
    user_message=request.message,  # or None for auto-comment
)

# NEW
response_text, mode_used = await generate_tom_response(
    case_context=case_context,
    evidence_discovered=evidence_discovered,
    trust_level=inner_voice_state.trust_level,
    conversation_history=inner_voice_state.conversation_history,  # NEW
    mode=None,
    user_message=request.message,  # or None for auto-comment
)
```

#### 5. Update Tests

**File**: `backend/tests/test_tom_llm.py`

All test calls to `generate_tom_response` need to add `conversation_history=[]`:

```python
# OLD
response, mode = await generate_tom_response(
    case_context=mock_context,
    evidence_discovered=mock_evidence,
    trust_level=0.5,
)

# NEW
response, mode = await generate_tom_response(
    case_context=mock_context,
    evidence_discovered=mock_evidence,
    trust_level=0.5,
    conversation_history=[],  # NEW (empty for tests)
)
```

---

## Implementation Tasks

### Task 1: Add History Formatting Function
**File**: `backend/src/context/tom_llm.py`
**Action**: CREATE `format_tom_conversation_history()`
**Reference**: `backend/src/context/witness.py:format_conversation_history()`
**Lines**: ~20 lines

**Acceptance criteria**:
- [ ] Function accepts `list[dict[str, str]]`
- [ ] Returns last 3 exchanges formatted as string
- [ ] Handles auto-comments (`[auto-comment]`) gracefully
- [ ] Returns "No previous conversation" if empty

---

### Task 2: Update `build_context_prompt`
**File**: `backend/src/context/tom_llm.py`
**Action**: MODIFY function signature and body
**Lines**: ~10 lines changed

**Acceptance criteria**:
- [ ] Add `conversation_history` parameter
- [ ] Call `format_tom_conversation_history()` in prompt
- [ ] Insert history between evidence and player message sections
- [ ] Maintain existing prompt structure

---

### Task 3: Update `generate_tom_response`
**File**: `backend/src/context/tom_llm.py`
**Action**: MODIFY function signature and call
**Lines**: ~5 lines changed

**Acceptance criteria**:
- [ ] Add `conversation_history` parameter
- [ ] Pass to `build_context_prompt()`
- [ ] No other logic changes

---

### Task 4: Update API Endpoints
**File**: `backend/src/api/routes.py`
**Action**: MODIFY two endpoints (`tom_auto_comment`, `tom_direct_chat`)
**Lines**: ~4 lines changed (2 per endpoint)

**Acceptance criteria**:
- [ ] Pass `inner_voice_state.conversation_history` to LLM call
- [ ] Both auto-comment and direct chat updated
- [ ] No other changes to endpoints

---

### Task 5: Update Tests
**File**: `backend/tests/test_tom_llm.py`
**Action**: MODIFY all test calls to `generate_tom_response`
**Lines**: ~10 lines changed

**Acceptance criteria**:
- [ ] All test calls add `conversation_history=[]`
- [ ] Tests pass with empty history
- [ ] No test logic changes needed

---

### Task 6: Add Integration Test
**File**: `backend/tests/test_tom_llm.py`
**Action**: CREATE new test for conversation memory
**Lines**: ~30 lines

**Acceptance criteria**:
- [ ] Test multiple exchanges build conversation history
- [ ] Verify last 3 exchanges are formatted correctly
- [ ] Verify auto-comments vs player messages handled correctly
- [ ] Mock LLM response validates history in prompt

---

## Token Budget Verification

### Pre-Implementation Check
- [ ] Measure current prompt size (baseline)
- [ ] Calculate history size with 3 exchanges
- [ ] Verify total < 4000 tokens (safe margin)

### Post-Implementation Check
- [ ] Log actual prompt sizes in production
- [ ] Monitor for any 429 rate limit errors
- [ ] Track response quality with history vs without

---

## Before/After Examples

### Before (No Memory)

```
Player: "Tom, what do you think about the frost?"
Tom: "Frost on OUTSIDE of window. Where was spell cast from?"

[Player investigates]

Player: "I found scorch marks inside."
Tom: "Frost on OUTSIDE of window. Where was spell cast from?"  ❌ REPEATS
```

### After (With Memory)

```
Player: "Tom, what do you think about the frost?"
Tom: "Frost on OUTSIDE of window. Where was spell cast from?"

[Player investigates]

Player: "I found scorch marks inside."
Tom: "Inside scorch marks, outside frost. That's your answer. Evidence, not theory."  ✅ REMEMBERS
```

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Token overflow** | LLM failure | Start with 3 exchanges, monitor token count |
| **Breaking changes** | Save compatibility | History defaults to empty list (backward compatible) |
| **Performance degradation** | Slower responses | History formatting is O(n) but n=3 (negligible) |
| **Test failures** | CI/CD breaks | Update all tests with `conversation_history=[]` |

---

## Success Criteria

### Functional
- [ ] Tom references past conversation in follow-ups
- [ ] No repetition of same comment within 3 exchanges
- [ ] Auto-comments and player messages both tracked
- [ ] Conversation persists across sessions (save/load)

### Technical
- [ ] All tests pass
- [ ] Token budget < 4000 per request
- [ ] No breaking changes to existing API
- [ ] Backward compatible with old saves

### User Experience
- [ ] Natural dialogue flow (feels like conversation)
- [ ] Tom acknowledges player's previous questions
- [ ] Follow-up questions work correctly
- [ ] No noticeable latency increase

---

## Out of Scope (Future Enhancements)

- **Configurable history length**: Hardcode 3 exchanges for now, make configurable later
- **Conversation summarization**: If history grows large, summarize old exchanges
- **Sentiment tracking**: Track emotional tone of conversation for trust adjustments
- **Context-aware history pruning**: Only include relevant exchanges (requires semantic search)

---

## Confidence Score: 9/10

**High confidence** because:
- ✅ Storage and retrieval already working
- ✅ Clear pattern exists in `witness.py` to follow
- ✅ Token budget has plenty of headroom
- ✅ No data model changes needed
- ✅ Minimal code changes (6 files, ~80 lines total)

**Risk**: LLM response quality with history (mitigated by keeping history short)

---

**Generated**: 2026-01-09
**Next Steps**: Implement Task 1-6 sequentially, test after each task
