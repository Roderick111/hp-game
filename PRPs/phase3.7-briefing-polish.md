# Phase 3.7: Briefing UI Polish - Product Requirement Plan

## Goal
Fix 2 UI issues in BriefingModal: transition timing appears too early, double scrollbar visible.

## Why
- **User feedback**: Transition message breaks immersion by appearing before player ready to investigate
- **Visual bug**: Double scrollbar is unprofessional and confusing
- **Impact**: Polished briefing flow improves first-play experience

## What
Simple UI polish fixes to existing Phase 3.6 briefing interface.

### Success Criteria
- [ ] Transition message appears ONLY when player ready (not immediately after teaching question)
- [ ] Single scrollbar visible (internal dialogue container only)
- [ ] No functional regressions in briefing flow
- [ ] All 417 frontend tests still pass

## Context & References

### Codebase Patterns
```yaml
- file: frontend/src/components/BriefingModal.tsx
  why: Main component to modify (transition timing + overflow)
  lines: 92-192 (full component)

- file: frontend/src/components/ui/Modal.tsx
  why: Parent modal - check for conflicting overflow styles
  lines: 33-38 (content div with overflow-y-auto)
```

### Current Implementation Issues

**Issue 1: Transition Timing** (BriefingModal.tsx line 134):
```tsx
{/* Transition */}
<BriefingMessage speaker="moody" text={briefing.transition} />
```
- **Problem**: Always visible after teaching question answered
- **Expected**: Show only when player done asking questions

**Issue 2: Double Scrollbars**:
- **Root cause**: Modal has `max-h-[80vh] overflow-y-auto` (line 34) + inner content div has `overflow-y-auto` (line 92)
- **Expected**: Only inner scroll, outer container fixed height

## Quick Reference

### Tailwind Overflow Classes
```tsx
// REMOVE outer scroll
overflow-hidden    // Prevents scrolling
max-h-screen       // Fixed height without scroll

// KEEP inner scroll
overflow-y-auto    // Vertical scroll only
max-h-[70vh]       // Constrained height with scroll
```

### Transition Display Options

**Option A: Show on hover/focus "START INVESTIGATION"**
```tsx
// Add tooltip/popover on button hover
<button
  title="Now get to work. The library's waiting. CONSTANT VIGILANCE."
  onMouseEnter={() => showTransitionTooltip()}
>
  Start Investigation
</button>
```

**Option B: Show after ≥1 question asked**
```tsx
// Conditional render based on conversation length
{conversation.length > 0 && (
  <BriefingMessage speaker="moody" text={briefing.transition} />
)}
```

**Option C: Gray initially, prominent after interaction**
```tsx
// Style change based on interaction
<BriefingMessage
  speaker="moody"
  text={briefing.transition}
  dimmed={conversation.length === 0}  // gray when no questions
/>
```

## Current Codebase Structure
```bash
frontend/src/components/
├── BriefingModal.tsx          # Main component (transition + overflow)
├── BriefingMessage.tsx        # Message bubble (may need dimmed prop)
└── ui/
    └── Modal.tsx              # Parent (check overflow conflict)
```

## Files to Modify

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `BriefingModal.tsx` | MODIFY | Move transition, fix outer overflow | 92, 134 |
| `Modal.tsx` | MODIFY (maybe) | Remove outer overflow if conflicting | 34 |
| `BriefingMessage.tsx` | MODIFY (maybe) | Add dimmed prop if Option C chosen | - |

## Tasks (ordered)

### Task 1: Fix Double Scrollbar
**File**: `frontend/src/components/ui/Modal.tsx`
**Action**: MODIFY line 34
**Purpose**: Remove outer scroll, keep only inner scroll
**Changes**:
```tsx
// BEFORE (line 33-38)
<div
  className={`relative rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto ...`}
>

// AFTER
<div
  className={`relative rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden ...`}
>
```
**Acceptance**:
- Modal wrapper has `overflow-hidden` (no outer scroll)
- BriefingModal inner content still has `overflow-y-auto` (line 92)
- Single scrollbar visible in dialogue container

---

### Task 2: Conditional Transition Display
**File**: `frontend/src/components/BriefingModal.tsx`
**Action**: MODIFY line 133-134
**Purpose**: Show transition ONLY after player asks ≥1 question
**Pattern**: Option B (simplest, no new components)
**Changes**:
```tsx
// BEFORE (line 133-134)
{/* Transition */}
<BriefingMessage speaker="moody" text={briefing.transition} />

// AFTER
{/* Transition - only after player engages */}
{conversation.length > 0 && (
  <BriefingMessage speaker="moody" text={briefing.transition} />
)}
```
**Acceptance**:
- Transition hidden initially (after teaching question)
- Transition appears after player asks first follow-up question
- Transition always visible if conversation.length > 0

---

### Task 3: Update BriefingModal Tests
**File**: `frontend/src/components/__tests__/BriefingModal.test.tsx`
**Action**: MODIFY
**Purpose**: Update tests for conditional transition display
**Changes**:
- Update "shows transition message" test to check `conversation.length > 0` condition
- Add test: "hides transition when no questions asked yet"
- Add test: "shows transition after first question"
**Acceptance**:
- All 59 BriefingModal tests pass
- New tests cover conditional transition logic

---

### Task 4: Manual Verification
**Action**: Manual test
**Purpose**: Verify both fixes work together
**Steps**:
1. Start game, open briefing modal
2. Answer teaching question
3. **Check**: Transition NOT visible yet
4. **Check**: Only 1 scrollbar visible (internal)
5. Ask follow-up question
6. **Check**: Transition now visible
7. Scroll dialogue feed
8. **Check**: Smooth scroll, no double scrollbar glitch

---

## Integration Points

### BriefingModal → Modal Wrapper
- **Current**: Modal provides outer container with `overflow-y-auto` (conflicting)
- **Change**: Modal uses `overflow-hidden`, delegates scroll to child

### Transition Visibility Logic
- **Trigger**: `conversation.length > 0` (player asked ≥1 question)
- **Alternative**: Could use `selectedChoice !== null && conversation.length > 0` (requires both teaching answer AND question)

## Known Gotcas

### Overflow Inheritance
- **Issue**: Tailwind overflow classes can conflict when nested
- **Solution**: Explicit `overflow-hidden` on outer, `overflow-y-auto` on inner ONLY

### React Conditional Rendering
- **Issue**: `{condition && <Component />}` can cause flicker if condition toggles rapidly
- **Solution**: Our condition is stable (conversation.length only increases)

## Validation Loop

### Level 1: Visual Check
```bash
bun run dev
# 1. Open briefing modal
# 2. Answer teaching question → Transition hidden ✓
# 3. Scroll dialogue → Single scrollbar ✓
# 4. Ask question → Transition appears ✓
```

### Level 2: Tests
```bash
cd frontend
bun run test
# Expected: 417/417 passing (same as before)
# New tests cover conditional transition
```

### Level 3: TypeScript
```bash
cd frontend
bun run type-check
# Expected: No new errors
```

## Dependencies
None (CSS-only changes + conditional render logic)

## Out of Scope
- Transition animation (fade in/out)
- Tooltip hover approach (Option A)
- Dimmed styling approach (Option C)
- Backend changes (YAML transition text unchanged)

## Effort Estimate
**0.5 days** (2-3 hours)
- Task 1: 15 min (CSS change)
- Task 2: 10 min (conditional render)
- Task 3: 30 min (test updates)
- Task 4: 15 min (manual verification)

## Confidence Score
**9/10** - Simple CSS + conditional render. Low risk.

---
Generated: 2026-01-07
Source: User feedback (Phase 3.6 UI issues)
