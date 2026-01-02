# Conditional Unlocking System - Product Requirement Plan

## Goal
Implement a fully functional conditional hypothesis unlocking system that enables Tier 2 hypotheses to unlock dynamically during investigation, complete with toast notifications and tier-aware UI. Players should experience "aha!" moments when discovering new investigation paths through evidence collection and threshold achievement.

## Why
- **Enhanced Gameplay Depth**: Creates non-linear investigation paths where discoveries lead to new possibilities
- **Cognitive Engagement**: Rewards thorough investigation with narrative reveals, teaching players to follow evidence
- **Replayability**: Different investigation strategies unlock different hypothesis sequences
- **User Delight**: Toast notifications provide satisfying feedback for unlocking new content
- **Foundation for Future Milestones**: Unlocking system is prerequisite for contradiction detection (Milestone 3) and enhanced scoring (Milestone 4)

## What
A complete unlocking system with the following user-visible behavior:

### Player Experience Flow
1. **Hypothesis Formation Phase**: Player sees only Tier 1 hypotheses initially (Tier 2 locked/hidden)
2. **Investigation Phase**: As player collects evidence or reaches thresholds, Tier 2 hypotheses unlock
3. **Unlock Notification**: Toast appears: "New hypothesis unlocked!" with smooth animation
4. **Tier Display**: Unlocked Tier 2 hypotheses appear in hypothesis list with visual indicator
5. **Selection**: Player can now select newly unlocked hypotheses for tracking

### Technical Requirements
- Pure function evaluation of unlock requirements (evidence_collected, threshold_met, all_of, any_of)
- State management via GameContext reducer (new actions: UNLOCK_HYPOTHESIS, ACKNOWLEDGE_NOTIFICATION)
- Toast notification component with auto-dismiss and accessible ARIA attributes
- Tier-aware UI in HypothesisFormation and Investigation components
- Unlock evaluation triggered by COLLECT_EVIDENCE action via useEffect

### Success Criteria
- [ ] All 4 requirement types evaluate correctly (evidence_collected, threshold_met, all_of, any_of)
- [ ] Unlocks trigger immediately after evidence collection
- [ ] Toast notifications appear with smooth enter/exit animations
- [ ] Tier 2 hypotheses display correctly in locked and unlocked states
- [ ] State persists unlock history for case review phase
- [ ] All TypeScript types are strict with no `any`
- [ ] Tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://react.dev/reference/react/useReducer
  why: Reducer pattern for complex state management - we extend existing gameReducer
  critical: Actions must be pure - no side effects in reducer

- url: https://react.dev/reference/react/useEffect
  why: Trigger unlock evaluation after COLLECT_EVIDENCE action
  critical: Use dependency array [state.collectedEvidenceIds] to re-evaluate on changes

- url: https://tailwindcss.com/docs/animation
  why: Toast entrance/exit animations (fade-in, slide-up)
  critical: Use @keyframes in Tailwind config, not inline styles

- url: https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA19
  why: Accessible notifications with role="alert" and aria-live="polite"
  critical: Screen readers must announce unlocks without disrupting user flow

- file: src/types/enhanced.ts
  why: All types already defined in Milestone 1 - DO NOT recreate them
  critical: Use ConditionalHypothesis, UnlockRequirement, UnlockTrigger, UnlockEvent, EnhancedPlayerState

- file: src/context/GameContext.tsx
  why: Existing reducer pattern to extend - follow same structure
  critical: Maintain immutability, use discriminated unions for actions

- file: src/components/phases/Investigation.tsx
  why: Evidence collection trigger point - add useEffect for unlock evaluation
  critical: Call unlock evaluation AFTER dispatch({ type: 'COLLECT_EVIDENCE' })

- file: src/components/phases/HypothesisFormation.tsx
  why: Display tier-aware hypotheses with lock icons for Tier 2
  critical: Filter Tier 2 hypotheses - only show if unlocked

- pattern: https://github.com/emilkowalski/sonner
  why: Modern toast pattern with Tailwind support
  note: We're NOT installing sonner - using pattern for inspiration only

- pattern: https://github.com/cassiozen/useStateMachine
  why: Lightweight state machine patterns for unlock logic
  note: We're NOT installing this - using pattern for pure function evaluation
```

### Current Codebase Tree
```bash
src/
├── types/
│   ├── game.ts (base types - DO NOT MODIFY)
│   ├── enhanced.ts (Milestone 1 - types already exist)
│   └── enhanced.fixtures.ts (test data)
├── context/
│   └── GameContext.tsx (reducer to extend)
├── components/
│   ├── phases/
│   │   ├── Investigation.tsx (trigger point - modify)
│   │   └── HypothesisFormation.tsx (tier display - modify)
│   └── ui/
│       ├── Card.tsx (reuse existing)
│       └── Button.tsx (reuse existing)
├── hooks/
│   └── useGame.ts (context consumer - no changes needed)
└── utils/
    └── scoring.ts (existing utility - reference pattern)
```

### Desired Codebase Tree
```bash
src/
├── types/
│   ├── game.ts (MODIFY - add unlock actions to GameAction union)
│   ├── enhanced.ts (NO CHANGES - types exist)
│   └── enhanced.fixtures.ts
├── context/
│   └── GameContext.tsx (MODIFY - add unlock actions to reducer)
├── components/
│   ├── phases/
│   │   ├── Investigation.tsx (MODIFY - add unlock evaluation useEffect)
│   │   └── HypothesisFormation.tsx (MODIFY - tier-aware display)
│   └── ui/
│       ├── Card.tsx
│       ├── Button.tsx
│       └── UnlockToast.tsx (CREATE - toast component)
├── hooks/
│   ├── useGame.ts
│   └── useUnlockNotifications.ts (CREATE - notification hook)
└── utils/
    ├── scoring.ts
    ├── unlocking.ts (CREATE - pure evaluation functions)
    └── __tests__/
        └── unlocking.test.ts (CREATE - unlock logic tests)
```

### Known Gotchas
```typescript
// CRITICAL: React useReducer actions must be pure
// ❌ DON'T dispatch side effects in reducer
case 'COLLECT_EVIDENCE':
  evaluateUnlocks(state); // WRONG - side effect
  return { ...state };

// ✅ DO dispatch side effects in useEffect
useEffect(() => {
  if (state.collectedEvidenceIds.length > 0) {
    evaluateUnlocks(state);
  }
}, [state.collectedEvidenceIds]);

// CRITICAL: Tailwind classes must be complete strings
// ❌ DON'T use string interpolation for class names
className={`text-${color}-500`} // WRONG - Tailwind purge won't detect

// ✅ DO use complete class strings
className={locked ? 'text-gray-500' : 'text-amber-500'} // CORRECT

// CRITICAL: EnhancedPlayerState is backward compatible
// ❌ DON'T break existing PlayerState usage
const state: EnhancedPlayerState = { /* only new fields */ }; // WRONG

// ✅ DO include all base PlayerState fields
const state: EnhancedPlayerState = {
  ...basePlayerState,
  unlockedHypotheses: [],
  unlockHistory: [],
  // ...other enhanced fields
};

// CRITICAL: Type narrowing with discriminated unions
// ❌ DON'T use type assertions
const req = requirement as EvidenceCollectedRequirement; // WRONG

// ✅ DO use type guards
if (requirement.type === 'evidence_collected') {
  // TypeScript knows requirement.evidenceId exists here
  return state.collectedEvidenceIds.includes(requirement.evidenceId);
}

// CRITICAL: Date objects in state are non-serializable
// ⚠️ ACCEPTABLE for now (no Redux), but be aware for future persistence
timestamp: new Date() // OK for Context API, NOT OK for localStorage/Redux
```

## Implementation Blueprint

### Files to Create/Modify

| File | Action | Purpose | Lines (est.) |
|------|--------|---------|--------------|
| `src/utils/unlocking.ts` | CREATE | Pure evaluation functions for unlock requirements | 150 |
| `src/utils/__tests__/unlocking.test.ts` | CREATE | Unit tests for unlock logic | 200 |
| `src/components/ui/UnlockToast.tsx` | CREATE | Toast notification component with animations | 120 |
| `src/components/ui/__tests__/UnlockToast.test.tsx` | CREATE | Unit tests for toast component | 100 |
| `src/hooks/useUnlockNotifications.ts` | CREATE | Hook to manage pending notifications | 60 |
| `src/context/GameContext.tsx` | MODIFY | Extend reducer with unlock actions | +80 |
| `src/components/phases/Investigation.tsx` | MODIFY | Add unlock evaluation useEffect + render toasts | +80 |
| `src/components/phases/HypothesisFormation.tsx` | MODIFY | Tier-aware hypothesis display | +80 |
| `src/types/game.ts` | MODIFY | Add new GameAction types for unlocking | +15 |
| `tailwind.config.js` | MODIFY | Add toast animation keyframes | +15 |

**Total Estimated Changes**: ~900 lines

### Tasks (in order)

---

#### Task 1: Create Pure Unlock Evaluation Functions
**File**: `src/utils/unlocking.ts`
**Action**: CREATE
**Purpose**: Pure functions to evaluate unlock requirements without side effects

**Key Functions**:
```typescript
// Core evaluation function (recursive for all_of/any_of)
function evaluateRequirement(
  requirement: UnlockRequirement,
  state: EnhancedPlayerState,
  initialIp?: number
): boolean

// Helper to get metric values
function getMetricValue(
  state: EnhancedPlayerState,
  metric: 'investigationProgress' | 'evidenceCount' | 'ipSpent',
  initialIp?: number
): number

// Check if hypothesis is unlocked
function isHypothesisUnlocked(
  hypothesis: ConditionalHypothesis,
  state: EnhancedPlayerState,
  initialIp?: number
): boolean

// Find hypotheses ready to unlock
function findNewlyUnlockedHypotheses(
  hypotheses: readonly ConditionalHypothesis[],
  state: EnhancedPlayerState,
  initialIp?: number
): string[] // IDs of hypotheses that should unlock

// Create unlock trigger
function createUnlockTrigger(
  evidenceId: string,
  state: EnhancedPlayerState,
  initialIp?: number
): UnlockTrigger
```

**Pattern to Follow**:
- Reference `src/utils/scoring.ts` for similar pure function patterns
- Use TypeScript discriminated union type narrowing (switch on `requirement.type`)
- No side effects - functions return values, never mutate state
- Recursive evaluation for `all_of` and `any_of` requirement types

**Acceptance Criteria**:
- [ ] `evaluateRequirement` handles all 4 requirement types correctly
- [ ] `findNewlyUnlockedHypotheses` returns only hypotheses not already unlocked
- [ ] All functions are pure (same input → same output)
- [ ] TypeScript strict mode passes with no type errors
- [ ] Functions are exported for use in GameContext

---

#### Task 2: Create Unlock Evaluation Tests
**File**: `src/utils/__tests__/unlocking.test.ts`
**Action**: CREATE
**Purpose**: Comprehensive unit tests for unlock evaluation logic

**Test Coverage**:
- `getMetricValue`: Test all 3 metrics (evidenceCount, ipSpent, investigationProgress)
- `evaluateRequirement`: Test all 4 requirement types and edge cases
- `isHypothesisUnlocked`: Test Tier 1 always unlocked, Tier 2 conditional
- `findNewlyUnlockedHypotheses`: Test filtering and exclusion logic

**Pattern to Follow**:
- Use test fixtures from `src/types/enhanced.fixtures.ts`
- Follow test pattern from `src/components/ui/__tests__/Button.test.tsx`
- Use vitest, @testing-library/react, userEvent

**Acceptance Criteria**:
- [ ] All test cases pass
- [ ] Tests cover all 4 requirement types
- [ ] Tests cover edge cases (exactly at threshold, already unlocked)
- [ ] >85% code coverage for unlocking.ts

---

#### Task 3: Update GameAction Types
**File**: `src/types/game.ts`
**Action**: MODIFY
**Purpose**: Add new action types for unlock management

**Modification**:
```typescript
// ADD import at top of file
import type { UnlockTrigger } from './enhanced';

// ADD to GameAction union (after existing actions)
| { type: 'UNLOCK_HYPOTHESIS'; hypothesisId: string; trigger: UnlockTrigger }
| { type: 'ACKNOWLEDGE_UNLOCK'; eventId: string }
```

**Pattern to Follow**:
- Maintain discriminated union pattern (each action has unique `type` field)
- Add strong typing for action payloads
- Import types from enhanced.ts (don't duplicate)

**Acceptance Criteria**:
- [ ] New actions added to GameAction type
- [ ] UnlockTrigger imported from enhanced.ts
- [ ] No circular dependencies
- [ ] TypeScript compiler accepts new action types

---

#### Task 4: Extend GameContext Reducer
**File**: `src/context/GameContext.tsx`
**Action**: MODIFY
**Purpose**: Switch to EnhancedPlayerState and handle unlock actions

**New State Fields** (extend initialState):
```typescript
// ADD to initialState
unlockedHypotheses: [],
unlockHistory: [],
discoveredContradictions: [],
resolvedContradictions: [],
pendingUnlockNotifications: []
```

**New Reducer Cases**:
```typescript
case 'UNLOCK_HYPOTHESIS':
  // Add hypothesis to unlockedHypotheses
  // Create and add UnlockEvent to unlockHistory
  // Add event ID to pendingUnlockNotifications
  // Prevent duplicate unlocks

case 'ACKNOWLEDGE_UNLOCK':
  // Remove event ID from pendingUnlockNotifications
  // Mark event as acknowledged in unlockHistory
```

**Pattern to Follow**:
- Maintain immutability (spread operators for arrays/objects)
- Follow existing reducer patterns in GameContext.tsx
- Update TypeScript state type to EnhancedPlayerState
- Import EnhancedPlayerState, UnlockEvent from `src/types/enhanced.ts`

**Acceptance Criteria**:
- [ ] `initialState` uses EnhancedPlayerState type
- [ ] `initialState` includes all enhanced fields
- [ ] `UNLOCK_HYPOTHESIS` creates event and updates all 3 arrays
- [ ] `ACKNOWLEDGE_UNLOCK` removes from pending and marks acknowledged
- [ ] Prevents duplicate unlocks
- [ ] State remains immutable

---

#### Task 5: Create Toast Notification Component
**File**: `src/components/ui/UnlockToast.tsx`
**Action**: CREATE
**Purpose**: Accessible toast notification for hypothesis unlocks

**Component Signature**:
```typescript
interface UnlockToastProps {
  hypothesisLabel: string;
  onDismiss: () => void;
  autoDismissMs?: number; // default: 5000
}

export function UnlockToast({
  hypothesisLabel,
  onDismiss,
  autoDismissMs = 5000
}: UnlockToastProps): JSX.Element
```

**UI Specifications**:
- Fixed position: `fixed top-4 right-4 z-50`
- Color scheme: Gradient amber/gold (`bg-gradient-to-r from-amber-500 to-amber-600`)
- Animation: Slide up + fade in on enter, fade out on exit
- Auto-dismiss: 5 seconds after render (configurable)
- Manual dismiss: Click X button or toast body
- Icon: Unlock icon (SVG lock with open state)
- Accessibility: `role="alert"` and `aria-live="polite"`
- Progress bar: Visual indicator of auto-dismiss countdown

**Pattern to Follow**:
- Use React hooks: useState for exit animation, useEffect for timers
- Match amber/gold theme from existing components
- Follow accessibility patterns from existing codebase

**Acceptance Criteria**:
- [ ] Uses role="alert" and aria-live="polite"
- [ ] Shows hypothesis label
- [ ] Auto-dismisses after 5 seconds (configurable)
- [ ] Has manual dismiss button
- [ ] Uses amber/gold gradient theme
- [ ] Has entrance/exit animations
- [ ] Shows progress bar for auto-dismiss countdown

---

#### Task 6: Create Toast Tests
**File**: `src/components/ui/__tests__/UnlockToast.test.tsx`
**Action**: CREATE
**Purpose**: Unit tests for toast component

**Test Coverage**:
- Renders hypothesis label correctly
- Has correct accessibility attributes (role="alert", aria-live)
- Calls onDismiss when dismiss button clicked
- Auto-dismisses after timeout
- Uses custom auto-dismiss timeout

**Pattern to Follow**:
- Use vi.useFakeTimers() for auto-dismiss tests
- Use userEvent for click interactions
- Follow test pattern from Button.test.tsx

**Acceptance Criteria**:
- [ ] All tests pass
- [ ] Tests accessibility attributes
- [ ] Tests auto-dismiss behavior
- [ ] Tests manual dismiss
- [ ] Uses fake timers for timing tests

---

#### Task 7: Update Tailwind Config for Animations
**File**: `tailwind.config.js`
**Action**: MODIFY
**Purpose**: Add keyframe animations for toast component

**Add to theme.extend**:
```javascript
keyframes: {
  'toast-enter': {
    '0%': { opacity: '0', transform: 'translateY(-10px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  'toast-progress': {
    '0%': { width: '100%' },
    '100%': { width: '0%' },
  },
},
animation: {
  'toast-enter': 'toast-enter 0.3s ease-out',
  'toast-progress': 'toast-progress 5s linear',
},
```

**Pattern to Follow**:
- Maintain existing Tailwind config structure
- Add to theme.extend, don't replace

**Acceptance Criteria**:
- [ ] toast-enter keyframe defined
- [ ] toast-progress keyframe defined
- [ ] Animations work in browser
- [ ] No breaking changes to existing config

---

#### Task 8: Create Unlock Notifications Hook
**File**: `src/hooks/useUnlockNotifications.ts`
**Action**: CREATE
**Purpose**: Hook to manage pending unlock notifications display

**Hook Signature**:
```typescript
interface UnlockNotification {
  eventId: string;
  hypothesisLabel: string;
}

function useUnlockNotifications(
  hypotheses: readonly ConditionalHypothesis[]
): {
  notifications: UnlockNotification[];
  acknowledgeNotification: (eventId: string) => void;
}
```

**Pattern to Follow**:
- Use useMemo for hypothesis label lookup map
- Use useCallback for acknowledgeNotification
- Follow useGame.ts hook pattern

**Acceptance Criteria**:
- [ ] Returns pending notifications with labels
- [ ] acknowledgeNotification dispatches ACKNOWLEDGE_UNLOCK
- [ ] Memoizes hypothesis map for performance
- [ ] Filters out null/undefined events

---

#### Task 9: Add Tier-Aware Display to Hypothesis Formation
**File**: `src/components/phases/HypothesisFormation.tsx`
**Action**: MODIFY
**Purpose**: Display Tier 1 hypotheses always, Tier 2 only if unlocked

**Filtering Logic**:
```typescript
// Cast hypotheses to ConditionalHypothesis
const hypotheses = caseData.hypotheses as unknown as ConditionalHypothesis[];
const initialIp = caseData.briefing.investigationPoints;

// Check if hypothesis is available
const isAvailable = (hypothesis: ConditionalHypothesis): boolean => {
  return isHypothesisUnlocked(hypothesis, state, initialIp);
};
```

**Visual Changes**:
- Locked Tier 2: Gray card, lock icon, "Locked - continue investigating..." text
- Unlocked Tier 2: Normal amber styling, "Unlocked" badge
- Tier 1: No changes (always available)

**Pattern to Follow**:
- Import isHypothesisUnlocked from utils/unlocking
- Use type casting for hypotheses (until Milestone 5 updates CaseData)
- Conditional rendering based on tier and unlock status

**Acceptance Criteria**:
- [ ] Tier 1 hypotheses always visible
- [ ] Tier 2 hypotheses hidden until unlocked
- [ ] Locked hypotheses show gray with lock icon
- [ ] Locked hypotheses show "Locked - continue investigating..." text
- [ ] Locked hypotheses have aria-disabled="true"
- [ ] Unlocked Tier 2 shows "Unlocked" badge
- [ ] Existing selection/probability logic works for all tiers

---

#### Task 10: Add Unlock Evaluation to Investigation Phase
**File**: `src/components/phases/Investigation.tsx`
**Action**: MODIFY
**Purpose**: Trigger unlock evaluation after evidence collection, render toast notifications

**Integration Points**:
1. Import unlock utilities and hook
2. Cast hypotheses to ConditionalHypothesis
3. Use useUnlockNotifications hook
4. Add useEffect for unlock evaluation
5. Track last collected evidence ID
6. Render toast notifications with stacking

**useEffect Pattern**:
```typescript
useEffect(() => {
  if (lastCollectedEvidenceId) {
    const newlyUnlocked = findNewlyUnlockedHypotheses(hypotheses, state, initialIp);

    newlyUnlocked.forEach(hypothesisId => {
      const trigger = createUnlockTrigger(lastCollectedEvidenceId, state, initialIp);
      dispatch({ type: 'UNLOCK_HYPOTHESIS', hypothesisId, trigger });
    });

    setLastCollectedEvidenceId(null);
  }
}, [lastCollectedEvidenceId, hypotheses, state, initialIp, dispatch]);
```

**Toast Rendering**:
```typescript
{notifications.map((notification, index) => (
  <div
    key={notification.eventId}
    style={{ top: `${16 + index * 100}px` }}
    className="fixed right-4 z-50"
  >
    <UnlockToast
      hypothesisLabel={notification.hypothesisLabel}
      onDismiss={() => acknowledgeNotification(notification.eventId)}
    />
  </div>
))}
```

**Pattern to Follow**:
- Use React.useEffect for side effects OUTSIDE reducer
- Dependency array: `[lastCollectedEvidenceId, hypotheses, state, initialIp, dispatch]`
- Only evaluate on evidence collection changes
- Dispatch one action per unlocked hypothesis

**Acceptance Criteria**:
- [ ] useEffect triggers after COLLECT_EVIDENCE action
- [ ] Unlocks are evaluated only when evidence changes
- [ ] Multiple hypotheses can unlock from single evidence collection
- [ ] No infinite loops (dependency array correct)
- [ ] Toast notifications render in fixed position
- [ ] Multiple notifications stack vertically
- [ ] Dismissing notification removes it from pending list

---

### Integration Points

```yaml
STATE_MANAGEMENT:
  file: src/context/GameContext.tsx
  changes:
    - Extend initialState with EnhancedPlayerState fields
    - Add UNLOCK_HYPOTHESIS reducer case
    - Add ACKNOWLEDGE_UNLOCK reducer case
  pattern: Maintain immutability, use spread operators

UI_COMPONENTS:
  Investigation.tsx:
    changes:
      - Add useEffect for unlock evaluation
      - Render UnlockToast components
    pattern: Side effects in useEffect, not in reducer

  HypothesisFormation.tsx:
    changes:
      - Filter hypotheses by tier and unlock status
      - Add visual indicator for locked/unlocked
    pattern: Conditional rendering based on state

TYPE_SYSTEM:
  src/types/game.ts:
    changes:
      - Add unlock actions to GameAction union
    pattern: Discriminated unions for type safety

  src/types/enhanced.ts:
    changes: NONE (types already exist from Milestone 1)

UTILITY_FUNCTIONS:
  src/utils/unlocking.ts:
    changes:
      - Create pure evaluation functions
    pattern: Pure functions, no side effects, recursive for composites
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Run FIRST - fix errors before proceeding
npm run lint          # ESLint (must pass with 0 errors)
npm run type-check    # TypeScript strict mode (must pass)

# Expected output:
# ✓ No linting errors
# ✓ No type errors
```

**Common Issues to Check**:
- Tailwind class name completeness (no string interpolation)
- Discriminated union type narrowing (use `if` checks, not type assertions)
- Immutability in reducer (spread operators, no mutations)
- Import paths are correct (relative paths from file location)

### Level 2: Unit Tests
```bash
# Run tests for unlocking logic
npm test -- --run src/utils/__tests__/unlocking.test.ts

# Run tests for toast component
npm test -- --run src/components/ui/__tests__/UnlockToast.test.tsx

# Run all tests with coverage
npm run test:coverage

# Expected: All tests pass, >85% coverage on new files
```

**Coverage Target**: >85% for src/utils/unlocking.ts and src/components/ui/UnlockToast.tsx

### Level 3: Integration Test (Manual)
```bash
npm run dev
```

**Test Scenario 1: Evidence-Based Unlock**
1. Start game → Select 3 Tier 1 hypotheses → Begin Investigation
2. Collect evidence piece "e5" (configured to unlock hypothesis "h3")
3. **Expected**: Toast notification appears "New hypothesis unlocked!"
4. **Expected**: Toast auto-dismisses after 5 seconds OR can be manually dismissed
5. Return to Hypothesis Formation phase
6. **Expected**: Hypothesis "h3" now visible with "Unlocked" badge
7. Select "h3" and assign probability
8. **Expected**: Works like any other hypothesis

**Test Scenario 2: Threshold-Based Unlock**
1. Configure hypothesis "h4" to unlock when `evidenceCount >= 3`
2. Collect evidence until count reaches 3
3. **Expected**: Toast notification for "h4" unlock
4. **Expected**: "h4" appears in hypothesis list

**Test Scenario 3: Composite Requirement (all_of)**
1. Configure hypothesis "h5" with `all_of` requirement:
   - evidence_collected: 'e1'
   - threshold_met: evidenceCount >= 2
2. Collect evidence "e1" only
3. **Expected**: No unlock yet
4. Collect one more evidence (any)
5. **Expected**: Toast notification for "h5" unlock

**Test Scenario 4: Accessibility**
1. Use keyboard navigation only
2. **Expected**: Can dismiss toast with Enter/Space key
3. Use screen reader
4. **Expected**: Toast announces "New hypothesis unlocked: [label]"

## Final Checklist
- [ ] All tests pass: `npm test` (0 failures)
- [ ] No lint errors: `npm run lint` (0 warnings/errors)
- [ ] No type errors: `npm run type-check` (0 errors)
- [ ] Manual test scenarios 1-4 successful
- [ ] Toast notifications accessible (ARIA attributes present)
- [ ] Animations smooth (no jank or layout shift)
- [ ] Multiple unlocks handled (notifications stack properly)
- [ ] State persists unlock history (visible in React DevTools)
- [ ] Code follows project conventions (see CLAUDE.md)

## Anti-Patterns to Avoid
- ❌ Don't put unlock logic in reducer - use useEffect for side effects
- ❌ Don't mutate state - always return new objects/arrays
- ❌ Don't use string interpolation for Tailwind classes - Purge won't detect
- ❌ Don't create new types - reuse ConditionalHypothesis, UnlockEvent from enhanced.ts
- ❌ Don't use `any` type - strict TypeScript required
- ❌ Don't skip accessibility - role="alert" and aria-live are required
- ❌ Don't block UI - notifications should be non-modal and auto-dismiss

## Dependencies
**No new dependencies required**. All functionality uses existing packages:
- React 18.3.1 (useState, useEffect, useReducer, useContext, useMemo, useCallback)
- TypeScript 5.6.2 (discriminated unions, strict mode)
- Tailwind CSS 3.4.15 (animations, theme colors)
- Vitest 4.0.16 + @testing-library/react 16.3.1 (testing)

**Justification**: Project uses React Context + useReducer for state management. Adding external toast libraries (e.g., react-hot-toast, sonner) would increase bundle size unnecessarily. Custom toast component is ~120 lines and fits project architecture.

## Out of Scope
The following features are deferred to later milestones:

### Milestone 3: Contradiction Detection
- Detecting evidence contradictions
- Visual highlighting of contradicting evidence
- Contradiction resolution UI

### Milestone 4: Enhanced Scoring
- Investigation efficiency metrics
- Premature closure detection
- Unlock timing analysis for case review

### Milestone 5: Case Design
- Writing actual unlock paths for Mission 1
- Designing Tier 2 hypotheses with narrative impact
- Balancing IP economy for unlock requirements

### Future Enhancements (Beyond Current Milestones)
- Toast notification queue management (currently renders all pending simultaneously)
- Persistent storage of unlock history (localStorage/IndexedDB)
- Unlock sound effects or haptic feedback
- Customizable toast duration per unlock type
- Undo unlock functionality (debug mode)

## Technical Debt & Notes

### Type Casting Rationale
```typescript
const conditionalHypotheses = caseData.hypotheses as unknown as ConditionalHypothesis[];
```
**Why**: CaseData.hypotheses is typed as `HypothesisData[]` (base type). ConditionalHypothesis extends HypothesisData, so cast is safe. Alternative would be to update CaseData type, but that breaks backward compatibility with existing mission data.

**Future Fix**: When all missions use ConditionalHypothesis, update CaseData interface in game.ts.

### Date Objects in State
```typescript
timestamp: Date // in UnlockEvent
```
**Why**: Date objects are non-serializable (can't be saved to localStorage/Redux). Acceptable for now since we use Context API only.

**Future Fix**: When adding persistence (Milestone 6+), convert to ISO strings:
```typescript
timestamp: string // ISO 8601 format
```

### Unlock Trigger Determination
Current implementation always sets `trigger.type = 'evidence_collected'` even for threshold-based unlocks. This is technically incorrect but doesn't affect functionality.

**Future Fix**: Analyze unlock requirements to determine actual trigger type (evidence vs threshold). Requires more sophisticated algorithm in findNewlyUnlockedHypotheses.

### Toast Notification Positioning
Fixed position (`fixed top-4 right-4`) works for desktop but may overlap mobile nav elements.

**Future Fix**: Add responsive positioning:
```typescript
className="fixed top-20 md:top-4 right-4" // Account for mobile nav
```

---

**Generated**: 2025-12-31
**Source**: INITIAL.md
**Research**: RESEARCH.md
**Confidence Score**: 8/10

**Confidence Rationale**:
- ✅ **High**: Types already exist (Milestone 1), reducer pattern established, clear requirements
- ✅ **High**: Pure function evaluation is straightforward, React patterns well-documented
- ✅ **High**: UI components follow existing patterns (Card, Button), Tailwind theme consistent
- ⚠️ **Medium**: useEffect dependency array may need iteration (potential re-render issues)
- ⚠️ **Medium**: Toast animation timing may require fine-tuning for smoothness
- ⚠️ **Low Risk**: No external dependencies, no breaking changes to existing functionality

**Estimated Implementation Time**: 6-8 hours for experienced React/TypeScript developer

**Recommended Next Steps**:
1. Review PRP with stakeholder (validate requirements match vision)
2. Assign to **react-vite-specialist** agent for implementation
3. Run **validation-gates** agent after implementation
4. Update STATUS.md and documentation via **documentation-manager** agent
