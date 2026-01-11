# Phase 3.6: Dialogue-Based Briefing UI - Product Requirement Plan

## Goal
Transform Phase 3.5 briefing from separated boxes (Case Assignment, Moody's Lesson, Questions, Transition) into single flowing dialogue interface with interactive multiple-choice question teaching.

## Why
- **User Feedback**: Current UI feels artificial with separated sections
- **Better Engagement**: Dialogue flow mimics natural conversation (like chat interface)
- **Interactive Teaching**: Multiple-choice question makes concept stick better than passive reading
- **Cleaner UX**: Single vertical feed vs 4 boxed sections
- **Pattern Exists**: MentorFeedback shows single-feed natural prose works well

## What

### User-Visible Changes
**From (Current)**:
```
┌─────────────────────────┐
│ Case Assignment (box)  │ <- Amber border
├─────────────────────────┤
│ Moody's Lesson (box)   │ <- Green border
├─────────────────────────┤
│ Questions (box)         │ <- Gray
│ [Textarea input]        │
├─────────────────────────┤
│ Transition (box)        │ <- Green border
│ [Start Investigation]   │
└─────────────────────────┘
```

**To (Desired)**:
```
┌─────────────────────────┐
│ MOODY: *tosses file*    │ <- Natural prose
│ VICTIM: Third-year      │
│ LOCATION: Library       │
│ TIME: 9:15pm            │
│                         │
│ MOODY: Before you start│
│ - question:             │
│ Out of 100 school       │
│ incidents ruled         │
│ "accidents," how many   │
│ ARE accidents?          │
│                         │
│ [25%] [50%] [85%] [All] │ <- Button choices
│                         │
│ MOODY: *nods* Correct.  │ <- Response after choice
│ 85%. Most accidents ARE │
│ accidents. START THERE. │
│                         │
│ [Text input: "Ask..."]  │ <- Q&A section
│ [Start Investigation]   │
└─────────────────────────┘
```

### Technical Changes
- **Remove 4 boxed sections** → Single vertical message feed
- **Add dialogue message component** (speaker + text)
- **Add multiple-choice button group** (4 options)
- **Move text input to bottom** (after all messages)
- **Case Assignment becomes first message** (Moody speaking)
- **Teaching Moment becomes question + response** (interactive)
- **Transition becomes final message** (CONSTANT VIGILANCE)

### Success Criteria
- [ ] No visible section boxes (Case Assignment, Moody's Lesson, Transition removed)
- [ ] All content flows as single vertical dialogue
- [ ] Multiple-choice buttons appear for teaching question
- [ ] Clicking choice shows Moody's response immediately
- [ ] Text input pinned at bottom (always visible)
- [ ] "Start Investigation" button after all dialogue
- [ ] All 149 briefing tests still pass
- [ ] Dark terminal theme consistent (bg-gray-900, amber)
- [ ] No backend changes needed (YAML already has question/answer data)

## Context & References

### Documentation (for reference)
- Current BriefingModal.tsx - Lines 80-205 (3-phase boxed UI)
- MentorFeedback.tsx - Lines 1-100 (single prose display pattern)
- Phase 3.1 memory - User had same issue (wanted natural dialogue vs boxes)

### Codebase Patterns
- `BriefingModal.tsx` (current) - 3-phase boxed sections to replace
- `BriefingConversation.tsx` - Q&A display (can extend for all messages)
- `MentorFeedback.tsx` - Natural prose in single container (pattern to follow)

## Quick Reference

### Key Pattern: Message-Based UI
```typescript
// From MentorFeedback - single prose display
<div className="bg-gray-900 rounded-lg p-6 font-mono">
  <div className="text-gray-300 whitespace-pre-wrap">
    {content}
  </div>
</div>

// Extend to message feed
interface Message {
  speaker: 'moody' | 'player';
  text: string;
  type?: 'choice' | 'response';
}
```

### Multiple Choice Pattern
```typescript
// Simple button group for teaching question
<div className="flex flex-wrap gap-2">
  {choices.map(choice => (
    <button
      onClick={() => handleChoice(choice)}
      className="bg-gray-800 hover:bg-gray-700..."
    >
      {choice}
    </button>
  ))}
</div>
```

### YAML Structure (Already Exists)
```yaml
# case_001.yaml briefing section has:
teaching_moment: "Before you start..." # Question text
rationality_concept: "base_rates"
concept_description: "85% are accidents" # Correct answer hint
```

**Missing from YAML**: Answer choices + Moody's response text
- Need to add: `teaching_question.choices[]` + `teaching_question.correct_answer` + `teaching_question.moody_response`

## Current Codebase Structure
```
frontend/src/components/
├── BriefingModal.tsx         # 3-phase boxed UI (MODIFY)
├── BriefingConversation.tsx  # Q&A pairs only (CAN EXTEND for all messages)
└── MentorFeedback.tsx        # Natural prose pattern (REFERENCE)

backend/src/case_store/
└── case_001.yaml             # briefing section (MODIFY - add choices)
```

## Desired Structure
```
frontend/src/components/
├── BriefingModal.tsx         # Single dialogue feed (REWRITE)
└── BriefingMessage.tsx       # Single message component (CREATE)

backend/src/case_store/
└── case_001.yaml             # Add teaching_question with choices
```

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `frontend/src/components/BriefingMessage.tsx` | CREATE | Single message bubble (speaker + text) |
| `frontend/src/components/BriefingModal.tsx` | MODIFY | Replace 3-phase boxes with message feed |
| `backend/src/case_store/case_001.yaml` | MODIFY | Add teaching_question.choices[] |
| `frontend/src/types/investigation.ts` | MODIFY | Add TeachingQuestion interface |

## Tasks (ordered)

### Task 1: Update YAML Structure
**File**: `backend/src/case_store/case_001.yaml`
**Action**: MODIFY
**Purpose**: Add multiple-choice data to briefing section
**Changes**:
```yaml
briefing:
  teaching_question:
    question: "Out of 100 school incidents ruled 'accidents,' how many actually ARE accidents?"
    choices:
      - "About 25%"
      - "About 50%"
      - "About 85%"
      - "Almost all (95%+)"
    correct_answer: "About 85%"
    moody_response: "*nods* Correct. 85%. Hogwarts is dangerous. Most accidents ARE accidents. START THERE. Don't chase dramatic theories first. That's base rates, recruit."
```
**Acceptance**: YAML loads without errors, teaching_question accessible

### Task 2: Update Types
**File**: `frontend/src/types/investigation.ts`
**Action**: MODIFY
**Purpose**: Add TeachingQuestion interface
**Changes**:
```typescript
export interface TeachingQuestion {
  question: string;
  choices: string[];
  correct_answer: string;
  moody_response: string;
}

export interface BriefingContent {
  // ... existing fields
  teaching_question?: TeachingQuestion;
}
```
**Acceptance**: Types compile, no TypeScript errors

### Task 3: Create Message Component
**File**: `frontend/src/components/BriefingMessage.tsx`
**Action**: CREATE
**Purpose**: Reusable message bubble for dialogue feed
**Pattern**: Follow MentorFeedback prose display style
**Features**:
- `speaker` prop ('moody' | 'player')
- Amber color for Moody, blue for player
- `MOODY:` prefix for Moody messages
- `text` displayed with `whitespace-pre-wrap`
**Acceptance**: Component renders message with speaker styling

### Task 4: Rewrite BriefingModal
**File**: `frontend/src/components/BriefingModal.tsx`
**Action**: MODIFY (major rewrite)
**Purpose**: Replace boxed sections with dialogue feed
**Changes**:
1. Remove sections: Case Assignment box, Teaching Moment box, Transition box
2. Create message array from briefing data:
   - Message 1: Case Assignment (Moody speaking)
   - Message 2: Teaching question (Moody speaking)
   - [Multiple choice buttons if question not answered]
   - Message 3: Moody's response (after choice selected)
   - Messages 4+: Q&A conversation history
   - Message final: Transition text (CONSTANT VIGILANCE)
3. Render messages vertically with BriefingMessage component
4. Show choice buttons after teaching question
5. Move text input to bottom (after all messages)
6. "Start Investigation" button at very bottom
**State**: Add `selectedChoice: string | null` to track player's answer
**Acceptance**:
- All content visible as flowing dialogue
- Choice buttons work, show Moody's response
- Text input at bottom
- Tests pass

### Task 5: Update Tests
**File**: `frontend/src/components/__tests__/BriefingModal.test.tsx`
**Action**: MODIFY
**Purpose**: Update tests for new message-based UI
**Changes**:
- Remove tests for boxed sections
- Add tests for message rendering
- Add tests for multiple-choice interaction
- Update snapshot tests
**Acceptance**: All 59 BriefingModal tests pass

### Task 6: Backend Loader (if needed)
**File**: `backend/src/case_store/loader.py`
**Action**: VERIFY (may need no changes)
**Purpose**: Ensure teaching_question loads from YAML
**Check**: `load_briefing_content()` returns teaching_question field
**Acceptance**: Backend test confirms teaching_question in response

### Task 7: Integration Test
**Action**: Manual testing
**Purpose**: Verify end-to-end flow
**Steps**:
1. Start game, briefing modal appears
2. Read case info (first message)
3. See teaching question
4. Click choice button
5. See Moody's response appear
6. Ask follow-up question in text input
7. See Q&A conversation
8. Click "Start Investigation"
9. Modal closes, investigation begins
**Acceptance**: Full flow works, no visual glitches

## Integration Points

### Frontend State
- **BriefingModal state**: Add `selectedChoice: string | null`
- **No changes to useBriefing hook**: Existing conversation state sufficient

### YAML Structure
- **Add to briefing section**: `teaching_question` object
- **Keep existing fields**: case_assignment, transition, rationality_concept

### Component Hierarchy
```
BriefingModal (container)
├── BriefingMessage (case assignment)
├── BriefingMessage (teaching question)
├── [Choice buttons] (if not answered)
├── BriefingMessage (moody response, if answered)
├── BriefingMessage (Q&A pairs)
├── BriefingMessage (transition)
├── [Text input]
└── [Start Investigation button]
```

## Known Gotchas

### UI Layout
- **Issue**: Long messages might overflow modal
- **Solution**: Keep modal `max-h-[80vh] overflow-y-auto` (already exists)

### State Management
- **Issue**: Player refreshes page after answering question
- **Solution**: Don't persist teaching question answer (ephemeral), reload shows question again (acceptable)

### Testing
- **Issue**: Snapshot tests will break
- **Solution**: Update snapshots with `npm test -- -u`

## Validation Loop

### Level 1: Component Tests
```bash
cd frontend
npm test -- BriefingModal
# Expected: 59 tests pass (updated for new UI)
```

### Level 2: Integration Test
```bash
npm run dev
# Manual steps:
# 1. Load game
# 2. See briefing as dialogue feed
# 3. Click multiple choice
# 4. See Moody respond
# 5. Complete briefing
```

### Level 3: Full Suite
```bash
npm test
cd ../backend && uv run pytest
# Expected: All 790 tests pass
```

## Dependencies
- No new packages needed
- Reuse existing: Modal.tsx, Button.tsx, types

## Out of Scope
- **LLM-generated teaching responses** (use prewritten YAML)
- **Multiple teaching questions** (Case 1 only needs base rates)
- **Skip teaching question** (player must answer to proceed)
- **Backend API changes** (YAML loader handles new structure)

## Agent Orchestration Plan

### Execution Strategy
**Sequential Track** (frontend-focused):
1. react-vite-specialist → Tasks 1-7 (YAML + Types + Components + Tests)
2. validation-gates → Run full test suite

**Why Sequential**: All changes frontend + YAML. No backend logic changes.

### Agent-Specific Guidance

#### For react-vite-specialist
- **Input**: Tasks 1-7 (YAML update, types, components, tests)
- **Pattern**: Follow MentorFeedback natural prose display
- **Key File**: Rewrite BriefingModal.tsx (lines 80-205)
- **Context**: Replace 3 boxed sections with vertical message feed
- **Tests**: Update 59 BriefingModal tests for new UI

#### For validation-gates
- **Input**: Task 7 complete
- **Success**: All 790 tests pass
- **Manual Check**: Briefing flows as dialogue, choice buttons work

### Handoff Context
**Next agent receives**:
- This PRP (full context)
- User feedback quote ("artificially separated windows, ugly visual separation")
- Current BriefingModal.tsx to rewrite
- MentorFeedback.tsx as pattern reference

**Next agent does NOT need**:
- ❌ Search for dialogue patterns (already documented)
- ❌ Research multiple-choice UI (simple button group)
- ❌ Read Phase 3.1 docs (context already extracted)

## Anti-Patterns to Avoid
- ❌ Keep boxed sections (defeats purpose)
- ❌ Complex state management (simple `selectedChoice` sufficient)
- ❌ Backend API changes (YAML loader already flexible)
- ❌ Persist teaching answer (ephemeral is fine)

---
Generated: 2026-01-07
Source: User feedback on Phase 3.5 UI
Confidence Score: 8/10
- Pattern proven (MentorFeedback natural prose)
- Simple changes (UI rewrite, no backend logic)
- Risk: Snapshot tests will break (mitigated: update snapshots)
