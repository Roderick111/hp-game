# Contradiction Detection + Enhanced Scoring - Product Requirement Plan

## Goal
Implement comprehensive contradiction detection and enhanced scoring systems that teach players critical thinking through evidence conflicts and provide detailed investigation quality metrics. Players should discover evidence contradictions during investigation, reason about which source is accurate, and receive nuanced feedback on their investigation efficiency, thoroughness, and critical thinking beyond simple confirmation bias scores.

## Why
- **Enhanced Learning**: Contradictions force players to confront conflicting information, mirroring real-world critical thinking challenges
- **Deeper Engagement**: Evidence conflicts create narrative tension and "aha!" moments when resolved
- **Better Feedback**: Multi-dimensional scoring (efficiency, thoroughness, contradiction resolution, tier discovery) provides actionable insights
- **Skill Development**: Players learn to recognize conflicting evidence, evaluate source reliability, and distinguish speed from thoroughness
- **Foundation for Advanced Cases**: Contradiction system enables complex narratives where witnesses lie, memories conflict, or evidence is planted

## What
A complete contradiction detection and enhanced scoring system with the following user-visible behavior:

### Contradiction Detection Experience
1. **Investigation Phase**: As player collects evidence, system detects when both pieces of a defined contradiction are collected
2. **Discovery Notification**: Visual indicator appears showing "Evidence Conflict Detected!"
3. **Contradiction Panel**: Player can view detailed explanation of the conflict (e.g., "Witness A claims suspect was home, but Witness B saw suspect leaving")
4. **Resolution Tracking**: System tracks discovered vs. resolved contradictions for scoring
5. **Case Review Display**: Shows how many contradictions were found and reasoned about

### Enhanced Scoring Experience
1. **Investigation Efficiency**: Metric showing IP value per evidence piece (encourages smart choices)
2. **Thoroughness Score**: Reward for comprehensive investigation (penalizes premature closure)
3. **Contradiction Mastery**: Bonus points for discovering and reasoning about conflicts
4. **Tier Discovery Bonus**: Recognition for unlocking Tier 2 hypotheses (rewards exploration)
5. **Detailed Breakdown**: CaseReview.tsx shows all 4 new metrics with visual representations

### Technical Requirements
- Pure function evaluation of contradictions (check if both evidence IDs collected)
- State management via GameContext reducer (new actions: DISCOVER_CONTRADICTION, RESOLVE_CONTRADICTION)
- ContradictionPanel component with accessible ARIA attributes
- Extended scoring.ts with 4 new calculation functions
- Updated CaseReview.tsx with metric visualizations
- Contradiction detection triggered by COLLECT_EVIDENCE action via useEffect

### Success Criteria
- [ ] Contradictions detect correctly when both evidence pieces collected
- [ ] ContradictionPanel displays all active contradictions accessibly
- [ ] All 4 new scoring metrics calculate accurately
- [ ] CaseReview shows enhanced metrics with visual representations
- [ ] State persists contradiction discovery/resolution history
- [ ] >85% test coverage on new code
- [ ] All TypeScript types are strict with no `any`
- [ ] Tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`

## Context & References

### Documentation (URLs for AI agent to reference)
```yaml
- url: https://react.dev/reference/react/useReducer
  why: Extend reducer for contradiction actions - maintain immutability with spread operators
  critical: All reducer cases must return new state objects, never mutate existing state

- url: https://react.dev/reference/react/useEffect
  why: Trigger contradiction detection after evidence collection
  critical: Dependency array must include state.collectedEvidenceIds to re-evaluate on changes

- url: https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA19
  why: Accessible contradiction notifications with role="region" and aria-label
  critical: Screen readers must announce contradictions without disrupting investigation flow

- url: https://tailwindcss.com/docs/animation
  why: Visual indicators for contradictions (pulse, highlight, color transitions)
  critical: Use color + icons for color-blind accessibility, not color alone

- url: https://vitest.dev/guide/
  why: Unit testing patterns for pure functions (contradictions.ts, scoring.ts extensions)
  critical: Follow existing test patterns from unlocking.test.ts - nested describe blocks

- url: https://testing-library.com/docs/react-testing-library/intro/
  why: Component testing for ContradictionPanel
  critical: Test accessibility attributes, not implementation details
```

### Codebase Patterns (files to study)
```yaml
- file: /Users/danielmedina/Documents/claude_projects/hp_game/src/types/enhanced.ts
  why: Contradiction interface already defined in Milestone 1 - DO NOT recreate
  critical: Use Contradiction type with discoveredAt, isResolved, resolution fields

- file: /Users/danielmedina/Documents/claude_projects/hp_game/src/context/GameContext.tsx
  why: Existing reducer pattern to extend - follow same structure for contradiction actions
  critical: Maintain immutability, use discriminated unions, generate event IDs like UNLOCK_HYPOTHESIS

- file: /Users/danielmedina/Documents/claude_projects/hp_game/src/utils/unlocking.ts
  why: Pure function pattern for evaluation logic - mirror this structure for contradictions
  critical: Pure functions, no side effects, TypeScript discriminated unions for type safety

- file: /Users/danielmedina/Documents/claude_projects/hp_game/src/utils/scoring.ts
  why: Existing scoring calculation pattern - extend with new metrics maintaining style
  critical: Helper functions for each metric, main calculateScores() orchestrates all

- file: /Users/danielmedina/Documents/claude_projects/hp_game/src/components/phases/Investigation.tsx
  why: Evidence collection trigger point - add contradiction detection useEffect similar to unlock evaluation
  critical: Set lastCollectedEvidenceId state, evaluate contradictions in useEffect, dispatch actions

- file: /Users/danielmedina/Documents/claude_projects/hp_game/src/components/phases/CaseReview.tsx
  why: Scoring display pattern with visual progress bars and color-coded feedback
  critical: Use Card component, progress bars with percentages, color-coded interpretation (green/amber/red)

- file: /Users/danielmedina/Documents/claude_projects/hp_game/src/utils/__tests__/unlocking.test.ts
  why: Test structure pattern - nested describe blocks, comprehensive edge case coverage
  critical: Test all requirement types, edge cases (exactly at threshold, empty arrays), use fixtures

- file: /Users/danielmedina/Documents/claude_projects/hp_game/src/components/ui/UnlockToast.tsx
  why: Notification component pattern - can reference for contradiction discovery notifications if needed
  critical: Accessible with role="alert", auto-dismiss with configurable timeout
```

### Research (from RESEARCH.md)
```yaml
- url: https://mastra.ai/blog/the-detective-game
  why: Cross-character contradictions pattern - how other detective games handle evidence conflicts
  note: They use confrontation mechanics; we're using discovery + reasoning model

- url: https://github.com/scb-10x/typhoon-detective-game
  why: Dynamic case generation with evidence analysis - shows contradiction scoring patterns
  note: Reference their scoring algorithm for contradiction resolution rewards

- url: https://arxiv.org/html/2504.15582
  why: Calibration error metrics for decision-making under uncertainty
  note: Mathematical foundation for scoring investigation efficiency and thoroughness

- url: https://www.let-all.com/blog/2024/03/13/calibration-for-decision-making-a-principled-approach-to-trustworthy-ml/
  why: Principled approach to trustworthy scoring metrics
  note: Avoid gamification - metrics should teach, not trick players

- url: https://blog.logrocket.com/react-typescript-10-patterns-writing-better-code/
  why: React TypeScript discriminated unions for type-safe state management
  note: Use for contradiction types and scoring metric types

- url: https://www.inexture.com/modern-react-design-patterns-ui-architecture-examples/
  why: Container/Presentational pattern for complex UI (CaseReview scoring display)
  note: Separate calculation logic (utils/scoring.ts) from display logic (CaseReview.tsx)
```

## Current Codebase Structure
```bash
src/
├── types/
│   ├── game.ts (base types - PlayerScores to extend)
│   ├── enhanced.ts (Milestone 1 - Contradiction interface exists)
│   └── enhanced.fixtures.ts (test data - may need contradiction fixtures)
├── context/
│   └── GameContext.tsx (reducer to extend with contradiction actions)
├── components/
│   ├── phases/
│   │   ├── Investigation.tsx (trigger point - add contradiction detection)
│   │   └── CaseReview.tsx (display point - add enhanced metrics)
│   └── ui/
│       ├── Card.tsx (reuse for contradiction panel)
│       ├── Button.tsx (reuse for resolution acknowledgment)
│       └── UnlockToast.tsx (existing notification pattern)
├── hooks/
│   └── useGame.ts (context consumer - no changes needed)
└── utils/
    ├── scoring.ts (extend with new metrics)
    ├── unlocking.ts (reference pattern for contradictions.ts)
    └── __tests__/
        └── unlocking.test.ts (reference test pattern)
```

## Desired Codebase Structure
```bash
src/
├── types/
│   ├── game.ts (MODIFY - extend PlayerScores interface with new metrics)
│   ├── enhanced.ts (NO CHANGES - Contradiction type exists)
│   └── enhanced.fixtures.ts (MODIFY - add contradiction test fixtures)
├── context/
│   └── GameContext.tsx (MODIFY - add contradiction actions to reducer)
├── components/
│   ├── phases/
│   │   ├── Investigation.tsx (MODIFY - add contradiction detection useEffect + ContradictionPanel)
│   │   └── CaseReview.tsx (MODIFY - add enhanced metrics display)
│   └── ui/
│       ├── Card.tsx
│       ├── Button.tsx
│       ├── UnlockToast.tsx
│       └── ContradictionPanel.tsx (CREATE - display evidence conflicts)
├── hooks/
│   └── useGame.ts
└── utils/
    ├── scoring.ts (MODIFY - add 4 new metric functions)
    ├── unlocking.ts
    ├── contradictions.ts (CREATE - pure detection functions)
    └── __tests__/
        ├── unlocking.test.ts
        ├── contradictions.test.ts (CREATE - contradiction logic tests)
        └── scoring.test.ts (CREATE - new scoring metrics tests)
```

## Files to Create/Modify

| File | Action | Purpose | Dependencies |
|------|--------|---------|--------------|
| `src/utils/contradictions.ts` | CREATE | Pure contradiction detection functions | enhanced.ts types |
| `src/utils/__tests__/contradictions.test.ts` | CREATE | Unit tests for contradiction logic | contradictions.ts |
| `src/utils/scoring.ts` | MODIFY | Add 4 new scoring metric functions | enhanced.ts types |
| `src/utils/__tests__/scoring.test.ts` | CREATE | Unit tests for new scoring metrics | scoring.ts |
| `src/components/ui/ContradictionPanel.tsx` | CREATE | Accessible contradiction display component | Contradiction type |
| `src/components/ui/__tests__/ContradictionPanel.test.tsx` | CREATE | Unit tests for panel component | ContradictionPanel.tsx |
| `src/context/GameContext.tsx` | MODIFY | Add contradiction reducer actions | contradictions.ts |
| `src/components/phases/Investigation.tsx` | MODIFY | Add contradiction detection useEffect + render panel | contradictions.ts, ContradictionPanel |
| `src/components/phases/CaseReview.tsx` | MODIFY | Add enhanced metrics display | scoring.ts new functions |
| `src/types/game.ts` | MODIFY | Extend PlayerScores interface | None |
| `src/types/enhanced.fixtures.ts` | MODIFY | Add contradiction test fixtures | enhanced.ts |
| `tailwind.config.js` | MODIFY | Add contradiction highlight animations | None |

**Total Estimated Changes**: ~1200 lines

## Tasks (ordered)

---

### Task 1: Create Pure Contradiction Detection Functions
**File**: `src/utils/contradictions.ts`
**Action**: CREATE
**Purpose**: Pure functions to detect evidence contradictions without side effects

**Key Functions**:
```typescript
// Check if both pieces of a contradiction have been collected
function isContradictionDiscovered(
  contradiction: Contradiction,
  collectedEvidenceIds: readonly string[]
): boolean

// Find contradictions that should be newly discovered
function findNewlyDiscoveredContradictions(
  contradictions: readonly Contradiction[],
  collectedEvidenceIds: readonly string[],
  discoveredContradictionIds: readonly string[]
): Contradiction[]

// Check if all defined contradictions have been discovered
function areAllContradictionsDiscovered(
  contradictions: readonly Contradiction[],
  discoveredContradictionIds: readonly string[]
): boolean

// Get contradiction resolution rate for scoring
function getContradictionResolutionRate(
  totalContradictions: number,
  resolvedContradictionIds: readonly string[]
): number // 0-100 percentage
```

**Pattern to Follow**:
- Reference `src/utils/unlocking.ts` for pure function patterns
- No side effects - functions return values, never mutate state
- Use TypeScript strict typing with readonly arrays
- Export all functions for use in GameContext and tests

**Acceptance Criteria**:
- [ ] `isContradictionDiscovered` checks both evidence IDs are collected
- [ ] `findNewlyDiscoveredContradictions` returns only new contradictions (not already discovered)
- [ ] All functions are pure (same input → same output)
- [ ] TypeScript strict mode passes with no type errors
- [ ] Functions are exported for use in GameContext

**Depends on**: None

---

### Task 2: Create Contradiction Detection Tests
**File**: `src/utils/__tests__/contradictions.test.ts`
**Action**: CREATE
**Purpose**: Comprehensive unit tests for contradiction detection logic

**Test Coverage**:
- `isContradictionDiscovered`: Test both evidence collected, only one collected, neither collected
- `findNewlyDiscoveredContradictions`: Test empty contradictions, all discovered, partial discovery
- `areAllContradictionsDiscovered`: Test all cases, none discovered, partial discovered
- `getContradictionResolutionRate`: Test 0%, 50%, 100% resolution, division by zero edge case

**Pattern to Follow**:
- Use test fixtures from `src/types/enhanced.fixtures.ts`
- Follow test pattern from `src/utils/__tests__/unlocking.test.ts`
- Use vitest, nested describe blocks, comprehensive edge cases

**Acceptance Criteria**:
- [ ] All test cases pass
- [ ] Tests cover all edge cases (empty arrays, all discovered, none discovered)
- [ ] Tests use fixtures for consistency
- [ ] >85% code coverage for contradictions.ts

**Depends on**: Task 1

---

### Task 3: Extend Scoring Functions with New Metrics
**File**: `src/utils/scoring.ts`
**Action**: MODIFY
**Purpose**: Add 4 new scoring metric calculation functions

**New Functions to Add**:
```typescript
/**
 * Calculate investigation efficiency: average IP value per evidence piece
 * Higher score = better IP management (collected high-value evidence efficiently)
 * Score: 0-100, where 100 = perfect efficiency (all critical evidence, minimal waste)
 */
function calculateInvestigationEfficiency(
  playerState: PlayerState,
  caseData: CaseData
): number

/**
 * Calculate premature closure score: did player stop investigating too early?
 * Lower score = premature closure (stopped with IP remaining + missed critical evidence)
 * Score: 0-100, where 100 = thorough investigation, 0 = stopped way too early
 */
function calculatePrematureClosureScore(
  playerState: PlayerState,
  caseData: CaseData
): number

/**
 * Calculate contradiction resolution mastery
 * Score: 0-100 based on percentage of contradictions discovered and resolved
 * Bonus points for discovering contradictions at all (shows critical thinking)
 */
function calculateContradictionScore(
  playerState: EnhancedPlayerState,
  caseData: CaseData
): number

/**
 * Calculate tier discovery bonus
 * Score: 0-100 based on number of Tier 2 hypotheses unlocked
 * Rewards exploration and following evidence threads
 */
function calculateTierDiscoveryScore(
  playerState: EnhancedPlayerState,
  caseData: CaseData
): number

/**
 * Extend existing calculateScores to include new metrics
 */
function calculateScores(
  playerState: EnhancedPlayerState, // Changed from PlayerState
  caseData: CaseData
): PlayerScores // Extended interface
```

**Pseudocode for Key Logic**:
```typescript
// Investigation Efficiency
// Concept: Critical evidence is high-value, non-critical is lower value
// Perfect score = 100 if all critical found with minimal IP waste
calculateInvestigationEfficiency:
  criticalEvidence = count critical evidence collected
  totalEvidence = count all evidence collected
  ipSpent = initial - remaining

  if totalEvidence === 0: return 0 // No investigation

  criticalRatio = criticalEvidence / totalEvidence
  efficiencyRatio = totalEvidence / ipSpent // Evidence per IP point

  // Weighted: 70% critical ratio, 30% efficiency ratio
  score = (criticalRatio * 70) + (min(efficiencyRatio, 1.0) * 30)
  return round(score)

// Premature Closure Score
// Concept: Penalize stopping early with IP remaining + missed critical evidence
calculatePrematureClosureScore:
  ipRemaining = playerState.investigationPointsRemaining
  missedCriticalCount = count critical evidence not collected

  if ipRemaining === 0: return 100 // Used all IP (thoroughness)
  if missedCriticalCount === 0: return 100 // Found all critical (thoroughness)

  // Penalty increases with more IP remaining and more critical missed
  ipPenalty = (ipRemaining / initial) * 50 // Max 50 point penalty
  criticalPenalty = (missedCriticalCount / totalCritical) * 50 // Max 50 point penalty

  score = 100 - ipPenalty - criticalPenalty
  return max(0, round(score)) // Floor at 0

// Contradiction Score
calculateContradictionScore:
  totalContradictions = caseData.contradictions.length
  if totalContradictions === 0: return 100 // No contradictions in case

  discoveredCount = playerState.discoveredContradictions.length
  resolvedCount = playerState.resolvedContradictions.length

  discoveryRate = discoveredCount / totalContradictions
  resolutionRate = resolvedCount / discoveredCount (or 0 if none discovered)

  // 60% weight on discovery, 40% on resolution
  score = (discoveryRate * 60) + (resolutionRate * 40)
  return round(score)

// Tier Discovery Score
calculateTierDiscoveryScore:
  tier2Hypotheses = count hypotheses with tier = 2
  if tier2Hypotheses === 0: return 100 // No Tier 2 in case

  unlockedCount = playerState.unlockedHypotheses.length
  unlockRate = unlockedCount / tier2Hypotheses

  return round(unlockRate * 100)
```

**Pattern to Follow**:
- Follow existing scoring.ts function structure (helper functions + main calculateScores)
- Use PlayerState for basic metrics, cast to EnhancedPlayerState when needed
- Handle division by zero edge cases gracefully
- Return scores as 0-100 integers (use Math.round)

**Acceptance Criteria**:
- [ ] All 4 new metric functions calculate correctly
- [ ] Handles edge cases (0 evidence, 0 contradictions, 0 tier 2 hypotheses)
- [ ] calculateScores extended to return new metrics in PlayerScores
- [ ] No division by zero errors
- [ ] TypeScript strict mode passes

**Depends on**: None (parallel with Task 1)

---

### Task 4: Create Scoring Tests
**File**: `src/utils/__tests__/scoring.test.ts`
**Action**: CREATE
**Purpose**: Unit tests for new scoring metric functions

**Test Coverage**:
- `calculateInvestigationEfficiency`: Test 100% critical found, 50% critical found, 0 evidence collected
- `calculatePrematureClosureScore`: Test all IP used, 50% IP remaining + missed critical, all IP remaining
- `calculateContradictionScore`: Test all discovered + resolved, 50% discovered, 0 contradictions in case
- `calculateTierDiscoveryScore`: Test all Tier 2 unlocked, 0 unlocked, 0 Tier 2 in case
- Edge cases: Division by zero, negative values, boundary conditions

**Pattern to Follow**:
- Create mock PlayerState and CaseData fixtures
- Use nested describe blocks per function
- Test edge cases comprehensively

**Acceptance Criteria**:
- [ ] All test cases pass
- [ ] Tests cover all 4 new metrics
- [ ] Edge cases tested (0 evidence, 0 contradictions, etc.)
- [ ] >85% code coverage for new scoring functions

**Depends on**: Task 3

---

### Task 5: Update PlayerScores Type
**File**: `src/types/game.ts`
**Action**: MODIFY
**Purpose**: Extend PlayerScores interface with new metrics

**Modification**:
```typescript
// EXTEND existing PlayerScores interface
export interface PlayerScores {
  // Existing fields (keep all)
  correctHypothesisSelected: boolean;
  initialProbabilityOnCorrect: number;
  finalProbabilityOnCorrect: number;
  confirmationBiasScore: number;
  mostInvestigatedHypothesis: string;
  foundCriticalEvidence: boolean;
  missedCriticalEvidence: string[];
  investigationBreakdown: Array<{
    hypothesisId: string;
    hypothesisLabel: string;
    actionsCount: number;
    percentage: number;
  }>;

  // ADD new enhanced metrics (Milestone 4)
  investigationEfficiency: number; // 0-100
  prematureClosureScore: number; // 0-100
  contradictionScore: number; // 0-100
  tierDiscoveryScore: number; // 0-100
}
```

**Pattern to Follow**:
- Maintain backward compatibility (all existing fields required)
- Add new fields as required (not optional)
- Document each new field with JSDoc comments

**Acceptance Criteria**:
- [ ] New fields added to PlayerScores
- [ ] TypeScript compiler accepts extended interface
- [ ] No breaking changes to existing code
- [ ] Fields documented with clear descriptions

**Depends on**: None

---

### Task 6: Update GameAction Types for Contradictions
**File**: `src/types/game.ts`
**Action**: MODIFY
**Purpose**: Add new action types for contradiction management

**Modification**:
```typescript
// ADD to GameAction union (after existing actions)
| { type: 'DISCOVER_CONTRADICTION'; contradictionId: string }
| { type: 'RESOLVE_CONTRADICTION'; contradictionId: string; resolution: string }
```

**Pattern to Follow**:
- Maintain discriminated union pattern (each action has unique `type` field)
- Add strong typing for action payloads
- Follow existing action naming convention (SCREAMING_SNAKE_CASE)

**Acceptance Criteria**:
- [ ] New actions added to GameAction type
- [ ] No circular dependencies
- [ ] TypeScript compiler accepts new action types

**Depends on**: None

---

### Task 7: Extend GameContext Reducer for Contradictions
**File**: `src/context/GameContext.tsx`
**Action**: MODIFY
**Purpose**: Add contradiction reducer cases to handle discovery and resolution

**New Reducer Cases**:
```typescript
case 'DISCOVER_CONTRADICTION': {
  // Prevent duplicate discoveries
  if (state.discoveredContradictions.includes(action.contradictionId)) {
    return state;
  }

  return {
    ...state,
    discoveredContradictions: [...state.discoveredContradictions, action.contradictionId],
  };
}

case 'RESOLVE_CONTRADICTION': {
  // Only resolve if discovered
  if (!state.discoveredContradictions.includes(action.contradictionId)) {
    return state; // Can't resolve undiscovered contradiction
  }

  // Prevent duplicate resolutions
  if (state.resolvedContradictions.includes(action.contradictionId)) {
    return state;
  }

  return {
    ...state,
    resolvedContradictions: [...state.resolvedContradictions, action.contradictionId],
  };
}
```

**Pattern to Follow**:
- Maintain immutability (spread operators for arrays)
- Follow existing reducer patterns in GameContext.tsx
- Prevent duplicate discoveries/resolutions
- Import types from enhanced.ts

**Acceptance Criteria**:
- [ ] `DISCOVER_CONTRADICTION` adds to discoveredContradictions array
- [ ] `RESOLVE_CONTRADICTION` adds to resolvedContradictions array
- [ ] Prevents duplicate discoveries and resolutions
- [ ] State remains immutable
- [ ] TypeScript strict mode passes

**Depends on**: Task 6

---

### Task 8: Add Contradiction Test Fixtures
**File**: `src/types/enhanced.fixtures.ts`
**Action**: MODIFY
**Purpose**: Add contradiction test data for consistent testing

**New Fixtures to Add**:
```typescript
// Contradiction test data
export const contradiction1: Contradiction = {
  id: 'c1',
  evidenceId1: 'e3',
  evidenceId2: 'e7',
  description: 'Witness A claims suspect was home all evening, but Witness B saw suspect leaving at 8pm',
  isResolved: false,
};

export const contradiction2Resolved: Contradiction = {
  id: 'c2',
  evidenceId1: 'e5',
  evidenceId2: 'e9',
  description: 'Wand residue suggests Stunning Spell, but witness reports seeing green light (Killing Curse)',
  resolution: 'Green light was reflection from enchanted mirror, not Killing Curse',
  isResolved: true,
  discoveredAt: new Date('2025-01-15T10:30:00'),
};

export const contradiction3: Contradiction = {
  id: 'c3',
  evidenceId1: 'e1',
  evidenceId2: 'e2',
  description: 'Time-Turner log shows suspect was in Diagon Alley, but Floo Network records show no travel',
  isResolved: false,
};

// Enhanced state with contradictions
export const stateWithContradictions: EnhancedPlayerState = {
  ...midGameEnhancedState,
  discoveredContradictions: ['c1', 'c2'],
  resolvedContradictions: ['c2'],
};
```

**Pattern to Follow**:
- Follow existing fixture structure in enhanced.fixtures.ts
- Use realistic Harry Potter evidence scenarios
- Provide both resolved and unresolved examples

**Acceptance Criteria**:
- [ ] At least 3 contradiction fixtures created
- [ ] Includes both resolved and unresolved examples
- [ ] Uses realistic evidence IDs that match other fixtures
- [ ] Exports for use in tests

**Depends on**: None

---

### Task 9: Create ContradictionPanel Component
**File**: `src/components/ui/ContradictionPanel.tsx`
**Action**: CREATE
**Purpose**: Accessible component to display evidence contradictions to player

**Component Signature**:
```typescript
interface ContradictionPanelProps {
  contradictions: readonly Contradiction[];
  discoveredIds: readonly string[];
  resolvedIds: readonly string[];
  evidenceMap: Map<string, { title: string; description: string }>; // For evidence titles
  onResolve?: (contradictionId: string) => void; // Optional resolution callback
}

export function ContradictionPanel({
  contradictions,
  discoveredIds,
  resolvedIds,
  evidenceMap,
  onResolve
}: ContradictionPanelProps): JSX.Element | null
```

**UI Specifications**:
- Show only discovered contradictions (filter by discoveredIds)
- Visual distinction: Unresolved (amber warning), Resolved (green checkmark)
- Display evidence titles for both pieces (use evidenceMap)
- Show contradiction description prominently
- If resolved, show resolution text
- Accessibility: role="region", aria-label="Evidence Contradictions"
- Color-blind safe: Use icons + colors (⚠️ for unresolved, ✓ for resolved)

**Example Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Evidence Contradictions (2 active)                       │
├─────────────────────────────────────────────────────────────┤
│ ⚠️ UNRESOLVED: Witness Testimony Conflict                   │
│ • Witness A: "Suspect was home all evening"                 │
│ • Witness B: "I saw suspect leaving at 8pm"                 │
│ Description: Conflicting alibi testimonies require          │
│ evaluation of witness credibility and timing.               │
│ [Mark as Reviewed] button (optional)                        │
├─────────────────────────────────────────────────────────────┤
│ ✓ RESOLVED: Spell Evidence Conflict                         │
│ • Wand Residue: "Stunning Spell detected"                   │
│ • Witness Report: "I saw green light (Killing Curse)"       │
│ Resolution: Green light was reflection from enchanted       │
│ mirror, not Killing Curse. Wand residue is accurate.        │
└─────────────────────────────────────────────────────────────┘
```

**Pattern to Follow**:
- Use Card component from ui/ for container
- Use Tailwind CSS for styling (amber for unresolved, green for resolved)
- Follow accessibility patterns from existing codebase
- Conditional rendering - return null if no discovered contradictions

**Acceptance Criteria**:
- [ ] Shows only discovered contradictions
- [ ] Visual distinction between resolved/unresolved (icons + colors)
- [ ] Displays evidence titles from evidenceMap
- [ ] Shows contradiction description
- [ ] Shows resolution text for resolved contradictions
- [ ] Has role="region" and aria-label for accessibility
- [ ] Color-blind safe (icons + colors)
- [ ] Returns null if no discovered contradictions

**Depends on**: Task 8 (for testing with fixtures)

---

### Task 10: Create ContradictionPanel Tests
**File**: `src/components/ui/__tests__/ContradictionPanel.test.tsx`
**Action**: CREATE
**Purpose**: Unit tests for contradiction panel component

**Test Coverage**:
- Renders null when no discovered contradictions
- Renders unresolved contradictions with warning icon
- Renders resolved contradictions with checkmark
- Displays evidence titles from evidenceMap
- Has correct accessibility attributes
- Calls onResolve when resolution button clicked

**Pattern to Follow**:
- Use @testing-library/react
- Use userEvent for interactions
- Test accessibility attributes
- Use contradiction fixtures from enhanced.fixtures.ts

**Acceptance Criteria**:
- [ ] All tests pass
- [ ] Tests accessibility attributes
- [ ] Tests conditional rendering
- [ ] Tests resolved vs unresolved display
- [ ] Uses fixtures for consistency

**Depends on**: Task 9

---

### Task 11: Add Contradiction Detection to Investigation Phase
**File**: `src/components/phases/Investigation.tsx`
**Action**: MODIFY
**Purpose**: Trigger contradiction detection after evidence collection, render ContradictionPanel

**Integration Points**:
1. Import contradiction utilities and component
2. Cast caseData.contradictions (when they exist in CaseData)
3. Add useEffect for contradiction detection
4. Track contradictions in local state
5. Render ContradictionPanel below evidence summary

**useEffect Pattern**:
```typescript
// Add to Investigation.tsx after unlock evaluation useEffect
useEffect(() => {
  if (lastCollectedEvidenceId) {
    // Get contradictions from case data (will be added in Milestone 5)
    const contradictions = (caseData as any).contradictions as Contradiction[] || [];

    const newlyDiscovered = findNewlyDiscoveredContradictions(
      contradictions,
      state.collectedEvidenceIds,
      state.discoveredContradictions
    );

    for (const contradiction of newlyDiscovered) {
      dispatch({ type: 'DISCOVER_CONTRADICTION', contradictionId: contradiction.id });
    }
  }
}, [lastCollectedEvidenceId, state.collectedEvidenceIds, state.discoveredContradictions, dispatch]);
```

**ContradictionPanel Rendering**:
```typescript
// Add below "Evidence Collected" Card, above "Proceed Button"
{state.discoveredContradictions.length > 0 && (
  <Card>
    <ContradictionPanel
      contradictions={contradictions}
      discoveredIds={state.discoveredContradictions}
      resolvedIds={state.resolvedContradictions}
      evidenceMap={evidenceMap} // Build from investigationActions
    />
  </Card>
)}
```

**Pattern to Follow**:
- Use React.useEffect for side effects OUTSIDE reducer
- Dependency array: `[lastCollectedEvidenceId, state.collectedEvidenceIds, state.discoveredContradictions, dispatch]`
- Only evaluate when evidence changes
- Build evidenceMap from investigationActions for titles

**Acceptance Criteria**:
- [ ] useEffect triggers after COLLECT_EVIDENCE action
- [ ] Contradictions evaluated only when evidence changes
- [ ] Multiple contradictions can be discovered from single evidence
- [ ] No infinite loops (dependency array correct)
- [ ] ContradictionPanel renders when contradictions discovered
- [ ] EvidenceMap provides titles for contradiction display

**Depends on**: Task 9 (ContradictionPanel component)

---

### Task 12: Update CaseReview with Enhanced Metrics
**File**: `src/components/phases/CaseReview.tsx`
**Action**: MODIFY
**Purpose**: Display 4 new scoring metrics with visual representations

**New Section to Add** (after existing "Investigation Pattern Analysis"):
```typescript
{/* Enhanced Investigation Metrics */}
<Card>
  <h2 className="text-2xl font-serif font-bold text-amber-900 mb-4 border-b-2 border-amber-300 pb-2">
    Investigation Quality Metrics
  </h2>

  <div className="space-y-6">
    {/* Investigation Efficiency */}
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-amber-900">Investigation Efficiency</h3>
        <span className="text-2xl font-bold text-amber-700">{scores.investigationEfficiency}/100</span>
      </div>
      <div className="h-4 bg-amber-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 rounded-full transition-all duration-500"
          style={{ width: `${scores.investigationEfficiency}%` }}
        />
      </div>
      <p className="text-sm text-amber-700 mt-2">
        {scores.investigationEfficiency >= 80
          ? 'Excellent IP management! You focused on high-value evidence.'
          : scores.investigationEfficiency >= 60
          ? 'Good efficiency, but some low-value evidence collected.'
          : 'Consider prioritizing critical evidence to maximize IP value.'}
      </p>
    </div>

    {/* Thoroughness Score */}
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-amber-900">Thoroughness</h3>
        <span className="text-2xl font-bold text-amber-700">{scores.prematureClosureScore}/100</span>
      </div>
      <div className="h-4 bg-amber-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            scores.prematureClosureScore >= 80 ? 'bg-green-500' : 'bg-red-500'
          }`}
          style={{ width: `${scores.prematureClosureScore}%` }}
        />
      </div>
      <p className="text-sm text-amber-700 mt-2">
        {scores.prematureClosureScore >= 80
          ? 'Thorough investigation! You explored the case comprehensively.'
          : 'You stopped investigating with IP remaining and missed critical evidence.'}
      </p>
    </div>

    {/* Contradiction Mastery */}
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-amber-900">Critical Thinking (Contradictions)</h3>
        <span className="text-2xl font-bold text-amber-700">{scores.contradictionScore}/100</span>
      </div>
      <div className="h-4 bg-amber-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${scores.contradictionScore}%` }}
        />
      </div>
      <p className="text-sm text-amber-700 mt-2">
        {scores.contradictionScore >= 80
          ? 'Excellent! You discovered and reasoned about evidence conflicts.'
          : scores.contradictionScore >= 50
          ? 'Good awareness of contradictions, but some were missed or unresolved.'
          : 'Look for conflicting evidence to strengthen your analysis.'}
      </p>
    </div>

    {/* Tier Discovery */}
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-amber-900">Exploration (Tier 2 Discovery)</h3>
        <span className="text-2xl font-bold text-amber-700">{scores.tierDiscoveryScore}/100</span>
      </div>
      <div className="h-4 bg-amber-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${scores.tierDiscoveryScore}%` }}
        />
      </div>
      <p className="text-sm text-amber-700 mt-2">
        {scores.tierDiscoveryScore >= 80
          ? 'Great exploration! You unlocked advanced hypotheses.'
          : scores.tierDiscoveryScore >= 50
          ? 'You found some advanced hypotheses, but missed others.'
          : 'Follow evidence threads to unlock new investigation paths.'}
      </p>
    </div>
  </div>
</Card>
```

**Pattern to Follow**:
- Use Card component for section
- Progress bars with percentages like existing investigationBreakdown
- Color-coded interpretations (green ≥80, amber ≥60, red <60)
- Descriptive feedback messages for each metric

**Acceptance Criteria**:
- [ ] All 4 new metrics displayed with progress bars
- [ ] Color-coded interpretation (green/amber/red)
- [ ] Descriptive feedback for each score range
- [ ] Visual style consistent with existing CaseReview
- [ ] Metrics appear after "Investigation Pattern Analysis"

**Depends on**: Task 3 (scoring functions) and Task 5 (PlayerScores extended)

---

### Task 13: Update Tailwind Config for Contradiction Animations
**File**: `tailwind.config.js`
**Action**: MODIFY
**Purpose**: Add animation keyframes for contradiction highlighting

**Add to theme.extend**:
```javascript
keyframes: {
  // ... existing toast keyframes ...
  'contradiction-pulse': {
    '0%, 100%': { opacity: '1', backgroundColor: 'rgb(251 191 36 / 0.1)' }, // amber-400/10
    '50%': { opacity: '1', backgroundColor: 'rgb(251 191 36 / 0.3)' }, // amber-400/30
  },
  'contradiction-highlight': {
    '0%': { boxShadow: '0 0 0 0 rgba(251, 191, 36, 0.7)' },
    '70%': { boxShadow: '0 0 0 10px rgba(251, 191, 36, 0)' },
    '100%': { boxShadow: '0 0 0 0 rgba(251, 191, 36, 0)' },
  },
},
animation: {
  // ... existing animations ...
  'contradiction-pulse': 'contradiction-pulse 2s ease-in-out infinite',
  'contradiction-highlight': 'contradiction-highlight 1s ease-out',
},
```

**Pattern to Follow**:
- Maintain existing Tailwind config structure
- Add to theme.extend, don't replace

**Acceptance Criteria**:
- [ ] contradiction-pulse keyframe defined
- [ ] contradiction-highlight keyframe defined
- [ ] Animations work in browser
- [ ] No breaking changes to existing config

**Depends on**: None

---

## Integration Points

### State Management
- **Where**: `src/context/GameContext.tsx`
- **What**: Add DISCOVER_CONTRADICTION and RESOLVE_CONTRADICTION reducer cases
- **Pattern**: Follow existing reducer patterns (UNLOCK_HYPOTHESIS as reference)
- **Critical**: Maintain immutability with spread operators

### Contradiction Detection
- **Where**: `src/components/phases/Investigation.tsx`
- **What**: Add useEffect to evaluate contradictions after evidence collection
- **Pattern**: Similar to unlock evaluation - trigger on lastCollectedEvidenceId change
- **Critical**: Prevent infinite loops with correct dependency array

### Scoring Calculation
- **Where**: `src/utils/scoring.ts`
- **What**: Extend calculateScores() to call 4 new metric functions
- **Pattern**: Helper functions + main orchestrator (existing pattern)
- **Critical**: Handle division by zero, return 0-100 integers

### UI Display
- **Where**: `src/components/phases/CaseReview.tsx`
- **What**: Add new metrics section with progress bars
- **Pattern**: Follow existing investigationBreakdown display
- **Critical**: Color-coded interpretations, descriptive feedback

### Type System
- **Where**: `src/types/game.ts`
- **What**: Extend PlayerScores interface, add contradiction GameAction types
- **Pattern**: Maintain discriminated unions, backward compatibility
- **Critical**: No breaking changes to existing types

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
- Division by zero handling in scoring functions
- Immutability in reducer (spread operators, no mutations)
- Import paths are correct (relative paths from file location)
- All new functions exported from modules

### Level 2: Unit Tests
```bash
# Run tests for contradiction logic
npm test -- --run src/utils/__tests__/contradictions.test.ts

# Run tests for new scoring metrics
npm test -- --run src/utils/__tests__/scoring.test.ts

# Run tests for ContradictionPanel
npm test -- --run src/components/ui/__tests__/ContradictionPanel.test.tsx

# Run all tests with coverage
npm run test:coverage

# Expected: All tests pass, >85% coverage on new files
```

**Coverage Target**: >85% for src/utils/contradictions.ts, new scoring functions, and ContradictionPanel.tsx

### Level 3: Integration Test (Manual)
```bash
npm run dev
```

**Test Scenario 1: Contradiction Discovery**
1. Start game → Select hypotheses → Begin Investigation
2. Collect first piece of contradiction evidence (e.g., "e3")
3. **Expected**: No contradiction panel appears yet
4. Collect second piece of contradiction evidence (e.g., "e7")
5. **Expected**: ContradictionPanel appears showing the conflict
6. **Expected**: Panel shows both evidence titles and contradiction description
7. **Expected**: Panel has ⚠️ icon and amber styling (unresolved)

**Test Scenario 2: Multiple Contradictions**
1. Continue investigation, collect evidence that triggers 2nd contradiction
2. **Expected**: ContradictionPanel shows both contradictions
3. **Expected**: Both displayed with unresolved styling
4. Click "Mark as Reviewed" (if implemented) on first contradiction
5. **Expected**: First contradiction changes to ✓ icon and green styling

**Test Scenario 3: Enhanced Scoring Display**
1. Complete investigation → Make predictions → View resolution → Go to Case Review
2. **Expected**: Case Review shows new "Investigation Quality Metrics" section
3. **Expected**: 4 progress bars displayed (Efficiency, Thoroughness, Contradictions, Tier Discovery)
4. **Expected**: Each metric shows 0-100 score with color-coded interpretation
5. **Expected**: Descriptive feedback text for each metric
6. **Expected**: Progress bars animate to percentage values

**Test Scenario 4: Edge Cases**
1. Complete case without discovering any contradictions
2. **Expected**: Contradiction score = 100 (no contradictions in case) OR appropriate score if contradictions exist
3. Complete case with 0 IP spent (impossible normally, but test with debug)
4. **Expected**: No division by zero errors, scores calculate gracefully
5. Complete case unlocking all Tier 2 hypotheses
6. **Expected**: Tier Discovery Score = 100

**Test Scenario 5: Accessibility**
1. Use keyboard navigation only
2. **Expected**: ContradictionPanel accessible via Tab key
3. Use screen reader
4. **Expected**: ContradictionPanel announces "Evidence Contradictions" region
5. **Expected**: Each contradiction announced with unresolved/resolved status

## Final Checklist
- [ ] All tests pass: `npm test` (0 failures)
- [ ] No lint errors: `npm run lint` (0 warnings/errors)
- [ ] No type errors: `npm run type-check` (0 errors)
- [ ] Manual test scenarios 1-5 successful
- [ ] ContradictionPanel accessible (ARIA attributes present)
- [ ] Enhanced metrics display correctly in CaseReview
- [ ] All 4 scoring metrics calculate accurately
- [ ] Contradictions detect when both evidence pieces collected
- [ ] State persists contradiction discovery/resolution history
- [ ] Code follows project conventions (see CLAUDE.md)
- [ ] >85% test coverage on new code

## Documentation Updates (REQUIRED)

### STATUS.md
```markdown
## Completed Milestones
✅ Milestone 1: Enhanced Type System (v0.2.0)
✅ Milestone 2: Conditional Unlocking System (v0.3.0)
✅ Milestone 3: Contradiction Detection (v0.4.0)
✅ Milestone 4: Enhanced Scoring (v0.4.0)

## Current Status
Version: 0.4.0
Phase: Ready for Milestone 5 (Mission 1 Case Design)
```

### PLANNING.md
```markdown
## Key Milestones

### ✅ Milestone 3: Contradiction Detection
**Status**: COMPLETE
**Deliverables**:
- ✅ utils/contradictions.ts - Pure detection functions
- ✅ ContradictionPanel component - Accessible conflict display
- ✅ Investigation.tsx integration - useEffect detection trigger
- ✅ GameContext contradiction actions - State management
- ✅ Comprehensive tests - >85% coverage

### ✅ Milestone 4: Enhanced Scoring
**Status**: COMPLETE
**Deliverables**:
- ✅ 4 new scoring metrics - Efficiency, Thoroughness, Contradictions, Tier Discovery
- ✅ Extended calculateScores() - Integrated new metrics
- ✅ CaseReview enhanced display - Visual progress bars + interpretations
- ✅ PlayerScores extended interface - New metric fields
- ✅ Comprehensive scoring tests - Edge cases covered

### ⏭️ Milestone 5: Mission 1 Case Design
**Status**: NEXT
**Goal**: Create enhanced Mission 1 with conditional hypotheses and contradictions
```

### README.md (if needed)
Add brief mentions of new features:
- Evidence contradiction detection system
- Enhanced scoring metrics (efficiency, thoroughness, critical thinking, exploration)

## Anti-Patterns to Avoid
- ❌ Don't mutate state in reducer - always return new objects/arrays with spread operators
- ❌ Don't trigger contradictions in reducer - use useEffect for side effects
- ❌ Don't divide by zero in scoring - handle edge cases (0 evidence, 0 contradictions, 0 tier 2)
- ❌ Don't use color alone for contradictions - combine icons + colors for accessibility
- ❌ Don't create new Contradiction type - use existing type from enhanced.ts (Milestone 1)
- ❌ Don't skip accessibility - ContradictionPanel must have role="region" and aria-label
- ❌ Don't display undiscovered contradictions - filter by discoveredIds
- ❌ Don't penalize efficient players - premature closure score should distinguish speed from thoroughness

## Dependencies
**No new dependencies required**. All functionality uses existing packages:
- React 18.3.1 (useState, useEffect, useReducer, useContext, useMemo)
- TypeScript 5.6.2 (discriminated unions, strict mode)
- Tailwind CSS 3.4.15 (animations, progress bars, color utilities)
- Vitest 4.0.16 + @testing-library/react 16.3.1 (testing)

**Justification**: Contradiction detection and scoring are pure TypeScript logic requiring no external libraries. UI components use existing Tailwind patterns. Testing uses established Vitest infrastructure.

## Out of Scope
The following features are deferred to later milestones:

### Milestone 5: Case Design
- Writing actual contradictions for Mission 1
- Designing resolution text for contradictions
- Balancing contradiction difficulty

### Future Enhancements (Beyond Current Milestones)
- Interactive contradiction resolution (player selects which evidence is accurate)
- Contradiction "confrontation" mechanic (present conflict to witnesses)
- Dynamic contradiction generation (AI-generated conflicts)
- Contradiction resolution hints or guidance
- Persistent storage of contradiction history (localStorage/IndexedDB)
- Contradiction impact on hypothesis probabilities (auto-adjust based on resolution)
- Visual evidence timeline showing when contradictions discovered
- Comparative scoring across multiple playthroughs

## Known Gotchas

### Contradiction Detection Timing
```typescript
// CRITICAL: Contradictions only detected when BOTH pieces collected
// Player might collect e3 in investigation 1, but e7 not until investigation 5
// Contradiction doesn't trigger until e7 collected - this is CORRECT behavior
```

### Division by Zero in Scoring
```typescript
// CRITICAL: Handle edge cases gracefully
calculateInvestigationEfficiency:
  if (totalEvidence === 0) return 0; // No investigation
  if (ipSpent === 0) return 0; // Edge case (shouldn't happen normally)

calculateContradictionScore:
  if (totalContradictions === 0) return 100; // No contradictions = perfect score
  if (discoveredCount === 0) resolutionRate = 0; // Avoid division by zero
```

### Premature Closure vs. Efficiency
```typescript
// CRITICAL: Don't penalize efficient players
// Premature Closure = stopped early + MISSED CRITICAL EVIDENCE
// Efficient = used minimal IP + FOUND ALL CRITICAL EVIDENCE

// Example: Player uses 6 IP, finds all 3 critical pieces
// Efficiency: HIGH (good IP management)
// Premature Closure Score: HIGH (found all critical, even with IP remaining)

// Example: Player uses 6 IP, misses 1 critical piece, has 6 IP remaining
// Efficiency: MEDIUM (some waste)
// Premature Closure Score: LOW (stopped too early + missed critical)
```

### CaseData Type Casting
```typescript
// TECHNICAL DEBT: CaseData doesn't have contradictions field yet
// Milestone 5 will add contradictions to CaseData
// For now, use type casting:
const contradictions = (caseData as any).contradictions as Contradiction[] || [];

// Future Fix: Update CaseData interface in game.ts:
export interface CaseData {
  // ... existing fields ...
  contradictions?: readonly Contradiction[]; // Add in Milestone 5
}
```

### Contradiction Resolution Flow
```typescript
// CRITICAL: Resolution is currently tracked but not required
// Players can discover contradictions without resolving them
// This is intentional for Milestone 3/4 - resolution UI comes in future enhancement

// Current flow:
// 1. Player collects both evidence pieces
// 2. DISCOVER_CONTRADICTION action dispatched
// 3. ContradictionPanel shows conflict
// 4. Player reads contradiction (no forced interaction)
// 5. (Optional) Player clicks "Mark as Reviewed"
// 6. RESOLVE_CONTRADICTION action dispatched
// 7. Scoring rewards discovery + resolution

// Future enhancement:
// - Force resolution before proceeding to prediction phase
// - Interactive resolution (player selects which evidence is accurate)
// - Resolution affects hypothesis probabilities
```

### State Backward Compatibility
```typescript
// CRITICAL: EnhancedPlayerState extends PlayerState
// All existing code using PlayerState continues working
// New code can use EnhancedPlayerState for contradiction tracking

// Correct usage in scoring:
function calculateScores(
  playerState: EnhancedPlayerState, // Use enhanced for new features
  caseData: CaseData
): PlayerScores {
  // Can access both base and enhanced fields
  const ipRemaining = playerState.investigationPointsRemaining; // Base field
  const discovered = playerState.discoveredContradictions; // Enhanced field
}
```

---

**Generated**: 2025-12-31
**Source**: INITIAL.md
**Research**: RESEARCH.md
**Confidence Score**: 9/10

**Confidence Rationale**:
- ✅ **Very High**: Types already exist (Contradiction from Milestone 1), reducer pattern established, clear requirements
- ✅ **Very High**: Pure function patterns proven (unlocking.ts as template), scoring extension straightforward
- ✅ **Very High**: UI components follow existing patterns (Card, progress bars from CaseReview), Tailwind theme consistent
- ✅ **High**: Test patterns established (unlocking.test.ts as template), fixtures available
- ⚠️ **Medium**: Scoring metric interpretation messages require careful wording to avoid gamification
- ⚠️ **Low Risk**: No external dependencies, no breaking changes to existing functionality, comprehensive test coverage planned

**Potential Challenges**:
1. **Scoring Balance**: Ensuring premature closure score doesn't penalize efficient players (requires careful logic)
2. **Contradiction UX**: Making ContradictionPanel non-intrusive but noticeable (visual design challenge)
3. **Edge Case Handling**: Division by zero, 0 contradictions, 0 tier 2 hypotheses (all addressed in pseudocode)

**Estimated Implementation Time**: 8-10 hours for experienced React/TypeScript developer

**Recommended Next Steps**:
1. Review PRP with stakeholder (validate scoring metric interpretations)
2. Assign to **react-vite-specialist** agent for implementation
3. Run **validation-gates** agent after implementation
4. Update STATUS.md and PLANNING.md via **documentation-manager** agent
5. Prepare for Milestone 5: Design Mission 1 contradictions and case narrative
