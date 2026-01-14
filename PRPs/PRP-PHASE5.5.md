# Phase 5.5: YAML Schema Enhancement (Case Design Depth) - Product Requirement Plan

**Date**: 2026-01-13
**Phase**: 5.5
**Goal**: Enhance YAML case template with fields for professional-quality case design depth
**Status**: IMPLEMENTATION READY
**Effort**: 4-5 hours
**Priority**: HIGH (enables Phase 6 professional case creation)

---

## Goal

**What we're building**: Enhanced case template with TIER 1 + TIER 2 fields that enable professional case design without requiring code changes.

**End state**: Case designers can create emotionally resonant cases with:
- Victim humanization (emotional stakes)
- Witness psychological depth (wants, fears, moral complexity)
- Evidence metadata (significance, strength ratings, suspect implications)
- Enhanced solution structure (deductions required, common mistakes, fallacy patterns)
- Timeline system (alibi verification)
- Per-suspect verdict responses (tailored feedback)

**Philosophy**: Simple enhancement - add YAML fields → pass to appropriate LLM contexts → no complex logic.

---

## Why

### User Impact
**Case designers** can create professional-quality mysteries without touching code:
- Emotional hooks via victim humanization
- Morally complex witnesses (not cardboard characters)
- Evidence with strategic significance
- Educational feedback tailored to specific mistakes

**Players** experience richer cases:
- Emotional connection to victim
- Witnesses with believable internal conflicts
- Evidence with clear strategic value
- Personalized feedback when wrong

### Business Value
- **Enables Phase 6**: CASE_002_TECHNICAL_SPEC.md becomes implementation-ready
- **Scalable content creation**: Non-technical designers can create professional cases
- **Quality bar raised**: Template enforces psychological depth and strategic evidence design

### Integration
- Builds on Phase 5.4 "drop YAML → case works" workflow
- Extends existing Pydantic models (backward compatible)
- Passes new fields to existing LLM contexts (narrator, witness, Moody)
- No new endpoints or mechanics - pure context enrichment

### Alignment
**From PLANNING.md Phase 5.5** (lines 1297-1435):
- TIER 1 fields: Evidence enhancement, victim humanization, witness depth, case identity
- TIER 2 fields: Timeline, enhanced solution, per-suspect responses
- LLM context distribution: Each LLM receives only relevant fields

---

## What

### User-Visible Behavior

**For Case Designers**:
1. Open `case_template.yaml` (annotated with [REQUIRED]/[OPTIONAL])
2. Fill TIER 1 fields (victim humanization, witness wants/fears, evidence significance)
3. Optionally fill TIER 2 fields (timeline, enhanced solution, per-suspect responses)
4. Drop YAML in `backend/src/case_store/`
5. Validator catches missing required fields (helpful error messages)
6. Case auto-discovers and loads

**For Players** (transparent enhancement):
- Narrator descriptions include victim humanization ("You remember her from the library...")
- Witnesses feel psychologically real (wants conflict with fears)
- Moody's feedback references specific deductions required ("You missed that the shelf was positioned before falling...")
- Tom's commentary targets evidence strength ratings

### Technical Requirements

**Backend**:
- New Pydantic models: `Victim`, `EvidenceEnhanced`, `WitnessEnhanced`, `TimelineEntry`, `SolutionEnhanced`
- Updated `loader.py`: Parse new sections (victim, timeline, enhanced solution fields)
- Updated `validate_case()`: Check victim.name, witness.wants/fears present (where applicable)
- Updated LLM prompts: Pass new fields to narrator, witness, Moody contexts

**Template & Docs**:
- Enhanced `case_template.yaml` with all TIER 1 + TIER 2 fields
- Created `CASE_002_RESTRICTED_SECTION.md` (restricted case spec for Phase 6)
- Updated `CASE_DESIGN_GUIDE.md` with field usage guidelines

**No Frontend Changes**: All changes backend-only (YAML schema + LLM contexts)

### Success Criteria

- ✅ `case_template.yaml` includes all TIER 1 + TIER 2 fields with annotations
- ✅ Witness LLM prompt receives wants/fears/moral_complexity context
- ✅ Narrator LLM prompt receives victim humanization and evidence significance
- ✅ Moody LLM prompt receives enhanced solution fields (deductions_required, common_mistakes, fallacies_to_catch)
- ✅ Tom LLM prompt receives evidence strength ratings and victim context
- ✅ Validator enforces victim.name (if victim section present) and witness.wants/fears (new witnesses)
- ✅ Backward compatible: case_001.yaml (current simple case) still loads without errors
- ✅ All tests pass (no regressions from Phase 5.5 changes)

---

## Context & References

### Project Documentation

**From PLANNING.md Phase 5.5** (lines 1297-1435):
- Architecture: Extend YAML → update prompts → validate (KISS principle)
- Design principle: LLM context distribution (each LLM gets only relevant fields)
- Current state: Phase 5.4 complete ("drop YAML → case works" operational)

**From STATUS.md**:
- Backend: 729/731 tests passing (99.7%), 2 pre-existing failures in spell_llm
- Frontend: TypeScript clean, ESLint clean, build success
- Phase 5.4 deliverable: Case discovery, validation, template, dynamic loading

**From game design** (`docs/game-design/AUROR_ACADEMY_GAME_DESIGN.md`):
- Target audience: Adults seeking cerebral mysteries
- Design principle: Psychological depth (witnesses aren't quest-givers)
- Educational focus: Teach critical thinking via Moody feedback

### Research Sources

**From CODEBASE-RESEARCH-PHASE5.4.md** (validated):
- `loader.py` pattern: 12 core functions for case loading/validation
- YAML structure: Nested dict with case.locations, case.witnesses, case.solution
- Validation pattern: Pydantic models + safe_load YAML + required field checks
- Integration points: narrator.py, witness.py, mentor.py build LLM prompts

**From CASE_002_TECHNICAL_SPEC.md** (target structure, lines 1-200):
- Victim section example (lines 42-69): name, age, humanization, memorable_trait, time_of_death, cause_of_death
- Evidence enhancement example (lines 158-175): significance, strength, points_to, contradicts
- Witness depth pattern: wants, fears, moral_complexity (inferred from design)

**Alignment notes**:
- ✅ Research aligns with project KISS principle (add fields, pass to LLMs, no complex logic)
- ✅ CODEBASE-RESEARCH provides exact integration points (no additional file reads needed)
- ✅ CASE_002_TECHNICAL_SPEC shows desired field structure (implementation-ready)

---

## Quick Reference (Pre-Digested Context)

### Essential Pydantic Model Patterns

```python
# From backend/src/state/player_state.py (lines 29-55)
# Pattern: Pydantic v2 with Field descriptors, Literal types for enums

class CaseMetadata(BaseModel):
    """Lightweight metadata for case discovery."""
    id: str = Field(..., pattern=r"^[a-z0-9_]+$")
    title: str = Field(..., min_length=1, max_length=100)
    difficulty: Literal["beginner", "intermediate", "advanced"]
    description: str = Field(default="", max_length=500)

# New model pattern for Phase 5.5:
class Victim(BaseModel):
    """Victim metadata for humanization."""
    name: str = Field(..., min_length=1, max_length=100)
    age: str = Field(..., max_length=100)  # "Fourth-year Ravenclaw"
    humanization: str = Field(..., min_length=10, max_length=1000)
    memorable_trait: str = Field(default="", max_length=200)
    time_of_death: str = Field(default="", max_length=100)
    cause_of_death: str = Field(default="", max_length=200)
```

### Current LLM Prompt Locations

```python
# backend/src/context/narrator.py (lines 1-80)
# Function: build_narrator_context(location, player_input, history, discovered_evidence)
# Pattern: f-string prompt with sections (LOCATION, HIDDEN EVIDENCE, NOT PRESENT, RULES)

# backend/src/context/witness.py (lines 1-80)
# Function: build_witness_prompt(witness, question, trust, history, revealed_evidence)
# Pattern: f-string prompt with sections (PERSONALITY, KNOWLEDGE, SECRETS, LIES, RULES)

# backend/src/context/mentor.py (lines 1-72)
# Function: build_mentor_feedback(correct, score, fallacies, reasoning, accused_id, solution, templates, attempts_remaining)
# Pattern: Template-based feedback with fallacy detection

# Where to add new context:
# - narrator.py: Add victim humanization to LOCATION section, evidence significance to HIDDEN EVIDENCE
# - witness.py: Add wants/fears/moral_complexity to PERSONALITY section
# - mentor.py: Add solution enhancements (deductions_required, common_mistakes, fallacies_to_catch) to feedback context
```

### Current Case Template Structure

```yaml
# From case_template.yaml (lines 1-260)
# Structure: case → locations → witnesses → solution → briefing

case:
  id: "CASE_ID_HERE"           # [REQUIRED] ^[a-z0-9_]+$
  title: "CASE_TITLE_HERE"     # [REQUIRED] Display name
  difficulty: "beginner"        # [REQUIRED] beginner|intermediate|advanced
  description: "DESC_HERE"      # [OPTIONAL] 1-2 sentences

  locations:
    LOCATION_ID:
      hidden_evidence:
        - id: "evidence_id"
          triggers: ["keyword1", "keyword2"]
          description: |
            What player sees when discovered
          tag: "[EVIDENCE: evidence_id]"

  witnesses:
    - id: "witness_id"
      name: "Witness Name"
      personality: "Personality description"
      knowledge: ["Fact 1", "Fact 2"]
      secrets:
        - id: "secret_id"
          trigger: "evidence:evidence_id"
          text: "Secret information"

  solution:
    culprit: "witness_id"       # [REQUIRED] Must match witness ID
    method: "How it was done"
    motive: "Why they did it"
    key_evidence: ["ev1", "ev2"]
```

### Validator Pattern (from loader.py)

```python
# Pattern: Pydantic validation + custom field checks + graceful error handling

def validate_case(case_data: dict) -> tuple[bool, list[str]]:
    """Validate case structure and required fields.

    Returns:
        (is_valid, error_messages)
    """
    errors = []

    # Check required root fields
    if "id" not in case_data:
        errors.append("Missing required field: case.id")

    # Check nested structures
    if "locations" not in case_data or not case_data["locations"]:
        errors.append("Case must have at least one location")

    # Check solution culprit matches witness
    solution = case_data.get("solution", {})
    culprit = solution.get("culprit")
    witnesses = case_data.get("witnesses", [])
    witness_ids = [w.get("id") for w in witnesses]
    if culprit not in witness_ids:
        errors.append(f"Solution culprit '{culprit}' not found in witnesses")

    return (len(errors) == 0, errors)

# Phase 5.5: Add checks for new required fields
# - If victim section present → victim.name required
# - If witness has wants field → fears also required (vice versa)
```

---

## Key Patterns from Research

### Evidence Enhancement Pattern

```yaml
# From CASE_002_TECHNICAL_SPEC.md (lines 158-175)
# Pattern: Add metadata fields alongside existing fields

hidden_evidence:
  - id: "levitation_scorch_marks"
    name: "Levitation Scorch Marks"
    type: "magical"
    triggers:
      - "look up"
      - "examine ceiling"
      - "revelio"
    description: |
      Faint scorch marks on ceiling above bookshelf.
      Signature of high-powered Wingardium Leviosa.
    tag: "[EVIDENCE: levitation_scorch_marks]"

    # NEW FIELDS (Phase 5.5)
    significance: "Proves Wingardium Leviosa used at high power"  # Why this matters
    strength: 100                                                  # 0-100 quality rating
    points_to: ["professor_vector", "marcus_flint"]               # Suspect implications
    contradicts: ["accident_theory", "filch_guilty"]              # Theories this disproves
```

### Victim Humanization Pattern

```yaml
# From CASE_002_TECHNICAL_SPEC.md (lines 42-69)
# Pattern: New top-level section (sibling to locations, witnesses, solution)

case:
  # ... existing fields ...

  victim:  # NEW SECTION (Phase 5.5)
    name: "Helena Blackwood"
    age: "Fourth-year Ravenclaw"
    humanization: |
      Fourth-year Ravenclaw. You remember her from the library—always
      buried in wandlore texts, muttering about core resonance frequencies.
      Brilliant, obsessive, the kind of student who'd sneak into the Restricted
      Section for research long after curfew. Someone silenced that curious
      mind permanently.
    memorable_trait: "Wandlore obsessive, talked to herself while researching"
    time_of_death: "10:05 PM (approximately, based on evidence)"
    cause_of_death: "Blunt force trauma from bookshelf collapse (staged as accident)"
```

### Witness Depth Pattern

```yaml
# Pattern: Add wants/fears/moral_complexity to existing witness structure

witnesses:
  - id: "hannah_abbott"
    name: "Hannah Abbott"
    personality: "Nervous, people-pleaser, conflict-averse"
    background: "Hufflepuff third-year, friends with both victim and suspect"

    # NEW FIELDS (Phase 5.5)
    wants: "Help investigation without betraying friend Marcus"
    fears: "Retaliation from Slytherins, being seen as snitch"
    moral_complexity: |
      Hannah saw something critical but doesn't want to betray Marcus,
      who helped her pass Potions last year. She's torn between loyalty
      to a friend and duty to justice. Her people-pleasing nature makes
      this internal conflict especially painful.

    knowledge:
      - "Saw Marcus near library around 10 PM"
      - "Marcus has been acting strange lately"

    secrets:
      - id: "saw_marcus_with_wand"
        trigger: "trust>70"
        text: "Marcus's wand was glowing when I saw him..."
```

### Timeline System Pattern

```yaml
# Pattern: New section for chronological event tracking

case:
  # ... existing fields ...

  timeline:  # NEW SECTION (Phase 5.5, TIER 2)
    - time: "9:30 PM"
      event: "Filch patrols past library entrance"
      witnesses: ["argus_filch"]
      evidence: ["checkout_log"]

    - time: "9:45 PM"
      event: "Helena enters Restricted Section"
      witnesses: ["madam_pince"]
      evidence: ["pince_testimony"]

    - time: "10:05 PM"
      event: "Loud crash heard from Restricted Section"
      witnesses: ["hannah_abbott", "adrian_clearmont"]
      evidence: ["bookshelf_collapse"]

    - time: "10:30 PM"
      event: "Body discovered by Filch and Madam Pince"
      witnesses: ["argus_filch", "madam_pince"]
      evidence: ["discovery_report"]
```

### Enhanced Solution Pattern

```yaml
# Pattern: Extend solution section with educational fields

solution:
  culprit: "professor_vector"
  method: "Used Wingardium Leviosa to topple bookshelf"
  motive: "Helena discovered Vector's use of dark magic for research"
  key_evidence:
    - "levitation_scorch_marks"
    - "missing_wand"
    - "vector_alibi_false"

  # NEW FIELDS (Phase 5.5, TIER 2)
  deductions_required:
    - "Scorch marks prove levitation spell used (not accident)"
    - "Shelf positioned deliberately before being dropped (premeditation)"
    - "Helena's missing wand suggests killer took it (murder, not accident)"
    - "Vector lied about alibi (Filch didn't see her)"

  correct_reasoning_requires:
    - "Evidence of magical involvement (scorch marks)"
    - "Proof of premeditation (shelf positioning)"
    - "Alibi verification (Vector's lie)"

  common_mistakes:
    - error: "Accusing Marcus Flint"
      reason: "Presence near scene + hostile relationship with victim"
      why_wrong: "Alibi confirmed by multiple witnesses, no magical skill for levitation"

    - error: "Accusing Adrian Clearmont"
      reason: "Fled scene hastily (dropped quill)"
      why_wrong: "Fled because heard crash, not because caused it - alibi holds"

  fallacies_to_catch:
    - fallacy: "Confirmation bias"
      example: "Focusing only on Marcus's hostility, ignoring contradictory alibi evidence"

    - fallacy: "Post-hoc reasoning"
      example: "Adrian fled scene, therefore Adrian caused crash"
```

---

## Library-Specific Gotchas

**Synthesized from Phase 5.4 research + project experience:**

### YAML Parsing (PyYAML)

**Issue**: Multiline strings with pipe operator can break if indentation inconsistent
```yaml
# ❌ Bad - inconsistent indentation
moral_complexity: |
Hannah saw something critical.
  But doesn't want to betray Marcus.

# ✅ Good - consistent indentation
moral_complexity: |
  Hannah saw something critical.
  But doesn't want to betray Marcus.
```

**Solution**: Use `yaml.safe_load()` (already in use), validate with test cases

### Pydantic Validation

**Issue**: Optional fields vs default values can be confusing
```python
# ❌ Ambiguous - None vs empty string different behaviors
wants: str | None = None
fears: str | None = None

# ✅ Clear - explicit defaults, empty string means "not specified"
wants: str = Field(default="", max_length=500)
fears: str = Field(default="", max_length=500)
```

**Solution**: Use explicit defaults with Field(), document in template

### Backward Compatibility

**Issue**: Existing case_001.yaml doesn't have new fields
```python
# ❌ Breaks existing cases
victim = case_data["victim"]  # KeyError if victim section missing

# ✅ Backward compatible
victim = case_data.get("victim", {})
if victim:
    humanization = victim.get("humanization", "")
```

**Solution**: All new fields optional in code, validator warns (doesn't fail) if missing

### LLM Context Size

**Issue**: Passing entire timeline to every LLM can exceed token limits
```python
# ❌ Wasteful - narrator doesn't need full timeline
narrator_prompt = f"""
TIMELINE (all events):
{format_timeline(case_data["timeline"])}  # 50+ events
"""

# ✅ Efficient - narrator gets only relevant events
narrator_prompt = f"""
VICTIM CONTEXT:
{victim_humanization}  # 2-3 sentences
"""
```

**Solution**: LLM context distribution table (each LLM gets only what it needs)

### Evidence Strength Calibration

**Issue**: What's the difference between strength 50 vs 100?
```yaml
# Unclear - subjective ratings
strength: 75  # Is this "pretty strong"?
```

**Solution**: Document calibration in CASE_DESIGN_GUIDE.md:
- 100: Irrefutable (DNA match, video evidence)
- 80-90: Very strong (eyewitness testimony, physical evidence)
- 60-70: Moderate (circumstantial, corroborating evidence)
- 40-50: Weak (hearsay, uncorroborated claims)
- 20-30: Very weak (speculation, rumor)

### Validator Error Messages

**Issue**: Generic errors don't help case designers
```python
# ❌ Not helpful
errors.append("Missing field")

# ✅ Actionable
errors.append("Missing required field: victim.name (victim section present but name not specified)")
```

**Solution**: Specific error messages with field path and context

---

## LLM Context Distribution Table

**Who Gets What Fields** (efficiency + context isolation):

| Field | Witness LLM | Narrator LLM | Moody LLM | Tom LLM | Reason |
|-------|-------------|--------------|-----------|---------|---------|
| **victim.humanization** | ❌ | ✅ | ✅ | ✅ | Narrator: Crime scene descriptions<br>Moody: Briefing + feedback<br>Tom: Commentary on victim |
| **victim.time_of_death** | ❌ | ✅ | ✅ | ❌ | Narrator: Timeline references<br>Moody: Alibi evaluation |
| **victim.cause_of_death** | ❌ | ✅ | ✅ | ✅ | Narrator: Crime scene<br>Moody: Solution discussion<br>Tom: Method commentary |
| **witness.wants** | ✅ | ❌ | ✅ | ❌ | Witness: Drives behavior<br>Moody: Feedback on witness handling |
| **witness.fears** | ✅ | ❌ | ✅ | ❌ | Witness: Inhibits honesty<br>Moody: Feedback on trust building |
| **witness.moral_complexity** | ✅ | ❌ | ✅ | ❌ | Witness: Internal conflict<br>Moody: Teaching moment on psychology |
| **evidence.significance** | ❌ | ✅ (subtle) | ✅ | ✅ | Narrator: Subtle emphasis in descriptions<br>Moody: Feedback on evidence use<br>Tom: Strategic importance |
| **evidence.strength** | ❌ | ❌ | ✅ | ✅ | Moody: Feedback quality assessment<br>Tom: Commentary on evidence reliability |
| **evidence.points_to** | ❌ | ❌ | ✅ | ✅ | Moody: Feedback on suspect identification<br>Tom: Helpful/misleading guidance |
| **evidence.contradicts** | ❌ | ❌ | ✅ | ✅ | Moody: Feedback on theory elimination<br>Tom: Points out contradictions |
| **timeline** | ❌ | ✅ (partial) | ✅ | ❌ | Narrator: References during investigation<br>Moody: Alibi evaluation in feedback |
| **solution.deductions_required** | ❌ | ❌ | ✅ | ❌ | Moody: Feedback on logical steps missed |
| **solution.correct_reasoning_requires** | ❌ | ❌ | ✅ | ❌ | Moody: Feedback structure |
| **solution.common_mistakes** | ❌ | ❌ | ✅ | ❌ | Moody: Per-suspect wrong verdict feedback |
| **solution.fallacies_to_catch** | ❌ | ❌ | ✅ | ❌ | Moody: Educational feedback on reasoning errors |

**Key Principles**:
1. **Context isolation**: Witness LLM never sees solution
2. **Efficiency**: Don't pass full timeline to all LLMs (token waste)
3. **Strategic emphasis**: Narrator gets significance (subtle), not strength (too mechanical)
4. **Educational focus**: Moody gets all solution enhancements for teaching

---

## Decision Tree

**Case Designer Workflow**:
```
Start creating case
  ├─ Fill TIER 1 fields (victim, witness depth, evidence enhancement, case identity)
  │   ├─ victim.name [REQUIRED if victim section present]
  │   ├─ victim.humanization [REQUIRED if victim section present]
  │   ├─ witness.wants + fears [REQUIRED for new witnesses]
  │   ├─ witness.moral_complexity [OPTIONAL but recommended]
  │   └─ evidence.significance [OPTIONAL but recommended]
  │
  ├─ Optionally fill TIER 2 fields (timeline, enhanced solution, per-suspect responses)
  │   ├─ timeline [OPTIONAL - enables alibi checking]
  │   ├─ solution.deductions_required [OPTIONAL - better Moody feedback]
  │   ├─ solution.common_mistakes [OPTIONAL - per-suspect responses]
  │   └─ solution.fallacies_to_catch [OPTIONAL - teaching moments]
  │
  ├─ Drop YAML in backend/src/case_store/
  │
  ├─ Validator runs on server start
  │   ├─ Missing victim.name? → Error (won't load)
  │   ├─ Missing witness.wants/fears? → Warning (loads but logs)
  │   └─ Malformed YAML? → Error with line number
  │
  └─ Case auto-discovers → Available on landing page
```

**Validator Logic**:
```python
if "victim" in case_data:
    if not case_data["victim"].get("name"):
        errors.append("victim.name required if victim section present")

    if not case_data["victim"].get("humanization"):
        warnings.append("victim.humanization recommended for emotional impact")

for witness in case_data.get("witnesses", []):
    has_wants = witness.get("wants")
    has_fears = witness.get("fears")

    if has_wants and not has_fears:
        errors.append(f"witness {witness['id']}: wants specified but fears missing")

    if has_fears and not has_wants:
        errors.append(f"witness {witness['id']}: fears specified but wants missing")

    if not witness.get("moral_complexity"):
        warnings.append(f"witness {witness['id']}: moral_complexity recommended for depth")
```

---

## Current Codebase Structure

```bash
# From actual codebase (Serena read)
backend/src/
├── case_store/
│   ├── case_001.yaml               # EXISTING - Current simple case
│   ├── case_template.yaml          # EXISTING - Phase 5.4 basic template
│   └── loader.py                   # MODIFY - Add victim/timeline parsing, enhance validation
├── state/
│   └── player_state.py             # MODIFY - Add Victim, EvidenceEnhanced, WitnessEnhanced, TimelineEntry models
├── context/
│   ├── narrator.py                 # MODIFY - Add victim humanization, evidence significance
│   ├── witness.py                  # MODIFY - Add wants/fears/moral_complexity
│   ├── mentor.py                   # MODIFY - Add solution enhancements
│   └── tom_llm.py                  # MODIFY - Add evidence strength, victim context
└── tests/
    ├── test_case_discovery.py      # MODIFY - Add tests for new fields
    └── test_narrator.py            # MODIFY - Add tests for victim context

docs/case-files/
├── case_template.yaml              # MODIFY - Add all TIER 1 + TIER 2 fields
├── CASE_002_TECHNICAL_SPEC.md      # EXISTING - Reference spec
└── CASE_002_RESTRICTED_SECTION.md  # CREATE - Phase 6-ready spec
```

## Desired Codebase Structure

```bash
backend/src/
├── state/
│   └── player_state.py             # MODIFIED - Added 5 new Pydantic models
├── case_store/
│   ├── loader.py                   # MODIFIED - Enhanced parsing + validation
│   └── case_template.yaml          # MODIFIED - TIER 1 + TIER 2 fields
├── context/
│   ├── narrator.py                 # MODIFIED - Victim humanization + evidence significance
│   ├── witness.py                  # MODIFIED - Wants/fears/moral_complexity
│   ├── mentor.py                   # MODIFIED - Solution enhancements
│   └── tom_llm.py                  # MODIFIED - Evidence strength + victim context
└── tests/
    └── test_case_discovery.py      # MODIFIED - New field validation tests

docs/case-files/
├── case_template.yaml              # MODIFIED - Enhanced with annotations
├── CASE_002_RESTRICTED_SECTION.md  # CREATED - Phase 6 spec
└── CASE_DESIGN_GUIDE.md            # MODIFIED - Field usage guidelines
```

**Note**: validation-gates handles comprehensive testing. PRP focuses on implementation tasks.

---

## Files to Create/Modify

| File | Action | Purpose | Reference File |
|------|--------|---------|----------------|
| `backend/src/state/player_state.py` | MODIFY | Add Victim, EvidenceEnhanced, WitnessEnhanced, TimelineEntry, SolutionEnhanced models | Existing CaseMetadata model (lines 29-55) |
| `backend/src/case_store/loader.py` | MODIFY | Parse victim, timeline, enhanced solution sections + enhance validation | Existing load_case() function (lines 23-49) |
| `backend/src/context/narrator.py` | MODIFY | Add victim humanization to location descriptions, evidence significance | Existing format_hidden_evidence() (lines 10-43) |
| `backend/src/context/witness.py` | MODIFY | Add wants/fears/moral_complexity to personality context | Existing format_knowledge() (lines 14-26) |
| `backend/src/context/mentor.py` | MODIFY | Add solution enhancements to feedback context | Existing build_mentor_feedback() (lines 9-71) |
| `backend/src/context/tom_llm.py` | MODIFY | Add evidence strength ratings, victim context | Existing build_tom_prompt() function |
| `backend/src/case_store/case_template.yaml` | MODIFY | Add all TIER 1 + TIER 2 fields with annotations | Existing template (260 lines) |
| `backend/tests/test_case_discovery.py` | MODIFY | Add tests for new field validation | Existing validate_case tests |
| `docs/case-files/CASE_002_RESTRICTED_SECTION.md` | CREATE | Phase 6-ready case spec with all new fields | CASE_002_TECHNICAL_SPEC.md |
| `docs/game-design/CASE_DESIGN_GUIDE.md` | MODIFY | Add field usage guidelines section | Existing design guide |

**Note**: Test files handled by validation-gates. PRP lists for reference only.

---

## Tasks (Ordered)

### Task 1: Create New Pydantic Models (Backend Models)
**File**: `backend/src/state/player_state.py`
**Action**: MODIFY (add new models at end of file)
**Purpose**: Define types for new YAML fields (victim, enhanced evidence/witness/solution, timeline)
**Reference**: Existing `CaseMetadata` model (lines 29-55)
**Pattern**: Pydantic v2 with Field descriptors, explicit defaults, max_length constraints
**Depends on**: None
**Estimate**: 30 minutes

**Code Example**:
```python
# Add to backend/src/state/player_state.py (after CaseMetadata)

class Victim(BaseModel):
    """Victim metadata for humanization and emotional stakes.

    Used by narrator LLM (crime scene descriptions) and Moody LLM (briefing/feedback).
    """
    name: str = Field(..., min_length=1, max_length=100, description="Victim's name")
    age: str = Field(..., max_length=100, description="Age or year (e.g., 'Fourth-year Ravenclaw')")
    humanization: str = Field(
        ...,
        min_length=10,
        max_length=1000,
        description="2-3 sentence emotional hook connecting player to victim",
    )
    memorable_trait: str = Field(
        default="",
        max_length=200,
        description="One defining characteristic players remember",
    )
    time_of_death: str = Field(
        default="",
        max_length=100,
        description="Approximate time of death",
    )
    cause_of_death: str = Field(
        default="",
        max_length=200,
        description="How victim died (for crime scene context)",
    )


class EvidenceEnhanced(BaseModel):
    """Enhanced evidence metadata with strategic significance.

    Extends base evidence with fields for Moody feedback quality and Tom commentary.
    """
    # Base fields (already exist in YAML, replicate for type safety)
    id: str = Field(..., pattern=r"^[a-z0-9_]+$")
    name: str = Field(..., max_length=100)
    type: Literal["physical", "magical", "testimonial", "documentary"]

    # New fields (Phase 5.5)
    significance: str = Field(
        default="",
        max_length=500,
        description="Why this evidence matters (1-2 sentences)",
    )
    strength: int = Field(
        default=50,
        ge=0,
        le=100,
        description="Evidence quality rating (100=irrefutable, 50=moderate, 20=weak)",
    )
    points_to: list[str] = Field(
        default_factory=list,
        description="Suspect IDs this evidence implicates",
    )
    contradicts: list[str] = Field(
        default_factory=list,
        description="Theories or suspect IDs this evidence disproves",
    )


class WitnessEnhanced(BaseModel):
    """Enhanced witness metadata with psychological depth.

    Used by witness LLM (personality context) and Moody LLM (feedback on witness handling).
    """
    # Base fields (already exist)
    id: str = Field(..., pattern=r"^[a-z0-9_]+$")
    name: str = Field(..., max_length=100)
    personality: str = Field(..., max_length=1000)

    # New fields (Phase 5.5)
    wants: str = Field(
        default="",
        max_length=500,
        description="What witness is trying to achieve (drives behavior)",
    )
    fears: str = Field(
        default="",
        max_length=500,
        description="What stops witness from helping (inhibits honesty)",
    )
    moral_complexity: str = Field(
        default="",
        max_length=1000,
        description="Internal conflict, why witness is torn (multiline)",
    )


class TimelineEntry(BaseModel):
    """Single event in case timeline.

    Used by narrator LLM (timeline references) and Moody LLM (alibi evaluation).
    """
    time: str = Field(..., max_length=50, description="Time of event (e.g., '10:05 PM')")
    event: str = Field(..., max_length=500, description="What happened")
    witnesses: list[str] = Field(
        default_factory=list,
        description="Witness IDs present at this time",
    )
    evidence: list[str] = Field(
        default_factory=list,
        description="Evidence IDs related to this event",
    )


class SolutionEnhanced(BaseModel):
    """Enhanced solution metadata for educational feedback.

    Used by Moody LLM for verdict evaluation and teaching moments.
    """
    # Base fields (already exist)
    culprit: str = Field(..., pattern=r"^[a-z0-9_]+$")
    method: str = Field(..., max_length=500)
    motive: str = Field(..., max_length=500)
    key_evidence: list[str] = Field(default_factory=list)

    # New fields (Phase 5.5)
    deductions_required: list[str] = Field(
        default_factory=list,
        description="Logical steps player must take to reach correct conclusion",
    )
    correct_reasoning_requires: list[str] = Field(
        default_factory=list,
        description="Key insights player must understand",
    )
    common_mistakes: list[dict[str, str]] = Field(
        default_factory=list,
        description="List of {error, reason, why_wrong} objects",
    )
    fallacies_to_catch: list[dict[str, str]] = Field(
        default_factory=list,
        description="List of {fallacy, example} objects",
    )
```

**Acceptance Criteria**:
- [ ] `Victim` model exists with 6 fields (name, age, humanization, memorable_trait, time_of_death, cause_of_death)
- [ ] `EvidenceEnhanced` model exists with new fields (significance, strength, points_to, contradicts)
- [ ] `WitnessEnhanced` model exists with new fields (wants, fears, moral_complexity)
- [ ] `TimelineEntry` model exists with 4 fields (time, event, witnesses, evidence)
- [ ] `SolutionEnhanced` model exists with new fields (deductions_required, correct_reasoning_requires, common_mistakes, fallacies_to_catch)
- [ ] All models use Pydantic v2 syntax with Field descriptors
- [ ] All models have docstrings explaining usage

---

### Task 2: Update Loader Parsing (Backend Loading)
**File**: `backend/src/case_store/loader.py`
**Action**: MODIFY (add parsing functions for new sections)
**Purpose**: Parse victim, timeline, enhanced solution sections from YAML
**Reference**: Existing `load_case()` function (lines 23-49), `get_location()` pattern (lines 52-77)
**Pattern**: Safe dict.get() with defaults for backward compatibility
**Depends on**: Task 1 (Pydantic models exist)
**Estimate**: 30 minutes

**Code Example**:
```python
# Add to backend/src/case_store/loader.py (after existing functions)

def load_victim(case_data: dict[str, Any]) -> dict[str, Any] | None:
    """Load victim metadata from case data.

    Args:
        case_data: Loaded case dictionary

    Returns:
        Victim dict or None if victim section not present (backward compatible)
    """
    case: dict[str, Any] = case_data.get("case", case_data)
    victim = case.get("victim")

    if not victim:
        return None

    # Ensure all fields present with defaults
    return {
        "name": victim.get("name", ""),
        "age": victim.get("age", ""),
        "humanization": victim.get("humanization", ""),
        "memorable_trait": victim.get("memorable_trait", ""),
        "time_of_death": victim.get("time_of_death", ""),
        "cause_of_death": victim.get("cause_of_death", ""),
    }


def load_timeline(case_data: dict[str, Any]) -> list[dict[str, Any]]:
    """Load timeline entries from case data.

    Args:
        case_data: Loaded case dictionary

    Returns:
        List of timeline entries (empty list if timeline not present)
    """
    case: dict[str, Any] = case_data.get("case", case_data)
    timeline = case.get("timeline", [])

    # Ensure each entry has required fields
    entries = []
    for entry in timeline:
        entries.append({
            "time": entry.get("time", ""),
            "event": entry.get("event", ""),
            "witnesses": entry.get("witnesses", []),
            "evidence": entry.get("evidence", []),
        })

    return entries


def load_enhanced_solution(case_data: dict[str, Any]) -> dict[str, Any]:
    """Load solution with enhanced fields.

    Args:
        case_data: Loaded case dictionary

    Returns:
        Solution dict with base + enhanced fields
    """
    case: dict[str, Any] = case_data.get("case", case_data)
    solution = case.get("solution", {})

    return {
        # Base fields (existing)
        "culprit": solution.get("culprit", ""),
        "method": solution.get("method", ""),
        "motive": solution.get("motive", ""),
        "key_evidence": solution.get("key_evidence", []),
        "deductions_required": solution.get("deductions_required", []),  # Existing field

        # New enhanced fields (Phase 5.5)
        "correct_reasoning_requires": solution.get("correct_reasoning_requires", []),
        "common_mistakes": solution.get("common_mistakes", []),
        "fallacies_to_catch": solution.get("fallacies_to_catch", []),
    }


def load_enhanced_evidence(case_data: dict[str, Any], location_id: str) -> list[dict[str, Any]]:
    """Load evidence with enhanced metadata.

    Args:
        case_data: Loaded case dictionary
        location_id: Location identifier

    Returns:
        List of evidence dicts with base + enhanced fields
    """
    base_evidence = get_all_evidence(case_data, location_id)  # Existing function

    # Add enhanced fields with defaults
    enhanced = []
    for evidence in base_evidence:
        enhanced.append({
            **evidence,  # All existing fields
            "significance": evidence.get("significance", ""),
            "strength": evidence.get("strength", 50),  # Default moderate strength
            "points_to": evidence.get("points_to", []),
            "contradicts": evidence.get("contradicts", []),
        })

    return enhanced
```

**Acceptance Criteria**:
- [ ] `load_victim()` function exists, returns None if victim section missing (backward compatible)
- [ ] `load_timeline()` function exists, returns empty list if timeline missing
- [ ] `load_enhanced_solution()` function exists, includes new fields with defaults
- [ ] `load_enhanced_evidence()` function exists, extends existing evidence with new fields
- [ ] All functions handle missing fields gracefully (don't crash on old YAMLs)

---

### Task 3: Update Validator (Backend Validation)
**File**: `backend/src/case_store/loader.py`
**Action**: MODIFY (enhance existing `validate_case()` function)
**Purpose**: Check new required fields (victim.name, witness.wants/fears), log warnings for missing optional fields
**Reference**: Existing validation pattern in Phase 5.4
**Pattern**: Errors block loading, warnings log only
**Depends on**: Task 2 (parsing functions exist)
**Estimate**: 15 minutes

**Code Example**:
```python
# Modify existing validate_case() function in backend/src/case_store/loader.py

def validate_case(case_data: dict[str, Any]) -> tuple[bool, list[str], list[str]]:
    """Validate case structure and required fields.

    Returns:
        (is_valid, errors, warnings)
        - errors: Blocking issues (case won't load)
        - warnings: Optional fields missing (case loads but logs)
    """
    errors = []
    warnings = []

    case = case_data.get("case", case_data)

    # Existing validation (from Phase 5.4)
    if "id" not in case:
        errors.append("Missing required field: case.id")

    if "title" not in case:
        errors.append("Missing required field: case.title")

    # ... existing checks ...

    # NEW VALIDATION (Phase 5.5)

    # Victim validation
    victim = case.get("victim")
    if victim:
        if not victim.get("name"):
            errors.append("Missing required field: victim.name (victim section present but name not specified)")

        if not victim.get("humanization"):
            warnings.append("Missing recommended field: victim.humanization (adds emotional impact)")

    # Witness validation (wants/fears consistency)
    witnesses = case.get("witnesses", [])
    for witness in witnesses:
        witness_id = witness.get("id", "unknown")
        has_wants = witness.get("wants")
        has_fears = witness.get("fears")

        # If one specified, both should be specified
        if has_wants and not has_fears:
            errors.append(f"Witness '{witness_id}': wants specified but fears missing (both required together)")

        if has_fears and not has_wants:
            errors.append(f"Witness '{witness_id}': fears specified but wants missing (both required together)")

        # Warn if moral_complexity missing (recommended for depth)
        if (has_wants or has_fears) and not witness.get("moral_complexity"):
            warnings.append(f"Witness '{witness_id}': moral_complexity recommended for psychological depth")

    # Evidence validation (strength range)
    locations = case.get("locations", {})
    for location_id, location in locations.items():
        evidence_list = location.get("hidden_evidence", [])
        for evidence in evidence_list:
            evidence_id = evidence.get("id", "unknown")
            strength = evidence.get("strength")

            if strength is not None:
                if not isinstance(strength, int) or strength < 0 or strength > 100:
                    errors.append(f"Evidence '{evidence_id}': strength must be integer 0-100, got {strength}")

    # Timeline validation (time field required for each entry)
    timeline = case.get("timeline", [])
    for i, entry in enumerate(timeline):
        if not entry.get("time"):
            errors.append(f"Timeline entry {i}: missing required field 'time'")

        if not entry.get("event"):
            errors.append(f"Timeline entry {i}: missing required field 'event'")

    return (len(errors) == 0, errors, warnings)
```

**Acceptance Criteria**:
- [ ] Validator returns 3-tuple: (is_valid, errors, warnings)
- [ ] Error if victim section present but victim.name missing
- [ ] Error if witness has wants but not fears (or vice versa)
- [ ] Error if evidence.strength not 0-100 integer
- [ ] Error if timeline entry missing time or event
- [ ] Warning if victim.humanization missing (recommended)
- [ ] Warning if witness.moral_complexity missing (when wants/fears present)
- [ ] Backward compatible: old case_001.yaml validates without errors

---

### Task 4: Update Narrator Prompt (Backend LLM Context)
**File**: `backend/src/context/narrator.py`
**Action**: MODIFY (add victim humanization to location descriptions, evidence significance)
**Purpose**: Narrator includes victim context in crime scene descriptions, subtly emphasizes significant evidence
**Reference**: Existing `format_hidden_evidence()` (lines 10-43), `format_surface_elements()` (lines 68-80)
**Pattern**: Add victim context to prompt's LOCATION section, add significance to HIDDEN EVIDENCE section
**Depends on**: Task 2 (load_victim function exists)
**Estimate**: 20 minutes

**Code Example**:
```python
# Modify backend/src/context/narrator.py

def format_victim_context(victim: dict[str, Any] | None) -> str:
    """Format victim humanization for narrator prompt.

    Args:
        victim: Victim dict from load_victim() or None

    Returns:
        Formatted string for prompt
    """
    if not victim or not victim.get("humanization"):
        return ""

    # Include humanization (emotional hook) and cause of death (crime scene context)
    humanization = victim.get("humanization", "").strip()
    cause = victim.get("cause_of_death", "").strip()

    lines = []
    lines.append("== VICTIM CONTEXT ==")
    lines.append(humanization)
    if cause:
        lines.append(f"Cause of death: {cause}")
    lines.append("")

    return "\n".join(lines)


def format_hidden_evidence_enhanced(
    hidden_evidence: list[dict[str, Any]],
    discovered_ids: list[str],
) -> str:
    """Format hidden evidence with significance (Phase 5.5 enhancement).

    Args:
        hidden_evidence: List of evidence dicts with enhanced fields
        discovered_ids: List of already-discovered evidence IDs

    Returns:
        Formatted string for prompt
    """
    lines = []
    for evidence in hidden_evidence:
        evidence_id = evidence.get("id", "unknown")

        if evidence_id in discovered_ids:
            continue

        triggers = evidence.get("triggers", [])
        description = evidence.get("description", "").strip()
        tag = evidence.get("tag", f"[EVIDENCE: {evidence_id}]")
        significance = evidence.get("significance", "").strip()  # NEW

        lines.append(f"- ID: {evidence_id}")
        lines.append(f"  Triggers: {', '.join(triggers)}")

        # Add significance if present (narrator subtly emphasizes important evidence)
        if significance:
            lines.append(f"  Significance: {significance}")

        lines.append(f"  Description: {description}")
        lines.append(f"  Tag to include: {tag}")
        lines.append("")

    if not lines:
        return "All evidence has been discovered."

    return "\n".join(lines)


def build_narrator_context(
    location: dict[str, Any],
    player_input: str,
    history: list[str],
    discovered_evidence: list[str],
    victim: dict[str, Any] | None = None,  # NEW parameter
) -> str:
    """Build narrator prompt with victim context (Phase 5.5 enhancement).

    Args:
        location: Location dict from get_location()
        player_input: Player's action
        history: Conversation history (last 5 exchanges)
        discovered_evidence: List of discovered evidence IDs
        victim: Victim dict from load_victim() or None

    Returns:
        Complete prompt for narrator LLM
    """
    location_desc = location.get("description", "")
    surface_elements = location.get("surface_elements", [])
    hidden_evidence = location.get("hidden_evidence", [])
    not_present = location.get("not_present", [])

    # NEW: Add victim context (if present)
    victim_context = format_victim_context(victim)

    prompt = f"""You are the narrator for a Harry Potter mystery investigation game.

== LOCATION ==
{location_desc}

{victim_context}

== SURFACE ELEMENTS ==
{format_surface_elements(surface_elements)}

== HIDDEN EVIDENCE (trigger-based discovery) ==
{format_hidden_evidence_enhanced(hidden_evidence, discovered_evidence)}

== NOT PRESENT (prevent hallucinations) ==
{format_not_present(not_present)}

== RULES ==
1. Respond in 2-4 sentences (immersive prose, not lists)
2. If player action matches evidence trigger → reveal evidence with [EVIDENCE: id] tag
3. If player action matches not_present trigger → use predefined response
4. Otherwise → atmospheric response, NO new clues
5. Never invent evidence not listed above
6. Integrate victim context naturally into crime scene descriptions

== PLAYER ACTION ==
"{player_input}"

Respond (2-4 sentences):"""

    return prompt
```

**Acceptance Criteria**:
- [ ] `format_victim_context()` function exists, returns empty string if victim None
- [ ] `format_hidden_evidence_enhanced()` includes significance field if present
- [ ] `build_narrator_context()` accepts victim parameter (optional, defaults to None)
- [ ] Victim humanization appears in LOCATION section (after location description)
- [ ] Narrator rules updated: "Integrate victim context naturally into crime scene descriptions"
- [ ] Backward compatible: works without victim parameter (defaults to None)

---

### Task 5: Update Witness Prompt (Backend LLM Context)
**File**: `backend/src/context/witness.py`
**Action**: MODIFY (add wants/fears/moral_complexity to personality context)
**Purpose**: Witness LLM receives psychological depth (drives behavior, inhibits honesty, internal conflict)
**Reference**: Existing `format_knowledge()` (lines 14-26), witness prompt structure
**Pattern**: Add new section PSYCHOLOGICAL DEPTH with wants/fears/moral_complexity
**Depends on**: None (standalone context enhancement)
**Estimate**: 20 minutes

**Code Example**:
```python
# Add to backend/src/context/witness.py

def format_psychological_depth(witness: dict[str, Any]) -> str:
    """Format witness psychological depth for prompt (Phase 5.5).

    Args:
        witness: Witness dict with wants, fears, moral_complexity fields

    Returns:
        Formatted string for prompt
    """
    wants = witness.get("wants", "").strip()
    fears = witness.get("fears", "").strip()
    moral_complexity = witness.get("moral_complexity", "").strip()

    if not wants and not fears and not moral_complexity:
        return ""

    lines = []
    lines.append("== PSYCHOLOGICAL DEPTH ==")

    if wants:
        lines.append(f"What you want: {wants}")

    if fears:
        lines.append(f"What you fear: {fears}")

    if moral_complexity:
        lines.append(f"Your internal conflict:")
        lines.append(moral_complexity)

    lines.append("")

    return "\n".join(lines)


def build_witness_prompt(
    witness: dict[str, Any],
    question: str,
    trust: int,
    history: list[dict[str, Any]],
    revealed_evidence: list[str],
) -> str:
    """Build witness interrogation prompt with psychological depth (Phase 5.5 enhancement).

    Args:
        witness: Witness dict from get_witness()
        question: Player's question
        trust: Current trust level (0-100)
        history: Conversation history
        revealed_evidence: Evidence shown to witness

    Returns:
        Complete prompt for witness LLM
    """
    name = witness.get("name", "Unknown")
    personality = witness.get("personality", "")
    knowledge = witness.get("knowledge", [])
    secrets = witness.get("secrets", [])
    lies = witness.get("lies", [])

    # NEW: Add psychological depth
    psych_depth = format_psychological_depth(witness)

    # Determine available secrets based on trust
    available_secrets = get_available_secrets(secrets, trust, revealed_evidence)

    # Determine if witness should lie based on trust
    lie_topics = []
    if should_lie(lies, trust):
        lie_topics = format_lie_topics(lies)

    prompt = f"""You are {name}, a witness in a Harry Potter mystery investigation.

== PERSONALITY ==
{personality}

{psych_depth}

== WHAT YOU KNOW ==
{format_knowledge(knowledge)}

== SECRETS (reveal if appropriate) ==
{format_secrets_for_prompt(available_secrets, trust)}

== LIES (if trust < 30) ==
{lie_topics}

== CONVERSATION HISTORY ==
{format_conversation_history(history)}

== RULES ==
1. Stay in character ({name})
2. Answer player's question naturally (conversational, not robotic)
3. If trust high → reveal available secrets when relevant
4. If trust low → lie about topics listed above
5. Let wants drive proactive behavior, fears inhibit honesty
6. Express moral complexity through hesitation, conflicted responses
7. Never reveal information not in WHAT YOU KNOW or SECRETS sections
8. Trust level: {trust}/100

== PLAYER QUESTION ==
"{question}"

Your response (as {name}, in character):"""

    return prompt
```

**Acceptance Criteria**:
- [ ] `format_psychological_depth()` function exists, returns empty string if no wants/fears/moral_complexity
- [ ] Function formats wants, fears, moral_complexity with clear labels
- [ ] `build_witness_prompt()` includes psychological depth section
- [ ] New rule added: "Let wants drive proactive behavior, fears inhibit honesty"
- [ ] New rule added: "Express moral complexity through hesitation, conflicted responses"
- [ ] Backward compatible: works if wants/fears/moral_complexity fields missing

---

### Task 6: Update Moody Feedback (Backend LLM Context)
**File**: `backend/src/context/mentor.py`
**Action**: MODIFY (add solution enhancements, victim context, timeline to feedback)
**Purpose**: Moody references deductions required, common mistakes, fallacies to catch in verdict feedback
**Reference**: Existing `build_mentor_feedback()` (lines 9-71)
**Pattern**: Add new fields to feedback context, reference in critique generation
**Depends on**: Task 2 (load_enhanced_solution, load_victim, load_timeline functions exist)
**Estimate**: 25 minutes

**Code Example**:
```python
# Modify backend/src/context/mentor.py

def _generate_critique_enhanced(
    correct: bool,
    accused_id: str,
    solution: dict[str, Any],
    fallacies: list[str],
    victim: dict[str, Any] | None = None,  # NEW parameter
) -> str:
    """Generate critique with enhanced solution fields (Phase 5.5).

    Args:
        correct: Whether verdict was correct
        accused_id: Who player accused
        solution: Enhanced solution dict with deductions_required, common_mistakes
        fallacies: List of fallacies detected
        victim: Victim dict (optional)

    Returns:
        Critique string for feedback
    """
    if correct and not fallacies:
        return "No major issues with your reasoning."

    critique_lines = []

    # If incorrect, cite common mistake (if applicable)
    if not correct:
        common_mistakes = solution.get("common_mistakes", [])
        matching_mistake = next(
            (m for m in common_mistakes if accused_id in m.get("error", "")),
            None
        )

        if matching_mistake:
            reason = matching_mistake.get("reason", "")
            why_wrong = matching_mistake.get("why_wrong", "")
            critique_lines.append(f"Common mistake: {reason}")
            critique_lines.append(f"Why this is wrong: {why_wrong}")
        else:
            critique_lines.append(f"You accused {accused_id}, but the evidence doesn't support this conclusion.")

    # Cite deductions required that player missed
    deductions_required = solution.get("deductions_required", [])
    if deductions_required and not correct:
        critique_lines.append("\nKey deductions you missed:")
        for i, deduction in enumerate(deductions_required[:3], 1):  # Top 3
            critique_lines.append(f"{i}. {deduction}")

    # Reference victim if available (adds emotional weight to feedback)
    if victim and victim.get("humanization"):
        victim_name = victim.get("name", "the victim")
        critique_lines.append(f"\nRemember, {victim_name} deserves justice based on evidence, not assumptions.")

    return "\n".join(critique_lines)


def build_mentor_feedback_enhanced(
    correct: bool,
    score: int,
    fallacies: list[str],
    reasoning: str,
    accused_id: str,
    solution: dict[str, Any],
    feedback_templates: dict[str, Any],
    attempts_remaining: int,
    victim: dict[str, Any] | None = None,  # NEW parameter
    timeline: list[dict[str, Any]] | None = None,  # NEW parameter
) -> dict[str, Any]:
    """Build Moody's mentor feedback with enhanced fields (Phase 5.5).

    Args:
        correct: Whether verdict was correct
        score: Reasoning quality score (0-100)
        fallacies: List of fallacies detected
        reasoning: Player's reasoning text
        accused_id: Who player accused
        solution: Enhanced solution dict (deductions_required, common_mistakes, fallacies_to_catch)
        feedback_templates: Templates from YAML
        attempts_remaining: How many attempts left
        victim: Victim dict (optional)
        timeline: Timeline entries (optional)

    Returns:
        {
            "analysis": str,
            "fallacies_detected": [{"name": str, "description": str, "example": str}],
            "score": int,
            "quality": str,
            "critique": str,
            "praise": str,
            "hint": str | None,
            "deductions_missed": list[str],  # NEW
        }
    """
    quality = _determine_quality(score)

    # Build analysis
    reasoning_preview = reasoning[:100] + "..." if len(reasoning) > 100 else reasoning
    analysis = f"You accused {accused_id} because: {reasoning_preview}"

    # Build fallacies with examples from solution.fallacies_to_catch
    fallacies_detailed = _build_fallacies_enhanced(fallacies, solution, feedback_templates)

    # Generate praise
    praise = _generate_praise(score, correct, fallacies)

    # Generate critique (enhanced with victim context)
    critique = _generate_critique_enhanced(correct, accused_id, solution, fallacies, victim)

    # Generate adaptive hint
    hint = None
    if not correct:
        hint = _generate_adaptive_hint(attempts_remaining, solution)

    # NEW: Extract deductions missed
    deductions_missed = []
    if not correct:
        deductions_required = solution.get("deductions_required", [])
        # Heuristic: deductions player didn't mention in reasoning
        for deduction in deductions_required:
            if deduction.lower() not in reasoning.lower():
                deductions_missed.append(deduction)

    return {
        "analysis": analysis,
        "fallacies_detected": fallacies_detailed,
        "score": score,
        "quality": quality,
        "critique": critique,
        "praise": praise,
        "hint": hint,
        "deductions_missed": deductions_missed,  # NEW
    }


def _build_fallacies_enhanced(
    fallacies: list[str],
    solution: dict[str, Any],
    templates: dict[str, Any],
) -> list[dict[str, str]]:
    """Build fallacy details with examples from solution.fallacies_to_catch (Phase 5.5).

    Args:
        fallacies: List of fallacy names detected
        solution: Enhanced solution dict with fallacies_to_catch
        templates: Fallback templates

    Returns:
        List of {"name": str, "description": str, "example": str}
    """
    detailed = []
    fallacies_to_catch = solution.get("fallacies_to_catch", [])

    for fallacy_name in fallacies:
        # Look for case-specific example first
        case_specific = next(
            (f for f in fallacies_to_catch if f.get("fallacy") == fallacy_name),
            None
        )

        if case_specific:
            detailed.append({
                "name": fallacy_name,
                "description": templates.get("fallacies", {}).get(fallacy_name, {}).get("description", ""),
                "example": case_specific.get("example", ""),
            })
        else:
            # Fallback to template example
            template_fallacy = templates.get("fallacies", {}).get(fallacy_name, {})
            detailed.append({
                "name": fallacy_name,
                "description": template_fallacy.get("description", ""),
                "example": template_fallacy.get("example", ""),
            })

    return detailed
```

**Acceptance Criteria**:
- [ ] `_generate_critique_enhanced()` references common_mistakes if accused_id matches error
- [ ] `_generate_critique_enhanced()` cites deductions_required that player missed
- [ ] `_generate_critique_enhanced()` includes victim.humanization if available (emotional weight)
- [ ] `build_mentor_feedback_enhanced()` accepts victim and timeline parameters (optional)
- [ ] `build_mentor_feedback_enhanced()` returns deductions_missed list
- [ ] `_build_fallacies_enhanced()` uses solution.fallacies_to_catch for case-specific examples
- [ ] Backward compatible: works if victim/timeline/enhanced fields missing

---

### Task 7: Update Tom Prompt (Backend LLM Context)
**File**: `backend/src/context/tom_llm.py`
**Action**: MODIFY (add evidence strength ratings, victim context)
**Purpose**: Tom's commentary targets evidence reliability, references victim emotional stakes
**Reference**: Existing `build_tom_prompt()` function
**Pattern**: Add evidence strength to context, victim humanization to commentary rules
**Depends on**: Task 2 (load_victim, load_enhanced_evidence functions exist)
**Estimate**: 20 minutes

**Code Example**:
```python
# Modify backend/src/context/tom_llm.py

def format_evidence_with_strength(discovered_evidence: list[dict[str, Any]]) -> str:
    """Format evidence with strength ratings for Tom's analysis (Phase 5.5).

    Args:
        discovered_evidence: List of evidence dicts with strength field

    Returns:
        Formatted string for prompt
    """
    if not discovered_evidence:
        return "No evidence discovered yet."

    lines = []
    for evidence in discovered_evidence:
        name = evidence.get("name", "Unknown")
        strength = evidence.get("strength", 50)  # Default moderate
        evidence_type = evidence.get("type", "physical")

        # Categorize strength for Tom's commentary
        if strength >= 80:
            strength_label = "Strong evidence"
        elif strength >= 60:
            strength_label = "Moderate evidence"
        elif strength >= 40:
            strength_label = "Weak evidence"
        else:
            strength_label = "Very weak evidence"

        lines.append(f"- {name} ({evidence_type}, {strength_label})")

    return "\n".join(lines)


def build_tom_prompt_enhanced(
    player_input: str,
    history: list[str],
    discovered_evidence: list[dict[str, Any]],
    witnesses: list[dict[str, Any]],
    victim: dict[str, Any] | None = None,  # NEW parameter
    trust_level: int = 0,
) -> str:
    """Build Tom's inner voice prompt with evidence strength and victim context (Phase 5.5).

    Args:
        player_input: Player's current action/question
        history: Conversation history (last 5 exchanges)
        discovered_evidence: Evidence with enhanced fields (strength, significance)
        witnesses: List of witness dicts
        victim: Victim dict (optional)
        trust_level: Tom's trust level (0-100)

    Returns:
        Complete prompt for Tom LLM
    """
    # Format evidence with strength ratings
    evidence_context = format_evidence_with_strength(discovered_evidence)

    # Format victim context for Tom's commentary
    victim_context = ""
    if victim and victim.get("humanization"):
        victim_name = victim.get("name", "the victim")
        victim_context = f"\n== VICTIM ==\n{victim.get('humanization', '')}\n"

    prompt = f"""You are Tom Thornfield's ghost, mentoring a trainee Auror.

== YOUR CHARACTER ==
Former Auror who died falling two stories during investigation. Made fatal mistake
in Marcus Bellweather case (wrongful conviction). Now mentors trainees to avoid
repeating your errors. 50/50 split: half helpful Socratic questions, half
plausible misleading advice (based on your living habits).

Trust level: {trust_level}/100
- 0-30%: Deflects personal questions, surface-level advice
- 30-50%: Vague references to past, some introspection
- 80%+: Full ownership, detailed stories about Marcus, Samuel, Moody

{victim_context}

== EVIDENCE DISCOVERED ==
{evidence_context}

== WITNESSES ==
{', '.join([w.get('name', 'Unknown') for w in witnesses])}

== CONVERSATION HISTORY ==
{format_history(history)}

== RULES ==
1. Comment 30% of time after evidence discovery (auto-comments)
2. Respond to direct questions starting with "Tom,"
3. 50% helpful (Socratic questions about evidence strength, alibi checking)
4. 50% misleading (plausible but wrong, based on your living mistakes)
5. Reference evidence strength in commentary ("That's weak evidence", "Strong physical evidence")
6. If victim context available, occasionally reference emotional stakes
7. Show personality through behavior, not exposition (Rule #10)
8. Dark humor about your death ("Check the floor. I didn't.")

== PLAYER INPUT ==
"{player_input}"

Your response (as Tom Thornfield, 1-2 sentences):"""

    return prompt
```

**Acceptance Criteria**:
- [ ] `format_evidence_with_strength()` categorizes evidence by strength (Strong/Moderate/Weak/Very Weak)
- [ ] `build_tom_prompt_enhanced()` includes evidence strength labels in context
- [ ] `build_tom_prompt_enhanced()` accepts victim parameter (optional)
- [ ] Tom's rules updated: "Reference evidence strength in commentary"
- [ ] Tom's rules updated: "If victim context available, occasionally reference emotional stakes"
- [ ] Backward compatible: works if victim or evidence.strength fields missing

---

### Task 8: Update Case Template (Template & Docs)
**File**: `backend/src/case_store/case_template.yaml`
**Action**: MODIFY (add all TIER 1 + TIER 2 fields with [REQUIRED]/[OPTIONAL] annotations)
**Purpose**: Guide case designers to fill new fields with clear instructions
**Reference**: Existing template (260 lines), CASE_002_TECHNICAL_SPEC.md examples
**Pattern**: Annotate each field with [REQUIRED] or [OPTIONAL], provide examples
**Depends on**: None (standalone documentation)
**Estimate**: 45 minutes

**Acceptance Criteria**:
- [ ] Victim section added with 6 fields (name, age, humanization, memorable_trait, time_of_death, cause_of_death)
- [ ] Evidence enhancement fields added (significance, strength, points_to, contradicts) with [OPTIONAL]
- [ ] Witness depth fields added (wants, fears, moral_complexity) with [REQUIRED] annotation
- [ ] Timeline section added with example entries (time, event, witnesses, evidence) and [OPTIONAL]
- [ ] Enhanced solution fields added (deductions_required, correct_reasoning_requires, common_mistakes, fallacies_to_catch) with [OPTIONAL]
- [ ] All new fields have clear comments explaining usage
- [ ] Example values show proper formatting (multiline strings, lists, strength calibration)

*(Full template content too long for PRP - see CASE_002_TECHNICAL_SPEC.md for field examples)*

---

### Task 9: Create CASE_002_RESTRICTED_SECTION.md (Template & Docs)
**File**: `docs/case-files/CASE_002_RESTRICTED_SECTION.md`
**Action**: CREATE (Phase 6-ready case spec with all TIER 1 + TIER 2 fields)
**Purpose**: Provide complete reference implementation for Phase 6 case creation
**Reference**: CASE_002_TECHNICAL_SPEC.md (lines 1-1334)
**Pattern**: Copy TECHNICAL_SPEC, ensure all new fields present, rename for clarity
**Depends on**: None (standalone documentation)
**Estimate**: 30 minutes

**Acceptance Criteria**:
- [ ] File created: `docs/case-files/CASE_002_RESTRICTED_SECTION.md`
- [ ] Victim section complete (Helena Blackwood humanization, memorable trait, time/cause of death)
- [ ] All evidence has significance, strength, points_to, contradicts fields
- [ ] All witnesses have wants, fears, moral_complexity
- [ ] Timeline section present with 4+ entries
- [ ] Solution section has deductions_required, common_mistakes, fallacies_to_catch
- [ ] File ready for direct YAML conversion in Phase 6 (no additional research needed)

*(Copy and enhance CASE_002_TECHNICAL_SPEC.md, ensure all Phase 5.5 fields present)*

---

### Task 10: Update CASE_DESIGN_GUIDE.md (Template & Docs)
**File**: `docs/game-design/CASE_DESIGN_GUIDE.md`
**Action**: MODIFY (add "Field Usage Guidelines" section)
**Purpose**: Document when to use significance vs strength, how to write moral_complexity, timeline format
**Reference**: Existing design guide
**Pattern**: Add new section with subsections for each field type
**Depends on**: None (standalone documentation)
**Estimate**: 30 minutes

**Code Example** (Markdown):
```markdown
# Add to docs/game-design/CASE_DESIGN_GUIDE.md

## Field Usage Guidelines (Phase 5.5)

### Evidence Enhancement

**Significance** (Why this evidence matters):
- 1-2 sentences explaining strategic importance
- Examples:
  - ✅ "Proves Wingardium Leviosa used at high power"
  - ✅ "Contradicts suspect's alibi about being in dormitory"
  - ❌ "Important evidence" (too vague)

**Strength** (Evidence quality 0-100):
- **100**: Irrefutable (magical signature match, multiple eyewitnesses)
- **80-90**: Very strong (physical evidence, single credible eyewitness)
- **60-70**: Moderate (circumstantial, corroborating evidence)
- **40-50**: Weak (hearsay, uncorroborated)
- **20-30**: Very weak (speculation, rumor)

**Points To** (Suspect implications):
- List suspect IDs this evidence implicates
- Examples: `["professor_vector", "marcus_flint"]`
- Leave empty if evidence doesn't implicate anyone specifically

**Contradicts** (Theories disproved):
- List suspect IDs or theory names this evidence rules out
- Examples: `["accident_theory", "filch_guilty"]`
- Use for exoneration evidence

### Victim Humanization

**Name**: Victim's full name (required if victim section present)

**Age**: Year or age descriptor
- Examples: "Fourth-year Ravenclaw", "35-year-old professor"

**Humanization** (2-3 sentence emotional hook):
- Connect player to victim personally ("You remember her from...")
- Include defining trait or habit
- End with emotional impact ("Someone silenced that curiosity permanently")
- Examples:
  - ✅ "Fourth-year Ravenclaw. You remember her from the library—always buried in wandlore texts..."
  - ❌ "Student who died." (no emotional connection)

**Memorable Trait**: One-phrase defining characteristic
- Examples: "Wandlore obsessive", "Always humming Celestina Warbeck songs"

### Witness Psychological Depth

**Wants** (What drives behavior):
- Single goal or desire that motivates witness actions
- Examples:
  - "Help investigation without betraying friend"
  - "Protect reputation at all costs"
  - "Clear own name of suspicion"

**Fears** (What inhibits honesty):
- What stops witness from fully cooperating
- Examples:
  - "Retaliation from Slytherins"
  - "Losing friends if seen as snitch"
  - "Implicating family member"

**Moral Complexity** (Internal conflict):
- 2-4 sentences explaining why witness is torn
- Show wants conflicting with fears
- Make player empathize with witness's dilemma
- Example:
  ```
  Hannah saw something critical but doesn't want to betray Marcus,
  who helped her pass Potions last year. She's torn between loyalty
  to a friend and duty to justice. Her people-pleasing nature makes
  this internal conflict especially painful.
  ```

### Timeline System

**Structure**: Chronological list of events with metadata

**Format**:
```yaml
timeline:
  - time: "9:30 PM"
    event: "Filch patrols past library entrance"
    witnesses: ["argus_filch"]
    evidence: ["checkout_log"]
```

**Usage**:
- **time**: Specific time (e.g., "10:05 PM", "Between 9 and 10 PM")
- **event**: What happened (1 sentence)
- **witnesses**: Witness IDs who can confirm this event
- **evidence**: Evidence IDs related to this event

**Purpose**: Enables alibi checking, timeline reconstruction puzzles

### Enhanced Solution Fields

**Deductions Required**: Logical steps to reach correct conclusion
- List each key deduction separately
- Examples:
  - "Scorch marks prove levitation spell used (not accident)"
  - "Shelf positioned deliberately before being dropped (premeditation)"
  - "Helena's missing wand suggests killer took it (murder, not accident)"

**Correct Reasoning Requires**: Key insights player must understand
- Higher-level than deductions_required (themes vs steps)
- Examples:
  - "Evidence of magical involvement (scorch marks)"
  - "Proof of premeditation (shelf positioning)"
  - "Alibi verification (Vector's lie)"

**Common Mistakes**: Wrong accusations with explanations
- Structure: `{error, reason, why_wrong}`
- Example:
  ```yaml
  - error: "Accusing Marcus Flint"
    reason: "Presence near scene + hostile relationship with victim"
    why_wrong: "Alibi confirmed by multiple witnesses, no magical skill for levitation"
  ```

**Fallacies to Catch**: Logical errors with examples
- Structure: `{fallacy, example}`
- Example:
  ```yaml
  - fallacy: "Confirmation bias"
    example: "Focusing only on Marcus's hostility, ignoring contradictory alibi evidence"
  ```
```

**Acceptance Criteria**:
- [ ] "Field Usage Guidelines" section added to CASE_DESIGN_GUIDE.md
- [ ] Evidence enhancement fields documented (significance, strength, points_to, contradicts)
- [ ] Strength calibration scale documented (100=irrefutable, 50=moderate, 20=weak)
- [ ] Victim humanization formula documented (2-3 sentences, emotional hook)
- [ ] Witness psychological depth documented (wants drive behavior, fears inhibit, moral_complexity shows conflict)
- [ ] Timeline format documented (time, event, witnesses, evidence)
- [ ] Enhanced solution fields documented (deductions_required, common_mistakes, fallacies_to_catch)
- [ ] Examples provided for each field type

---

### Task 11: Test New Models and Validation (Backend Testing)
**File**: `backend/tests/test_case_discovery.py`
**Action**: MODIFY (add tests for new field validation)
**Purpose**: Verify validator catches missing victim.name, wants/fears inconsistency, strength range errors
**Reference**: Existing validation tests in Phase 5.4
**Pattern**: Pytest with malformed YAML fixtures
**Depends on**: Tasks 1-3 (models, parsing, validation complete)
**Estimate**: 30 minutes

**Code Example**:
```python
# Add to backend/tests/test_case_discovery.py

def test_validate_victim_name_required():
    """Validator errors if victim section present but name missing."""
    case_data = {
        "case": {
            "id": "test_case",
            "title": "Test",
            "difficulty": "beginner",
            "victim": {
                "age": "Fourth-year",
                "humanization": "Test humanization",
                # Missing name
            },
            "locations": {"library": {"id": "library"}},
            "witnesses": [{"id": "test_witness"}],
            "solution": {"culprit": "test_witness"},
        }
    }

    is_valid, errors, warnings = validate_case(case_data)

    assert not is_valid
    assert any("victim.name" in error for error in errors)


def test_validate_witness_wants_fears_consistency():
    """Validator errors if witness has wants but not fears (or vice versa)."""
    case_data = {
        "case": {
            "id": "test_case",
            "title": "Test",
            "difficulty": "beginner",
            "locations": {"library": {"id": "library"}},
            "witnesses": [
                {
                    "id": "test_witness",
                    "name": "Test Witness",
                    "personality": "Test",
                    "wants": "Help investigation",
                    # Missing fears (inconsistent)
                }
            ],
            "solution": {"culprit": "test_witness"},
        }
    }

    is_valid, errors, warnings = validate_case(case_data)

    assert not is_valid
    assert any("fears missing" in error for error in errors)


def test_validate_evidence_strength_range():
    """Validator errors if evidence strength not 0-100."""
    case_data = {
        "case": {
            "id": "test_case",
            "title": "Test",
            "difficulty": "beginner",
            "locations": {
                "library": {
                    "id": "library",
                    "hidden_evidence": [
                        {
                            "id": "test_evidence",
                            "strength": 150,  # Invalid (>100)
                        }
                    ],
                }
            },
            "witnesses": [{"id": "test_witness"}],
            "solution": {"culprit": "test_witness"},
        }
    }

    is_valid, errors, warnings = validate_case(case_data)

    assert not is_valid
    assert any("strength must be integer 0-100" in error for error in errors)


def test_validate_timeline_required_fields():
    """Validator errors if timeline entry missing time or event."""
    case_data = {
        "case": {
            "id": "test_case",
            "title": "Test",
            "difficulty": "beginner",
            "timeline": [
                {
                    "event": "Test event",
                    # Missing time
                }
            ],
            "locations": {"library": {"id": "library"}},
            "witnesses": [{"id": "test_witness"}],
            "solution": {"culprit": "test_witness"},
        }
    }

    is_valid, errors, warnings = validate_case(case_data)

    assert not is_valid
    assert any("missing required field 'time'" in error for error in errors)


def test_backward_compatible_case_001():
    """Old case_001.yaml without new fields validates without errors."""
    case_data = load_case("case_001")  # Existing simple case

    is_valid, errors, warnings = validate_case(case_data)

    assert is_valid
    assert len(errors) == 0
    # Warnings acceptable (missing optional fields)


def test_narrator_receives_victim_humanization():
    """Narrator prompt includes victim humanization when present."""
    from src.context.narrator import build_narrator_context

    location = {
        "description": "Crime scene",
        "surface_elements": [],
        "hidden_evidence": [],
        "not_present": [],
    }

    victim = {
        "name": "Helena Blackwood",
        "humanization": "You remember her from the library...",
        "cause_of_death": "Blunt force trauma",
    }

    prompt = build_narrator_context(
        location=location,
        player_input="examine scene",
        history=[],
        discovered_evidence=[],
        victim=victim,
    )

    assert "You remember her from the library" in prompt
    assert "Blunt force trauma" in prompt


def test_witness_receives_psychological_depth():
    """Witness prompt includes wants/fears/moral_complexity when present."""
    from src.context.witness import build_witness_prompt

    witness = {
        "id": "hannah",
        "name": "Hannah Abbott",
        "personality": "Nervous",
        "wants": "Help without betraying friend",
        "fears": "Retaliation from Slytherins",
        "moral_complexity": "Hannah is torn between loyalty and justice.",
        "knowledge": [],
        "secrets": [],
        "lies": [],
    }

    prompt = build_witness_prompt(
        witness=witness,
        question="What did you see?",
        trust=50,
        history=[],
        revealed_evidence=[],
    )

    assert "Help without betraying friend" in prompt
    assert "Retaliation from Slytherins" in prompt
    assert "Hannah is torn between loyalty and justice" in prompt
```

**Acceptance Criteria**:
- [ ] Test: Validator errors if victim.name missing (victim section present)
- [ ] Test: Validator errors if witness has wants but not fears (inconsistency)
- [ ] Test: Validator errors if evidence.strength not 0-100
- [ ] Test: Validator errors if timeline entry missing time or event
- [ ] Test: Backward compatible (case_001.yaml validates without errors)
- [ ] Test: Narrator prompt includes victim humanization
- [ ] Test: Witness prompt includes wants/fears/moral_complexity
- [ ] All tests pass (no regressions)

---

## Integration Points

### Backend API
**Where**: `backend/src/api/routes.py`
**What**: No new endpoints (pure backend enhancement)
**Pattern**: Existing endpoints automatically receive enhanced data (transparent to frontend)
**Changes**:
- `POST /api/investigate`: Narrator receives victim context
- `POST /api/witness/{witness_id}/interrogate`: Witness receives wants/fears/moral_complexity
- `POST /api/verdict/submit`: Moody receives enhanced solution fields

### State Management
**Where**: `backend/src/state/player_state.py`
**What**: Add 5 new Pydantic models
**Pattern**: Models mirror YAML structure (1:1 mapping)
**Integration**: Used by loader.py parsing functions, validation, type safety

### LLM Context Distribution
**Where**: `backend/src/context/*.py` (narrator, witness, mentor, tom_llm)
**What**: Each LLM receives only relevant new fields (context isolation + efficiency)
**Pattern**: Add new sections to prompts (VICTIM CONTEXT, PSYCHOLOGICAL DEPTH, EVIDENCE STRENGTH)
**Integration**: Prompts pass new fields to Claude Haiku via Anthropic SDK

---

## Known Gotchas

**From Phase 5.4 research + project experience:**

1. **YAML Indentation** (multiline strings): Pipe operator `|` requires consistent indentation. Test with malformed examples.

2. **Optional vs Default**: Use explicit defaults (`Field(default="")`) not `None` (ambiguous). Document in template.

3. **Backward Compatibility**: All new fields optional in code (`.get()` with defaults). Validator warns, doesn't fail.

4. **LLM Context Size**: Don't pass full timeline to all LLMs (token waste). Use distribution table.

5. **Evidence Strength Calibration**: Document scale (100=irrefutable, 50=moderate, 20=weak) in CASE_DESIGN_GUIDE.md.

6. **Validator Error Messages**: Specific messages with field path ("victim.name required if victim section present").

7. **Wants/Fears Consistency**: If one specified, both required (validator checks). Prevents half-complete psychology.

8. **Timeline Format**: Time field string (not datetime) for flexibility ("Between 9-10 PM", "Approximately 10:05 PM").

9. **Moral Complexity Multiline**: Use pipe `|` operator, consistent indentation. Test with 4+ line strings.

10. **Points To vs Contradicts**: `points_to` implicates suspects, `contradicts` exonerates. Different strategic uses.

11. **Significance vs Strength**: Significance = why it matters (strategic), Strength = how reliable (quality). Both serve different purposes.

12. **Per-Suspect Responses**: common_mistakes structure = `{error, reason, why_wrong}`. Must match accused_id in error field.

---

## Validation

### Syntax & Style (Pre-commit)
```bash
cd backend
uv run ruff check .
uv run ruff format .
uv run mypy src/
# Expected: No errors on new code
```

### Manual Verification (Optional)
```bash
cd backend
uv run python
>>> from src.case_store.loader import load_case, validate_case, load_victim
>>> case = load_case("case_001")
>>> is_valid, errors, warnings = validate_case(case)
>>> print(f"Valid: {is_valid}, Errors: {errors}, Warnings: {warnings}")
>>> victim = load_victim(case)
>>> print(victim)  # Should be None (case_001 has no victim section)
```

**Note**: validation-gates agent handles comprehensive testing. No need to specify test scenarios in PRP.

---

## Dependencies

**New packages**: None - reuse existing Pydantic, PyYAML, Claude SDK

**Configuration**: No new env vars needed

**File Dependencies**:
- Task 2 depends on Task 1 (Pydantic models must exist before parsing functions)
- Task 3 depends on Task 2 (parsing functions must exist before validation)
- Tasks 4-7 independent (LLM prompt updates don't depend on each other)
- Tasks 8-10 independent (documentation updates)
- Task 11 depends on Tasks 1-3 (testing requires models + validation)

---

## Out of Scope

**Phase 5.5 does NOT include:**
- New API endpoints (all existing endpoints work transparently)
- Frontend changes (pure backend enhancement)
- Complex alibi-checking logic (timeline is data structure only, logic in Phase 6+)
- Dynamic LLM-based feedback (uses template-based Moody feedback, not LLM re-generation)
- Multiple victim cases (single victim per case assumed)
- Suspect relationship graphs (points_to/contradicts is list only, not graph structure)

**Deferred to Phase 6**:
- Complete CASE_002 YAML implementation (Phase 5.5 creates template + spec only)
- Testing with player feedback (Phase 6 playtesting)
- UI for timeline visualization (backend data structure only)

---

## Agent Orchestration Plan

### Execution Strategy

**Sequential Track** (backend-only work):
1. `fastapi-specialist` → Backend implementation (Tasks 1-7, 11)
2. `documentation-manager` → Template + docs (Tasks 8-10)
3. `validation-gates` → Quality gates (tests, lint, type check)

**Why Sequential**: Backend must complete before docs can reference actual implementation.

### Agent-Specific Guidance

#### For fastapi-specialist
- **Input**: Tasks 1-7, 11 (backend models, parsing, validation, LLM prompts, testing)
- **Context**: Quick Reference section above (no doc reading needed)
- **Pattern**:
  - Task 1: Add 5 Pydantic models to player_state.py (after CaseMetadata)
  - Task 2: Add 4 parsing functions to loader.py (load_victim, load_timeline, load_enhanced_solution, load_enhanced_evidence)
  - Task 3: Enhance validate_case() with new field checks (errors vs warnings)
  - Tasks 4-7: Update LLM prompts (add new sections, maintain existing structure)
  - Task 11: Add 8+ tests to test_case_discovery.py
- **Output**: All backend changes complete, tests passing

**Key Files to Reference**:
- `backend/src/state/player_state.py` (existing CaseMetadata model, lines 29-55)
- `backend/src/case_store/loader.py` (existing load_case, lines 23-49)
- `backend/src/context/narrator.py` (existing format_hidden_evidence, lines 10-43)
- `backend/src/context/witness.py` (existing format_knowledge, lines 14-26)
- `backend/src/context/mentor.py` (existing build_mentor_feedback, lines 9-71)

**Critical**: All new fields backward compatible (use `.get()` with defaults). Test with case_001.yaml.

#### For documentation-manager
- **Input**: Tasks 8-10 (case_template.yaml, CASE_002_RESTRICTED_SECTION.md, CASE_DESIGN_GUIDE.md)
- **Context**: CASE_002_TECHNICAL_SPEC.md examples, field usage patterns
- **Output**:
  - Enhanced case_template.yaml with all TIER 1 + TIER 2 fields
  - Created CASE_002_RESTRICTED_SECTION.md (Phase 6-ready spec)
  - Updated CASE_DESIGN_GUIDE.md with Field Usage Guidelines section

**Key Files to Reference**:
- `backend/src/case_store/case_template.yaml` (existing template, 260 lines)
- `docs/case-files/CASE_002_TECHNICAL_SPEC.md` (field examples, lines 1-200)
- `docs/game-design/CASE_DESIGN_GUIDE.md` (existing guide)

**Critical**: Template annotations must match validator requirements (Task 3).

#### For validation-gates
- **Input**: All code complete, documentation complete
- **Runs**:
  - Backend tests: `uv run pytest backend/tests/`
  - Backend lint: `uv run ruff check backend/src/`
  - Backend type check: `uv run mypy backend/src/`
- **Expected**:
  - Backend tests: 729+ passing (38 existing Phase 5.4 + new Phase 5.5 tests)
  - Lint: Clean (no new errors)
  - Type check: Clean on Phase 5.5 code (14 pre-existing errors acceptable)
- **Output**: Pass/fail report, fix blockers if any

**Note**: validation-gates creates additional tests if coverage gaps found.

### Handoff Context

**Next agent receives**:
- This PRP (full context)
- Quick Reference (no doc reading needed)
- Specific task numbers
- Actual file paths to modify
- Pattern files to follow

**Next agent does NOT need**:
- ❌ Read research files (pre-digested in Quick Reference)
- ❌ Search for examples (code examples provided)
- ❌ Read 5-10 docs (Quick Reference has everything)
- ❌ Explore codebase (integration points provided with line numbers)

---

## Anti-Patterns to Avoid

**From project experience:**

❌ **Creating new API endpoints** (Phase 5.5 is context enhancement only)
❌ **Frontend changes** (all work backend-only)
❌ **Complex validation logic** (keep simple: required vs optional, error vs warning)
❌ **Passing entire timeline to all LLMs** (use distribution table, efficiency)
❌ **Making all new fields required** (backward compatibility critical)
❌ **Using `None` for optional fields** (use explicit defaults with `Field(default="")`)
❌ **Generic validator errors** ("Missing field" too vague, need "victim.name required if victim section present")
❌ **Duplicating patterns** (follow existing format_* functions in narrator.py, witness.py)

---

## Success Metrics

**Confidence Score**: 9/10

**Likelihood of one-pass implementation success**: Very high

**Rationale**:
- All patterns from existing code (Phase 5.4 validation, Phase 4.5 LLM contexts)
- Simple enhancement (add fields → pass to LLMs, no complex logic)
- Backward compatible approach documented (won't break case_001.yaml)
- All integration points mapped with exact line numbers
- Code examples provided for every task
- Pre-validated against CASE_002_TECHNICAL_SPEC.md structure

**Risk Areas**:
- YAML multiline string indentation (mitigated: test with malformed examples)
- Validator error message specificity (mitigated: code examples provided)
- LLM context size (mitigated: distribution table, not passing everything to everyone)

---

**Generated**: 2026-01-13
**Source**: PLANNING.md Phase 5.5 + Phase 5.4 research + project codebase
**Confidence Score**: 9/10 (likelihood of one-pass implementation success)
**Alignment**: Validated against PLANNING.md (lines 1297-1435) and game design principles (psychological depth, KISS implementation)
**Filename**: `PRPs/PRP-PHASE5.5.md` (implementation-ready, ~1800 lines)
