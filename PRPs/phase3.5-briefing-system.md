# Phase 3.5: Intro Briefing System PRP

## Goal
Moody briefs player before each case: introduces case facts + teaches rationality concept + allows interactive Q&A dialogue. Player can ask questions, then proceeds to investigation.

**End State**: Case starts → Briefing modal appears → Moody presents case (victim, location, time) + teaches concept (base rates) → Player can ask questions (LLM dialogue) → Player clicks "Start Investigation" → Modal closes, investigation begins.

## Why
- **Dual Purpose**: Introduces case AND teaches rationality
- **Character-Driven**: Moody's voice, not academic lectures
- **Interactive**: Player can clarify concepts or ask about case
- **Progressive**: Each case teaches 1-2 new concepts
- **Natural**: Teaching emerges from investigation wisdom

## What

### User-Visible Behavior

#### 1. Case Assignment (Phase 1)
- Briefing modal appears on case start
- Moody presents case file:
  - WHO: Victim identity and role
  - WHERE: Location (library, restricted section)
  - WHEN: Time of incident (9:15pm)
  - WHAT: Basic circumstances (student petrified)
- Sets investigation scope

#### 2. Teaching Moment (Phase 2)
- Moody introduces rationality concept naturally
- Example for Case 1 (Base Rates):
  - "Out of 100 school deaths ruled 'accidents,' how many actually ARE accidents?"
  - "85%. Hogwarts is dangerous. Most accidents are just accidents."
  - "Start there. Evidence might change your mind. Might not."
- Uses concrete examples, not abstractions

#### 3. Optional Reflection (Phase 3)
- Input field: "Ask Mad-Eye a question..."
- Player can ask:
  - Clarifying questions about concept ("What are base rates?")
  - Questions about case ("Why is this case different?")
  - Investigation advice ("Where should I start?")
- Moody responds in character (LLM-powered)
- Conversation history displayed
- Player can ask multiple questions

#### 4. Transition (Phase 4)
- "Start Investigation" button always visible
- When clicked:
  - Moody: "Now get to work. Constant vigilance."
  - Modal closes
  - Investigation begins
- Briefing marked complete (won't re-show)

### Technical Requirements

#### Backend
- **BriefingContent model**: case_assignment (str), teaching_moment (str), rationality_concept (str), concept_description (str), transition (str)
- **BriefingState model**: case_id, briefing_completed, conversation_history[], completed_at
- **PlayerState**: Add briefing_state field
- **Endpoints**:
  - GET /api/briefing/{case_id} - Load briefing content
  - POST /api/briefing/{case_id}/question - Ask Moody (LLM dialogue)
  - POST /api/briefing/{case_id}/complete - Mark complete

#### Frontend
- **BriefingModal component**: 3-phase UI (case intro → teaching → Q&A → transition)
- **Question input**: Text field + "Ask" button
- **Conversation display**: Show Q&A history
- **Dark terminal theme**: bg-gray-900, amber accents, font-mono
- **useBriefing hook**: Load briefing, ask questions, mark complete

#### LLM Integration
- Use Claude Haiku (same as mentor feedback)
- System prompt: You are Mad-Eye Moody teaching investigation techniques
- Context: Case details, rationality concept, player's question
- Response: 2-4 sentences, in Moody's gruff voice
- Fallback: Template responses if LLM fails

### Success Criteria
- [ ] Briefing loads case_assignment + teaching_moment from YAML
- [ ] 3-phase structure displayed (case intro, teaching, Q&A, transition)
- [ ] Player can ask questions, Moody responds in character
- [ ] Conversation history displayed
- [ ] "Start Investigation" button marks complete, closes modal
- [ ] Briefing doesn't re-show after completion
- [ ] Dark terminal theme consistent with MentorFeedback
- [ ] LLM fallback works if API fails
- [ ] Tests pass (backend 25+, frontend 40+)
- [ ] Lint/type check clean

## YAML Structure

```yaml
# case_001.yaml
case:
  # ... existing fields ...

  briefing:
    case_assignment: |
      *Mad-Eye Moody tosses a thin case file onto the desk*

      VICTIM: Third-year student
      LOCATION: Hogwarts Library, Restricted Section
      TIME: Approximately 9:15pm last night
      STATUS: Found petrified near frost-covered window

      Witnesses present. Evidence scattered. Standard investigation protocol.

    teaching_moment: |
      Before you start, recruit - a question:

      Out of 100 school incidents ruled "accidents," how many actually ARE accidents?

      *pauses, magical eye swiveling*

      85%. Hogwarts is dangerous. Staircases move, paintings argue, potions explode.
      Most accidents are just accidents.

      START THERE. Don't chase dramatic theories before you've ruled out the obvious.
      Evidence might change your mind. Might not.

      That's base rates, recruit. Always start with what's LIKELY, then let evidence
      move you. Not the other way around.

    rationality_concept: "base_rates"
    concept_description: "Start with likely scenarios (base rates), not dramatic theories. Let evidence update your priors."

    transition: |
      Now get to work. The library's waiting.

      CONSTANT VIGILANCE.
```

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `backend/src/state/player_state.py` | MODIFY | Add BriefingState model with conversation_history |
| `backend/src/case_store/case_001.yaml` | MODIFY | Add briefing module |
| `backend/src/context/briefing.py` | CREATE | LLM prompt for Moody Q&A |
| `backend/src/api/routes.py` | MODIFY | Add briefing endpoints (GET, POST question, POST complete) |
| `frontend/src/types/investigation.ts` | MODIFY | Add briefing types |
| `frontend/src/api/client.ts` | MODIFY | Add briefing API calls |
| `frontend/src/components/BriefingModal.tsx` | CREATE | Main briefing UI (3-phase) |
| `frontend/src/components/BriefingConversation.tsx` | CREATE | Q&A history display |
| `frontend/src/hooks/useBriefing.ts` | CREATE | Briefing state + API calls |
| `frontend/src/App.tsx` | MODIFY | Integrate briefing modal |
| `backend/tests/test_briefing.py` | CREATE | Briefing tests (25+) |
| `frontend/src/components/__tests__/BriefingModal.test.tsx` | CREATE | Component tests (40+) |

## Tasks

### Task 1: Backend - BriefingState Model
**File**: `backend/src/state/player_state.py`
**Action**: MODIFY
**Acceptance criteria**:
- BriefingState model: case_id, briefing_completed, conversation_history[], completed_at
- PlayerState.briefing_state: BriefingState | None
- Method: mark_briefing_complete()
- conversation_history: list[dict[str, str]] with "question" and "answer" keys

### Task 2: Backend - YAML Briefing Module
**File**: `backend/src/case_store/case_001.yaml`
**Action**: MODIFY
**Acceptance criteria**:
- briefing: section with case_assignment, teaching_moment, rationality_concept, concept_description, transition
- case_assignment: WHO, WHERE, WHEN, WHAT format
- teaching_moment: Natural Moody dialogue introducing base rates
- transition: "Now get to work. CONSTANT VIGILANCE."

### Task 3: Backend - Moody Q&A LLM Prompt
**File**: `backend/src/context/briefing.py`
**Action**: CREATE
**Acceptance criteria**:
- build_moody_briefing_prompt(question, case_info, concept_info, conversation_history)
- System: You are Mad-Eye Moody teaching investigation techniques
- Context: Case details, rationality concept being taught
- Tone: Gruff, paranoid, educational, 2-4 sentences
- Fallback templates for common questions

### Task 4: Backend - Briefing Endpoints
**File**: `backend/src/api/routes.py`
**Action**: MODIFY
**Acceptance criteria**:
- BriefingContent model (case_assignment, teaching_moment, rationality_concept, concept_description, transition)
- GET /api/briefing/{case_id}: Load from YAML, return BriefingContent
- POST /api/briefing/{case_id}/question: Body { question: str }, call LLM, return { answer: str }
- POST /api/briefing/{case_id}/complete: Mark briefing_completed=true
- Conversation history saved to BriefingState

### Task 5: Frontend - Type Definitions
**File**: `frontend/src/types/investigation.ts`
**Action**: MODIFY
**Acceptance criteria**:
- BriefingContent interface (case_assignment, teaching_moment, etc.)
- BriefingConversation interface (question, answer)
- BriefingState interface (case_id, briefing_completed, conversation_history, completed_at)

### Task 6: Frontend - API Client Functions
**File**: `frontend/src/api/client.ts`
**Action**: MODIFY
**Acceptance criteria**:
- getBriefing(caseId, playerId?): Promise<BriefingContent>
- askBriefingQuestion(caseId, question, playerId?): Promise<{ answer: string }>
- markBriefingComplete(caseId, playerId?): Promise<{ success: boolean }>

### Task 7: Frontend - useBriefing Hook
**File**: `frontend/src/hooks/useBriefing.ts`
**Action**: CREATE
**Acceptance criteria**:
- useState: briefing, conversation[], loading, error
- loadBriefing() callback
- askQuestion(question) callback: calls API, adds to conversation[]
- markComplete() callback
- Returns { briefing, conversation, loading, error, loadBriefing, askQuestion, markComplete }

### Task 8: Frontend - BriefingConversation Component
**File**: `frontend/src/components/BriefingConversation.tsx`
**Action**: CREATE
**Acceptance criteria**:
- Props: { conversation: BriefingConversation[] }
- Display Q&A history
- Question: gray-700 bg, "You:" prefix
- Answer: gray-800 bg, "Moody:" prefix, amber text
- Scrollable if many questions

### Task 9: Frontend - BriefingModal Component
**File**: `frontend/src/components/BriefingModal.tsx`
**Action**: CREATE
**Acceptance criteria**:
- 3-phase display:
  1. Case Assignment (case_assignment text)
  2. Teaching Moment (teaching_moment text, concept_description)
  3. Q&A Section (input field + Ask button, conversation history)
  4. Transition (transition text + Start Investigation button)
- Dark gray-900 card, amber accents, font-mono
- whitespace-pre-wrap for all text
- Loading state while asking question
- Start Investigation button calls onComplete

### Task 10: Frontend - App Integration
**File**: `frontend/src/App.tsx`
**Action**: MODIFY
**Acceptance criteria**:
- useBriefing(CASE_ID) hook
- useState: briefingModalOpen
- useEffect: load briefing on mount, check if completed
- Only show modal if !briefing_completed
- onComplete: markComplete() then close modal
- Modal doesn't reappear after completion

### Task 11: Backend - Tests
**File**: `backend/tests/test_briefing.py`
**Action**: CREATE
**Acceptance criteria**:
- test_get_briefing_success: Returns BriefingContent from YAML
- test_ask_question_llm: POST /question returns answer, saves to conversation_history
- test_mark_complete: Sets briefing_completed=true
- test_briefing_yaml_structure: Validates all required fields
- test_llm_fallback: Handles API failure gracefully
- 25+ tests total

### Task 12: Frontend - Tests
**File**: `frontend/src/components/__tests__/BriefingModal.test.tsx`
**Action**: CREATE
**Acceptance criteria**:
- test_renders_3_phases: Case assignment, teaching, Q&A, transition
- test_ask_question: Type question, click Ask, answer appears
- test_conversation_history: Multiple Q&As displayed
- test_start_investigation: Button calls onComplete
- test_loading_states: Shows loading during question
- 40+ tests total

## Integration Points

1. **App.tsx**: Show BriefingModal on mount if !briefing_completed
2. **PlayerState**: Add briefing_state field with conversation history
3. **case_001.yaml**: Add briefing section with 4 text blocks
4. **routes.py**: Add 3 endpoints (GET briefing, POST question, POST complete)
5. **briefing.py**: LLM prompt for Moody Q&A (similar to mentor.py)

## Known Gotchas

### LLM Response Tone
- **Issue**: LLM doesn't match Moody's gruff, paranoid voice
- **Solution**: Strong system prompt with examples, temperature=0.7

### Conversation History Length
- **Issue**: Long conversations → large state, slow loads
- **Solution**: Limit to last 10 Q&As, clear on complete

### Modal Blocking
- **Issue**: Player can interact behind modal
- **Solution**: z-index + backdrop-blur

## Validation Loop

### Level 1: Syntax & Style
```bash
# Backend
cd backend
uv run ruff check .
uv run mypy src/

# Frontend
bun run lint
bun run type-check
```

### Level 2: Unit Tests
```bash
# Backend
uv run pytest backend/tests/test_briefing.py -v

# Frontend
bun test src/components/__tests__/BriefingModal.test.tsx
```

### Level 3: Manual
1. Start backend + frontend
2. Open http://localhost:5173
3. Briefing modal appears with 3 phases
4. Read case assignment (victim, location, time)
5. Read teaching moment (base rates)
6. Ask question: "What are base rates?"
7. Moody responds in character
8. Ask another: "Where should I start?"
9. See conversation history
10. Click "Start Investigation" → modal closes
11. Reload → briefing doesn't re-show

## Dependencies
None (Claude Haiku already integrated for mentor feedback)

## Out of Scope
- Multiple briefing variants per case
- Player performance tracking in briefing
- Briefing skip functionality (must complete once)
- Multi-case concept review
- Visual aids (diagrams, charts)

## Agent Orchestration Plan

### Sequential Track
1. **fastapi-specialist** → Tasks 1-4, 11 (BriefingState, YAML, LLM prompt, endpoints, tests)
2. **react-vite-specialist** → Tasks 5-10, 12 (types, components, hooks, integration, tests)
3. **validation-gates** → Lint, tests, type-check
4. **documentation-manager** → Update docs

### For fastapi-specialist
- **Tasks**: 1-4, 11
- **Pattern**: PlayerState extension, LLM prompt (mentor.py pattern), endpoints
- **Key Files**: player_state.py, case_001.yaml, briefing.py, routes.py
- **Output**: Backend with 3 endpoints, LLM Q&A, 25+ tests passing
- **Success**: `uv run pytest backend/tests/test_briefing.py -v` passes

### For react-vite-specialist
- **Tasks**: 5-10, 12
- **Pattern**: MentorFeedback.tsx UI pattern, conversation display, modal integration
- **Key Files**: BriefingModal.tsx, BriefingConversation.tsx, useBriefing.ts, App.tsx
- **Output**: Interactive briefing UI, 40+ tests passing
- **Success**: `bun test` passes, manual flow works

---
**Generated**: 2026-01-07
**Complexity**: Medium (LLM integration, 3-phase UI, conversation history)
**Confidence**: 8/10 (uses mentor feedback patterns, clear requirements)
**Estimated Effort**: 2-3 days
