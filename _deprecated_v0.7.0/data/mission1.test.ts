/**
 * Mission 1 Case Data Tests
 *
 * Validates the structure and integrity of Mission 1 case data after
 * the Milestone 5 redesign with conditional hypothesis unlocking.
 *
 * @module data/__tests__/mission1.test
 * @since Milestone 5
 */

import { describe, it, expect } from 'vitest';
import { mission1 } from '../mission1';
import type { ConditionalHypothesis, EnhancedPlayerState } from '../../types/enhanced';
import { isHypothesisUnlocked } from '../../utils/unlocking';

// ============================================
// Test Fixtures
// ============================================

/**
 * Create a minimal EnhancedPlayerState for testing unlock requirements.
 */
function createTestState(
  collectedEvidenceIds: string[] = [],
  investigationPointsRemaining = 7
): EnhancedPlayerState {
  return {
    currentPhase: 'investigation',
    selectedHypotheses: [],
    initialProbabilities: {},
    investigationPointsRemaining,
    collectedEvidenceIds,
    finalProbabilities: {},
    confidenceLevel: 3,
    scores: null,
    unlockedHypotheses: [],
    unlockHistory: [],
    discoveredContradictions: [],
    resolvedContradictions: [],
    pendingUnlockNotifications: [],
    activeHypothesisId: null,
    hypothesisPivots: [],
  };
}

// ============================================
// Case Data Structure Tests
// ============================================

describe('Mission 1: Case Data Structure', () => {
  it('should have correct number of hypotheses', () => {
    expect(mission1.hypotheses).toHaveLength(7);
  });

  it('should have 4 Tier 1 hypotheses', () => {
    const tier1 = mission1.hypotheses.filter(
      (h) => (h as ConditionalHypothesis).tier === 1
    );
    expect(tier1).toHaveLength(4);
  });

  it('should have 3 Tier 2 hypotheses', () => {
    const tier2 = mission1.hypotheses.filter(
      (h) => (h as ConditionalHypothesis).tier === 2
    );
    expect(tier2).toHaveLength(3);
  });

  it('should have cursed-violin as Tier 2', () => {
    const cursedViolin = mission1.hypotheses.find(
      (h) => h.id === 'cursed-violin'
    ) as ConditionalHypothesis;
    expect(cursedViolin).toBeDefined();
    expect(cursedViolin.tier).toBe(2);
    expect(cursedViolin.isCorrect).toBe(true);
  });

  it('should have unlock requirements for all Tier 2 hypotheses', () => {
    const tier2 = mission1.hypotheses.filter(
      (h) => (h as ConditionalHypothesis).tier === 2
    ) as ConditionalHypothesis[];

    tier2.forEach((hyp) => {
      expect(hyp.unlockRequirements).toBeDefined();
      expect(hyp.unlockRequirements!.length).toBeGreaterThan(0);
    });
  });

  it('should have Tier 1 hypotheses with correct IDs', () => {
    const tier1 = mission1.hypotheses.filter(
      (h) => (h as ConditionalHypothesis).tier === 1
    );
    const tier1Ids = tier1.map((h) => h.id);

    expect(tier1Ids).toContain('victor-guilty');
    expect(tier1Ids).toContain('helena-guilty');
    expect(tier1Ids).toContain('lucius-involved');
    expect(tier1Ids).toContain('something-else');
  });

  it('should have Tier 2 hypotheses with correct IDs', () => {
    const tier2 = mission1.hypotheses.filter(
      (h) => (h as ConditionalHypothesis).tier === 2
    );
    const tier2Ids = tier2.map((h) => h.id);

    expect(tier2Ids).toContain('cursed-violin');
    expect(tier2Ids).toContain('self-inflicted');
    expect(tier2Ids).toContain('unknown-person');
  });

  it('should have something-else marked as isAlwaysAvailable', () => {
    const somethingElse = mission1.hypotheses.find(
      (h) => h.id === 'something-else'
    );
    expect(somethingElse?.isAlwaysAvailable).toBe(true);
  });
});

// ============================================
// Contradictions Tests
// ============================================

describe('Mission 1: Contradictions', () => {
  it('should have 3 contradictions', () => {
    expect(mission1.contradictions).toBeDefined();
    expect(mission1.contradictions).toHaveLength(3);
  });

  it('all contradictions should reference valid evidence IDs', () => {
    const validIds = mission1.investigationActions.map((a) => a.id);

    mission1.contradictions!.forEach((c) => {
      expect(validIds).toContain(c.evidenceId1);
      expect(validIds).toContain(c.evidenceId2);
    });
  });

  it('all contradictions should have unique IDs', () => {
    const ids = mission1.contradictions!.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all contradictions should have descriptions and resolutions', () => {
    mission1.contradictions!.forEach((c) => {
      expect(c.description).toBeDefined();
      expect(c.description.length).toBeGreaterThan(0);
      expect(c.resolution).toBeDefined();
      expect(c.resolution!.length).toBeGreaterThan(0);
    });
  });

  it('all contradictions should start as unresolved', () => {
    mission1.contradictions!.forEach((c) => {
      expect(c.isResolved).toBe(false);
    });
  });

  it('c1-victor-love should reference correct evidence', () => {
    const c1 = mission1.contradictions!.find((c) => c.id === 'c1-victor-love');
    expect(c1).toBeDefined();
    expect(c1!.evidenceId1).toBe('interview-victor');
    expect(c1!.evidenceId2).toBe('search-victor-quarters');
  });

  it('c2-no-wand-magic should reference correct evidence', () => {
    const c2 = mission1.contradictions!.find((c) => c.id === 'c2-no-wand-magic');
    expect(c2).toBeDefined();
    expect(c2!.evidenceId1).toBe('crime-scene');
    expect(c2!.evidenceId2).toBe('examine-violin');
  });

  it('c3-instrument-access should reference correct evidence', () => {
    const c3 = mission1.contradictions!.find(
      (c) => c.id === 'c3-instrument-access'
    );
    expect(c3).toBeDefined();
    expect(c3!.evidenceId1).toBe('interview-helena');
    expect(c3!.evidenceId2).toBe('interview-lucius');
  });
});

// ============================================
// Unlock Paths Tests
// ============================================

describe('Mission 1: Unlock Paths', () => {
  const INITIAL_IP = 7;

  describe('cursed-violin unlock paths', () => {
    it('should unlock via examine-violin', () => {
      const state = createTestState(['examine-violin'], INITIAL_IP - 2);

      const hypothesis = mission1.hypotheses.find(
        (h) => h.id === 'cursed-violin'
      ) as ConditionalHypothesis;
      const unlocked = isHypothesisUnlocked(hypothesis, state, INITIAL_IP);
      expect(unlocked).toBe(true);
    });

    it('should unlock via interview-orchestra', () => {
      const state = createTestState(['interview-orchestra'], INITIAL_IP - 1);

      const hypothesis = mission1.hypotheses.find(
        (h) => h.id === 'cursed-violin'
      ) as ConditionalHypothesis;
      const unlocked = isHypothesisUnlocked(hypothesis, state, INITIAL_IP);
      expect(unlocked).toBe(true);
    });

    it('should unlock via crime-scene + st-mungos', () => {
      const state = createTestState(['crime-scene', 'st-mungos'], INITIAL_IP - 3);

      const hypothesis = mission1.hypotheses.find(
        (h) => h.id === 'cursed-violin'
      ) as ConditionalHypothesis;
      const unlocked = isHypothesisUnlocked(hypothesis, state, INITIAL_IP);
      expect(unlocked).toBe(true);
    });

    it('should unlock via interview-helena + interview-lucius', () => {
      const state = createTestState(
        ['interview-helena', 'interview-lucius'],
        INITIAL_IP - 3
      );

      const hypothesis = mission1.hypotheses.find(
        (h) => h.id === 'cursed-violin'
      ) as ConditionalHypothesis;
      const unlocked = isHypothesisUnlocked(hypothesis, state, INITIAL_IP);
      expect(unlocked).toBe(true);
    });

    it('should NOT unlock without any required evidence', () => {
      const state = createTestState(['records-victor', 'records-helena'], 5);

      const hypothesis = mission1.hypotheses.find(
        (h) => h.id === 'cursed-violin'
      ) as ConditionalHypothesis;
      const unlocked = isHypothesisUnlocked(hypothesis, state, INITIAL_IP);
      expect(unlocked).toBe(false);
    });
  });

  describe('unknown-person unlock paths', () => {
    it('should unlock via research-violin', () => {
      const state = createTestState(['research-violin'], INITIAL_IP - 1);

      const hypothesis = mission1.hypotheses.find(
        (h) => h.id === 'unknown-person'
      ) as ConditionalHypothesis;
      const unlocked = isHypothesisUnlocked(hypothesis, state, INITIAL_IP);
      expect(unlocked).toBe(true);
    });

    it('should unlock via interview-orchestra + examine-violin', () => {
      const state = createTestState(
        ['interview-orchestra', 'examine-violin'],
        INITIAL_IP - 3
      );

      const hypothesis = mission1.hypotheses.find(
        (h) => h.id === 'unknown-person'
      ) as ConditionalHypothesis;
      const unlocked = isHypothesisUnlocked(hypothesis, state, INITIAL_IP);
      expect(unlocked).toBe(true);
    });
  });

  describe('self-inflicted unlock paths', () => {
    it('should unlock via st-mungos + search-victor-quarters', () => {
      const state = createTestState(
        ['st-mungos', 'search-victor-quarters'],
        INITIAL_IP - 3
      );

      const hypothesis = mission1.hypotheses.find(
        (h) => h.id === 'self-inflicted'
      ) as ConditionalHypothesis;
      const unlocked = isHypothesisUnlocked(hypothesis, state, INITIAL_IP);
      expect(unlocked).toBe(true);
    });

    it('should unlock via high IP spent threshold (8+)', () => {
      // Spend 8+ IP (initial 7 is not enough, but let's test with 12 IP scenario)
      const HIGHER_IP = 12;
      const state = createTestState(
        ['crime-scene', 'examine-violin', 'interview-victor', 'interview-helena'],
        HIGHER_IP - 8
      );

      const hypothesis = mission1.hypotheses.find(
        (h) => h.id === 'self-inflicted'
      ) as ConditionalHypothesis;
      const unlocked = isHypothesisUnlocked(hypothesis, state, HIGHER_IP);
      expect(unlocked).toBe(true);
    });
  });

  describe('Tier 1 hypotheses are always unlocked', () => {
    it('victor-guilty should always be unlocked', () => {
      const state = createTestState([], INITIAL_IP);

      const hypothesis = mission1.hypotheses.find(
        (h) => h.id === 'victor-guilty'
      ) as ConditionalHypothesis;
      const unlocked = isHypothesisUnlocked(hypothesis, state, INITIAL_IP);
      expect(unlocked).toBe(true);
    });

    it('helena-guilty should always be unlocked', () => {
      const state = createTestState([], INITIAL_IP);

      const hypothesis = mission1.hypotheses.find(
        (h) => h.id === 'helena-guilty'
      ) as ConditionalHypothesis;
      const unlocked = isHypothesisUnlocked(hypothesis, state, INITIAL_IP);
      expect(unlocked).toBe(true);
    });

    it('lucius-involved should always be unlocked', () => {
      const state = createTestState([], INITIAL_IP);

      const hypothesis = mission1.hypotheses.find(
        (h) => h.id === 'lucius-involved'
      ) as ConditionalHypothesis;
      const unlocked = isHypothesisUnlocked(hypothesis, state, INITIAL_IP);
      expect(unlocked).toBe(true);
    });

    it('something-else should always be unlocked', () => {
      const state = createTestState([], INITIAL_IP);

      const hypothesis = mission1.hypotheses.find(
        (h) => h.id === 'something-else'
      ) as ConditionalHypothesis;
      const unlocked = isHypothesisUnlocked(hypothesis, state, INITIAL_IP);
      expect(unlocked).toBe(true);
    });
  });
});

// ============================================
// IP Economy Tests
// ============================================

describe('Mission 1: IP Economy', () => {
  it('minimum path to correct answer should be 1-2 IP', () => {
    // Path: interview-orchestra (1 IP) unlocks cursed-violin
    const orchestraCost = mission1.investigationActions.find(
      (a) => a.id === 'interview-orchestra'
    )?.cost;
    expect(orchestraCost).toBeLessThanOrEqual(2);
  });

  it('total IP available should be 7', () => {
    expect(mission1.briefing.investigationPoints).toBe(7);
  });

  it('all investigation action costs should be positive', () => {
    mission1.investigationActions.forEach((action) => {
      expect(action.cost).toBeGreaterThan(0);
    });
  });

  it('total cost of all actions should exceed available IP', () => {
    const totalCost = mission1.investigationActions.reduce(
      (sum, action) => sum + action.cost,
      0
    );
    expect(totalCost).toBeGreaterThan(mission1.briefing.investigationPoints);
  });
});

// ============================================
// Evidence ID Validation Tests
// ============================================

describe('Mission 1: Evidence ID Validation', () => {
  it('all evidence IDs in unlock requirements should be valid', () => {
    const validIds = mission1.investigationActions.map((a) => a.id);

    const tier2 = mission1.hypotheses.filter(
      (h) => (h as ConditionalHypothesis).tier === 2
    ) as ConditionalHypothesis[];

    tier2.forEach((hyp) => {
      extractEvidenceIds(hyp.unlockRequirements!).forEach((evidenceId) => {
        expect(validIds).toContain(evidenceId);
      });
    });
  });
});

/**
 * Recursively extract all evidenceIds from unlock requirements.
 */
function extractEvidenceIds(
  requirements: readonly import('../../types/enhanced').UnlockRequirement[]
): string[] {
  const ids: string[] = [];

  requirements.forEach((req) => {
    switch (req.type) {
      case 'evidence_collected':
        ids.push(req.evidenceId);
        break;
      case 'all_of':
      case 'any_of':
        ids.push(...extractEvidenceIds(req.requirements));
        break;
      // threshold_met doesn't have evidenceIds
    }
  });

  return ids;
}
