# Legilimency Issues: Root Cause Analysis

**Date**: 2026-01-10
**Project Phase**: Phase 4.5 (Magic System)
**Status**: 3 Critical Issues Identified

---

## Executive Summary

Three interconnected bugs prevent Legilimency from functioning as designed:

1. **No narrator warning** - Spell executes immediately via witness interrogation instead of narrator
2. **No evidence description** - Secret ID ("saw_draco") displayed instead of secret text
3. **No relationship degradation** - Trust not penalized after unauthorized mind-reading

**Root Cause**: Spell integration never wired into investigate route. Legilimency currently routes through witness interrogation (wrong system).

---

## Issue 1: No Narrator Warning Before Spell

### Current Behavior
User typed: `"she knows something, i'm using Legilimency on her"`

Result: Spell executed immediately in witness interrogation with no warning prompt.

### Expected Behavior
1. Player types Legilimency intent
2. **Narrator gives conversational warning** (in location context, not witness context)
3. Player must confirm/respond
4. THEN spell effect applies

### Root Cause: Spell Not Routed Through Narrator

**File**: `/Users/danielmedina/Documents/claude_projects/hp_game/backend/src/api/routes.py`
**Lines**: 412-429 (investigate endpoint)

**Current code**:
```python
# Line 413-421: Always calls build_narrator_prompt, never checks for spells
prompt = build_narrator_prompt(
    location_desc=location_desc,
    hidden_evidence=hidden_evidence,
    discovered_ids=discovered_ids,
    not_present=not_present,
    player_input=request.player_input,
    surface_elements=surface_elements,
    conversation_history=state.get_narrator_history_as_dicts(),
)
```

**Problem**:
- Only imports `build_narrator_prompt` (line 42)
- Never calls `build_narrator_or_spell_prompt` (defined but never imported/used)
- Spell detection functions never called: `is_spell_input()`, `parse_spell_from_input()`

### Architecture Gap

**Designed but not integrated**:
- `build_narrator_or_spell_prompt()` exists in narrator.py (lines 205-280)
- Detects spell input via `is_spell_input(player_input)`
- Routes to `build_spell_effect_prompt()` when spell detected
- Returns `(prompt, system_prompt, is_spell_cast)` tuple to indicate spell

**Actual implementation**:
- Spell detection functions defined in spell_llm.py
- Never called from routes.py
- Spell routing never happens

### How It Should Work (Per PRP/Design)

From `/Users/danielmedina/Documents/claude_projects/hp_game/PRPs/phase4.5-magic-system.md` lines 73-90:

**Risky Spell Flow (Legilimency - Natural Narrator Warning)**:
1. Player types: "cast Legilimency on witness"
2. Narrator: "Legilimency on an unwilling subject risks backlash. Are you certain?" ← **MISSING**
3. Player responds yes/confirms
4. Narrator determines outcome (based on Occlumency skill)

### Files Involved

1. **routes.py (line 42)**: Missing spell imports
   ```python
   from src.context.narrator import build_narrator_prompt, build_system_prompt
   # MISSING: build_narrator_or_spell_prompt
   ```

2. **routes.py (line 413)**: Always narrates, never checks for spells
   ```python
   prompt = build_narrator_prompt(...)  # Never conditional
   ```

3. **narrator.py (lines 205-280)**: Spell router defined but never called
   ```python
   def build_narrator_or_spell_prompt(...) -> tuple[str, str, bool]:
       # Lines 218-227: Detects spell input
       if is_spell_input(player_input):
           # Routes to spell_llm.py
   ```

4. **spell_llm.py (lines 342-352)**: Detection functions never called
   ```python
   def is_spell_input(player_input: str) -> bool:
   def parse_spell_from_input(player_input: str) -> tuple[str | None, str | None]:
   ```

### Fix Required

**Routes.py investigate endpoint**:
1. Import `build_narrator_or_spell_prompt` from narrator.py
2. Replace `build_narrator_prompt()` call with `build_narrator_or_spell_prompt()`
3. Check return tuple's third value (`is_spell_cast`)
4. If spell detected: narrator response contains warning, wait for player confirmation
5. If spell confirmed: LLM narrates outcome on next turn

---

## Issue 2: No Evidence Description

### Current Behavior

Secret revealed ID only: `"saw_draco"`

Expected description missing:
```
"I saw Draco Malfoy near the window at 9:00pm. He was casting
something - the frost pattern on the glass looked just like his
wand signature. I didn't say anything because... I was afraid
of retaliation."
```

### Root Cause: Two-Part Failure

#### Part A: Witness Interrogation Reveals ID Not Text

**File**: `/Users/danielmedina/Documents/claude_projects/hp_game/backend/src/api/routes.py`
**Lines**: 867-877 (evidence presentation in witness interrogation)

**Current code**:
```python
if secrets_revealed:
    # Get secret text for revealed secrets
    secret_texts = []
    for secret in secrets:
        if secret.get("id") in secrets_revealed:
            secret_texts.append(secret.get("text", "").strip())

    prompt = f"""You are {witness_name}. The investigator has shown you evidence: {evidence_id}.

This evidence has triggered you to reveal a secret:
{chr(10).join(secret_texts)}
```

**Issue**:
- `secret_texts` built correctly (line 871-872)
- Passed to LLM in prompt (line 877)
- BUT: `InterrogateResponse` only returns `secrets_revealed: list[str]` (IDs only)

**File**: `/Users/danielmedina/Documents/claude_projects/hp_game/backend/src/api/routes.py`
**Lines**: 906-911 (witness response model)

```python
return InterrogateResponse(
    response=witness_response,
    trust=witness_state.trust,
    trust_delta=trust_bonus,
    secrets_revealed=secrets_revealed,  # ← Returns IDs only
)
```

#### Part B: Frontend Displays Raw Secret ID

**File**: `/Users/danielmedina/Documents/claude_projects/hp_game/frontend/src/hooks/investigation.ts`
**InterrogateResponse type**:

```typescript
export interface InterrogateResponse {
  response: string;           // Witness text
  trust: number;
  trust_delta: number;
  secrets_revealed: string[];  // ← Just IDs: ["saw_draco"]
}
```

Frontend receives just `secrets_revealed: ["saw_draco"]` and has no way to look up the text.

### Architecture Issue

**Design assumption**: Secret text embedded in witness response by LLM

**Actual problem**:
- LLM sees secret text and incorporates into natural response ✓
- But witness response already contains natural narrative
- Frontend also receives raw ID `["saw_draco"]`
- No structured data mapping ID → text in response

### Where Secret Text Lives

**File**: `/Users/danielmedina/Documents/claude_projects/hp_game/backend/src/case_store/case_001.yaml`
**Lines**: 178-188

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

**Problem**: Frontend never has access to this text. Only `secrets_revealed: ["saw_draco"]` returned.

### What Works vs. What Doesn't

✓ Witness LLM sees full secret text (lines 871-872 in routes.py)
✓ LLM incorporates into natural response
✓ Full response returned to frontend
✗ InterrogateResponse only includes secret IDs, not texts
✗ Frontend has no way to map `"saw_draco"` → actual text
✗ Shows raw ID instead of narrative

### Fix Required

**Option A (Frontend Display)**:
- Change InterrogateResponse to include secret descriptions
- Return: `secrets_revealed: [{id: "saw_draco", text: "I saw Draco..."}]`
- Requires: Backend to load secret text from YAML, frontend to display

**Option B (Natural Narrative)**:
- Keep current design: LLM incorporates secret text naturally in response
- Remove ID display entirely
- Trust that witness_response contains the actual secret revelation
- Simpler, already works (LLM does good job)

---

## Issue 3: No Relationship Degradation

### Current Behavior

**Trust before Legilimency**: 50%
**User action**: "i'm using Legilimency on her"
**Trust after**: Still 50% (NO penalty)

Expected: Trust reduced to ~35-40% (unauthorized mind-reading damage)

### Root Cause: Legilimency Routed Through Witness Interrogation

When user types Legilimency in interrogation, it's treated as a normal question.

**File**: `/Users/danielmedina/Documents/claude_projects/hp_game/backend/src/api/routes.py`
**Lines**: 781-784 (witness interrogation trust adjustment)

```python
# Adjust trust based on question tone
trust_delta = adjust_trust(request.question, witness.get("personality", ""))
witness_state.adjust_trust(trust_delta)
```

**Problem**:
- Calls `adjust_trust()` which analyzes tone (aggressive/empathetic/neutral)
- Input: "she knows something, i'm using Legilimency on her"
- Tone analysis doesn't specifically handle Legilimency
- No special penalty for unauthorized mind-reading

### How It Should Work (Per Design)

**File**: `/Users/danielmedina/Documents/claude_projects/hp_game/backend/src/context/spell_llm.py`
**Lines**: 194-220 (Legilimency rules)

```python
IMPORTANT: Using Legilimency without consent is ethically questionable.
Moody values trust and proper conduct - unauthorized mind-reading could
damage your relationship with him and make suspects hostile.

...

Include flags in your response if applicable: [FLAG: relationship_damaged]
```

**Design intent**:
1. Narrator detects Legilimency
2. Gives warning about ethical risks
3. If player confirms unauthorized attempt
4. Narrator response includes `[FLAG: relationship_damaged]`
5. Backend extracts flag and penalizes trust

### The Flag Extraction Problem

**Flag defined**: `[FLAG: relationship_damaged]` in spell_llm.py prompt (line 220)

**Flag extraction**: NEVER HAPPENS

**File**: `/Users/danielmedina/Documents/claude_projects/hp_game/backend/src/api/routes.py`
**Lines**: 430-446 (evidence extraction from response)

```python
# Extract evidence from response
new_evidence: list[str] = []

# If we pre-matched evidence, ensure it's added
if matching_evidence:
    evidence_id = matching_evidence["id"]
    ...

# Also check for evidence tags in LLM response
response_evidence = extract_evidence_from_response(narrator_response)
for eid in response_evidence:
    ...
```

**Problem**: Only extracts `[EVIDENCE: id]` tags, never extracts spell outcome flags:
- `[FLAG: relationship_damaged]` - Never checked
- `[FLAG: mental_strain]` - Never checked

### Missing Implementations

1. **No flag extraction function**:
   - `extract_evidence_from_response()` exists (extracts `[EVIDENCE: ...]`)
   - No equivalent for `[FLAG: ...]`

2. **No flag → trust penalty mapping**:
   - Even if flag extracted, no code applies trust penalty to relevant witness

3. **Spell outcome not integrated**:
   - spell_llm.py defines outcomes
   - But spell response never flows back to update witness state

### How It Should Work

**routes.py investigate endpoint** (if spell fix applied):

```python
# After getting spell effect response from narrator
if is_spell_cast:
    # Check for spell outcome flags
    if "[FLAG: relationship_damaged]" in narrator_response:
        # Apply trust penalty to target witness
        target_witness_id = parse_spell_target(request.player_input)
        target_witness_state = state.get_witness_state(target_witness_id)
        target_witness_state.adjust_trust(-15)  # Penalty for unauthorized mind-reading
        state.update_witness_state(target_witness_state)
```

### Files Involved

1. **spell_llm.py (line 220)**: Flag instruction in prompt
   ```python
   Include flags in your response if applicable: [FLAG: relationship_damaged]
   or [FLAG: mental_strain]
   ```

2. **routes.py (lines 430-446)**: Evidence extraction, no flag extraction
   ```python
   response_evidence = extract_evidence_from_response(narrator_response)
   # No: response_flags = extract_flags_from_response(narrator_response)
   ```

3. **routes.py (entire investigate endpoint)**: Spell outcome never processed
   ```python
   # Is spell cast? Where's is_spell_cast used?
   # (It's the 3rd return value from build_narrator_or_spell_prompt)
   ```

### Critical Gap

The flag system is **designed** (in prompts) but **never implemented** (in code):
- ✓ Prompt tells LLM to include flags
- ✓ LLM would include flags in response
- ✗ Routes.py never extracts flags
- ✗ Witness state never updated
- ✗ No trust penalty applied

---

## Integration Points: How 3 Issues Connect

### Data Flow Issue 1: Spell Detection Missing

```
Player input: "i'm using Legilimency on her"
    ↓
routes.py investigate() [LINE 413]
    ↓
build_narrator_prompt() ← ❌ WRONG (should check for spell first)
    ↓
Claude LLM narrates as normal location description
    ↓
Witness interrogation treats it as question about "her"
```

**Should be**:
```
Player input: "i'm using Legilimency on her"
    ↓
routes.py investigate() [LINE 413]
    ↓
is_spell_input(player_input) ✓ YES, it's Legilimency
    ↓
build_narrator_or_spell_prompt() ← Route to spell system
    ↓
build_spell_effect_prompt() for Legilimency
    ↓
Claude narrates: "Legilimency on unwilling subject risks backlash. Are you certain?"
```

### Data Flow Issue 2: Secret Text Loss

```
Witness interrogation detects secret trigger
    ↓
_handle_evidence_presentation() [LINE 867]
    ↓
secret_texts = [secret.get("text") for secret in secrets]  ✓ Text retrieved
    ↓
LLM prompt includes full secret text ✓
    ↓
LLM response incorporates naturally ✓
    ↓
InterrogateResponse(secrets_revealed=["saw_draco"]) ← ❌ ID only
    ↓
Frontend receives ["saw_draco"], has no YAML to look up text
```

### Data Flow Issue 3: Flag Never Extracted

```
If spell were working (Issue 1 fixed):
    ↓
Narrator response includes: "[FLAG: relationship_damaged]"
    ↓
routes.py investigate() [LINE 442]
    ↓
response_evidence = extract_evidence_from_response(narrator_response)
    ↓
Only checks for [EVIDENCE: ...] tags, NOT [FLAG: ...] ❌
    ↓
Flag ignored, no trust penalty applied
    ↓
Witness trust unchanged (Issue 3)
```

---

## Summary Table

| Issue | Root Cause | Location | Fix Complexity |
|-------|-----------|----------|-----------------|
| **1. No Warning** | Spell never routed through narrator system | routes.py:42-413, narrator.py unused | HIGH - requires routes integration |
| **2. No Description** | Secret ID returned instead of text | routes.py:906-911, InterrogateResponse | MEDIUM - could fix frontend display or rely on LLM narrative |
| **3. No Trust Penalty** | Flag extraction never implemented | routes.py:442, spell outcome ignored | HIGH - requires flag parsing + witness state update |

---

## Files Involved (Complete List)

### Backend Files

| File | Lines | Issue | Type |
|------|-------|-------|------|
| `/backend/src/api/routes.py` | 42 | 1 | Missing import of `build_narrator_or_spell_prompt` |
| `/backend/src/api/routes.py` | 413-429 | 1 | Always calls `build_narrator_prompt`, never checks for spells |
| `/backend/src/api/routes.py` | 442-446 | 3 | Only extracts `[EVIDENCE: ...]`, not `[FLAG: ...]` |
| `/backend/src/api/routes.py` | 867-911 | 2 | Returns secret IDs only, not descriptions |
| `/backend/src/context/narrator.py` | 205-280 | 1 | `build_narrator_or_spell_prompt()` defined but never called |
| `/backend/src/context/spell_llm.py` | 169-221 | 3 | Legilimency rules + flags defined; never extracted |
| `/backend/src/context/spell_llm.py` | 342-352 | 1 | `is_spell_input()`, `parse_spell_from_input()` defined but never used |

### Frontend Files

| File | Issue | Type |
|------|-------|------|
| `/frontend/src/types/investigation.ts` | 2 | InterrogateResponse includes secret IDs, could include descriptions |
| `/frontend/src/hooks/investigation.ts` | 2 | Frontend receives only IDs, has no way to look up text |

### YAML Files

| File | Issue | Type |
|------|-------|------|
| `/backend/src/case_store/case_001.yaml` | 2 | Secret text lives here (lines 178-188), frontend never accesses |

---

## Designed vs. Implemented

### Phase 4.5 Magic System - What Was Designed

From `/PRPs/phase4.5-magic-system.md`:

**Designed Architecture** (lines 73-90):
- Text-only spell casting
- Narrator detects spell input
- Natural warnings (not modal prompts)
- LLM-driven risk outcomes
- Dynamic trust penalty on unauthorized spell use

**Status**: ✓ Designed, ✗ Integrated

### Spell LLM System - What Was Built

From `/backend/src/context/spell_llm.py`:

**Built**:
- ✓ Spell definitions (definitions.py)
- ✓ Legilimency prompt section (spell_llm.py)
- ✓ Warning instructions (spell_llm.py lines 206-207)
- ✓ Outcome flags (spell_llm.py line 220)

**Missing**:
- ✗ Integration into investigate route
- ✗ Flag extraction logic
- ✗ Trust penalty application

### What Tests Cover

From `/backend/tests/test_spell_llm.py`:

- ✓ Legilimency section generation (lines 147-189)
- ✓ Warning prompts work
- ✓ Occlumency skill routing works
- ✓ Flag tags appear in prompt output
- ✗ (Tests don't verify routes integration)
- ✗ (Tests don't verify flag extraction)
- ✗ (Tests don't verify trust updates)

---

## Recommendations

### Short-term (Tactical)

1. **Don't use Legilimency in current version** - System incomplete
2. **Use witness interrogation for secrets** - Already works (Issue 2 mitigated)
3. **Trust system works via evidence/tone** - Not spell-dependent

### Medium-term (Fix Phase 4.5)

1. **Issue 1 (Warning)**: Add spell detection to investigate route
   - Import `build_narrator_or_spell_prompt`
   - Replace `build_narrator_prompt` call with conditional routing
   - Effort: 2-3 hours

2. **Issue 2 (Description)**: Choose fix approach
   - Option A: Return full secret text in response (requires YAML lookup)
   - Option B: Trust LLM narrative (already works, simpler)
   - Effort: 1-2 hours (Option B simpler)

3. **Issue 3 (Penalty)**: Implement flag extraction
   - Add `extract_flags_from_response()` function
   - Apply trust penalties based on flags
   - Effort: 2-3 hours

### Long-term (Future Polish)

- Spell interactions with multiple witnesses
- Cumulative relationship effects
- Occlumency skill progression
- Legal/ethics system around restricted spells

