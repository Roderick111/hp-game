/**
 * Unit Tests for Unlock Evaluation Functions
 *
 * Tests all unlock evaluation logic including:
 * - Metric value retrieval
 * - Requirement evaluation (all 4 types)
 * - Hypothesis unlock checking
 * - Finding newly unlockable hypotheses
 * - Trigger creation
 *
 * @module utils/__tests__/unlocking.test
 * @since Milestone 2
 */

import { describe, it, expect } from 'vitest';
import {
  getMetricValue,
  evaluateRequirement,
  isHypothesisUnlocked,
  findNewlyUnlockedHypotheses,
  createUnlockTrigger,
} from '../unlocking';
import {
  initialEnhancedState,
  midGameEnhancedState,
  tier1Hypothesis,
  tier1HypothesisCorrect,
  tier2SimpleHypothesis,
  tier2ComplexHypothesis,
  tier2MultiPathHypothesis,
  evidenceRequirement,
  thresholdRequirement,
  allOfRequirement,
  anyOfRequirement,
} from '../../types/enhanced.fixtures';
import type { EnhancedPlayerState, ConditionalHypothesis } from '../../types/enhanced';

// ============================================
// getMetricValue Tests
// ============================================

describe('getMetricValue', () => {
  describe('evidenceCount metric', () => {
    it('returns 0 for empty evidence collection', () => {
      const result = getMetricValue(initialEnhancedState, 'evidenceCount');
      expect(result).toBe(0);
    });

    it('returns correct count for collected evidence', () => {
      const result = getMetricValue(midGameEnhancedState, 'evidenceCount');
      expect(result).toBe(3); // ['e1', 'e2', 'e5']
    });

    it('counts all evidence regardless of IP', () => {
      const state: EnhancedPlayerState = {
        ...initialEnhancedState,
        collectedEvidenceIds: ['e1', 'e2', 'e3', 'e4', 'e5'],
      };
      const result = getMetricValue(state, 'evidenceCount');
      expect(result).toBe(5);
    });
  });

  describe('ipSpent metric', () => {
    it('returns 0 when no IP spent', () => {
      const result = getMetricValue(initialEnhancedState, 'ipSpent', 12);
      expect(result).toBe(0);
    });

    it('calculates spent IP correctly', () => {
      const result = getMetricValue(midGameEnhancedState, 'ipSpent', 12);
      expect(result).toBe(6); // 12 initial - 6 remaining
    });

    it('handles all IP spent', () => {
      const state: EnhancedPlayerState = {
        ...initialEnhancedState,
        investigationPointsRemaining: 0,
      };
      const result = getMetricValue(state, 'ipSpent', 12);
      expect(result).toBe(12);
    });
  });

  describe('investigationProgress metric', () => {
    it('returns 0 for no progress', () => {
      const result = getMetricValue(initialEnhancedState, 'investigationProgress', 12);
      expect(result).toBe(0);
    });

    it('returns 50 for half IP spent', () => {
      const result = getMetricValue(midGameEnhancedState, 'investigationProgress', 12);
      expect(result).toBe(50); // 6 of 12 spent
    });

    it('returns 100 for all IP spent', () => {
      const state: EnhancedPlayerState = {
        ...initialEnhancedState,
        investigationPointsRemaining: 0,
      };
      const result = getMetricValue(state, 'investigationProgress', 12);
      expect(result).toBe(100);
    });

    it('handles edge case of 0 initial IP', () => {
      const state: EnhancedPlayerState = {
        ...initialEnhancedState,
        investigationPointsRemaining: 0,
      };
      const result = getMetricValue(state, 'investigationProgress', 0);
      expect(result).toBe(100);
    });
  });
});

// ============================================
// evaluateRequirement Tests
// ============================================

describe('evaluateRequirement', () => {
  describe('evidence_collected type', () => {
    it('returns false when evidence not collected', () => {
      const result = evaluateRequirement(evidenceRequirement, initialEnhancedState);
      expect(result).toBe(false);
    });

    it('returns true when evidence is collected', () => {
      const state: EnhancedPlayerState = {
        ...initialEnhancedState,
        collectedEvidenceIds: ['e5'],
      };
      const result = evaluateRequirement(evidenceRequirement, state);
      expect(result).toBe(true);
    });

    it('returns true when evidence is among multiple collected', () => {
      const result = evaluateRequirement(evidenceRequirement, midGameEnhancedState);
      expect(result).toBe(true); // midGameEnhancedState has ['e1', 'e2', 'e5']
    });
  });

  describe('threshold_met type', () => {
    it('returns false when threshold not met', () => {
      const result = evaluateRequirement(thresholdRequirement, initialEnhancedState, 12);
      expect(result).toBe(false); // Needs ipSpent >= 6, has 0
    });

    it('returns true when threshold exactly met', () => {
      const result = evaluateRequirement(thresholdRequirement, midGameEnhancedState, 12);
      expect(result).toBe(true); // ipSpent = 6
    });

    it('returns true when threshold exceeded', () => {
      const state: EnhancedPlayerState = {
        ...initialEnhancedState,
        investigationPointsRemaining: 2,
      };
      const result = evaluateRequirement(thresholdRequirement, state, 12);
      expect(result).toBe(true); // ipSpent = 10 >= 6
    });

    it('handles evidenceCount threshold', () => {
      const req = { type: 'threshold_met' as const, metric: 'evidenceCount' as const, threshold: 3 };
      const result = evaluateRequirement(req, midGameEnhancedState);
      expect(result).toBe(true); // Has 3 evidence
    });
  });

  describe('all_of type', () => {
    it('returns false when no requirements met', () => {
      const result = evaluateRequirement(allOfRequirement, initialEnhancedState);
      expect(result).toBe(false);
    });

    it('returns false when only some requirements met', () => {
      const state: EnhancedPlayerState = {
        ...initialEnhancedState,
        collectedEvidenceIds: ['e3'], // Has e3 but not e7
      };
      const result = evaluateRequirement(allOfRequirement, state);
      expect(result).toBe(false);
    });

    it('returns true when all requirements met', () => {
      const state: EnhancedPlayerState = {
        ...initialEnhancedState,
        collectedEvidenceIds: ['e3', 'e7'],
      };
      const result = evaluateRequirement(allOfRequirement, state);
      expect(result).toBe(true);
    });

    it('handles empty requirements array as vacuously true', () => {
      const emptyAllOf = { type: 'all_of' as const, requirements: [] as const };
      const result = evaluateRequirement(emptyAllOf, initialEnhancedState);
      expect(result).toBe(true); // Array.every on empty returns true
    });
  });

  describe('any_of type', () => {
    it('returns false when no requirements met', () => {
      const result = evaluateRequirement(anyOfRequirement, initialEnhancedState);
      expect(result).toBe(false);
    });

    it('returns true when first requirement met', () => {
      const state: EnhancedPlayerState = {
        ...initialEnhancedState,
        collectedEvidenceIds: ['e5'], // First path: evidence e5
      };
      const result = evaluateRequirement(anyOfRequirement, state);
      expect(result).toBe(true);
    });

    it('returns true when second requirement met', () => {
      const state: EnhancedPlayerState = {
        ...initialEnhancedState,
        collectedEvidenceIds: ['e1', 'e2', 'e3', 'e4', 'e6'], // 5 evidence, not including e5
      };
      const result = evaluateRequirement(anyOfRequirement, state);
      expect(result).toBe(true); // Second path: evidenceCount >= 5
    });

    it('returns true when multiple requirements met', () => {
      const state: EnhancedPlayerState = {
        ...initialEnhancedState,
        collectedEvidenceIds: ['e1', 'e2', 'e3', 'e4', 'e5'], // Both paths met
      };
      const result = evaluateRequirement(anyOfRequirement, state);
      expect(result).toBe(true);
    });

    it('handles empty requirements array as vacuously false', () => {
      const emptyAnyOf = { type: 'any_of' as const, requirements: [] as const };
      const result = evaluateRequirement(emptyAnyOf, initialEnhancedState);
      expect(result).toBe(false); // Array.some on empty returns false
    });
  });

  describe('nested composite requirements', () => {
    it('handles all_of containing any_of', () => {
      const nestedReq = {
        type: 'all_of' as const,
        requirements: [
          { type: 'evidence_collected' as const, evidenceId: 'e1' },
          {
            type: 'any_of' as const,
            requirements: [
              { type: 'evidence_collected' as const, evidenceId: 'e5' },
              { type: 'evidence_collected' as const, evidenceId: 'e9' },
            ],
          },
        ],
      };

      // Case 1: Has e1 and e5
      const state1: EnhancedPlayerState = {
        ...initialEnhancedState,
        collectedEvidenceIds: ['e1', 'e5'],
      };
      expect(evaluateRequirement(nestedReq, state1)).toBe(true);

      // Case 2: Has e1 only
      const state2: EnhancedPlayerState = {
        ...initialEnhancedState,
        collectedEvidenceIds: ['e1'],
      };
      expect(evaluateRequirement(nestedReq, state2)).toBe(false);
    });
  });
});

// ============================================
// isHypothesisUnlocked Tests
// ============================================

describe('isHypothesisUnlocked', () => {
  describe('Tier 1 hypotheses', () => {
    it('always returns true for Tier 1', () => {
      const result = isHypothesisUnlocked(tier1Hypothesis, initialEnhancedState);
      expect(result).toBe(true);
    });

    it('returns true for Tier 1 regardless of state', () => {
      const result = isHypothesisUnlocked(tier1HypothesisCorrect, initialEnhancedState);
      expect(result).toBe(true);
    });
  });

  describe('Tier 2 hypotheses - not yet unlocked', () => {
    it('returns false when requirements not met', () => {
      const result = isHypothesisUnlocked(tier2SimpleHypothesis, initialEnhancedState);
      expect(result).toBe(false); // Needs e5
    });

    it('returns true when requirements met', () => {
      const state: EnhancedPlayerState = {
        ...initialEnhancedState,
        collectedEvidenceIds: ['e5'],
      };
      const result = isHypothesisUnlocked(tier2SimpleHypothesis, state);
      expect(result).toBe(true);
    });

    it('returns false for complex hypothesis when only partial requirements met', () => {
      const state: EnhancedPlayerState = {
        ...initialEnhancedState,
        collectedEvidenceIds: ['e7'],
        investigationPointsRemaining: 12, // No IP spent
      };
      const result = isHypothesisUnlocked(tier2ComplexHypothesis, state, 12);
      expect(result).toBe(false); // Has e7 but ipSpent < 4
    });

    it('returns true for complex hypothesis when all requirements met', () => {
      const state: EnhancedPlayerState = {
        ...initialEnhancedState,
        collectedEvidenceIds: ['e7'],
        investigationPointsRemaining: 6, // 6 IP spent
      };
      const result = isHypothesisUnlocked(tier2ComplexHypothesis, state, 12);
      expect(result).toBe(true); // Has e7 and ipSpent = 6 >= 4
    });
  });

  describe('Tier 2 hypotheses - already unlocked in state', () => {
    it('returns true when already in unlockedHypotheses', () => {
      const state: EnhancedPlayerState = {
        ...initialEnhancedState,
        unlockedHypotheses: ['h3'],
        collectedEvidenceIds: [], // Requirements NOT currently met
      };
      // h3 is tier2SimpleHypothesis which normally needs e5
      const result = isHypothesisUnlocked(tier2SimpleHypothesis, state);
      expect(result).toBe(true); // Already unlocked, requirements don't matter
    });
  });

  describe('Tier 2 hypotheses - no requirements defined', () => {
    it('returns false for Tier 2 without unlockRequirements', () => {
      const hypothesisNoReqs: ConditionalHypothesis = {
        id: 'h-no-reqs',
        label: 'No requirements',
        description: 'Test hypothesis with no unlock requirements',
        isCorrect: false,
        tier: 2,
        // unlockRequirements: undefined
      };
      const result = isHypothesisUnlocked(hypothesisNoReqs, initialEnhancedState);
      expect(result).toBe(false);
    });

    it('returns false for Tier 2 with empty requirements array', () => {
      const hypothesisEmptyReqs: ConditionalHypothesis = {
        id: 'h-empty-reqs',
        label: 'Empty requirements',
        description: 'Test hypothesis with empty unlock requirements',
        isCorrect: false,
        tier: 2,
        unlockRequirements: [],
      };
      const result = isHypothesisUnlocked(hypothesisEmptyReqs, initialEnhancedState);
      expect(result).toBe(false);
    });
  });
});

// ============================================
// findNewlyUnlockedHypotheses Tests
// ============================================

describe('findNewlyUnlockedHypotheses', () => {
  const allHypotheses: readonly ConditionalHypothesis[] = [
    tier1Hypothesis,
    tier1HypothesisCorrect,
    tier2SimpleHypothesis,
    tier2ComplexHypothesis,
    tier2MultiPathHypothesis,
  ];

  it('returns empty array when no Tier 2 requirements met', () => {
    const result = findNewlyUnlockedHypotheses(allHypotheses, initialEnhancedState, 12);
    expect(result).toEqual([]);
  });

  it('returns empty array for Tier 1 hypotheses only', () => {
    const tier1Only = [tier1Hypothesis, tier1HypothesisCorrect];
    const result = findNewlyUnlockedHypotheses(tier1Only, initialEnhancedState, 12);
    expect(result).toEqual([]);
  });

  it('returns single newly unlocked hypothesis', () => {
    const state: EnhancedPlayerState = {
      ...initialEnhancedState,
      collectedEvidenceIds: ['e5'],
    };
    const result = findNewlyUnlockedHypotheses(allHypotheses, state, 12);
    expect(result).toEqual(['h3']); // tier2SimpleHypothesis
  });

  it('excludes already unlocked hypotheses', () => {
    const state: EnhancedPlayerState = {
      ...initialEnhancedState,
      collectedEvidenceIds: ['e5'],
      unlockedHypotheses: ['h3'], // Already unlocked
    };
    const result = findNewlyUnlockedHypotheses(allHypotheses, state, 12);
    expect(result).toEqual([]); // h3 already unlocked
  });

  it('returns multiple newly unlocked hypotheses', () => {
    const state: EnhancedPlayerState = {
      ...initialEnhancedState,
      collectedEvidenceIds: ['e5', 'e7'],
      investigationPointsRemaining: 8, // 4 IP spent
    };
    const result = findNewlyUnlockedHypotheses(allHypotheses, state, 12);
    expect(result).toContain('h3'); // Has e5
    expect(result).toContain('h4'); // Has e7 and ipSpent = 4
  });

  it('handles multi-path hypothesis unlock', () => {
    // Path 1: evidence e9
    const state1: EnhancedPlayerState = {
      ...initialEnhancedState,
      collectedEvidenceIds: ['e9'],
    };
    let result = findNewlyUnlockedHypotheses(allHypotheses, state1, 12);
    expect(result).toContain('h5');

    // Path 2: evidenceCount >= 6
    const state2: EnhancedPlayerState = {
      ...initialEnhancedState,
      collectedEvidenceIds: ['e1', 'e2', 'e3', 'e4', 'e6', 'e8'], // 6 evidence, no e9
    };
    result = findNewlyUnlockedHypotheses(allHypotheses, state2, 12);
    expect(result).toContain('h5');
  });
});

// ============================================
// createUnlockTrigger Tests
// ============================================

describe('createUnlockTrigger', () => {
  it('creates evidence trigger when evidence ID is provided and collected', () => {
    const state: EnhancedPlayerState = {
      ...initialEnhancedState,
      collectedEvidenceIds: ['e5'],
    };
    const trigger = createUnlockTrigger('e5', state, 12);
    expect(trigger).toEqual({
      type: 'evidence_collected',
      evidenceId: 'e5',
    });
  });

  it('creates threshold trigger when evidence ID not in collected list', () => {
    const state: EnhancedPlayerState = {
      ...initialEnhancedState,
      collectedEvidenceIds: ['e1', 'e2', 'e3'],
    };
    const trigger = createUnlockTrigger('e5', state, 12);
    expect(trigger).toEqual({
      type: 'threshold_met',
      metric: 'evidenceCount',
      value: 3,
    });
  });

  it('creates threshold trigger for empty evidence ID', () => {
    const state: EnhancedPlayerState = {
      ...initialEnhancedState,
      collectedEvidenceIds: ['e1', 'e2'],
    };
    const trigger = createUnlockTrigger('', state, 12);
    expect(trigger).toEqual({
      type: 'threshold_met',
      metric: 'evidenceCount',
      value: 2,
    });
  });

  it('returns correct evidence count in threshold trigger', () => {
    const state: EnhancedPlayerState = {
      ...initialEnhancedState,
      collectedEvidenceIds: ['e1', 'e2', 'e3', 'e4', 'e5'],
    };
    const trigger = createUnlockTrigger('e-unknown', state, 12);
    expect(trigger.type).toBe('threshold_met');
    if (trigger.type === 'threshold_met') {
      expect(trigger.value).toBe(5);
    }
  });
});
