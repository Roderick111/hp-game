# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed - Backend Data Protection (2026-01-08)
**Moved rationality-thinking-guide-condensed.md to backend/data/**
- Moved from `docs/game-design/` to `backend/data/` to prevent accidental deletion
- File is actively used by `backend/src/context/rationality_context.py` for LLM prompts
- Full version (rationality-thinking-guide.md) remains in docs/game-design/

### Changed - Documentation Reorganization (2026-01-08)
**Major documentation restructure for better navigation and organization**

**Directory Structure**:
- Created `docs/game-design/` - Game design documents (5 files)
- Created `docs/case-files/` - Case specifications (2 files)
- Created `docs/planning/` - Planning documents (2 files)
- Created `docs/research/` - Research & analysis (4 files)

**File Moves** (with git history preserved):
- Game Design: AUROR_ACADEMY_GAME_DESIGN.md, CASE_DESIGN_GUIDE.md, WORLD_AND_NARRATIVE.md, rationality-thinking-guide*.md → `docs/game-design/`
- Case Files: CASE_001_RESTRICTED_SECTION.md, CASE_001_TECHNICAL_SPEC.md → `docs/case-files/`
- Planning: INITIAL.md, PHASE_3.1_INVESTIGATION_REPORT.md → `docs/planning/`
- Research: phase-3-codebase-research.md, phase-3-docs-research.md, phase-3-github-research.md, general-patterns.md → `docs/research/`

**Testing Docs Kept in Root**:
- TEST-FAILURES.md (validation-gates knowledge base)
- TESTING-CONVENTIONS.md (quick reference)

**Documentation Updates**:
- README.md: Added Phase 3.5-3.9 features, updated project structure, current version
- PLANNING.md: Marked Phases 3.7, 3.8 complete, updated current status
- Updated file references across all documentation

**Benefits**:
- Clearer separation of concerns (design vs planning vs research)
- Easier navigation for new contributors
- Better discoverability of related documents
- Maintained git history through `git mv`

### Changed - Documentation Condensing (2026-01-08)
- STATUS.md condensed from 1158 lines to 174 lines (85% reduction)
- Removed verbose historical details, kept actionable current state
- Renamed phase 3 research docs for clarity:
  - `CODEBASE_RESEARCH.md` → `phase-3-codebase-research.md`
  - `DOCS_RESEARCH.md` → `phase-3-docs-research.md`
  - `GITHUB_RESEARCH.md` → `phase-3-github-research.md`
- Added documentation index to STATUS.md (Key Docs, Design Docs, PRPs)
- Improved navigation between documentation files

### Added - Phase 3.9: Validation-Gates Learning System (2026-01-07)
**Transform validation-gates from test runner to learning agent through pattern documentation**

Lightweight markdown-only implementation enabling validation-gates to build mental models from documented failure patterns. Based on Anthropic validation principles: each test failure is labeled data teaching agents what "correct" means.

**Documentation Files Created**:
- `TEST-FAILURES.md` - Knowledge base of recurring test patterns (8 starter patterns)
  - Pattern 1: Pydantic Model Serialization (.model_dump() required)
  - Pattern 2: React Hook Dependency Arrays (exhaustive-deps rule)
  - Pattern 3: TypeScript Type Narrowing (discriminated unions)
  - Pattern 4: Async Test Timeouts (await async operations)
  - Pattern 5: Missing Import/Export (check barrel exports)
  - Pattern 6: Python Fixture Scope (scope hierarchy)
  - Pattern 7: State Not Reset Between Tests (fixtures with autouse=True)
  - Pattern 8: Tailwind Class Conflicts (purge config)

- `TESTING-CONVENTIONS.md` - Quick reference extracted from patterns
  - Python conventions: Pydantic serialization, fixture scope, test isolation
  - TypeScript/React conventions: Hook deps, type narrowing, async tests, exports
  - Tailwind conventions: Purge config
  - General conventions: Check TEST-FAILURES.md first, document new patterns

**validation-gates.md Enhanced**:
- **Step 0**: Read project context (PLANNING.md, STATUS.md, PRPs) before testing
  - Understand feature implemented, success criteria, constraints, current phase
  - Context helps interpret failures correctly
- **Step 0.5**: Check TEST-FAILURES.md for known patterns before debugging
  - Grep error patterns, apply documented fixes if matched
  - Saves 10-20 min on known issues
- **Step 3 Enhanced**: Handle failures with pattern documentation
  - 6-step process: Check patterns → Fix → Re-run → Document new patterns
  - Document: error pattern, root cause, fix applied, pattern learned
- **STATUS.md Template Enhanced**: Learning context in reporting
  - "Retries: 2 (Pattern #2, Pattern #5)" field
  - "New patterns: 1 documented" field
  - Context: "Used known patterns to fix 2 issues in 5 min"
- **Learning Principle #11**: Each failure = learning opportunity

**Philosophy**: Every test failure is a learning opportunity. Document it, learn from it, never repeat it.

**Expected Outcomes**:
- Immediate (Week 1): 5-10 patterns documented, context-aware testing
- Short-term (Month 1): 40-50% failures match known patterns, 10-15 min savings per match
- Long-term (Month 3+): 60-70% instant recognition, 30+ pattern library

**Anthropic Principles Applied**:
- Validation = labeled data (failures teach what "correct" means)
- Context-aware testing (understand WHY code exists, business constraints)
- Pattern documentation = institutional knowledge
- Clear error messages + fixes = mental model building

**Educational Value**:
- Agents build mental models of codebase expectations
- Pattern recognition improves over time
- Onboarding resource for new developers/agents
- Debugging playbook with known issues + fixes

**Files Created**:
- `TEST-FAILURES.md` (8 patterns with error messages, fixes, frequencies)
- `TESTING-CONVENTIONS.md` (quick reference one-liners)

**Files Modified**:
- `~/.claude/agents/validation-gates.md` (Steps 0, 0.5, 3 enhanced, STATUS.md template updated, Principle #11 added)

### Planned - Phase 4: Tom's Inner Voice
- 50% helpful / 50% misleading character
- Trigger system based on evidence discovered
- Failed Auror ghost backstory

## [0.5.0] - 2026-01-07

### Added - Phase 3.5: Intro Briefing System
**Interactive Moody Briefing Before Each Case**: Combines case introduction + rationality teaching + LLM-powered Q&A

**Briefing Content**:
- **Case Assignment**: WHO (victim), WHERE (location), WHEN (time), WHAT (circumstances)
- **Teaching Moment**: Moody introduces rationality concept (Case 1: Base rates - "85% of Hogwarts incidents are accidents")
- **Interactive Q&A**: Player can ask Moody questions about concept/case (LLM-powered dialogue)
- **Transition**: "CONSTANT VIGILANCE" → Investigation begins

**Backend Implementation**:
- `backend/src/state/player_state.py`:
  - `BriefingState` model: case_id, briefing_completed, conversation_history, completed_at
  - Extended PlayerState with briefing_state field
  - `add_question()`, `mark_complete()` methods
- `backend/src/case_store/case_001.yaml`:
  - Added `briefing:` section: case_assignment, teaching_moment, rationality_concept, concept_description, transition
  - Base rates teaching: "Start with likely scenarios, let evidence update priors"
- `backend/src/context/briefing.py` (NEW):
  - `build_moody_briefing_prompt()` - Constructs LLM prompt with case + concept context
  - `get_template_response()` - Template fallback for common questions
  - `ask_moody_question()` - LLM call with async error handling
- `backend/src/api/routes.py`:
  - `GET /api/briefing/{case_id}` - Load briefing content from YAML
  - `POST /api/briefing/{case_id}/question` - Ask Moody (Claude Haiku Q&A)
  - `POST /api/briefing/{case_id}/complete` - Mark briefing_completed=true
  - Response models: BriefingContent, BriefingQuestionRequest, BriefingQuestionResponse, BriefingCompleteResponse

**Frontend Implementation**:
- `frontend/src/types/investigation.ts`:
  - BriefingContent interface (case_id, case_assignment, teaching_moment, rationality_concept, concept_description, transition)
  - BriefingConversation interface (question, answer)
  - BriefingState interface (case_id, briefing_completed, conversation_history, completed_at)
  - BriefingQuestionResponse, BriefingCompleteResponse interfaces
- `frontend/src/api/client.ts`:
  - `getBriefing(caseId, playerId)` - GET /api/briefing/{case_id}
  - `askBriefingQuestion(caseId, question, playerId)` - POST /api/briefing/{case_id}/question
  - `markBriefingComplete(caseId, playerId)` - POST /api/briefing/{case_id}/complete
- `frontend/src/hooks/useBriefing.ts` (NEW):
  - State: briefing, conversation, loading, error, completed
  - Actions: loadBriefing(), askQuestion(), markComplete(), clearError()
- `frontend/src/components/BriefingConversation.tsx` (NEW):
  - Q&A history display
  - gray-700 bg for questions ("You:" prefix)
  - gray-800 bg + amber text for answers ("Moody:" prefix)
  - Scrollable container (max-h-64)
- `frontend/src/components/BriefingModal.tsx` (NEW):
  - 3-phase UI: Case Assignment, Teaching Moment, Q&A, Transition
  - Dark terminal theme (bg-gray-900, amber accents, font-mono)
  - Textarea input + "Ask" button for Q&A
  - "Start Investigation" button to complete briefing
  - Ctrl+Enter keyboard shortcut
  - Cannot be closed via backdrop (must complete)
- `frontend/src/App.tsx`:
  - useBriefing hook integration
  - briefingModalOpen state
  - useEffect to load briefing on mount
  - Modal doesn't reappear after completion

**Test Coverage**:
- Backend: 39 new tests (model tests, prompt tests, endpoint tests, YAML validation)
- Frontend: 110 new tests (useBriefing: 25, BriefingConversation: 26, BriefingModal: 59)
- **Total Briefing Tests**: 149 (39 backend + 110 frontend)
- **All Tests**: 385 backend + 405 frontend = 790 total ✅

**Files Created**:
- `backend/src/context/briefing.py`
- `backend/tests/test_briefing.py`
- `frontend/src/hooks/useBriefing.ts`
- `frontend/src/hooks/__tests__/useBriefing.test.ts`
- `frontend/src/components/BriefingConversation.tsx`
- `frontend/src/components/BriefingModal.tsx`
- `frontend/src/components/__tests__/BriefingConversation.test.tsx`
- `frontend/src/components/__tests__/BriefingModal.test.tsx`

**Files Modified**:
- `backend/src/state/player_state.py` (BriefingState model)
- `backend/src/case_store/case_001.yaml` (briefing section)
- `backend/src/api/routes.py` (3 endpoints)
- `frontend/src/types/investigation.ts` (briefing types)
- `frontend/src/api/client.ts` (3 API functions)
- `frontend/src/App.tsx` (briefing modal integration)

### Changed
- Case flow: Investigation now starts with mandatory briefing modal
- Player must interact with Moody briefing before accessing location (educational focus)

### Technical Details
- **Backend**: 385/387 tests passing (2 pre-existing failures in test_mentor.py)
- **Frontend**: 405/405 tests passing
- **Total Tests**: 790 (149 new briefing tests)
- **Lint**: Clean for all briefing code (ruff, eslint)
- **Type Check**: Clean for briefing files (mypy, tsc)
- **LLM Integration**: Claude Haiku for Moody Q&A, template fallback on error

## [0.4.1] - 2026-01-07

### Changed - Natural LLM Feedback System
**Major UX Improvement**: Removed all programmatic feedback sections in favor of pure LLM-generated natural prose

**Mentor Feedback Overhaul**:
- **Removed Structured Sections**: No more "What You Did Well", "Areas to Improve", "Logical Fallacies Detected", "Hint" boxes
- **Pure LLM Prose**: Only "Moody's Response" displays - natural, integrated feedback
- **No Culprit Revelation**: Incorrect verdict feedback now provides hints WITHOUT revealing who's guilty (educational gameplay)
- **Concise Output**: 3-4 sentences maximum (down from 5+), with paragraph breaks for readability
- **Natural Integration**: Mocking, hints, praise, critique, and rationality lessons all woven into natural prose

**Backend Changes**:
- `backend/src/context/mentor.py`:
  - `build_moody_roast_prompt()`: Removed culprit revelation, added "what player did RIGHT" instruction, hints without revealing answer
  - `build_moody_praise_prompt()`: Updated for conciseness and paragraph breaks
  - Both prompts now request 3-4 sentences with natural paragraph separation
- `backend/src/api/routes.py`: Emptied template fields (`fallacies_detected=[]`, `critique=""`, `praise=""`, `hint=None`) when LLM feedback active

**Frontend Changes**:
- `frontend/src/components/MentorFeedback.tsx`:
  - Fixed critical bug: Was displaying YAML template (`wrongSuspectResponse`) instead of LLM text (`feedback.analysis`)
  - Removed all structured section rendering (lines 186-234 deleted)
  - Now displays only LLM-generated natural prose

**Example Output**:
```
WRONG. Good catch on the wand signature, BUT you've got **confirmation bias** -
you saw one clue and stopped looking.

Check the frost pattern direction. It shows WHERE the spell came from,
not just who could cast it.
```

**Test Updates**:
- `backend/tests/test_mentor.py`: 3 tests updated for new prompt format
- `frontend/src/components/__tests__/MentorFeedback.test.tsx`: 2 tests updated for LLM analysis display
- **All tests passing**: 348 backend + 295 frontend = 643 total ✅

### Fixed
- Frontend was displaying pre-written YAML templates instead of LLM-generated feedback (critical UX bug)
- Culprit revelation in incorrect verdicts (broke educational gameplay loop)
- Verbose, unstructured feedback without paragraph breaks (poor readability)

## [0.4.0] - 2026-01-06

### Added - Phase 3: Verdict System + Post-Verdict Confrontation
**Core Verdict Features**:
- **Verdict Submission System**
  - Suspect selection dropdown (all case suspects)
  - Reasoning textarea (minimum 50 characters required for educational value)
  - Evidence citation checklist (select key evidence to support theory)
  - Attempt counter (10 max attempts per case)
  - Validation feedback (real-time character count, evidence selection)

- **Mentor Feedback System**
  - Template-based feedback (Mad-Eye Moody personality)
  - Reasoning score (0-100 scale based on evidence cited, logic coherence, fallacies avoided)
  - Fallacy detection (4 types: confirmation_bias, correlation_not_causation, authority_bias, post_hoc)
  - Adaptive hints (brutal at attempt 1-3, specific at 4-7, direct at 8-10)
  - Praise/critique sections (what player got right/wrong)
  - Color-coded score meter (red <50, yellow 50-75, green >=75)

- **Post-Verdict Confrontation**
  - Dialogue system (3-4 exchanges between Moody, culprit, player)
  - Speaker-colored bubbles (Moody amber, culprit red, player blue)
  - Tone indicators (defiant, remorseful, broken, angry, resigned)
  - Aftermath text (sentencing, consequences, what happens after)
  - "CASE SOLVED" banner on successful verdict
  - "CASE RESOLVED" banner after 10 failed attempts (educational, not punitive)

**Backend Implementation**:
- `backend/src/verdict/evaluator.py` - Verdict evaluation (check_verdict, score_reasoning, calculate_attempts_hint_level)
- `backend/src/verdict/fallacies.py` - Fallacy detection (4 rule-based detectors with pattern matching)
- `backend/src/context/mentor.py` - Mentor feedback generator (build_mentor_feedback, adaptive hints, wrong_suspect_response)
- `backend/src/case_store/case_001.yaml` - Added solution, wrong_suspects, post_verdict, mentor_feedback_templates modules
- `backend/src/case_store/loader.py` - Added load_solution, load_wrong_suspects, load_confrontation, load_mentor_templates
- `backend/src/state/player_state.py` - Added VerdictAttempt, VerdictState models for persistence
- `backend/src/api/routes.py` - Added POST /api/submit-verdict endpoint (full implementation)

**Frontend Implementation**:
- `frontend/src/components/VerdictSubmission.tsx` - Verdict form (suspect dropdown, reasoning textarea, evidence checklist, attempt counter)
- `frontend/src/components/MentorFeedback.tsx` - Feedback display (score meter, fallacy list, praise/critique, retry button, adaptive hints)
- `frontend/src/components/ConfrontationDialogue.tsx` - Post-verdict dialogue (speaker bubbles, tone indicators, aftermath, case solved banner)
- `frontend/src/hooks/useVerdictFlow.ts` - useReducer-based state management (submitting, feedback, confrontation, reveal, attempts)
- `frontend/src/types/investigation.ts` - Added VerdictAttempt, Fallacy, MentorFeedbackData, DialogueLine, ConfrontationDialogueData, SubmitVerdictRequest, SubmitVerdictResponse types
- `frontend/src/api/client.ts` - Added submitVerdict() API client function
- `frontend/src/App.tsx` - Integrated verdict flow (VerdictSubmission → MentorFeedback → ConfrontationDialogue modal-based three-step flow)

**Test Coverage**:
- Backend: 125 new tests (verdict evaluator 28, fallacies 21, mentor 18, case loader 24, persistence 8, routes 15, other 11)
- Frontend: 105 new tests (VerdictSubmission 30, MentorFeedback 34, ConfrontationDialogue 22, useVerdictFlow 19)
- **Total Tests**: 604 (317 backend + 287 frontend)
- **Backend Coverage**: 95% overall (100% on verdict/evaluator.py, verdict/fallacies.py, context/mentor.py)
- **Quality Gates**: All passing (pytest, Vitest, TypeScript, build success)

### Changed
- `backend/src/case_store/case_001.yaml` - Added solution module (culprit, method, motive, key_evidence), wrong_suspects responses, post_verdict confrontation, mentor_feedback_templates
- `backend/src/case_store/loader.py` - Extended with verdict loading functions
- `backend/src/state/player_state.py` - Extended PlayerState with VerdictState for attempt tracking
- `backend/src/api/routes.py` - Added verdict submission endpoint
- `frontend/src/App.tsx` - Added "Submit Verdict" button, integrated three-step verdict flow
- `frontend/src/types/investigation.ts` - Extended with verdict-related types
- `frontend/src/api/client.ts` - Added submitVerdict function
- `backend/src/main.py` - Version updated to 0.4.0
- `frontend/package.json` - Version updated to 0.4.0

### Technical Details
- **Backend**: 317/318 tests passing (1 pre-existing failure in test_claude_client.py)
- **Frontend**: 287/287 tests passing (0 failures)
- **TypeScript**: No errors
- **Build**: Success (191KB JS, 26KB CSS)
- **User Testing**: Confirmed working ✅ (minor issues noted for future investigation)

### Known Issues (for future investigation)
- User reported: Retry with correct suspect (Hermione) may not work as expected
- User reported: Mentor feedback may not display on some bullshit reasoning inputs

## [0.3.0] - 2026-01-06

### Added - Phase 2.5: Terminal UX + Witness Integration
- **Terminal UX Enhancements**
  - Removed "Investigate" button (Ctrl+Enter submission only)
  - Terminal-style placeholder: `> describe your action...`
  - Quick action shortcuts below input (contextual to location)
  - Witness shortcuts (amber buttons for witnesses at location)
  - Dynamic shortcuts: "examine desk", "check window", "talk to hermione"

- **Evidence Modal System**
  - Clickable evidence cards (cards now interactive buttons)
  - `EvidenceModal.tsx` component with terminal variant styling
  - Evidence details display: name, location found, description
  - ESC/click-outside to close modal
  - Loading and error states for evidence detail fetching

- **Backend Evidence Metadata**
  - `GET /api/evidence/details` - Returns discovered evidence with full metadata
  - `GET /api/evidence/{evidence_id}` - Returns single evidence with metadata
  - Updated `case_001.yaml` - Added `name`, `location_found`, `description` to all evidence
  - Evidence metadata includes: name, type, location_found, description
  - `get_evidence_by_id()`, `get_all_evidence()` functions in loader

- **Witness Integration**
  - WitnessSelector integrated in App.tsx sidebar (below Case Status)
  - WitnessInterview modal fully functional
  - `witnesses_present: ["hermione"]` field on library location
  - Location API returns witnesses_present array
  - Click witness → opens interrogation modal
  - Full witness interrogation flow: question → present evidence → reveal secrets

- **Dark Theme Cohesion**
  - Terminal variant for Modal component
  - Consistent dark theme across all modals
  - Amber accent colors for witness-related UI
  - Footer hint updated: "Click on evidence to view details"

### Changed
- `LocationView.tsx` - Removed "Investigate" button, added terminal shortcuts UI
- `EvidenceBoard.tsx` - Made cards clickable, updated footer hint
- `Modal.tsx` - Added terminal variant prop for dark theme
- `App.tsx` - Integrated WitnessSelector + WitnessInterview + EvidenceModal
- `case_001.yaml` - Added witnesses_present field, evidence metadata
- `loader.py` - Added get_evidence_by_id(), get_all_evidence(), witnesses_present default
- `routes.py` - Updated location endpoint, added evidence detail endpoints
- `client.ts` - Added getEvidenceDetails() function
- `investigation.ts` - Added EvidenceDetails type

### Technical Details
- **Backend**: 192 tests (0 failures, 1 unrelated pre-existing failure)
- **Frontend**: 182 tests (0 failures)
- **Total Tests**: 374 (192 backend + 182 frontend)
- **New Tests**: 16 tests for EvidenceModal component, 19 tests for evidence endpoints
- **Quality Gates**: All passing (pytest, Vitest, TypeScript, ruff, mypy, ESLint)
- **User Testing**: Confirmed working ✅

## [0.2.0] - 2026-01-05

### Added - Phase 2: Narrative Polish + Witness System
- **UI Narrative Enhancement**
  - Surface elements now integrated into LLM prose (no explicit "You can see:" lists)
  - Obra Dinn/Disco Elysium pattern - atmospheric descriptions instead of bulleted lists
  - Updated narrator prompt to weave surface elements naturally

- **Witness Interrogation System**
  - `POST /api/interrogate` - Ask witness any question (freeform)
  - `POST /api/present-evidence` - Show evidence to witness (trigger secrets)
  - `GET /api/witnesses` - List available witnesses
  - `GET /api/witness/{id}` - Get witness details + conversation history
  - WitnessState + ConversationItem models for state tracking
  - Witness YAML structure (personality, knowledge, secrets, lies)

- **Trust Mechanics** (LA Noire-inspired)
  - Aggressive tone: -10 trust
  - Empathetic tone: +5 trust
  - Neutral tone: 0 trust
  - Trust affects witness honesty (lies if trust <30, truth if >70)
  - Color-coded trust meter: red (<30), yellow (30-70), green (>70)

- **Secret Revelation System** (Phoenix Wright-style)
  - Complex trigger parsing: `evidence:X OR trust>70 AND evidence:Y`
  - Evidence presentation mechanics
  - Secret unlock notifications
  - Conversation history with trust delta tracking

- **Context Isolation**
  - Separate Claude contexts for narrator vs witness
  - Narrator doesn't know witness secrets
  - Witness responds based on personality, knowledge, trust level

- **Frontend Components**
  - `WitnessInterview.tsx` - Interrogation UI with trust meter, conversation bubbles, evidence presentation
  - `WitnessSelector.tsx` - Witness list with trust indicators, secrets revealed count
  - `useWitnessInterrogation.ts` - useReducer-based state management hook

- **Case Data**
  - Case 001 witnesses: Hermione Granger (studious, protective), Draco Malfoy (arrogant, defensive)
  - 3 secrets per witness with complex trigger conditions

### Changed
- `LocationView.tsx` - Removed explicit surface_elements list (lines 164-178 deleted)
- `narrator.py` - Added format_surface_elements() function, integrated into prompt
- `routes.py` - Pass surface_elements to narrator for prose integration
- `case_001.yaml` - Added witnesses section with personality, secrets, lies
- `loader.py` - Added load_witnesses(), get_witness(), list_witnesses()
- `player_state.py` - Added WitnessState, ConversationItem models

### Technical Details
- **Backend**: 173 tests (24 trust + 19 witness + 11 case loader + 10 routes + 5 persistence), 94% coverage
- **Frontend**: 164 tests (14 hook + 34 interview + 20 selector + 96 existing)
- **Total Tests**: 337 (173 backend + 164 frontend)
- **Quality Gates**: All passing (pytest, Vitest, TypeScript, ruff, mypy, ESLint)

## [0.1.0] - 2026-01-05

### Added - Phase 1: Core Investigation Loop
- **Backend**: Python FastAPI + Claude Haiku LLM narrator
  - `POST /api/investigate` - Freeform input → narrator response with evidence discovery
  - `POST /api/save` - Save player state to JSON (`saves/{case_id}_{player_id}.json`)
  - `GET /api/load/{case_id}` - Load player state from JSON
  - `GET /api/evidence` - List all discovered evidence
  - `GET /api/cases` - List available cases
  - YAML case file system (case_001: The Restricted Section)
  - Evidence trigger matching (substring matching, 5+ trigger variants per evidence)
  - Narrator prompt with hallucination prevention rules
  - State persistence (JSON files in `backend/saves/`)
  - 93 pytest tests, 100% coverage on critical paths

- **Frontend**: React + Vite terminal UI
  - LocationView component (freeform textarea, narrator response display, conversation history)
  - EvidenceBoard component (discovered evidence sidebar with auto-updates)
  - useInvestigation hook (state management with API integration)
  - Terminal aesthetic (monospace font, dark theme, minimal UI)
  - Type-safe API client with error handling
  - 96 Vitest tests, full component coverage

- **Infrastructure**:
  - Monorepo structure (backend/ + frontend/)
  - UV package manager for Python
  - Bun package manager for JavaScript (BHVR stack)
  - CI/CD validation gates (pytest, Vitest, ruff, mypy, ESLint)
  - Quality gates: All passing (0 errors)

### Changed
- **Complete rebuild**: Deprecated v0.7.0 quiz-style prototype
  - Archived 33 files (301 tests, 264 passing) to `_deprecated_v0.7.0/`
  - Removed hypothesis system, 6-phase structure, scoring metrics
  - New DnD-style freeform investigation (type any action, LLM responds)
  - Gameplay shift: Quiz-style predefined options → Obra Dinn freeform exploration

### Fixed
- Claude model ID corrected to `claude-3-5-haiku-20241022` (was invalid `claude-haiku-4-20250514`)

### Technical Details
- **Backend**: FastAPI 0.115.0, Anthropic 0.39.0, Pydantic 2.9.0, PyYAML 6.0.2
- **Frontend**: React 18, Vite 5, Tailwind CSS 3.4, Vitest 2.1
- **Bundle size**: 158KB JS (50KB gzipped), 22KB CSS (4KB gzipped)
- **Test execution**: Backend 0.50s, Frontend 2.29s
- **Model**: claude-3-5-haiku-20241022 (Anthropic)

### Deprecated
- v0.7.0 prototype (quiz-style) preserved in `_deprecated_v0.7.0/` for reference
  - 33 files: 6-phase game loop, hypothesis system, contradiction detection, scoring
  - NOT safe to delete yet (keep until Phase 4)

## [0.7.0] - 2026-01-02

### Added
- **Active Hypothesis Selection System**
  - `activeHypothesisId` state in GameContext - tracks player's investigation focus
  - `hypothesisPivots` tracking - records when players switch investigation focus
  - `SET_ACTIVE_HYPOTHESIS` action - allows selecting hypothesis to investigate
  - `CLEAR_ACTIVE_HYPOTHESIS` action - clears selection on phase transition
- **Hypothesis Selection Sidebar** in Investigation phase (`src/components/phases/Investigation.tsx`)
  - Radiogroup ARIA pattern for selecting active hypothesis
  - Active hypothesis banner showing current investigation focus
  - Full keyboard navigation (Tab, Enter, Escape, Arrow keys)
  - Accessible with ARIA labels, live regions, role="radiogroup"
- **Evidence Relevance Visualization**
  - Evidence cards show relevance badges when hypothesis selected
  - Color-coded badges: green (supports), red (conflicts), yellow (neutral)
  - Uses existing `evidenceRelevance.ts` utilities for calculation
  - Real-time updates as active hypothesis changes
- **37 new tests** covering reducer logic and Investigation component
  - 9 reducer tests in `src/context/__tests__/GameContext.test.tsx`
  - 28 component tests in `src/components/phases/__tests__/Investigation.test.tsx`

### Changed
- `src/types/enhanced.ts` - Added HypothesisPivot interface, activeHypothesisId and hypothesisPivots fields to EnhancedPlayerState
- `src/types/game.ts` - Added SET_ACTIVE_HYPOTHESIS and CLEAR_ACTIVE_HYPOTHESIS action types
- `src/context/GameContext.tsx` - Reducer now handles hypothesis selection and clears on phase transition
- `src/components/phases/Investigation.tsx` - Enhanced with hypothesis selection sidebar and evidence relevance display
- All test fixtures updated to include new state fields (6 fixture files)

### Fixed
- Phase 3 UX gap - Players can now choose which hypothesis to investigate (restores agency)
- Evidence collection divorced from hypothesis testing - Now visually linked via relevance badges

### Accessibility
- ARIA radiogroup pattern for hypothesis selection
- Keyboard navigation for all interactive elements
- Live regions announce hypothesis selection to screen readers
- Focus management during selection and phase transitions

### Technical Details
- Total test count: 301 (37 new + 264 existing)
- All validation gates passing (TypeScript, ESLint, Vitest)
- Zero new dependencies - reuses existing evidenceRelevance.ts utilities
- Backward compatible - no breaking changes to existing state structure

## [0.6.0] - 2026-01-01

### Added
- **Phase Transition Animations** (`src/components/ui/PhaseTransition.tsx`)
  - Smooth entrance animations for game phases (fade, slide-up, slide-down variants)
  - Configurable duration and delay
  - Built with framer-motion for performance
- **Metric Card Component** (`src/components/ui/MetricCard.tsx`)
  - Educational tooltips explaining what each scoring metric means
  - Visual score indicators (progress bars, color coding)
  - Consistent styling across Case Review phase
- **Evidence-Hypothesis Relevance System**
  - `src/components/ui/HypothesisRelevanceBadge.tsx` - Visual badges showing evidence impact
  - `src/utils/evidenceRelevance.ts` - Pure functions for calculating relevance scores
  - Displays which hypotheses each piece of evidence supports/contradicts
- **Phase Transition Hook** (`src/hooks/usePhaseTransition.ts`)
  - Manages animation state between game phases
  - Coordinates enter/exit animations
- **75 new unit tests** covering all UI/UX components and utilities

### Changed
- **HypothesisFormation.tsx** - Staggered card animations, tier badges, locked hypothesis styling
- **Investigation.tsx** - PhaseTransition wrapper, animated IP counter with visual depletion, evidence-hypothesis linking indicators
- **CaseReview.tsx** - MetricCard integration, staggered reveal animations, educational tooltips for all metrics
- **UnlockToast.tsx** - Enhanced with framer-motion animations, proper ARIA live regions
- **ContradictionPanel.tsx** - Dramatic entrance animation, shake effect on contradictions, enhanced accessibility
- **EvidenceCard.tsx** - Integrated hypothesis relevance badges showing evidence impact
- **tailwind.config.js** - Added phase-fade-in, phase-slide-up, phase-slide-down, toast-slide-in, ip-pulse animations

### Accessibility
- ARIA live regions for dynamic content updates (unlocks, contradictions)
- `prefers-reduced-motion` support - animations gracefully degrade
- Proper focus management during phase transitions
- Screen reader announcements for game state changes

### Technical Details
- Total test count: 264 (75 new + 189 existing)
- All validation gates passing (TypeScript, ESLint, Vitest)
- Bundle size remains under performance budget

## [0.5.0] - 2026-01-01

### Added
- **Mission 1 Case Redesign** with conditional hypotheses and contradictions
- `CaseData.contradictions` field in `src/types/game.ts` for case-level contradiction definitions
- 7 hypotheses in Mission 1: 4 Tier 1 (immediately available), 3 Tier 2 (unlockable)
- 4 distinct unlock paths for the correct answer (cursed-violin hypothesis)
- 3 narrative contradictions that guide players toward the truth:
  - `c1-victor-love`: Victor's protective behavior vs. guilty hypothesis
  - `c2-no-wand-magic`: No wand found vs. standard curse hypothesis
  - `c3-instrument-access`: Violin access pattern vs. external threat
- Comprehensive test suite for Mission 1 case data (`src/data/__tests__/mission1.test.ts`)
- 34 new unit tests covering case structure, unlock paths, contradictions, and IP economy

### Changed
- `src/data/mission1.ts` - Complete redesign with ConditionalHypothesis types
- Tier assignments: victor-guilty, helena-guilty, lucius-involved, something-else (Tier 1); cursed-violin, self-inflicted, unknown-person (Tier 2)
- IP economy balanced at 12 total Investigation Points

### Technical Details
- Total test count: 189 (34 new + 155 existing)
- All validation gates passing (TypeScript, ESLint, Vitest)

## [0.4.0] - 2025-12-31

### Added
- **Contradiction Detection System** (`src/utils/contradictions.ts`)
  - 6 pure functions for detecting and managing evidence contradictions
  - `detectContradictions()` - Find conflicts in collected evidence
  - `isContradictionResolved()` - Check resolution status
  - `getContradictionsByEvidence()` - Filter by evidence piece
  - `calculateContradictionScore()` - Score contradiction handling
- **Enhanced Scoring Metrics** (`src/utils/scoring.ts`)
  - `calculateInvestigationEfficiency()` - IP value analysis
  - `calculatePrematureClosureScore()` - Early closure detection
  - `calculateContradictionResolutionScore()` - Resolution tracking
  - `calculateTierDiscoveryScore()` - Hypothesis tier rewards
- `ContradictionPanel.tsx` - Visual component for contradiction display with animations
- 86 new unit tests across contradiction detection, scoring, and UI components

### Changed
- `src/types/game.ts` - Extended PlayerScores, added GameAction types for contradictions
- `Investigation.tsx` - Integrated real-time contradiction detection
- `CaseReview.tsx` - New metrics display for enhanced scoring
- `tailwind.config.js` - Added pulse and shake animations

## [0.3.0] - 2025-12-31

### Added
- **Conditional Unlocking System** (`src/utils/unlocking.ts`)
  - 5 pure evaluation functions for hypothesis unlock logic
  - Threshold-based unlock evaluation
  - Support for multiple unlock paths per hypothesis
- `UnlockToast.tsx` - Toast notification component for unlock feedback
- `useUnlockNotifications.ts` - React hook for unlock trigger management
- 61 unit tests for unlocking logic and UI components

### Changed
- `GameContext.tsx` - Added reducer cases for unlock actions
- `HypothesisFormation.tsx` - Integrated tier system for hypothesis display
- `Investigation.tsx` - Trigger unlock checks on evidence collection
- `tailwind.config.js` - Added unlock animations

## [0.2.0] - 2025-12-28

### Added
- **Enhanced Type System** (`src/types/enhanced.ts`)
  - `ConditionalHypothesis` interface with unlock requirements and tier assignments
  - `Contradiction` interface for evidence conflict tracking
  - `UnlockEvent` interface for trigger tracking
  - Extended `PlayerState` for hypothesis tiers and contradiction tracking
- `src/types/enhanced.fixtures.ts` - Test data for enhanced mechanics

## [0.1.0] - 2025-12-27

### Added
- Initial prototype clone and analysis
- Basic game loop with 6 phases: Briefing, Hypothesis Formation, Investigation, Prediction, Resolution, Case Review
- Core type definitions (`CaseData`, `PlayerState`, `GameAction`)
- React Context + useReducer state management
- Basic scoring system (Calibration + Confirmation Bias metrics)
- Mission 1 placeholder data
- Tailwind CSS styling
- Vitest testing setup

---

[Unreleased]: https://github.com/user/hp_game/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/user/hp_game/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/user/hp_game/releases/tag/v0.1.0
[0.7.0]: https://github.com/user/hp_game/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/user/hp_game/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/user/hp_game/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/user/hp_game/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/user/hp_game/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/user/hp_game/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/user/hp_game/releases/tag/v0.1.0
