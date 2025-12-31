name: "Enhanced Type System - Milestone 1"
description: |
  Create comprehensive TypeScript type system for conditional hypothesis unlocking,
  evidence contradictions, and unlock events. Foundation for enhanced game mechanics
  in Auror Academy: Case Files detective game.

---

## Goal

Create `src/types/enhanced.ts` with four new TypeScript interfaces that extend the existing game type system to support:
1. **ConditionalHypothesis**: Multi-tier hypotheses with unlock requirements
2. **Contradiction**: Evidence conflict tracking with resolution metadata
3. **UnlockEvent**: Event/notification system for hypothesis unlocks
4. **Enhanced PlayerState**: Extended player state for tier tracking

**End State**: Type system ready for Milestone 2 (Conditional Unlocking System) implementation, with all types fully documented, TypeScript strict-mode compliant, and backward compatible with existing game code.

---

## Why

**Business Value**:
- Enables progressive revelation mechanic: players unlock advanced hypotheses by investigating
- Creates "aha!" moments when contradictions are discovered
- Provides foundation for achievement/progression system
- Differentiates from simple multiple-choice detective games

**User Impact**:
- More engaging investigation phase (not all hypotheses visible upfront)
- Natural learning curve (Tier 1 = accessible, Tier 2 = requires investigation)
- Clear visual feedback when unlocking new investigation paths
- Rewards thorough evidence collection

**Integration**:
- Extends existing `PlayerState` (src/types/game.ts) without breaking changes
- Prepares for Milestone 2 (unlocking logic) and Milestone 3 (contradiction detection)
- Follows existing immutability patterns used in GameContext reducer

**Problems Solved**:
- Current system: All hypotheses visible immediately → trivial for experienced players
- New system: Tiered unlocking → maintains challenge and mystery
- Current system: Evidence always supports/weakens → predictable
- New system: Contradictions → teaches critical thinking about conflicting information

---

## What

### User-Visible Behavior (Future Milestones)
When implemented:
1. Player sees only Tier 1 hypotheses initially in Hypothesis Formation phase
2. During Investigation, collecting certain evidence triggers "New hypothesis unlocked!" notification
3. Tier 2 hypotheses appear with visual distinction (locked → unlocked animation)
4. When evidence contradicts previous evidence, contradiction panel highlights conflict
5. Case Review shows which Tier 2 hypotheses were unlocked and when

### Technical Requirements
- TypeScript strict mode (no `any`, explicit return types, `readonly` properties)
- Immutable state patterns (spread operators, no mutations)
- Backward compatible (existing `PlayerState` code must work)
- Forward compatible (easy to extend for Missions 2-6)
- JSDoc comments on all interfaces explaining purpose and usage
- Discriminated unions where appropriate (e.g., unlock trigger types)

### Success Criteria
- [ ] `src/types/enhanced.ts` file created with 4 new interfaces
- [ ] All interfaces use `readonly` for immutable properties
- [ ] `ConditionalHypothesis` extends `HypothesisData` from game.ts
- [ ] `PlayerState` extended with tier/contradiction tracking fields
- [ ] TypeScript compilation succeeds with no errors (`npx tsc --noEmit`)
- [ ] All interfaces have comprehensive JSDoc comments
- [ ] Example type fixtures created demonstrating correct usage
- [ ] No breaking changes to existing game.ts types

---

## All Needed Context

### Documentation & References

```yaml
# TypeScript Official Docs
- url: https://www.typescriptlang.org/docs/handbook/2/objects.html
  why: Interface definitions, readonly properties, index signatures
  critical: "Use `readonly` for all state properties to enforce immutability"

- url: https://www.typescriptlang.org/docs/handbook/interfaces.html
  why: Interface extension with `extends` keyword
  critical: "Extending interfaces preserves backward compatibility"

- url: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
  why: Discriminated unions for UnlockEvent types
  critical: "Use literal types for `type` field to enable type narrowing"

# React Context Patterns (for future use)
- url: https://react.dev/reference/react/useReducer
  why: Understanding reducer pattern for state updates
  section: "Avoiding recreating the initial state"

# Example Implementations
- url: https://github.com/Med-Echbiy/UnlockIt
  why: Multi-tier progression system with TypeScript
  section: "Check src/types for achievement/unlock patterns"

- url: https://blog.cetindere.de/react-notification-contexts/
  why: Event queue pattern for UnlockEvent system
  critical: "Events need unique IDs and TTL for cleanup"

# Best Practices
- url: https://pierre.io/journal/typescript-best-practices/
  why: Strict mode patterns, avoiding common pitfalls
  critical: "Never use `any`, prefer `unknown` if type is truly unknown"
```

### Current Codebase Files to Reference

```yaml
- file: src/types/game.ts
  why: |
    MUST FOLLOW existing patterns:
    - Interface naming (PascalCase with descriptive names)
    - readonly Record<string, number> for probability mappings
    - Action type discriminated unions
  critical: |
    PlayerState is at lines 94-111
    HypothesisData is at lines 38-44
    Your enhanced types MUST be compatible with these

- file: src/context/GameContext.tsx
  why: |
    Shows reducer pattern and state update patterns
    All state updates use spread operator: { ...state, newField: value }
    NEVER mutate state directly
  critical: |
    Line 18: gameReducer function shows immutable update pattern
    Lines 39-48: Example of handling arrays immutably

- file: src/utils/scoring.ts
  why: |
    Shows how to work with PlayerState and CaseData types
    Example of type-safe calculations with game state

- file: src/data/mission1.ts
  why: |
    Current case data structure
    Future: Will need ConditionalHypothesis instead of HypothesisData
  note: "Don't modify this file yet, just understand structure"

- file: PLANNING.md
  why: Technical roadmap, shows Milestones 2-7 that will use these types
  section: Lines 100-180 describe future implementation needs
```

### Current Codebase Tree
```bash
src/
├── types/
│   └── game.ts              # EXISTING - Current type system
│   └── enhanced.ts          # NEW - Your file to create
├── context/
│   └── GameContext.tsx      # Will use enhanced types in Milestone 2
├── utils/
│   ├── scoring.ts           # Will use enhanced types in Milestone 4
│   ├── unlocking.ts         # FUTURE - Milestone 2 (will use your types)
│   └── contradictions.ts    # FUTURE - Milestone 3 (will use your types)
├── components/
│   └── phases/
│       ├── HypothesisFormation.tsx  # Will consume ConditionalHypothesis
│       ├── Investigation.tsx        # Will trigger UnlockEvents
│       └── CaseReview.tsx          # Will display unlock history
```

### Desired Codebase Tree (After This PRP)
```bash
src/
├── types/
│   ├── game.ts              # UNCHANGED - Existing types
│   ├── enhanced.ts          # NEW - Your 4 interfaces + PlayerState extension
│   └── enhanced.fixtures.ts # NEW - Example data for testing
```

### Known Gotchas & Critical Patterns

```typescript
// CRITICAL: TypeScript strict mode is enabled in tsconfig.json
// This means:
// ❌ NEVER use `any` type
// ✅ ALWAYS provide explicit return types on functions
// ✅ ALWAYS mark properties readonly for state objects
// ✅ ALWAYS handle undefined/null cases

// PATTERN: Extending interfaces (from src/types/game.ts pattern)
export interface ConditionalHypothesis extends HypothesisData {
  readonly tier: 1 | 2;  // Use literal types for finite sets
  readonly unlockRequirements?: UnlockRequirement[];  // Optional but type-safe
}

// GOTCHA: Don't create circular type references
// ❌ BAD: PlayerState references UnlockEvent, UnlockEvent references PlayerState
// ✅ GOOD: Use primitive types or one-way references

// PATTERN: Discriminated unions (from GameAction in game.ts:133-144)
export type UnlockTrigger =
  | { type: 'evidence_collected'; evidenceId: string }
  | { type: 'threshold_met'; metric: string; value: number };
// The `type` field enables TypeScript to narrow types in switch statements

// PATTERN: Immutable arrays and records (from GameContext.tsx:42)
export interface PlayerState {
  readonly selectedHypotheses: readonly string[];  // Array is readonly
  readonly initialProbabilities: Readonly<Record<string, number>>;  // Record is readonly
}

// GOTCHA: Optional vs undefined
// Use `field?: Type` for optional fields that may not exist
// Use `field: Type | null` when field always exists but may be null

// PATTERN: JSDoc for complex types (add to all interfaces)
/**
 * Represents a hypothesis that unlocks conditionally during investigation.
 *
 * @extends HypothesisData
 * @property tier - 1 for always available, 2 for unlockable
 * @property unlockRequirements - Conditions that must be met to unlock (Tier 2 only)
 *
 * @example
 * const tier2Hypothesis: ConditionalHypothesis = {
 *   id: "h3",
 *   label: "Advanced Theory",
 *   description: "Only visible after collecting key evidence",
 *   isCorrect: false,
 *   tier: 2,
 *   unlockRequirements: [
 *     { type: 'evidence_collected', evidenceId: 'e5' }
 *   ]
 * };
 */
```

---

## Implementation Blueprint

### Data Models and Structure

The core type system consists of 4 new interfaces in `src/types/enhanced.ts`:

#### 1. ConditionalHypothesis
Extends `HypothesisData` with tier system and unlock logic:
```typescript
/**
 * Hypothesis with conditional unlocking based on investigation progress.
 * Tier 1 = always available, Tier 2 = unlocks based on requirements.
 */
export interface ConditionalHypothesis extends HypothesisData {
  readonly tier: 1 | 2;
  readonly unlockRequirements?: readonly UnlockRequirement[];  // Only for tier 2
}

export interface UnlockRequirement {
  readonly type: 'evidence_collected' | 'threshold_met' | 'all_of' | 'any_of';
  // Additional fields based on type (discriminated union)
}
```

#### 2. Contradiction
Tracks evidence conflicts for player awareness:
```typescript
/**
 * Represents a conflict between two pieces of evidence.
 * Players must resolve contradictions to understand the case fully.
 */
export interface Contradiction {
  readonly id: string;
  readonly evidenceId1: string;
  readonly evidenceId2: string;
  readonly description: string;  // Explains the conflict
  readonly resolution?: string;   // Explanation if resolved
  readonly isResolved: boolean;
  readonly discoveredAt?: Date;   // When player found this
}
```

#### 3. UnlockEvent
Event/notification system for hypothesis unlocks:
```typescript
/**
 * Transient event fired when a Tier 2 hypothesis is unlocked.
 * Used for UI notifications and unlock history tracking.
 */
export interface UnlockEvent {
  readonly id: string;  // Unique event ID (UUID recommended)
  readonly hypothesisId: string;
  readonly trigger: UnlockTrigger;  // What caused the unlock
  readonly timestamp: Date;
  readonly acknowledged: boolean;  // Has player seen notification?
}

export type UnlockTrigger =
  | { type: 'evidence_collected'; evidenceId: string }
  | { type: 'threshold_met'; metric: string; value: number }
  | { type: 'manual_unlock' };  // For debugging/testing
```

#### 4. Enhanced PlayerState
Extends existing PlayerState with new tracking fields:
```typescript
/**
 * Extension of PlayerState with tier tracking and contradiction management.
 * MUST remain backward compatible with existing PlayerState.
 */
export interface EnhancedPlayerState extends PlayerState {
  // Hypothesis tier tracking
  readonly unlockedHypotheses: readonly string[];  // IDs of unlocked Tier 2 hypotheses
  readonly unlockHistory: readonly UnlockEvent[];  // Full unlock timeline

  // Contradiction tracking
  readonly discoveredContradictions: readonly string[];  // IDs of contradictions found
  readonly resolvedContradictions: readonly string[];    // IDs of contradictions resolved

  // Pending notifications (transient)
  readonly pendingUnlockNotifications: readonly string[];  // UnlockEvent IDs to show
}
```

### Implementation Tasks (In Order)

```yaml
Task 1: Create src/types/enhanced.ts skeleton
  Description: |
    Create the file with imports, module structure, and placeholder interfaces

  Steps:
    1. Create file: src/types/enhanced.ts
    2. Add imports from game.ts: import type { HypothesisData, PlayerState } from './game';
    3. Add JSDoc file header explaining purpose
    4. Export all 4 main interfaces (empty for now)

  Validation:
    - File exists at src/types/enhanced.ts
    - TypeScript compilation succeeds: npx tsc --noEmit

Task 2: Define UnlockRequirement and UnlockTrigger discriminated unions
  Description: |
    Create the foundational discriminated union types that other interfaces depend on.
    These enable type-safe unlock condition checking.

  Steps:
    1. Define UnlockRequirement as discriminated union with 4 types:
       - 'evidence_collected': requires evidenceId field
       - 'threshold_met': requires metric and value fields
       - 'all_of': requires requirements array (nested conditions)
       - 'any_of': requires requirements array (nested conditions)

    2. Define UnlockTrigger as discriminated union with 3 types:
       - 'evidence_collected': includes evidenceId
       - 'threshold_met': includes metric and value
       - 'manual_unlock': no additional fields

    3. Add comprehensive JSDoc to each type variant
    4. Add @example JSDoc showing usage of each variant

  Pseudocode:
    ```typescript
    /**
     * Specifies conditions that must be met to unlock a Tier 2 hypothesis.
     * Uses discriminated union pattern for type-safe requirement checking.
     */
    export type UnlockRequirement =
      | {
          readonly type: 'evidence_collected';
          readonly evidenceId: string;
        }
      | {
          readonly type: 'threshold_met';
          readonly metric: 'investigationProgress' | 'evidenceCount' | 'ipSpent';
          readonly threshold: number;
        }
      | {
          readonly type: 'all_of';
          readonly requirements: readonly UnlockRequirement[];  // Nested
        }
      | {
          readonly type: 'any_of';
          readonly requirements: readonly UnlockRequirement[];  // Nested
        };

    // Similar structure for UnlockTrigger...
    ```

  Validation:
    - TypeScript can narrow types based on `type` field
    - No compilation errors
    - JSDoc examples compile

Task 3: Implement ConditionalHypothesis interface
  Description: |
    Extend HypothesisData with tier and unlock requirements.
    MUST be backward compatible (tier 1 hypotheses work like original).

  Steps:
    1. Define interface extending HypothesisData
    2. Add `tier: 1 | 2` field (literal union for type safety)
    3. Add optional `unlockRequirements?: readonly UnlockRequirement[]`
    4. Add comprehensive JSDoc with @example showing both tier 1 and tier 2
    5. Document that unlockRequirements should only be present for tier 2

  Critical Considerations:
    - unlockRequirements MUST be optional (tier 1 doesn't have them)
    - Use readonly modifier for immutability
    - Must be compatible with existing HypothesisData consumers

  Validation:
    - Can assign HypothesisData to ConditionalHypothesis if tier field added
    - Type checking prevents tier 2 without unlockRequirements
    - JSDoc example compiles

Task 4: Implement Contradiction interface
  Description: |
    Define evidence conflict tracking with resolution status.
    Prepares for Milestone 3 (Contradiction Detection).

  Steps:
    1. Define interface with all required fields
    2. Use readonly for all fields (immutable state)
    3. Make resolution and discoveredAt optional (not set initially)
    4. Add JSDoc explaining contradiction lifecycle:
       - Created when conflict detected
       - discoveredAt set when player finds it
       - resolution set when player resolves it
       - isResolved tracks current status
    5. Add @example showing contradiction before and after resolution

  Pseudocode:
    ```typescript
    /**
     * Represents a conflict between two pieces of evidence.
     *
     * Lifecycle:
     * 1. Created when system detects conflicting evidence
     * 2. discoveredAt set when player collects both evidence pieces
     * 3. Player must reason about resolution
     * 4. isResolved becomes true, resolution stores explanation
     */
    export interface Contradiction {
      readonly id: string;  // Unique identifier, e.g. "c1"
      readonly evidenceId1: string;  // First conflicting evidence
      readonly evidenceId2: string;  // Second conflicting evidence
      readonly description: string;  // Human-readable conflict explanation
      readonly resolution?: string;  // Explanation of true facts (optional)
      readonly isResolved: boolean;  // Whether player resolved this
      readonly discoveredAt?: Date;  // When player found both pieces
    }
    ```

  Validation:
    - Can create Contradiction with only required fields
    - Optional fields work as expected
    - Type system enforces readonly

Task 5: Implement UnlockEvent interface
  Description: |
    Define event tracking for hypothesis unlocks.
    Events are transient (cleared after acknowledgment).

  Steps:
    1. Define interface with event metadata
    2. Use UnlockTrigger type for trigger field
    3. Add acknowledged field for notification state
    4. Add JSDoc explaining event lifecycle and TTL concept
    5. Document that events should be removed after acknowledgment

  Critical Considerations:
    - id should be unique (recommend UUID or timestamp-based)
    - Events are transient, not persisted long-term
    - timestamp as Date type (not string) for type safety

  Pseudocode:
    ```typescript
    /**
     * Event fired when a Tier 2 hypothesis is unlocked.
     *
     * Lifecycle:
     * 1. Created when unlock requirements met
     * 2. Added to PlayerState.unlockHistory (permanent)
     * 3. Added to PlayerState.pendingUnlockNotifications (temporary)
     * 4. UI shows notification
     * 5. User acknowledges -> acknowledged = true
     * 6. Removed from pendingUnlockNotifications
     *
     * @note Events should have TTL to prevent memory leaks in long sessions
     */
    export interface UnlockEvent {
      readonly id: string;
      readonly hypothesisId: string;
      readonly trigger: UnlockTrigger;
      readonly timestamp: Date;
      readonly acknowledged: boolean;
    }
    ```

Task 6: Extend PlayerState interface
  Description: |
    Add new fields to PlayerState for tier/contradiction tracking.
    CRITICAL: Must be backward compatible with existing code.

  Steps:
    1. Define EnhancedPlayerState extending PlayerState
    2. Add 5 new readonly fields:
       - unlockedHypotheses: readonly string[]
       - unlockHistory: readonly UnlockEvent[]
       - discoveredContradictions: readonly string[]
       - resolvedContradictions: readonly string[]
       - pendingUnlockNotifications: readonly string[]
    3. Add comprehensive JSDoc explaining each field's purpose
    4. Document relationship to existing PlayerState fields
    5. Note that this is for future milestones (not used yet)

  Backward Compatibility Strategy:
    - Existing code uses PlayerState -> still works
    - New code can use EnhancedPlayerState -> gets new fields
    - GameContext will gradually migrate to EnhancedPlayerState

  Pseudocode:
    ```typescript
    /**
     * Extended PlayerState with hypothesis tier and contradiction tracking.
     *
     * Backward Compatible: Existing PlayerState code continues working.
     * New fields support Milestones 2-4 features.
     *
     * @extends PlayerState from './game'
     */
    export interface EnhancedPlayerState extends PlayerState {
      // Hypothesis tier tracking
      readonly unlockedHypotheses: readonly string[];
      readonly unlockHistory: readonly UnlockEvent[];

      // Contradiction tracking
      readonly discoveredContradictions: readonly string[];
      readonly resolvedContradictions: readonly string[];

      // UI notifications (transient)
      readonly pendingUnlockNotifications: readonly string[];
    }
    ```

  Validation:
    - Can assign PlayerState to EnhancedPlayerState with new fields added
    - Existing code using PlayerState type still compiles
    - Type system enforces readonly on all arrays

Task 7: Create type fixtures for testing
  Description: |
    Create src/types/enhanced.fixtures.ts with example data.
    Demonstrates correct usage and enables future testing.

  Steps:
    1. Create file: src/types/enhanced.fixtures.ts
    2. Import all types from enhanced.ts
    3. Create example instances of each type:
       - tier1Hypothesis: ConditionalHypothesis (simple, always available)
       - tier2Hypothesis: ConditionalHypothesis (with unlock requirements)
       - sampleContradiction: Contradiction (before resolution)
       - resolvedContradiction: Contradiction (after resolution)
       - unlockEvent: UnlockEvent (example unlock)
       - enhancedState: EnhancedPlayerState (with all fields)
    4. Export all fixtures
    5. Add JSDoc explaining purpose of each fixture

  Pseudocode:
    ```typescript
    import type {
      ConditionalHypothesis,
      Contradiction,
      UnlockEvent,
      EnhancedPlayerState
    } from './enhanced';

    /** Tier 1 hypothesis - always available */
    export const tier1Hypothesis: ConditionalHypothesis = {
      id: "h1",
      label: "Standard Hypothesis",
      description: "Available from start",
      isCorrect: false,
      tier: 1,
      // No unlockRequirements for tier 1
    };

    /** Tier 2 hypothesis - unlocks after evidence */
    export const tier2Hypothesis: ConditionalHypothesis = {
      id: "h3",
      label: "Advanced Theory",
      description: "Unlocks after collecting evidence E5",
      isCorrect: true,
      tier: 2,
      unlockRequirements: [
        { type: 'evidence_collected', evidenceId: 'e5' }
      ]
    };

    // ... more fixtures
    ```

  Validation:
    - All fixtures compile without errors
    - Fixtures can be imported by other files
    - Examples demonstrate both simple and complex cases

Task 8: Add JSDoc examples and documentation
  Description: |
    Enhance all interfaces with comprehensive JSDoc comments.
    Critical for developer experience and future maintainability.

  Steps:
    1. Review each interface and ensure JSDoc includes:
       - Purpose and role in game mechanics
       - @property tags for each field explaining purpose
       - @example showing realistic usage
       - @see references to related types
       - @note for gotchas or important considerations
    2. Add file-level JSDoc explaining module organization
    3. Document relationship to game.ts types
    4. Add @since tags indicating Milestone 1

  Quality Criteria:
    - Every interface has at least one @example
    - Complex discriminated unions have examples for each variant
    - JSDoc explains "why" not just "what"

Task 9: Final validation and type checking
  Description: |
    Run all validation checks to ensure type system is complete and correct.

  Steps:
    1. Run TypeScript compiler: npx tsc --noEmit
    2. Check no errors or warnings
    3. Import enhanced types in a test file to verify exports work
    4. Verify all fixtures compile
    5. Check that existing game.ts types are not modified

  Success Criteria:
    - npx tsc --noEmit returns 0 exit code
    - No type errors anywhere in codebase
    - Can import all types from src/types/enhanced
    - Fixtures demonstrate correct usage
```

### Integration Points

```yaml
TYPES:
  - file: src/types/game.ts
    change: None - DO NOT MODIFY existing types
    note: EnhancedPlayerState extends PlayerState from here

  - file: src/types/enhanced.ts
    change: CREATE with all 4 interfaces
    exports: |
      - ConditionalHypothesis
      - Contradiction
      - UnlockEvent
      - EnhancedPlayerState
      - UnlockRequirement (type)
      - UnlockTrigger (type)

FUTURE INTEGRATION (Milestone 2+, not this PRP):
  - src/context/GameContext.tsx: Will use EnhancedPlayerState
  - src/data/mission1.ts: Will convert to ConditionalHypothesis
  - src/utils/unlocking.ts: Will use UnlockRequirement
  - src/components/: Will consume these types
```

---

## Validation Loop

### Level 1: TypeScript Compilation
```bash
# CRITICAL: Run this FIRST before any other validation
npx tsc --noEmit

# Expected: No errors, clean compilation
# If errors: READ error message carefully, understand root cause, fix types
```

### Level 2: Type Fixture Validation
```bash
# After creating enhanced.fixtures.ts, compile it specifically
npx tsc src/types/enhanced.fixtures.ts --noEmit

# Expected: All fixtures compile without errors
# If errors: Fixtures reveal type definition problems - fix the interfaces
```

### Level 3: Import Validation
```bash
# Create a temporary test file to verify exports work
cat > /tmp/test-imports.ts << 'EOF'
import {
  ConditionalHypothesis,
  Contradiction,
  UnlockEvent,
  EnhancedPlayerState,
  UnlockRequirement,
  UnlockTrigger
} from './src/types/enhanced';

import { tier1Hypothesis, tier2Hypothesis } from './src/types/enhanced.fixtures';

console.log('All imports successful');
EOF

npx tsc /tmp/test-imports.ts --noEmit
rm /tmp/test-imports.ts

# Expected: No errors
# If errors: Export statements missing or incorrect
```

### Level 4: Strict Mode Compliance
```bash
# Verify strict mode rules are followed
grep -n "any" src/types/enhanced.ts

# Expected: No matches (no `any` types used)
# If matches found: Replace `any` with proper types or `unknown`
```

### Level 5: Readonly Verification
```bash
# Ensure all state properties are readonly
grep -E "(interface|type)" src/types/enhanced.ts -A 20 | grep -v "readonly"

# Expected: Only `type`, `interface`, `}` lines without readonly
# Review any property definitions without readonly - should be const values only
```

---

## Final Validation Checklist

Before marking this PRP complete:
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] All interfaces in src/types/enhanced.ts have JSDoc
- [ ] At least one @example per interface showing usage
- [ ] All properties marked `readonly` (immutability)
- [ ] No `any` types used anywhere (strict mode)
- [ ] Fixtures file created with valid example data
- [ ] ConditionalHypothesis properly extends HypothesisData
- [ ] EnhancedPlayerState properly extends PlayerState
- [ ] Discriminated unions use literal types for `type` field
- [ ] Backward compatibility verified (existing game.ts imports work)
- [ ] No modifications to existing game.ts file
- [ ] File structure matches PLANNING.md Milestone 1 expectations

---

## Anti-Patterns to Avoid

❌ **Don't modify existing game.ts** - Extend types, don't change them
❌ **Don't use `any` type** - TypeScript strict mode forbids it, use `unknown` if needed
❌ **Don't make properties mutable** - All state must be `readonly`
❌ **Don't create circular type references** - Keep dependency graph one-way
❌ **Don't skip JSDoc** - Future developers need documentation
❌ **Don't over-engineer** - This is Milestone 1, implement ONLY what's needed now
❌ **Don't break backward compatibility** - Existing PlayerState code must keep working
❌ **Don't use optional chaining (`?.`) in types** - Use discriminated unions instead
❌ **Don't nest generics excessively** - Keep types simple and readable

---

## Context-Rich Examples

### Example: Complete ConditionalHypothesis Definition

```typescript
/**
 * Hypothesis that can be locked or unlocked based on investigation progress.
 *
 * Tier 1 hypotheses are always available from the start.
 * Tier 2 hypotheses unlock when specific requirements are met.
 *
 * @extends HypothesisData
 * @property tier - Hypothesis accessibility level (1=always, 2=conditional)
 * @property unlockRequirements - Conditions to unlock (Tier 2 only)
 *
 * @example Tier 1 Hypothesis (Always Available)
 * ```typescript
 * const basicHypothesis: ConditionalHypothesis = {
 *   id: "h1",
 *   label: "The witness lied",
 *   description: "Initial testimony was fabricated",
 *   isCorrect: false,
 *   tier: 1
 *   // No unlockRequirements needed
 * };
 * ```
 *
 * @example Tier 2 Hypothesis (Unlocks After Evidence)
 * ```typescript
 * const advancedHypothesis: ConditionalHypothesis = {
 *   id: "h3",
 *   label: "Complex conspiracy theory",
 *   description: "Only makes sense after finding key evidence",
 *   isCorrect: true,
 *   tier: 2,
 *   unlockRequirements: [
 *     {
 *       type: 'all_of',
 *       requirements: [
 *         { type: 'evidence_collected', evidenceId: 'e5' },
 *         { type: 'threshold_met', metric: 'ipSpent', threshold: 6 }
 *       ]
 *     }
 *   ]
 * };
 * ```
 *
 * @see UnlockRequirement for requirement specification
 * @see EnhancedPlayerState for tracking unlock status
 */
export interface ConditionalHypothesis extends HypothesisData {
  readonly tier: 1 | 2;
  readonly unlockRequirements?: readonly UnlockRequirement[];
}
```

### Example: Discriminated Union Pattern

```typescript
/**
 * Specifies what caused a Tier 2 hypothesis to unlock.
 *
 * Uses discriminated union pattern: the `type` field determines
 * which additional fields are present, enabling type-safe narrowing.
 *
 * @example Type Narrowing in Switch
 * ```typescript
 * function describeUnlock(trigger: UnlockTrigger): string {
 *   switch (trigger.type) {
 *     case 'evidence_collected':
 *       // TypeScript knows trigger.evidenceId exists here
 *       return `Unlocked by collecting evidence ${trigger.evidenceId}`;
 *
 *     case 'threshold_met':
 *       // TypeScript knows trigger.metric and trigger.value exist
 *       return `Unlocked when ${trigger.metric} reached ${trigger.value}`;
 *
 *     case 'manual_unlock':
 *       // TypeScript knows no additional fields
 *       return 'Manually unlocked (debug mode)';
 *   }
 * }
 * ```
 */
export type UnlockTrigger =
  | {
      readonly type: 'evidence_collected';
      readonly evidenceId: string;
    }
  | {
      readonly type: 'threshold_met';
      readonly metric: 'investigationProgress' | 'evidenceCount' | 'ipSpent';
      readonly value: number;
    }
  | {
      readonly type: 'manual_unlock';
    };
```

---

## Research References

### TypeScript Patterns
- [TypeScript: Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html) - Interface basics
- [TypeScript: Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html) - Extension patterns
- [TypeScript: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) - Discriminated unions
- [TypeScript Best Practices 2024](https://pierre.io/journal/typescript-best-practices/) - Strict mode tips

### Implementation Examples
- [UnlockIt Achievement System](https://github.com/Med-Echbiy/UnlockIt) - Multi-tier progression
- [React Notification Context](https://blog.cetindere.de/react-notification-contexts/) - Event queue pattern
- [Mastra Detective Game](https://mastra.ai/blog/the-detective-game) - Evidence system design

### Project Context
- PLANNING.md lines 100-180: Milestones 2-7 that will consume these types
- GAME_DESIGN.md: Explains why conditional unlocking enhances gameplay
- src/types/game.ts: Existing type system to extend
- src/context/GameContext.tsx: Reducer pattern to follow

---

## Confidence Score: 9/10

**Why High Confidence**:
- ✅ Clear, well-defined interfaces with specific requirements
- ✅ Comprehensive context from existing codebase
- ✅ Detailed JSDoc examples showing exact usage
- ✅ Validation steps are executable and specific
- ✅ Backward compatibility strategy clear
- ✅ No external dependencies required (pure TypeScript)
- ✅ Fixtures demonstrate correct usage
- ✅ Official TypeScript docs referenced for patterns

**Why Not 10/10**:
- UnlockRequirement nested structure (all_of/any_of) could be complex to get right first try
- May need iteration on exact field names based on dev preference (e.g., `threshold` vs `value`)

**Mitigation**:
- Tasks are granular (define unions first, then use them)
- Multiple validation checkpoints catch errors early
- Fixtures will reveal any type definition issues immediately

---

## Notes for AI Agent

**Priority 1 - Type Safety**:
- Every interface must compile with `npx tsc --noEmit` at each task
- No `any` types - use `unknown` if truly needed
- All state properties `readonly` - enforces immutability

**Priority 2 - Documentation**:
- JSDoc is not optional - every interface needs examples
- Explain "why" not just "what" in comments
- Include @example tags that show realistic usage

**Priority 3 - Backward Compatibility**:
- DO NOT modify game.ts
- EnhancedPlayerState extends PlayerState - existing code keeps working
- Test that existing imports still work

**If Stuck**:
1. Check TypeScript compiler error messages - they're usually accurate
2. Review existing game.ts patterns - mirror those patterns
3. Look at enhanced.fixtures.ts - if fixtures don't compile, types are wrong
4. Re-read discriminated union docs - that's the trickiest part

**When Complete**:
- All validation checkpoints should pass
- You should be able to import all types in another file
- Fixtures demonstrate each interface works correctly
- No changes to existing game.ts file
