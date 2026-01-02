/**
 * Unit Tests for Enhanced Scoring Functions
 *
 * Tests the 4 new scoring metrics added in Milestone 4:
 * - Investigation Efficiency
 * - Premature Closure Score
 * - Contradiction Discovery Score
 * - Tier Discovery Score
 *
 * @module utils/__tests__/scoring.test
 * @since Milestone 4
 */

import { describe, it, expect } from 'vitest';
import {
  calculateInvestigationEfficiency,
  calculatePrematureClosureScore,
  calculateContradictionScore,
  calculateTierDiscoveryScore,
  getMetricInterpretation,
  CaseDataWithContradictions,
} from '../scoring';
import type { CaseData, PlayerState } from '../../types/game';
import type { EnhancedPlayerState, Contradiction, ConditionalHypothesis } from '../../types/enhanced';

// ============================================
// Test Fixtures
// ============================================

const baseCaseData: CaseData = {
  id: 'test-case',
  title: 'Test Case',
  subtitle: 'A test case',
  briefing: {
    date: '2025-01-15',
    location: 'Test Location',
    victim: 'Test Victim',
    status: 'Under Investigation',
    summary: 'Test summary',
    healerReport: 'Test report',
    initialWitness: { name: 'Test Witness', statement: 'Test statement' },
    personsOfInterest: [],
    mentorIntro: 'Test intro',
    investigationPoints: 10,
  },
  hypotheses: [
    { id: 'h1', label: 'Hypothesis 1', description: 'Desc 1', isCorrect: false },
    { id: 'h2', label: 'Hypothesis 2', description: 'Desc 2', isCorrect: true },
  ],
  investigationActions: [
    {
      id: 'a1',
      title: 'Action 1',
      description: 'Desc 1',
      cost: 2,
      category: 'location',
      evidence: { title: 'E1', content: 'Content', interpretation: 'Interp' },
      hypothesisImpact: [{ hypothesisId: 'h1', impact: 'supports', weight: 1 }],
    },
    {
      id: 'a2',
      title: 'Action 2',
      description: 'Desc 2',
      cost: 3,
      category: 'witness',
      evidence: { title: 'E2', content: 'Content', interpretation: 'Interp' },
      hypothesisImpact: [{ hypothesisId: 'h2', impact: 'supports', weight: 1 }],
    },
    {
      id: 'a3',
      title: 'Action 3',
      description: 'Desc 3',
      cost: 1,
      category: 'records',
      evidence: { title: 'E3', content: 'Content', interpretation: 'Interp' },
      hypothesisImpact: [{ hypothesisId: 'h1', impact: 'weakens', weight: 1 }],
    },
  ],
  resolution: {
    truthSummary: 'Truth',
    culprit: 'Culprit',
    correctHypothesisId: 'h2',
    explanationOfDifficulty: 'Explanation',
  },
  biasLessons: [],
};

const basePlayerState: PlayerState = {
  currentPhase: 'resolution',
  selectedHypotheses: ['h1', 'h2'],
  initialProbabilities: { h1: 50, h2: 50 },
  investigationPointsRemaining: 5,
  collectedEvidenceIds: ['a1', 'a2'],
  finalProbabilities: { h1: 30, h2: 70 },
  confidenceLevel: 4,
  scores: null,
};

const baseEnhancedState: EnhancedPlayerState = {
  ...basePlayerState,
  unlockedHypotheses: [],
  unlockHistory: [],
  discoveredContradictions: [],
  resolvedContradictions: [],
  pendingUnlockNotifications: [],
};

const testContradictions: readonly Contradiction[] = [
  {
    id: 'c1',
    evidenceId1: 'a1',
    evidenceId2: 'a2',
    description: 'Contradiction 1',
    isResolved: false,
  },
  {
    id: 'c2',
    evidenceId1: 'a2',
    evidenceId2: 'a3',
    description: 'Contradiction 2',
    isResolved: false,
  },
];

// ============================================
// calculateInvestigationEfficiency Tests
// ============================================

describe('calculateInvestigationEfficiency', () => {
  it('returns 100 when no investigation actions exist', () => {
    const caseData = { ...baseCaseData, investigationActions: [] };
    const result = calculateInvestigationEfficiency(basePlayerState, caseData);
    expect(result).toBe(100);
  });

  it('returns 0 when no evidence collected', () => {
    const playerState = { ...basePlayerState, collectedEvidenceIds: [] };
    const result = calculateInvestigationEfficiency(playerState, baseCaseData);
    expect(result).toBe(0);
  });

  it('returns 100 when player is efficient (low IP per evidence)', () => {
    // Collected a3 (cost 1) - below average of 2
    const playerState = { ...basePlayerState, collectedEvidenceIds: ['a3'] };
    const result = calculateInvestigationEfficiency(playerState, baseCaseData);
    expect(result).toBe(100); // Capped at 100
  });

  it('returns lower score for expensive evidence collection', () => {
    // Collected a2 (cost 3) - above average of 2
    const playerState = { ...basePlayerState, collectedEvidenceIds: ['a2'] };
    const result = calculateInvestigationEfficiency(playerState, baseCaseData);
    expect(result).toBeLessThan(100);
    expect(result).toBeGreaterThan(0);
  });

  it('handles average efficiency correctly', () => {
    // Average cost per action is (2+3+1)/3 = 2
    // If player collects all, average matches
    const playerState = {
      ...basePlayerState,
      collectedEvidenceIds: ['a1', 'a2', 'a3'],
    };
    const result = calculateInvestigationEfficiency(playerState, baseCaseData);
    expect(result).toBe(100); // Average efficiency
  });

  it('returns score between 0 and 100', () => {
    const result = calculateInvestigationEfficiency(basePlayerState, baseCaseData);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

// ============================================
// calculatePrematureClosureScore Tests
// ============================================

describe('calculatePrematureClosureScore', () => {
  it('returns 100 when initial IP is 0', () => {
    const caseData = {
      ...baseCaseData,
      briefing: { ...baseCaseData.briefing, investigationPoints: 0 },
    };
    const result = calculatePrematureClosureScore(basePlayerState, caseData);
    expect(result).toBe(100);
  });

  it('returns 0 when no IP spent', () => {
    const playerState = { ...basePlayerState, investigationPointsRemaining: 10 };
    const result = calculatePrematureClosureScore(playerState, baseCaseData);
    expect(result).toBe(0);
  });

  it('returns 100 when all IP spent', () => {
    const playerState = { ...basePlayerState, investigationPointsRemaining: 0 };
    const result = calculatePrematureClosureScore(playerState, baseCaseData);
    expect(result).toBe(100);
  });

  it('returns 50 when half IP spent', () => {
    const playerState = { ...basePlayerState, investigationPointsRemaining: 5 };
    const result = calculatePrematureClosureScore(playerState, baseCaseData);
    expect(result).toBe(50);
  });

  it('returns correct percentage for partial IP usage', () => {
    const playerState = { ...basePlayerState, investigationPointsRemaining: 3 };
    const result = calculatePrematureClosureScore(playerState, baseCaseData);
    expect(result).toBe(70); // 7/10 = 70%
  });

  it('clamps score between 0 and 100', () => {
    // Edge case: more IP remaining than initial (shouldn't happen but test robustness)
    const playerState = { ...basePlayerState, investigationPointsRemaining: 15 };
    const result = calculatePrematureClosureScore(playerState, baseCaseData);
    expect(result).toBe(0); // Max clamped to 0 for negative
  });
});

// ============================================
// calculateContradictionScore Tests
// ============================================

describe('calculateContradictionScore', () => {
  it('returns 100 when no contradictions in case', () => {
    const caseData: CaseDataWithContradictions = { ...baseCaseData };
    const result = calculateContradictionScore(baseEnhancedState, caseData);
    expect(result).toBe(100);
  });

  it('returns 100 when contradictions array is empty', () => {
    const caseData: CaseDataWithContradictions = {
      ...baseCaseData,
      contradictions: [],
    };
    const result = calculateContradictionScore(baseEnhancedState, caseData);
    expect(result).toBe(100);
  });

  it('returns 0 when no contradictions discovered', () => {
    const caseData: CaseDataWithContradictions = {
      ...baseCaseData,
      contradictions: testContradictions,
    };
    const result = calculateContradictionScore(baseEnhancedState, caseData);
    expect(result).toBe(0);
  });

  it('returns 50 when half contradictions discovered', () => {
    const caseData: CaseDataWithContradictions = {
      ...baseCaseData,
      contradictions: testContradictions,
    };
    const playerState: EnhancedPlayerState = {
      ...baseEnhancedState,
      discoveredContradictions: ['c1'],
    };
    const result = calculateContradictionScore(playerState, caseData);
    expect(result).toBe(50);
  });

  it('returns 100 when all contradictions discovered', () => {
    const caseData: CaseDataWithContradictions = {
      ...baseCaseData,
      contradictions: testContradictions,
    };
    const playerState: EnhancedPlayerState = {
      ...baseEnhancedState,
      discoveredContradictions: ['c1', 'c2'],
    };
    const result = calculateContradictionScore(playerState, caseData);
    expect(result).toBe(100);
  });

  it('handles backward compatibility (no discoveredContradictions)', () => {
    const caseData: CaseDataWithContradictions = {
      ...baseCaseData,
      contradictions: testContradictions,
    };
    // Cast to simulate old state without discoveredContradictions
    const playerState = { ...basePlayerState } as unknown as EnhancedPlayerState;
    const result = calculateContradictionScore(playerState, caseData);
    expect(result).toBe(0);
  });
});

// ============================================
// calculateTierDiscoveryScore Tests
// ============================================

describe('calculateTierDiscoveryScore', () => {
  const tier2Hypotheses: ConditionalHypothesis[] = [
    { id: 'h1', label: 'H1', description: 'D1', isCorrect: false, tier: 1 },
    { id: 'h2', label: 'H2', description: 'D2', isCorrect: true, tier: 1 },
    { id: 'h3', label: 'H3', description: 'D3', isCorrect: false, tier: 2 },
    { id: 'h4', label: 'H4', description: 'D4', isCorrect: false, tier: 2 },
  ];

  const caseDataWithTiers: CaseData = {
    ...baseCaseData,
    hypotheses: tier2Hypotheses as unknown as CaseData['hypotheses'],
  };

  it('returns 100 when no Tier 2 hypotheses exist', () => {
    const result = calculateTierDiscoveryScore(baseEnhancedState, baseCaseData);
    expect(result).toBe(100);
  });

  it('returns 0 when no Tier 2 hypotheses unlocked', () => {
    const result = calculateTierDiscoveryScore(baseEnhancedState, caseDataWithTiers);
    expect(result).toBe(0);
  });

  it('returns 50 when half Tier 2 hypotheses unlocked', () => {
    const playerState: EnhancedPlayerState = {
      ...baseEnhancedState,
      unlockedHypotheses: ['h3'],
    };
    const result = calculateTierDiscoveryScore(playerState, caseDataWithTiers);
    expect(result).toBe(50);
  });

  it('returns 100 when all Tier 2 hypotheses unlocked', () => {
    const playerState: EnhancedPlayerState = {
      ...baseEnhancedState,
      unlockedHypotheses: ['h3', 'h4'],
    };
    const result = calculateTierDiscoveryScore(playerState, caseDataWithTiers);
    expect(result).toBe(100);
  });

  it('ignores Tier 1 hypotheses in unlock count', () => {
    const playerState: EnhancedPlayerState = {
      ...baseEnhancedState,
      unlockedHypotheses: ['h1', 'h2'], // Only Tier 1 unlocked
    };
    const result = calculateTierDiscoveryScore(playerState, caseDataWithTiers);
    expect(result).toBe(0); // Tier 1 doesn't count
  });

  it('handles backward compatibility (no unlockedHypotheses)', () => {
    // Cast to simulate old state without unlockedHypotheses
    const playerState = { ...basePlayerState } as unknown as EnhancedPlayerState;
    const result = calculateTierDiscoveryScore(playerState, caseDataWithTiers);
    expect(result).toBe(0);
  });
});

// ============================================
// getMetricInterpretation Tests
// ============================================

describe('getMetricInterpretation', () => {
  it('returns low/red for scores <= 40', () => {
    expect(getMetricInterpretation(0)).toEqual({ level: 'low', color: 'red' });
    expect(getMetricInterpretation(20)).toEqual({ level: 'low', color: 'red' });
    expect(getMetricInterpretation(40)).toEqual({ level: 'low', color: 'red' });
  });

  it('returns medium/amber for scores 41-70', () => {
    expect(getMetricInterpretation(41)).toEqual({ level: 'medium', color: 'amber' });
    expect(getMetricInterpretation(55)).toEqual({ level: 'medium', color: 'amber' });
    expect(getMetricInterpretation(70)).toEqual({ level: 'medium', color: 'amber' });
  });

  it('returns high/green for scores > 70', () => {
    expect(getMetricInterpretation(71)).toEqual({ level: 'high', color: 'green' });
    expect(getMetricInterpretation(85)).toEqual({ level: 'high', color: 'green' });
    expect(getMetricInterpretation(100)).toEqual({ level: 'high', color: 'green' });
  });
});

// ============================================
// Integration Tests
// ============================================

describe('Scoring Integration', () => {
  it('all scores are within 0-100 range', () => {
    const caseData: CaseDataWithContradictions = {
      ...baseCaseData,
      contradictions: testContradictions,
    };

    const playerState: EnhancedPlayerState = {
      ...baseEnhancedState,
      collectedEvidenceIds: ['a1', 'a2'],
      investigationPointsRemaining: 5,
      discoveredContradictions: ['c1'],
      unlockedHypotheses: [],
    };

    const efficiency = calculateInvestigationEfficiency(playerState, caseData);
    const closure = calculatePrematureClosureScore(playerState, caseData);
    const contradiction = calculateContradictionScore(playerState, caseData);
    const tier = calculateTierDiscoveryScore(playerState, caseData);

    expect(efficiency).toBeGreaterThanOrEqual(0);
    expect(efficiency).toBeLessThanOrEqual(100);
    expect(closure).toBeGreaterThanOrEqual(0);
    expect(closure).toBeLessThanOrEqual(100);
    expect(contradiction).toBeGreaterThanOrEqual(0);
    expect(contradiction).toBeLessThanOrEqual(100);
    expect(tier).toBeGreaterThanOrEqual(0);
    expect(tier).toBeLessThanOrEqual(100);
  });
});
