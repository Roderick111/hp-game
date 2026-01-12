# Phase 4.6.2: Programmatic Legilimency in Witness Interrogation - Product Requirement Plan

**Date**: 2026-01-11
**Phase**: 4.6.2
**Status**: READY FOR IMPLEMENTATION
**Estimated Effort**: 4-6 hours
**Confidence**: 9/10 (clear replacement of Phase 4.6.1 approach, Python handles randomization)

---

## Goal

Replace Phase 4.6.1's two-stage Legilimency flow with **single-call, programmatic outcome calculation**. Python backend calculates detection (80% chance), evidence success (60% focused / 30% unfocused), and trust penalties (random from [5, 10, 15, 20]) via `random` module. LLM narrates predetermined outcome only (storytelling, no probability calculations).

**End State**: Player types "use legilimency on hermione" → instant response with programmatically-calculated outcome (no confirmation step, no state tracking between calls).

---

## Why

### User Impact
- **Faster gameplay**: Single call, no confirmation step (Phase 4.6.1 was too slow)
- **Clear outcomes**: Programmatic calculation (80% detection) not LLM guessing
- **Consistent penalties**: Trust penalties [5, 10, 15, 20] steps (not arbitrary)
- **Natural narrative**: LLM tells story, Python handles mechanics

### Business Value
- **Game design alignment**: Obra Dinn model (no hand-holding, instant consequences)
- **Educational**: Demonstrates programmatic design > LLM for game mechanics
- **Scalability**: Pattern reusable for other risky actions

### Integration
- **Replaces Phase 4.6.1**: Removes two-stage flow (`awaiting_spell_confirmation` state)
- **Uses existing**: spell_llm.py functions (is_spell_input, parse_spell_from_input)
- **Backend only**: No frontend changes (witness modal unchanged)

### Alignment
- **PLANNING.md Phase 4.6**: Legilimency integration fixes
- **Game design**: Moody's philosophy ("Actions have consequences, recruit")
- **Magic system**: Restricted spell with programmatic outcomes

---

## What

### User-Visible Behavior

**Scenario 1: Focused Search (60% success rate)**
```
Player: "use legilimency to find out about the wand"

Backend:
  - Detects focused intent: target="about the wand"
  - Rolls detection: 0.62 (62% < 80%) → DETECTED
  - Rolls evidence: 0.43 (43% < 60%) → SUCCESS
  - Rolls penalty: random.choice([10, 15]) → 15
  - Builds narration prompt with outcome="detected_with_evidence"

Response (LLM narrates):
  "You push into her mind. Flash: Draco at window, 9pm, frost pattern...
  'GET OUT!' Hermione screams, clutching her head. 'You're in my HEAD!'"

Result:
  - Trust 50 → 35 (-15)
  - Secret revealed in narrative
  - NO separate evidence list
```

**Scenario 2: Unfocused Search (30% success rate)**
```
Player: "use legilimency on her"

Backend:
  - No specific target detected
  - Rolls detection: 0.92 (92% > 80%) → UNDETECTED
  - Rolls evidence: 0.85 (85% > 30%) → FAILURE
  - Penalty: 0 (undetected)
  - Builds narration prompt with outcome="undetected_no_evidence"

Response (LLM narrates):
  "You slip into her mind unnoticed. Thoughts flit past - Potions essay,
  breakfast, a boy named Viktor... nothing case-related. She shivers,
  uneasy but unaware."

Result:
  - Trust 50 → 50 (no penalty)
  - No secrets revealed
  - Witness unaware
```

### Technical Requirements

**Backend Changes (3 files)**:
1. `spell_llm.py`: Add `detect_focused_legilimency()` + `build_legilimency_narration_prompt()`
2. `routes.py`: Add Legilimency detection logic to `/api/interrogate` endpoint (~line 830)
3. Test files: validation-gates creates tests

**No Frontend Changes**: Existing witness modal handles narrator-style responses

**No State Changes**: Remove `awaiting_spell_confirmation` field (backward compatible)

### Success Criteria

**Detection Performance**:
- [ ] Keyword scan takes <1ms (performance test)
- [ ] Fuzzy match takes <2ms (performance test)
- [ ] 95% of interrogations have <1ms detection overhead (no spell)
- [ ] Typo "legulemancy" detected correctly
- [ ] Phrase "read her mind" detected correctly
- [ ] Non-spell "What did you see?" NOT detected (no false positives)

**Spell Mechanics**:
- [ ] Type "use legilimency on hermione" → instant response (no warning)
- [ ] 80% of attempts result in detection + witness outrage
- [ ] 20% of attempts undetected + no trust penalty
- [ ] Focused searches ("to find out about X") have 60% evidence success
- [ ] Unfocused searches ("use legilimency") have 30% evidence success
- [ ] Detected cases apply penalty from [5, 10, 15, 20]
- [ ] Evidence appears naturally in narrator text (not separate list)

**Technical Quality**:
- [ ] All 585+ backend tests passing
- [ ] No state schema changes (backward compatible)
- [ ] rapidfuzz dependency added correctly

---

## Context & References

### Project Documentation

**From PLANNING.md**:
- Phase 4.5: Magic system (7 spells, Legilimency restricted)
- Phase 4.6: Legilimency integration fixes (two-stage flow in investigate endpoint)
- Phase 4.6.1: Extended to interrogate endpoint (two-stage flow rejected)
- **Phase 4.6.2** (this): Replace with single-call programmatic approach

**From game design**:
- Moody's philosophy: "Constant vigilance" (actions have instant consequences)
- No hand-holding: Obra Dinn model (player decides, game responds)
- Magic system: Restricted spell with clear risk/reward

**From STATUS.md**:
- Phase 4.6.1 complete (two-stage flow working but too slow for interrogation context)
- 585 backend tests passing (100%)
- Ready for Phase 4.6.2 implementation

### Research Sources

**From phase4.6-legilimency-fixes.md**:
- Two-stage flow pattern: warning → confirmation
- Flag extraction: `[FLAG: relationship_damaged]` → -15 trust
- Secret revelation pattern: LLM naturally incorporates text

**From routes.py (lines 792-1159)**:
- `/api/interrogate` endpoint structure
- Evidence presentation check (~line 830)
- Spell detection stub (~line 854)
- `_handle_legilimency_confirmation()` function (lines 1036-1159) - DELETE THIS

**From spell_llm.py**:
- `is_spell_input()` (line 342): Detects spell casting
- `parse_spell_from_input()` (line 264): Extracts spell + target
- Legilimency prompt template (lines 169-221): 4 outcome structure

**Alignment Notes**:
- ✅ Two-stage flow works but wrong for interrogation context
- ⚠️ Phase 4.6.1 added state complexity (`awaiting_spell_confirmation`)
- ✅ Programmatic approach simpler and faster (this phase)

---

## Quick Reference (Pre-Digested Context)

### Spell Detection Strategy (Two-Stage: Keyword + Fuzzy)

**Problem**: LLM-based detection (`is_spell_input()`) requires API call per interrogation. **Wasteful** - 95% of questions don't mention spells.

**Solution**: Two-stage detection (fast, free, typo-tolerant)

```python
from rapidfuzz import fuzz
import random

# =============================================
# STAGE 1: Keyword Pre-Filter (0.1ms, catches 95%)
# =============================================
def contains_legilimency_keywords(text: str) -> bool:
    """Quick keyword scan - instant, zero cost."""
    text_lower = text.lower()

    keywords = [
        "legilimen",  # Catches "legilimency", "legilimens"
        "mind",       # "read mind", "in my mind"
        "thought",    # "read thoughts", "peek thoughts"
        "memor",      # "memories", "memory"
        "read her",   # "read her mind"
        "peek",       # "peek into"
        "search",     # "search her thoughts"
    ]

    return any(keyword in text_lower for keyword in keywords)

# =============================================
# STAGE 2: Fuzzy Matching (1ms, only if Stage 1 passed)
# =============================================
def detect_legilimency_fuzzy(text: str) -> bool:
    """
    Fuzzy match spell name to handle typos.
    Only called if keyword pre-filter passed.

    Handles:
    - "legulemancy" (typo) → 82% similarity → MATCH
    - "legilimens" (variant) → 85% similarity → MATCH
    - "legitimate" → 64% similarity → NO MATCH
    """
    text_lower = text.lower()

    # Direct fuzzy match against "legilimency"
    if fuzz.partial_ratio(text_lower, "legilimency") > 80:
        return True

    # Check for semantic phrases
    semantic_phrases = [
        "read mind",
        "read her mind",
        "read his mind",
        "peek thoughts",
        "search memories",
    ]

    for phrase in semantic_phrases:
        if phrase in text_lower:
            return True

    return False

# =============================================
# COMBINED FLOW
# =============================================
# In /api/interrogate endpoint (after evidence check):

# Stage 1: Quick keyword scan (95% exit here)
if not contains_legilimency_keywords(request.question):
    # No spell keywords → continue to normal interrogation
    # 0 extra cost, 0.1ms latency
    pass
else:
    # Stage 2: Fuzzy match (5% of cases reach here)
    if detect_legilimency_fuzzy(request.question):
        # Legilimency detected → execute spell flow
        # Continue to programmatic outcome calculation...
```

**Performance Characteristics**:
- **95% of cases** (no spell): 0.1ms keyword scan → exit → 0 API calls
- **4% of cases** (spell with keywords): 0.1ms + 1ms fuzzy → 0 API calls
- **1% edge cases**: Could add LLM fallback (not in v1)

**Detection Examples**:

✅ **Handles Typos**:
- "use legulemancy on hermione" → DETECTED (82% similarity)
- "cast legilimens" → DETECTED (85% similarity)
- "legilimency" → DETECTED (100% match)

✅ **Handles Semantic Phrases**:
- "I want to read her mind" → DETECTED (keyword "mind" + phrase "read mind")
- "let me peek into her thoughts" → DETECTED (keyword "thought" + phrase "peek thoughts")
- "search her memories" → DETECTED (keyword "memor" + phrase "search memories")

❌ **Rejects Non-Spells**:
- "What did you see?" → NO MATCH (no keywords)
- "She seems legitimate" → NO MATCH (64% similarity, below 80%)
- "I think she's lying" → NO MATCH (no keywords)

### Core Mechanics (Programmatic)

```python
import random

# Detection rate: 80% chance witness notices intrusion
detected = random.random() < 0.8

# Evidence success rates:
focused, search_target = detect_focused_legilimency(question)  # Regex extracts target
if focused:
    evidence_found = random.random() < 0.6  # 60% success
else:
    evidence_found = random.random() < 0.3  # 30% success

# Trust penalties (ONLY if detected):
if detected:
    penalty = random.choice([5, 10, 15, 20])  # Steps of 5
    witness_state.adjust_trust(-penalty)
else:
    penalty = 0  # No penalty if undetected
```

### 4 Outcome Types

| Outcome | Detected | Evidence | Trust Penalty | Narration Focus |
|---------|----------|----------|---------------|-----------------|
| **detected_with_evidence** | Yes | Yes | 10-20 | Secret + outrage ("You're in my HEAD!") |
| **detected_no_evidence** | Yes | No | 5-15 | Mundane thoughts + outrage ("GET OUT!") |
| **undetected_with_evidence** | No | Yes | 0 | Secret + vague unease (shivers, doesn't know why) |
| **undetected_no_evidence** | No | No | 0 | Random thoughts + vague unease |

### Focused vs Unfocused Detection

```python
def detect_focused_legilimency(question: str) -> tuple[bool, str | None]:
    """Extract focused search intent via regex.

    Patterns:
      - "use legilimency to find out about X"
      - "legilimency looking for X"
      - "legilimency about X"

    Returns:
        (is_focused, search_target)
    """
    import re

    patterns = [
        r"to find out about (.+)",
        r"looking for (.+)",
        r"about (.+)",
        r"to (?:learn|discover|see) (.+)",
    ]

    question_lower = question.lower()
    for pattern in patterns:
        match = re.search(pattern, question_lower)
        if match:
            target = match.group(1).strip()
            return True, target

    return False, None

# Example:
# "use legilimency to find out about the wand" → (True, "the wand")
# "use legilimency on her" → (False, None)
```

### Narration Prompt Template Structure

```python
def build_legilimency_narration_prompt(
    witness: dict,
    available_secrets: list[dict],
    outcome: str,  # One of 4 outcome types
    focused: bool,
    search_target: str | None,
) -> str:
    """Build prompt for LLM to narrate predetermined outcome.

    LLM does NOT calculate probabilities - just tells story.
    Python already determined: detected, evidence_found, penalty.

    Args:
        witness: Witness data (name, personality)
        available_secrets: Secrets witness hasn't revealed yet
        outcome: "detected_with_evidence" | "detected_no_evidence" |
                 "undetected_with_evidence" | "undetected_no_evidence"
        focused: Was this a focused search?
        search_target: What player was looking for (if focused)

    Returns:
        Prompt telling LLM what happened + how to narrate it
    """

    witness_name = witness.get("name", "the witness")

    # Base prompt structure
    prompt = f"""You are narrating a Legilimency spell outcome in an Auror investigation.

== WITNESS ==
{witness_name}
Personality: {witness.get("personality", "")}

== PREDETERMINED OUTCOME (Python calculated) ==
{outcome}

"""

    if outcome == "detected_with_evidence":
        prompt += f"""== YOUR JOB ==
The spell succeeded AND the witness detected the intrusion.

INCLUDE:
1. Brief memory flash revealing case-relevant secret:
{available_secrets[0].get("text", "") if available_secrets else "NO SECRETS AVAILABLE"}

2. Witness outrage: "You're in my HEAD!" or "GET OUT!" or similar
3. Emotional reaction: clutching head, stumbling back, fear/anger

Keep to 2-4 paragraphs. Narrator POV (third person).
"""

    elif outcome == "detected_no_evidence":
        prompt += f"""== YOUR JOB ==
The spell failed (no case-relevant memories) BUT witness detected intrusion.

INCLUDE:
1. Random mundane thoughts (breakfast, homework, crush, embarrassing memory, weird trivia)
2. Witness outrage: "What are you DOING?!" or "You... you're in my mind!"
3. Emotional reaction: horror, anger, backing away

NO case-relevant information revealed.
Keep to 2-3 paragraphs. Narrator POV (third person).
"""

    elif outcome == "undetected_with_evidence":
        prompt += f"""== YOUR JOB ==
The spell succeeded AND witness didn't detect intrusion.

INCLUDE:
1. You slip into their mind unnoticed
2. Memory flash revealing case-relevant secret:
{available_secrets[0].get("text", "") if available_secrets else "NO SECRETS AVAILABLE"}

3. Witness feels vague unease: shivers, glances around, uneasy but doesn't understand why

NO direct confrontation. Witness unaware of intrusion.
Keep to 2-3 paragraphs. Narrator POV (third person).
"""

    else:  # undetected_no_evidence
        prompt += f"""== YOUR JOB ==
The spell failed (no case-relevant memories) AND witness didn't detect intrusion.

INCLUDE:
1. You slip into their mind unnoticed
2. Random mundane thoughts surface (breakfast, exams, weird dreams, random trivia)
3. Witness feels vague unease but continues talking normally

NO case-relevant information. NO confrontation.
Keep to 2-3 paragraphs. Narrator POV (third person).
"""

    prompt += f"""
== FOCUSED SEARCH ==
{"Yes - player was looking for: " + search_target if focused else "No - unfocused search"}

== RESPONSE FORMAT ==
Write 2-4 paragraphs in narrator voice (third person: "You push into their mind...").
Do NOT include [EVIDENCE:] tags or [FLAG:] tags - those are already handled.
Just tell the story of what happens.

Respond as narrator:"""

    return prompt
```

### Integration Pattern (routes.py)

```python
# In /api/interrogate endpoint, after evidence presentation check (~line 830)

# =============================================
# TWO-STAGE SPELL DETECTION
# =============================================

# Stage 1: Quick keyword check (95% of cases exit here)
if not contains_legilimency_keywords(request.question):
    # No spell keywords → continue to normal interrogation
    # 0 extra cost, 0.1ms latency
    pass
else:
    # Stage 2: Fuzzy match (5% of cases reach here)
    if detect_legilimency_fuzzy(request.question):
        # Legilimency detected → execute spell flow
        # =============================================
        # PROGRAMMATIC OUTCOME CALCULATION
        # =============================================

        # 1. Detect focused vs unfocused
        focused, search_target = detect_focused_legilimency(request.question)

        # 2. Calculate detection (80% chance)
        detected = random.random() < 0.8

        # 3. Calculate evidence success (60% focused, 30% unfocused)
        evidence_found = random.random() < (0.6 if focused else 0.3)

        # 4. Determine outcome type (4 combinations)
        if detected and evidence_found:
            outcome = "detected_with_evidence"
        elif detected and not evidence_found:
            outcome = "detected_no_evidence"
        elif not detected and evidence_found:
            outcome = "undetected_with_evidence"
        else:
            outcome = "undetected_no_evidence"

        # 5. Calculate trust penalty (ONLY if detected)
        if detected:
            penalty = random.choice([5, 10, 15, 20])
            witness_state.adjust_trust(-penalty)
            trust_delta = -penalty
        else:
            penalty = 0
            trust_delta = 0

        # 6. Get available secrets (not yet revealed)
        available_secrets = [
            s for s in witness.get("secrets", [])
            if s.get("id") not in witness_state.secrets_revealed
        ]

        # 7. Build narration prompt with predetermined outcome
        narration_prompt = build_legilimency_narration_prompt(
            witness=witness,
            available_secrets=available_secrets,
            outcome=outcome,
            focused=focused,
            search_target=search_target,
        )

        # 8. Get LLM response (storytelling only)
        try:
            client = get_client()
            system_prompt = """You are a narrator for Auror Academy.
Narrate spell outcomes clearly and atmospherically.
2-4 paragraphs max. Third person POV."""

            legilimency_response = await client.get_response(
                narration_prompt,
                system=system_prompt,
            )
        except ClaudeClientError as e:
            raise HTTPException(status_code=503, detail=f"LLM error: {e}")

        # 9. Mark secret as revealed (if evidence_found)
        secrets_revealed = []
        secret_texts = {}

        if evidence_found and available_secrets:
            secret = available_secrets[0]  # Reveal first unrevealed secret
            secret_id = secret.get("id")
            secret_text = secret.get("text", "")

            witness_state.reveal_secret(secret_id)
            secrets_revealed.append(secret_id)
            secret_texts[secret_id] = secret_text.strip()

        # 10. Add to conversation history
        witness_state.add_conversation(
            question="[Cast Legilimency]",
            response=legilimency_response,
            trust_delta=trust_delta,
        )

        # 11. Save state
        state.update_witness_state(witness_state)
        save_state(state, request.player_id)

        # 12. Return response
        return InterrogateResponse(
            response=legilimency_response,
            trust=witness_state.trust,
            trust_delta=trust_delta,
            secrets_revealed=secrets_revealed,
            secret_texts=secret_texts,
        )
```

### Known Gotchas

**From Phase 4.6.1 learnings**:
- ❌ Two-stage flow adds state complexity (`awaiting_spell_confirmation`)
- ❌ Confirmation keywords brittle ("yes" can mean many things in conversation)
- ❌ Two API calls slow for interrogation context
- ✅ Programmatic calculation clearer and faster

**From project experience**:
- **Random seed**: Use `random.random()` and `random.choice()` (not LLM for probabilities)
- **Penalty steps**: [5, 10, 15, 20] not arbitrary (each 5-point increment meaningful)
- **Evidence reveal**: Mark secret as revealed in state BEFORE returning response
- **Trust timing**: Apply penalty BEFORE building response (so trust delta correct in response)

**From magic system**:
- **Narrator POV**: Third person ("You push into their mind...") not first person
- **2-4 paragraphs**: Concise, atmospheric, not verbose
- **No LLM tags**: Python handles [EVIDENCE:] and [FLAG:] extraction (LLM just narrates)
- **Secret text**: Naturally incorporate in narrative, not list separately

---

## Current Codebase Structure

```bash
backend/src/
├── api/
│   ├── routes.py                    # MODIFY - /api/interrogate endpoint
│   └── models.py                    # No changes (InterrogateResponse already has secret_texts)
├── context/
│   ├── spell_llm.py                 # MODIFY - Add 2 new functions
│   └── narrator.py                  # No changes
├── state/
│   ├── player_state.py              # MODIFY - Remove awaiting_spell_confirmation field
│   └── persistence.py               # No changes
└── tests/
    ├── test_routes.py               # validation-gates adds tests
    └── test_spell_llm.py            # validation-gates adds tests
```

**Note**: validation-gates handles test file creation. Don't include in task breakdown.

---

## Desired Codebase Structure

```bash
backend/src/
├── context/
│   └── spell_llm.py                 # MODIFY - Add detect_focused_legilimency() + build_legilimency_narration_prompt()
├── api/
│   └── routes.py                    # MODIFY - Add Legilimency detection logic (~line 830-890)
├── state/
│   └── player_state.py              # MODIFY - Remove awaiting_spell_confirmation (optional cleanup)
```

**No frontend changes** - existing witness modal handles responses.

---

## Files to Create/Modify

| File | Action | Purpose | Reference |
|------|--------|---------|-----------|
| `backend/pyproject.toml` | MODIFY | Add rapidfuzz dependency | Use `uv add rapidfuzz` |
| `backend/src/context/spell_llm.py` | MODIFY | Add 7 functions (Tasks 2-7: keywords, fuzzy, target, intent, focused, narration) | Existing functions (lines 342-353) |
| `backend/src/api/routes.py` | MODIFY | Add two-stage detection + programmatic calc (~lines 830-890) | Phase 4.6.1 pattern (lines 854-889) |
| `backend/src/api/routes.py` | DELETE (optional) | Remove `_handle_legilimency_confirmation()` (lines 1036-1159) | Cleanup old flow |
| `backend/src/state/player_state.py` | MODIFY (optional) | Remove `awaiting_spell_confirmation` field | WitnessState class (lines 160-200) |

**Note**: Test files created by validation-gates. Don't list in PRP.

---

## Tasks (Ordered)

### Task 1: Add rapidfuzz Dependency
**File**: `backend/pyproject.toml`
**Action**: MODIFY (add dependency)
**Purpose**: Add fuzzy string matching library for typo-tolerant spell detection
**Reference**: Dependencies section
**Pattern**: Use `uv add rapidfuzz` (NEVER edit pyproject.toml directly)
**Depends on**: None

**Acceptance criteria**:
- [ ] rapidfuzz added via `uv add rapidfuzz`
- [ ] pyproject.toml shows `rapidfuzz = "^3.0.0"`
- [ ] `uv sync` completes successfully

**Command**:
```bash
cd backend
uv add rapidfuzz
```

---

### Task 2: Add Keyword Pre-Filter Function
**File**: `backend/src/context/spell_llm.py`
**Action**: CREATE new function
**Purpose**: Quick keyword scan to avoid fuzzy matching on 95% of non-spell cases
**Reference**: Existing spell detection patterns (lines 342-353)
**Pattern**: Simple substring checks (instant, zero cost)
**Depends on**: None

**Acceptance criteria**:
- [ ] `contains_legilimency_keywords()` function exists
- [ ] Returns `bool` (True if keywords found)
- [ ] Checks 7 keywords: legilimen, mind, thought, memor, read her, peek, search
- [ ] Takes <1ms to execute (performance requirement)
- [ ] Docstring with examples

**Code Snippet**:
```python
def contains_legilimency_keywords(text: str) -> bool:
    """Quick keyword scan for Legilimency-related terms.

    Stage 1 filter - catches 95% of non-spell cases instantly (0.1ms).
    Only if this returns True do we proceed to fuzzy matching.

    Args:
        text: Player's interrogation question

    Returns:
        True if text contains Legilimency-related keywords

    Examples:
        >>> contains_legilimency_keywords("What did you see?")
        False
        >>> contains_legilimency_keywords("I want to read her mind")
        True
    """
    text_lower = text.lower()

    keywords = [
        "legilimen",  # Catches "legilimency", "legilimens"
        "mind",       # "read mind", "in my mind"
        "thought",    # "read thoughts", "peek thoughts"
        "memor",      # "memories", "memory"
        "read her",   # "read her mind"
        "peek",       # "peek into"
        "search",     # "search her thoughts"
    ]

    return any(keyword in text_lower for keyword in keywords)
```

---

### Task 3: Add Fuzzy Matching Function
**File**: `backend/src/context/spell_llm.py`
**Action**: CREATE new function
**Purpose**: Typo-tolerant spell detection using Levenshtein distance
**Reference**: rapidfuzz documentation + existing spell patterns
**Pattern**: Fuzzy match "legilimency" + semantic phrases
**Depends on**: Task 1 (rapidfuzz dependency)

**Acceptance criteria**:
- [ ] `detect_legilimency_fuzzy()` function exists
- [ ] Returns `bool` (True if spell detected)
- [ ] Uses `fuzz.partial_ratio()` with 80% threshold
- [ ] Handles typos: "legulemancy" → DETECTED
- [ ] Handles variants: "legilimens" → DETECTED
- [ ] Rejects false positives: "legitimate" → NOT DETECTED
- [ ] Checks semantic phrases (read mind, peek thoughts, search memories)
- [ ] Takes <2ms to execute (performance requirement)
- [ ] Docstring with examples

**Code Snippet**:
```python
from rapidfuzz import fuzz

def detect_legilimency_fuzzy(text: str) -> bool:
    """Fuzzy match spell name to handle typos.

    Stage 2 filter - only called if Stage 1 (keywords) passed.
    Uses Levenshtein distance via rapidfuzz (1-2ms).

    Handles:
    - Typos: "legulemancy" (82% similarity) → MATCH
    - Variants: "legilimens" (85% similarity) → MATCH
    - False positives: "legitimate" (64% similarity) → NO MATCH

    Args:
        text: Player's interrogation question

    Returns:
        True if text likely contains Legilimency spell cast

    Examples:
        >>> detect_legilimency_fuzzy("use legulemancy on her")
        True
        >>> detect_legilimency_fuzzy("she seems legitimate")
        False
    """
    text_lower = text.lower()

    # Direct fuzzy match against "legilimency"
    if fuzz.partial_ratio(text_lower, "legilimency") > 80:
        return True

    # Check for semantic phrases
    semantic_phrases = [
        "read mind",
        "read her mind",
        "read his mind",
        "peek thoughts",
        "search memories",
    ]

    for phrase in semantic_phrases:
        if phrase in text_lower:
            return True

    return False
```

---

### Task 4: Add Target Extraction Function
**File**: `backend/src/context/spell_llm.py`
**Action**: CREATE new function (helper for focused detection)
**Purpose**: Extract spell target from input ("on hermione" → "hermione")
**Reference**: `parse_spell_from_input()` (lines 264-314)
**Pattern**: Regex to extract "on X", "at X", target names
**Depends on**: None

**Acceptance criteria**:
- [ ] `extract_target_from_input()` function exists
- [ ] Returns `str | None`
- [ ] Handles patterns: "on X", "at X", witness names
- [ ] Docstring with examples

**Code Snippet**:
```python
def extract_target_from_input(text: str) -> str | None:
    """Extract spell target from player input.

    Args:
        text: Player's input text

    Returns:
        Target name/description or None if not found

    Examples:
        >>> extract_target_from_input("use legilimency on hermione")
        "hermione"
        >>> extract_target_from_input("cast legilimency")
        None
    """
    import re

    text_lower = text.lower()

    # Pattern: "on X" or "at X"
    patterns = [
        r"on (.+)",
        r"at (.+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, text_lower)
        if match:
            return match.group(1).strip()

    return None
```

---

### Task 5: Add Intent Extraction Function
**File**: `backend/src/context/spell_llm.py`
**Action**: CREATE new function (helper for focused detection)
**Purpose**: Extract search intent ("to find out about X" → "X")
**Reference**: Focused detection pattern from Quick Reference
**Pattern**: Regex to extract focused search targets
**Depends on**: None

**Acceptance criteria**:
- [ ] `extract_intent_from_input()` function exists
- [ ] Returns `str | None`
- [ ] Handles patterns: "to find out about X", "looking for X", "about X"
- [ ] Docstring with examples

**Code Snippet**:
```python
def extract_intent_from_input(text: str) -> str | None:
    """Extract focused search intent from player input.

    Args:
        text: Player's input text

    Returns:
        Search target/intent or None if unfocused

    Examples:
        >>> extract_intent_from_input("use legilimency to find out about the wand")
        "the wand"
        >>> extract_intent_from_input("use legilimency on her")
        None
    """
    import re

    text_lower = text.lower()

    patterns = [
        r"to find out about (.+)",
        r"looking for (.+)",
        r"about (.+)",
        r"to (?:learn|discover|see) (.+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, text_lower)
        if match:
            return match.group(1).strip()

    return None
```

---

### Task 6: Add Focused Legilimency Detection Function
**File**: `backend/src/context/spell_llm.py`
**Action**: CREATE new function
**Purpose**: Combine target + intent extraction (wrapper function)
**Reference**: Tasks 4-5 (uses their functions)
**Pattern**: Returns focused flag + search target
**Depends on**: Tasks 4-5

**Acceptance criteria**:
- [ ] `detect_focused_legilimency()` function exists
- [ ] Returns `(is_focused: bool, search_target: str | None)` tuple
- [ ] Uses `extract_intent_from_input()` helper (Task 5)
- [ ] Examples:
  - "use legilimency to find out about the wand" → `(True, "the wand")`
  - "use legilimency on her" → `(False, None)`
- [ ] Docstring with examples

**Code Location**: `backend/src/context/spell_llm.py`

**Code Snippet**:
```python
def detect_focused_legilimency(question: str) -> tuple[bool, str | None]:
    """Detect if Legilimency question has focused search intent.

    Wrapper around extract_intent_from_input() for focused detection.

    Patterns:
      - "use legilimency to find out about X"
      - "legilimency looking for X"
      - "legilimency about X"
      - "use legilimency to learn/discover/see X"

    Args:
        question: Player's interrogation question

    Returns:
        Tuple of (is_focused, search_target)

    Examples:
        >>> detect_focused_legilimency("use legilimency to find out about the wand")
        (True, "the wand")
        >>> detect_focused_legilimency("use legilimency on her")
        (False, None)
    """
    intent = extract_intent_from_input(question)
    if intent:
        return True, intent
    return False, None
```

---

### Task 7: Add Legilimency Narration Prompt Builder
**File**: `backend/src/context/spell_llm.py`
**Action**: CREATE new function
**Purpose**: Build LLM prompt for narrating predetermined outcome
**Reference**: `build_spell_effect_prompt()` (lines 35-118) - Follow same structure
**Pattern**: 4 outcome templates, narrator POV, 2-4 paragraphs
**Depends on**: None

**Acceptance criteria**:
- [ ] `build_legilimency_narration_prompt()` function exists
- [ ] Takes witness, secrets, outcome, focused, search_target params
- [ ] Returns complete prompt string
- [ ] 4 outcome templates:
  - `detected_with_evidence`: Secret + outrage
  - `detected_no_evidence`: Mundane thoughts + outrage
  - `undetected_with_evidence`: Secret + vague unease
  - `undetected_no_evidence`: Mundane thoughts + vague unease
- [ ] Narrator POV instructions (third person: "You push...")
- [ ] 2-4 paragraph guidance
- [ ] Docstring with structure

**Code Location**: `backend/src/context/spell_llm.py` (add after `detect_focused_legilimency()`)

**Code Snippet**: See "Quick Reference" section above (full function provided)

---

### Task 8: Integrate Two-Stage Detection in Interrogate Endpoint
**File**: `backend/src/api/routes.py`
**Action**: MODIFY existing endpoint
**Purpose**: Add two-stage spell detection + programmatic outcome calculation
**Reference**: Phase 4.6.1 pattern (lines 854-889) - REPLACE with new logic
**Pattern**: Keyword pre-filter → Fuzzy match → Programmatic outcome → LLM narration
**Depends on**: Tasks 1-7

**Acceptance criteria**:
- [ ] Stage 1: Keyword pre-filter after evidence check (~line 830)
- [ ] Stage 2: Fuzzy matching (only if Stage 1 passed)
- [ ] Programmatic calculation:
  - `focused, search_target = detect_focused_legilimency()`
  - `detected = random.random() < 0.8`
  - `evidence_found = random.random() < (0.6 if focused else 0.3)`
  - Determine outcome type (4 combinations)
  - Calculate penalty: `random.choice([5, 10, 15, 20]) if detected else 0`
- [ ] Build narration prompt with outcome
- [ ] Get LLM response
- [ ] Mark secret revealed (if evidence_found)
- [ ] Apply trust penalty
- [ ] Save state
- [ ] Return InterrogateResponse
- [ ] Performance: <1ms overhead for 95% of non-spell cases

**Code Location**: `backend/src/api/routes.py` lines 830-890 (after evidence presentation, before trust adjustment)

**Code Snippet**: See "Quick Reference - Integration Pattern" above (full implementation provided)

---

### Task 9: Remove Two-Stage Flow Code (Cleanup)
**File**: `backend/src/api/routes.py`
**Action**: DELETE function
**Purpose**: Remove deprecated `_handle_legilimency_confirmation()` function
**Reference**: Lines 1036-1159 (entire function)
**Pattern**: Delete function, imports stay (new spell_llm functions still used)
**Depends on**: Task 8

**Acceptance criteria**:
- [ ] `_handle_legilimency_confirmation()` function deleted (lines 1036-1159)
- [ ] No references to function in interrogate endpoint
- [ ] Imports preserved (new spell_llm functions still needed)
- [ ] Tests still passing (validation-gates verifies)

**Code Location**: `backend/src/api/routes.py` lines 1036-1159

**Note**: Optional cleanup. Can defer if time constrained.

---

### Task 10: Remove awaiting_spell_confirmation Field (Optional Cleanup)
**File**: `backend/src/state/player_state.py`
**Action**: MODIFY (remove field)
**Purpose**: Clean up unused state field
**Reference**: WitnessState class (lines 160-200)
**Pattern**: Remove field, backward compatible (old saves ignore it)
**Depends on**: Task 9

**Acceptance criteria**:
- [ ] `awaiting_spell_confirmation: str | None` field removed from WitnessState
- [ ] No references in routes.py
- [ ] Old saves still load (backward compatible)
- [ ] Tests still passing

**Code Location**: `backend/src/state/player_state.py` (WitnessState class)

**Note**: Optional cleanup. Can defer if time constrained.

---

## Integration Points

### Spell Detection (spell_llm.py)
**Where**: `backend/src/context/spell_llm.py` lines 342-353
**What**: `is_spell_input()`, `parse_spell_from_input()` already exist
**Pattern**: Reuse for Legilimency detection in routes.py
**Note**: Functions tested in Phase 4.5, ready to use

### Witness State Management
**Where**: `backend/src/state/player_state.py`
**What**: `WitnessState.adjust_trust()`, `reveal_secret()` already exist
**Pattern**: Call `witness_state.adjust_trust(-penalty)`, `reveal_secret(secret_id)`
**Note**: Same pattern used in evidence presentation

### LLM Client
**Where**: `backend/src/api/routes.py`
**What**: `get_client()` returns AsyncAnthropic instance
**Pattern**: `client.get_response(prompt, system=system_prompt)`
**Note**: Same as all other LLM calls in project

### InterrogateResponse Model
**Where**: `backend/src/api/routes.py` lines 121-130
**What**: Already has `secret_texts: dict[str, str]` field (Phase 4.6.1)
**Pattern**: Populate with `{secret_id: secret_text}` mapping
**Note**: No model changes needed (already prepared in Phase 4.6.1)

---

## Known Gotchas

### Random Module Usage (Python)
- **Pattern**: `import random` at top of routes.py
- **Detection**: `random.random() < 0.8` (80% chance returns True)
- **Choice**: `random.choice([5, 10, 15, 20])` (equal probability)
- **Note**: No seed needed (each game session independent)

### Outcome Calculation Order
- **CRITICAL**: Calculate outcome BEFORE building prompt
- **Order**: detected → evidence_found → outcome → penalty → prompt
- **Why**: Prompt needs outcome type as input parameter
- **Example**: Can't determine "detected_with_evidence" without both calculations

### Trust Penalty Application Timing
- **CRITICAL**: Apply `witness_state.adjust_trust(-penalty)` BEFORE `save_state()`
- **Why**: Trust delta in response must match actual trust change
- **Pattern**: Calculate penalty → adjust_trust → build response → save
- **Note**: Same pattern as evidence presentation (lines 950-1033)

### Secret Revelation Logic
- **Pattern**: Only reveal first unrevealed secret (if multiple available)
- **Why**: Legilimency searches mind, finds ONE memory per cast
- **Code**: `available_secrets[0]` after filtering unrevealed secrets
- **Note**: Player can cast multiple times to reveal multiple secrets

### Narrator POV Consistency
- **Style**: Third person ("You push into their mind...")
- **NOT**: First person ("I push into their mind...")
- **Reason**: Game uses narrator POV throughout (consistent with LocationView)
- **Note**: Prompt explicitly instructs LLM on POV

### Evidence in Narrative (No Tags)
- **Pattern**: LLM naturally incorporates secret text in narrative
- **NOT**: `[EVIDENCE: saw_draco]` tags (those are for location investigation)
- **Why**: Interrogation responses are conversational, not mechanical
- **Note**: Secret text from YAML already included in prompt

---

## Validation

### Pre-commit (Automated)
```bash
cd backend
uv run ruff check .
uv run ruff format .
uv run mypy src/
# Expected: No errors
```

### Testing (validation-gates)
```bash
cd backend
uv run pytest
# Expected: 585/585 passing (no regressions)
# New tests: detect_focused_legilimency, build_legilimency_narration_prompt, routes integration
```

### Manual Smoke Test
```bash
# Terminal 1: Backend
cd backend
uv run uvicorn src.main:app --reload

# Terminal 2: Frontend
cd frontend
bun run dev

# Browser: http://localhost:5173
# 1. Start new game
# 2. Interrogate Hermione (trust 50%)
# 3. Type: "use legilimency to find out what she saw"
# 4. VERIFY: Instant response (no warning step)
# 5. VERIFY: 80% chance she detects ("GET OUT!")
# 6. VERIFY: If detected, trust drops by [5, 10, 15, or 20]
# 7. VERIFY: 60% chance secret appears in narrative
# 8. Try again: "use legilimency on her" (unfocused)
# 9. VERIFY: 30% chance secret appears
```

---

## Dependencies

**New Packages**:
- `rapidfuzz` (^3.0.0) - Fuzzy string matching for typo-tolerant spell detection
  - Install: `uv add rapidfuzz`
  - Used in: `detect_legilimency_fuzzy()` function

**Configuration**: No new env vars

**Reuse**:
- Anthropic Claude Haiku API (existing)
- FastAPI async patterns (existing)
- Pydantic validation (existing)
- Python `random` module (built-in)

---

## Out of Scope

- Dynamic risk calculation beyond 80% detection (fixed for simplicity)
- Multiple spell types in interrogation (only Legilimency supported)
- Player Occlumency defenses (future mechanic)
- Mental strain tracking (flag exists, logic deferred to Phase 5+)
- UI polish for Legilimency responses (narrator text already good)
- Two-stage flow for other contexts (only interrogate changed)

---

## Agent Orchestration Plan

### Execution Strategy

**Sequential Track** (backend only):
1. `fastapi-specialist` → Backend changes (Tasks 1-10)
2. `validation-gates` → Run all tests + performance verification
3. `documentation-manager` → Update docs

**Why Sequential**: Backend-only changes, no frontend work needed.

### Agent-Specific Guidance

#### For fastapi-specialist
- **Input**: Tasks 1-10 (dependency + 7 spell_llm.py functions + routes.py integration + cleanup)
- **Context**: Quick Reference section above (no doc reading needed)
- **Pattern**: Two-stage detection (keyword → fuzzy) + programmatic outcome calculation
- **Integration**: Single-call flow replaces two-stage confirmation (simpler)
- **Output**: Legilimency working with instant responses + typo tolerance

**Key Files to Reference**:
- `pyproject.toml` (add rapidfuzz via `uv add`)
- `spell_llm.py` (add 7 functions following existing patterns)
- `routes.py` (modify interrogate endpoint ~lines 830-890)
- `player_state.py` (optional: remove unused field)

**Key Patterns**:
- Keyword pre-filter: Simple substring checks (instant)
- Fuzzy matching: `fuzz.partial_ratio()` with 80% threshold
- Regex detection: Follow `parse_spell_from_input()` pattern
- Prompt building: Follow `build_spell_effect_prompt()` structure
- Random calculation: `random.random() < threshold`, `random.choice([...])`
- Trust management: `witness_state.adjust_trust(-penalty)`

#### For validation-gates
- **Input**: All code complete
- **Runs**: Tests, lint, type check, build, performance verification
- **Output**: Pass/fail report
- **Note**: Creates tests for 7 new functions + performance tests for detection speed
- **Performance Verification**:
  - Keyword scan: <1ms
  - Fuzzy match: <2ms
  - 95% of interrogations: <1ms total overhead
  - Typo detection: "legulemancy" → MATCH
  - False positive rejection: "legitimate" → NO MATCH

#### For documentation-manager
- **Input**: Code complete, validation passed
- **Files changed**:
  - `pyproject.toml` (rapidfuzz dependency)
  - `spell_llm.py` (7 new functions)
  - `routes.py` (two-stage detection integration + cleanup)
  - `player_state.py` (awaiting_spell_confirmation removed)
- **Output**: Updated STATUS.md, PLANNING.md, CHANGELOG.md

### Handoff Context

**Next agent receives**:
- This PRP (full context)
- Quick Reference (complete implementation patterns with two-stage detection)
- Specific task numbers (1-10)
- Actual file paths with line numbers
- Code snippets for each function
- Performance requirements documented

**Next agent does NOT need**:
- ❌ Read research files (PRP has everything)
- ❌ Search for examples (code snippets provided)
- ❌ Read 5-10 docs (Quick Reference complete)
- ❌ Explore codebase (integration points clear)
- ❌ Research fuzzy matching (rapidfuzz usage documented)

---

## Anti-Patterns to Avoid

**From Phase 4.6.1 learnings**:
- ❌ Two-stage flow with state tracking (too complex for interrogation)
- ❌ Confirmation keyword detection (brittle in conversation)
- ❌ LLM calculating probabilities (use Python `random` module)
- ❌ Multiple API calls for single action (slow)

**From project experience**:
- ❌ Not using async for LLM calls
- ❌ Forgetting `model_dump(mode="json")` for datetime
- ❌ Not validating backend input (Pydantic models)
- ❌ Mixing transient UI state with persistent game state
- ❌ Not applying trust penalty before save_state

**From magic system**:
- ❌ Verbose narration (keep to 2-4 paragraphs)
- ❌ First person POV (use third person narrator)
- ❌ LLM inventing evidence (only reveal defined secrets)
- ❌ Mechanical tags in conversational responses

---

## What to DELETE from Phase 4.6.1

**Files to Modify**:
- `routes.py` lines 1036-1159: DELETE `_handle_legilimency_confirmation()` function
- `routes.py` lines 841-851: DELETE confirmation check block
- `routes.py` lines 868-878: DELETE warning return block
- `player_state.py`: DELETE `awaiting_spell_confirmation: str | None` field

**Pattern to Replace**:
```python
# OLD Phase 4.6.1 (two-stage):
# Stage 1: Player types "use legilimency"
# Response: Warning + set awaiting_spell_confirmation flag
# Stage 2: Player types "yes"
# Response: Execute spell

# NEW Phase 4.6.2 (single-call):
# Player types "use legilimency"
# Backend: Calculate outcome programmatically
# Response: Instant narration with outcome
```

---

## Success Criteria Checklist

**Detection Performance**:
- [ ] Keyword scan: <1ms
- [ ] Fuzzy match: <2ms
- [ ] 95% of interrogations: <1ms total overhead (no spell)
- [ ] Typo "legulemancy" → DETECTED
- [ ] Phrase "read her mind" → DETECTED
- [ ] Non-spell "What did you see?" → NOT DETECTED (no false positives)
- [ ] Non-spell "She seems legitimate" → NOT DETECTED (below 80% threshold)

**Core Functionality**:
- [ ] "use legilimency on hermione" → instant response (no warning)
- [ ] 80% detection rate (run 10x, ~8 detections)
- [ ] 20% undetected (no trust penalty)
- [ ] Focused searches: 60% evidence success
- [ ] Unfocused searches: 30% evidence success
- [ ] Detected: penalty from [5, 10, 15, 20]
- [ ] Evidence in narrative text (not separate list)

**Technical Quality**:
- [ ] All 585+ backend tests passing
- [ ] rapidfuzz dependency added correctly
- [ ] No state schema changes (backward compatible)
- [ ] Ruff linting clean
- [ ] Mypy type checking clean
- [ ] No frontend changes needed

**Code Quality**:
- [ ] Docstrings with examples
- [ ] Clear variable names
- [ ] Comments explaining two-stage detection flow
- [ ] Comments explaining outcome calculation
- [ ] Error handling for LLM failures

---

**Generated**: 2026-01-11 (Updated with Keyword + Fuzzy detection strategy)
**Source**: User requirements + Phase 4.6.1 analysis + spell_llm.py patterns + rapidfuzz library
**Confidence Score**: 9/10 (clear replacement, two-stage detection is efficient and typo-tolerant)
**Alignment**: Replaces Phase 4.6.1 two-stage flow with single-call programmatic calculation + efficient detection
**Risk**: Low (backend only, simpler than Phase 4.6.1, no state complexity, rapidfuzz is battle-tested)
