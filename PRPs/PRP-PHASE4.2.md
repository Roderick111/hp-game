# Phase 4.2: Modal Window UX Improvements - Product Requirement Plan

## Goal
Add standard modal closing mechanisms to Case Briefing modal: ESC key, backdrop click, and optional X button. Improve user control over modal dismissal while maintaining educational flow.

**End State**: Users can close briefing modal via ESC, backdrop click, or X button (in addition to existing "Start Investigation" button). Modal respects case completion state and prevents accidental dismissal during critical interactions.

## Why
- **User Feedback**: Modal currently lacks standard closing mechanisms (ESC, backdrop click)
- **UX Standards**: Users expect modals to close via ESC or backdrop click (industry standard)
- **User Control**: Players should control when they're ready to dismiss briefing
- **Accessibility**: Keyboard navigation (ESC) improves accessibility
- **Consistency**: Other modals (witness, evidence) already support backdrop click via `onClose` prop

## What

### User-Visible Behavior

#### Current State (Phase 3.5-3.8)
- Briefing modal shows on case start
- **Only** "Start Investigation" button closes modal
- ESC key does nothing
- Clicking backdrop does nothing (hardcoded empty function in App.tsx line 477)
- No X button in header (Modal component has X but briefing disables `onClose`)

**Problem**: Users feel "trapped" in modal, can't use standard dismissal patterns

#### Desired State (Phase 4.2)
**4 ways to close briefing modal**:

1. **ESC key press** ✅
   - Press ESC → Modal closes
   - Marks briefing as complete (same as "Start Investigation")
   - Works from any field (not just textarea)

2. **Backdrop click** ✅
   - Click outside modal (dark backdrop) → Modal closes
   - Marks briefing as complete
   - Same behavior as ESC

3. **X button** ✅
   - Already exists in Modal header (line 63-73)
   - Currently disabled (empty `onClose` function)
   - Enable by passing actual close handler

4. **"Start Investigation" button** ✅
   - Already working (line 488)
   - Keep existing behavior
   - Most explicit/intentional dismissal

**Protection**: All 4 methods call same handler → marks briefing complete, prevents re-show

### Technical Requirements

#### Frontend Changes

**File 1: App.tsx (Main integration)**
- **Change**: Line 477 - Replace empty `onClose` with actual handler
- **Current**: `onClose={() => { /* Briefing modal cannot be closed via backdrop */ }}`
- **New**: `onClose={() => void handleBriefingComplete()}`
- **Effect**: Enables backdrop click + X button

**File 2: Modal.tsx (ESC key support)**
- **Add**: `useEffect` with keyboard listener
- **Trigger**: ESC key → call `onClose()`
- **Cleanup**: Remove listener on unmount
- **Scope**: Global ESC (works regardless of focus)

**File 3: BriefingModal.tsx (No changes needed)**
- Modal already receives `onComplete` prop
- Already calls `onComplete` on "Start Investigation"
- No direct ESC handling needed (Modal.tsx handles it)

#### Backend Changes
**None required** - Briefing completion already handled by existing endpoint (`POST /api/briefing/{case_id}/complete`)

### Success Criteria
- [ ] ESC key closes briefing modal (marks complete)
- [ ] Backdrop click closes briefing modal (marks complete)
- [ ] X button closes briefing modal (marks complete)
- [ ] "Start Investigation" button still works (existing behavior)
- [ ] All 4 methods call same handler (`handleBriefingComplete`)
- [ ] Briefing marked complete after any dismissal (no re-show)
- [ ] ESC works from text input, choice buttons, any focus state
- [ ] No modal "trapping" - users have full control
- [ ] All existing tests pass (417 frontend, 385 backend)
- [ ] Lint/type check clean

---

## Context & References

### Project Documentation
**From PLANNING.md**:
- Phase 3.5-3.8 implemented briefing system (lines 380-493)
- Dark terminal theme with Modal component (line 69)
- Current status: Phase 4.1 complete, ready for Phase 4.5 or 5 (line 920)

**From STATUS.md**:
- Phase 3.5 complete: Briefing modal working (lines 79-84)
- Phase 3.7 fixed double scrollbar issue (lines 90-93)
- Current: 430 frontend tests, 455 backend tests (line 32)

### Codebase Patterns (Actual Files)

**Pattern 1: Modal Component** (`frontend/src/components/ui/Modal.tsx`)
```typescript
// Lines 1-84: Base Modal component
// Already has X button (lines 63-73)
// Already has backdrop with onClick (lines 24-30)
// Need to ADD: ESC key listener

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;  // Called on X click + backdrop click
  children: React.ReactNode;
  title?: string;
  variant?: 'default' | 'terminal';
}

// Backdrop already calls onClose (line 28)
<div className="absolute inset-0 bg-black/50" onClick={onClose} />

// X button already calls onClose (line 64)
<button onClick={onClose}>×</button>
```

**Pattern 2: App.tsx Briefing Integration** (`frontend/src/App.tsx`)
```typescript
// Lines 111-130: Briefing modal state + handlers

const [briefingModalOpen, setBriefingModalOpen] = useState(false);

// Handle briefing complete (line 127)
const handleBriefingComplete = useCallback(async () => {
  await markBriefingComplete();  // Calls POST /api/briefing/{case_id}/complete
  setBriefingModalOpen(false);
}, [markBriefingComplete]);

// Lines 474-492: Briefing modal render
<Modal
  isOpen={briefingModalOpen}
  onClose={() => { /* EMPTY - needs handleBriefingComplete */ }}  // Line 477
  variant="terminal"
  title="Case Briefing"
>
  <BriefingModal
    // ... props
    onComplete={() => void handleBriefingComplete()}  // Line 488
  />
</Modal>
```

**Pattern 3: Other Modals (Already working)** (`frontend/src/App.tsx`)
```typescript
// Evidence Modal (lines 516-525)
<EvidenceModal
  evidence={selectedEvidence}
  onClose={handleEvidenceModalClose}  // ✅ Backdrop + X work
/>

// Witness Modal (lines 495-514)
<Modal
  isOpen={witnessModalOpen}
  onClose={handleWitnessModalClose}  // ✅ Backdrop + X work
/>
```

**Pattern 4: ESC Key Handler (React pattern)**
```typescript
// Standard React ESC key listener pattern
useEffect(() => {
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  if (isOpen) {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }
}, [isOpen, onClose]);
```

---

## Quick Reference (Pre-Digested Context)

### Key Files to Modify

| File | Action | Lines | Purpose |
|------|--------|-------|---------|
| `frontend/src/components/ui/Modal.tsx` | MODIFY | Add ESC listener | Enable ESC key closing |
| `frontend/src/App.tsx` | MODIFY | Line 477 | Enable backdrop + X button |

**No backend changes** - Existing `/api/briefing/{case_id}/complete` endpoint already handles completion

### Integration Pattern

**All 4 close methods → Same handler**:
```typescript
// App.tsx line 127 (existing handler)
const handleBriefingComplete = useCallback(async () => {
  await markBriefingComplete();  // POST /api/briefing/{case_id}/complete
  setBriefingModalOpen(false);   // Hide modal
}, [markBriefingComplete]);

// Usage:
// 1. "Start Investigation" button: Already wired (line 488)
// 2. Backdrop click: Change line 477 from empty to handleBriefingComplete
// 3. X button: Same change (Modal calls onClose on X click)
// 4. ESC key: Modal.tsx adds listener → calls onClose → handleBriefingComplete
```

### Testing Strategy

**Manual Verification**:
1. Start case → Briefing modal appears
2. Press ESC → Modal closes, briefing marked complete
3. Refresh → Briefing doesn't re-show (completion saved)
4. Repeat with backdrop click
5. Repeat with X button
6. Verify "Start Investigation" still works

**Automated Tests**: Update existing BriefingModal tests to verify ESC handling

---

## Current Codebase Structure

```bash
frontend/src/
├── components/
│   ├── ui/
│   │   └── Modal.tsx                    # MODIFY - Add ESC listener
│   ├── BriefingModal.tsx                # NO CHANGE (receives onComplete)
│   └── __tests__/
│       └── BriefingModal.test.tsx       # UPDATE - Add ESC tests
├── App.tsx                               # MODIFY - Line 477 onClose handler
└── hooks/
    └── useBriefing.ts                    # NO CHANGE (already has markComplete)

backend/src/
└── api/
    └── routes.py                         # NO CHANGE (POST /complete exists)
```

**Key**: Minimal changes (2 files), leveraging existing completion handler

---

## Files to Create/Modify

| File | Action | Purpose | Reference |
|------|--------|---------|-----------|
| `frontend/src/components/ui/Modal.tsx` | MODIFY | Add ESC key listener (lines 19-84) | Standard React pattern |
| `frontend/src/App.tsx` | MODIFY | Enable onClose handler (line 477) | Other modals (lines 498, 518) |
| `frontend/src/components/__tests__/BriefingModal.test.tsx` | MODIFY | Add ESC key test cases | Existing tests (lines 1-200+) |

**No backend changes** - Completion endpoint already exists

---

## Tasks (Ordered)

### Task 1: Add ESC Key Listener to Modal Component
**File**: `frontend/src/components/ui/Modal.tsx`
**Action**: MODIFY (add useEffect hook)
**Purpose**: Enable ESC key to close any modal
**Reference**: Standard React keyboard event pattern
**Pattern**:
```typescript
useEffect(() => {
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  if (isOpen) {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }
}, [isOpen, onClose]);
```
**Depends on**: None
**Acceptance criteria**:
- [ ] ESC key triggers `onClose()` callback
- [ ] Listener only active when `isOpen === true`
- [ ] Listener cleaned up on unmount
- [ ] Works regardless of focus state (global listener)
- [ ] TypeScript compiles with no errors

### Task 2: Enable Briefing Modal Backdrop/X Button Closing
**File**: `frontend/src/App.tsx`
**Action**: MODIFY (line 477 only)
**Purpose**: Wire up backdrop click and X button to completion handler
**Reference**: Other modals in same file (witness line 498, evidence line 518)
**Current code** (line 477):
```typescript
onClose={() => { /* Briefing modal cannot be closed via backdrop */ }}
```
**New code**:
```typescript
onClose={() => void handleBriefingComplete()}
```
**Depends on**: None (handler already exists line 127)
**Acceptance criteria**:
- [ ] Backdrop click calls `handleBriefingComplete()`
- [ ] X button calls `handleBriefingComplete()`
- [ ] Modal closes after completion
- [ ] Briefing marked complete (no re-show)
- [ ] TypeScript compiles with no errors

### Task 3: Update BriefingModal Tests
**File**: `frontend/src/components/__tests__/BriefingModal.test.tsx`
**Action**: MODIFY (add test cases)
**Purpose**: Verify ESC key behavior
**Reference**: Existing BriefingModal test patterns
**New tests to add**:
- Test: ESC key calls onClose (via Modal component)
- Test: Multiple dismiss methods all mark completion
- Test: Modal doesn't re-show after any dismissal method
**Depends on**: Tasks 1-2
**Acceptance criteria**:
- [ ] ESC key test passes
- [ ] All existing tests still pass (417 total)
- [ ] Test coverage maintained

---

## Integration Points

### Modal Component (Core)
**Where**: `frontend/src/components/ui/Modal.tsx`
**What**: Add global ESC key listener
**Pattern**: Standard React `useEffect` with keyboard event
**Impact**: All modals get ESC support (witness, evidence, verdict, briefing)

### Briefing Modal Usage (App.tsx)
**Where**: `frontend/src/App.tsx` line 477
**What**: Enable `onClose` callback (backdrop + X button)
**Pattern**: Same as witness modal (line 498), evidence modal (line 518)
**Impact**: Briefing modal dismissible like other modals

### Completion Handler (Already exists)
**Where**: `frontend/src/App.tsx` lines 127-130
**What**: Existing `handleBriefingComplete` function
**Pattern**: Calls `markBriefingComplete()` → `POST /api/briefing/{case_id}/complete`
**Impact**: All 4 close methods use same handler

---

## Known Gotchas

### React useEffect Dependencies (Modal.tsx)
- **Issue**: ESC listener must update when `isOpen` or `onClose` changes
- **Solution**: Include both in dependency array: `[isOpen, onClose]`
- **Reference**: React Hooks best practices

### Event Listener Cleanup (Modal.tsx)
- **Issue**: Forgetting cleanup causes memory leaks and duplicate listeners
- **Solution**: Return cleanup function from useEffect
- **Pattern**: `return () => document.removeEventListener('keydown', handleEscape)`

### Async Handler in JSX (App.tsx)
- **Issue**: `handleBriefingComplete` is async, React warns about promises in event handlers
- **Solution**: Already handled with `void` operator (line 488): `onComplete={() => void handleBriefingComplete()}`
- **Apply same pattern**: `onClose={() => void handleBriefingComplete()}`

### Modal Stacking (Phase 3.7 memory)
- **Issue**: Phase 3.7 had double scrollbar due to nested overflow
- **Solution**: Already fixed (Modal has `overflow-hidden`, inner content has `overflow-y-auto`)
- **No risk**: This change doesn't affect scrolling

---

## Validation

### Syntax & Style (Pre-commit)
```bash
cd frontend
bun run lint                  # ESLint check
bun run type-check            # TypeScript compile
# Expected: No new errors
```

### Unit Tests
```bash
cd frontend
bun test                      # Run Vitest
# Expected: All 417 tests pass
```

### Manual Verification
```bash
# Terminal 1
cd backend && uv run uvicorn src.main:app --reload

# Terminal 2
cd frontend && bun run dev

# Test Cases:
# 1. Start case → Briefing modal appears
# 2. Press ESC → Modal closes, briefing complete
# 3. Refresh → Briefing doesn't re-show
# 4. Delete save, restart → Briefing appears
# 5. Click backdrop → Modal closes, complete
# 6. Restart → Click X button → Modal closes, complete
# 7. Restart → Click "Start Investigation" → Works as before
```

---

## Dependencies

**New packages**: None - pure React hooks
**Configuration**: None
**API changes**: None

---

## Out of Scope

- Confirmation dialog before closing ("Are you sure?") - Too intrusive
- Different behavior per close method - All should mark complete
- Re-enable briefing after completion - Educational content, one-time only
- ESC key while typing in textarea - Global listener, works from anywhere

---

## Agent Orchestration Plan

### Execution Strategy

**Sequential Track**:
1. `react-vite-specialist` → Frontend changes (Tasks 1-3)
2. `validation-gates` → Run all tests
3. `documentation-manager` → Update docs (README, PLANNING, STATUS)

**Why Sequential**: Frontend-only change, no parallel work needed

### Agent-Specific Guidance

#### For react-vite-specialist
- **Input**: Tasks 1-3 (Modal.tsx ESC, App.tsx onClose, tests)
- **Context**: Quick Reference section above (no doc reading needed)
- **Pattern**: Standard React keyboard event + existing completion handler
- **Integration**: One-line change (App.tsx line 477) + ESC listener (Modal.tsx)
- **Output**: 4 close methods working (ESC, backdrop, X, button)

**Key Files to Reference**:
- `frontend/src/components/ui/Modal.tsx` (lines 1-84)
- `frontend/src/App.tsx` (lines 127, 477, 498, 518)
- `frontend/src/components/__tests__/BriefingModal.test.tsx`

#### For validation-gates
- **Input**: All code complete
- **Runs**: Tests, lint, type check
- **Output**: Pass/fail report
- **Note**: No backend changes, frontend tests should pass

#### For documentation-manager
- **Input**: Code complete, validation passed
- **Files changed**:
  - `frontend/src/components/ui/Modal.tsx` (ESC listener added)
  - `frontend/src/App.tsx` (line 477 onClose enabled)
  - Test file updates
- **Update**:
  - README.md (Phase 4.2 entry)
  - PLANNING.md (Mark Phase 4.2 complete)
  - STATUS.md (Add completion entry)
  - CHANGELOG.md (Version bump, feature entry)

### Handoff Context

**Next agent receives**:
- This PRP (full context)
- Quick Reference (no doc reading needed)
- Specific task numbers
- Actual file paths and line numbers
- Pattern code to follow

**Next agent does NOT need**:
- ❌ Read research files
- ❌ Search for examples
- ❌ Read 5-10 docs (Quick Reference has everything)
- ❌ Explore codebase (integration points provided)

---

## Anti-Patterns to Avoid

**From project experience**:
- ❌ Adding confirmation dialogs (too intrusive for educational content)
- ❌ Different completion behavior per close method (all should be same)
- ❌ Forgetting event listener cleanup (memory leaks)
- ❌ Not using `void` with async handlers in JSX (React warnings)
- ❌ Complex keyboard handling (global ESC is enough)

---

## User Impact

### Before (Phase 3.5-3.8)
- ❌ Users feel "trapped" in briefing modal
- ❌ Can't use ESC key (standard shortcut)
- ❌ Backdrop click does nothing (confusing)
- ❌ Only "Start Investigation" button works

### After (Phase 4.2)
- ✅ ESC key closes modal (accessibility)
- ✅ Backdrop click closes modal (standard UX)
- ✅ X button closes modal (visible affordance)
- ✅ "Start Investigation" still works (explicit action)
- ✅ All methods mark completion (consistent behavior)
- ✅ Users have full control (not trapped)

---

## Success Metrics

### Functional
- [ ] All 4 close methods work (ESC, backdrop, X, button)
- [ ] All methods call same handler (no duplicate logic)
- [ ] Briefing completion saved correctly
- [ ] No re-show after any dismissal method

### Quality
- [ ] 417 frontend tests pass (no regressions)
- [ ] 385 backend tests pass (no changes)
- [ ] ESLint clean (no new warnings)
- [ ] TypeScript compiles (no errors)

### User Experience
- [ ] ESC works from any focus state
- [ ] Backdrop click feels natural
- [ ] X button visible and clickable
- [ ] No confusion about how to close modal
- [ ] No accidental closures (all methods intentional)

---

## Technical Debt

**None created** - Uses standard patterns (React hooks, event listeners)

**Potentially fixed**:
- Modal component gains ESC support for ALL modals (witness, evidence, verdict)
- Briefing modal now consistent with other modals (backdrop + X)

---

## Future Enhancements (Out of Scope)

- **Phase 5+**: Add keyboard shortcuts help modal (show all shortcuts)
- **Phase 6+**: Track modal dismissal method analytics (ESC vs button vs backdrop)
- **Phase 7+**: Add "Don't show briefing again" checkbox (for returning players)

---

**Generated**: 2026-01-09
**Source**: Phase 3.5-3.8 PRPs + project documentation + user feedback
**Confidence Score**: 9/10 (one-pass implementation likely, standard React patterns)
**Alignment**: ✅ Validated against PLANNING.md UX goals and STATUS.md current state
**Effort**: 0.5 day (2 files to modify, minimal testing overhead)
