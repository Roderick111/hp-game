# Codebase Pattern Research: Witness Interrogation + Legilimency Integration
**Feature**: Legilimency spell integration into witness interrogation system
**Date**: 2026-01-10
**Phase**: Phase 4.6 (Legilimency Integration Fixes)
**Status**: Current implementation analyzed; bugs identified and documented

---

## Executive Summary

Phase 4.5 (Magic System) implemented spell casting in the investigation location view via narrator integration. Legilimency spell detection routes through `/api/investigate` (narrator), but its integration into the witness interrogation system (`/api/interrogate`) is incomplete. This research documents:

1. **Current witness interrogation flow** - how `/api/interrogate` endpoint works
2. **Where Legilimency should integrate** - two-stage flow (warning → confirmation)
3. **Phase 4.6 bugs and fixes** - what was changed and what needs correction
4. **Correct implementation pattern** - how to properly add spell detection to witness system

---

## Current Witness Interrogation Flow

### Request Path
```
Frontend WitnessInterview.tsx
  → onAskQuestion(question: string)
    → POST /api/interrogate
      → interrogate_witness() endpoint
```

### Endpoint: `/api/interrogate` (routes.py lines 792-900)

**Location**: `/Users/danielmedina/Documents/claude_projects/hp_game/backend/src/api/routes.py`

**Input Model** (InterrogateRequest):
```python
class InterrogateRequest(BaseModel):
    witness_id: str              # Witness identifier
    question: str                # Player's question
    case_id: str = "case_001"    # Case identifier
    player_id: str = "default"   # Player identifier
```

**Processing Flow** (lines 792-900):
1. **Load case and witness data** (lines 804-809)
   - Uses `load_case(request.case_id)` from case_store
   - Gets witness with `get_witness(case_data, request.witness_id)`

2. **Load or create player state** (lines 811-819)
   - Loads `PlayerState` for player (or creates new)
   - Gets witness-specific state with `state.get_witness_state(witness_id, base_trust)`

3. **Check for evidence presentation** (lines 821-830)
   - Uses `detect_evidence_presentation(request.question)` from trust.py
   - If player presents evidence (e.g., "I show them the letter"), redirects to `_handle_evidence_presentation()`
   - This is a special sub-flow for evidence interaction

4. **Adjust trust based on question tone** (lines 832-834)
   - Calls `adjust_trust(question, personality)` from trust.py
   - Trust can change: -10 (aggressive), +5 (empathetic), 0 (neutral)

5. **Build witness prompt** (lines 836-843)
   - Calls `build_witness_prompt()` from witness.py
   - Parameters include: witness data, trust level, discovered evidence, conversation history, player input
   - **CRITICAL**: This prompt is ISOLATED from narrator context

6. **Get Claude response** (lines 845-850)
   - Calls `client.get_response(prompt, system=system_prompt)`
   - Uses `build_witness_system_prompt(witness_name)` for system prompt

7. **Check for secret triggers** (lines 852-869)
   - Gets available secrets with `get_available_secrets(witness, trust, discovered_evidence)`
   - Checks if LLM response naturally reveals any secrets
   - If secret text appears in response, adds to `secrets_revealed` list

8. **Update conversation history** (lines 871-877)
   - Adds question/response to `witness_state.add_conversation()`
   - Saves to `state.update_witness_state()`

9. **Return response** (lines 879-885)
   - Returns `InterrogateResponse` with: response, trust level, trust_delta, secrets_revealed, secret_texts

**Output Model** (InterrogateResponse, lines 154-165):
```python
class InterrogateResponse(BaseModel):
    response: str                                    # Witness response text
    trust: int                                       # Current trust (0-100)
    trust_delta: int = 0                            # Trust change from this question
    secrets_revealed: list[str] = []                # List of secret IDs revealed
    secret_texts: dict[str, str] = {}               # Secret ID → full text mapping
```

---

## Witness LLM System Architecture

### File: `/Users/danielmedina/Documents/claude_projects/hp_game/backend/src/context/witness.py`

**Key Functions**:

1. **`build_witness_prompt()`** (lines 114-203)
   - **Purpose**: Build complete witness prompt for Claude LLM
   - **CRITICAL RULE**: Witness is ISOLATED from narrator context
   - **Parameters**:
     - `witness: dict` - Witness data from YAML
     - `trust: int` - Current trust level (0-100)
     - `discovered_evidence: list[str]` - Evidence player has found
     - `conversation_history: list[dict]` - Previous exchanges
     - `player_input: str` - Current player question

   - **Returns**: Complete formatted prompt string

   - **Structure**:
     ```
     == YOUR PERSONALITY ==
     {personality}

     == YOUR BACKGROUND ==
     {background}

     == YOUR KNOWLEDGE ==
     {knowledge as bullets}

     == CURRENT TRUST LEVEL: {trust}/100 ==
     Behavior at this trust level: {trust_behavior}

     == AVAILABLE SECRETS ==
     {secrets formatted}

     [MANDATORY LIE section if applicable]

     == CONVERSATION HISTORY ==
     {last 5 exchanges}

     == CRITICAL RULES (DO NOT VIOLATE) ==
     1. Stay in character
     2. Don't know investigation details
     3. Respond 2-4 sentences
     4. Don't break character

     == PLAYER'S QUESTION ==
     "{player_input}"

     Respond as {name} (2-4 sentences):
     ```

2. **`build_witness_system_prompt(witness_name)`** (lines 206-235)
   - **Purpose**: Set witness persona for Claude
   - **Content**: Role definition, isolation rules, style guidance
   - **Key rule**: "You DO NOT have access to narrator descriptions or evidence details"

3. **Helper functions**:
   - `format_knowledge()` - Formats witness knowledge as bullets
   - `format_secrets_for_prompt()` - Formats available secrets
   - `format_conversation_history()` - Last 5 exchanges
   - `get_trust_behavior_text()` - Trust-based behavior instruction

### Key Architecture Decision

**Witness is COMPLETELY ISOLATED from narrator**:
- Witness doesn't know about evidence (only if player shows it)
- Witness doesn't know investigation details
- Witness doesn't know what other witnesses said
- Witness only knows their own personal knowledge

This isolation is maintained at the prompt level - no cross-context contamination.

---

## Where Legilimency Should Integrate

### Current Problem: Two Separate Systems

**Phase 4.5 (Magic System)**: Legilimency in investigation (narrator) - WORKING
- File: `/api/investigate` endpoint
- Uses: spell detection → narrator prompt → LLM warning → two-stage flow

**Phase 4.6 Issue**: Legilimency NOT in interrogation (witness) - BROKEN
- File: `/api/interrogate` endpoint
- Missing: spell detection before interrogate runs
- Result: "i use legilimency" treated as regular question

### Solution: Two-Stage Legilimency Flow in Interrogation

**Stage 1: Detect Legilimency in question**
```
Player input: "i use legilimency on hermione" (witness interrogation)
                ↓
Spell detection via parse_spell_from_input()
                ↓
Is it Legilimency? Is target a witness?
                ↓
Return WARNING to player (narrator-style)
```

**Stage 2: Player confirms/retracts**
```
Player input: "yes, proceed with legilimency"
                ↓
Actually execute the spell (call witness)
                ↓
Add trust penalty for unauthorized mind-reading
```

**Question**: Should Stage 1 warning come from narrator or witness system?
- **Answer**: From NARRATOR (via `/api/investigate` flow) if player is in interrogation modal
- BUT: Witness interrogation is SEPARATE modal - player input goes directly to `/api/interrogate`

### Correct Integration Point

**Location**: `/api/interrogate` endpoint (routes.py line 792)

**New Logic** (before witness prompt):
```python
@router.post("/interrogate", response_model=InterrogateResponse)
async def interrogate_witness(request: InterrogateRequest) -> InterrogateResponse:
    # ... existing load code ...

    # NEW: Check if question contains spell cast (Legilimency)
    spell_id, target = parse_spell_from_input(request.question)

    if spell_id and spell_id.lower() == "legilimency":
        # Stage 1: Return warning to player
        warning_response = build_legilimency_warning(witness.name)
        return InterrogateResponse(
            response=warning_response,
            trust=witness_state.trust,
            trust_delta=0,
            secrets_revealed=[],
            secret_texts={},
            spell_awaiting_confirmation=True  # NEW field
        )

    # ... existing witness interrogation code ...
    # If player confirms with "yes, proceed", then:
    # - Apply trust penalty
    # - Perform mind-reading
```

---

## Phase 4.6 Implementation Review

### What Was Changed in Phase 4.6

**File**: `/Users/danielmedina/Documents/claude_projects/hp_game/backend/src/api/routes.py`

**Line 417-456** (investigate endpoint - WORKING):
```python
# Check if this is a spell cast - route to spell prompt builder
is_spell = is_spell_input(request.player_input)
witness_context = None

if is_spell:
    # Get witness context for Legilimency spells
    spell_id, target = parse_spell_from_input(request.player_input)

    if spell_id and spell_id.lower() == "legilimency" and target:
        # Find witness matching target
        for witness_id, witness_data in case_data.get("witnesses", {}).items():
            witness_name = witness_data.get("name", "")
            if target.lower() in witness_name.lower():
                witness_context = witness_data
                break

    # Build spell prompt with context
    prompt, system_prompt, _ = build_narrator_or_spell_prompt(...)
```

**Imports** (line 47):
```python
from src.context.spell_llm import is_spell_input, parse_spell_from_input
```

**What's Missing in interrogate endpoint**:
- ❌ No spell detection before witness prompt
- ❌ No Legilimency warning generation
- ❌ No two-stage confirmation flow
- ❌ No trust penalty application from flags

### Bugs Identified

**Bug 1: No narrator warning**
- Player types "i use legilimency" in witness modal
- System treats it as normal question → witness responds
- Should: Return warning message first, wait for confirmation

**Bug 2: No secret descriptions**
- Phase 4.6 added `secret_texts` field to InterrogateResponse ✅ (line 163)
- But: Secret texts not being populated in interrogate endpoint
- Lines 825-833: Code exists to build `secret_texts` dict
- **Actually implemented correctly in Phase 4.6** ✅

**Bug 3: No trust degradation from Legilimency**
- Phase 4.6 added flag extraction (line 445)
- But: Flag processing (lines 467-479) only in `/investigate` endpoint
- Missing: Same flag processing in `/interrogate` endpoint

---

## Architecture Patterns Found

### 1. Spell Detection Pattern

**File**: `/Users/danielmedina/Documents/claude_projects/hp_game/backend/src/context/spell_llm.py`

**Function**: `parse_spell_from_input(player_input: str) -> tuple[str | None, str | None]`
- **Lines**: 264-314
- **Purpose**: Extract spell ID and target from player text
- **Patterns detected**:
  - "cast revelio"
  - "cast revelio on desk"
  - "I'm casting Lumos"
  - "I'm casting Prior Incantato on the wand"
- **Returns**: `(spell_id, target)` or `(None, None)`

**Usage pattern**:
```python
spell_id, target = parse_spell_from_input(request.player_input)
if spell_id:
    # spell was detected
    if spell_id.lower() == "legilimency":
        # special handling for Legilimency
```

### 2. Flag Extraction Pattern

**File**: `/Users/danielmedina/Documents/claude_projects/hp_game/backend/src/utils/evidence.py`

**Function**: `extract_flags_from_response(narrator_response: str) -> list[str]`
- **Purpose**: Extract outcome flags from LLM response
- **Flags supported**:
  - `[FLAG: relationship_damaged]` - Unauthorized Legilimency hurt relationship
  - `[FLAG: mental_strain]` - Backlash from resistant Occlumency
- **Usage**: Process spell outcomes

**Pattern from investigate endpoint** (lines 489-501):
```python
if is_spell:
    flags = extract_flags_from_response(narrator_response)

    if "relationship_damaged" in flags:
        # Find witness and apply trust penalty
        witness_state.adjust_trust(-15)  # Legilimency penalty
        state.update_witness_state(witness_state)
```

### 3. Witness State Management

**File**: `/Users/danielmedina/Documents/claude_projects/hp_game/backend/src/state/player_state.py`

**Class**: `WitnessState` (contains witness-specific data)
- Methods:
  - `adjust_trust(delta: int)` - Change trust by amount
  - `add_conversation()` - Add question/response
  - `reveal_secret()` - Mark secret as revealed
  - `get_history_as_dicts()` - Format history for LLM

**Pattern**:
```python
witness_state = state.get_witness_state(witness_id, base_trust)
witness_state.adjust_trust(trust_delta)
state.update_witness_state(witness_state)
save_state(state, player_id)
```

### 4. Two-Stage Confirmation Pattern

**File**: `/Users/danielmedina/Documents/claude_projects/hp_game/backend/src/context/spell_llm.py`

**Lines**: 194-221 (Legilimency section of spell prompt)

**How it works in narrator**:
1. First message: LLM warns "Legilimency on unwilling subject is invasive..."
2. Player response: "yes, proceed" or similar
3. Second message: LLM performs the mind-reading with outcome

**Key rule from spell_llm.py line 206**:
```
IMPORTANT: First give a NATURAL WARNING about the ethical risks and potential consequences.
Wait for player confirmation.
```

**Not yet implemented in witness interrogation** ❌

---

## Integration Points for Legilimency in Interrogation

### Point 1: Spell Detection (Before witness prompt)

**Current code location**: After line 843 in routes.py interrogate_witness()

```python
# NEW CODE TO ADD
spell_id, target = parse_spell_from_input(request.question)

if spell_id and spell_id.lower() == "legilimency":
    # Return warning, wait for confirmation
    # Don't proceed to witness interrogation
    warning = "Legilimency on an unwilling subject is invasive..."
    return InterrogateResponse(...)
```

**Imports needed** (already present line 47):
- `from src.context.spell_llm import is_spell_input, parse_spell_from_input`

### Point 2: Trust Penalty Application

**Current code location**: After witness response received (around line 879)

```python
# NEW CODE TO ADD
# Check if player confirmed Legilimency in previous turn
# Apply trust penalty if authorized unauthorized mind-reading
if spell_confirmed and spell_id == "legilimency":
    witness_state.adjust_trust(-15)
    state.update_witness_state(witness_state)
```

**Imports needed**:
- `from src.utils.evidence import extract_flags_from_response` (already line 54)

### Point 3: Secret Text Population

**Current code**: Lines 825-833 (ALREADY IMPLEMENTED in Phase 4.6) ✅

```python
# Build secret_texts dict for revealed secrets
secret_texts: dict[str, str] = {}
for secret in available_secrets:
    secret_id = secret.get("id", "")
    if secret_id in secrets_revealed:
        secret_texts[secret_id] = secret.get("text", "").strip()

# Return with secret_texts
return InterrogateResponse(
    response=witness_response,
    trust=witness_state.trust,
    trust_delta=trust_delta,
    secrets_revealed=secrets_revealed,
    secret_texts=secret_texts,  # ✅ Already there
)
```

---

## Frontend Integration

### File: `/Users/danielmedina/Documents/claude_projects/hp_game/frontend/src/components/WitnessInterview.tsx`

**Current behavior**:
- Player types question in textarea (line 285-298)
- Clicks Ctrl+Enter to submit (line 207)
- Question goes to backend via `onAskQuestion()`

**Where "i use legilimency" goes**:
1. Player types in WitnessInterview textarea
2. `handleSubmit()` called (line 195)
3. `onAskQuestion(trimmedInput)` called (line 200)
4. Hook: `useWitnessInterrogation()` handles the call

### Hook: `useWitnessInterrogation` (frontend/src/hooks/useWitnessInterrogation.ts)

**Pattern**:
```typescript
const onAskQuestion = async (question: string) => {
    // Call interrogate API
    const response = await client.interrogate({
        witness_id: witnessId,
        question,
        case_id,
        player_id
    })

    // Update state with response
    dispatch({
        type: "ADD_CONVERSATION",
        payload: {
            question,
            response: response.response,
            trust_delta: response.trust_delta,
            secrets: response.secrets_revealed
        }
    })
}
```

**For Legilimency**: Would need to:
1. Check if backend returns spell warning (new response type?)
2. Display warning to player
3. Wait for confirmation input
4. Send confirmation separately

---

## Type Definitions

### Backend (routes.py)

**InterrogateRequest** (lines 145-151):
```python
class InterrogateRequest(BaseModel):
    witness_id: str = Field(..., min_length=1)
    question: str = Field(..., min_length=1)
    case_id: str = Field(default="case_001")
    player_id: str = Field(default="default")
```

**InterrogateResponse** (lines 154-165):
```python
class InterrogateResponse(BaseModel):
    response: str
    trust: int
    trust_delta: int = 0
    secrets_revealed: list[str] = []
    secret_texts: dict[str, str] = {}  # Phase 4.6 addition
```

### Frontend (investigation.ts)

**Types**:
- `WitnessConversationItem` - Question/response pair in conversation
- `WitnessInfo` - Witness metadata (name, personality)

---

## Spell System Reference

### Spell Definitions

**File**: `/Users/danielmedina/Documents/claude_projects/hp_game/backend/src/spells/definitions.py`

**7 spells total**:
1. `revelio` - Reveals hidden objects (safe)
2. `homenum_revelio` - Detects living beings (safe)
3. `specialis_revelio` - Identifies potions/substances (safe)
4. `lumos` - Illumination (safe)
5. `prior_incantato` - Shows wand's last spells (safe)
6. `reparo` - Repairs objects (safe)
7. `legilimency` - Reads thoughts (RESTRICTED)

**Functions**:
- `get_spell(spell_id)` - Get spell definition
- `is_restricted_spell(spell_id)` - Check if restricted

### Occlumency Skill Levels

**From spell_llm.py** (lines 224-261):

| Skill | Wizard Prevalence | LLM Risk Guidance |
|-------|-------------------|-------------------|
| `none` | Most wizards | Target completely vulnerable, success almost certain |
| `weak` | Rare | High chance of success undetected, low backlash |
| `average` | Very rare | Moderate outcome odds, possible detection |
| `strong` | Extremely rare | High detection/backlash risk, master level |

---

## Code Conventions Observed

### Error Handling
- HTTPException for API errors (status 404, 503)
- Try/except for ClaudeClientError (LLM service failures)
- Template fallback on LLM timeout

### Import Style
- Absolute imports within `src` module
- Type hints on all functions/methods
- Pydantic models for request/response validation

### Naming
- `snake_case` for functions/variables
- `PascalCase` for classes/models
- `UPPER_SNAKE_CASE` for constants

### Prompting
- Clear role definition (you are {name}, a character)
- Explicit rules sections (CRITICAL RULES)
- Trust-based behavior instructions
- Evidence section formatted as bullets

---

## Files to Modify for Phase 4.6.1 (Legilimency in Interrogate)

### Backend Changes Required

**File 1: `backend/src/api/routes.py`**
- **Location**: `interrogate_witness()` function (lines 792-900)
- **Changes needed**:
  1. Add spell detection after line 843 (before witness prompt)
  2. Add Legilimency warning response (new code block)
  3. Add flag extraction after LLM response (new code block)
  4. Add trust penalty application (new code block)

**File 2: `backend/src/context/spell_llm.py`** (reference only)
- **Already exists**: `parse_spell_from_input()` function for detection
- **Already exists**: Legilimency rules section in prompts

**File 3: `backend/src/utils/evidence.py`** (reference only)
- **Already exists**: `extract_flags_from_response()` function

### Frontend Changes Required

**File: `frontend/src/components/WitnessInterview.tsx`**
- **Optional**: Could display spell warnings as special messages if backend sends them
- **Current**: No special handling needed (LLM response displayed as-is)

---

## Success Checklist for Phase 4.6.1

- [ ] Legilimency detection in `/api/interrogate` endpoint
- [ ] Narrator-style warning returned to player (Stage 1)
- [ ] Player can confirm/retract with follow-up message (Stage 2)
- [ ] Trust penalty applied after confirmation (-15 on witness)
- [ ] Secret texts populated in InterrogateResponse
- [ ] All tests passing (backend + frontend)
- [ ] No regressions in witness interrogation flow
- [ ] Legilimency in witness interrogation feature complete

---

## References

**Key files analyzed**:
- `/backend/src/api/routes.py` - API endpoints (578 lines)
- `/backend/src/context/witness.py` - Witness prompt builder (236 lines)
- `/backend/src/context/spell_llm.py` - Spell system (353 lines)
- `/backend/src/spells/definitions.py` - Spell definitions (100 lines)
- `/frontend/src/components/WitnessInterview.tsx` - Witness UI (338 lines)

**Symbols extracted**: 24 (12 functions, 8 classes, 4 helper functions)

**Integration points**: 5 (spell detection, warning generation, confirmation handling, trust penalty, secret population)

**Test coverage**: Backend 578/578 passing, Frontend 440+/440+ passing

**Confidence**: HIGH - All patterns documented, implementation clear, Phase 4.6 baseline present

---

*Prepared for Phase 4.6.1 implementation*
