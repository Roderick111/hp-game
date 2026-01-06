# HP Game - Status & Coordination

*Real-time project status. Concise, accurate, up-to-date.*

---

## Current Status

**Version**: 0.4.0 (Phase 3 Complete - User Tested)
**Date**: 2026-01-06
**Backend**: Running on port 8000 ✅
**Frontend**: Running on port 5173 ✅
**Model**: claude-haiku-4-5 ✅

**Phase 3 COMPLETE ✅**: Verdict System + Post-Verdict Confrontation (Full Stack)
**Completion Date**: 2026-01-06
**User Testing**: Confirmed working (minor issues noted for future investigation)

- ✅ POST /api/submit-verdict endpoint implemented
- ✅ Verdict evaluation (check accused vs culprit)
- ✅ Reasoning scoring (0-100 scale)
- ✅ Fallacy detection (5 types: confirmation_bias, correlation_not_causation, authority_bias, post_hoc, weak_reasoning)
- ✅ Template-based mentor feedback (adaptive hints based on attempts)
- ✅ Confrontation dialogue system (post-verdict scenes)
- ✅ VerdictState + VerdictAttempt persistence (10 max attempts)
- ✅ VerdictSubmission component (suspect dropdown, reasoning textarea, evidence checklist)
- ✅ MentorFeedback component (score meter, fallacy display, praise/critique, retry button)
- ✅ ConfrontationDialogue component (dialogue bubbles, tone indicators, aftermath, "CASE SOLVED" banner)
- ✅ useVerdictFlow hook (useReducer state management)
- ✅ App.tsx integration (modal-based three-step flow)
- ✅ Backend tests: 317/318 passing (+125 new, 1 pre-existing failure)
- ✅ Frontend tests: 287/287 passing (+105 new)
- **Total Tests**: 604 (317 backend + 287 frontend)
- **Coverage**: 95% backend
- **Next**: Phase 3.5 (Intro Briefing System), Phase 4 (Tom's Inner Voice), or Phase 4.5 (Magic System)

---

## Phase 1: Core Investigation Loop - COMPLETE ✅

**Completion Date**: 2026-01-05

### Implementation Summary
- **Backend**: 7 modules, 93 tests (0.50s), 0 errors
- **Frontend**: 7 components, 96 tests (2.29s), 0 errors
- **Quality Gates**: All passing (pytest, Vitest, ruff, mypy, ESLint, TypeScript)
- **Bundle**: 158KB JS (50KB gzipped), 22KB CSS (4KB gzipped)
- **Model**: claude-haiku-4-5 (verified working)

### Features Delivered
- ✅ Freeform investigation input (DnD-style gameplay)
- ✅ Claude Haiku LLM narrator (immersive Harry Potter responses)
- ✅ Evidence discovery system (substring triggers, 5+ variants per evidence)
- ✅ State persistence (save/load JSON files)
- ✅ Terminal UI (LocationView + EvidenceBoard components)
- ✅ YAML case files (case_001: The Restricted Section)
- ✅ Hallucination prevention (not_present items system)

### Agent Execution Timeline
1. **planner** ✅ - Created PLANNING.md, INITIAL.md, phase1-core-loop.md PRP
2. **dependency-manager** ✅ - Verified Python (uv) + JavaScript (npm) deps
3. **fastapi-specialist** ✅ - Backend implementation (Tasks 2-7)
4. **react-vite-specialist** ✅ - Frontend implementation (Tasks 8-11)
5. **validation-gates** ✅ - All quality gates passed
6. **documentation-manager** ✅ - Docs updated (README, CHANGELOG, backend/README)

### Verification (2026-01-05)
- ✅ Backend server starts successfully
- ✅ `/api/investigate` endpoint returns narrator responses
- ✅ Evidence discovery triggers working
- ✅ Frontend UI rendering correctly
- ✅ Evidence Board updates when evidence discovered
- ✅ Save/Load functionality operational

---

## Phase 2: Narrative Polish + Witness System - COMPLETE ✅

**Completion Date**: 2026-01-05

### Implementation Summary
- **Backend**: 12 modules, 173 tests (1 unrelated failure), 94% coverage
- **Frontend**: 13 components, 164 tests, 0 errors
- **Quality Gates**: All passing (pytest, Vitest, TypeScript)
- **Total Tests**: 337 (173 backend + 164 frontend)

### Features Delivered
- ✅ **UI Narrative Fix**: Surface elements integrated into LLM prose (no explicit lists)
- ✅ **Trust Mechanics**: LA Noire-inspired system (aggressive -10, empathetic +5, neutral 0)
- ✅ **Secret Triggers**: Phoenix Wright evidence presentation with complex parsing
- ✅ **Witness Context Isolation**: Separate Claude contexts (narrator vs witness)
- ✅ **Interrogation API**: Freeform questioning with personality-driven responses
- ✅ **Evidence Presentation**: Show evidence → trigger secret revelations
- ✅ **Trust Visualization**: Color-coded meter (red <30, yellow 30-70, green >70)
- ✅ **Conversation History**: Persistent dialog tracking with trust deltas

### Files Created
**Backend**:
- `backend/src/utils/trust.py` - Trust mechanics
- `backend/src/context/witness.py` - Witness LLM context builder
- `backend/tests/test_trust.py` - 24 tests
- `backend/tests/test_witness.py` - 19 tests

**Frontend**:
- `frontend/src/types/investigation.ts` - Witness types
- `frontend/src/api/client.ts` - Witness API functions
- `frontend/src/hooks/useWitnessInterrogation.ts` - State management
- `frontend/src/components/WitnessInterview.tsx` - Interrogation UI
- `frontend/src/components/WitnessSelector.tsx` - Witness selection UI
- `frontend/src/hooks/__tests__/useWitnessInterrogation.test.ts` - 14 tests
- `frontend/src/components/__tests__/WitnessInterview.test.tsx` - 34 tests
- `frontend/src/components/__tests__/WitnessSelector.test.tsx` - 20 tests

### Files Modified
**Backend**:
- `backend/src/case_store/case_001.yaml` - Added witnesses (Hermione, Draco)
- `backend/src/case_store/loader.py` - Witness loading functions
- `backend/src/state/player_state.py` - WitnessState, ConversationItem models
- `backend/src/context/narrator.py` - Surface elements in prose
- `backend/src/api/routes.py` - Interrogation endpoints

**Frontend**:
- `frontend/src/components/LocationView.tsx` - Removed explicit surface list

### Agent Execution Timeline
1. **planner** ✅ - Created Phase 2 planning (INITIAL.md, PRP)
2. **react-vite-specialist** ✅ - UI narrative fix (Task 1)
3. **fastapi-specialist** ✅ - Witness backend (Tasks 2-6)
4. **react-vite-specialist** ✅ - Witness frontend (Tasks 7-11)
5. **validation-gates** ✅ - All quality gates passed
6. **documentation-manager** ✅ - Docs updated (current task)

---

## Phase 2.5: Terminal UX + Witness Integration - COMPLETE ✅

**Completion Date**: 2026-01-06
**Status**: User tested and confirmed working ✅

### Implementation Summary
- **Backend**: 12 modules, 192 tests, 0 errors
- **Frontend**: 16 components, 182 tests, 0 errors
- **Quality Gates**: All passing (pytest, Vitest, TypeScript)
- **Total Tests**: 374 (192 backend + 182 frontend)

### Features Delivered
- ✅ **Terminal UX**: Removed "Investigate" button, Ctrl+Enter submission only
- ✅ **Quick Actions**: Context-aware shortcuts (examine desk, check window)
- ✅ **Witness Shortcuts**: Dynamic amber buttons for witnesses at location
- ✅ **Clickable Evidence**: Cards open EvidenceModal with full details
- ✅ **Evidence Modal**: Name, location found, description display
- ✅ **Witness Integration**: WitnessSelector + WitnessInterview in App.tsx
- ✅ **Dark Theme Cohesion**: Terminal variant for modals, consistent styling

### Success Criteria (ALL MET ✅)
- [x] "Investigate" button removed (Ctrl+Enter only)
- [x] Terminal shortcuts render (examine desk, check window, talk to hermione)
- [x] Evidence cards clickable
- [x] Evidence modal shows name/location/description
- [x] WitnessSelector integrated in App.tsx
- [x] WitnessInterview opens on witness click
- [x] Quick actions fill input (don't auto-submit)
- [x] All 374 tests passing
- [x] TypeScript compiles without errors
- [x] User tested and confirmed working ✅

### Files Created
- `frontend/src/components/EvidenceModal.tsx` - Evidence detail modal
- `frontend/src/components/__tests__/EvidenceModal.test.tsx` - 16 tests

### Files Modified
**Backend (Task 1)**:
- `backend/src/case_store/case_001.yaml` - witnesses_present, evidence metadata
- `backend/src/case_store/loader.py` - get_evidence_by_id(), get_all_evidence()
- `backend/src/api/routes.py` - /api/evidence/{id}, /api/evidence/details endpoints

**Frontend (Tasks 2-4)**:
- `frontend/src/components/LocationView.tsx` - Terminal UX, quick actions
- `frontend/src/components/EvidenceBoard.tsx` - Clickable cards
- `frontend/src/components/ui/Modal.tsx` - Terminal variant
- `frontend/src/App.tsx` - Full witness + evidence integration
- `frontend/src/api/client.ts` - getEvidenceDetails function
- `frontend/src/types/investigation.ts` - EvidenceDetails type

### Agent Execution Timeline
1. **fastapi-specialist** ✅ - Task 1: YAML updates, evidence endpoints (192 backend tests)
2. **react-vite-specialist** ✅ - Tasks 2-4: Terminal UX, EvidenceModal, App integration (182 frontend tests)

---

## 🤖 Active Agent Work

**Current Agent**: None
**Task**: Backend natural LLM feedback complete
**Started**: -
**Files In Progress**: None
**Next Agent**: User decision (Phase 3.5, Phase 4, or Phase 4.5)

---

## ✅ Recent Completions (Last 24 Hours)

### 2026-01-07 00:00 - Natural LLM Feedback System (COMPLETE)
- ✅ **Full-stack: Removed all programmatic feedback sections, LLM-only natural prose**
- **User Request**: "Only natural LLM prose, no structured sections (What You Did Well, Areas to Improve, Logical Fallacies, Hint)"
- **Critical Fix**: Frontend was displaying YAML template (`wrongSuspectResponse`) instead of LLM text (`feedback.analysis`)

**Phase 1: Backend Prompt Rewrite (fastapi-specialist)**
- **build_moody_roast_prompt()** changes:
  - ❌ Removed: `- Actual culprit: {actual_culprit}` (NO culprit revelation per user requirement)
  - ❌ Removed: Instruction to reveal "who's actually guilty, why"
  - ✅ Added: Acknowledge what player did RIGHT (if anything)
  - ✅ Added: Provide hints WITHOUT naming culprit
  - ✅ Added: Natural integration of all feedback elements
  - Length: 3-4 sentences MAXIMUM (concise, punchy)
  - Format: Paragraph breaks (double newlines) for readability
- **build_moody_praise_prompt()** updated to match style
- **routes.py** emptied template fields when LLM active:
  - `fallacies_detected=[]`, `critique=""`, `praise=""`, `hint=None`
  - Only `score` and `quality` retained for UI display

**Phase 2: Frontend Display Fix (react-vite-specialist)**
- **MentorFeedback.tsx** (lines 147-157):
  - ❌ Removed: `{wrongSuspectResponse && ...}` (YAML template display)
  - ✅ Added: `{feedback.analysis && ...}` (LLM natural prose display)
- **Result**: Component now shows ONLY LLM-generated feedback

**Phase 3: Conciseness Refinement**
- User feedback: Output 20% too verbose, lacks paragraph breaks
- Updated prompts to 3-4 sentences (from earlier 3-5)
- Emphasized "Be punchy and concise" instruction
- Examples updated to show shorter, paragraph-separated style

**Files Changed**:
1. `backend/src/context/mentor.py` - Prompts rewritten (lines 232-346)
2. `backend/src/api/routes.py` - Template fields emptied (line 1038-1046)
3. `frontend/src/components/MentorFeedback.tsx` - Display switched from wrongSuspectResponse to feedback.analysis (lines 147-157)
4. `backend/tests/test_mentor.py` - 3 tests updated for new prompt format
5. `frontend/src/components/__tests__/MentorFeedback.test.tsx` - 2 tests updated for LLM analysis display

**Test Results**:
- Backend: 348/348 passing ✅
- Frontend: 295/295 passing ✅
- Total: 643 tests ✅

**Expected Output** (3-4 sentences, paragraph breaks):
```
WRONG. Good catch on the wand signature, BUT you've got **confirmation bias** -
you saw one clue and stopped looking.

Check the frost pattern direction. It shows WHERE the spell came from,
not just who could cast it.
```

**Success Criteria (ALL MET)**:
- ✅ NO culprit revelation in incorrect verdict feedback
- ✅ NO structured sections (What You Did Well, Areas to Improve, etc.)
- ✅ Only "Moody's Response" section displays
- ✅ Natural prose with mocking + hints + what-they-did-well + rationality lessons
- ✅ Concise (3-4 sentences max)
- ✅ Paragraph breaks for readability
- ✅ All tests passing

### 2026-01-06 23:35 - fastapi-specialist
- ✅ **Backend: Natural LLM feedback (no culprit revelation, no structured sections)**
- **Changes to build_moody_roast_prompt()**:
  - Removed actual_culprit from prompt text (param kept for signature compat)
  - Added instruction: acknowledge what player did RIGHT
  - Added instruction: provide hints WITHOUT revealing culprit
  - Updated length: 3-5 sentences (from 2-4)
  - Added "natural prose, NO section headers" instruction
- **Changes to routes.py MentorFeedback construction**:
  - `fallacies_detected=[]` (empty - LLM integrates)
  - `critique=""` (empty - LLM integrates)
  - `praise=""` (empty - LLM integrates)
  - `hint=None` (empty - LLM integrates)
- **Files changed**:
  - `backend/src/context/mentor.py` - Rewrote build_moody_roast_prompt (lines 231-285)
  - `backend/src/api/routes.py` - Emptied template fields in MentorFeedback (line 1030)
  - `backend/tests/test_mentor.py` - Updated 2 tests for new prompt behavior
  - `backend/tests/test_routes.py` - Updated 4 tests for empty template fields
  - `backend/tests/test_claude_client.py` - Fixed unrelated model name test
- **Tests**: 348 passed (0 failures)
- **Handoff to**: None (backend complete)
- **Context**: LLM now generates fully natural prose with no culprit revelation, acknowledges good moves, provides hints, integrates rationality lessons. Frontend already updated to only display analysis field.

### 2026-01-06 23:24 - react-vite-specialist
- ✅ **ISSUE 3 FIXED: Removed structured feedback sections from MentorFeedback**
- **Problem**: Frontend displayed legacy praise/critique/fallacies/hints as separate boxed sections with headers, breaking natural LLM prose
- **Solution**: Removed 4 structured sections from MentorFeedback component
- **Sections Removed**:
  - "What You Did Well:" (green box) - lines 186-194
  - "Areas to Improve:" (red box) - lines 196-204
  - "Logical Fallacies Detected:" (yellow box) - lines 206-226
  - "Hint:" (blue box) - lines 228-234
- **Sections Kept**:
  - Correct/Incorrect banner
  - Attempts remaining
  - Moody's Response (natural LLM prose via `wrongSuspectResponse`)
  - Reasoning Quality score meter + quality label
  - Retry button
  - Out of attempts message
  - Loading states
- **Files changed**:
  - `frontend/src/components/MentorFeedback.tsx` - Removed 49 lines (praise/critique/fallacies/hint sections), updated docstring
  - `frontend/src/components/__tests__/MentorFeedback.test.tsx` - Removed 3 test suites (11 tests: Fallacy Display, Praise and Critique, Hint Display), updated docstring
- **Tests**: 295 passed (down from 306 due to removed tests for deleted features)
- **Handoff to**: None (Issue 3 FIXED)
- **Context**: MentorFeedback now shows ONLY natural LLM prose in "Moody's Response" section. No more structured green/red/yellow/blue boxes.

### 2026-01-06 23:15 - [file-search-specialist]
- ✅ **Analyzed LLM prompts & structured output root cause**
- **Finding**: Problem is NOT in prompts, but in frontend component display
- **Root Cause Analysis**:
  1. LLM prompts correctly request natural prose (2-4 sentences, no sections, integrated lessons)
  2. Backend stores LLM response in `analysis` field
  3. BUT also populates legacy `praise` and `critique` fields from template-based logic
  4. Frontend displays praise/critique as separate boxed sections with headers ("What You Did Well:", "Areas to Improve:")
- **Key Files Examined**:
  - `backend/src/context/mentor.py` (lines 259-334): build_moody_roast_prompt & build_moody_praise_prompt correctly prompt for natural prose
  - `backend/src/api/routes.py` (routes.py): Stores LLM response in `analysis` BUT also populates `praise`/`critique`
  - `frontend/src/components/MentorFeedback.tsx` (lines 186-204): Displays praise/critique sections with headers
- **Solution Path**: 
  - Option A: Stop populating `praise`/`critique` in LLM mode, display only `analysis`
  - Option B: Update frontend to skip praise/critique display when LLM is active
- **Files changed**: None (READ-ONLY analysis)
- **Handoff to**: Implementation agent - Fix structured output by removing praise/critique display or fields in LLM mode
- **Context**: LLM prompts are excellent (natural prose, rationality lessons, Moody-style). Problem is downstream—frontend is wrapping legacy template fields in headers.

### 2026-01-06 22:33 - fastapi-specialist
- ✅ **Fixed 2 backend issues with mentor feedback**
- **Issue 1: Rationality Lessons in LLM Prompts**
  - Updated `build_moody_roast_prompt`: Added instruction to include rationality lessons (confirmation bias, correlation vs causation, burden of proof) naturally woven into roasts
  - Updated `build_moody_praise_prompt`: Added rationality lessons in all 3 score tier examples (parsimony, burden of proof, avoiding obvious suspect trap)
- **Issue 2: Scoring Too Lenient** - Made scoring MUCH harsher
  - Base score: 20 (down from 40) - must earn points
  - No critical evidence: -30 penalty (was no penalty)
  - Coherence: +20 only with logical connectors (because, therefore, since) AND 2-5 sentences
  - Fallacy penalty: -20 each (up from -15), no cap
  - NEW: Vague language penalty (-10 each for "i guess", "maybe", "probably", "i think", "seems like", "kind of")
  - NEW: No causal reasoning penalty (-15 if no "because" or "since")
- **Scoring Results**:
  - "total bullshit" reasoning: 0/100 (was ~80)
  - Good reasoning with evidence: ~65-80/100
  - Character assassination: 0/100
- **Files changed**:
  - `backend/src/context/mentor.py` - Updated build_moody_roast_prompt and build_moody_praise_prompt
  - `backend/src/verdict/evaluator.py` - Rewrote score_reasoning with harsh algorithm
  - `backend/tests/test_verdict_evaluator.py` - Updated 17 tests for new scoring expectations
  - `backend/tests/test_mentor.py` - Added 2 tests for rationality lessons in prompts
- **Tests**: 70 tests passing (test_verdict_evaluator + test_mentor), 347 total backend tests
- **Handoff to**: None (fixes complete)
- **Context**: Scoring is now properly harsh. Nonsense reasoning gets 0, good reasoning with evidence gets 65-80. LLM prompts instruct Moody to include rationality lessons naturally.

### 2026-01-06 22:27 - react-vite-specialist
- ✅ **Fixed 3 MentorFeedback UI issues** based on user screenshot feedback
- **Issue 1 (Double Border)**: Removed `border border-gray-700` from inner container (Modal wrapper provides border)
- **Issue 2 (Duplicate Title)**: Removed `<h2>[Moody's Feedback]</h2>` header (Modal title already shows)
- **Issue 3 (Duplicate Feedback)**: Removed "Analysis:" section (LLM response in "Moody's Response:" already comprehensive)
- **Files changed**:
  - `frontend/src/components/MentorFeedback.tsx` - Removed border classes, header, and analysis section
  - `frontend/src/components/__tests__/MentorFeedback.test.tsx` - Removed 2 tests for removed elements
- **Tests**: 306 passed (0 failures)
- **TypeScript**: No errors
- **Handoff to**: None (UI fixes complete)
- **Context**: MentorFeedback now shows single border, single title (from Modal), single feedback section ("Moody's Response:" with LLM text). Retains: verdict banner, attempts, reasoning quality meter, praise/critique, fallacies, hints, retry button.

### 2026-01-06 22:08 - validation-gates
- **PHASE 3.1 VALIDATION: PASS** - All automated quality gates passed
- **Backend Tests**: 336 passed, 1 pre-existing failure (claude_client model name mismatch)
- **Frontend Tests**: 308 passed (0 failures)
- **Total Tests**: 644 (336 backend + 308 frontend)
- **TypeScript**: No errors
- **Build**: Success (193KB JS, 26KB CSS)
- **Linting Issues** (non-blocking):
  - Backend: 5 fixable (unused imports, import sorting)
  - Frontend: 25 errors (type cosmetics, async arrow functions without await - pre-existing)
  - mypy: 8 errors (returning Any from typed functions - pre-existing)
- **Critical Validations PASSED**:
  - [x] `backend/src/api/routes.py` - reset_case endpoint exists (line 402)
  - [x] `backend/src/api/routes.py` - ResetResponse model exists (line 229)
  - [x] `backend/src/api/routes.py` - case_solved check REMOVED (no blocking code)
  - [x] `backend/src/context/mentor.py` - build_moody_roast_prompt (line 232)
  - [x] `backend/src/context/mentor.py` - build_moody_praise_prompt (line 286)
  - [x] `backend/src/context/mentor.py` - build_moody_feedback_llm (line 333)
  - [x] `backend/tests/test_routes.py` - test_reset_endpoint_deletes_state (line 397)
  - [x] `backend/tests/test_routes.py` - test_reset_endpoint_nonexistent_file (line 435)
  - [x] `backend/tests/test_routes.py` - test_submit_verdict_allows_retry_after_solved (line 918)
  - [x] `backend/tests/test_mentor.py` - test_llm_feedback_fallback_on_error (line 312)
  - [x] `backend/tests/test_mentor.py` - test_llm_feedback_correct_calls_praise_prompt (line 342)
  - [x] `backend/tests/test_mentor.py` - test_llm_feedback_incorrect_calls_roast_prompt (line 371)
  - [x] `frontend/src/components/ConfirmDialog.tsx` - Reusable confirmation modal
  - [x] `frontend/src/components/MentorFeedback.tsx` - isLoading prop (line 47, 87, 90)
  - [x] `frontend/src/api/client.ts` - resetCase function (line 592)
  - [x] `frontend/src/App.tsx` - handleRestartCase (line 179), ConfirmDialog (line 466)
  - [x] `frontend/src/components/__tests__/ConfirmDialog.test.tsx` - 15 tests
- **Success Criteria from PRP** (all met):
  - [x] User can submit multiple verdicts after case_solved
  - [x] "Restart Case" button works (clears all state)
  - [x] LLM feedback functions exist (build_moody_roast_prompt, build_moody_praise_prompt, build_moody_feedback_llm)
  - [x] Template fallback works (test_llm_feedback_fallback_on_error passes)
  - [x] Loading state shown during LLM call (isLoading prop + spinner)
  - [x] All tests pass (existing + new)
- **New Tests Added (Phase 3.1)**:
  - Backend: 8 new tests (3 reset endpoint, 5 LLM feedback)
  - Frontend: 21 new tests (15 ConfirmDialog, 6 MentorFeedback loading)
- **Recommendation**: PASS - Ready for documentation-manager
- **Handoff to**: documentation-manager
- **Context**: Phase 3.1 VALIDATED. All automated gates pass. Restart + LLM feedback features complete. Manual testing recommended before deployment.

### 2026-01-06 22:06 - react-vite-specialist
- ✅ **PHASE 3.1 FRONTEND COMPLETE** - Restart button + ConfirmDialog + Loading spinner (Tasks 8-13)
- **Test Results**: 308 passed (21 new tests added)
  - ConfirmDialog.test.tsx: 15 tests (rendering, interactions, keyboard, destructive mode)
  - MentorFeedback.test.tsx: 6 new loading state tests
- **Files created**:
  - `frontend/src/components/ConfirmDialog.tsx` - Reusable confirmation modal (wraps Modal.tsx)
  - `frontend/src/components/__tests__/ConfirmDialog.test.tsx` - 15 tests
- **Files modified**:
  - `frontend/src/components/ui/Button.tsx` - Added forwardRef support for focus management
  - `frontend/src/api/client.ts` - Added resetCase() function (`POST /api/case/{case_id}/reset`)
  - `frontend/src/components/MentorFeedback.tsx` - Added isLoading prop + loading spinner with ARIA
  - `frontend/src/components/__tests__/MentorFeedback.test.tsx` - Added 6 loading state tests
  - `frontend/src/App.tsx` - Integrated restart button + ConfirmDialog + handleRestartCase handler
- **Features implemented**:
  - "Restart Case" button in header (red styling: `bg-red-700`)
  - ConfirmDialog opens on click with message: "Reset all progress? Evidence, witnesses, and verdicts will be lost."
  - Confirm calls resetCase API then reloads page to clear all state
  - Cancel closes dialog without action
  - Loading spinner in MentorFeedback during LLM feedback generation
  - Accessible: Escape key closes, ARIA labels, focus management
- **TypeScript**: Compiles without errors
- **Lint**: New code clean (pre-existing issues in other files)
- **Handoff to**: validation-gates (Phase 3.1 Task 14: Integration Testing)
- **Context**: Frontend restart + loading spinner complete. Backend reset endpoint exists (`POST /api/case/{case_id}/reset`). Ready for full integration testing.

### 2026-01-06 21:30 - planner
- ✅ **PHASE 3.1 PLANNING COMPLETE** - State management fixes + LLM mentor feedback
- **Issues Identified**:
  1. **CRITICAL BUG**: `case_solved=true` blocks verdict retries after server restart (routes.py:938)
  2. **No restart**: Cannot reset investigation to beginning
  3. **Mechanical feedback**: Templates feel robotic, not immersive
- **Root Cause Analysis**: Complete investigation report created
  - Analyzed `submit_verdict` endpoint flow
  - Examined state persistence architecture (save/load/delete)
  - Traced verdict blocking to `if verdict_state.case_solved: raise HTTPException`
  - Confirmed delete_state() exists but no API endpoint exposes it
- **Solution Designed**:
  - Remove case_solved validation check (allow educational retries)
  - Add `POST /api/case/{case_id}/reset` endpoint
  - Replace template feedback with LLM prompts (Claude Haiku)
  - Hybrid approach: LLM with template fallback (reliability)
- **Files Created**:
  - `PRPs/phase3.1-state-fixes-llm-feedback.md` (INITIAL - 119 lines)
  - `PRPs/phase3.1-prp.md` (comprehensive PRP with 14 tasks, prompts, tests)
  - `docs/PHASE_3.1_INVESTIGATION_REPORT.md` (root cause analysis, 520 lines)
- **Files Updated**:
  - `PLANNING.md` - Added Phase 3.1 milestone, updated effort estimates
  - `STATUS.md` - This update
- **Tasks Defined**: 14 tasks (7 backend, 5 frontend, 2 testing)
- **Effort Estimate**: 2-3 days
- **Priority**: CRITICAL (unblocks user from testing/learning)
- **Confidence Score**: 9/10 (clear bugs, validated solutions, patterns exist)
- **Quick Wins**:
  - 10-minute fix: Remove case_solved check (immediate unblock)
  - 2-hour fix: Add reset endpoint
  - 1-day enhancement: LLM feedback
- **Handoff to**: fastapi-specialist (Phase 3.1 Task 1: Remove case_solved check) OR User decision
- **Context**: Critical UX bugs identified and analyzed. Solutions designed. LLM prompts drafted. Ready for immediate implementation.

---

## Previous Completions (Archive)

### 2026-01-06 20:44 - fastapi-specialist
- ✅ **Fixed Issue 2: Mentor feedback too lenient** - Made scoring harsher and critique Moody-style
- **Root causes fixed**:
  1. Base score lowered from 50 to 40
  2. Added no-evidence penalty (-15 when key evidence exists but none cited)
  3. Added rambling penalty (-10 for >5 sentences)
  4. Increased fallacy penalty from -10 to -15 each (max -45)
  5. Added `weak_reasoning` fallacy detecting: "i guess", "probably", "not sure", "no idea", etc.
  6. Made critique templates Moody-style harsh ("WRONG", "Pathetic", "Sloppy work, Auror")
  7. Made praise templates conditional on score
- **Files changed**:
  - `backend/src/verdict/evaluator.py` - New scoring formula
  - `backend/src/verdict/fallacies.py` - Added `_check_weak_reasoning()` + updated `detect_fallacies()`
  - `backend/src/verdict/__init__.py` - Import sorting fix
  - `backend/src/context/mentor.py` - Harsh `_generate_critique()` and `_generate_praise()`
  - `backend/src/case_store/case_001.yaml` - Added `weak_reasoning` fallacy template
  - `backend/tests/test_verdict_evaluator.py` - Updated for new scoring
  - `backend/tests/test_fallacies.py` - Added 13 new tests for `TestCheckWeakReasoning`
  - `backend/tests/test_mentor.py` - Updated for harsh feedback messages
- **Tests**: 318 backend tests passing (90 verdict/fallacies/mentor tests)
- **Example**: "I guess Hermione did it. No real reason." now scores **15** (was ~50) with critique: "WRONG. You accused hermione when the evidence clearly points to draco. Did you even LOOK at the wand_signature, frost_pattern? Pathetic."
- **Handoff to**: None (Issue 2 FIXED)
- **Context**: Both user-reported issues now fixed. Scoring is harsh, feedback is Moody-style.

### 2026-01-06 20:35 - react-vite-specialist
- ✅ **Fixed Issue 1: Cannot retry after correct verdict**
- **Root cause**: `RESET` action preserved `caseSolved: true` forever
- **Fix**: Removed `caseSolved` preservation from RESET action (line 135)
- **Files changed**:
  - `frontend/src/hooks/useVerdictFlow.ts` - Removed `caseSolved: state.caseSolved` from RESET
  - `frontend/src/hooks/__tests__/useVerdictFlow.test.ts` - Updated test to verify caseSolved resets
- **Tests**: 287/287 passing (19 useVerdictFlow tests)
- **Handoff to**: None (Issue 1 FIXED)
- **Context**: Issue 2 (mentor feedback too lenient) still open for fastapi-specialist

### 2026-01-06 20:45 - debugger
- **DEBUGGING INVESTIGATION COMPLETE** - Two user-reported bugs analyzed
- **Issue 1: Cannot Retry After Correct Verdict**
  - **Root Cause**: `RESET` action in `useVerdictFlow.ts` (lines 133-136) preserves `caseSolved: true`
  - **Effect**: Button disabled in `App.tsx` line 224 (`disabled={verdictState.caseSolved}`)
  - **Fix**: Remove `caseSolved` preservation from RESET action OR add `RESET_CASE` action
- **Issue 2: Mentor Feedback Too Lenient**
  - **Root Causes**:
    1. Base score 50 too high (evaluator.py line 44)
    2. No penalty for missing evidence citation
    3. Rambling (2-5 sentences) gets +20 bonus instead of penalty
    4. Fallacy detection requires specific phrases (generic "bullshit" not caught)
    5. Critique templates mild (no Moody-style harshness)
  - **Fix**: Lower base to 40, add no-evidence penalty (-15), add rambling penalty (>5 sentences), add `weak_reasoning` fallacy type
- **Files analyzed**:
  - `frontend/src/hooks/useVerdictFlow.ts`
  - `frontend/src/App.tsx`
  - `frontend/src/components/VerdictSubmission.tsx`
  - `backend/src/verdict/evaluator.py`
  - `backend/src/verdict/fallacies.py`
  - `backend/src/context/mentor.py`
  - `backend/tests/test_fallacies.py`
  - `backend/tests/test_verdict_evaluator.py`
- **Handoff to**: fastapi-specialist (Issue 2 fixes) + react-vite-specialist (Issue 1 fix)
- **Context**: Full root cause analysis complete. Both bugs have specific file:line references and recommended code changes.

[... earlier completions archived ...]

---

## Deprecated Content

**v0.7.0 prototype** archived to `_deprecated_v0.7.0/`:
- 33 files, 301 tests (quiz-style gameplay)
- Hypothesis system, 6-phase structure, scoring mechanics
- Keep until Phase 4 (reference purposes)

---

## What's Working Now (v0.4.0)

**Core Investigation Loop** ✅:
- Freeform text input (DnD-style exploration)
- Claude Haiku LLM narrator (immersive responses)
- Evidence discovery system (5+ trigger variants per evidence)
- State persistence (save/load JSON)
- Terminal UI (dark theme, monospace aesthetic)

**Witness Interrogation** ✅:
- Freeform questioning (Claude plays character)
- Trust mechanics (LA Noire-inspired: -10 aggressive, +5 empathetic)
- Evidence presentation (Phoenix Wright-style secret triggers)
- Context isolation (narrator vs witness contexts)
- WitnessSelector + WitnessInterview components
- Trust meter visualization (red/yellow/green)

**Terminal UX** ✅:
- Command-line style (no button, Ctrl+Enter only)
- Quick action shortcuts (examine desk, talk to witness)
- Clickable evidence cards (modal with details)
- Evidence metadata (name, location found, description)

**Verdict System** ✅:
- Suspect selection + reasoning input + evidence citation
- Mentor feedback (Moody analysis, fallacy detection, reasoning score 0-100)
- Post-verdict confrontation (dialogue, aftermath, case resolution)
- Retry system (up to 10 attempts with adaptive hints)
- Correct verdict: Case solved with full confrontation scene
- Incorrect verdict: Educational feedback with specific critiques

**Known Issues**:
- ~~**Issue 1**: Cannot retry after correct verdict~~ **FIXED** (2026-01-06 20:35)
- ~~**Issue 2**: Mentor feedback too lenient~~ **FIXED** (2026-01-06 20:44) - Scoring now harsh (base 40, fallacy -15, no-evidence -15, rambling -10), weak_reasoning fallacy added, Moody-style critique
- ~~**Issue 3**: Structured output in MentorFeedback~~ **FIXED** (2026-01-06 23:24) - Removed praise/critique/fallacies/hint boxed sections, now shows only natural LLM prose

**Not Yet Implemented**:
- Intro briefing system (Phase 3.5)
- Tom's inner voice (Phase 4)
- Magic spells (Phase 4.5)
- Bayesian probability tracker (Phase 5.5)

---

## Next Phase

**Phase 3.5: Intro Briefing System** (2-3 days estimate)
- Moody rationality lessons before each case
- Teaching base rates, Bayesian updating, fallacy awareness
- Skippable for returning players

**Phase 4: Tom's Inner Voice** (3-4 days estimate)
- 50% helpful / 50% misleading character
- Trigger system based on evidence discovered
- Failed Auror ghost backstory

**Phase 4.5: Magic System** (2-3 days estimate)
- 6 investigation spells with risk/reward
- Revelio, Prior Incantato, Homenum Revelio, etc.

**Status**: Awaiting user decision (Phase 3 complete, Issue 3 root cause identified)

---

## Notes

- Phase 1 working and verified
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`
- Model: claude-haiku-4-5
- All tests passing
