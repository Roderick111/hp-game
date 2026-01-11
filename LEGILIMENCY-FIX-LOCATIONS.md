# Legilimency Issues: Fix Locations & Code References

## Issue 1: No Narrator Warning - Fix Map

### Step 1: Add Missing Import
**File**: `backend/src/api/routes.py`
**Current (Line 42)**:
```python
from src.context.narrator import build_narrator_prompt, build_system_prompt
```

**Change to**:
```python
from src.context.narrator import build_narrator_or_spell_prompt, build_narrator_prompt, build_system_prompt
```

**Also add these imports** (for spell detection):
```python
from src.context.spell_llm import is_spell_input, parse_spell_from_input
```

---

### Step 2: Integrate Spell Detection in Investigate Route
**File**: `backend/src/api/routes.py`
**Location**: Lines 407-429 (investigate endpoint)

**Current code**:
```python
# Check for evidence triggers
matching_evidence = find_matching_evidence(
    request.player_input, hidden_evidence, discovered_ids
)

# Build narrator prompt with conversation history
prompt = build_narrator_prompt(
    location_desc=location_desc,
    hidden_evidence=hidden_evidence,
    discovered_ids=discovered_ids,
    not_present=not_present,
    player_input=request.player_input,
    surface_elements=surface_elements,
    conversation_history=state.get_narrator_history_as_dicts(),
)

# Get Claude response
try:
    client = get_client()
    system_prompt = build_system_prompt()
    narrator_response = await client.get_response(prompt, system=system_prompt)
```

**Replace with**:
```python
# Check for evidence triggers
matching_evidence = find_matching_evidence(
    request.player_input, hidden_evidence, discovered_ids
)

# Check if this is a spell cast
is_spell = is_spell_input(request.player_input)

# Build appropriate prompt (narrator or spell)
if is_spell:
    # Get witness context for Legilimency (if applicable)
    spell_id, target = parse_spell_from_input(request.player_input)
    witness_context = None
    if spell_id and spell_id.lower() == "legilimency" and target:
        # Find witness matching target
        for witness_id, witness_data in case_data.get("witnesses", {}).items():
            if target.lower() in witness_data.get("name", "").lower():
                witness_context = witness_data
                break

    # Build spell prompt with location context
    location_context = {
        "description": location_desc,
        "spell_contexts": location.get("spell_contexts", {}),
        "hidden_evidence": hidden_evidence,
    }
    player_context = {"discovered_evidence": discovered_ids}

    prompt, system_prompt, _ = build_narrator_or_spell_prompt(
        location_desc=location_desc,
        hidden_evidence=hidden_evidence,
        discovered_ids=discovered_ids,
        not_present=not_present,
        player_input=request.player_input,
        surface_elements=surface_elements,
        conversation_history=state.get_narrator_history_as_dicts(),
        spell_contexts=location.get("spell_contexts"),
        witness_context=witness_context,
    )
else:
    # Regular narrator prompt
    prompt = build_narrator_prompt(
        location_desc=location_desc,
        hidden_evidence=hidden_evidence,
        discovered_ids=discovered_ids,
        not_present=not_present,
        player_input=request.player_input,
        surface_elements=surface_elements,
        conversation_history=state.get_narrator_history_as_dicts(),
    )
    system_prompt = build_system_prompt()

# Get Claude response
try:
    client = get_client()
    narrator_response = await client.get_response(prompt, system=system_prompt)
```

---

## Issue 2: No Evidence Description - Fix Options

### Option A: Return Full Secret Text (Better UX)
**File**: `backend/src/api/routes.py`
**Location**: Lines 802-833 (interrogate_witness endpoint)

**Current response model** (lines 828-833):
```python
return InterrogateResponse(
    response=witness_response,
    trust=witness_state.trust,
    trust_delta=trust_delta,
    secrets_revealed=secrets_revealed,  # ← List of IDs only
)
```

**Step 1: Extend InterrogateResponse model**
**File**: `backend/src/api/routes.py`
**Location**: Lines 121-130 (InterrogateResponse model)

**Current**:
```python
class InterrogateResponse(BaseModel):
    """Response from interrogation endpoint."""

    response: str
    trust: int
    trust_delta: int
    secrets_revealed: list[str]
```

**Change to**:
```python
class InterrogateResponse(BaseModel):
    """Response from interrogation endpoint."""

    response: str
    trust: int
    trust_delta: int
    secrets_revealed: list[str]
    secret_texts: dict[str, str] = Field(default_factory=dict)  # ← Add this
```

**Step 2: Populate secret_texts in interrogate endpoint**
**Location**: Lines 802-833

**Before return statement, add**:
```python
# Get full secret texts for frontend display
secret_texts = {}
for secret in witness.get("secrets", []):
    if secret.get("id") in secrets_revealed:
        secret_texts[secret.get("id")] = secret.get("text", "").strip()

# Return with secret texts
return InterrogateResponse(
    response=witness_response,
    trust=witness_state.trust,
    trust_delta=trust_delta,
    secrets_revealed=secrets_revealed,
    secret_texts=secret_texts,  # ← New field
)
```

**Step 3: Update frontend type**
**File**: `frontend/src/types/investigation.ts`
**Location**: InterrogateResponse interface

**Add**:
```typescript
export interface InterrogateResponse {
  response: string;
  trust: number;
  trust_delta: number;
  secrets_revealed: string[];
  secret_texts?: Record<string, string>;  // ← Add this
}
```

**Step 4: Display in frontend**
**File**: Frontend component using InterrogateResponse
**Add section**:
```tsx
{response.secret_texts && Object.entries(response.secret_texts).map(([id, text]) => (
  <div key={id} className="italic text-amber-200">
    "{text}"
  </div>
))}
```

---

### Option B: Simplest - Just Remove ID Display
**Files**: Any frontend component showing `secrets_revealed`

**Current**: Shows `["saw_draco"]`

**Change**: Don't display `secrets_revealed` list at all

**Rationale**: LLM already incorporates secret text naturally in witness response. The ID list is redundant if we trust the LLM narrative (which is good).

---

## Issue 3: No Relationship Degradation - Fix Map

### Step 1: Add Flag Extraction Function
**File**: `backend/src/utils/evidence.py` (or new `backend/src/utils/flags.py`)

**Add function**:
```python
def extract_flags_from_response(response: str) -> list[str]:
    """Extract spell outcome flags from narrator response.

    Looks for patterns like [FLAG: relationship_damaged] or [FLAG: mental_strain]

    Args:
        response: LLM narrator response

    Returns:
        List of flag names found (e.g., ["relationship_damaged"])
    """
    import re

    flags = []
    pattern = r'\[FLAG:\s*(\w+)\]'
    matches = re.findall(pattern, response)
    flags.extend(matches)

    return flags
```

### Step 2: Process Flags in Investigate Route
**File**: `backend/src/api/routes.py`
**Location**: After getting narrator response (around line 429)

**Add before saving state**:
```python
# Check for spell outcome flags
flags = extract_flags_from_response(narrator_response)

# Handle relationship damage (applies to target witness)
if "relationship_damaged" in flags:
    spell_id, target = parse_spell_from_input(request.player_input)
    if spell_id and target:
        # Find witness matching target
        base_trust = witness.get("base_trust", 50)
        witness_state = state.get_witness_state(target, base_trust)
        witness_state.adjust_trust(-15)  # Penalty for unauthorized mind-reading
        state.update_witness_state(witness_state)

# Handle mental strain (applies to player, future feature)
if "mental_strain" in flags:
    # Future: track player mental health or morale penalty
    pass
```

### Step 3: Import Flag Extraction
**File**: `backend/src/api/routes.py`
**Location**: Line 46-50 (imports from utils)

**Add to imports**:
```python
from src.utils.evidence import (
    check_already_discovered,
    extract_evidence_from_response,
    extract_flags_from_response,  # ← Add this
    find_matching_evidence,
    find_not_present_response,
)
```

---

## Summary: Minimum Changes Required

### Issue 1 (Warning): 4 Changes
1. Line 42: Add import of `build_narrator_or_spell_prompt`, `is_spell_input`, `parse_spell_from_input`
2. Lines 407-429: Replace `build_narrator_prompt()` with conditional routing
3. Add witness_context lookup for Legilimency
4. Pass spell context to `build_narrator_or_spell_prompt()`

### Issue 2 (Description): 2-4 Changes (pick option)
**Option A**: 4 changes (extend response model, populate in endpoint, update frontend type, display in UI)
**Option B**: 1 change (don't display secrets_revealed list)

### Issue 3 (Penalty): 3 Changes
1. Add `extract_flags_from_response()` function
2. Line 46-50: Import flag extraction
3. Post-response: Check for flags and apply trust penalties

---

## Testing After Fixes

### Test Issue 1 (Warning)
```
1. Load game
2. Type: "I'm casting Legilimency on Hermione"
3. Narrator should respond with warning (not attack)
4. Verify response contains "risks backlash" or similar
5. Verify response asks for confirmation
```

### Test Issue 2 (Description)
```
1. Present frost_pattern evidence to Hermione
2. Secret "saw_draco" revealed
3. Verify response includes full secret text (Draco at window)
4. If Option A: Verify frontend shows secret description
```

### Test Issue 3 (Penalty)
```
1. Check Hermione trust = 50 (baseline)
2. Type: "I'm casting Legilimency on Hermione"
3. Confirm spell (yes/do it/etc)
4. Check Hermione trust = 35 (after -15 penalty)
5. Verify [FLAG: relationship_damaged] in narrator response
```

---

## Code Locations Quick Reference

| Issue | File | Lines | Type |
|-------|------|-------|------|
| 1 | routes.py | 42 | Import |
| 1 | routes.py | 407-429 | Logic |
| 1 | narrator.py | 205-280 | (Already done, just needs to be called) |
| 2A | routes.py | 121-130 | Model |
| 2A | routes.py | 802-833 | Logic |
| 2A | investigation.ts | - | Type |
| 2B | Any frontend component | - | Display logic |
| 3 | utils/evidence.py | - | New function |
| 3 | routes.py | 46-50 | Import |
| 3 | routes.py | ~445 | Logic |

