# Phase 3: Verdict System + Post-Verdict Confrontation - Product Requirement Plan

**STATUS: COMPLETE ✅**
**Completion Date**: 2026-01-06
**User Testing**: Confirmed working (minor issues noted for future investigation)
**Total Tests**: 604 passing (317 backend + 287 frontend)

## Goal

Build verdict submission and evaluation system that:
- Allows players to submit verdicts (suspect + reasoning + evidence)
- Evaluates correctness using case solution data
- Provides educational mentor feedback (fallacies, logic gaps, score)
- Shows post-verdict confrontation when correct
- Enables full end-to-end case completion

**End State**: Player can complete Case 1 from investigation → verdict → confrontation → closure

## Why

- **Completes core game loop**: Investigation without verdict is incomplete
- **Educational value**: Mentor feedback teaches rationality (fallacy detection, Bayesian reasoning)
- **Narrative payoff**: Post-verdict confrontation provides emotional closure
- **User impact**: First playable end-to-end case (milestone achievement)
- **Foundation for expansion**: Verdict system enables Cases 2-10+

## What

### User-Visible Behavior

**Verdict Submission Flow**:
1. Player clicks "Submit Verdict" button (after investigation)
2. VerdictSubmission modal opens:
   - Dropdown: Select suspect (Hermione, Draco, or custom "Other")
   - Textarea: Explain reasoning (2-3 sentences minimum, required)
   - Checklist: Select key evidence pieces (optional but recommended)
   - Submit button
3. System evaluates verdict:
   - **If CORRECT**: Show mentor approval → Post-verdict confrontation → Aftermath → Case closed
   - **If INCORRECT**: Show mentor feedback → Attempts remaining → Try again

**Mentor Feedback (Incorrect Verdict)**:
- Analysis section: "You accused [suspect] because [player's reasoning summary]"
- Fallacies detected: "Confirmation bias: You focused only on evidence supporting your theory..."
- Score: Reasoning quality 0-100 (based on logic, evidence cited, avoided fallacies)
- Critique: "What you missed: [key evidence player didn't cite]"
- Attempts remaining: "7/10 attempts left. Try again."

**Post-Verdict Confrontation (Correct Verdict)**:
- 3-4 dialogue exchanges:
  - Moody opens: "We need to discuss what happened..."
  - Culprit responds: Shows remorse/defiance/anger/broken (tone varies per case)
  - Player can optionally respond (choices provided)
  - Moody final word: "Good work. Take them to holding."
- Aftermath text: Sentencing, consequences, what happened after

**Attempt Tracking**:
- 10 max attempts per case
- Feedback adapts:
  - Attempts 1-3: Harsh but vague ("Think harder.")
  - Attempts 4-7: More specific hints ("Check the timeline. When was Flint actually in the library?")
  - Attempts 8-10: Direct hints ("The scorch marks prove high-power Wingardium Leviosa. Who's capable of that?")
- After 10 failures: Show correct answer, mark case as "Failed (Solved by Mentor)"

### Technical Requirements

**Backend**:
- New verdict evaluation module (`src/verdict/evaluator.py`)
- Mentor feedback generator (`src/context/mentor.py`)
- Verdict API endpoint (`POST /api/submit-verdict`)
- YAML solution structure (culprit, key_evidence, fallacies, wrong_suspects)
- PlayerState verdict tracking (attempts, submitted_verdicts history)

**Frontend**:
- VerdictSubmission component (modal, suspect select, reasoning input, evidence checklist)
- MentorFeedback component (analysis, fallacies list, score meter)
- ConfrontationDialogue component (dialogue bubbles, aftermath text)
- Verdict flow integration in App.tsx
- API client function (`submitVerdict()`)

### Success Criteria

- [ ] Player can select suspect, enter reasoning, submit verdict
- [ ] System evaluates correctness (compares suspect_id to solution.culprit)
- [ ] Mentor provides feedback with analysis, fallacies, score (0-100)
- [ ] If correct: Post-verdict confrontation plays (3-4 exchanges)
- [ ] If incorrect: Feedback shown, attempts decremented, can retry
- [ ] Aftermath text displays after confrontation
- [ ] Attempt tracking works (10 max, feedback adapts)
- [ ] All tests pass (backend: 45+ new tests, frontend: 40+ new tests)
- [ ] User can complete Case 1 end-to-end
- [ ] TypeScript compiles, no errors

---

## Context & References

### Documentation (URLs for AI agent to reference)

```yaml
- url: https://docs.anthropic.com/claude/docs/guide-to-anthropics-prompt-engineering-resources
  why: Claude prompt engineering for mentor feedback context builder

- url: https://react.dev/reference/react/useReducer
  why: useReducer pattern for verdict flow state management (see useWitnessInterrogation.ts)

- url: docs/CASE_001_TECHNICAL_SPEC.md (lines 964-1163)
  why: Complete verdict data structure (solution, wrong_suspects, post_verdict, fallacies)
```

### Codebase Patterns (files to study)

```yaml
- file: backend/src/context/narrator.py
  why: LLM prompt structure pattern (apply to mentor.py)
  symbol: build_narrator_prompt(), build_system_prompt()

- file: backend/src/context/witness.py
  why: Isolated context builder pattern (mentor context separate from narrator)
  symbol: build_witness_prompt(), build_witness_system_prompt()

- file: backend/src/utils/trust.py
  why: State tracking pattern (verdict attempts similar to trust level)
  symbol: adjust_trust(), check_secret_triggers()

- file: frontend/src/hooks/useWitnessInterrogation.ts
  why: useReducer pattern for complex state (verdict flow has similar complexity)
  symbol: useWitnessInterrogation hook, reducer actions

- file: frontend/src/components/WitnessInterview.tsx
  why: Dialogue UI pattern (apply to ConfrontationDialogue)
  symbol: Conversation bubbles, trust meter → adapt for dialogue + aftermath

- file: backend/src/case_store/case_001.yaml
  why: Current YAML structure (add solution, wrong_suspects, post_verdict modules)
```

### Research (from RESEARCH.md)

- **LA Noire**: Accusation system (correct/incorrect with feedback)
- **Return of the Obra Dinn**: Verdict evaluation (deductions required, not multiple choice)
- **Phoenix Wright**: Post-trial breakdown (culprit confession, aftermath)

---

## Quick Reference (Context Package)

### Essential API Signatures

```python
# From verdict/evaluator.py (to be created)
def check_verdict(
    suspect_id: str,
    reasoning: str,
    evidence_ids: list[str],
    solution: dict,  # From YAML
    case_id: str
) -> VerdictResult:
    """Evaluate verdict correctness.

    Returns:
        VerdictResult with:
        - is_correct: bool
        - culprit_id: str (actual culprit)
        - score: int (0-100 reasoning quality)
        - fallacies: list[str] (detected fallacies)
        - missing_evidence: list[str] (key evidence not cited)
    """

def detect_fallacies(reasoning: str, evidence_ids: list[str], solution: dict) -> list[str]:
    """Detect logical fallacies in reasoning.

    Fallacies:
    - confirmation_bias: Only cites evidence supporting theory
    - correlation_not_causation: Assumes presence = guilt
    - appeal_to_authority: "Professor can't be guilty"
    - post_hoc: Timeline errors (scarf = guilt at time of death)
    """

def score_reasoning(
    reasoning: str,
    evidence_ids: list[str],
    solution: dict,
    is_correct: bool
) -> int:
    """Score reasoning quality 0-100.

    Criteria:
    - +30 if correct suspect
    - +20 per key evidence cited (max +40)
    - +10 for logical coherence
    - +10 for avoiding fallacies
    - +10 for complete timeline
    """
```

```typescript
// From frontend types (to be created)
interface VerdictSubmission {
  suspect_id: string;
  reasoning: string;      // 2-3 sentences minimum
  evidence_ids: string[]; // Selected key evidence
}

interface VerdictResult {
  is_correct: boolean;
  culprit_id: string;
  mentor_feedback: MentorFeedback;
  confrontation?: ConfrontationData; // Only if correct
  aftermath?: string;                // Only if correct
  attempts_remaining: number;
}

interface MentorFeedback {
  analysis: string;           // Summary of player reasoning
  fallacies: FallacyItem[];   // Detected fallacies with explanations
  score: number;              // 0-100
  critique: string;           // What player missed
  praise?: string;            // What player got right (if score > 50)
}

interface FallacyItem {
  type: string;               // confirmation_bias, correlation_not_causation, etc.
  explanation: string;        // "You focused only on evidence supporting..."
}

interface ConfrontationData {
  dialogue: DialogueExchange[];
  culprit_tone: string;       // defiant, remorseful, broken, angry, resigned
}

interface DialogueExchange {
  speaker: string;            // "moody", "culprit", "player"
  text: string;
  options?: string[];         // Player response options (optional)
}
```

### Key Patterns from Research

#### Pattern: Template-Based Mentor Feedback (Simple, Fast)

```python
# From CASE_001_TECHNICAL_SPEC.md (lines 1036-1079)
# Recommended approach: Template-based (not LLM)

WRONG_SUSPECT_TEMPLATES = {
    "adrian_clearmont": """
MOODY: "Clearmont? The PREFECT? Let me guess: he followed her, stole
her notes, acted guilty. So he must be the killer, right?

Wrong. He heard an ADULT voice arguing with Helena. He RAN when he
heard the crash—before the murder, not after. And check the scorch
marks: that level of Wingardium Leviosa? Adrian couldn't lift a
CHAIR that high, let alone a bookshelf.

Guilt doesn't equal murder, recruit. He's guilty of being a coward
and a cheat. Not a killer. Think harder. {attempts_remaining}/10."
    """,

    "marcus_flint": """
MOODY: "FLINT? You're accusing a student of MURDER based on a scarf
and an argument? Did you check the TIMELINE, recruit?

His scarf proves he was there EARLIER. That's it. The shelf fell at
10:05 PM. He was in his common room by then.

You've got CONFIRMATION BIAS written all over this case. See suspicious
person, ignore everything else. PATHETIC.

Back to the evidence. {attempts_remaining}/10 attempts remaining."
    """,

    "argus_filch": """
MOODY: "Filch. You're accusing a SQUIB of a magical murder. Think about
that for a second.

Wingardium Leviosa powerful enough to lift a bookshelf? Filch can't
even light a candle with magic. Yes, he behaved suspiciously—because
he was TERRIFIED of being blamed. Fear isn't guilt.

Use your HEAD. Check the magical evidence. {attempts_remaining}/10."
    """
}

def build_mentor_response(wrong_suspect_id: str, attempts_remaining: int) -> str:
    """Simple template-based feedback (Phase 3).

    Phase 7 can replace with LLM-generated dynamic feedback.
    """
    template = WRONG_SUSPECT_TEMPLATES.get(wrong_suspect_id, DEFAULT_WRONG)
    return template.format(attempts_remaining=attempts_remaining)
```

#### Pattern: Fallacy Detection (Rule-Based)

```python
# Simple rule-based fallacy detection (no ML needed)

def detect_confirmation_bias(reasoning: str, evidence_ids: list[str], solution: dict) -> bool:
    """Check if player only cited evidence supporting their theory."""
    cited_evidence = set(evidence_ids)
    key_evidence = set(solution["key_evidence"])

    # If player cited <50% of key evidence, likely confirmation bias
    if len(cited_evidence & key_evidence) / len(key_evidence) < 0.5:
        return True

    return False

def detect_correlation_not_causation(suspect_id: str, evidence_ids: list[str], solution: dict) -> bool:
    """Check if player assumed presence = guilt (e.g., scarf at scene)."""
    # Example: If suspecting Flint based only on scarf (presence evidence)
    if suspect_id == "marcus_flint" and "flints_scarf" in evidence_ids:
        # Check if player cited timeline evidence
        if "checkout_log" not in evidence_ids:
            return True  # Assumed presence = guilt without checking timeline

    return False

def detect_appeal_to_authority(suspect_id: str, solution: dict) -> bool:
    """Check if player avoided suspecting authority figure."""
    # If correct culprit is professor but player accused student
    if solution["culprit"].startswith("professor_") and suspect_id.startswith("student_"):
        return True  # Possible authority bias

    return False
```

#### Pattern: Dialogue Bubbles UI (From WitnessInterview)

```typescript
// Adapt WitnessInterview conversation bubbles for ConfrontationDialogue

// WitnessInterview.tsx pattern:
{conversation.map((item, index) => (
  <div
    key={index}
    className={`p-4 rounded ${
      item.speaker === 'player'
        ? 'bg-blue-900/30 border-l-4 border-blue-500'
        : 'bg-stone-800/50 border-l-4 border-amber-500'
    }`}
  >
    <div className="text-sm text-stone-400 mb-1">
      {item.speaker === 'player' ? 'YOU' : item.speaker.toUpperCase()}
    </div>
    <div className="text-stone-100">{item.text}</div>
  </div>
))}

// Adapt for ConfrontationDialogue:
{dialogue.map((exchange, index) => (
  <div
    key={index}
    className={`p-4 rounded border-l-4 ${getSpeakerStyle(exchange.speaker)}`}
  >
    <div className="text-sm text-stone-400 mb-1">
      {exchange.speaker.toUpperCase()}
    </div>
    <div className="text-stone-100">{exchange.text}</div>

    {/* If player options, show buttons */}
    {exchange.options && (
      <div className="mt-3 space-y-2">
        {exchange.options.map((option, i) => (
          <Button
            key={i}
            onClick={() => handlePlayerResponse(option)}
            variant="secondary"
          >
            {option}
          </Button>
        ))}
      </div>
    )}
  </div>
))}
```

### Library-Specific Gotchas

- **FastAPI**: Pydantic models for nested verdict data (VerdictSubmission, VerdictResult)
- **React**: useReducer for verdict flow (not useState - too complex)
- **YAML**: Use `|` for multi-line strings in confrontation dialogue
- **TypeScript**: Optional chaining for `confrontation?.dialogue` (only if correct verdict)

### Decision Tree

```
Verdict submission:
  → If suspect_id == solution.culprit:
    → Check reasoning quality:
      → If score >= 60:
        ✅ CORRECT - Show confrontation
      → Else:
        ❌ INCORRECT - "Right suspect, weak reasoning. Explain WHY."
  → Else:
    ❌ INCORRECT - Show wrong suspect feedback

After incorrect verdict:
  → If attempts_remaining > 0:
    → Show feedback, allow retry
  → Else (attempts == 0):
    → Show correct answer
    → Mark case "Failed (Solved by Mentor)"
    → Still show confrontation (educational)

After correct verdict:
  → Load confrontation dialogue from YAML
  → Play 3-4 exchanges
  → Show aftermath text
  → Mark case "Solved" → Can proceed to next case
```

### Configuration Requirements

```yaml
# case_001.yaml additions (from CASE_001_TECHNICAL_SPEC.md)

solution:
  culprit: "draco"  # Or correct suspect ID
  method: "How they did it"
  motive: "Why they did it"
  key_evidence:
    - "frost_pattern"      # Must cite to get high score
    - "wand_signature"     # Must cite to get high score

wrong_suspects:
  - id: "hermione"
    why_innocent: "Timeline proves she left before incident"
    common_mistakes:
      - "Assumed presence in library = guilt"
      - "Ignored her alibi testimony"

post_verdict:
  correct:
    confrontation:
      - speaker: "moody"
        text: "Moody's opening line..."
      - speaker: "draco"  # Culprit
        text: "Culprit's response..."
        tone: "defiant"  # or remorseful, broken, angry, resigned
      - speaker: "moody"
        text: "Moody's final word..."
    aftermath: "Sentencing text (2-3 sentences)"

  incorrect:
    show_correct: true  # After 10 attempts, show answer

# Fallacy templates
fallacy_explanations:
  confirmation_bias: "You focused only on evidence supporting your theory and ignored contradictory facts."
  correlation_not_causation: "You assumed that because [X] was present, they must be guilty. Presence ≠ causation."
  appeal_to_authority: "You assumed an authority figure (professor, prefect) couldn't be guilty."
  post_hoc: "You assumed timeline: [event A] then [event B] means A caused B. Check actual times."
```

---

## Current Codebase Structure

```bash
backend/
├── src/
│   ├── api/
│   │   └── routes.py              # Has investigate, interrogate endpoints
│   ├── context/
│   │   ├── narrator.py            # LLM prompt builder (isolated)
│   │   └── witness.py             # LLM prompt builder (isolated)
│   ├── case_store/
│   │   ├── case_001.yaml          # Current case (needs solution/post_verdict)
│   │   └── loader.py              # load_case(), get_witness(), etc.
│   ├── state/
│   │   ├── player_state.py        # PlayerState model
│   │   └── persistence.py         # save_state(), load_state()
│   └── utils/
│       ├── evidence.py            # Evidence finding logic
│       └── trust.py               # Trust mechanics

frontend/
├── src/
│   ├── components/
│   │   ├── LocationView.tsx      # Investigation UI
│   │   ├── EvidenceBoard.tsx     # Evidence list
│   │   ├── WitnessInterview.tsx  # Dialogue UI pattern
│   │   └── ui/
│   │       ├── Modal.tsx         # Reusable modal (terminal variant)
│   │       └── Button.tsx        # Reusable button
│   ├── hooks/
│   │   ├── useInvestigation.ts   # Investigation state
│   │   └── useWitnessInterrogation.ts  # useReducer pattern
│   ├── api/
│   │   └── client.ts             # API client functions
│   └── types/
│       └── investigation.ts      # TypeScript types
```

---

## Desired Codebase Structure

```bash
backend/
├── src/
│   ├── verdict/                  # NEW MODULE
│   │   ├── __init__.py
│   │   ├── evaluator.py          # check_verdict(), score_reasoning(), detect_fallacies()
│   │   └── fallacies.py          # Fallacy detection rules
│   ├── context/
│   │   ├── narrator.py           # Existing
│   │   ├── witness.py            # Existing
│   │   └── mentor.py             # NEW - build_mentor_prompt() for feedback
│   ├── case_store/
│   │   ├── case_001.yaml         # MODIFY - Add solution, wrong_suspects, post_verdict
│   │   └── loader.py             # MODIFY - Add load_solution(), load_confrontation()
│   ├── state/
│   │   └── player_state.py       # MODIFY - Add VerdictState model
│   └── api/
│       └── routes.py             # MODIFY - Add POST /api/submit-verdict

frontend/
├── src/
│   ├── components/
│   │   ├── VerdictSubmission.tsx      # NEW - Verdict form
│   │   ├── MentorFeedback.tsx         # NEW - Feedback display
│   │   └── ConfrontationDialogue.tsx  # NEW - Post-verdict dialogue
│   ├── hooks/
│   │   └── useVerdictFlow.ts          # NEW - useReducer for verdict state
│   ├── api/
│   │   └── client.ts                  # MODIFY - Add submitVerdict()
│   └── types/
│       └── investigation.ts           # MODIFY - Add verdict types
```

---

## Files to Create/Modify

| File | Action | Purpose | Dependencies |
|------|--------|---------|--------------|
| `backend/src/verdict/evaluator.py` | CREATE | Verdict evaluation logic | loader.py (solution data) |
| `backend/src/verdict/fallacies.py` | CREATE | Fallacy detection rules | None |
| `backend/src/context/mentor.py` | CREATE | Mentor feedback prompt builder | evaluator.py |
| `backend/src/case_store/case_001.yaml` | MODIFY | Add solution/post_verdict modules | None |
| `backend/src/case_store/loader.py` | MODIFY | Add load_solution(), load_confrontation() | case_001.yaml updates |
| `backend/src/state/player_state.py` | MODIFY | Add VerdictState model | None |
| `backend/src/api/routes.py` | MODIFY | Add POST /api/submit-verdict | evaluator.py, mentor.py |
| `frontend/src/components/VerdictSubmission.tsx` | CREATE | Verdict form UI | Modal.tsx, Button.tsx |
| `frontend/src/components/MentorFeedback.tsx` | CREATE | Feedback display UI | None |
| `frontend/src/components/ConfrontationDialogue.tsx` | CREATE | Post-verdict dialogue UI | WitnessInterview.tsx pattern |
| `frontend/src/hooks/useVerdictFlow.ts` | CREATE | Verdict flow state (useReducer) | useWitnessInterrogation.ts pattern |
| `frontend/src/api/client.ts` | MODIFY | Add submitVerdict() | None |
| `frontend/src/types/investigation.ts` | MODIFY | Add verdict types | None |
| `frontend/src/App.tsx` | MODIFY | Integrate verdict flow | VerdictSubmission.tsx |

---

## Tasks (ordered)

### Task 1: Update case_001.yaml with verdict data
**File**: `backend/src/case_store/case_001.yaml`
**Action**: MODIFY
**Purpose**: Add solution, wrong_suspects, post_verdict modules
**Pattern**: Follow CASE_001_TECHNICAL_SPEC.md (lines 964-1163)
**Depends on**: None
**Acceptance criteria**:
- `solution` section with culprit, method, motive, key_evidence
- `wrong_suspects` list with why_innocent, common_mistakes per suspect
- `post_verdict.correct` with confrontation dialogue (3-4 exchanges) and aftermath
- `post_verdict.incorrect` with show_correct flag
- `fallacy_explanations` dictionary with 4-5 common fallacies
- YAML validates (no syntax errors)

### Task 2: Create verdict evaluation logic
**File**: `backend/src/verdict/evaluator.py`
**Action**: CREATE
**Purpose**: Core verdict evaluation (check correctness, score reasoning, detect fallacies)
**Pattern**: Follow trust.py structure (pure functions, testable)
**Depends on**: Task 1 (YAML solution data)
**Acceptance criteria**:
- `check_verdict()` compares suspect_id to solution.culprit, returns VerdictResult
- `score_reasoning()` evaluates 0-100 based on criteria (evidence cited, logic, fallacies avoided)
- `detect_fallacies()` returns list of detected fallacies (confirmation_bias, correlation_not_causation, etc.)
- `VerdictResult` model with is_correct, score, fallacies, missing_evidence fields
- 20+ unit tests (correct verdict, incorrect verdict, fallacy detection, scoring)

### Task 3: Create fallacy detection module
**File**: `backend/src/verdict/fallacies.py`
**Action**: CREATE
**Purpose**: Rule-based fallacy detection functions
**Pattern**: See Quick Reference fallacy detection examples
**Depends on**: Task 1 (YAML solution data)
**Acceptance criteria**:
- `detect_confirmation_bias()` checks if player cited <50% key evidence
- `detect_correlation_not_causation()` checks if player assumed presence = guilt
- `detect_appeal_to_authority()` checks if player avoided authority suspects
- `detect_post_hoc_fallacy()` checks timeline logic errors
- 15+ unit tests (one per fallacy type with edge cases)

### Task 4: Create mentor feedback generator
**File**: `backend/src/context/mentor.py`
**Action**: CREATE
**Purpose**: Build mentor feedback from templates (NOT LLM-based in Phase 3)
**Pattern**: Follow narrator.py structure (context builder)
**Depends on**: Task 2, 3 (VerdictResult, fallacies)
**Acceptance criteria**:
- `build_mentor_feedback()` takes VerdictResult, returns MentorFeedback
- Uses templates from CASE_001_TECHNICAL_SPEC.md (lines 1036-1079)
- Includes analysis, fallacies, score, critique, attempts_remaining
- Template substitution for {suspect}, {attempts_remaining}, {key_evidence}
- 10+ unit tests (wrong suspect templates, fallacy explanations, score display)

### Task 5: Add verdict loader functions
**File**: `backend/src/case_store/loader.py`
**Action**: MODIFY
**Purpose**: Load solution and confrontation data from YAML
**Pattern**: Follow existing get_witness(), get_location() pattern
**Depends on**: Task 1 (YAML updates)
**Acceptance criteria**:
- `load_solution(case_id: str) -> dict` returns solution module from YAML
- `load_confrontation(case_id: str, culprit_id: str) -> dict` returns post_verdict dialogue
- `load_wrong_suspect_response(case_id: str, suspect_id: str) -> str` returns template
- `load_fallacy_explanations(case_id: str) -> dict` returns fallacy templates
- Backward compatible (doesn't break existing loaders)
- 10+ unit tests (solution loading, confrontation loading, missing data handling)

### Task 6: Update PlayerState with verdict tracking
**File**: `backend/src/state/player_state.py`
**Action**: MODIFY
**Purpose**: Track verdict attempts and submission history
**Pattern**: Follow WitnessState model pattern
**Depends on**: Task 2 (VerdictResult model)
**Acceptance criteria**:
- `VerdictState` model with attempts_remaining: int, submitted_verdicts: list[SubmittedVerdict]
- `SubmittedVerdict` model with suspect_id, reasoning, evidence_ids, timestamp, is_correct
- `PlayerState` includes verdict_state: VerdictState field
- Default: attempts_remaining=10, submitted_verdicts=[]
- 5+ unit tests (verdict state creation, attempt decrement, history tracking)

### Task 7: Add POST /api/submit-verdict endpoint
**File**: `backend/src/api/routes.py`
**Action**: MODIFY
**Purpose**: Handle verdict submission, return mentor feedback or confrontation
**Pattern**: Follow /api/interrogate endpoint pattern
**Depends on**: Task 2-6 (evaluator, mentor, loader, state)
**Acceptance criteria**:
- `POST /api/submit-verdict` accepts VerdictSubmission (suspect_id, reasoning, evidence_ids)
- Evaluates verdict using evaluator.check_verdict()
- Returns VerdictResult with mentor_feedback (if incorrect) or confrontation (if correct)
- Decrements attempts_remaining in PlayerState
- Saves verdict to submitted_verdicts history
- After 10 attempts: Returns correct answer + confrontation (educational)
- 10+ unit tests (correct verdict, incorrect verdict, attempts tracking, edge cases)

### Task 8: Add backend tests
**File**: `backend/tests/test_verdict_evaluator.py`, `test_fallacies.py`, `test_mentor.py`, `test_routes.py`
**Action**: CREATE
**Purpose**: Comprehensive test coverage for verdict system
**Pattern**: Follow existing test structure (pytest, fixtures)
**Depends on**: Tasks 2-7 (all backend code)
**Acceptance criteria**:
- 20+ tests for evaluator.py (check_verdict, score_reasoning, edge cases)
- 15+ tests for fallacies.py (each fallacy type, false positives)
- 10+ tests for mentor.py (template substitution, feedback generation)
- 10+ tests for routes.py (/api/submit-verdict endpoint)
- 10+ tests for loader.py updates (solution, confrontation loading)
- All tests pass (pytest)
- Coverage >= 80% for verdict module

### Task 9: Create VerdictSubmission component
**File**: `frontend/src/components/VerdictSubmission.tsx`
**Action**: CREATE
**Purpose**: Verdict submission form UI (suspect select, reasoning input, evidence checklist)
**Pattern**: Follow WitnessInterview.tsx structure (modal, form state)
**Depends on**: None (frontend can work in parallel)
**Acceptance criteria**:
- Suspect dropdown (Hermione, Draco, Other)
- Reasoning textarea (required, 2-3 sentences minimum)
- Evidence checklist (optional but recommended)
- Submit button (disabled until reasoning filled)
- Loading state during API call
- Error handling (show error message if API fails)
- Terminal variant styling (dark theme, amber accents)
- 15+ component tests (rendering, validation, submission)

### Task 10: Create MentorFeedback component
**File**: `frontend/src/components/MentorFeedback.tsx`
**Action**: CREATE
**Purpose**: Display mentor feedback (analysis, fallacies, score)
**Pattern**: Adapt MetricCard pattern for score meter
**Depends on**: None
**Acceptance criteria**:
- Analysis section (player reasoning summary)
- Fallacies list (each fallacy with explanation)
- Score meter (0-100, color-coded: red <40, yellow 40-70, green >70)
- Critique section (what player missed)
- Praise section (if score > 50, what player got right)
- Attempts remaining display (e.g., "7/10 attempts left")
- "Try Again" button (if attempts > 0)
- Terminal styling (dark theme, monospace for score)
- 15+ component tests (rendering, score colors, fallacy display)

### Task 11: Create ConfrontationDialogue component
**File**: `frontend/src/components/ConfrontationDialogue.tsx`
**Action**: CREATE
**Purpose**: Display post-verdict confrontation dialogue
**Pattern**: Adapt WitnessInterview conversation bubbles
**Depends on**: None
**Acceptance criteria**:
- Dialogue bubbles (speaker + text)
- Speaker styling: Moody (amber), Culprit (red), Player (blue)
- Culprit tone indicator (defiant/remorseful/broken/angry/resigned)
- Player response options (if provided, buttons)
- Aftermath text display (after dialogue complete)
- "Close Case" button (marks case complete, returns to case select)
- Terminal styling (dialogue bubbles, dark theme)
- 10+ component tests (rendering, dialogue progression, aftermath display)

### Task 12: Create useVerdictFlow hook
**File**: `frontend/src/hooks/useVerdictFlow.ts`
**Action**: CREATE
**Purpose**: Manage verdict flow state with useReducer
**Pattern**: Follow useWitnessInterrogation.ts pattern
**Depends on**: None
**Acceptance criteria**:
- useReducer state: currentVerdict, feedback, confrontation, loading, error
- Actions: SUBMIT_VERDICT, RECEIVE_FEEDBACK, RECEIVE_CONFRONTATION, RESET, SET_ERROR
- `submitVerdict()` function calls API, dispatches actions
- `resetVerdict()` clears state for retry
- Loading/error state management
- 10+ hook tests (state transitions, API calls, error handling)

### Task 13: Update API client
**File**: `frontend/src/api/client.ts`
**Action**: MODIFY
**Purpose**: Add submitVerdict() API function
**Pattern**: Follow interrogateWitness() pattern
**Depends on**: Task 7 (/api/submit-verdict endpoint)
**Acceptance criteria**:
- `submitVerdict(submission: VerdictSubmission): Promise<VerdictResult>`
- POST to `/api/submit-verdict` with suspect_id, reasoning, evidence_ids
- Returns VerdictResult with feedback or confrontation
- Error handling (network errors, 4xx/5xx responses)
- TypeScript types match backend models
- 5+ unit tests (successful submission, error handling)

### Task 14: Update TypeScript types
**File**: `frontend/src/types/investigation.ts`
**Action**: MODIFY
**Purpose**: Add verdict-related TypeScript types
**Pattern**: Follow existing WitnessInfo, InterrogateRequest types
**Depends on**: None
**Acceptance criteria**:
- `VerdictSubmission` interface (suspect_id, reasoning, evidence_ids)
- `VerdictResult` interface (is_correct, culprit_id, mentor_feedback, confrontation, aftermath, attempts_remaining)
- `MentorFeedback` interface (analysis, fallacies, score, critique, praise)
- `FallacyItem` interface (type, explanation)
- `ConfrontationData` interface (dialogue, culprit_tone)
- `DialogueExchange` interface (speaker, text, options)
- TypeScript compiles without errors

### Task 15: Integrate verdict flow in App.tsx
**File**: `frontend/src/App.tsx`
**Action**: MODIFY
**Purpose**: Add VerdictSubmission button, integrate verdict flow
**Pattern**: Follow witness modal integration
**Depends on**: Tasks 9-12 (all frontend components)
**Acceptance criteria**:
- "Submit Verdict" button in UI (primary action, prominent)
- VerdictSubmission modal opens on click
- useVerdictFlow hook integrated
- MentorFeedback shows after incorrect verdict
- ConfrontationDialogue shows after correct verdict
- Verdict state persists (can retry after incorrect)
- Case completion tracking (mark case "Solved" after correct verdict)
- 10+ integration tests (verdict flow, modal interactions, state updates)

### Task 16: Add frontend tests
**File**: `frontend/src/components/__tests__/VerdictSubmission.test.tsx`, etc.
**Action**: CREATE
**Purpose**: Comprehensive test coverage for verdict UI
**Pattern**: Follow existing component test structure (Vitest, React Testing Library)
**Depends on**: Tasks 9-15 (all frontend code)
**Acceptance criteria**:
- 15+ tests for VerdictSubmission.tsx (rendering, validation, submission)
- 15+ tests for MentorFeedback.tsx (feedback display, score meter)
- 10+ tests for ConfrontationDialogue.tsx (dialogue rendering, aftermath)
- 10+ tests for useVerdictFlow.ts (state management, API calls)
- 5+ tests for client.ts (submitVerdict function)
- 10+ tests for App.tsx updates (verdict integration)
- All tests pass (bun test)
- No TypeScript errors

### Task 17: Integration testing
**File**: End-to-end flow validation
**Action**: MANUAL + AUTOMATED
**Purpose**: Validate complete verdict flow end-to-end
**Pattern**: Follow Phase 2.5 integration testing approach
**Depends on**: Tasks 1-16 (all code complete)
**Acceptance criteria**:
- User can investigate → collect evidence → interrogate witnesses → submit verdict
- Correct verdict: Confrontation plays → Aftermath shows → Case marked "Solved"
- Incorrect verdict: Feedback shows → Attempts decremented → Can retry
- After 10 failures: Correct answer shown → Confrontation still plays (educational)
- All 374 existing tests still pass (no regressions)
- 45+ new backend tests pass
- 40+ new frontend tests pass
- Manual testing: Complete Case 1 end-to-end (correct verdict, incorrect verdicts)

### Task 18: Validation gates
**File**: All test suites, linters, TypeScript
**Action**: RUN
**Purpose**: Ensure all quality gates pass
**Pattern**: Follow validation-gates agent checklist
**Depends on**: Task 17 (all code + tests complete)
**Acceptance criteria**:
- Backend: pytest (all pass, coverage >=80%)
- Frontend: Vitest (all pass)
- Backend linting: ruff check (no errors)
- Backend types: mypy (no errors)
- Frontend linting: ESLint (no errors)
- Frontend types: TypeScript compile (no errors)
- Build: Frontend build succeeds (bun run build)
- Total tests: ~460 (374 existing + 85 new)

---

## Integration Points

### State Management
- **Where**: `frontend/src/hooks/useVerdictFlow.ts` + `backend/src/state/player_state.py`
- **What**: Verdict state tracks attempts, submission history
- **Pattern**: useReducer (frontend), Pydantic model (backend)

### Component Integration
- **Where**: `frontend/src/App.tsx`
- **What**: VerdictSubmission button → modal → feedback → confrontation flow
- **Pattern**: Follow witness modal integration (see App.tsx lines 66-83)

### API Flow
- **Where**: `frontend/src/api/client.ts` → `backend/src/api/routes.py`
- **What**: POST /api/submit-verdict → evaluator → mentor feedback or confrontation
- **Pattern**: Follow /api/interrogate endpoint pattern

### YAML Data Flow
- **Where**: `backend/src/case_store/case_001.yaml` → `loader.py` → `routes.py`
- **What**: Solution, wrong_suspects, post_verdict data loaded on verdict submission
- **Pattern**: Follow witness loading pattern (get_witness, list_witnesses)

---

## Known Gotchas

### Backend Gotchas

**Issue**: Template substitution for {suspect}, {attempts_remaining}
**Solution**: Use Python f-strings or .format(), ensure all template variables defined

**Issue**: Fallacy detection false positives (flagging correct reasoning as fallacy)
**Solution**: Conservative thresholds (e.g., <50% key evidence = confirmation bias, not <70%)

**Issue**: YAML multi-line strings for dialogue
**Solution**: Use `|` for literal block scalar (preserves newlines), not `>` (folds lines)

**Issue**: VerdictResult optional fields (confrontation only if correct)
**Solution**: Use Optional[ConfrontationData] in Pydantic model, null checks in frontend

### Frontend Gotchs

**Issue**: Reasoning textarea validation (2-3 sentences minimum)
**Solution**: Split by `.` or `!` or `?`, count sentences, show error if <2

**Issue**: Score meter color transitions (0-100)
**Solution**: Use Tailwind conditional classes: `score < 40 ? 'text-red-500' : score < 70 ? 'text-yellow-500' : 'text-green-500'`

**Issue**: Dialogue bubbles for confrontation (speaker styling)
**Solution**: Map speaker → style: `moody` (amber), `culprit` (red), `player` (blue)

**Issue**: Attempts remaining display after max attempts
**Solution**: Special case: if attempts_remaining === 0, show "Max attempts reached. Showing correct answer."

---

## Validation Loop

### Level 1: Syntax & Style
```bash
# Backend
cd backend
source venv_linux/bin/activate
ruff check .           # Linting
mypy src/              # Type checking
pytest                 # All tests
# Expected: 0 errors, 237+ tests passing (192 existing + 45 new)

# Frontend
cd frontend
bun test               # All tests
bun run typecheck      # TypeScript
bun run build          # Production build
# Expected: 0 errors, 222+ tests passing (182 existing + 40 new)
```

### Level 2: Unit Tests
- **Backend**: 45+ new tests
  - verdict/evaluator.py: 20 tests (check_verdict, score_reasoning, edge cases)
  - verdict/fallacies.py: 15 tests (each fallacy type, false positives)
  - context/mentor.py: 10 tests (template substitution, feedback generation)
- **Frontend**: 40+ new tests
  - VerdictSubmission.tsx: 15 tests (rendering, validation, submission)
  - MentorFeedback.tsx: 15 tests (feedback display, score meter)
  - ConfrontationDialogue.tsx: 10 tests (dialogue rendering, aftermath)
- **Coverage target**: 80%+

### Level 3: Integration/Manual
```bash
# Start backend + frontend
cd backend && source venv_linux/bin/activate && python -m src.main &
cd frontend && bun run dev &

# Manual verification steps:
# 1. Navigate to http://localhost:5173
# 2. Investigate location, collect evidence (hidden_note, wand_signature, frost_pattern)
# 3. Interrogate Hermione, Draco (reveal secrets)
# 4. Click "Submit Verdict"
# 5. Select wrong suspect (e.g., Hermione) → Enter reasoning → Submit
# 6. Verify: MentorFeedback shows analysis, fallacies, score, attempts remaining
# 7. Click "Try Again" → Select correct suspect (Draco) → Submit
# 8. Verify: ConfrontationDialogue shows 3-4 exchanges → Aftermath text → Case marked "Solved"
# 9. Test edge case: Submit 10 incorrect verdicts → Verify correct answer shown + confrontation
```

---

## Dependencies

**No new external dependencies**:
- All backend logic uses existing libraries (FastAPI, Pydantic, PyYAML)
- All frontend logic uses existing libraries (React, TypeScript)
- Template-based feedback (no LLM API calls for mentor in Phase 3)

**Internal dependencies**:
- Phase 2.5 complete (✅) - Witness system, terminal UX, evidence modal
- case_001.yaml updates (Task 1) - All other tasks depend on solution data

---

## Out of Scope

**Defer to later phases**:
- Tom's inner voice during verdict (Phase 4)
- Dynamic LLM-based mentor feedback (Phase 7 - replace templates)
- Intro briefing system (Phase 3.5 - before investigation)
- Magic spell system integration (Phase 4.5)
- Bayesian probability tracker (Phase 5.5 - optional)
- Multiple case support (Phase 6+ - Cases 2-10)

**Not included in Phase 3**:
- Player character customization (name, house)
- Case selection menu (only Case 1 playable)
- Leaderboard or scoring across cases
- Save/load multiple case states
- Audio/visual effects for confrontation

---

## Agent Orchestration Plan

### Execution Strategy

**Sequential Track** (backend → frontend):
1. **fastapi-specialist** → Tasks 1-8 (backend verdict system)
   - YAML updates, evaluator, fallacies, mentor, loader, state, routes, tests
   - Output: 237+ backend tests passing, /api/submit-verdict endpoint functional
2. **react-vite-specialist** → Tasks 9-16 (frontend verdict UI)
   - VerdictSubmission, MentorFeedback, ConfrontationDialogue components
   - useVerdictFlow hook, API client, types, App.tsx integration, tests
   - Output: 222+ frontend tests passing, verdict flow playable
3. **validation-gates** → Tasks 17-18 (integration testing, quality gates)
   - End-to-end flow validation, all tests pass

**Why sequential?**: Frontend verdict UI depends on backend /api/submit-verdict endpoint (can mock initially but final integration needs real API)

### Agent-Specific Guidance

#### For fastapi-specialist
- **Input**: Tasks 1-8 (backend verdict system)
- **Pattern**: Follow witness backend structure (context/witness.py, utils/trust.py)
- **Output**: 45+ new tests passing, /api/submit-verdict endpoint functional
- **Critical**:
  - Task 1 FIRST (YAML updates) - all other tasks depend on solution data
  - Use templates for mentor feedback (NOT LLM) - Phase 3 keeps it simple
  - Conservative fallacy detection thresholds (avoid false positives)
  - VerdictResult model with Optional[ConfrontationData] (only if correct)

#### For react-vite-specialist
- **Input**: Tasks 9-16 (frontend verdict UI)
- **Dependencies**: Wait for fastapi-specialist Task 7 (routes.py with /api/submit-verdict) OR use mock data
- **Pattern**: Follow WitnessInterview.tsx (dialogue bubbles), useWitnessInterrogation.ts (useReducer)
- **Output**: 40+ new tests passing, verdict flow integrated in App.tsx
- **Critical**:
  - Task 9 VerdictSubmission: Validate reasoning (2-3 sentences minimum)
  - Task 10 MentorFeedback: Score meter color-coded (red <40, yellow 40-70, green >70)
  - Task 11 ConfrontationDialogue: Speaker styling (Moody amber, culprit red, player blue)
  - Task 12 useVerdictFlow: useReducer (NOT useState - too complex)
  - Task 15 App.tsx: "Submit Verdict" button prominent (primary action)

#### For validation-gates
- **Input**: All tasks complete (1-16)
- **Scenarios**: End-to-end verdict flow
  - Correct verdict → Confrontation → Aftermath → Case solved
  - Incorrect verdict → Feedback → Retry → Correct → Confrontation
  - 10 incorrect verdicts → Correct answer shown → Confrontation (educational)
- **Success**: All 460+ tests pass (374 existing + 85 new), TypeScript compiles, no regressions

### Handoff Context

**Next agent receives**:
- This PRP (full context)
- Quick Reference (no doc reading needed)
- Specific task numbers to implement
- Pattern files to follow (narrator.py, witness.py, WitnessInterview.tsx)

**Next agent does NOT need**:
- ❌ Read original INITIAL.md
- ❌ Search for examples (Quick Reference provided)
- ❌ Read full design docs (CASE_001_TECHNICAL_SPEC.md already extracted)
- ❌ Research fallacy detection (rule-based logic provided)

---

## Anti-Patterns to Avoid

- ❌ LLM-based mentor feedback in Phase 3 (use templates - Phase 7 can add LLM)
- ❌ Complex fallacy detection with ML (use simple rule-based - Phase 7 can enhance)
- ❌ Game over on incorrect verdict (show feedback, allow retry - educational focus)
- ❌ Missing aftermath text (always show consequences, even after 10 failed attempts)
- ❌ Breaking existing features (validate 374 existing tests still pass)
- ❌ Tom's inner voice during verdict (defer to Phase 4 - keep Phase 3 focused)
- ❌ Dynamic confrontation dialogue with LLM (use static YAML - Phase 7 can add dynamic)
- ❌ Skipping reasoning requirement (force player to articulate - educational value)
- ❌ Authority bias in fallacy detection (don't assume professor = innocent automatically)

---

**Generated**: 2026-01-06
**Source**: INITIAL.md (Phase 3)
**Research**: CASE_001_TECHNICAL_SPEC.md, AUROR_ACADEMY_GAME_DESIGN.md, CASE_DESIGN_GUIDE.md
**Confidence Score**: 8/10 (likelihood of one-pass implementation success)

**Reasons for confidence**:
- ✅ Clear patterns from existing code (narrator.py, witness.py, WitnessInterview.tsx)
- ✅ Template-based approach simpler than LLM (faster, more predictable)
- ✅ YAML structure well-defined (CASE_001_TECHNICAL_SPEC.md comprehensive)
- ✅ useReducer pattern proven (useWitnessInterrogation.ts works well)
- ⚠️ Fallacy detection edge cases (may need tuning after testing)
- ⚠️ Reasoning validation (sentence counting may be imprecise)

**Risks**:
- Fallacy detection false positives (solution: conservative thresholds, iterative tuning)
- Score meter UX clarity (solution: color-coding + explicit labels)
- Dialogue bubble overflow on small screens (solution: max-height + scrolling)
