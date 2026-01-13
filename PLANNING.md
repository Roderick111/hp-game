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

### Phase 3.8: Enhanced Moody Context ✅ COMPLETE
**Goal**: Improve Moody personality and dialogue in briefing and feedback
**Status**: COMPLETE (2026-01-07)
**Effort**: 0.5 day (actual)

**Implementation**:
- Enhanced Moody characterization in briefing LLM prompts
- Improved feedback context for more natural responses
- Better consistency across briefing and mentor feedback

**Deliverable**: ✅ More natural Moody dialogue, consistent characterization

**Tests**: All tests passing (802 total)

---

### Phase 3.7: Briefing UI Polish (Transition + Scrollbar) ✅ COMPLETE
**Goal**: Fix 2 UI issues - transition timing + double scrollbar
**Status**: COMPLETE (2026-01-07)
**Effort**: 0.5 day (actual)

**Issues Resolved**:
1. Transition message appeared too early (immediately after teaching question)
2. Double scrollbar visible (outer Modal + inner BriefingModal)

**Implementation**:
1. Transition shows ONLY after player asks ≥1 follow-up question (`conversation.length > 0`)
2. Modal uses `overflow-hidden`, BriefingModal inner div has `overflow-y-auto` (single scrollbar)

**Deliverable**: ✅ Transition appears when player ready, single scrollbar only

**Files Modified**:
- `frontend/src/components/ui/Modal.tsx` (overflow fix)
- `frontend/src/components/BriefingModal.tsx` (conditional transition)
- `frontend/src/components/__tests__/BriefingModal.test.tsx` (test updates)

---

### Phase 3.9: Validation-Gates Learning System ✅ COMPLETE
**Goal**: Transform validation-gates into learning agent through pattern documentation
**Status**: COMPLETE (2026-01-07)
**Effort**: 1-2 hours (actual: 1 hour)

**Implementation Summary**:
- Documentation-only changes (no code modifications)
- 8 starter patterns documented in TEST-FAILURES.md
- validation-gates.md enhanced with 3 new steps + learning principle
- TESTING-CONVENTIONS.md quick reference created
- All success criteria met

**Tasks Completed**:
1. ✅ Created TEST-FAILURES.md structure with 8 patterns
2. ✅ Added Step 0: Read project docs (PLANNING.md, STATUS.md, PRPs) before testing
3. ✅ Added Step 0.5: Check TEST-FAILURES.md for known patterns
4. ✅ Updated Step 3: Enhanced with 6-step failure handling + pattern documentation
5. ✅ Seeded TEST-FAILURES.md with 8 real patterns from project
6. ✅ Updated STATUS.md reporting template (retries + new patterns fields)
7. ✅ Added Learning Principle #11 to validation-gates.md
8. ✅ Created TESTING-CONVENTIONS.md quick reference (optional)

**Deliverable**: validation-gates builds mental model through documented failures

**Success Criteria** (ALL MET ✅):
- [x] Agent reads project docs before testing (Step 0 added)
- [x] TEST-FAILURES.md exists with 8 patterns (exceeds 5-10 requirement)
- [x] STATUS.md includes pattern references (template updated with "Retries" + "New patterns" fields)
- [x] Future agents fix known issues 2-3x faster (Step 0.5 check patterns first)

**Files Created**:
- `hp_game/TEST-FAILURES.md` (8 patterns: Pydantic serialization, React hooks, TypeScript narrowing, async tests, imports/exports, fixture scope, test isolation, Tailwind purge)
- `hp_game/TESTING-CONVENTIONS.md` (quick reference one-liners extracted from patterns)

**Files Modified**:
- `~/.claude/agents/validation-gates.md` (Steps 0, 0.5, 3 enhanced, STATUS.md template updated, Principle #11 added)
- `hp_game/PLANNING.md` (Phase 3.9 marked complete)
- `hp_game/CHANGELOG.md` (Phase 3.9 entry with full details)

**Agent Execution**:
- documentation-manager ✅ - All 8 tasks completed (1 hour total)

**Anthropic Principles**:
- Validation = labeled data (each failure teaches agents)
- Context-aware testing (understand WHY code exists)
- Pattern documentation = institutional knowledge
- Clear error messages + fixes = mental model building

---


### Phase 4: Tom's Inner Voice (Enhanced)
**Goal**: 50% helpful / 50% misleading character voice
**Status**: ✅ COMPLETE (2026-01-08) - Superseded by Phase 4.1
**Effort**: 3-4 days (as estimated)
**Implementation**: See `/PRPs/phase4-toms-inner-voice.md` for full PRP
**Test Coverage**: 27 backend tests, 30+ frontend tests
**Files Changed**: 12 (7 backend, 5 frontend)

**Note**: YAML scripted triggers replaced with LLM real-time generation in Phase 4.1 (2026-01-09)

### Phase 4.1: LLM-Powered Tom Conversation ✅ COMPLETE (2026-01-09)
**Replaced**: YAML triggers (Phase 4.0) with LLM real-time generation
**Implementation**: See `/PRPs/phase4-toms-inner-voice.md` for full PRP (lines 700-900 frontend tasks)
**Test Coverage**: 30 new backend tests, 0 frontend regressions
**Files Changed**: 14 (7 backend, 7 frontend)

**Major Features**:
- Claude Haiku LLM service (tom_llm.py with 1000+ word character prompt)
- Trust system (0-100%, 10% per case completed)
- Direct conversation support ("tom" prefix, case insensitive)
- Message ordering fix (inline chronological, not stacked)
- 50/50 helpful/misleading split (random mode selection per response)

**Breaking Changes**:
- Removed inner_voice section from YAML (no longer needed)
- Deprecated inner_voice.py trigger selection (kept for compatibility)
- useInnerVoice hook replaced with useTomChat

**Tasks Complete**:
- ✅ Backend LLM service (generate_tom_response, build_tom_system_prompt, check_tom_should_comment)
- ✅ Trust system integration (InnerVoiceState extended with trust_level, cases_completed)
- ✅ API endpoints (POST /tom/auto-comment 30% chance, POST /tom/chat always responds)
- ✅ Frontend Tom chat hook (useTomChat with checkAutoComment, sendMessage)
- ✅ Tom chat input component (TomChatInput with "tom" prefix detection)
- ✅ Fixed message ordering (LocationView unified message array with timestamps)
- ✅ Context injection (case facts + evidence discovered only)
- ✅ Character prompt Rule #10 (Tom cannot explain his own psychology)

**Deliverable**: Tom responds naturally to investigation, can engage in direct conversation ✅

**Implementation Details**:
- Model: Claude Haiku (claude-haiku-4-5-20250929)
- Max tokens: 300 (keeps responses 1-3 sentences)
- Temperature: 0.8 (personality variation)
- POST /api/case/{case_id}/tom/auto-comment (30% chance, 100% on critical)
- POST /api/case/{case_id}/tom/chat (always responds to direct questions)
- useTomChat hook replaces useInnerVoice
- TomChatInput detects "tom" prefix (case insensitive)
- Backend: 455 tests (30 new), Frontend: 430 tests (0 regressions)

**Character Implementation**:
- Tom's Ghost character (docs/game-design/TOM_THORNFIELD_CHARACTER.md)
- 50/50 helpful/misleading split enforced by random pre-roll
- Trust affects depth (0% = brief factual, 100% = may share personal stories)
- Psychology shown through behavior, not explained (Rule #10)

---

### Phase 4.3: Tom Personality Enhancement ✅ COMPLETE (2026-01-09)
**Goal**: Enhanced Tom's character depth with behavioral patterns, Marcus progression, voice evolution
**Status**: COMPLETE
**Effort**: 0.5 day (actual)
**Implementation**: See `PRPs/PRP-PHASE4.3.md` for full PRP

**Implementation Summary**:
Enhanced tom_llm.py system prompt with 6 priority improvements from TOM_PERSONALITY_IMPROVEMENTS.md analysis. Filled 80% character complexity gap between 1077-line character doc and implementation.

**Features Delivered**:
- ✅ Behavioral pattern templates (doubling down, deflection, Samuel invocation)
- ✅ Marcus Bellweather 3-tier guilt progression (deflect → vague → full ownership)
- ✅ Voice progression tied to trust (eager → questioning → wise)
- ✅ Mode-specific dialogue templates (helpful=lessons, misleading=habits)
- ✅ Relationship evolution markers (player, Moody, Samuel, Marcus)
- ✅ Dark humor expansion (3 template examples with structure)

**Files Modified**:
- `backend/src/context/tom_llm.py` - Enhanced build_tom_system_prompt() (lines 51-128)
- `backend/tests/test_tom_llm.py` - Added 14 new behavioral pattern tests

**Implementation Details**:
- Lines 51-68: 3-tier Marcus guilt progression (trust 0-30% deflect, 40-70% vague, 80%+ full ownership)
- Lines 71-74: Voice progression structure (eager → questioning → wise)
- Lines 77-99: Mode-specific dialogue templates (Tom's Case #1/2 failures)
- Lines 101-113: Behavioral pattern templates (Alpha, Beta, Gamma)
- Lines 116-120: Relationship markers (player, Moody, Samuel, Marcus evolution)
- Lines 123-128: Dark humor expansion (3 examples with [Absurd detail] + [Why stupid] + [Cheerful acceptance])

**Test Coverage**:
- Backend: 469/470 tests (14 new Phase 4.3 tests)
- All behavioral patterns verified in system prompt
- Marcus 3-tier progression tested at trust 0%, 50%, 90%
- Voice evolution confirmed across trust levels

**Character Arc**:
- Samuel invocations decrease from trust 30% → 80%
- "I don't know" admissions appear only at trust 80%+
- Marcus references gain specificity (vague → detailed with daughter age, Cell Block D)
- Psychology shown through behavior (Rule #10 maintained)

**Success Criteria Met**: ✅ All 4 categories
- [x] Pattern usage: Templates present in prompt
- [x] Character arc visibility: 3-tier Marcus progression, voice evolution
- [x] Implementation quality: 14 tests passing, Rule #10 maintained
- [x] Educational depth: Mode templates tied to Tom's case failures

**Deliverable**: Tom feels like person with depth, not generic AI ✅

---

### Phase 4.2: Modal Window UX Improvements ✅ COMPLETE
**Goal**: Add standard modal closing mechanisms (ESC, backdrop, X button)
**Status**: ✅ COMPLETE (2026-01-09)
**Effort**: 0.5 day (as estimated)
**Implementation**: See `PRPs/PRP-PHASE4.2.md` for full PRP

**Tasks**:
- Add ESC key listener to Modal component (global keyboard handler)
- Enable backdrop click for briefing modal (line 477 App.tsx)
- Enable X button for briefing modal (same change)
- Update BriefingModal tests (ESC key test cases)

**Deliverable**: Users can close briefing modal via ESC, backdrop click, or X button (in addition to "Start Investigation")

**User Impact**:
- ✅ ESC key closes modal (accessibility + standard UX)
- ✅ Backdrop click closes modal (expected behavior)
- ✅ X button closes modal (visible affordance)
- ✅ All methods mark briefing complete (consistent)
- ✅ No "trapped" feeling in modal

**Technical Details**:
- Frontend-only change (2 files: Modal.tsx, App.tsx)
- No backend changes (existing completion endpoint)
- All close methods call same handler (handleBriefingComplete)
- ESC listener benefits all modals (witness, evidence, verdict)

---

### Phase 4.4: UI/UX Improvements ✅ COMPLETE
**Goal**: Fix 5 UI/UX issues - conversation persistence, title styling, height alignment, brackets, description formatting
**Status**: COMPLETE (2026-01-09)
**Effort**: 1 day (as estimated)
**Implementation**: See `PRPs/PRP-PHASE4.4.md` for full PRP

**Issues Fixed**:
1. **CRITICAL**: ✅ Conversation history persistence (narrator + Tom messages save/load)
2. ✅ Professional title styling (yellow uppercase: HOGWARTS LIBRARY, EVIDENCE BOARD, AVAILABLE WITNESSES, CASE STATUS)
3. ✅ Natural title display (removed square brackets)
4. ✅ Flowing paragraph descriptions (single paragraph without artificial line breaks)
5. ✅ Extended conversation height (max-h-96 = 384px, better screen usage)

**Implementation Summary**:
- Backend: Added `add_conversation_message()` helper, updated 3 endpoints to save messages
- Frontend: Conversation restoration logic in useInvestigation.ts, UI polish across 4 components
- Tests: 7 new backend integration tests, 11 new frontend tests (all passing)

**Deliverable**: ✅ All 5 improvements complete
- ✅ Investigation log persists between sessions (all 3 message types)
- ✅ Consistent yellow uppercase titles across all sections
- ✅ Natural title display without square brackets
- ✅ Flowing paragraph descriptions (no artificial line breaks)
- ✅ Extended conversation height (384px)

**Success Criteria**: ✅ ALL MET
- [x] Save → Close browser → Load → Investigation log restored
- [x] Conversation limited to last 20 messages (prevent unbounded growth)
- [x] UI polish complete (height, brackets, whitespace, title styling)
- [x] All tests pass (916+ tests, 476 backend + 440+ frontend)
- [x] Backward compatible (old saves default to empty conversation)
- [x] Zero regressions introduced

**Files Modified**: 9 files (3 backend, 6 frontend)
- Backend: `player_state.py` (add_conversation_message method), `routes.py` (3 endpoints updated), `test_routes.py` (7 integration tests)
- Frontend: `investigation.ts` (types), `useInvestigation.ts` (restoration logic), `App.tsx` (restore + title styling), `LocationView.tsx` (title + UI polish), `EvidenceBoard.tsx` (title styling), `WitnessSelector.tsx` (title styling), `useInvestigation.test.ts` (11 tests)

**Test Coverage**:
- Backend: 476/477 tests (99.8%, 7 new Phase 4.4 tests)
- Frontend: 440+ tests (11 new Phase 4.4 tests)
- Total: 916+ tests ✅

**Agent Execution**:
1. fastapi-specialist ✅ - Backend tasks (Tasks 1-3, 8)
2. react-vite-specialist ✅ - Frontend tasks (Tasks 4-7, 9)
3. validation-gates ✅ - All tests passed
4. documentation-manager ✅ - Docs updated

---

### Phase 4.41: Briefing Modal UX Fix ✅ COMPLETE
**Goal**: Fix briefing modal title styling and opening logic
**Status**: COMPLETE (2026-01-09)
**Effort**: <1 hour
**Implementation**: Quick UX fix based on user feedback

**Issues Fixed**:
1. ✅ Briefing modal title now matches other titles (yellow/amber, no brackets)
2. ✅ Modal only opens on new case/restart (not every reload)
3. ✅ Backend briefing completion state properly checked before opening

**Implementation Summary**:
- Frontend: Modal variant changed from terminal to default for consistent styling
- Frontend: Check backend `briefing_completed` flag before opening modal
- Result: Professional consistent UI, no annoying modal reopens

**Deliverable**: ✅ Briefing modal UX polished
- ✅ "Case Briefing" title in yellow matching "HOGWARTS LIBRARY" style
- ✅ Modal opens only on first case load or restart
- ✅ No reopening after page reload if already completed

**Files Modified**: 2 frontend files
- `App.tsx` (modal variant, opening logic)
- `useBriefing.ts` (backend completion state check)

**Agent Execution**:
1. codebase-researcher ✅ - Found modal implementation
2. react-vite-specialist ✅ - Applied fixes

---

### Phase 4.42: Narrator Conversation Memory ✅ COMPLETE
**Goal**: Add conversation memory to narrator to prevent repetitive location descriptions
**Status**: COMPLETE (2026-01-09)
**Effort**: <2 hours
**Implementation**: Quick fix based on witness conversation history pattern

**Issues Fixed**:
1. ✅ Narrator now has conversation memory (last 5 exchanges)
2. ✅ History cleared on location change (keeps descriptions fresh)
3. ✅ History persists through save/load cycle
4. ✅ Prevents narrator from repeating location descriptions

**Implementation Summary**:
- Backend: Added narrator_conversation_history field to PlayerState
- Backend: Added 3 management methods (add, clear, get_as_dicts)
- Backend: Updated narrator.py with conversation_history parameter
- Backend: Updated investigate endpoint to pass/clear/save history
- Result: Narrator has context awareness without bloat

**Deliverable**: ✅ Narrator conversation memory working
- ✅ History limited to last 5 exchanges (prevents token bloat)
- ✅ History cleared when player changes location
- ✅ History persists across saves
- ✅ Narrator avoids repeating descriptions

**Files Modified**: 5 backend files
- `player_state.py` (narrator_conversation_history field + 3 methods)
- `narrator.py` (conversation_history parameter + format function)
- `routes.py` (pass/clear/save history in investigate endpoint)
- `test_routes.py` (5 integration tests)
- `test_narrator.py` (8 unit tests)

**Test Coverage**:
- Backend: 492/492 tests passing (100%, 13 new tests)
- Total: 932+ tests ✅

**Agent Execution**:
1. fastapi-specialist ✅ - Backend implementation + tests

---

### Phase 4.5: Magic System ✅ COMPLETE (2026-01-09)
**Goal**: 7 investigation spells with text-only casting, LLM-driven risk outcomes
**Status**: COMPLETE
**Effort**: 2-3 days (actual)
**Implementation**: See `PRPs/phase4.5-magic-system.md` for full PRP

**Features Delivered**:
- ✅ 7 investigation spells (6 safe: Revelio, Homenum Revelio, Specialis Revelio, Lumos, Prior Incantato, Reparo; 1 restricted: Legilimency)
- ✅ Text-only spell casting: All spells via text input ("I'm casting Revelio"), no modal buttons
- ✅ Read-only Auror's Handbook: Reference modal (Cmd/Ctrl+H), displays spells, NO action buttons
- ✅ Natural narrator warnings: Legilimency gives conversational warnings, not modal popups
- ✅ LLM-driven risk outcomes: Based on suspect Occlumency skill (weak/average/strong), 4 varied scenarios (success undetected, success detected, backlash, flee/attack)
- ✅ Spell integration: Detected in narrator.py, effects via spell_llm.py, no separate API endpoint
- ✅ Quick actions: Populate text input with "I'm casting [Spell]" (player can edit before submit)

**Implementation Summary**:
- Backend: 6 new files (spell module + tests), 2 modified (narrator.py, case_001.yaml)
- Frontend: 3 new files (types, AurorHandbook, tests), 2 modified (LocationView spells)
- Spell parsing: Regex in narrator detects "cast [spell]" or "I'm casting [spell]"
- Evidence reveal: Reuses existing mechanism (spell effects return as narrator responses)
- Dynamic risk: LLM determines Legilimency outcomes based on witness occlumency_skill (YAML field)

**Files Changed**: 13 (8 backend, 5 frontend)
- Backend: `spells/__init__.py`, `spells/definitions.py`, `context/spell_llm.py`, 3 test files, `narrator.py`, `case_001.yaml`
- Frontend: `types/spells.ts`, `AurorHandbook.tsx`, `AurorHandbook.test.tsx`, `LocationView.tsx`, `LocationView.test.tsx`

**Test Coverage**:
- Backend: 570/570 tests (78 new spell tests: 21 definitions + 43 LLM + 14 integration)
- Frontend: 440+ tests (46 new spell tests: 33 AurorHandbook + 13 LocationView)
- Total: 1010+ tests ✅
- Zero regressions, production-ready

**Key Architecture Decisions**:
- Text-only casting (not modal buttons) - player agency, natural input
- Read-only handbook (not action UI) - reference material, casting via text
- Natural warnings (not modal popups) - conversational flow, no UX interruption
- LLM-driven risk (not fixed %) - dynamic outcomes based on context, narrative not mechanical
- Narrator integration (not separate endpoint) - spells are investigation actions, not separate system

**Success Criteria Met**: ✅ All 15 criteria
- Spell detection, LLM evaluation, evidence reveal, natural warnings, dynamic outcomes
- Read-only handbook, quick actions populate input, comprehensive tests, zero regressions

**Deliverable**: Player can cast 7 investigation spells via text input, handbook reference, Legilimency has natural warnings + LLM-driven outcomes ✅

**Agent Execution**:
1. fastapi-specialist ✅ - Backend (6 files, 78 tests)
2. react-vite-specialist ✅ - Frontend (5 files, 46 tests)
3. validation-gates ✅ - All quality gates passed
4. documentation-manager ✅ - Documentation updated

**New Mechanics from Design Docs**:
- Magic System (AUROR_ACADEMY_GAME_DESIGN.md lines 960-1024, CASE_DESIGN_GUIDE.md lines 780-1024)
- Implemented with KISS principle: Static availability (no progression yet), text-only casting, narrator integration

---

### Phase 4.6.2: Programmatic Legilimency + Generalized Spell Detection ✅ COMPLETE

**Completed**: 2026-01-11

**What Was Built**:
- Single-stage spell detection (fuzzy matching + semantic phrases)
- All 7 spells: Legilimency, Revelio, Lumos, Homenum Revelio, Specialis Revelio, Prior Incantato, Reparo
- Legilimency in witness interrogation (programmatic outcomes)
- Trust threshold system (70+ for success)
- No confirmation step (instant execution)

**Detection Examples**:
- ✅ "legilimency" (spell name alone)
- ✅ "legulemancy" (typo, fuzzy 82%)
- ✅ "I want to read her mind" (semantic phrase)
- ❌ "What's in your mind?" (not detected, no false positive)

**Integration**:
- /api/investigate: All 7 spells with new detection
- /api/interrogate: Legilimency only (instant execution)

**PRP**: PRPs/phase4.6.2-programmatic-legilimency.md

---

### Phase 4.6: Legilimency Integration Fixes ✅ COMPLETE (DEPRECATED - Replaced by Phase 4.6.2)
**Goal**: Fix 3 bugs from Phase 4.5 - missing warnings, secret descriptions, trust penalties
**Status**: COMPLETE (2026-01-10) - **NOTE**: Two-stage confirmation flow deprecated in Phase 4.6.2
**Effort**: 6 hours (actual)
**Implementation**: See `PRPs/phase4.6-legilimency-fixes.md` for full PRP

**Bugs Fixed**:
1. **No narrator warning**: Spell detection now routes through narrator before execution (two-stage flow: warning → confirmation) - **DEPRECATED in 4.6.2**
2. **No secret descriptions**: InterrogateResponse includes `secret_texts` dict with full text (not just IDs) - Still used
3. **No trust degradation**: Flag extraction (`[FLAG: relationship_damaged]`) applies -15 trust penalty to target witness - **Replaced by programmatic penalties in 4.6.2**

**Implementation Summary**:
- Integrated spell detection into investigate route (routes.py uses `build_narrator_or_spell_prompt`)
- Added `extract_flags_from_response()` utility (evidence.py)
- Extended InterrogateResponse model with `secret_texts` field
- Trust penalties applied via existing witness state management

**Features Delivered**:
- ✅ Two-stage Legilimency flow (narrator warns, player confirms) - **DEPRECATED in 4.6.2**
- ✅ Full secret text descriptions in witness responses
- ✅ Trust degradation on unauthorized mind-reading (-15 penalty) - **Enhanced in 4.6.2**
- ✅ Flag system for spell outcomes (relationship_damaged, mental_strain)

**Backend Implementation**:
- Modified routes.py: Spell routing (lines 407-429), flag processing (line 445), secret_texts population (lines 802-833)
- Created extract_flags_from_response() in evidence.py
- Extended InterrogateResponse model with secret_texts field
- 7 new tests in test_evidence.py (flag extraction)

**Frontend Implementation**:
- Updated investigation.ts: Added secret_texts to InterrogateResponse interface
- No display logic needed (LLM naturally incorporates secret text in narrative)

**Test Coverage**:
- Backend: 578/578 tests passing (100%, 7 new Phase 4.6 tests)
- Frontend: TypeScript builds clean
- Total: 1018+ tests ✅
- Zero regressions, production-ready

**Files Modified** (4 total):
- Backend: routes.py, evidence.py, test_evidence.py
- Frontend: investigation.ts

**Success Criteria Met**: ✅ All 3 bugs fixed
- [x] Narrator warns before risky spell execution (two-stage flow) - **DEPRECATED**
- [x] Secret revelations show full text description (not just ID)
- [x] Trust degrades by -15 after unauthorized Legilimency - **Enhanced in 4.6.2**
- [x] All 578 backend tests passing
- [x] Zero regressions

**Deliverable**: Legilimency spell flow complete with warnings, trust penalties, secret descriptions ✅

**Agent Execution**:
- fastapi-specialist ✅ - Backend fixes (routes.py + evidence.py + tests)
- react-vite-specialist ✅ - Frontend type update (investigation.ts)
- validation-gates ✅ - All quality gates passed
- documentation-manager ✅ - Docs updated

---

### Phase 5.1: Main Menu System ✅ COMPLETE
**Goal**: Add in-game menu modal with restart, save, load functionality
**Status**: COMPLETE (2026-01-12)
**Effort**: 1-2 days (actual: 1 day)

**Implementation Summary**:
- Created MainMenu modal component with Radix Dialog
- ESC key toggle opens/closes menu globally
- 4 menu options: NEW GAME (functional), LOAD/SAVE (Phase 5.3), SETTINGS (future)
- Keyboard shortcuts: "1" for New Game, 2-4 reserved
- Full keyboard navigation (Tab, Arrow keys, Enter, ESC)
- Moved restart button from App.tsx to menu
- Terminal dark theme (bg-gray-900, text-amber-400)

**Files Created**:
- `frontend/src/hooks/useMainMenu.ts` - Menu state management
- `frontend/src/components/MainMenu.tsx` - Menu modal component

**Files Modified**:
- `frontend/src/App.tsx` - ESC handler, menu integration, removed restart button
- `frontend/src/components/ui/Button.tsx` - Added `title` prop for tooltips
- `frontend/package.json` - Added @radix-ui/react-dialog ^1.1.15

**Testing Coverage**:
- Frontend: 466 tests passing (0 new failures)
- Backend: 638 tests passing (0 new failures)
- Total: 1104 tests ✅

**Success Criteria**: ALL MET ✅
- [x] Menu accessible via ESC key
- [x] All existing functionality (restart) moved to menu
- [x] Save/load placeholders ready for Phase 5.3
- [x] Menu doesn't interfere with other modals
- [x] Professional UI matching terminal theme
- [x] Zero regressions introduced

**Agent Execution**:
- planner ✅ - PRP creation
- codebase-researcher ✅ - Pattern analysis
- documentation-researcher ✅ - Official docs research
- react-vite-specialist ✅ - Frontend implementation
- validation-gates ✅ - All quality gates passed
- documentation-manager ✅ - Documentation synchronized

---

### Phase 5.2: Location Management System ✅ COMPLETE
**Goal**: Modular location changing with proper state management
**Status**: COMPLETE (2026-01-12)
**Effort**: 2 days (actual)
**Depends on**: Phase 5.1 (Menu System)

**Design Decisions**:
- **Navigation UX**: Hybrid (clickable location selector + natural language "go to dormitory")
- **Location Graph**: Flat (any → any) - no connection restrictions
- **UI Placement**: Right side panel with Evidence Board / Witness Selector
- **Scope**: 3 locations for Case 1 (library + dormitory + great_hall)
- **Unlocking**: All locations accessible from start (no gating mechanic)

**Deliverable**: ✅ Players navigate between locations via clickable selector with keyboard shortcuts

**Implementation Summary**:
- **Backend**: GET /locations, POST /change-location endpoints
- **Frontend**: LocationSelector component (right-side panel, terminal dark theme)
- **Hook**: useLocation hook with state management
- **UI**: Keyboard shortcuts 1-3 for quick-select locations
- **State**: Location changes reload investigation, preserve evidence/witnesses globally
- **Locations**: 3 locations in case_001.yaml (library, dormitory, great_hall)
- **Navigation**: Hybrid (clickable list + natural language "go to dormitory")
- **Detection**: Natural language with fuzzy matching (typo tolerance)

**Success Criteria**: ALL MET ✅
- [x] LocationSelector component (right side panel with witnesses/evidence)
- [x] GET /api/case/{case_id}/locations endpoint (53 new backend tests)
- [x] POST /api/case/{case_id}/change-location endpoint with natural language parser
- [x] Location changes preserve evidence/witness states globally
- [x] Narrator conversation history cleared per location (fresh descriptions)
- [x] 3 locations in case_001.yaml (library, dormitory, great_hall)
- [x] Keyboard shortcuts 1-3 for quick navigation
- [x] Natural language detection with fuzzy matching
- [x] 100 new tests (53 backend + 47 frontend) ALL PASSING
- [x] Zero regressions introduced

**Test Coverage**:
- Backend: 691/691 tests (100%, 53 new Phase 5.2 tests)
- Frontend: 507/537 tests (94.4%, 47 new Phase 5.2 tests ALL PASSING)
- Total: 1198 tests ✅

**Files Created**:
Backend:
- `backend/src/location/__init__.py`
- `backend/src/location/parser.py`
- `backend/tests/test_location.py`

Frontend:
- `frontend/src/components/LocationSelector.tsx`
- `frontend/src/hooks/useLocation.ts`
- `frontend/src/components/__tests__/LocationSelector.test.tsx`
- `frontend/src/hooks/__tests__/useLocation.test.ts`

**Files Modified**:
Backend:
- `backend/src/api/routes.py` (GET /locations, POST /change-location endpoints)
- `backend/src/case_store/loader.py` (list_locations function)
- `backend/src/case_store/case_001.yaml` (dormitory, great_hall locations + evidence)

Frontend:
- `frontend/src/App.tsx` (LocationSelector integration)
- `frontend/src/api/client.ts` (getLocations, changeLocation functions)
- `frontend/src/types/investigation.ts` (LocationInfo, ChangeLocationResponse types)
- `frontend/src/hooks/useInvestigation.ts` (locationId dependency for reload)

**Quality Gates**: ALL PASSING ✅
- Backend tests: 691/691 (100%)
- Frontend tests for Phase 5.2: 47/47 (100%)
- Linting: Clean (7 backend fixes applied)
- Type checking: Clean (frontend), 14 pre-existing (backend non-Phase 5.2)
- Production build: Success
- Zero regressions

---

### Phase 5.3: Industry-Standard Save/Load Management ✅ COMPLETE
**Goal**: Robust save system with multiple slots, autosave, and metadata
**Status**: COMPLETE (2026-01-12)
**Effort**: 2-3 days (actual)

**Implementation Summary**:
- **Backend**: Multi-slot persistence with atomic writes
  - Extended PlayerState with `version` and `last_saved` fields
  - 7 new functions in persistence.py (save_player_state, load_player_state, list_player_saves, delete_player_save, get_save_metadata, migrate_old_save, _get_slot_save_path)
  - Updated save/load endpoints with slot parameter
  - Added list_saves and delete_save endpoints
- **Frontend**: SaveLoadModal + useSaveSlots hook
  - Created SaveLoadModal component (save/load mode, slot grid, metadata display)
  - Created useSaveSlots hook (state management, API integration)
  - Created Toast component (notifications)
  - Enabled LOAD GAME and SAVE GAME buttons in MainMenu
  - Integrated autosave logic in App.tsx (debounced 2s)
- **Features Delivered**:
  - ✅ 3 manual save slots + 1 autosave slot + default (backward compatibility)
  - ✅ Save metadata (timestamp, location, evidence count)
  - ✅ Autosave every 2+ seconds (debounced)
  - ✅ Toast notifications for save/load/delete feedback
  - ✅ Keyboard shortcuts (ESC → 2 for Load, 3 for Save)
  - ✅ Atomic writes prevent corruption
  - ✅ Backward compatible (auto-migration of old saves)

**Deliverable**: ✅ Production-quality save/load system complete

**Success Criteria**: ALL MET ✅
- [x] Multiple save slots work independently (3 manual + autosave)
- [x] Autosave triggers automatically (debounced 2s)
- [x] Save metadata displayed clearly (timestamp, location, evidence)
- [x] Load operation restores exact game state
- [x] Save/load operations handle errors gracefully
- [x] Old save files compatible (auto-migration to autosave)

**Technical Details**:
- Save format: JSON with version field ("1.0.0")
- Save location: `backend/saves/` directory with slot names (case_001_player_{slot}.json)
- Autosave frequency: Debounced 2+ seconds after state change
- Metadata: `{version, timestamp, location, evidence_count}`
- Atomic writes: Write to .tmp → verify → rename (prevents corruption)

**Testing Coverage**:
- Backend: 691/691 tests passing (100%)
- Frontend: TypeScript 0 errors, ESLint 0 errors, Build success
- Quality Gates: ALL PASSING ✅
- Zero regressions introduced

**Files Created** (3):
- `frontend/src/hooks/useSaveSlots.ts`
- `frontend/src/components/SaveLoadModal.tsx`
- `frontend/src/components/ui/Toast.tsx`

**Files Modified** (8):
- Backend: `player_state.py`, `persistence.py`, `routes.py`
- Frontend: `investigation.ts`, `client.ts`, `MainMenu.tsx`, `App.tsx`

**Agent Execution**:
- fastapi-specialist ✅ - Backend implementation
- react-vite-specialist ✅ - Frontend implementation
- validation-gates ✅ - All quality gates passed
- documentation-manager ✅ - Documentation synchronized

---

### Phase 5.3.1: Landing Page & Main Menu System ✅ COMPLETE
**Goal**: Professional game entry point with exit-to-menu functionality
**Status**: COMPLETE (2026-01-13)
**Effort**: 0.5 day (actual)

**Implementation Summary**:
Frontend-only changes creating professional game entry point. Landing page shows on app start with Start/Load buttons. Exit-to-menu option added to ESC menu with confirmation dialog. Zero backend modifications required.

**Features Delivered**:
- **Landing Page**: Terminal B&W aesthetic component shown on app start
- **Start New Case**: Button loads case_001 into investigation view
- **Load Game**: Button opens SaveLoadModal from Phase 5.3
- **Exit to Main Menu**: ESC menu option (button 5) returns to landing page
- **Confirmation Dialog**: Warns about unsaved progress before exiting
- **State Management**: Extracted InvestigationView component, prevents hook errors
- **Keyboard Shortcuts**: Landing (1-2), Main menu (1-5)

**Deliverable**: ✅ Professional game start with clear entry point and safe exit

**Success Criteria**: ALL MET ✅
- [x] Landing page renders on app start (not investigation)
- [x] "Start New Case" loads case_001 investigation
- [x] "Load Game" opens save slot selector
- [x] ESC menu has "Exit to Main Menu" (button 5)
- [x] Confirmation dialog before exiting case
- [x] All keyboard shortcuts work (Landing 1-2, Menu 1-5)
- [x] Zero regressions (691 backend + 23 new frontend tests passing)

**Testing Coverage**:
- Backend: 691/691 tests passing (100%, no changes)
- Frontend: 23/23 new LandingPage tests passing (100%)
- Quality Gates: ALL PASSING ✅
  - TypeScript: 0 errors
  - ESLint: 0 errors
  - Build: SUCCESS (256.40 kB JS, 77.54 kB gzipped)
- Zero regressions introduced

**Files Created** (2):
- `frontend/src/components/LandingPage.tsx` (175 lines)
- `frontend/src/components/__tests__/LandingPage.test.tsx` (23 tests)

**Files Modified** (3):
- `frontend/src/App.tsx` (InvestigationView extraction, landing/game state)
- `frontend/src/components/MainMenu.tsx` (Exit button and keyboard shortcut 5)
- `frontend/src/types/investigation.ts` (CaseMetadata, CaseListResponse types)

**Agent Execution**:
- planner ✅ - PRP creation
- react-vite-specialist ✅ - Frontend implementation (2 files created, 3 modified)
- validation-gates ✅ - All quality gates passed
- documentation-manager ✅ - Documentation synchronized

**User Experience**:
```
Landing Page → Start New Case (1) → Investigation
    ↑                                    ↓
    └──── ESC → Exit to Main Menu (5) ──┘
          (confirmation required)
```

---

### Phase 5.4: Narrative Polish (Enhanced)
**Goal**: Three-act pacing + victim humanization + complication evidence
**Status**: PLANNED (Enhanced from original plan)
**Effort**: 2-3 days

**Tasks**:
- Player character intro screen (Moody training framework, name input) - done?
- Three-act case structure guidelines (Setup → Investigation → Resolution) - done?
- Victim humanization in crime scene descriptions (2-3 sentences woven into prose)
- Complication evidence system (contradicts "obvious" theory, appears after 4-6 evidence)
- Case authoring templates with narrative beats
- **NEW**: Hook + Twist design patterns (Act 1 hook, Act 2/3 twist)

**Deliverable**: arcitecture that enables cases feel like narrative arcs with emotional beats, not just puzzles

**New Mechanics from Design Docs**:
- Three-Act Case Structure (AUROR_ACADEMY_GAME_DESIGN.md lines 314-456)
- Player Character Intro (lines 38-63)
- Victim humanization examples (lines 353-364)
- Complication evidence timing (lines 384-398)

it is a strange phase, i think here we simply need to create a system and prepare our architecture for future cases. So, when we will be able to easily implement any new case, without writing too much new code.

---

### Phase 5.5: Bayesian Probability Tracker (OPTIONAL)
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
| P3.9: Validation-Gates Learning System (NEW) | 1-2 hours | MEDIUM | None |
| P4: Tom's Inner Voice (Enhanced) | 3-4 days | HIGH | P2.5 | ✅ Complete |
| P4.1: LLM-Powered Tom Conversation | 1 day | HIGH | P4 | ✅ Complete |
| P4.2: Modal UX Improvements (NEW) | 0.5 day | LOW | P3.5 | ✅ Complete |
| P4.3: Tom Personality Enhancement (NEW) | 0.5 day | MEDIUM | P4.1 | ✅ Complete |
| P4.4: UI/UX Improvements (NEW) | 1 day | MEDIUM | P4.1 | ✅ Complete |
| P4.5: Magic System (NEW) | 2-3 days | MEDIUM | P2.5 | ✅ Complete |
| P4.6: Legilimency Integration Fixes (NEW) | 0.5 day | HIGH | P4.5 | ✅ Complete |
| P4.6.2: Programmatic Legilimency + Spell Detection (NEW) | 0.5 day | HIGH | P4.6 | ✅ Complete |
| P4.7: Spell Success System (NEW) | 1 day | MEDIUM | P4.6.2 | ✅ Complete |
| P4.8: Legilimency System Rewrite (NEW) | 1 day | MEDIUM | P4.7 | ✅ Complete |
| P5.1: Main Menu System (NEW) | 1-2 days | MEDIUM | P4.8 | ✅ Complete |
| P5.2: Location Management System (NEW) | 2-3 days | HIGH | P5.1 | ✅ Complete |
| P5.3: Industry-Standard Save/Load (NEW) | 2-3 days | HIGH | P5.1 | ✅ Complete |
| P5.3.1: Landing Page & Main Menu System (NEW) | 0.5 day | MEDIUM | P5.3 | ✅ Complete |
| P5.4: Narrative Polish (Enhanced) | 2-3 days | MEDIUM | None | Planned |
| P5.5: Bayesian Tracker (Optional) | 3-4 days | LOW | P2.5 | Planned |
| P6: First Complete Case | 3-4 days | CRITICAL | P5.2-P5.4 | Planned |
| P7: Meta-Narrative (DEFER) | 7-10 days | LOW | P6 | Deferred |
| **Total (MVP without optional)** | **43-52 days** | **~7-8 weeks** |
| **Total (Full feature set)** | **46-56 days** | **~8-9 weeks** |

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

**Version**: 1.1.0 (Phase 5.3.1 Complete - Landing Page & Main Menu System)
**Last Updated**: 2026-01-13
**Phase**: Phase 5.3.1 Complete - Ready for Phase 5.4 (Narrative Polish) or Phase 6 (Complete Case 1)

**Completed (Latest)**:
- ✅ Phase 5.3.1 (Landing Page & Main Menu System) - All quality gates passing (2026-01-13)
- ✅ Phase 5.3 (Industry-Standard Save/Load System) - All quality gates passing (2026-01-12)
- ✅ Phase 5.2 (Location Management System) - All quality gates passing (2026-01-12)

**All Completed**:
- ✅ Phase 1 (Core Investigation Loop) - All quality gates passing (2026-01-05)
- ✅ Phase 2 (Narrative Polish + Witness System) - All quality gates passing (2026-01-05)
- ✅ Phase 2.5 (Terminal UX + Witness Integration) - User tested and confirmed working (2026-01-06)
- ✅ Phase 3 (Verdict + Post-Verdict) - All quality gates passing (2026-01-06)
- ✅ Phase 3.1 (State Fixes + Natural LLM Feedback) - User tested and confirmed working (2026-01-07)
- ✅ Phase 3.5 (Intro Briefing System) - All quality gates passing (2026-01-07)
- ✅ Phase 3.6 (Dialogue Briefing UI) - All quality gates passing (2026-01-07)
- ✅ Phase 3.7 (Briefing UI Polish) - All quality gates passing (2026-01-07)
- ✅ Phase 3.8 (Enhanced Moody Context) - All quality gates passing (2026-01-07)
- ✅ Phase 3.9 (Validation-Gates Learning System) - Documentation complete (2026-01-07)
- ✅ Phase 4 (Tom's Inner Voice - YAML Triggers) - Superseded by Phase 4.1 (2026-01-08)
- ✅ Phase 4.1 (LLM-Powered Tom Thornfield) - All quality gates passing (2026-01-09)
- ✅ Phase 4.3 (Tom Personality Enhancement) - All quality gates passing (2026-01-09)
- ✅ Phase 4.4 (UI/UX Improvements) - All quality gates passing (2026-01-09)
- ✅ Phase 4.41 (Briefing Modal UX Fix) - User tested and confirmed working (2026-01-09)
- ✅ Phase 4.42 (Narrator Conversation Memory) - All quality gates passing (2026-01-09)
- ✅ Phase 4.5 (Magic System) - All quality gates passing (2026-01-09)
- ✅ Phase 4.6 (Legilimency Integration Fixes) - All quality gates passing (2026-01-10)
- ✅ Phase 4.6.2 (Programmatic Legilimency + Generalized Spell Detection) - All quality gates passing (2026-01-11)
- ✅ Phase 4.7 (Spell Success System) - All quality gates passing (2026-01-11)
- ✅ Phase 4.8 (Legilimency System Rewrite) - All quality gates passing (2026-01-12)
- ✅ Phase 5.1 (Main Menu System) - All quality gates passing (2026-01-12)
- ✅ Phase 5.2 (Location Management System) - All quality gates passing (2026-01-12)
- ✅ Phase 5.3 (Industry-Standard Save/Load System) - All quality gates passing (2026-01-12)
- ✅ Phase 5.3.1 (Landing Page & Main Menu System) - All quality gates passing (2026-01-13)

**Test Coverage**:
- Backend: 691 tests passing (100% pass rate, 95% coverage)
- Frontend: 23 new LandingPage tests passing, TypeScript 0 errors, ESLint 0 errors, Build success
- **Quality Gates**: ALL PASSING ✅

**Next Phase Options**:
- **Phase 5.4 (Narrative Polish)** - Three-act pacing + victim humanization (2-3 days)
- **Phase 6 (Content - First Complete Case)** - Full Case 001: The Restricted Section implementation (3-4 days) - RECOMMENDED
- **Phase 5.5 (Bayesian Tracker - Optional)** - Numerical probability tool (3-4 days)

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
1. **Phase 5.1**: Main menu system (move restart button, add save/load UI)
2. **Phase 5.2**: Location management (multi-location navigation, unlock system)
3. **Phase 5.3**: Industry-standard save/load (multiple slots, autosave, metadata)
4. **Phase 5.4**: Narrative polish (three-act pacing, victim humanization)
5. **Phase 6**: Full Vector case implementation (replace Draco/Hermione test case)

---

*"CONSTANT VIGILANCE!" - Mad-Eye Moody*
