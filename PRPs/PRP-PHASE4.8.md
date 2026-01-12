# Phase 4.8: Legilimency System Rewrite - Product Requirement Plan

**Version**: 1.0
**Phase**: Phase 4.8
**Date**: 2026-01-12
**Status**: Ready for Implementation
**Confidence**: 9/10 (Patterns proven, implementation ready)

---

## Goal

**Rewrite Legilimency implementation to mirror simple spell system architecture** - consistent success formulas, semantic phrase fuzzy matching, simplified trust penalties, 2 outcomes (not 4), Occlumency skill support, consequence tracking for repeat invasions.

**End State**: Legilimency follows same patterns as simple investigation spells (70% base → -10% per attempt → specificity bonus → 10% floor). Currently uses inconsistent random rates (80%/20%, 60%/30%) with harsh random penalties ([5,10,15,20,25]).

---

## Why

### User Impact
- **Consistent mechanics**: Legilimency uses same success calculation as other spells (30% base vs 70% for safe spells)
- **Better UX**: Semantic phrase detection ("read her mind") not just spell name, with typo tolerance via fuzzy matching
- **Clearer consequences**: Trust penalty range [5,10,15,20] on detection, zero when undetected
- **Immersive**: Occlumency skill adds narrative depth (strong minds resist better), witnesses remember invasion
- **Fairness**: Spam prevention via decline penalty (like other spells)

### Business Value
- **Rationality teaching**: Simple, predictable formula teaches risk/reward thinking
- **Replayability**: Different witnesses have different resistance (Occlumency varies)
- **Expansion ready**: Consequence system (legilimency_detected flag) enables future features
- **Code quality**: Removes random.choice() inconsistency, mirrors proven patterns

### Integration
- **Builds on Phase 4.7**: Spell success system already working (70% base, decline, bonuses)
- **Fixes Phase 4.6.2**: Current random-based system replaced with formula-based
- **Aligns with design doc**: Legilimency as risky restricted spell (30% vs 70% safe spells)

### Alignment
- **PLANNING.md Phase 4.8**: Spell system refinements
- **AUROR_ACADEMY_GAME_DESIGN.md**: Magic as risk/reward system (lines 1032-1095)

---

## What

### User-Visible Behavior

**Before** (Phase 4.6.2):
```
Player: "legilimency on hermione"
System: Random detection (80% undetected), random evidence (60%/30%), random penalty -[5,10,15,20,25]
Result: Inconsistent outcomes, feels random
```

**After** (Phase 4.8):
```
Player: "I want to read her mind to find out about draco"
System: Calculate: 30% base + 30% specificity (intent only) - attempts*10 = 60%
Hermione: occlumency_skill=50 → detection 35% (20% + 15% from skill)
Roll success: 60% chance
Roll detection: 35% chance
If detected: trust penalty random.choice([5,10,15,20]), set legilimency_detected=True flag
If undetected: 0 trust penalty
Witness LLM context: Includes invasion warning if legilimency_detected=True
Result: Predictable formula, semantic phrase matched (with typo tolerance), Occlumency skill matters
```

**Enhanced Fuzzy Matching**:
```
Input: "I want to reed hermionie's minde about the crime"
Detection:
  ✅ Priority 3: "read her mind" exact substring match fails
  ✅ Priority 3.5: "read her mind" fuzzy match (85% similarity) → detected!
  ✅ "about the crime" → intent extracted
Success rate: 30% + 30% (intent) = 60%

Input: "I want to read hermione's mind about the crime"
Detection:
  ✅ Priority 3: "read her mind" exact substring match → detected
  ✅ "about the crime" → intent extracted
Success rate: 30% + 30% (intent) = 60%
```

**Consequence System**:
```
First Legilimency on Hermione:
  Detection: 35% (20% base + 15% Occlumency)
  If detected: legilimency_detected = True
  Trust: -20 (fixed)

Second Legilimency on Hermione:
  Detection: 55% (35% base + 20% bonus from flag)
  Trust: Already damaged, harder to repair
  Witness LLM context: "⚠ Hermione previously felt Legilimency intrusion. MORE GUARDED."
  Witness dialog: "You tried this before. I won't let you in again."
```

### Technical Requirements

#### Backend Changes
1. **New success calculation** in spell_llm.py: `calculate_legilimency_success()`
   - Base rate: 30% (vs 70% for safe spells)
   - Specificity bonus: +30% if intent specified (target not needed - always obvious in interrogation)
   - Decline penalty: -10% per attempt on witness (same as safe spells)
   - Floor: 10% minimum

2. **Enhanced semantic phrases** in spell_llm.py: Add Legilimency to `SPELL_SEMANTIC_PHRASES`
   - Full phrases: "read her mind", "peek into thought", "search memor", etc.
   - Priority 3: Exact substring match (fast)
   - Priority 3.5: Fuzzy phrase match with typo tolerance (70% threshold via partial_ratio)
   - Intent extraction: "to find out about X", "to learn about X", "about X"

3. **Simplified trust penalty** in routes.py: Fixed range instead of harsh randomness
   - Detected: random.choice([5, 10, 15, 20]) trust penalty (steps of 5)
   - Undetected: 0 trust (no penalty)

4. **Occlumency system** in routes.py: Load from witness YAML
   - Detection formula: `20% + (occlumency_skill / 100) * 30%`
   - Range: 20% (no skill) to 50% (master, skill=100)
   - Example: Hermione occlumency_skill=50 → 35% detection

5. **Consequence tracking** in player_state.py + witness.py: New WitnessState field + LLM context
   - Add `legilimency_detected: bool = False` to WitnessState
   - Set to True on detection
   - Pass to `build_witness_prompt()` for LLM context warning
   - Future Legilimency: +20% detection chance + witness remembers invasion

6. **Simplified narration** in spell_llm.py: 2 outcomes (not 4)
   - SUCCESS (detected or undetected)
   - FAILURE (detected or undetected)
   - Same prompt structure as `build_spell_effect_prompt()`

#### Data Model Changes
- **WitnessState.legilimency_detected**: bool field tracking detection
- **case_001.yaml witnesses**: Add occlumency_skill field (0-100, default 0)

#### Frontend Changes
- **None required** - Narration comes through existing response field

### Success Criteria

- [ ] Success rate calculation matches simple spells (30% base, -10% decline, +30% intent bonus, 10% floor)
- [ ] Legilimency added to SPELL_SEMANTIC_PHRASES with 10+ phrases
- [ ] Fuzzy phrase matching: Priority 3.5 with 70% threshold via partial_ratio (typo tolerance)
- [ ] Semantic phrases detect: "read her mind", "peek into thought", "search memor", etc.
- [ ] Specificity bonus: +30% if intent specified (no target bonus - always obvious in interrogation)
- [ ] Trust penalty: random.choice([5,10,15,20]) if detected, 0 if undetected
- [ ] Occlumency skill loaded from YAML witness definition
- [ ] Detection formula: 20% + (skill/100)*30% (20-50% range)
- [ ] Consequence flag: legilimency_detected set to True on detection
- [ ] Witness LLM context: build_witness_prompt() includes invasion warning if flag set
- [ ] Repeat invasion: +20% detection chance if flag set
- [ ] 2 outcome templates: SUCCESS (focus on evidence), FAILURE (detection/failure explanation)
- [ ] Debug logging: logger.info() shows formula breakdown in terminal (like safe spells)
- [ ] 48+ comprehensive tests (unit + integration + edge cases)
- [ ] Zero regressions (all 651 existing tests pass)
- [ ] Default values: personality/background if missing from YAML
- [ ] Code follows existing patterns (imports, constants, functions, docstrings)
- [ ] Evidence vs secrets clarity (docstrings + comments explain separation)

---

## Context & References

### Project Documentation

**From PLANNING.md**:
- Architecture: FastAPI backend, Claude Haiku LLM, JSON state persistence
- Phase 4.7 Complete: Spell success system (70% base, -10% decline, specificity bonuses)
- Phase 4.6.2 Complete: Programmatic Legilimency (random-based, 4 outcomes) - TO BE REPLACED

**From AUROR_ACADEMY_GAME_DESIGN.md**:
- Magic as risk/reward tool (lines 1032-1095)
- Legilimency as restricted spell (requires consent OR authorization)
- Consequence teaching via gameplay (not punitive, educational)

**From STATUS.md**:
- Current: 651 backend tests passing (100%)
- Phase 4.7: Spell success system working (48 tests)
- Phase 4.6.2: Current Legilimency implementation (18 tests) - TO BE REWRITTEN

### Research Sources

**From CODEBASE-RESEARCH-PHASE4.8.md (validated)**:
- ✅ Simple spell patterns documented (lines 9-76): 70% base, specificity bonus, decline penalty
- ✅ Fuzzy detection architecture (lines 78-183): 4-stage priority, semantic phrases
- ✅ Witness state management (lines 185-230): Trust adjustment, conversation history
- ✅ Current Legilimency implementation (lines 370-523): Random-based, 4 outcomes, harsh penalties
- ✅ Test patterns (lines 527-652): Detection tests, success calc tests, integration tests
- ✅ Integration points mapped (lines 713-755): 8 key locations

**Alignment Notes**:
- ✅ Research patterns align with Phase 4.7 spell success system
- ✅ Codebase conventions match project CLAUDE.md style guide
- ✅ Test patterns proven (Phase 4.7 added 48 tests, all passing)

---

## Quick Reference (Pre-Digested Context)

### Essential Formulas

**Success Rate Calculation** (New):
```python
# Legilimency: 30% base (risky), +30% intent bonus, -10% per attempt, 10% floor
base_rate = 30  # Lower than safe spells (70%)
specificity_bonus = calculate_legilimency_specificity_bonus(player_input)  # 0 or 30%
decline_penalty = attempts_on_witness * 10
success_rate = base_rate + specificity_bonus - decline_penalty
success_rate = max(10, success_rate)  # Floor at 10%

# Example: "legilimency to find out about draco" (first cast)
# 30% + 30% (intent) - 0 = 60%

# Example: Same input, 3rd cast on same witness
# 30% + 30% - 20% = 40%

# Example: "legilimency" (no intent, 1st cast)
# 30% + 0% - 0% = 30%

# Note: Target not needed - in interrogation, target is always the witness
```

**Specificity Bonus Calculation** (New):
```python
def calculate_legilimency_specificity_bonus(player_input: str) -> int:
    """
    Returns 0 or 30 percentage points:
    - Intent bonus: +30% if "to find out about X", "to learn about X", "about X" detected
    - No target bonus: target is always obvious in interrogation (the witness)

    Example:
        "legilimency" → 0%
        "legilimency to find out about draco" → 30%
        "legilimency about the crime" → 30%
    """
    # Intent detection only (reuse extract_intent_from_input)
    intent = extract_intent_from_input(player_input)
    return 30 if intent else 0
```

**Detection Rate Calculation** (New):
```python
# Occlumency skill affects detection
base_detection = 20  # Base 20% chance witness notices
occlumency_skill = witness.get("occlumency_skill", 0)  # 0-100 from YAML
skill_bonus = (occlumency_skill / 100) * 30  # 0-30% bonus
detection_chance = base_detection + skill_bonus

# If legilimency_detected flag set (repeat invasion)
if witness_state.legilimency_detected:
    detection_chance += 20  # +20% penalty for repeat attempts

detection_chance = min(95, detection_chance)  # Cap at 95%

# Example: Hermione occlumency_skill=50, first attempt
# 20% + (50/100)*30% = 20% + 15% = 35% detection

# Example: Hermione, second attempt (flag set)
# 35% + 20% = 55% detection

# Example: Draco occlumency_skill=0, first attempt
# 20% + 0% = 20% detection
```

**Trust Penalty** (Simplified):
```python
# OLD (Phase 4.6.2): random.choice([5, 10, 15, 20, 25])
# NEW (Phase 4.8): Fixed range [5,10,15,20] (steps of 5)

if detected:
    trust_delta = -random.choice([5, 10, 15, 20])  # Range penalty (steps of 5)
else:
    trust_delta = 0  # No penalty when undetected

witness_state.adjust_trust(trust_delta)  # Clamps to [0, 100]

# Example:
# Detected: trust_delta could be -5, -10, -15, or -20
# Undetected: trust_delta always 0
```

### Key Patterns from Research

**Semantic Phrase Detection with Fuzzy Matching** (From spell_llm.py):
```python
# Add to SPELL_SEMANTIC_PHRASES constant (line 26)
SPELL_SEMANTIC_PHRASES: dict[str, list[str]] = {
    "revelio": [...],  # Existing
    "lumos": [...],  # Existing
    # ... other spells ...

    # NEW: Legilimency phrases
    "legilimency": [
        "legilimency",        # Spell name (Priority 2: fuzzy spell name)
        "legilimens",         # Variant (Priority 3/3.5: phrase match)
        "read mind",          # Priority 3: exact → Priority 3.5: fuzzy
        "read her mind",      # Priority 3: exact → Priority 3.5: fuzzy
        "read his mind",      # Priority 3: exact → Priority 3.5: fuzzy
        "read their mind",    # Priority 3: exact → Priority 3.5: fuzzy
        "peek into mind",     # Priority 3: exact → Priority 3.5: fuzzy
        "peek into thought",  # Priority 3: exact → Priority 3.5: fuzzy
        "search memor",       # Priority 3: exact → catches "memories", "memory"
        "probe mind",         # Priority 3: exact → Priority 3.5: fuzzy
        "enter mind",         # Priority 3: exact → Priority 3.5: fuzzy
    ],
}

# NEW: Add Priority 3.5 fuzzy phrase matching in detect_spell_with_fuzzy()
# After Priority 3 (exact substring) fails, try fuzzy match:
from rapidfuzz import fuzz

for spell_id in spell_order:
    phrases = SPELL_SEMANTIC_PHRASES.get(spell_id, [])
    for phrase in phrases:
        # Priority 3: Exact substring (fast)
        if phrase in text_lower:
            return spell_id, extract_target_from_input(text)

        # Priority 3.5: Fuzzy phrase (slower, catches typos)
        score = fuzz.partial_ratio(text_lower, phrase)
        if score > 70:  # Same threshold as spell name fuzzy
            return spell_id, extract_target_from_input(text)
```

**Success Calculation Pattern** (From spell_llm.py lines 200-242):
```python
def calculate_legilimency_success(
    player_input: str,
    attempts_on_witness: int,
    witness_id: str,
) -> bool:
    """
    Calculate Legilimency success rate.

    Base rate: 30% (risky spell, lower than safe 70%)
    Specificity bonus: +30% if intent specified (no target - always witness)
    Decline penalty: -10% per attempt on this witness
    Floor: 10% minimum

    Args:
        player_input: Player's text input
        attempts_on_witness: Spell cast count on this witness
        witness_id: Witness ID (for tracking)

    Returns:
        True if spell succeeds, False otherwise

    Example:
        "legilimency to find out about draco" (1st cast)
        → 30% + 30% (intent) = 60% success

        Same input, 3rd cast:
        → 30% + 30% - 20% = 40% success

        "legilimency" (no intent, 1st cast):
        → 30% + 0% = 30% success
    """
    base_rate = 30
    specificity_bonus = calculate_legilimency_specificity_bonus(player_input)
    decline_penalty = attempts_on_witness * 10
    success_rate = base_rate + specificity_bonus - decline_penalty
    success_rate = max(10, success_rate)  # Floor at 10%

    roll = random.random() * 100
    return roll < success_rate


def calculate_legilimency_specificity_bonus(player_input: str) -> int:
    """
    Calculate specificity bonus for Legilimency.

    Returns 0 or 30:
    - +30% if intent specified ("to find out about X", "about X")
    - No target bonus: target is always obvious (the witness being interrogated)

    Example:
        "legilimency" → 0%
        "legilimency to find out about draco" → 30%
        "legilimency about the crime" → 30%
    """
    # Intent detection only (reuse extract_intent_from_input)
    intent = extract_intent_from_input(player_input)
    return 30 if intent else 0
```

**Occlumency Detection Pattern** (New for routes.py):
```python
# In _handle_programmatic_legilimency()
def calculate_detection_chance(
    witness: dict,
    witness_state: WitnessState,
) -> float:
    """
    Calculate detection chance based on Occlumency skill + repeat flag.

    Formula:
    - Base: 20%
    - Skill bonus: (occlumency_skill / 100) * 30% (0-30%)
    - Repeat penalty: +20% if legilimency_detected flag set
    - Cap: 95% maximum

    Example:
        Hermione occlumency_skill=50, first attempt:
        20% + (50/100)*30% + 0% = 35%

        Hermione, second attempt (detected first time):
        20% + 15% + 20% = 55%
    """
    base_detection = 20
    occlumency_skill = witness.get("occlumency_skill", 0)
    skill_bonus = (occlumency_skill / 100) * 30

    detection_chance = base_detection + skill_bonus

    # Repeat invasion penalty
    if witness_state.legilimency_detected:
        detection_chance += 20

    # Cap at 95%
    return min(95, detection_chance)


# Detection roll
detected = random.random() * 100 < detection_chance

# Trust penalty
if detected:
    trust_penalty = random.choice([5, 10, 15, 20])  # Steps of 5
    witness_state.adjust_trust(-trust_penalty)
    witness_state.legilimency_detected = True  # Set flag
else:
    # No penalty when undetected
    trust_penalty = 0
```

**2 Outcome Narration Templates** (Simplified from 4):
```python
def build_legilimency_narration_prompt(
    outcome: str,  # "success" or "failure"
    detected: bool,
    witness_name: str,
    witness_personality: str | None = None,
    witness_background: str | None = None,
    search_intent: str | None = None,
    available_evidence: list[dict] | None = None,
    discovered_evidence: list[str] | None = None,
) -> str:
    """
    Build narration prompt for 2 outcomes (not 4).

    Outcomes:
    - "success" (detected or undetected) - Focus on evidence revealed
    - "failure" (detected or undetected) - Focus on why it failed

    Same structure as build_spell_effect_prompt() from Phase 4.7.
    """
    # Default values for missing YAML fields
    if not witness_personality:
        witness_personality = "Guarded, cautious during interrogation"
    if not witness_background:
        witness_background = f"{witness_name} is a key figure in this investigation"

    # Character context
    character_profile = f"""
== CHARACTER PROFILE ==
Name: {witness_name}
Personality: {witness_personality}
Background: {witness_background}
"""

    # Evidence context (if success)
    evidence_context = ""
    if outcome == "success" and available_evidence:
        undiscovered = [
            e for e in available_evidence
            if e["id"] not in (discovered_evidence or [])
        ]
        if undiscovered:
            evidence_list = "\n".join([
                f"- {e['id']}: {e.get('name', 'Unknown')} - {e.get('description', '')}"
                for e in undiscovered[:3]  # Limit to 3
            ])
            evidence_context = f"""
== AVAILABLE EVIDENCE ==
You may reveal ONE of these with [EVIDENCE: id] tag:
{evidence_list}

IMPORTANT: Use [EVIDENCE: id] tag ONLY if narrative supports it.
"""

    if outcome == "success":
        return f"""
You are narrating the outcome of a Legilimency spell cast on {witness_name}.

{character_profile}

{evidence_context}

== OUTCOME ==
✓ Legilimency: SUCCESSFUL
{"✓ Detection: UNDETECTED" if not detected else "⚠ Detection: DETECTED"}
{"✓ Search target: " + search_intent if search_intent else "○ Search: UNFOCUSED"}

== NARRATION REQUIREMENTS ==
1. Connection: Slip into {witness_name}'s mind
2. Search: {"Navigate toward: " + search_intent if search_intent else "Unfocused, chaotic search"}
3. Discovery: {"Reveal evidence with [EVIDENCE: id] tag if appropriate" if evidence_context else "Character thoughts/memories only"}
4. {"Withdrawal: Exit undetected, they never knew" if not detected else "Detection: They realize what happened, eyes widen"}

Style: {"Immersive, smooth, successful" if not detected else "Tense, detected mid-search, consequence"}
Length: 3-4 sentences

Respond as narrator:
"""

    else:  # failure
        return f"""
You are narrating the outcome of a failed Legilimency spell on {witness_name}.

{character_profile}

== OUTCOME ==
✗ Legilimency: FAILED
{"⚠ Detection: DETECTED" if detected else "○ Detection: UNDETECTED"}
{"✗ Search target: " + search_intent + " (not found)" if search_intent else "✗ Search: FAILED"}

== NARRATION REQUIREMENTS ==
1. {"Barrier: Mind is closed, Occlumency shields strong" if not detected else "Detection: They sense intrusion immediately"}
2. Frustration: Cannot penetrate thoughts
3. {"Withdrawal: Exit empty-handed" if not detected else "Consequence: They glare, trust damaged"}

Style: {"Frustration, empty search" if not detected else "Detected, tense, consequence"}
Length: 2-3 sentences
No evidence revealed.

Respond as narrator:
"""
```

### Integration Points (Actual Codebase)

**File 1: spell_llm.py** - Add Legilimency to existing patterns:
```python
# Lines 26-72: SPELL_SEMANTIC_PHRASES constant
# ADD: "legilimency": [...10+ phrases...]

# Lines 143-242: calculate_spell_success() pattern
# ADD: calculate_legilimency_success() following same structure

# Lines 166-197: calculate_specificity_bonus() pattern
# ADD: calculate_legilimency_specificity_bonus() following same structure

# Lines 365-486: build_legilimency_narration_prompt() current
# REPLACE: Simplify to 2 outcomes (success/failure), follow build_spell_effect_prompt() structure
```

**File 2: routes.py** - Update _handle_programmatic_legilimency():
```python
# Lines 1048-1185: _handle_programmatic_legilimency() current
# REPLACE:
#   - Random detection (line 1091) → Occlumency-based detection
#   - Random penalties (lines 1095-1098) → Fixed -20 if detected, 0 if not
#   - Random evidence (line 1093) → Success calculation determines reveal
#   - 4 outcomes → 2 outcomes

# NEW detection calculation:
detection_chance = 20 + (witness.get("occlumency_skill", 0) / 100) * 30
if witness_state.legilimency_detected:
    detection_chance += 20
detected = random.random() * 100 < detection_chance

# NEW success calculation:
success = calculate_legilimency_success(
    player_input=request.question,
    attempts_in_location=witness_state.spell_attempts.get("legilimency", 0),
    location_id=witness_id,  # Use witness_id as "location" for tracking
)

# NEW trust penalty:
if detected:
    witness_state.adjust_trust(-20)
    witness_state.legilimency_detected = True
else:
    pass  # No penalty

# Track attempts (for decline penalty)
witness_state.spell_attempts["legilimency"] = witness_state.spell_attempts.get("legilimency", 0) + 1
```

**File 3: player_state.py** - Add consequence tracking:
```python
# Lines 92-132: WitnessState class
# ADD new field (line ~100):
class WitnessState(BaseModel):
    witness_id: str
    trust: int
    conversation_history: list[ConversationItem] = []
    secrets_revealed: list[str] = []
    awaiting_spell_confirmation: str | None = None
    legilimency_detected: bool = False  # NEW: Track if Legilimency detected
    spell_attempts: dict[str, int] = {}  # NEW: Track spell attempts by spell_id
```

**File 4: case_001.yaml** - Add Occlumency skill:
```yaml
# Lines 156-200: witnesses section
witnesses:
  - id: "hermione"
    name: "Hermione Granger"
    personality: "Brilliant student..."
    background: "Top student..."
    base_trust: 50
    occlumency_skill: 50  # NEW: 0-100, default 0 if missing

  - id: "draco"
    name: "Draco Malfoy"
    occlumency_skill: 30  # NEW

  - id: "harry"
    name: "Harry Potter"
    occlumency_skill: 0  # NEW: No training
```

### Debug Logging (Terminal Output)

**Pattern**: Same as safe spells (Phase 4.7), logger.info() for formula visibility

**Location**: Backend terminal when running `uv run uvicorn src.main:app --reload`

**Example Output**:
```
INFO: 🧠 Legilimency: Hermione Granger | Input: 'legilimency to find out about draco' | Attempt #1 | Success: 60% (30+30-0) = SUCCESS | Detection: 35% (20+15+0) = UNDETECTED | Trust: +0
INFO: 🧠 Legilimency: Hermione Granger | Input: 'legilimency' | Attempt #2 | Success: 20% (30+0-10) = FAILURE | Detection: 35% (20+15+0) = DETECTED | Trust: -15
INFO: 🧠 Legilimency: Hermione Granger | Input: 'legilimency about the crime' | Attempt #3 | Success: 40% (30+30-20) = SUCCESS | Detection: 55% (20+15+20) = DETECTED | Trust: -20
```

**Format Breakdown**:
- `🧠 Legilimency`: Spell type (different from `🪄` for safe spells)
- `Hermione Granger`: Witness name
- `Input: '...'`: Player's raw input
- `Attempt #N`: Sequential attempt count on this witness
- `Success: X% (base+bonus-decline)`: Formula breakdown showing 30 + specificity - attempts*10
- `= SUCCESS/FAILURE`: Calculated outcome
- `Detection: X% (base+skill+repeat)`: Formula showing 20 + Occlumency + repeat penalty
- `= DETECTED/UNDETECTED`: Roll result
- `Trust: ±N`: Applied trust delta (-5/-10/-15/-20 if detected, 0 if undetected)

**Benefits**:
1. **Development**: Verify formulas work correctly in real-time
2. **Testing**: Spot calculation bugs immediately
3. **Debugging**: See why player got unexpected outcome
4. **Balancing**: Adjust percentages based on observed results

---

### Library-Specific Gotchas

**From project experience (Phase 4.6.2 + 4.7)**:

1. **Trust Adjustment**:
   - ⚠️ ALWAYS use `witness_state.adjust_trust(delta)` (not direct assignment)
   - ⚠️ This method clamps to [0, 100] automatically (lines 123-125 player_state.py)
   - Example: `witness_state.adjust_trust(-20)` ensures trust never goes below 0

2. **Semantic Phrase Matching**:
   - ⚠️ Use substring match (not full regex) for phrase detection
   - ⚠️ Lowercase comparison via `player_input.lower()`
   - Example: `"read her mind" in player_input.lower()` detects phrase

3. **Conversation History**:
   - ⚠️ Limited to 20 messages max (Phase 4.4 feature)
   - ⚠️ Record Legilimency as `"[Legilimency: {intent}]"` format (not raw input)
   - Example: `question = f"[Legilimency: {search_intent or 'unfocused'}]"`

4. **Evidence Extraction**:
   - ⚠️ Use `extract_evidence_from_response()` from evidence.py (line 80-94)
   - ⚠️ LLM must output `[EVIDENCE: id]` tag (not just evidence name)
   - Example: Narration includes "You discover... [EVIDENCE: hidden_note]"

5. **Default YAML Values**:
   - ⚠️ ALWAYS provide fallback for missing personality/background
   - ⚠️ Use `.get()` with default, not direct access
   - Example: `witness.get("occlumency_skill", 0)` defaults to 0

6. **Attempt Tracking**:
   - ⚠️ Track per witness (not per location like safe spells)
   - ⚠️ Use witness_id as "location" parameter in decline calculation
   - ⚠️ Reset on location change does NOT apply (Legilimency is witness-specific)

### Decision Tree

```
Player casts Legilimency on witness:

1. Detect spell via fuzzy matching
   ├─ Exact: "legilimency"
   ├─ Typo: "legulemancy" (70% fuzzy match)
   └─ Semantic: "read her mind", "peek into thought"

2. Extract specifics
   ├─ Target: "on hermione" → +15% bonus
   └─ Intent: "to find out about draco" → +15% bonus

3. Calculate success rate
   ├─ Base: 30%
   ├─ Specificity: 0-30% (target + intent)
   ├─ Decline: -10% per previous attempt on THIS witness
   └─ Floor: 10% minimum

4. Roll success
   ├─ Success → Proceed to step 5
   └─ Failure → Outcome = "failure", skip evidence

5. Calculate detection (if success)
   ├─ Base: 20%
   ├─ Occlumency: +(skill/100)*30% (0-30%)
   ├─ Repeat: +20% if legilimency_detected flag set
   └─ Cap: 95% maximum

6. Roll detection
   ├─ Detected → trust -20, set flag, outcome = "success" + detected
   └─ Undetected → trust 0, outcome = "success" + undetected

7. Build narration prompt
   ├─ Outcome: "success" or "failure"
   ├─ Detection status: detected or undetected
   └─ Character context + available evidence

8. Get LLM narration
   ├─ Extract evidence: [EVIDENCE: id] tags
   ├─ Extract secrets: Keyword matching (existing)
   └─ Return response

9. Save state
   ├─ Update conversation_history
   ├─ Increment spell_attempts["legilimency"]
   ├─ Save discovered_evidence
   └─ Persist to JSON
```

### Configuration Requirements

```bash
# No new dependencies
# Reuse existing: rapidfuzz, pydantic, random, re

# No new env vars
# Reuse: ANTHROPIC_API_KEY

# YAML changes:
# Add occlumency_skill field to witnesses (0-100, default 0)
```

---

## Current Codebase Structure

```bash
# FROM CODEBASE (Actual paths from research)
backend/src/
├── context/
│   └── spell_llm.py           # MODIFY - Add Legilimency functions (lines 26, 143-242, 365-486)
├── api/
│   └── routes.py              # MODIFY - Rewrite _handle_programmatic_legilimency (lines 1048-1185)
├── state/
│   └── player_state.py        # MODIFY - Add WitnessState fields (lines 92-132)
├── case_store/
│   └── case_001.yaml          # MODIFY - Add occlumency_skill to witnesses (lines 156-200)
└── tests/
    ├── test_spell_llm.py      # MODIFY - Add Legilimency tests (new tests)
    └── test_routes.py         # MODIFY - Add integration tests (new tests)
```

## Desired Codebase Structure

```bash
backend/src/
├── context/
│   └── spell_llm.py           # MODIFIED - 3 new functions + 1 constant update
├── api/
│   └── routes.py              # MODIFIED - Rewritten handler (~140 lines)
├── state/
│   └── player_state.py        # MODIFIED - 2 new fields in WitnessState
├── case_store/
│   └── case_001.yaml          # MODIFIED - occlumency_skill added to 3 witnesses
└── tests/
    ├── test_spell_llm.py      # MODIFIED - 24 new unit tests
    └── test_routes.py         # MODIFIED - 24 new integration tests
```

**Note**: validation-gates handles test file creation. Tests listed for completeness.

---

## Files to Create/Modify

| File | Action | Purpose | Reference File | Lines |
|------|--------|---------|----------------|-------|
| `backend/src/context/spell_llm.py` | MODIFY | Add fuzzy phrase matching + Legilimency functions | Existing simple spell patterns | 26, 245-338, 143-242, 365-486 |
| `backend/src/context/witness.py` | MODIFY | Add legilimency_detected to build_witness_prompt() | Existing prompt builder | TBD |
| `backend/src/api/routes.py` | MODIFY | Rewrite _handle_programmatic_legilimency() | Existing handler | 1048-1185 |
| `backend/src/state/player_state.py` | MODIFY | Add WitnessState fields | Existing class | 92-132 |
| `backend/src/case_store/case_001.yaml` | MODIFY | Add occlumency_skill to witnesses | Existing witness definitions | 156-200 |
| `backend/tests/test_spell_llm.py` | MODIFY | Add Legilimency unit tests | Existing spell tests | New tests |
| `backend/tests/test_routes.py` | MODIFY | Add integration tests | Existing route tests | New tests |

**Note**: Test files handled by validation-gates. Listed for completeness.

---

## Tasks (Ordered)

### Task 1: Add Legilimency to Semantic Phrases
**File**: `backend/src/context/spell_llm.py`
**Action**: MODIFY (add to existing constant)
**Purpose**: Enable fuzzy detection of Legilimency via full phrases
**Reference**: Lines 26-72 (existing SPELL_SEMANTIC_PHRASES constant)
**Pattern**: Same structure as other spells (list of strings)
**Depends on**: None
**Acceptance criteria**:
- [ ] `SPELL_SEMANTIC_PHRASES["legilimency"]` exists with 10+ phrases
- [ ] Includes: "read mind", "read her mind", "peek into thought", "search memor"
- [ ] Includes variants: "legilimency", "legilimens"
- [ ] Matches existing pattern (lowercase strings, no regex)

**Code Example**:
```python
# In spell_llm.py, line 26-72
SPELL_SEMANTIC_PHRASES: dict[str, list[str]] = {
    "revelio": [...],  # Existing
    "lumos": [...],  # Existing
    # ... other spells ...

    # NEW: Add Legilimency
    "legilimency": [
        "legilimency",
        "legilimens",
        "read mind",
        "read her mind",
        "read his mind",
        "read their mind",
        "peek into mind",
        "peek into thought",
        "search memor",  # Catches "memories", "memory"
        "probe mind",
        "enter mind",
    ],
}
```

---

### Task 2: Add Fuzzy Phrase Matching (Priority 3.5)
**File**: `backend/src/context/spell_llm.py`
**Action**: MODIFY (update detect_spell_with_fuzzy function)
**Purpose**: Enable typo tolerance for semantic phrases via fuzzy matching
**Reference**: Lines 245-338 (existing detect_spell_with_fuzzy)
**Pattern**: Add Priority 3.5 after Priority 3 (exact substring)
**Depends on**: Task 1 (semantic phrases must exist first)
**Acceptance criteria**:
- [ ] Priority 3 (exact substring) unchanged (fast path)
- [ ] Priority 3.5 (fuzzy phrase) added after Priority 3 fails
- [ ] Uses `fuzz.partial_ratio()` with 70% threshold
- [ ] Detects typos: "reed her minde" → matches "read her mind"
- [ ] Does NOT match unrelated text: "What's on your mind?" → no match

**Code Example**:
```python
# In spell_llm.py, detect_spell_with_fuzzy() function (lines 245-338)
from rapidfuzz import fuzz

def detect_spell_with_fuzzy(text: str) -> tuple[str | None, str | None]:
    """..."""
    text_lower = text.lower()
    spell_order = get_spell_order_from_text(text_lower)
    target = extract_target_from_input(text)

    # ... Priority 1, 2 unchanged ...

    # Priority 3: Exact semantic phrase match (FAST, unchanged)
    for spell_id in spell_order:
        phrases = SPELL_SEMANTIC_PHRASES.get(spell_id, [])
        for phrase in phrases:
            if phrase in text_lower:
                return spell_id, target

    # NEW: Priority 3.5: Fuzzy phrase match (SLOWER, catches typos)
    for spell_id in spell_order:
        phrases = SPELL_SEMANTIC_PHRASES.get(spell_id, [])
        for phrase in phrases:
            score = fuzz.partial_ratio(text_lower, phrase)
            if score > 70:  # Same threshold as spell name fuzzy
                return spell_id, target

    return None, None
```

---

### Task 3: Create Legilimency Success Calculation
**File**: `backend/src/context/spell_llm.py`
**Action**: CREATE (new function)
**Purpose**: Calculate success rate using 30% base + specificity - decline
**Reference**: Lines 200-242 (existing calculate_spell_success function)
**Pattern**: Same structure as safe spells, different base rate
**Depends on**: Task 3 (specificity bonus function)
**Acceptance criteria**:
- [ ] `calculate_legilimency_success()` function exists
- [ ] Base rate: 30% (not 70%)
- [ ] Calls `calculate_legilimency_specificity_bonus()`
- [ ] Applies -10% per attempt decline penalty
- [ ] Floor at 10% minimum
- [ ] Returns bool (True = success)
- [ ] Docstring with examples

**Code Example**:
```python
def calculate_legilimency_success(
    player_input: str,
    attempts_in_location: int,
    location_id: str,
) -> bool:
    """
    Calculate Legilimency success rate.

    Base rate: 30% (risky spell, lower than safe 70%)
    Specificity bonus: +15% target, +15% intent (max 30%)
    Decline penalty: -10% per attempt in location
    Floor: 10% minimum

    Args:
        player_input: Player's text input
        attempts_in_location: Spell cast count on this witness
        location_id: Witness ID (used as "location" for tracking)

    Returns:
        True if spell succeeds, False otherwise

    Example:
        "legilimency on hermione to find out about draco" (1st cast)
        → 30% + 15% (target) + 15% (intent) = 60% success

        Same input, 3rd cast:
        → 30% + 30% - 20% = 40% success
    """
    base_rate = 30
    specificity_bonus = calculate_legilimency_specificity_bonus(player_input)
    decline_penalty = attempts_in_location * 10
    success_rate = base_rate + specificity_bonus - decline_penalty
    success_rate = max(10, success_rate)  # Floor at 10%

    roll = random.random() * 100
    return roll < success_rate
```

---

### Task 4: Create Specificity Bonus Calculation
**File**: `backend/src/context/spell_llm.py`
**Action**: CREATE (new function)
**Purpose**: Calculate +30% intent bonus (no target - always obvious)
**Reference**: Lines 166-197 (existing calculate_specificity_bonus)
**Pattern**: Simplified - intent-only detection
**Depends on**: None (reuses extract_intent_from_input)
**Acceptance criteria**:
- [ ] `calculate_legilimency_specificity_bonus()` function exists
- [ ] Returns 0 or 30 (not other values)
- [ ] Detects intent: "to find out about X", "about X" → +30%
- [ ] No target extraction (always witness in interrogation)
- [ ] Docstring with examples

**Code Example**:
```python
def calculate_legilimency_specificity_bonus(player_input: str) -> int:
    """
    Calculate specificity bonus for Legilimency.

    Returns 0 or 30:
    - +30% if intent specified ("to find out about X", "about X")
    - No target bonus: target is always obvious (the witness)

    Example:
        "legilimency" → 0%
        "legilimency to find out about draco" → 30%
        "legilimency about the crime" → 30%
    """
    # Intent detection only (reuse extract_intent_from_input)
    intent = extract_intent_from_input(player_input)
    return 30 if intent else 0
```

---

### Task 4: Simplify Narration Prompt (2 Outcomes)
**File**: `backend/src/context/spell_llm.py`
**Action**: MODIFY (rewrite existing function)
**Purpose**: Simplify from 4 outcomes to 2 (success/failure)
**Reference**: Lines 365-486 (existing build_legilimency_narration_prompt)
**Pattern**: Follow build_spell_effect_prompt() structure from Phase 4.7
**Depends on**: None
**Acceptance criteria**:
- [ ] `build_legilimency_narration_prompt()` simplified to 2 outcomes
- [ ] Outcome: "success" or "failure" (not 4 separate outcomes)
- [ ] Includes character profile (personality + background)
- [ ] Includes evidence context (available_evidence list)
- [ ] Default values: personality/background if missing
- [ ] Same structure as build_spell_effect_prompt()
- [ ] Docstring updated

**Code Example**:
```python
def build_legilimency_narration_prompt(
    outcome: str,  # "success" or "failure"
    detected: bool,
    witness_name: str,
    witness_personality: str | None = None,
    witness_background: str | None = None,
    search_intent: str | None = None,
    available_evidence: list[dict] | None = None,
    discovered_evidence: list[str] | None = None,
) -> str:
    """
    Build narration prompt for Legilimency outcomes.

    Outcomes:
    - "success" (detected or undetected) - Focus on evidence revealed
    - "failure" (detected or undetected) - Focus on why it failed

    Args:
        outcome: "success" or "failure"
        detected: Whether witness detected the intrusion
        witness_name: Witness name
        witness_personality: Optional personality description
        witness_background: Optional background description
        search_intent: Optional search target extracted from input
        available_evidence: Optional list of evidence that could be revealed
        discovered_evidence: Optional list of already-discovered evidence IDs

    Returns:
        Prompt string for LLM narration
    """
    # Default values for missing YAML fields
    if not witness_personality:
        witness_personality = "Guarded, cautious during interrogation"
    if not witness_background:
        witness_background = f"{witness_name} is a key figure in this investigation"

    # Character context
    character_profile = f"""
== CHARACTER PROFILE ==
Name: {witness_name}
Personality: {witness_personality}
Background: {witness_background}
"""

    # Evidence context (if success)
    evidence_context = ""
    if outcome == "success" and available_evidence:
        undiscovered = [
            e for e in available_evidence
            if e["id"] not in (discovered_evidence or [])
        ]
        if undiscovered:
            evidence_list = "\n".join([
                f"- {e['id']}: {e.get('name', 'Unknown')} - {e.get('description', '')}"
                for e in undiscovered[:3]  # Limit to 3
            ])
            evidence_context = f"""
== AVAILABLE EVIDENCE ==
You may reveal ONE of these with [EVIDENCE: id] tag:
{evidence_list}

IMPORTANT: Use [EVIDENCE: id] tag ONLY if narrative supports it.
"""

    if outcome == "success":
        return f"""
You are narrating the outcome of a Legilimency spell cast on {witness_name}.

{character_profile}

{evidence_context}

== OUTCOME ==
✓ Legilimency: SUCCESSFUL
{"✓ Detection: UNDETECTED" if not detected else "⚠ Detection: DETECTED"}
{"✓ Search target: " + search_intent if search_intent else "○ Search: UNFOCUSED"}

== NARRATION REQUIREMENTS ==
1. Connection: Slip into {witness_name}'s mind
2. Search: {"Navigate toward: " + search_intent if search_intent else "Unfocused, chaotic search"}
3. Discovery: {"Reveal evidence with [EVIDENCE: id] tag if appropriate" if evidence_context else "Character thoughts/memories only"}
4. {"Withdrawal: Exit undetected, they never knew" if not detected else "Detection: They realize what happened, eyes widen"}

Style: {"Immersive, smooth, successful" if not detected else "Tense, detected mid-search, consequence"}
Length: 3-4 sentences

Respond as narrator:
"""

    else:  # failure
        return f"""
You are narrating the outcome of a failed Legilimency spell on {witness_name}.

{character_profile}

== OUTCOME ==
✗ Legilimency: FAILED
{"⚠ Detection: DETECTED" if detected else "○ Detection: UNDETECTED"}
{"✗ Search target: " + search_intent + " (not found)" if search_intent else "✗ Search: FAILED"}

== NARRATION REQUIREMENTS ==
1. {"Barrier: Mind is closed, Occlumency shields strong" if not detected else "Detection: They sense intrusion immediately"}
2. Frustration: Cannot penetrate thoughts
3. {"Withdrawal: Exit empty-handed" if not detected else "Consequence: They glare, trust damaged"}

Style: {"Frustration, empty search" if not detected else "Detected, tense, consequence"}
Length: 2-3 sentences
No evidence revealed.

Respond as narrator:
"""
```

---

### Task 5: Add WitnessState Fields
**File**: `backend/src/state/player_state.py`
**Action**: MODIFY (add fields to existing class)
**Purpose**: Track Legilimency detection flag + spell attempts
**Reference**: Lines 92-132 (existing WitnessState class)
**Pattern**: Same Pydantic Field pattern as other fields
**Depends on**: None
**Acceptance criteria**:
- [ ] `legilimency_detected: bool = False` field exists
- [ ] `spell_attempts: dict[str, int] = {}` field exists
- [ ] Default values correct (False, empty dict)
- [ ] Backward compatible (old saves load without error)

**Code Example**:
```python
# In player_state.py, lines 92-132
class WitnessState(BaseModel):
    """Per-witness interrogation state."""

    witness_id: str
    trust: int
    conversation_history: list[ConversationItem] = []
    secrets_revealed: list[str] = []
    awaiting_spell_confirmation: str | None = None
    legilimency_detected: bool = False  # NEW: Track if Legilimency detected
    spell_attempts: dict[str, int] = {}  # NEW: Track spell attempts by spell_id

    def add_conversation(...) -> None: ...
    def reveal_secret(...) -> None: ...
    def adjust_trust(...) -> None: ...
    def get_history_as_dicts(...) -> list[dict]: ...
```

---

### Task 6: Rewrite Legilimency Handler
**File**: `backend/src/api/routes.py`
**Action**: MODIFY (rewrite existing function)
**Purpose**: Replace random logic with formula-based calculation
**Reference**: Lines 1048-1185 (existing _handle_programmatic_legilimency)
**Pattern**: Call new spell_llm functions, apply fixed trust penalty
**Depends on**: Tasks 1-5 (all spell_llm functions + WitnessState fields)
**Acceptance criteria**:
- [ ] Success calculation: Uses `calculate_legilimency_success()`
- [ ] Detection calculation: Occlumency-based (20% + skill/100*30% + repeat+20%)
- [ ] Trust penalty: random.choice([5,10,15,20]) if detected, 0 if undetected
- [ ] Consequence flag: Sets legilimency_detected = True on detection
- [ ] Attempt tracking: Increments spell_attempts["legilimency"]
- [ ] Debug logging: logger.info() shows formula breakdown (like safe spells)
- [ ] Narration prompt: Uses simplified 2-outcome template
- [ ] Evidence extraction: Reuses existing extract_evidence_from_response()
- [ ] Secret extraction: Reuses existing keyword matching
- [ ] State persistence: Saves conversation + state

**Code Example**:
```python
# In routes.py, lines 1048-1185 (rewrite)
async def _handle_programmatic_legilimency(
    request: InterrogateRequest,
    witness: dict,
    state: PlayerState,
    witness_state: WitnessState,
) -> InterrogateResponse:
    """
    Handle Legilimency spell in witness interrogation.

    Phase 4.8: Formula-based success + Occlumency detection + fixed penalties.

    Flow:
    1. Extract intent/target from input
    2. Calculate success rate (30% base + specificity - decline)
    3. Roll success
    4. Calculate detection (Occlumency + repeat penalty)
    5. Roll detection
    6. Apply trust penalty (-20 if detected, 0 if not)
    7. Build narration prompt (2 outcomes)
    8. Get LLM narration
    9. Extract evidence/secrets
    10. Save state
    """
    witness_name = witness["name"]
    witness_id = witness["id"]

    # Extract specifics from input
    search_intent = extract_intent_from_input(request.question)
    search_target = extract_target_from_input(request.question)

    # Get attempt count for decline penalty
    attempts = witness_state.spell_attempts.get("legilimency", 0)

    # Calculate success rate (30% base + specificity - decline, floor 10%)
    success = calculate_legilimency_success(
        player_input=request.question,
        attempts_in_location=attempts,
        location_id=witness_id,  # Use witness_id as "location"
    )

    # Calculate detection chance (Occlumency-based)
    base_detection = 20
    occlumency_skill = witness.get("occlumency_skill", 0)
    skill_bonus = (occlumency_skill / 100) * 30
    detection_chance = base_detection + skill_bonus

    # Repeat invasion penalty
    if witness_state.legilimency_detected:
        detection_chance += 20

    # Cap at 95%
    detection_chance = min(95, detection_chance)

    # Roll detection
    detected = random.random() * 100 < detection_chance

    # Determine outcome
    outcome = "success" if success else "failure"

    # Apply trust penalty
    trust_delta = 0
    if detected:
        trust_delta = -random.choice([5, 10, 15, 20])  # Steps of 5
        witness_state.legilimency_detected = True  # Set flag
        witness_state.adjust_trust(trust_delta)

    # Track attempts
    witness_state.spell_attempts["legilimency"] = attempts + 1

    # Debug logging (visible in uvicorn terminal)
    specificity_bonus = calculate_legilimency_specificity_bonus(request.question)
    decline_penalty = attempts * 10
    success_rate = 30 + specificity_bonus - decline_penalty
    success_rate = max(10, success_rate)
    repeat_penalty = 20 if witness_state.legilimency_detected else 0

    logger.info(
        f"🧠 Legilimency: {witness_name} | Input: '{request.question}' | "
        f"Attempt #{attempts + 1} | "
        f"Success: {success_rate:.0f}% (30+{specificity_bonus}-{decline_penalty}) = "
        f"{'SUCCESS' if success else 'FAILURE'} | "
        f"Detection: {detection_chance:.0f}% (20+{skill_bonus:.0f}+{repeat_penalty}) = "
        f"{'DETECTED' if detected else 'UNDETECTED'} | "
        f"Trust: {trust_delta:+d}"
    )

    # Load evidence context
    case_data = state.case_data
    location = next((loc for loc in case_data.get("locations", []) if loc["id"] == state.current_location), None)
    available_evidence = location.get("hidden_evidence", []) if location else []

    # Build narration prompt
    prompt = build_legilimency_narration_prompt(
        outcome=outcome,
        detected=detected,
        witness_name=witness_name,
        witness_personality=witness.get("personality"),
        witness_background=witness.get("background"),
        search_intent=search_intent,
        available_evidence=available_evidence if success else None,
        discovered_evidence=list(state.discovered_evidence.keys()),
    )

    # Get LLM narration
    try:
        narration = await claude_client.get_response(prompt)
    except ClaudeClientError as e:
        # Template fallback on LLM error
        if detected:
            narration = f"{witness_name}'s eyes widen. They sensed your intrusion. Trust damaged."
        else:
            narration = f"You attempt to slip into {witness_name}'s mind, but their thoughts remain closed."

    # Extract evidence from narration
    evidence_found = extract_evidence_from_response(narration)
    for evidence_id in evidence_found:
        evidence_obj = next((e for e in available_evidence if e["id"] == evidence_id), None)
        if evidence_obj and evidence_id not in state.discovered_evidence:
            state.add_evidence(evidence_id, evidence_obj)

    # Extract secrets (existing keyword matching logic)
    secrets_revealed = []
    secret_texts = {}
    if success and search_intent:
        for secret in witness.get("secrets", []):
            keywords = secret.get("keywords", [])
            if any(kw in search_intent.lower() for kw in keywords):
                secret_id = secret["id"]
                if secret_id not in witness_state.secrets_revealed:
                    witness_state.reveal_secret(secret_id)
                    secrets_revealed.append(secret_id)
                    secret_texts[secret_id] = secret.get("text", "")

    # Save conversation
    question_text = f"[Legilimency: {search_intent or 'unfocused'}]"
    witness_state.add_conversation(
        question=question_text,
        response=narration,
        trust_delta=trust_delta,
    )

    # Update state
    state.update_witness_state(witness_state)

    # Save state
    save_state(request.case_id, state)

    return InterrogateResponse(
        response=narration,
        trust=witness_state.trust,
        trust_delta=trust_delta,
        secrets_revealed=secrets_revealed,
        secret_texts=secret_texts,
    )
```

---

### Task 7: Add Occlumency Skill to YAML
**File**: `backend/src/case_store/case_001.yaml`
**Action**: MODIFY (add field to existing witnesses)
**Purpose**: Provide Occlumency skill values for witnesses
**Reference**: Lines 156-200 (existing witnesses section)
**Pattern**: Same YAML structure, add one field per witness
**Depends on**: None
**Acceptance criteria**:
- [ ] Hermione: `occlumency_skill: 50` (trained, moderate)
- [ ] Draco: `occlumency_skill: 30` (some training)
- [ ] Harry: `occlumency_skill: 0` (no training)
- [ ] YAML validates (no syntax errors)

**Code Example**:
```yaml
# In case_001.yaml, lines 156-200
witnesses:
  - id: "hermione"
    name: "Hermione Granger"
    personality: "Brilliant student, logical thinker, protective of friends"
    background: "Top student in year, knows restricted section intimately"
    base_trust: 50
    occlumency_skill: 50  # NEW: Moderate skill (35% detection: 20% + 15%)

    knowledge: [...]
    secrets: [...]

  - id: "draco"
    name: "Draco Malfoy"
    personality: "Arrogant, defensive, family-first"
    background: "Pure-blood supremacist, often in restricted section"
    base_trust: 30
    occlumency_skill: 30  # NEW: Some training (29% detection: 20% + 9%)

    knowledge: [...]
    secrets: [...]

  - id: "harry"
    name: "Harry Potter"
    personality: "Brave, impulsive, loyal to friends"
    background: "The Boy Who Lived, Gryffindor seeker"
    base_trust: 60
    occlumency_skill: 0  # NEW: No training (20% detection: 20% + 0%)

    knowledge: [...]
    secrets: [...]
```

---

### Task 8: Unit Tests - Success Calculation
**File**: `backend/tests/test_spell_llm.py`
**Action**: CREATE (new test class)
**Purpose**: Test success rate calculation (base, bonus, decline, floor)
**Reference**: Existing TestCalculateSpellSuccess class (Phase 4.7)
**Pattern**: Same statistical test approach (run 100 times, check range)
**Depends on**: Task 2 (success calculation function)
**Acceptance criteria**:
- [ ] Test base 30% success (no bonuses, 0 attempts)
- [ ] Test +15% target bonus
- [ ] Test +15% intent bonus
- [ ] Test +30% max bonus (target + intent)
- [ ] Test decline penalty (-10% per attempt)
- [ ] Test floor at 10% (many attempts)
- [ ] Statistical ranges (e.g., 30% → 20-40% in 100 rolls)

**Note**: validation-gates creates test file. Listed for completeness.

---

### Task 9: Unit Tests - Specificity Bonus
**File**: `backend/tests/test_spell_llm.py`
**Action**: CREATE (new test class)
**Purpose**: Test specificity bonus calculation logic
**Reference**: Existing specificity bonus tests (Phase 4.7)
**Pattern**: Same exact-match approach (not statistical)
**Depends on**: Task 3 (specificity bonus function)
**Acceptance criteria**:
- [ ] Test no bonus: "legilimency" → 0
- [ ] Test target only: "legilimency on hermione" → 15
- [ ] Test intent only: "legilimency to find out about draco" → 15
- [ ] Test both: "legilimency on hermione to find out about draco" → 30
- [ ] Test edge cases: missing target/intent

**Note**: validation-gates creates test file. Listed for completeness.

---

### Task 10: Unit Tests - Semantic Phrases
**File**: `backend/tests/test_spell_llm.py`
**Action**: CREATE (new test class)
**Purpose**: Test fuzzy detection with semantic phrases
**Reference**: Existing TestDetectSpellWithFuzzy class (Phase 4.6.2)
**Pattern**: Same detection test approach
**Depends on**: Task 1 (semantic phrases constant)
**Acceptance criteria**:
- [ ] Test exact spell name: "legilimency" → detected
- [ ] Test typo: "legulemancy" → detected (fuzzy)
- [ ] Test semantic phrases: "read her mind", "peek into thought" → detected
- [ ] Test full sentence: "I want to read hermione's mind" → detected
- [ ] Test no false positive: "What's in your mind?" → NOT detected

**Note**: validation-gates creates test file. Listed for completeness.

---

### Task 11: Unit Tests - Occlumency Detection
**File**: `backend/tests/test_spell_llm.py`
**Action**: CREATE (new test class)
**Purpose**: Test Occlumency detection calculation
**Reference**: New logic (no existing test)
**Pattern**: Statistical tests (run 100 times, check range)
**Depends on**: Task 6 (handler with detection logic)
**Acceptance criteria**:
- [ ] Test no skill: occlumency_skill=0 → ~20% detection
- [ ] Test moderate skill: occlumency_skill=50 → ~35% detection
- [ ] Test high skill: occlumency_skill=100 → ~50% detection
- [ ] Test repeat penalty: legilimency_detected=True → +20% detection
- [ ] Statistical ranges (e.g., 35% → 25-45% in 100 rolls)

**Note**: validation-gates creates test file. Listed for completeness.

---

### Task 12: Integration Tests - Full Flow
**File**: `backend/tests/test_routes.py`
**Action**: CREATE (new test class)
**Purpose**: Test complete Legilimency flow (input → response)
**Reference**: Existing TestInterrogateWitness class (Phase 4.6.2)
**Pattern**: Async route test with mock LLM
**Depends on**: All previous tasks (full integration)
**Acceptance criteria**:
- [ ] Test successful Legilimency with specificity
- [ ] Test detected Legilimency (trust -20, flag set)
- [ ] Test undetected Legilimency (trust 0, no flag)
- [ ] Test repeat invasion (+20% detection)
- [ ] Test high Occlumency witness (50% detection)
- [ ] Test decline penalty (success rate drops)
- [ ] Test conversation history saved
- [ ] Test evidence extraction from narration

**Note**: validation-gates creates test file. Listed for completeness.

---

### Task 13: Integration Tests - Edge Cases
**File**: `backend/tests/test_routes.py`
**Action**: CREATE (new test class)
**Purpose**: Test edge cases and error handling
**Reference**: Existing edge case tests (Phase 4.7)
**Pattern**: Same error handling test approach
**Depends on**: Task 6 (handler implementation)
**Acceptance criteria**:
- [ ] Test missing personality/background (defaults used)
- [ ] Test missing occlumency_skill (defaults to 0)
- [ ] Test LLM error (template fallback)
- [ ] Test spam attempts (floor at 10%)
- [ ] Test max detection cap (95% max)
- [ ] Test backward compatibility (old saves load)

**Note**: validation-gates creates test file. Listed for completeness.

---

## Integration Points

### Backend API
**Where**: `backend/src/api/routes.py` (lines 1048-1185)
**What**: Rewrite `_handle_programmatic_legilimency()` handler
**Pattern**: Call new spell_llm functions, apply fixed penalties

### Spell LLM
**Where**: `backend/src/context/spell_llm.py` (lines 26, 143-242, 365-486)
**What**: Add 3 new functions + update semantic phrases constant
**Pattern**: Same structure as simple spell success system

### State Management
**Where**: `backend/src/state/player_state.py` (lines 92-132)
**What**: Add 2 fields to WitnessState (legilimency_detected, spell_attempts)
**Pattern**: Pydantic Field with default values

### YAML Case Data
**Where**: `backend/src/case_store/case_001.yaml` (lines 156-200)
**What**: Add occlumency_skill field to 3 witnesses
**Pattern**: Integer field 0-100, default 0 if missing

---

## Known Gotchas

### Claude API (from project experience)
- **Issue**: LLM timeout during narration
- **Solution**: Template fallback in try/except (see Task 6 code example)
- **Reference**: Existing pattern in narrator.py

### Pydantic Serialization (from Phase 4.4)
- **Issue**: New fields must have defaults for backward compatibility
- **Solution**: `legilimency_detected: bool = False` with default
- **Reference**: WitnessState existing fields

### Trust Clamping (from Phase 4.6.2)
- **Issue**: Direct trust assignment can exceed [0, 100] bounds
- **Solution**: ALWAYS use `witness_state.adjust_trust(delta)` method
- **Reference**: player_state.py lines 123-125

### Semantic Phrase False Positives (from Phase 4.6.2)
- **Issue**: Conversational phrases like "What's in your mind?" detected
- **Solution**: Use substring match (not regex), test with negative cases
- **Reference**: test_spell_llm.py existing false positive tests

### Attempt Tracking (new for Phase 4.8)
- **Issue**: Legilimency is witness-specific, not location-specific
- **Solution**: Use witness_id as "location" parameter in calculation
- **Reference**: Routes use witness_id for tracking (see Task 6)

---

## Validation

### Syntax & Style (Pre-commit)
```bash
cd backend
uv run ruff check .
uv run ruff format .
uv run mypy src/
# Expected: 0 errors (14 pre-existing non-blocking in other files OK)
```

### Unit Tests (Core Logic)
```bash
cd backend
uv run pytest tests/test_spell_llm.py -v
# Expected: All new Legilimency tests pass (24 new tests)
```

### Integration Tests (Full Flow)
```bash
cd backend
uv run pytest tests/test_routes.py::TestLegilimencyIntegration -v
# Expected: All integration tests pass (24 new tests)
```

### Regression Tests (All Phases)
```bash
cd backend
uv run pytest
# Expected: 651 existing + 48 new = 699 total passing
```

**Note**: validation-gates agent handles comprehensive testing. No need to specify test scenarios in PRP.

---

## Dependencies

**No new packages**:
- Reuse existing: rapidfuzz, pydantic, random, re, datetime
- Reuse existing: anthropic SDK (Claude Haiku LLM)

**Configuration**:
- No new env vars needed
- Reuse existing `ANTHROPIC_API_KEY`

**YAML changes**:
```yaml
# Add to each witness in case_001.yaml
occlumency_skill: 50  # Integer 0-100, default 0 if missing
```

---

## Out of Scope

### Not Included in Phase 4.8
- **Dynamic Occlumency skill progression**: Witness skill doesn't change during investigation (future enhancement)
- **Legilimency in /api/investigate endpoint**: Only works in /api/interrogate (witness context)
- **Multiple search targets**: Intent extraction focuses on primary target (not list)
- **Legilimency success coaching**: No hints on how to improve success rate (player learns through experimentation)
- **Historical Legilimency attempts**: No tracking across cases (resets per case)

### Future Enhancements (Not Now)
- **Occlumency training system**: Witnesses could improve skill during investigation
- **Legilimency skill progression**: Player gets better at Legilimency with practice
- **Witness-specific consequences**: Dialog changes based on legilimency_detected flag (Phase 5+)
- **Memory fragments**: Failed Legilimency reveals partial information (complex)

---

## Agent Orchestration Plan

### Execution Strategy

**Sequential Track** (dependencies):
1. `fastapi-specialist` → Backend implementation (Tasks 1-7)
2. `validation-gates` → Run all tests (Tasks 8-13 auto-created)
3. `documentation-manager` → Update docs

**Why Sequential**: All tasks depend on previous tasks (1→2→3, 2→6, 3→6, 5→6, etc.).

### Agent-Specific Guidance

#### For fastapi-specialist

**Input**: Tasks 1-7 (Legilimency rewrite implementation)

**Context**: Quick Reference section above (no doc reading needed)

**Pattern**: Follow simple spell success system from Phase 4.7
- Success calculation: Same structure, different base rate (30% vs 70%)
- Specificity bonus: Same approach, Legilimency-specific intent detection
- Narration prompts: Simplify from 4 outcomes to 2 (success/failure)
- Trust penalties: Fixed values (no random.choice)

**Integration**: Modify existing _handle_programmatic_legilimency() in routes.py
- Lines 1048-1185 current implementation (rewrite in place)
- Call new spell_llm functions
- Load occlumency_skill from witness YAML
- Apply fixed trust penalty on detection

**Output**: Legilimency system mirrors simple spell patterns

**Key Files to Reference**:
- `spell_llm.py` lines 200-242 (calculate_spell_success pattern)
- `spell_llm.py` lines 166-197 (calculate_specificity_bonus pattern)
- `routes.py` lines 1048-1185 (existing handler to rewrite)
- `player_state.py` lines 92-132 (WitnessState class to extend)

**Implementation Order**:
1. Task 1 (semantic phrases) - Simple constant update
2. Task 3 (specificity bonus) - Independent function
3. Task 2 (success calculation) - Depends on Task 3
4. Task 4 (narration prompt) - Independent rewrite
5. Task 5 (WitnessState fields) - Simple field additions
6. Task 6 (handler rewrite) - Depends on all above
7. Task 7 (YAML) - Simple field additions

#### For validation-gates

**Input**: All code complete (Tasks 1-7)

**Runs**: Tests, lint, type check, build
- Unit tests: Success calc, specificity bonus, semantic phrases, Occlumency
- Integration tests: Full flow, edge cases, backward compatibility
- Regression tests: All 651 existing tests still pass

**Creates**: Test files for Tasks 8-13 (48 new tests)

**Output**: Pass/fail report
- Expected: 651 + 48 = 699 tests passing
- Expected: 0 linting errors
- Expected: 0 type errors (14 pre-existing non-blocking OK)

**Note**: validation-gates auto-creates comprehensive tests. No test scenarios needed in PRP.

#### For documentation-manager

**Input**: Code complete, validation passed

**Files changed**: List from "Files to Create/Modify" section

**Output**: Updated README, CHANGELOG, STATUS.md, PLANNING.md

**Key additions**:
- CHANGELOG: Phase 4.8 entry with algorithm explanation
- README: Update test counts (699 backend)
- STATUS.md: Mark Phase 4.8 complete
- PLANNING.md: Update phase status

### Handoff Context

**Next agent receives**:
- This PRP (full context)
- Quick Reference (no doc reading needed)
- Specific task numbers (1-13)
- Actual file paths to modify (from "Files to Create/Modify")
- Pattern files to follow (from research doc)

**Next agent does NOT need**:
- ❌ Read research files (Quick Reference has everything)
- ❌ Search for examples (code examples in PRP)
- ❌ Read docs (formulas documented in Quick Reference)
- ❌ Explore codebase (integration points provided)

---

## Anti-Patterns to Avoid

**From project experience (Phase 4.6.2 + 4.7)**:

### Code Anti-Patterns
- ❌ Using random.choice() for penalties (inconsistent) → ✅ Fixed values
- ❌ Multiple outcome templates (4) → ✅ Simplified (2)
- ❌ Direct trust assignment → ✅ Use adjust_trust() method
- ❌ Missing default YAML values → ✅ Provide fallbacks in code
- ❌ Location-based attempt tracking for Legilimency → ✅ Witness-based tracking

### Testing Anti-Patterns
- ❌ Testing exact random outcomes → ✅ Statistical ranges (20-40% for 30% rate)
- ❌ Hardcoding test data → ✅ Use fixtures
- ❌ Single test case → ✅ Multiple edge cases
- ❌ No backward compatibility tests → ✅ Test old saves load

### Architecture Anti-Patterns
- ❌ Creating new patterns when existing work → ✅ Mirror simple spell system
- ❌ Separate Legilimency flow → ✅ Integrate with existing handler
- ❌ Complex Occlumency logic → ✅ Simple formula (20% + skill/100*30%)

---

## Migration Notes

### Backward Compatibility

**Old saves (Phase 4.6.2)**:
- `WitnessState` missing `legilimency_detected` field → Defaults to `False`
- `WitnessState` missing `spell_attempts` field → Defaults to `{}`
- `witness` YAML missing `occlumency_skill` → Defaults to `0` in code

**No migration script needed**: Pydantic defaults handle old saves.

**Example**:
```python
# Old save JSON (Phase 4.6.2)
{
  "witness_id": "hermione",
  "trust": 50,
  "conversation_history": [],
  "secrets_revealed": []
  # Missing: legilimency_detected, spell_attempts
}

# Loaded as (Phase 4.8)
{
  "witness_id": "hermione",
  "trust": 50,
  "conversation_history": [],
  "secrets_revealed": [],
  "legilimency_detected": false,  # Default
  "spell_attempts": {}  # Default
}
```

---

## Formula Documentation

### Success Rate Formula

```
Legilimency Success Rate = BASE + SPECIFICITY - DECLINE
Where:
  BASE = 30% (risky spell, lower than safe 70%)
  SPECIFICITY = 0-30% (target +15%, intent +15%)
  DECLINE = attempts_in_location * 10%
  FLOOR = 10% minimum

Example Calculations:
  "legilimency" (1st cast):
    30% + 0% - 0% = 30%

  "legilimency on hermione" (1st cast):
    30% + 15% - 0% = 45%

  "legilimency on hermione to find out about draco" (1st cast):
    30% + 15% + 15% - 0% = 60%

  Same input, 3rd cast:
    30% + 30% - 20% = 40%

  Spam (10th cast):
    30% + 30% - 90% = -30% → 10% (floor)
```

### Detection Rate Formula

```
Detection Rate = BASE + SKILL + REPEAT
Where:
  BASE = 20% (base detection chance)
  SKILL = (occlumency_skill / 100) * 30% (0-30% bonus)
  REPEAT = +20% if legilimency_detected flag set
  CAP = 95% maximum

Example Calculations:
  Hermione (occlumency_skill=50), 1st attempt:
    20% + (50/100)*30% + 0% = 20% + 15% = 35%

  Hermione, 2nd attempt (detected 1st time):
    20% + 15% + 20% = 55%

  Draco (occlumency_skill=30), 1st attempt:
    20% + (30/100)*30% + 0% = 20% + 9% = 29%

  Harry (occlumency_skill=0), 1st attempt:
    20% + 0% + 0% = 20%

  Master Occlumens (skill=100), 5th attempt (all detected):
    20% + 30% + 20% = 70%
```

### Trust Penalty Formula

```
Trust Delta = DETECTED ? -20 : 0
Where:
  DETECTED = True if detection roll succeeds
  -20 = Fixed penalty (no randomness)
  0 = No penalty when undetected

Clamping (automatic via adjust_trust method):
  trust = max(0, min(100, trust + delta))

Example:
  Before: trust = 50
  Detected: trust = 50 + (-20) = 30
  Undetected: trust = 50 + 0 = 50

  Multiple detections:
  50 → 30 → 10 → 0 (floor)
```

---

## Test Plan

### Unit Tests (24 tests)

**Test Class 1: TestCalculateLegilimencySuccess** (8 tests)
- Test base 30% success (no bonuses, 0 attempts)
- Test +15% target bonus
- Test +15% intent bonus
- Test +30% max bonus (target + intent)
- Test decline penalty (-10% per attempt)
- Test floor at 10% (many attempts)
- Test statistical ranges (run 100 times)
- Test edge case: negative success rate → floor

**Test Class 2: TestCalculateLegilimencySpecificityBonus** (6 tests)
- Test no bonus: "legilimency" → 0
- Test target only: "legilimency on hermione" → 15
- Test intent only: "legilimency to find out about draco" → 15
- Test both: "legilimency on hermione to find out about draco" → 30
- Test edge case: missing target → 0
- Test edge case: missing intent → 0

**Test Class 3: TestLegilimencySemanticPhrases** (5 tests)
- Test exact spell name: "legilimency" → detected
- Test typo: "legulemancy" → detected (fuzzy)
- Test semantic phrase: "read her mind" → detected
- Test full sentence: "I want to read hermione's mind" → detected
- Test no false positive: "What's in your mind?" → NOT detected

**Test Class 4: TestOcclumencyDetection** (5 tests)
- Test no skill: occlumency_skill=0 → ~20% detection
- Test moderate skill: occlumency_skill=50 → ~35% detection
- Test high skill: occlumency_skill=100 → ~50% detection
- Test repeat penalty: legilimency_detected=True → +20% detection
- Test cap: skill=100, repeat=True → 70% (not 95%, since 20+30+20=70)

### Integration Tests (24 tests)

**Test Class 5: TestLegilimencyFullFlow** (8 tests)
- Test successful Legilimency with target+intent specificity
- Test successful Legilimency undetected (trust 0)
- Test successful Legilimency detected (trust -20, flag set)
- Test failed Legilimency undetected
- Test failed Legilimency detected (trust -20, flag set)
- Test repeat invasion (+20% detection)
- Test conversation history saved with intent
- Test evidence extraction from narration

**Test Class 6: TestLegilimencyDecline** (6 tests)
- Test 1st cast: High success rate (30% + bonuses)
- Test 3rd cast: Moderate success rate (30% + bonuses - 20%)
- Test 5th cast: Low success rate (30% + bonuses - 40%)
- Test 10th cast: Floor success rate (10%)
- Test decline resets on witness change (attempt tracking per witness)
- Test spam prevention (floor enforced)

**Test Class 7: TestLegilimencyEdgeCases** (6 tests)
- Test missing personality (default used)
- Test missing background (default used)
- Test missing occlumency_skill (defaults to 0)
- Test LLM error (template fallback)
- Test backward compatibility (old save loads)
- Test max detection cap (95% enforced)

**Test Class 8: TestLegilimencyConsequences** (4 tests)
- Test legilimency_detected flag set on detection
- Test repeat invasion has +20% detection
- Test flag persists across save/load
- Test multiple detections compound (50% → 70% → 90%)

### Edge Case Coverage

**Success Rate Edge Cases**:
- ✅ Base only (30%)
- ✅ Max bonus (60%)
- ✅ Max decline (floor 10%)
- ✅ Negative calculation (-30% → 10% floor)

**Detection Rate Edge Cases**:
- ✅ No skill (20%)
- ✅ Max skill (50%)
- ✅ Repeat penalty (70%+)
- ✅ Cap (95% max)

**Trust Penalty Edge Cases**:
- ✅ Detected (trust -20)
- ✅ Undetected (trust 0)
- ✅ Trust at 0 (can't go negative)
- ✅ Trust at 100 (can go down)

**YAML Edge Cases**:
- ✅ Missing personality (default provided)
- ✅ Missing background (default provided)
- ✅ Missing occlumency_skill (defaults to 0)

**Backward Compatibility**:
- ✅ Old saves load (new fields default)
- ✅ Old YAML works (occlumency_skill defaults to 0)

---

## Success Criteria

**Complete when ALL criteria met**:

- [ ] **Success calculation**: 30% base + specificity (0-30%) - decline (10%/attempt), floor 10%
- [ ] **Semantic phrases**: Legilimency added to SPELL_SEMANTIC_PHRASES with 10+ phrases
- [ ] **Fuzzy detection**: "read her mind", "peek into thought", "search memor" detected
- [ ] **Specificity bonus**: +15% target, +15% intent (max 30%)
- [ ] **Trust penalty**: -20 if detected, 0 if undetected (NO random.choice)
- [ ] **Occlumency skill**: Loaded from YAML, defaults to 0 if missing
- [ ] **Detection formula**: 20% + (skill/100)*30%, range 20-50%
- [ ] **Consequence flag**: legilimency_detected set to True on detection
- [ ] **Repeat penalty**: +20% detection if flag set
- [ ] **2 outcome templates**: SUCCESS (focus on evidence), FAILURE (detection/failure explanation)
- [ ] **Debug logging**: logger.info() shows formula breakdown in terminal (like safe spells)
- [ ] **48+ comprehensive tests**: Unit (24) + integration (24), all passing
- [ ] **Zero regressions**: All 651 existing tests still pass (699 total)
- [ ] **Default values**: personality/background fallbacks if missing from YAML
- [ ] **Code patterns**: Follows existing conventions (imports, constants, functions, docstrings)
- [ ] **Evidence vs secrets**: Docstrings + comments explain separation clearly

---

**Generated**: 2026-01-12
**Source**: CODEBASE-RESEARCH-PHASE4.8.md (17 sections, 35+ examples) + project documentation
**Confidence Score**: 9/10 (patterns proven, implementation ready)
**Alignment**: Validated against PLANNING.md Phase 4.7 success system + AUROR_ACADEMY_GAME_DESIGN.md magic system
**Handoff to**: fastapi-specialist (Tasks 1-7 ready for immediate implementation)
