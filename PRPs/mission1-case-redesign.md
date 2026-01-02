# Mission 1 Case Redesign - Product Requirement Plan

## Goal

Redesign Mission 1 ("The Vanishing Violinist") to use the enhanced type system with conditional hypothesis unlocking, evidence contradictions, and multiple investigation paths. Transform the existing basic hypothesis list into a tiered system that rewards thorough investigation and critical thinking.

**End State**: Mission 1 case data (`src/data/mission1.ts`) fully leverages ConditionalHypothesis types with:
- 3-4 Tier 1 hypotheses (surface-level theories, always available)
- 2-3 Tier 2 hypotheses (deeper insights, require evidence to unlock)
- 2-3 contradictions with narrative descriptions pointing toward truth
- Multiple unlock paths (2-3 evidence combinations per Tier 2 hypothesis)
- Correct answer (`cursed-violin`) as Tier 2 to reward investigation
- Balanced IP economy (12 points total, minimum solve path 6-7 IP)

---

## Why

### Business Value
- **Educational Impact**: Teaching players that surface-level theories are often wrong (Tier 1 vs Tier 2)
- **Engagement**: "Aha!" moments when unlocking Tier 2 hypotheses create memorable gameplay
- **Replayability**: Multiple investigation paths allow different player strategies

### User Impact
- **Cognitive Growth**: Players learn to investigate beyond initial assumptions
- **Satisfaction**: Contradictions point to truth, not arbitrary puzzles
- **Fairness**: Multiple paths prevent "moon logic" frustration

### Integration with Existing Features
- Tests Milestones 1-4 implementation (155 tests passing)
- Validates unlock evaluation logic (`src/utils/unlocking.ts`)
- Validates contradiction detection (`src/utils/contradictions.ts`)
- Validates enhanced scoring metrics (investigation efficiency, tier discovery)

### Problems This Solves
- Original mission1.ts doesn't use enhanced types
- Players currently see all hypotheses from the start (no progressive discovery)
- No contradictions to teach critical thinking
- No reward for thorough investigation vs. lucky guessing

---

## What

### User-Visible Behavior

**Before (Current State)**:
- All 7 hypotheses visible from Hypothesis Formation phase
- No unlock mechanics
- No contradictions
- No tier system

**After (Enhanced State)**:
1. **Hypothesis Formation Phase**:
   - Player sees 3-4 Tier 1 hypotheses (Victor, Helena, Lucius, something-else)
   - Tier 2 hypotheses locked (cursed-violin, self-inflicted, unknown-person)
   - UI shows "??? Locked Hypothesis" placeholders

2. **Investigation Phase**:
   - Collecting specific evidence unlocks Tier 2 hypotheses
   - Toast notification: "New hypothesis unlocked: The curse was on the violin"
   - Contradictions appear when both evidence pieces collected
   - Contradiction panel highlights conflicts with narrative descriptions

3. **Prediction Phase**:
   - All unlocked hypotheses available for final probabilities
   - Contradictions help guide reasoning

4. **Resolution Phase**:
   - Correct answer is cursed-violin (Tier 2)
   - Enhanced scoring rewards:
     - Tier Discovery Score (unlocked Tier 2 hypotheses)
     - Contradiction Score (discovered conflicts)
     - Investigation Efficiency (multiple paths explored)

### Technical Requirements

#### Type System Changes
- Convert `hypotheses: HypothesisData[]` to `hypotheses: ConditionalHypothesis[]`
- Add `contradictions: Contradiction[]` array to mission1 data
- Ensure CaseData type supports contradictions field

#### Hypothesis Tier Assignments

**Tier 1 (Always Available - Surface-Level Suspects)**:
1. `victor-guilty` - The jealous ex-partner (classic red herring)
2. `helena-guilty` - The professional rival (plausible motive)
3. `lucius-involved` - The Dark wizard host (Malfoy reputation)
4. `something-else` - Epistemic humility (always available)

**Tier 2 (Unlockable - Deeper Insights)**:
1. `cursed-violin` - **CORRECT ANSWER** - The curse was on the instrument
2. `self-inflicted` - Accident/intentional theory (requires examining victim behavior)
3. `unknown-person` - Marchetti (requires research-violin evidence)

#### Unlock Requirements Design

**For `cursed-violin` (CRITICAL - CORRECT ANSWER)**:
Must have 2-3 unlock paths to prevent "moon logic":

```typescript
unlockRequirements: [{
  type: 'any_of',
  requirements: [
    // Path 1: Direct examination of the violin
    { type: 'evidence_collected', evidenceId: 'examine-violin' },

    // Path 2: Orchestra members mention violin felt "different"
    { type: 'evidence_collected', evidenceId: 'interview-orchestra' },

    // Path 3: Combine crime scene (no wand magic) + St Mungo's (contact curse)
    {
      type: 'all_of',
      requirements: [
        { type: 'evidence_collected', evidenceId: 'crime-scene' },
        { type: 'evidence_collected', evidenceId: 'st-mungos' }
      ]
    },

    // Path 4: Helena's unprompted mention + Lucius confirms violin protection
    {
      type: 'all_of',
      requirements: [
        { type: 'evidence_collected', evidenceId: 'interview-helena' },
        { type: 'evidence_collected', evidenceId: 'interview-lucius' }
      ]
    }
  ]
}]
```

**For `unknown-person` (Marchetti revelation)**:
```typescript
unlockRequirements: [{
  type: 'any_of',
  requirements: [
    // Path 1: Research violin history (direct route)
    { type: 'evidence_collected', evidenceId: 'research-violin' },

    // Path 2: Orchestra mentions servicing + examine violin
    {
      type: 'all_of',
      requirements: [
        { type: 'evidence_collected', evidenceId: 'interview-orchestra' },
        { type: 'evidence_collected', evidenceId: 'examine-violin' }
      ]
    }
  ]
}]
```

**For `self-inflicted` (Less likely theory)**:
```typescript
unlockRequirements: [{
  type: 'any_of',
  requirements: [
    // Path 1: St Mungo's + search Victor's quarters (exploring victim state)
    {
      type: 'all_of',
      requirements: [
        { type: 'evidence_collected', evidenceId: 'st-mungos' },
        { type: 'evidence_collected', evidenceId: 'search-victor-quarters' }
      ]
    },

    // Path 2: High investigation progress (thorough players unlock everything)
    { type: 'threshold_met', metric: 'ipSpent', threshold: 8 }
  ]
}]
```

#### Contradiction Design

**Contradiction 1: Victor's True Feelings**
```typescript
{
  id: 'c1-victor-love',
  evidenceId1: 'interview-victor',           // "I still care about her"
  evidenceId2: 'search-victor-quarters',     // Letters + pressed flower
  description: 'Victor claims to still love Elara, and his room confirms this with kept letters and a pressed flower. But if he still loves her, why would he harm her? This doesn\'t fit the "jealous ex attacks victim" pattern.',
  resolution: 'Victor genuinely came to hear her play, not to harm her. His love was real, not possessive. The breakup was about "incompatible life goals" (her career ambitions), not betrayal. He represents the red herring of a familiar narrative that doesn\'t match the evidence.',
  isResolved: false
}
```

**Contradiction 2: The Missing Wand Magic**
```typescript
{
  id: 'c2-no-wand-magic',
  evidenceId1: 'crime-scene',                // No residual wand magic detected
  evidenceId2: 'examine-violin',             // Strong curse residue on violin
  description: 'The crime scene shows no residual wand magic from the concert, yet the violin carries a strong curse. How was the curse cast if no one used a wand during the performance? This contradiction points to pre-placed magic.',
  resolution: 'The curse was embedded in the violin rosin days before the concert, not cast during the performance. This is why there\'s no wand magic in the room but strong curse residue on the instrument. The timing delay was intentional—Marchetti wanted distance from the crime.',
  isResolved: false
}
```

**Contradiction 3: The Protected Instrument**
```typescript
{
  id: 'c3-instrument-access',
  evidenceId1: 'interview-helena',           // "Musicians never let others touch instruments"
  evidenceId2: 'interview-lucius',           // "She never let it out of her sight here"
  description: 'Helena says professional musicians are extremely protective of their instruments. Lucius confirms Elara never let the violin out of her sight at the manor. So who had access to curse it? None of the concert suspects could have touched it.',
  resolution: 'The servicing shop had legitimate access. Elara willingly left the violin with Marchetti\'s shop for five days. Professional musicians trust instrument technicians—it\'s the one exception to the "never touch my instrument" rule. This contradiction reveals the attack vector.',
  isResolved: false
}
```

### Success Criteria

- [ ] All hypotheses have tier assignments (4 Tier 1, 3 Tier 2)
- [ ] Correct answer (`cursed-violin`) is Tier 2
- [ ] Each Tier 2 hypothesis has 2-4 unlock paths
- [ ] 3 contradictions with narrative coherence
- [ ] All contradictions point toward truth (not arbitrary)
- [ ] IP economy balanced:
  - Minimum path to unlock cursed-violin: 2 IP (examine-violin)
  - Recommended thorough path: 6-7 IP
  - Maximum investigation: 12 IP
- [ ] All tests pass (TypeScript, ESLint, Vitest)
- [ ] Build succeeds with no errors
- [ ] Manual playthrough confirms unlock paths work
- [ ] Enhanced scoring validates correctly

---

## Context & References

### Documentation (URLs for AI Agent to Reference)

```yaml
- url: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions
  why: ConditionalHypothesis uses discriminated union pattern (tier 1 vs tier 2)

- url: https://react.dev/reference/react/useReducer
  why: Understanding reducer pattern for GameContext (already implemented, but good reference)
```

### Codebase Patterns (Files to Study)

```yaml
- file: src/types/enhanced.ts
  why: ConditionalHypothesis, Contradiction, UnlockRequirement type definitions
  symbols: ConditionalHypothesis (lines 204-218), Contradiction (lines 282-309), UnlockRequirement (lines 66-92)

- file: src/utils/unlocking.ts
  why: How unlock requirements are evaluated (evaluateRequirement function)
  symbols: evaluateRequirement (lines 96-128), isHypothesisUnlocked (lines 150-175)

- file: src/utils/contradictions.ts
  why: How contradictions are detected when both evidence pieces collected
  symbols: findNewlyDiscoveredContradictions (lines 38-62)

- file: src/data/mission1.ts
  why: Current case structure to upgrade (lines 48-92 for hypotheses, lines 94-379 for investigation actions)
  symbols: hypotheses array, investigationActions array

- file: src/types/game.ts
  why: Check if CaseData needs contradictions field added
  symbols: CaseData interface (lines 7-16)
```

### Research (from RESEARCH.md)

- Phoenix Wright: Ace Attorney - [Game Developer article](https://www.gamedeveloper.com/design/phoenix-wright-ace-attorney) - Contradiction mechanics, witness testimony patterns
- Puzzle game unlock patterns - Multiple paths prevent frustration
- Detective game design - Contradictions should point to truth, not be arbitrary

---

## Current Codebase Structure

```bash
src/
├── types/
│   ├── game.ts                    # CaseData interface (may need contradictions field)
│   ├── enhanced.ts                # ConditionalHypothesis, Contradiction types (DONE)
│   └── enhanced.fixtures.ts       # Test data (DONE)
├── utils/
│   ├── unlocking.ts               # Unlock evaluation logic (DONE - 46 tests)
│   ├── contradictions.ts          # Contradiction detection (DONE - 34 tests)
│   └── scoring.ts                 # Enhanced scoring (DONE - 28 tests)
├── data/
│   └── mission1.ts                # ⚠️ TO MODIFY - Current basic hypothesis structure
├── context/
│   └── GameContext.tsx            # Reducer with unlock/contradiction actions (DONE)
└── components/
    ├── ui/
    │   ├── UnlockToast.tsx        # Toast notifications (DONE)
    │   └── ContradictionPanel.tsx # Contradiction display (DONE)
    └── phases/
        ├── Investigation.tsx      # Unlock trigger integration (DONE)
        └── CaseReview.tsx         # Enhanced metrics display (DONE)
```

---

## Desired Codebase Structure

```bash
src/
├── types/
│   └── game.ts                    # MODIFY: Add contradictions?: Contradiction[] to CaseData
└── data/
    └── mission1.ts                # MODIFY: Convert to ConditionalHypothesis[], add contradictions
```

**No new files needed** - This is purely a data structure upgrade.

---

## Files to Create/Modify

| File | Action | Purpose | Dependencies |
|------|--------|---------|--------------|
| `src/types/game.ts` | MODIFY | Add `contradictions?: Contradiction[]` field to CaseData interface (if missing) | enhanced.ts types |
| `src/data/mission1.ts` | MODIFY | Convert hypotheses to ConditionalHypothesis[], add contradictions array, assign tiers, add unlockRequirements | enhanced.ts, game.ts |

---

## Tasks (Ordered)

### Task 1: Update CaseData Type (if needed)

**File**: `src/types/game.ts`
**Action**: MODIFY
**Purpose**: Ensure CaseData interface supports contradictions array
**Pattern**: Follow Contradiction type from enhanced.ts
**Depends on**: None

**What to do**:
1. Check if CaseData interface has `contradictions?: Contradiction[]` field
2. If missing, add it:
   ```typescript
   import type { Contradiction } from './enhanced';

   export interface CaseData {
     // ... existing fields ...
     contradictions?: Contradiction[];
   }
   ```
3. If already present, skip this task

**Acceptance criteria**:
- CaseData type compiles without errors
- contradictions field is optional (backward compatible)
- TypeScript recognizes Contradiction type

---

### Task 2: Convert Hypotheses to ConditionalHypothesis

**File**: `src/data/mission1.ts`
**Action**: MODIFY
**Purpose**: Assign tier levels to all hypotheses
**Pattern**: Follow ConditionalHypothesis interface from enhanced.ts
**Depends on**: Task 1

**Current structure** (lines 48-92):
```typescript
hypotheses: [
  { id: 'victor-guilty', label: '...', description: '...', isCorrect: false },
  { id: 'helena-guilty', label: '...', description: '...', isCorrect: false },
  { id: 'cursed-violin', label: '...', description: '...', isCorrect: true },
  // ... etc
]
```

**New structure**:
```typescript
import type { ConditionalHypothesis } from '../types/enhanced';

// Update type annotation
hypotheses: ConditionalHypothesis[] = [
  // Tier 1: Surface-level suspects (always available)
  {
    id: 'victor-guilty',
    label: 'Victor Ashworth (the ex-partner)',
    description: 'Victor Ashworth cast the curse out of revenge for the breakup...',
    isCorrect: false,
    tier: 1
  },
  {
    id: 'helena-guilty',
    label: 'Helena Vance (the rival)',
    description: 'Helena Vance cast the curse out of professional jealousy...',
    isCorrect: false,
    tier: 1
  },
  {
    id: 'lucius-involved',
    label: 'Lucius Malfoy is involved',
    description: 'Lucius Malfoy is somehow responsible. The Malfoys have Dark Magic history...',
    isCorrect: false,
    tier: 1
  },
  {
    id: 'something-else',
    label: 'Something else entirely',
    description: 'Always keep some probability for possibilities we haven\'t thought of yet...',
    isCorrect: false,
    tier: 1,
    isAlwaysAvailable: true
  },

  // Tier 2: Deeper insights (unlockable)
  {
    id: 'cursed-violin',
    label: 'The curse was on the violin',
    description: 'The curse was placed on the violin itself, not cast during the concert...',
    isCorrect: true,
    tier: 2,
    unlockRequirements: [
      // See Task 3 for full unlock requirements
    ]
  },
  {
    id: 'self-inflicted',
    label: 'Self-inflicted (accident or intentional)',
    description: 'The victim cursed herself, either intentionally or accidentally...',
    isCorrect: false,
    tier: 2,
    unlockRequirements: [
      // See Task 3
    ]
  },
  {
    id: 'unknown-person',
    label: 'Unknown person not on guest list',
    description: 'An unknown person not on the guest list is responsible...',
    isCorrect: false,
    tier: 2,
    unlockRequirements: [
      // See Task 3
    ]
  }
]
```

**Acceptance criteria**:
- All hypotheses have `tier: 1 | 2` field
- 4 hypotheses are Tier 1
- 3 hypotheses are Tier 2
- Correct answer (cursed-violin) is Tier 2
- TypeScript compiles without errors
- No changes to hypothesis labels, descriptions, or isCorrect values

---

### Task 3: Add Unlock Requirements to Tier 2 Hypotheses

**File**: `src/data/mission1.ts`
**Action**: MODIFY
**Purpose**: Define 2-4 unlock paths per Tier 2 hypothesis
**Pattern**: Follow UnlockRequirement type from enhanced.ts
**Depends on**: Task 2

**For `cursed-violin` (CORRECT ANSWER - CRITICAL)**:
```typescript
{
  id: 'cursed-violin',
  // ... tier, label, description ...
  unlockRequirements: [{
    type: 'any_of',
    requirements: [
      // Path 1: Direct examination of violin (2 IP cost)
      {
        type: 'evidence_collected',
        evidenceId: 'examine-violin'
      },

      // Path 2: Orchestra members mention violin felt "different" (1 IP cost)
      {
        type: 'evidence_collected',
        evidenceId: 'interview-orchestra'
      },

      // Path 3: Crime scene (no wand magic) + St Mungo's (contact curse) = 3 IP
      {
        type: 'all_of',
        requirements: [
          { type: 'evidence_collected', evidenceId: 'crime-scene' },
          { type: 'evidence_collected', evidenceId: 'st-mungos' }
        ]
      },

      // Path 4: Helena hints + Lucius confirms protection = 2 IP
      {
        type: 'all_of',
        requirements: [
          { type: 'evidence_collected', evidenceId: 'interview-helena' },
          { type: 'evidence_collected', evidenceId: 'interview-lucius' }
        ]
      }
    ]
  }]
}
```

**For `unknown-person` (Marchetti)**:
```typescript
{
  id: 'unknown-person',
  // ... tier, label, description ...
  unlockRequirements: [{
    type: 'any_of',
    requirements: [
      // Path 1: Research violin provenance (1 IP cost) - DIRECT ROUTE
      {
        type: 'evidence_collected',
        evidenceId: 'research-violin'
      },

      // Path 2: Orchestra mentions servicing + examine violin = 3 IP
      {
        type: 'all_of',
        requirements: [
          { type: 'evidence_collected', evidenceId: 'interview-orchestra' },
          { type: 'evidence_collected', evidenceId: 'examine-violin' }
        ]
      }
    ]
  }]
}
```

**For `self-inflicted` (Less likely theory)**:
```typescript
{
  id: 'self-inflicted',
  // ... tier, label, description ...
  unlockRequirements: [{
    type: 'any_of',
    requirements: [
      // Path 1: St Mungo's + search Victor's quarters = 3 IP
      {
        type: 'all_of',
        requirements: [
          { type: 'evidence_collected', evidenceId: 'st-mungos' },
          { type: 'evidence_collected', evidenceId: 'search-victor-quarters' }
        ]
      },

      // Path 2: Thorough investigation unlocks everything (8+ IP spent)
      {
        type: 'threshold_met',
        metric: 'ipSpent',
        threshold: 8
      }
    ]
  }]
}
```

**IP Economy Validation**:
- Minimum path to correct answer: 1 IP (interview-orchestra unlocks cursed-violin)
- Recommended path: 2 IP (examine-violin directly)
- Thorough investigation: 6-7 IP unlocks all Tier 2 hypotheses
- Maximum investigation: 12 IP (all evidence)

**Acceptance criteria**:
- Each Tier 2 hypothesis has 2-4 unlock paths
- All evidenceId references are valid (match investigationActions IDs)
- IP costs add up correctly (minimum 1 IP, maximum 12 IP)
- TypeScript compiles without errors
- Unlock requirements use valid UnlockRequirement types

---

### Task 4: Add Contradictions Array

**File**: `src/data/mission1.ts`
**Action**: MODIFY
**Purpose**: Create 3 contradictions with narrative coherence
**Pattern**: Follow Contradiction interface from enhanced.ts
**Depends on**: Task 3

**Add contradictions array to mission1 export**:
```typescript
import type { Contradiction } from '../types/enhanced';

export const mission1: CaseData = {
  // ... existing fields (id, title, briefing, hypotheses, investigationActions) ...

  contradictions: [
    {
      id: 'c1-victor-love',
      evidenceId1: 'interview-victor',
      evidenceId2: 'search-victor-quarters',
      description: 'Victor claims to still love Elara, and his room confirms this with kept letters and a pressed flower. But if he still loves her, why would he harm her? This doesn\'t fit the "jealous ex attacks victim" pattern.',
      resolution: 'Victor genuinely came to hear her play, not to harm her. His love was real, not possessive. The breakup was about "incompatible life goals" (her career ambitions), not betrayal. He represents the red herring of a familiar narrative that doesn\'t match the evidence.',
      isResolved: false
    },
    {
      id: 'c2-no-wand-magic',
      evidenceId1: 'crime-scene',
      evidenceId2: 'examine-violin',
      description: 'The crime scene shows no residual wand magic from the concert, yet the violin carries a strong curse. How was the curse cast if no one used a wand during the performance? This contradiction points to pre-placed magic.',
      resolution: 'The curse was embedded in the violin rosin days before the concert, not cast during the performance. This is why there\'s no wand magic in the room but strong curse residue on the instrument. The timing delay was intentional—Marchetti wanted distance from the crime.',
      isResolved: false
    },
    {
      id: 'c3-instrument-access',
      evidenceId1: 'interview-helena',
      evidenceId2: 'interview-lucius',
      description: 'Helena says professional musicians are extremely protective of their instruments. Lucius confirms Elara never let the violin out of her sight at the manor. So who had access to curse it? None of the concert suspects could have touched it.',
      resolution: 'The servicing shop had legitimate access. Elara willingly left the violin with Marchetti\'s shop for five days. Professional musicians trust instrument technicians—it\'s the one exception to the "never touch my instrument" rule. This contradiction reveals the attack vector.',
      isResolved: false
    }
  ],

  // ... existing fields (resolution, biasLessons) ...
};
```

**Narrative Coherence Check**:
1. **c1-victor-love**: Points away from Victor being guilty (weakens Tier 1 red herring)
2. **c2-no-wand-magic**: Points toward pre-placed curse (supports cursed-violin Tier 2)
3. **c3-instrument-access**: Reveals Marchetti access vector (supports unknown-person Tier 2)

**Acceptance criteria**:
- 3 contradictions defined
- All evidenceId references are valid (match investigationActions IDs)
- Each contradiction has narrative description and resolution
- Contradictions point toward truth (cursed-violin + Marchetti)
- `isResolved: false` (initial state)
- No `discoveredAt` field (set dynamically in game)
- TypeScript compiles without errors

---

### Task 5: Update Import Statements

**File**: `src/data/mission1.ts`
**Action**: MODIFY
**Purpose**: Import ConditionalHypothesis and Contradiction types
**Pattern**: Standard TypeScript import
**Depends on**: Tasks 1-4

**Current imports** (line 1):
```typescript
import { CaseData } from '../types/game';
```

**New imports**:
```typescript
import type { CaseData } from '../types/game';
import type { ConditionalHypothesis, Contradiction } from '../types/enhanced';
```

**Acceptance criteria**:
- Imports use `type` keyword (type-only imports)
- ConditionalHypothesis type available for hypotheses array
- Contradiction type available for contradictions array
- TypeScript compiles without errors

---

### Task 6: Create Unit Tests for Case Data

**File**: `src/data/__tests__/mission1.test.ts` (CREATE)
**Action**: CREATE
**Purpose**: Validate case data structure and unlock requirements
**Pattern**: Vitest + TypeScript
**Depends on**: Tasks 1-5

**Test Suite**:
```typescript
import { describe, it, expect } from 'vitest';
import { mission1 } from '../mission1';
import type { ConditionalHypothesis } from '../../types/enhanced';
import type { EnhancedPlayerState } from '../../types/enhanced';
import { evaluateRequirement, isHypothesisUnlocked } from '../../utils/unlocking';

describe('Mission 1: Case Data Structure', () => {
  it('should have correct number of hypotheses', () => {
    expect(mission1.hypotheses).toHaveLength(7);
  });

  it('should have 4 Tier 1 hypotheses', () => {
    const tier1 = mission1.hypotheses.filter(h =>
      (h as ConditionalHypothesis).tier === 1
    );
    expect(tier1).toHaveLength(4);
  });

  it('should have 3 Tier 2 hypotheses', () => {
    const tier2 = mission1.hypotheses.filter(h =>
      (h as ConditionalHypothesis).tier === 2
    );
    expect(tier2).toHaveLength(3);
  });

  it('should have cursed-violin as Tier 2', () => {
    const cursedViolin = mission1.hypotheses.find(h => h.id === 'cursed-violin') as ConditionalHypothesis;
    expect(cursedViolin.tier).toBe(2);
    expect(cursedViolin.isCorrect).toBe(true);
  });

  it('should have unlock requirements for all Tier 2 hypotheses', () => {
    const tier2 = mission1.hypotheses.filter(h =>
      (h as ConditionalHypothesis).tier === 2
    ) as ConditionalHypothesis[];

    tier2.forEach(hyp => {
      expect(hyp.unlockRequirements).toBeDefined();
      expect(hyp.unlockRequirements!.length).toBeGreaterThan(0);
    });
  });

  it('should have 3 contradictions', () => {
    expect(mission1.contradictions).toBeDefined();
    expect(mission1.contradictions).toHaveLength(3);
  });

  it('all contradictions should reference valid evidence IDs', () => {
    const validIds = mission1.investigationActions.map(a => a.id);

    mission1.contradictions!.forEach(c => {
      expect(validIds).toContain(c.evidenceId1);
      expect(validIds).toContain(c.evidenceId2);
    });
  });
});

describe('Mission 1: Unlock Paths', () => {
  it('cursed-violin should unlock via examine-violin', () => {
    const state: Partial<EnhancedPlayerState> = {
      collectedEvidenceIds: ['examine-violin'],
      unlockedHypotheses: [],
      investigationPointsRemaining: 10
    };

    const hypothesis = mission1.hypotheses.find(h => h.id === 'cursed-violin') as ConditionalHypothesis;
    const unlocked = isHypothesisUnlocked(hypothesis, state as EnhancedPlayerState, 12);
    expect(unlocked).toBe(true);
  });

  it('cursed-violin should unlock via interview-orchestra', () => {
    const state: Partial<EnhancedPlayerState> = {
      collectedEvidenceIds: ['interview-orchestra'],
      unlockedHypotheses: [],
      investigationPointsRemaining: 11
    };

    const hypothesis = mission1.hypotheses.find(h => h.id === 'cursed-violin') as ConditionalHypothesis;
    const unlocked = isHypothesisUnlocked(hypothesis, state as EnhancedPlayerState, 12);
    expect(unlocked).toBe(true);
  });

  it('cursed-violin should unlock via crime-scene + st-mungos', () => {
    const state: Partial<EnhancedPlayerState> = {
      collectedEvidenceIds: ['crime-scene', 'st-mungos'],
      unlockedHypotheses: [],
      investigationPointsRemaining: 9
    };

    const hypothesis = mission1.hypotheses.find(h => h.id === 'cursed-violin') as ConditionalHypothesis;
    const unlocked = isHypothesisUnlocked(hypothesis, state as EnhancedPlayerState, 12);
    expect(unlocked).toBe(true);
  });

  it('unknown-person should unlock via research-violin', () => {
    const state: Partial<EnhancedPlayerState> = {
      collectedEvidenceIds: ['research-violin'],
      unlockedHypotheses: [],
      investigationPointsRemaining: 11
    };

    const hypothesis = mission1.hypotheses.find(h => h.id === 'unknown-person') as ConditionalHypothesis;
    const unlocked = isHypothesisUnlocked(hypothesis, state as EnhancedPlayerState, 12);
    expect(unlocked).toBe(true);
  });
});

describe('Mission 1: IP Economy', () => {
  it('minimum path to correct answer should be 1-2 IP', () => {
    // Path: interview-orchestra (1 IP) unlocks cursed-violin
    const orchestraCost = mission1.investigationActions.find(a => a.id === 'interview-orchestra')?.cost;
    expect(orchestraCost).toBeLessThanOrEqual(2);
  });

  it('total IP available should be 12', () => {
    expect(mission1.briefing.investigationPoints).toBe(12);
  });
});
```

**Acceptance criteria**:
- All tests pass
- Case structure validated (4 Tier 1, 3 Tier 2)
- Correct answer is Tier 2
- Unlock paths functional
- Contradictions reference valid evidence
- IP economy balanced

---

## Integration Points

### State Management
- **Where**: `src/context/GameContext.tsx`
- **What**: Reducer already handles UNLOCK_HYPOTHESIS and DISCOVER_CONTRADICTION actions
- **Pattern**: No changes needed - case data structure is compatible

### Component Integration
- **Where**: `src/components/phases/HypothesisFormation.tsx`
- **What**: Already filters hypotheses by tier (shows Tier 1, locks Tier 2)
- **Pattern**: No changes needed - UI adapts to case data

### Unlock Evaluation
- **Where**: `src/components/phases/Investigation.tsx`
- **What**: Already calls `findNewlyUnlockedHypotheses()` after evidence collection
- **Pattern**: No changes needed - unlock logic works with new requirements

### Contradiction Detection
- **Where**: `src/components/phases/Investigation.tsx`
- **What**: Already calls `findNewlyDiscoveredContradictions()` after evidence collection
- **Pattern**: No changes needed - contradiction detection works with new data

### Enhanced Scoring
- **Where**: `src/utils/scoring.ts`
- **What**: Already calculates Tier Discovery Score and Contradiction Score
- **Pattern**: No changes needed - scoring adapts to case data

---

## Known Gotchas

### Type Compatibility
- **Issue**: CaseData.hypotheses is typed as `HypothesisData[]`, not `ConditionalHypothesis[]`
- **Solution**: ConditionalHypothesis extends HypothesisData, so type compatibility is maintained. TypeScript will accept ConditionalHypothesis[] where HypothesisData[] is expected.

### Evidence ID References
- **Issue**: Unlock requirements and contradictions reference evidence by ID string. Typos will cause silent failures.
- **Solution**: Unit tests validate all evidence ID references exist in investigationActions array.

### IP Economy Balance
- **Issue**: Too many unlock paths with low IP costs could make all Tier 2 hypotheses unlock too early
- **Solution**: Designed paths with varying costs:
  - Fast path: 1-2 IP (interview-orchestra, examine-violin)
  - Medium path: 3 IP (crime-scene + st-mungos)
  - Thorough path: 6-7 IP (multiple combinations)

### Contradiction Narrative Coherence
- **Issue**: Contradictions could feel arbitrary or punishing
- **Solution**: All contradictions point toward truth:
  - c1 weakens Victor red herring
  - c2 supports cursed-violin theory
  - c3 reveals Marchetti access vector

### Multiple Unlock Triggers
- **Issue**: A single evidence collection could unlock multiple hypotheses simultaneously
- **Solution**: This is intentional and good UX. Players see multiple toast notifications for efficient investigation paths.

---

## Validation Loop

### Level 1: Syntax & Style

```bash
npm run lint
# Expected: 0 errors, maybe 1 warning (react-refresh context export)

npm run type-check
# Expected: 0 errors
```

**Success Criteria**:
- TypeScript compiles without errors
- ESLint passes with 0 errors
- Import statements resolve correctly
- Type annotations are valid

---

### Level 2: Unit Tests

**Test Coverage Target**: 90%+ for new test file

```bash
npm test src/data/__tests__/mission1.test.ts
# Expected: All tests pass
```

**Scenarios to Test** (handled in Task 6):
1. Case structure validation
   - 4 Tier 1 hypotheses
   - 3 Tier 2 hypotheses
   - cursed-violin is Tier 2 and correct
2. Unlock path validation
   - cursed-violin unlocks via 4 different paths
   - unknown-person unlocks via 2 paths
   - self-inflicted unlocks via 2 paths
3. Contradiction validation
   - 3 contradictions defined
   - All evidence IDs valid
   - Resolutions point to truth
4. IP economy validation
   - Minimum path 1-2 IP
   - Total budget 12 IP

**Success Criteria**:
- All unit tests pass
- Unlock paths function correctly
- Contradictions reference valid evidence
- IP economy is balanced

---

### Level 3: Integration Tests

**Manual Verification Steps**:

```bash
npm run dev
```

**Playthrough Checklist**:

1. **Hypothesis Formation Phase**:
   - [ ] Only 4 hypotheses visible (victor, helena, lucius, something-else)
   - [ ] 3 hypotheses locked (cursed-violin, self-inflicted, unknown-person)
   - [ ] UI shows tier indicators

2. **Investigation Phase - Path 1 (Fast)**:
   - [ ] Start with 12 IP
   - [ ] Collect "Interview Orchestra Members" (1 IP)
   - [ ] Toast appears: "New hypothesis unlocked: The curse was on the violin"
   - [ ] cursed-violin now visible in hypothesis list
   - [ ] 11 IP remaining

3. **Investigation Phase - Path 2 (Contradiction Discovery)**:
   - [ ] Collect "Interview Victor Ashworth" (2 IP)
   - [ ] Collect "Search Victor's Quarters" (2 IP)
   - [ ] Contradiction panel appears: c1-victor-love
   - [ ] Contradiction description shown
   - [ ] 7 IP remaining

4. **Investigation Phase - Path 3 (Multiple Unlocks)**:
   - [ ] Collect "Crime Scene Analysis" (2 IP)
   - [ ] Collect "Violin Analysis" (2 IP)
   - [ ] Toast 1: "New hypothesis unlocked: The curse was on the violin" (if not already unlocked)
   - [ ] Contradiction panel shows c2-no-wand-magic
   - [ ] 3 IP remaining

5. **Investigation Phase - Complete**:
   - [ ] Collect "Research Violin History" (1 IP)
   - [ ] Toast: "New hypothesis unlocked: Unknown person not on guest list"
   - [ ] All 7 hypotheses now visible
   - [ ] All 3 contradictions discovered
   - [ ] 2 IP remaining

6. **Prediction Phase**:
   - [ ] All unlocked hypotheses available for probability assignment
   - [ ] Contradictions help guide reasoning
   - [ ] Assign high probability to cursed-violin

7. **Resolution Phase**:
   - [ ] Correct answer revealed (cursed-violin)
   - [ ] Culprit revealed (Orion Marchetti)
   - [ ] Resolution narrative makes sense

8. **Case Review Phase**:
   - [ ] Tier Discovery Score shown (unlocked 3/3 Tier 2 = 100%)
   - [ ] Contradiction Score shown (discovered 3/3 = 100%)
   - [ ] Investigation Efficiency Score calculated
   - [ ] Calibration Score based on final probabilities
   - [ ] Confirmation Bias Score based on investigation focus

**Success Criteria**:
- All unlock paths work
- Contradictions appear when both evidence collected
- Toast notifications display correctly
- Enhanced scoring calculates all metrics
- Playthrough feels fair and rewarding

---

## Dependencies

**No new dependencies required.**

All types, utilities, and components are already implemented:
- `ConditionalHypothesis` type (Milestone 1)
- `Contradiction` type (Milestone 1)
- `unlocking.ts` evaluation logic (Milestone 2)
- `contradictions.ts` detection logic (Milestone 3)
- Enhanced scoring metrics (Milestone 4)

---

## Out of Scope

### Deferred to Future Milestones

- **Mission 2-6 case data**: Only Mission 1 is redesigned in this milestone
- **UI polish**: Enhanced animations and visual indicators (Milestone 6)
- **Tutorial/onboarding**: Teaching players the new mechanics (Milestone 6)
- **Difficulty modes**: Novice (15 IP), Expert (9 IP) variants (Milestone 6)
- **Evidence synthesis mechanics**: Combining 3+ pieces of evidence (Mission 2+)
- **Source credibility mechanics**: Witness reliability assessment (Mission 3+)
- **Multi-causal resolutions**: Multiple partial answers (Mission 4+)

### Not Changing

- **Existing investigation actions**: No changes to evidence content or costs
- **Resolution narrative**: Marchetti reveal stays the same
- **Bias lessons**: Existing bias education content unchanged
- **UI components**: Using existing UnlockToast, ContradictionPanel, etc.
- **Game phases**: 6-phase structure remains identical

---

## Anti-Patterns to Avoid

### Type Safety
- ❌ Don't use `as any` to bypass type errors - fix the types
- ❌ Don't forget to import ConditionalHypothesis and Contradiction types
- ✅ Do use discriminated union type narrowing (`if (hyp.tier === 2)`)

### Unlock Requirements
- ❌ Don't create unlock requirements with non-existent evidence IDs
- ❌ Don't make unlock paths too complex (avoid 4+ nested all_of requirements)
- ✅ Do provide 2-4 unlock paths per Tier 2 hypothesis
- ✅ Do validate evidence IDs in unit tests

### IP Economy
- ❌ Don't make minimum path too expensive (frustrates players)
- ❌ Don't make all paths too cheap (trivializes investigation)
- ✅ Do balance fast path (1-2 IP) with thorough path (6-7 IP)
- ✅ Do leave some IP unspent for player choice

### Contradictions
- ❌ Don't create contradictions that don't point to truth
- ❌ Don't make contradictions feel like "gotcha" puzzles
- ✅ Do make contradictions narratively coherent
- ✅ Do provide resolution text that explains the truth

### Narrative Coherence
- ❌ Don't change existing evidence content or hypothesis descriptions unnecessarily
- ❌ Don't introduce plot holes or inconsistencies
- ✅ Do preserve the Marchetti reveal as the correct answer
- ✅ Do maintain morally grey character portrayals

---

## Documentation Updates

### After Completion

**STATUS.md**:
- Mark Milestone 5 as COMPLETE
- Update "Current Focus" to Milestone 6 (UI/UX Polish)
- Add completion details to "Recent Completions" section

**PLANNING.md**:
- Check "Mission 1 redesigned with new mechanics" in Success Criteria
- Update "Current Status" with Milestone 5 completion date
- Increment version to 0.5.0

**No changes needed to**:
- GAME_DESIGN.md (case plot remains confidential)
- README.md (no new setup steps)
- CLAUDE.md (no new development patterns)

---

## Confidence Score: 9/10

### Likelihood of One-Pass Implementation Success

**High confidence because**:
1. ✅ All types, utilities, and components already implemented and tested (155 tests passing)
2. ✅ Clear narrative structure already exists in current mission1.ts
3. ✅ Unlock paths map directly to existing evidence (no new evidence creation needed)
4. ✅ Contradictions align with existing evidence content
5. ✅ IP costs are already defined (no rebalancing needed)
6. ✅ Type system is backward compatible (ConditionalHypothesis extends HypothesisData)
7. ✅ Task breakdown is detailed with specific code snippets

**Minor risks**:
1. ⚠️ Evidence ID typos in unlock requirements (mitigated by unit tests)
2. ⚠️ IP economy might need minor tuning after playtest (mitigated by multiple paths)

**Recommendation**: Proceed with implementation. If any unlock path feels unbalanced during manual testing, adjust thresholds in Task 3 before final commit.

---

**Generated**: 2026-01-01
**Source**: INITIAL.md (Milestone 5)
**Research**: RESEARCH.md (Phoenix Wright patterns, unlock path design)
**Validation**: 155 tests passing (Milestones 1-4 complete)
