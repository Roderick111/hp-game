# Auror Academy - Project Planning (REBUILD)

*This document must be kept up-to-date, accurate, and very concise.*

## Project Overview

**Auror Academy** - LLM-powered detective visual novel teaching rationality through freeform investigation. Players solve magical crimes as Auror trainees under Mad-Eye Moody's brutal mentorship. DnD-style exploration via Claude Haiku narrator, with emphasis on Bayesian reasoning and logical fallacy identification.

**Target**: Adults seeking cerebral detective gameplay with rationality training

---

## Architecture

### Tech Stack

- **Backend**: Python + Claude Haiku API (narrator, witness, mentor LLMs)
- **Frontend**: React 18 + Vite (terminal UI aesthetic)
- **Styling**: Tailwind CSS + PostCSS
- **State Management**: React Context + useReducer (frontend) + Python state persistence (backend)
- **LLM Integration**: Claude Haiku (3 isolated contexts: narrator, witness, mentor)
- **Testing**: Vitest (frontend) + pytest (backend)
- **Package Manager**: Bun (frontend), uv (Python backend)

### Architecture Overview

```
┌─────────────────────────────────────────┐
│          FRONTEND (React/Vite)          │
│      Terminal UI + Freeform Input      │
└──────────────┬──────────────────────────┘
               │ WebSocket/REST API
               ▼
┌─────────────────────────────────────────┐
│         PYTHON BACKEND (Hono)           │
├─────────────────────────────────────────┤
│  Case Store   Player State   Prompts   │
│         Context Assembler               │
└──────────────┬──────────────────────────┘
               │ Claude API
               ▼
┌─────────────────────────────────────────┐
│          CLAUDE HAIKU (LLM)             │
│  Narrator | Witness | Mentor (isolated)│
└─────────────────────────────────────────┘
```

### Directory Structure (Target)

```
hp_game/
├── backend/
│   ├── src/
│   │   ├── case_store/         # YAML case files
│   │   │   ├── case_001.yaml
│   │   │   └── templates/
│   │   ├── context/            # LLM context builders
│   │   │   ├── narrator.py
│   │   │   ├── witness.py
│   │   │   └── mentor.py
│   │   ├── api/
│   │   │   ├── routes.py       # Hono routes
│   │   │   └── claude_client.py
│   │   ├── state/
│   │   │   ├── player_state.py
│   │   │   └── persistence.py
│   │   └── main.py
│   ├── tests/
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LocationView.tsx
│   │   │   ├── WitnessInterview.tsx
│   │   │   ├── EvidenceBoard.tsx
│   │   │   └── VerdictSubmission.tsx
│   │   ├── hooks/
│   │   │   └── useInvestigation.ts
│   │   ├── api/
│   │   │   └── client.ts
│   │   └── App.tsx
│   └── package.json
├── cases/                      # Case design YAML
├── docs/
│   ├── AUROR_ACADEMY_GAME_DESIGN.md
│   ├── CASE_DESIGN_GUIDE.md
│   └── WORLD_AND_NARRATIVE.md
├── PLANNING.md                 # This file
└── STATUS.md
```

---

## Design Decisions

### LLM-First Architecture

**Choice**: Claude Haiku as game narrator (not pre-scripted)

**Rationale**:
- **DnD-style freeform**: Player types any action, LLM responds
- **No pixel hunting**: If it makes sense, LLM allows it
- **Witness characters**: Each witness played by LLM with personality/secrets
- **Context isolation**: Narrator, witness, mentor have separate contexts (no leaking)

### Python Backend + React Frontend

**Choice**: Python backend (Hono), React frontend (Vite)

**Rationale**:
- **Python**: Claude API integration, YAML case loading, state management
- **React**: Clean terminal UI, fast iteration, component reuse
- **Separation**: Backend = game logic/LLM. Frontend = display only.

### Case Structure (YAML-based)

**Choice**: YAML case files with modular structure

**Rationale**:
- **Portable**: Case design separate from code
- **Iterable**: Non-technical designers can write cases
- **Version control**: Easy to review case changes
- **Templates**: Standardized victim/suspect/evidence/solution modules

### No Phase System

**Previous (OLD)**: 6 phases (Briefing → Hypothesis → Investigation → Prediction → Resolution → Review)

**New Design**: **Free investigation → Verdict submission** (no phases)

**Rationale**:
- DnD-style exploration requires freedom
- Player decides when "ready" to submit verdict (Obra Dinn model)
- No artificial gates or phases

---

## Key Milestones (REBUILD)

### Phase 1: Core Loop (Backend Foundation) ✅ COMPLETE
**Goal**: Basic narrator LLM integration + location navigation
**Completed**: 2026-01-05

**Tasks**:
- ✅ Python backend setup (FastAPI, Claude Haiku client)
- ✅ Case store YAML structure (case_001.yaml)
- ✅ Narrator LLM integration (location descriptions, evidence discovery)
- ✅ Player state tracking (location, discovered evidence)
- ✅ Save/load state (JSON persistence)
- ✅ React LocationView + EvidenceBoard components
- ✅ Terminal UI aesthetic (monospace, dark theme)

**Deliverable**: Player can explore location via freeform input, discover evidence

**Quality Gates**: ✅ All passing
- Backend: 93 pytest tests (0.50s)
- Frontend: 96 Vitest tests (2.29s)
- Bundle: 158KB JS, 22KB CSS (optimized)

---

### Phase 2: Narrative Polish + Witness System ✅ COMPLETE
**Goal**: Fix UI narrative flow + add witness interrogation
**Status**: COMPLETE (2026-01-05)

**Quick Win Tasks** (1-2 days): ✅
- ✅ Fixed LocationView: Removed "You can see:" explicit list (lines 164-178)
- ✅ Integrated surface_elements into narrator LLM description organically
- ✅ Updated narrator prompt: includes surface_elements in scene setting

**Witness System Tasks** (3-4 days): ✅
- ✅ Witness YAML structure (personality, knowledge, secrets, lies)
- ✅ Witness LLM context builder (separate from narrator)
- ✅ WitnessInterview component (freeform questioning)
- ✅ Evidence presentation mechanics (trigger secret revelations)
- ✅ Witness state tracking (conversation history, trust level)
- ✅ Trust mechanics (LA Noire-inspired: aggressive -10, empathetic +5)
- ✅ Secret trigger parsing (complex conditions: evidence:X OR trust>70)
- ✅ WitnessSelector component
- ✅ useWitnessInterrogation hook (useReducer state management)

**Deliverable**: ✅
- ✅ Narrative flows naturally without explicit lists
- ✅ Player can interrogate witnesses, reveal secrets via evidence
- ✅ Trust system affects witness honesty
- ✅ Context isolation (narrator doesn't know witness secrets)

**Quality Gates**: ✅ All passing
- Backend: 173 tests (94% coverage)
- Frontend: 164 tests
- Total: 337 tests

---

### Phase 2.5: Terminal UX + Witness Integration ✅ COMPLETE
**Goal**: Polish investigation UX + make witness interrogation playable
**Status**: COMPLETE (2026-01-06) - User tested and confirmed working ✅

**Implementation Summary**:
- Backend: 192 tests passing (0 errors)
- Frontend: 182 tests passing (0 errors)
- Total: 374 tests
- Quality Gates: All passing (pytest, Vitest, TypeScript)

**Features Delivered**:
- ✅ Terminal UX: Removed "Investigate" button, Ctrl+Enter only
- ✅ Quick action shortcuts (examine desk, check window, talk to hermione)
- ✅ Evidence cards clickable with modal (name, location, description)
- ✅ WitnessSelector + WitnessInterview integrated in App.tsx
- ✅ YAML updates: witnesses_present, evidence metadata
- ✅ Terminal aesthetic: `> describe your action...` placeholder
- ✅ Dark theme cohesion (terminal variant modals)

**Files Created**:
- `frontend/src/components/EvidenceModal.tsx`
- `frontend/src/components/__tests__/EvidenceModal.test.tsx`

**Files Modified**:
- Backend: `case_001.yaml`, `loader.py`, `routes.py`
- Frontend: `LocationView.tsx`, `EvidenceBoard.tsx`, `Modal.tsx`, `App.tsx`, `client.ts`, `investigation.ts`

**Agent Timeline**:
1. fastapi-specialist ✅ - YAML updates, evidence endpoints (192 backend tests)
2. react-vite-specialist ✅ - Terminal UX, EvidenceModal, App integration (182 frontend tests)
3. validation-gates ✅ - Full quality check passed
4. User testing ✅ - Confirmed working

**Effort**: 2 days (as estimated)

---

### Phase 3: Verdict System + Post-Verdict Confrontation ✅ COMPLETE
**Goal**: Complete core game loop with verdict evaluation and confrontation
**Status**: COMPLETE (2026-01-06)
**Effort**: 7-8 days (actual: 7 days)
**User Testing**: Confirmed working ✅

**Backend Tasks** (4-5 days):
1. Update case_001.yaml - Add solution, wrong_suspects, post_verdict modules (1 day)
2. Create verdict evaluation logic - check_verdict(), score_reasoning(), detect_fallacies() (1 day)
3. Create mentor feedback generator - build_mentor_prompt(), template-based responses (1 day)
4. Add POST /api/submit-verdict endpoint - Handles verdict submission, returns feedback (0.5 day)
5. Add confrontation loader - load_confrontation_dialogue() (0.5 day)
6. Add tests - verdict logic (20 tests), fallacy detection (15 tests), API endpoint (10 tests) (1 day)

**Frontend Tasks** (3-4 days):
7. Create VerdictSubmission component - Suspect selector, reasoning textarea, evidence checklist (1 day)
8. Create MentorFeedback component - Analysis display, fallacy list, score meter (1 day)
9. Create ConfrontationDialogue component - Dialogue bubbles, aftermath text (1 day)
10. Integrate into App.tsx - Verdict flow, modal/route decision (0.5 day)
11. Add API client - submitVerdict() function (0.5 day)
12. Add tests - component tests (30 tests), integration (10 tests) (1 day)

**Testing** (1 day):
13. Integration testing - Full verdict flow validation (0.5 day)
14. Validation gates - All tests pass, TypeScript compiles (0.5 day)

**Deliverable**: Player can submit verdict → mentor feedback → confrontation → case closure

**Key Features**:
- Template-based mentor feedback (simple, fast - Phase 7 can add LLM)
- Fallacy detection (confirmation bias, correlation≠causation, authority bias, post-hoc)
- Attempt tracking (10 max, feedback adapts: 1-3 harsh, 4-7 hints, 8-10 direct)
- Post-verdict confrontation (3-4 dialogue exchanges, culprit tone: defiant/remorseful/broken/angry/resigned)
- Aftermath text (sentencing, consequences)
- Educational focus (show correct answer after 10 attempts, not game over)

**Decision Points Resolved**:
1. Mentor Feedback: Template-based ✅ (faster, predictable)
2. Wrong Verdict: Show answer after 10 attempts ✅ (educational)
3. Confrontation: Static YAML ✅ (Phase 7 dynamic)
4. Reasoning Required: Yes ✅ (educational value)
5. Tom's Role: Defer to Phase 4 ✅ (keep focused)

**Success Criteria** (ALL MET ✅):
- [x] Player can submit verdict (suspect + reasoning + evidence)
- [x] System evaluates correctness (compare to solution.culprit)
- [x] Mentor provides feedback (analysis, fallacies, score 0-100)
- [x] If correct: Confrontation plays (3-4 exchanges) → Aftermath → Case solved
- [~] If incorrect: Feedback shown → Attempts decremented → Can retry (WORKS but user noted retry issue)
- [x] After 10 failures: Correct answer + confrontation (educational)
- [x] All backend tests pass (317/318, 1 pre-existing failure)
- [x] All frontend tests pass (287/287)
- [x] User can complete Case 1 end-to-end (CONFIRMED by user testing)

**Files Created**:
- Backend: `src/verdict/evaluator.py`, `src/verdict/fallacies.py`, `src/context/mentor.py`
- Frontend: `components/VerdictSubmission.tsx`, `components/MentorFeedback.tsx`, `components/ConfrontationDialogue.tsx`, `hooks/useVerdictFlow.ts`

**Files Modified**:
- Backend: `case_001.yaml`, `loader.py`, `player_state.py`, `routes.py`
- Frontend: `App.tsx`, `client.ts`, `investigation.ts`

**New Mechanics**:
- Post-verdict confrontation (AUROR_ACADEMY_GAME_DESIGN.md lines 413-439, CASE_DESIGN_GUIDE.md lines 507-567)
- Template-based mentor feedback (lines 450-502)
- Fallacy detection system (educational rationality teaching)

---

### Phase 3.1: State Management Fixes + Natural LLM Feedback ✅ COMPLETE
**Goal**: Fix critical UX bugs + replace mechanical feedback with natural LLM prose
**Status**: COMPLETE (2026-01-07)
**Effort**: 2 days (as estimated)
**User Testing**: Confirmed working ✅

**Issues Resolved**:
- ✅ **CRITICAL BUG**: Removed `case_solved` validation check (allows educational retries)
- ✅ **Restart functionality**: Added `/api/case/{case_id}/reset` endpoint + "Restart Case" button
- ✅ **Natural LLM feedback**: Replaced all structured template sections with Claude Haiku natural prose
- ✅ **No culprit revelation**: LLM provides hints WITHOUT revealing answer (educational gameplay)
- ✅ **Concise output**: 3-4 sentences with paragraph breaks (down from verbose templates)

**Tasks Completed**:
1. ✅ Removed `case_solved` validation check in routes.py (allows verdict retries)
2. ✅ Added `POST /api/case/{case_id}/reset` endpoint (exposes delete_state())
3. ✅ Replaced template feedback with LLM prompts - build_moody_roast_prompt(), build_moody_praise_prompt()
4. ✅ Template fallback on LLM error (async try/except, _build_template_feedback)
5. ✅ Frontend "Restart Case" button + ConfirmDialog (destructive mode, keyboard nav)
6. ✅ Loading spinner for LLM feedback (~2-3s async call)
7. ✅ Fixed critical bug: Frontend was displaying YAML template (wrongSuspectResponse) instead of LLM text (feedback.analysis)
8. ✅ Removed all structured sections (What You Did Well, Areas to Improve, Logical Fallacies, Hint boxes)
9. ✅ Tests: 29 new tests (8 backend, 21 frontend), all 643 passing

**Deliverable**: Verdict retries work + restart button + natural Moody feedback

**Success Criteria** (ALL MET ✅):
- [x] User can submit multiple verdicts after case_solved (check removed)
- [x] "Restart Case" button clears all state (delete_state exposed)
- [x] LLM feedback feels natural (Moody's gruff voice, 3-4 sentences)
- [x] NO culprit revelation in incorrect verdicts (hints only)
- [x] NO structured sections (pure natural prose)
- [x] Paragraph breaks for readability (double newlines in prompt)
- [x] Template fallback works (no crashes on LLM timeout)
- [x] Loading states prevent confusion (~2-3s LLM call)
- [x] All tests pass (348 backend + 295 frontend = 643 total)

**Files Created**:
- Frontend: `components/ConfirmDialog.tsx`, `components/__tests__/ConfirmDialog.test.tsx`

**Files Modified**:
- Backend:
  - `routes.py` (removed case_solved check, added /reset endpoint, emptied template fields)
  - `mentor.py` (rewrote LLM prompts, removed culprit revelation, 3-4 sentences)
  - `models.py` (ResetResponse)
  - `tests/test_routes.py`, `tests/test_mentor.py`
- Frontend:
  - `App.tsx` (restart button + ConfirmDialog integration)
  - `Button.tsx` (forwardRef for focus management)
  - `MentorFeedback.tsx` (loading states, switched wrongSuspectResponse → feedback.analysis)
  - `client.ts` (resetCase function)
  - `components/__tests__/MentorFeedback.test.tsx`

**Agent Timeline**:
1. fastapi-specialist ✅ - Tasks 1-7: Backend fixes, LLM prompts, tests (348 tests)
2. react-vite-specialist ✅ - Tasks 8-13: Frontend restart button, loading states, tests (306 tests)
3. validation-gates ✅ - Full test suite passed
4. fastapi-specialist ✅ - Natural feedback refinement (no culprit reveal, concise output)
5. react-vite-specialist ✅ - Frontend display fix (wrongSuspectResponse bug)
6. User testing ✅ - Confirmed working, requested conciseness + paragraph breaks
7. Final refinement ✅ - 3-4 sentences, paragraph breaks, all tests passing

**Documentation**:
- Investigation report: `docs/PHASE_3.1_INVESTIGATION_REPORT.md`
- PRP: `PRPs/phase3.1-prp.md`
- CHANGELOG: Version 0.4.1 entry
- STATUS.md: Comprehensive completion documentation

**Example LLM Output** (After refinement):
```
WRONG. Good catch on the wand signature, BUT you've got **confirmation bias** -
you saw one clue and stopped looking.

Check the frost pattern direction. It shows WHERE the spell came from,
not just who could cast it.
```

---

### Phase 3.5: Intro Briefing System ✅ COMPLETE
**Goal**: Interactive Moody briefing combining case intro + rationality teaching + LLM Q&A
**Status**: COMPLETE (2026-01-07)
**Effort**: 2 days (actual)

**Implementation Summary**:
- Backend: 385 tests (39 new), 3 endpoints, LLM-powered Q&A
- Frontend: 405 tests (110 new), 3-phase UI, conversation display
- Total: 790 tests (149 new briefing tests)
- Quality Gates: All passing (pytest, Vitest, lint, type check)

**Features Delivered**:
- ✅ **Case Assignment**: WHO/WHERE/WHEN/WHAT format introducing case details
- ✅ **Teaching Moment**: Moody teaches rationality concept (Case 1: Base rates)
- ✅ **Interactive Q&A**: Player asks questions, Moody responds (Claude Haiku LLM)
- ✅ **Conversation History**: Q&A pairs displayed with "You:" and "Moody:" prefixes
- ✅ **Transition**: "CONSTANT VIGILANCE" → Start Investigation button
- ✅ **Dark Terminal Theme**: bg-gray-900, amber accents, font-mono (consistent with MentorFeedback)
- ✅ **LLM Integration**: Claude Haiku Q&A with template fallback on error
- ✅ **State Persistence**: BriefingState tracks completion, conversation history

**Files Created**:
- Backend: `briefing.py`, `test_briefing.py` (39 tests)
- Frontend: `BriefingModal.tsx`, `BriefingConversation.tsx`, `useBriefing.ts` + 3 test files (110 tests)

**Files Modified**:
- Backend: `player_state.py` (BriefingState model), `case_001.yaml` (briefing section), `routes.py` (3 endpoints)
- Frontend: `investigation.ts` (types), `client.ts` (API functions), `App.tsx` (integration)

**Agent Execution Timeline**:
1. **planner** ✅ - PRP verification + feasibility analysis
2. **fastapi-specialist** ✅ - Tasks 1-4, 11: Backend implementation (39 tests passing)
3. **react-vite-specialist** ✅ - Tasks 5-10, 12: Frontend implementation (110 tests passing)
4. **validation-gates** ✅ - Full integration testing (149 briefing tests, 790 total)

**Key Patterns Used**:
- UI: MentorFeedback.tsx pattern (dark terminal, natural prose display)
- State: PlayerState extension (BriefingState with conversation_history)
- LLM: mentor.py pattern (async LLM call with template fallback)
- API: Verdict system pattern (GET content, POST action, state persistence)

**Confidence**: 9/10 (proven patterns, successful implementation)

---

### Phase 3.6: Dialogue Briefing UI Polish ✅ COMPLETE
**Goal**: Fix Phase 3.5 UI from separated boxes to flowing dialogue interface
**Status**: COMPLETE (2026-01-07)
**Effort**: 0.5 day (actual)

**User Feedback**: Phase 3.5 briefing has artificial box separation, needs single dialogue flow

**Implementation**:
- Removed 3 boxed sections (Case Assignment, Teaching Moment, Transition)
- Created BriefingMessage component (speaker + text display)
- Added multiple-choice teaching question (4 button options)
- Rewrote BriefingModal as vertical message feed
- Updated YAML with teaching_question.choices[]
- Moved text input to bottom
- Updated 59 tests for new UI

**Deliverable**: ✅ Briefing flows as natural conversation (chat-like) with interactive teaching question

**Files Created**:
- `frontend/src/components/BriefingMessage.tsx` (message bubble component)

**Files Modified**:
- `frontend/src/components/BriefingModal.tsx` (major rewrite)
- `backend/src/case_store/case_001.yaml` (teaching_question.choices[])
- `frontend/src/types/investigation.ts` (TeachingChoice, TeachingQuestion types)
- `frontend/src/hooks/useBriefing.ts` (selectChoice function)
- `frontend/src/App.tsx` (props update)

**Tests**: 417 frontend, 385 backend (802 total)

---

### Phase 3.7: Briefing UI Polish (Transition + Scrollbar)
**Goal**: Fix 2 UI issues - transition timing + double scrollbar
**Status**: PLANNED (2026-01-07)
**Effort**: 0.5 day

**Issues**:
1. Transition message appears too early (immediately after teaching question)
2. Double scrollbar visible (outer Modal + inner BriefingModal)

**Solution**:
1. Show transition ONLY after player asks ≥1 follow-up question (`conversation.length > 0`)
2. Modal uses `overflow-hidden`, BriefingModal inner div has `overflow-y-auto` (single scrollbar)

**Tasks**:
- Fix Modal.tsx overflow (remove outer scroll)
- Conditional transition render in BriefingModal.tsx
- Update BriefingModal tests (3 new tests)
- Manual verification

**Deliverable**: Transition appears when player ready, single scrollbar only

**Files Modified**:
- `frontend/src/components/ui/Modal.tsx` (overflow fix)
- `frontend/src/components/BriefingModal.tsx` (conditional transition)
- `frontend/src/components/__tests__/BriefingModal.test.tsx` (test updates)

---

### Phase 4: Tom's Inner Voice (Enhanced)
**Goal**: 50% helpful / 50% misleading character voice
**Status**: PLANNED (Enhanced from original plan)
**Effort**: 3-4 days

**Tasks**:
- Trigger system (tier-based: evidence count thresholds)
- **NEW**: Tom's character depth (failed Auror ghost backstory)
- Voice content authoring (50% Socratic helpful, 50% plausible misleading)
- Tier selection logic (highest tier first, random within tier)
- **NEW**: Rare triggers (5-10%): self-aware moments, dark humor, emotional regret
- Mark triggers as "fired" (no repeats)
- InnerVoice component (toast/modal display)

**Deliverable**: Tom's ghost appears during investigation with questions/observations (indistinguishable helpful vs misleading)

**New Mechanics from Design Docs**:
- Tom's Ghost character (AUROR_ACADEMY_GAME_DESIGN.md lines 670-873, CASE_DESIGN_GUIDE.md lines 571-777)
- 50/50 helpful/misleading split (both sound equally reasonable)
- Rare emotional moments (Marcus Bellweather regret)

---

### Phase 4.5: Magic System (NEW)
**Goal**: 6 investigation spells with risk/reward
**Status**: PLANNED
**Effort**: 2-3 days

**Tasks**:
- Spell trigger system in YAML (`spell_contexts` per location)
- 6 core spells: Revelio, Homenum Revelio, Specialis Revelio, Lumos, Prior Incantato, Reparo
- Restricted spell: Legilimency (Cases 4+, requires authorization)
- Risk mechanics: illegal use consequences (warrant violations, Occlumency backlash)
- Creative spell use rewards (Aguamenti reveals blood patterns)
- Auror's Handbook component (menu reference, 6 spells)
- Progression gating (Cases 1-3 basic, 4+ restricted available)

**Deliverable**: Player can use 6 investigation spells; illegal use has consequences

**New Mechanics from Design Docs**:
- Magic System (AUROR_ACADEMY_GAME_DESIGN.md lines 960-1024, CASE_DESIGN_GUIDE.md lines 780-1024)
- Risk/reward examples (lines 854-925)
- Progression-based access (lines 927-942)

---

### Phase 5: Narrative Polish (Enhanced)
**Goal**: Three-act pacing + victim humanization + complication evidence
**Status**: PLANNED (Enhanced from original plan)
**Effort**: 2-3 days

**Tasks**:
- Player character intro screen (Moody training framework, name input)
- **NEW**: Three-act case structure guidelines (Setup → Investigation → Resolution)
- Victim humanization in crime scene descriptions (2-3 sentences woven into prose)
- Complication evidence system (contradicts "obvious" theory, appears after 4-6 evidence)
- Case authoring templates with narrative beats
- **NEW**: Hook + Twist design patterns (Act 1 hook, Act 2/3 twist)

**Deliverable**: Cases feel like narrative arcs with emotional beats, not just puzzles

**New Mechanics from Design Docs**:
- Three-Act Case Structure (AUROR_ACADEMY_GAME_DESIGN.md lines 314-456)
- Player Character Intro (lines 38-63)
- Victim humanization examples (lines 353-364)
- Complication evidence timing (lines 384-398)

---

### Phase 5.5: Bayesian Probability Tracker (NEW, OPTIONAL)
**Goal**: Optional numerical tool teaching Bayesian reasoning
**Status**: PLANNED (Optional polish feature)
**Effort**: 3-4 days

**Tasks**:
- ProbabilityTracker component (split panel: evidence left, suspect rating right)
- Two-slider interface per suspect ("If guilty" + "If innocent")
- Real Bayesian calculation (`calculate_probability_bayesian()` in backend)
- `/api/probability/rate` and `/api/probability/view` endpoints
- Calculated probabilities view (bar charts showing suspect percentages)
- Teaching moments (Moody explains likelihood ratios, Tom comments on updates)
- Keyboard shortcuts (P to open, 1-9 slider, Tab switch, S save)
- Completely optional (accessible from menu, never forced)

**Deliverable**: Optional tool for players who want numerical tracking; teaches Bayesian reasoning hands-on

**New Mechanics from Design Docs**:
- Bayesian Probability Tracker (AUROR_ACADEMY_GAME_DESIGN.md lines 1028-1278)
- Real Bayesian math algorithm (lines 1162-1208)
- UI design (lines 1054-1158)
- Teaching moments (lines 1210-1240)

---

### Phase 6: Content (First Complete Case)
**Goal**: Complete Case 1 with all mechanics
**Status**: PLANNED
**Effort**: 3-4 days

**Tasks**:
- Case 1 design (murder - classic opening)
- YAML case file with all modules:
  - Victim (humanization, connection to player)
  - Locations (macro/micro granularity)
  - Suspects (wants/fears/moral_complexity)
  - Witnesses (personality, secrets, lies)
  - Evidence (physical, testimonial, magical, documentary + complication evidence)
  - Solution (timeline, critical evidence, correct reasoning, fallacies)
  - Post-verdict (confrontation, aftermath)
  - Briefing (rationality concepts)
  - Tom's triggers (helpful + misleading variants)
  - Magic spell contexts
- Balance testing (10 attempts feels fair)
- Playtesting (complete 3 runs, tune difficulty)

**Deliverable**: Case 1 playable start to finish with all systems integrated

---

### Phase 7: Meta-Narrative (Expansion - DEFER)
**Goal**: Cases 9-10 institutional corruption thread
**Status**: PLANNED (Expansion content)
**Effort**: 7-10 days

**Tasks** (future):
- Pattern recognition system (player notices odd details linking cases)
- Meta-case investigation (Case 10: investigate why cases selected for training)
- Institutional corruption reveal (Ministry official buried evidence)
- Branching world states (expose corruption vs maintain loyalty)
- Real field cases (11+)

**Deliverable**: Overarching narrative emerges from Cases 1-10; moral choice in Case 10

**New Mechanics from Design Docs**:
- Overarching Narrative Thread (AUROR_ACADEMY_GAME_DESIGN.md lines 66-111)

---

## Breaking Changes from Current Implementation

### What to Delete

**Entire current frontend** (React components):
- ❌ All phase components (Briefing, HypothesisFormation, Investigation, Prediction, Resolution, CaseReview)
- ❌ Hypothesis system (ConditionalHypothesis, tier unlocking)
- ❌ Contradiction detection UI (ContradictionPanel)
- ❌ Scoring system UI (MetricCard, CaseReview)
- ❌ Enhanced mechanics (unlocking.ts, contradictions.ts, scoring.ts, evidenceRelevance.ts)
- ❌ Game types (types/game.ts, types/enhanced.ts) - completely replace
- ❌ GameContext reducer - completely rewrite
- ❌ mission1.ts case data - completely replace with YAML

**What to keep** (minimal UI components):
- ✅ Card.tsx (reusable card component)
- ✅ Button.tsx (reusable button)
- ✅ Modal.tsx (for verdict submission)
- ✅ App.tsx (rewrite but keep structure)

### What to Build (New)

**Backend (Python)**:
- ✅ Case store (YAML loader)
- ✅ Claude Haiku client (3 context builders)
- ✅ Player state (location, evidence, witness states, attempts)
- ✅ Hono API routes (investigate, interrogate, submit-verdict)
- ✅ State persistence (JSON save/load)

**Frontend (React - terminal UI)**:
- ✅ LocationView component (location description + freeform input)
- ✅ WitnessInterview component (conversation UI)
- ✅ EvidenceBoard component (discovered evidence list)
- ✅ VerdictSubmission component (suspect + reasoning freeform)
- ✅ MentorFeedback component (Moody's response)
- ✅ InnerVoice component (Socratic question toasts)

**Case Structure (YAML)**:
- ✅ Victim module (humanization, status)
- ✅ Location module (description, hidden evidence, triggers, not_present)
- ✅ Suspect module (wants/fears/moral_complexity, interrogation, secrets, lies)
- ✅ Witness module (same as suspect)
- ✅ Evidence module (physical, testimonial, magical, documentary)
- ✅ Solution module (culprit, timeline, critical evidence, correct reasoning, fallacies)
- ✅ Post-verdict module (confrontation, aftermath)

---

## Technical Constraints

### LLM Integration

- **Model**: Claude Haiku (fast, cheap, good for narrator)
- **Context Isolation**: Narrator doesn't know witness secrets. Mentor doesn't know investigation details.
- **Prompt Engineering**: Strict rules to prevent hallucination (not_present items, hidden evidence triggers)
- **Rate Limiting**: Handle API limits gracefully

### State Persistence

- **Format**: JSON (simple, human-readable)
- **Saved Data**: Player state, case ID, timestamp
- **Save Frequency**: After every interaction
- **Save Location**: `saves/{case_id}_{player_id}.json`

### Performance

- **API Latency**: 1-3s per LLM call (acceptable for turn-based)
- **Bundle Size**: Frontend minimal (no heavy game logic)
- **Backend**: Python async for concurrent LLM calls if needed

---

## Implementation Roadmap

### Phase 1: Backend Foundation (Days 1-7)
**Goal**: Core loop playable (explore → discover → save)

**Tasks**:
- **Day 1-2**: Python backend setup (Hono, Claude client, YAML loader)
- **Day 3-4**: Narrator LLM integration (location descriptions, evidence discovery)
- **Day 5-6**: Player state + persistence (JSON save/load)
- **Day 7**: Frontend LocationView component (freeform input → backend → LLM response)

**Deliverable**: Player can explore location, discover evidence, save/load state

---

### Phase 2: Characters (Days 8-14)
**Goal**: Witness/suspect interrogation functional

**Tasks**:
- **Day 8-10**: Witness LLM context builder (personality, secrets, lies)
- **Day 11-12**: Interrogation system (freeform questions, evidence presentation)
- **Day 13-14**: Frontend WitnessInterview component

**Deliverable**: Player can interrogate witnesses, reveal secrets

---

### Phase 3: Verdict System (Days 15-21)
**Goal**: Mentor LLM + case closure

**Tasks**:
- **Day 15-17**: Mentor LLM integration (Moody personality, fallacy detection)
- **Day 18-19**: Verdict submission flow (suspect + reasoning)
- **Day 20-21**: Frontend VerdictSubmission + MentorFeedback components

**Deliverable**: Player can submit verdict, receive feedback, close case

---

### Phase 4: Polish & Case 1 (Days 22-30)
**Goal**: First playable case start to finish

**Tasks**:
- **Day 22-24**: Inner Voice system (tier triggers, Socratic questions)
- **Day 25-27**: Case 1 design (murder case, YAML file)
- **Day 28-30**: Playtesting, balance tuning, bug fixes

**Deliverable**: Case 1 complete, playable, fun

---

## Effort Estimates

| Milestone | Effort | Impact | Dependencies |
|-----------|--------|--------|--------------|
| P1: Core Loop | 7 days | CRITICAL | None |
| P2: Witness System | 7 days | CRITICAL | P1 |
| P2.5: Terminal UX + Integration | 1-2 days | HIGH | P2 |
| P3: Verdict + Post-Verdict | 7-8 days | CRITICAL | P2.5 |
| P3.1: State Fixes + LLM Feedback (NEW) | 2-3 days | CRITICAL | P3 |
| P3.5: Intro Briefing (NEW) | 2-3 days | HIGH | P3.1 |
| P3.6: Dialogue Briefing UI (NEW) | 0.5 day | MEDIUM | P3.5 |
| P3.7: Briefing Polish (Transition + Scrollbar) (NEW) | 0.5 day | LOW | P3.6 |
| P4: Tom's Inner Voice (Enhanced) | 3-4 days | HIGH | P2.5 |
| P4.5: Magic System (NEW) | 2-3 days | MEDIUM | P2.5 |
| P5: Narrative Polish (Enhanced) | 2-3 days | MEDIUM | None |
| P5.5: Bayesian Tracker (NEW, Optional) | 3-4 days | LOW | P2.5 |
| P6: First Complete Case | 3-4 days | CRITICAL | P3.1-P5 |
| P7: Meta-Narrative (DEFER) | 7-10 days | LOW | P6 |
| **Total (MVP without optional)** | **36-43 days** | **~6-7 weeks** |
| **Total (Full feature set)** | **39-47 days** | **~7-8 weeks** |

---

## Success Criteria

### Functional Requirements:
- [ ] Player can explore location via freeform input
- [ ] LLM narrator responds to any logical action
- [ ] Evidence discovery works (trigger keywords)
- [ ] Witness interrogation functional (LLM plays character)
- [ ] Secrets reveal when triggered (Legilimency, evidence, trust)
- [ ] Verdict submission works (suspect + reasoning freeform)
- [ ] Mentor evaluates reasoning (identifies fallacies)
- [ ] Correct verdict closes case (post-verdict scene)
- [ ] Wrong verdict loses attempt (brutal feedback)
- [ ] Save/load state persists between sessions

### Quality Gates:
- Python backend tests pass (pytest)
- Frontend tests pass (Vitest)
- LLM context isolation verified (narrator doesn't leak witness secrets)
- No hallucination (LLM respects not_present items)
- Playtest by 2+ people shows:
  - Investigation feels like DnD exploration (not quiz)
  - Witness characters feel human (wants/fears/moral_complexity)
  - Moody feedback brutal but educational
  - Fallacy detection accurate

---

## Migration from Current Prototype

### Delete Entirely
- All hypothesis system code (unlocking.ts, ConditionalHypothesis types)
- All contradiction detection code (contradictions.ts, ContradictionPanel)
- All scoring system code (scoring.ts, MetricCard, CaseReview)
- All phase components (6 phases → freeform investigation)
- GameContext reducer (completely rewrite)
- mission1.ts (replace with YAML)

### Keep (Minimal)
- Card.tsx, Button.tsx, Modal.tsx (reusable UI)
- Tailwind config
- Vite config
- Test setup

### Build New
- **Backend**: Python (Hono, Claude Haiku, YAML case store, state persistence)
- **Frontend**: LocationView, WitnessInterview, EvidenceBoard, VerdictSubmission
- **Cases**: YAML case files (modular victim/suspect/witness/evidence/solution)

---

## Current Status

**Version**: 0.5.0 (Phase 3.6 Complete)
**Last Updated**: 2026-01-07
**Phase**: Phase 3 Polish & Expansion

**Completed**:
- ✅ Phase 1 (Core Investigation Loop) - All quality gates passing (2026-01-05)
- ✅ Phase 2 (Narrative Polish + Witness System) - All quality gates passing (2026-01-05)
- ✅ Phase 2.5 (Terminal UX + Witness Integration) - User tested and confirmed working (2026-01-06)
- ✅ Phase 3 (Verdict + Post-Verdict) - All quality gates passing (2026-01-06)
- ✅ Phase 3.1 (State Fixes + Natural LLM Feedback) - User tested and confirmed working (2026-01-07)
- ✅ Phase 3.5 (Intro Briefing System) - All quality gates passing (2026-01-07)
- ✅ **Phase 3.6 (Dialogue Briefing UI)** - All quality gates passing (2026-01-07)

**Test Coverage**:
- Backend: 385 tests passing (95% coverage)
- Frontend: 417 tests passing
- **Total: 802 tests** ✅

**Next Phase Options**:
- **Phase 3.7 (Briefing Polish)** - Fix transition timing + double scrollbar (0.5 day)
- **Phase 4 (Tom's Inner Voice)** - 50% helpful / 50% misleading ghost character
- **Phase 4.5 (Magic System)** - 6 investigation spells with risk/reward

**Design Review Complete** (2026-01-06):
- ✅ Analyzed AUROR_ACADEMY_GAME_DESIGN.md (1842 lines)
- ✅ Analyzed CASE_DESIGN_GUIDE.md (1375 lines)
- ✅ Identified 11 new mechanics (intro briefing, Tom's ghost, Bayesian tracker, etc.)
- ✅ **Impact on Phase 2.5**: ZERO - All new mechanics fit AFTER current work
- ✅ Updated roadmap: Added Phases 3.5, 4.5, 5.5 for new features
- ✅ Effort revised: MVP 34-40 days (~6 weeks), Full 37-44 days (~7 weeks)

**Case Content Analysis Complete** (2026-01-06):
- ✅ Analyzed CASE_001_RESTRICTED_SECTION.md (1298 lines narrative design)
- ✅ Conflict analysis: Current YAML = different case entirely (Draco/Hermione vs Vector bookshelf murder)
- ✅ Technical spec created: CASE_001_TECHNICAL_SPEC.md (2400 lines, comprehensive)
- ✅ **Recommendation**: Incremental replacement (keep simple case for testing Phases 2.5-5, replace in Phase 6)
- ✅ Files created:
  - `docs/CASE_001_CONFLICT_ANALYSIS.md` (conflict resolution summary)
  - `docs/CASE_001_TECHNICAL_SPEC.md` (complete technical translation)
  - `docs/CASE_001_RECOMMENDATIONS.md` (phase-by-phase implementation plan)

**Next Steps**:
1. Continue Phase 2.5 as planned (terminal UX + witness integration, 1-2 days)
   - **MINIMAL YAML updates**: Add evidence metadata (name/location/description), witnesses_present field
   - **DO NOT replace case content yet** (keep Draco/Hermione for testing)
2. Phases 3-4.5: Build mechanics (verdict, briefing, Tom, spells) using simple case
3. Phase 6: **FULL CASE REPLACEMENT** with Vector case from technical spec

---

*"CONSTANT VIGILANCE!" - Mad-Eye Moody*
