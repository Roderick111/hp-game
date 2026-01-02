/**
 * Unit tests for evidenceRelevance utility functions
 *
 * Tests for evidence-hypothesis relevance calculation including:
 * - checkEvidenceInRequirement (recursive requirement checking)
 * - checkEvidenceInContradiction (contradiction lookup)
 * - calculateEvidenceRelevance (relevance determination)
 * - getRelevantHypotheses (batch relevance calculation)
 * - getHypothesisShortLabel (label generation)
 * - getHypothesisSupportSummary (aggregate counting)
 *
 * @module utils/__tests__/evidenceRelevance.test
 * @since Milestone 6
 */

import { describe, it, expect } from 'vitest';
import type { UnlockRequirement, ConditionalHypothesis, Contradiction } from '../../types/enhanced';
import {
  checkEvidenceInRequirement,
  checkEvidenceInContradiction,
  calculateEvidenceRelevance,
  getRelevantHypotheses,
  getHypothesisShortLabel,
  getHypothesisSupportSummary,
} from '../evidenceRelevance';

// ============================================================================
// Test Fixtures
// ============================================================================

const mockHypotheses: ConditionalHypothesis[] = [
  {
    id: 'h1',
    label: 'Marcus Cast the Curse',
    description: 'Marcus is the direct attacker',
    tier: 1,
    isCorrect: false,
  },
  {
    id: 'h2',
    label: 'Cursed Violin Theory',
    description: 'The violin itself is cursed',
    tier: 2,
    isCorrect: true,
    unlockRequirements: [
      { type: 'evidence_collected', evidenceId: 'violin-evidence' },
    ],
  },
  {
    id: 'h3',
    label: 'Jealousy Motive',
    description: 'Jealousy drove the attack',
    tier: 2,
    isCorrect: false,
    unlockRequirements: [
      {
        type: 'any_of',
        requirements: [
          { type: 'evidence_collected', evidenceId: 'diary-entry' },
          { type: 'evidence_collected', evidenceId: 'witness-statement' },
        ],
      },
    ],
  },
  {
    id: 'h4',
    label: 'Complex Theory',
    description: 'Requires multiple evidence pieces',
    tier: 2,
    isCorrect: false,
    unlockRequirements: [
      {
        type: 'all_of',
        requirements: [
          { type: 'evidence_collected', evidenceId: 'evidence-a' },
          { type: 'evidence_collected', evidenceId: 'evidence-b' },
        ],
      },
    ],
  },
  {
    id: 'h5',
    label: 'Threshold Theory',
    description: 'Based on IP threshold',
    tier: 2,
    isCorrect: false,
    unlockRequirements: [
      { type: 'threshold_met', metric: 'ipSpent', threshold: 5 },
    ],
  },
];

const mockContradictions: Contradiction[] = [
  {
    id: 'c1',
    evidenceId1: 'alibi-evidence',
    evidenceId2: 'witness-claim',
    description: 'Alibi contradicts witness timing',
    resolution: 'Witness was mistaken about time',
    isResolved: false,
  },
  {
    id: 'c2',
    evidenceId1: 'violin-evidence',
    evidenceId2: 'wand-test',
    description: 'Violin curse conflicts with wand test',
    resolution: 'Pre-existing curse on violin',
    isResolved: false,
  },
];

// ============================================================================
// checkEvidenceInRequirement Tests
// ============================================================================

describe('checkEvidenceInRequirement', () => {
  it('should return true for direct evidence_collected match', () => {
    const requirement: UnlockRequirement = {
      type: 'evidence_collected',
      evidenceId: 'violin-evidence',
    };

    expect(checkEvidenceInRequirement('violin-evidence', requirement)).toBe(true);
  });

  it('should return false for non-matching evidence_collected', () => {
    const requirement: UnlockRequirement = {
      type: 'evidence_collected',
      evidenceId: 'violin-evidence',
    };

    expect(checkEvidenceInRequirement('different-evidence', requirement)).toBe(false);
  });

  it('should return false for threshold_met requirements', () => {
    const requirement: UnlockRequirement = {
      type: 'threshold_met',
      metric: 'ipSpent',
      threshold: 5,
    };

    expect(checkEvidenceInRequirement('any-evidence', requirement)).toBe(false);
  });

  it('should find evidence in any_of requirements', () => {
    const requirement: UnlockRequirement = {
      type: 'any_of',
      requirements: [
        { type: 'evidence_collected', evidenceId: 'evidence-a' },
        { type: 'evidence_collected', evidenceId: 'evidence-b' },
      ],
    };

    expect(checkEvidenceInRequirement('evidence-a', requirement)).toBe(true);
    expect(checkEvidenceInRequirement('evidence-b', requirement)).toBe(true);
    expect(checkEvidenceInRequirement('evidence-c', requirement)).toBe(false);
  });

  it('should find evidence in all_of requirements', () => {
    const requirement: UnlockRequirement = {
      type: 'all_of',
      requirements: [
        { type: 'evidence_collected', evidenceId: 'evidence-a' },
        { type: 'evidence_collected', evidenceId: 'evidence-b' },
      ],
    };

    expect(checkEvidenceInRequirement('evidence-a', requirement)).toBe(true);
    expect(checkEvidenceInRequirement('evidence-b', requirement)).toBe(true);
  });

  it('should handle deeply nested requirements', () => {
    const requirement: UnlockRequirement = {
      type: 'any_of',
      requirements: [
        {
          type: 'all_of',
          requirements: [
            { type: 'evidence_collected', evidenceId: 'deep-evidence' },
            { type: 'threshold_met', metric: 'ipSpent', threshold: 3 },
          ],
        },
      ],
    };

    expect(checkEvidenceInRequirement('deep-evidence', requirement)).toBe(true);
  });
});

// ============================================================================
// checkEvidenceInContradiction Tests
// ============================================================================

describe('checkEvidenceInContradiction', () => {
  it('should return true when evidence is evidenceId1', () => {
    expect(checkEvidenceInContradiction('alibi-evidence', mockContradictions)).toBe(true);
  });

  it('should return true when evidence is evidenceId2', () => {
    expect(checkEvidenceInContradiction('witness-claim', mockContradictions)).toBe(true);
  });

  it('should return false when evidence not in any contradiction', () => {
    expect(checkEvidenceInContradiction('unrelated-evidence', mockContradictions)).toBe(false);
  });

  it('should return false for empty contradictions array', () => {
    expect(checkEvidenceInContradiction('any-evidence', [])).toBe(false);
  });
});

// ============================================================================
// calculateEvidenceRelevance Tests
// ============================================================================

describe('calculateEvidenceRelevance', () => {
  it('should return supports when evidence unlocks hypothesis', () => {
    const relevance = calculateEvidenceRelevance(
      'violin-evidence',
      mockHypotheses[1], // h2 with violin-evidence unlock
      [] // no contradictions
    );

    expect(relevance).toBe('supports');
  });

  it('should return contradicts when evidence is in contradiction', () => {
    const relevance = calculateEvidenceRelevance(
      'alibi-evidence',
      mockHypotheses[0], // h1 with no unlock requirements
      mockContradictions
    );

    expect(relevance).toBe('contradicts');
  });

  it('should prioritize contradicts over supports', () => {
    // violin-evidence both supports h2 AND is in a contradiction
    const relevance = calculateEvidenceRelevance(
      'violin-evidence',
      mockHypotheses[1],
      mockContradictions
    );

    expect(relevance).toBe('contradicts');
  });

  it('should return neutral when evidence has no relationship', () => {
    const relevance = calculateEvidenceRelevance(
      'random-evidence',
      mockHypotheses[0],
      []
    );

    expect(relevance).toBe('neutral');
  });

  it('should handle hypothesis without unlock requirements', () => {
    const relevance = calculateEvidenceRelevance(
      'some-evidence',
      mockHypotheses[0], // h1 has no unlockRequirements
      []
    );

    expect(relevance).toBe('neutral');
  });

  it('should handle any_of unlock requirements', () => {
    const relevance = calculateEvidenceRelevance(
      'diary-entry',
      mockHypotheses[2], // h3 with any_of requirement
      []
    );

    expect(relevance).toBe('supports');
  });
});

// ============================================================================
// getRelevantHypotheses Tests
// ============================================================================

describe('getRelevantHypotheses', () => {
  it('should return empty array when evidence has no relevance', () => {
    const results = getRelevantHypotheses('unrelated-evidence', mockHypotheses, []);

    expect(results).toEqual([]);
  });

  it('should return supporting hypothesis', () => {
    const results = getRelevantHypotheses('diary-entry', mockHypotheses, []);

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      hypothesisId: 'h3',
      hypothesisLabel: 'Jealousy Motive',
      relevance: 'supports',
    });
  });

  it('should return contradicting hypothesis', () => {
    const results = getRelevantHypotheses('alibi-evidence', mockHypotheses, mockContradictions);

    // Should have 5 results (one for each hypothesis) since contradiction applies globally
    const contradictingResults = results.filter((r) => r.relevance === 'contradicts');
    expect(contradictingResults.length).toBeGreaterThan(0);
  });

  it('should filter out neutral relationships', () => {
    const results = getRelevantHypotheses('evidence-a', mockHypotheses, []);

    // Only h4 should be relevant (supports)
    // Note: NonNeutralRelevance type guarantees no neutral values
    // so we just verify results only contain 'supports' or 'contradicts'
    const validRelevances = ['supports', 'contradicts'];
    expect(results.every((r) => validRelevances.includes(r.relevance))).toBe(true);
  });
});

// ============================================================================
// getHypothesisShortLabel Tests
// ============================================================================

describe('getHypothesisShortLabel', () => {
  it('should extract number from h1, h2 pattern', () => {
    expect(getHypothesisShortLabel('h1', mockHypotheses)).toBe('H1');
    expect(getHypothesisShortLabel('h2', mockHypotheses)).toBe('H2');
    expect(getHypothesisShortLabel('h10', mockHypotheses)).toBe('H10');
  });

  it('should handle case insensitive matching', () => {
    expect(getHypothesisShortLabel('H3', mockHypotheses)).toBe('H3');
  });

  it('should fall back to index for non-standard IDs', () => {
    const customHypotheses: ConditionalHypothesis[] = [
      { id: 'marcus-theory', label: 'Marcus Theory', description: 'Test', tier: 1, isCorrect: false },
      { id: 'violin-theory', label: 'Violin Theory', description: 'Test', tier: 1, isCorrect: true },
    ];

    expect(getHypothesisShortLabel('marcus-theory', customHypotheses)).toBe('H1');
    expect(getHypothesisShortLabel('violin-theory', customHypotheses)).toBe('H2');
  });

  it('should return first 2 chars for unknown hypothesis', () => {
    expect(getHypothesisShortLabel('unknown-id', [])).toBe('UN');
  });
});

// ============================================================================
// getHypothesisSupportSummary Tests
// ============================================================================

describe('getHypothesisSupportSummary', () => {
  it('should initialize all hypotheses with zero counts', () => {
    const summary = getHypothesisSupportSummary([], mockHypotheses, []);

    expect(summary.get('h1')).toEqual({ supports: 0, contradicts: 0 });
    expect(summary.get('h2')).toEqual({ supports: 0, contradicts: 0 });
  });

  it('should count supporting evidence', () => {
    const summary = getHypothesisSupportSummary(
      ['violin-evidence'],
      mockHypotheses,
      []
    );

    expect(summary.get('h2')?.supports).toBe(1);
  });

  it('should count contradicting evidence', () => {
    const summary = getHypothesisSupportSummary(
      ['alibi-evidence'],
      mockHypotheses,
      mockContradictions
    );

    // alibi-evidence is in a contradiction, so all hypotheses get a contradict
    const totalContradicts = Array.from(summary.values()).reduce(
      (sum, counts) => sum + counts.contradicts,
      0
    );
    expect(totalContradicts).toBeGreaterThan(0);
  });

  it('should aggregate multiple evidence pieces', () => {
    const summary = getHypothesisSupportSummary(
      ['diary-entry', 'witness-statement'],
      mockHypotheses,
      []
    );

    // h3 has any_of with both these evidence pieces
    expect(summary.get('h3')?.supports).toBe(2);
  });

  it('should handle empty evidence array', () => {
    const summary = getHypothesisSupportSummary([], mockHypotheses, mockContradictions);

    // All counts should be zero
    for (const [, counts] of summary) {
      expect(counts.supports).toBe(0);
      expect(counts.contradicts).toBe(0);
    }
  });
});
