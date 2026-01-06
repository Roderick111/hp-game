/**
 * Unit Tests for Contradiction Detection Functions
 *
 * Tests all contradiction evaluation logic including:
 * - Single contradiction discovery checking
 * - Finding newly discovered contradictions
 * - All contradictions discovered check
 * - Resolution rate calculation
 * - Discovery rate calculation
 *
 * @module utils/__tests__/contradictions.test
 * @since Milestone 3
 */

import { describe, it, expect } from 'vitest';
import {
  isContradictionDiscovered,
  findNewlyDiscoveredContradictions,
  areAllContradictionsDiscovered,
  getContradictionResolutionRate,
  getContradictionDiscoveryRate,
} from '../contradictions';
import type { Contradiction } from '../../types/enhanced';

// ============================================
// Test Fixtures
// ============================================

const contradiction1: Contradiction = {
  id: 'c1',
  evidenceId1: 'e3',
  evidenceId2: 'e7',
  description: 'Witness A claims suspect was at the tavern, but records show no entry.',
  isResolved: false,
};

const contradiction2: Contradiction = {
  id: 'c2',
  evidenceId1: 'e4',
  evidenceId2: 'e8',
  description: 'Wand analysis shows no spells, but magical residue found at scene.',
  isResolved: false,
};

const contradiction3: Contradiction = {
  id: 'c3',
  evidenceId1: 'e2',
  evidenceId2: 'e6',
  description: 'Time of incident conflicts between healer report and witness.',
  resolution: 'Witness was confused due to Confundus charm.',
  isResolved: true,
};

const allContradictions: readonly Contradiction[] = [
  contradiction1,
  contradiction2,
  contradiction3,
];

// ============================================
// isContradictionDiscovered Tests
// ============================================

describe('isContradictionDiscovered', () => {
  it('returns false when no evidence collected', () => {
    const result = isContradictionDiscovered(contradiction1, []);
    expect(result).toBe(false);
  });

  it('returns false when only first evidence collected', () => {
    const result = isContradictionDiscovered(contradiction1, ['e3']);
    expect(result).toBe(false);
  });

  it('returns false when only second evidence collected', () => {
    const result = isContradictionDiscovered(contradiction1, ['e7']);
    expect(result).toBe(false);
  });

  it('returns true when both evidence pieces collected', () => {
    const result = isContradictionDiscovered(contradiction1, ['e3', 'e7']);
    expect(result).toBe(true);
  });

  it('returns true when both pieces collected among others', () => {
    const collected = ['e1', 'e2', 'e3', 'e5', 'e7', 'e9'];
    const result = isContradictionDiscovered(contradiction1, collected);
    expect(result).toBe(true);
  });

  it('handles different contradictions independently', () => {
    const collected = ['e3', 'e7']; // Only c1's evidence
    expect(isContradictionDiscovered(contradiction1, collected)).toBe(true);
    expect(isContradictionDiscovered(contradiction2, collected)).toBe(false);
    expect(isContradictionDiscovered(contradiction3, collected)).toBe(false);
  });
});

// ============================================
// findNewlyDiscoveredContradictions Tests
// ============================================

describe('findNewlyDiscoveredContradictions', () => {
  it('returns empty array when no evidence collected', () => {
    const result = findNewlyDiscoveredContradictions(allContradictions, [], []);
    expect(result).toEqual([]);
  });

  it('returns empty array when no contradictions exist', () => {
    const result = findNewlyDiscoveredContradictions([], ['e1', 'e2', 'e3'], []);
    expect(result).toEqual([]);
  });

  it('returns empty array when evidence does not complete any contradiction', () => {
    const collected = ['e1', 'e5', 'e9']; // None complete a contradiction
    const result = findNewlyDiscoveredContradictions(allContradictions, collected, []);
    expect(result).toEqual([]);
  });

  it('returns single newly discovered contradiction', () => {
    const collected = ['e3', 'e7']; // Completes c1
    const result = findNewlyDiscoveredContradictions(allContradictions, collected, []);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('c1');
  });

  it('returns multiple newly discovered contradictions', () => {
    const collected = ['e3', 'e7', 'e4', 'e8']; // Completes c1 and c2
    const result = findNewlyDiscoveredContradictions(allContradictions, collected, []);
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id)).toContain('c1');
    expect(result.map((c) => c.id)).toContain('c2');
  });

  it('excludes already discovered contradictions', () => {
    const collected = ['e3', 'e7', 'e4', 'e8']; // Completes c1 and c2
    const alreadyDiscovered = ['c1']; // c1 already known
    const result = findNewlyDiscoveredContradictions(
      allContradictions,
      collected,
      alreadyDiscovered
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('c2');
  });

  it('returns empty array when all contradictions already discovered', () => {
    const collected = ['e2', 'e3', 'e4', 'e6', 'e7', 'e8']; // All evidence
    const alreadyDiscovered = ['c1', 'c2', 'c3'];
    const result = findNewlyDiscoveredContradictions(
      allContradictions,
      collected,
      alreadyDiscovered
    );
    expect(result).toEqual([]);
  });

  it('handles partial evidence collection correctly', () => {
    // Only one piece of each contradiction
    const collected = ['e3', 'e4', 'e2'];
    const result = findNewlyDiscoveredContradictions(allContradictions, collected, []);
    expect(result).toEqual([]);
  });
});

// ============================================
// areAllContradictionsDiscovered Tests
// ============================================

describe('areAllContradictionsDiscovered', () => {
  it('returns true when no contradictions exist', () => {
    const result = areAllContradictionsDiscovered([], []);
    expect(result).toBe(true);
  });

  it('returns false when no contradictions discovered', () => {
    const result = areAllContradictionsDiscovered(allContradictions, []);
    expect(result).toBe(false);
  });

  it('returns false when only some contradictions discovered', () => {
    const result = areAllContradictionsDiscovered(allContradictions, ['c1', 'c2']);
    expect(result).toBe(false);
  });

  it('returns true when all contradictions discovered', () => {
    const result = areAllContradictionsDiscovered(allContradictions, ['c1', 'c2', 'c3']);
    expect(result).toBe(true);
  });

  it('returns true when discovered includes extra IDs', () => {
    // Player discovered more than exists (shouldn't happen but should be safe)
    const result = areAllContradictionsDiscovered(allContradictions, [
      'c1',
      'c2',
      'c3',
      'c4',
    ]);
    expect(result).toBe(true);
  });

  it('handles single contradiction case', () => {
    const singleContradiction = [contradiction1];
    expect(areAllContradictionsDiscovered(singleContradiction, [])).toBe(false);
    expect(areAllContradictionsDiscovered(singleContradiction, ['c1'])).toBe(true);
  });
});

// ============================================
// getContradictionResolutionRate Tests
// ============================================

describe('getContradictionResolutionRate', () => {
  it('returns 100 when no contradictions exist', () => {
    const result = getContradictionResolutionRate(0, []);
    expect(result).toBe(100);
  });

  it('returns 0 when no contradictions resolved', () => {
    const result = getContradictionResolutionRate(3, []);
    expect(result).toBe(0);
  });

  it('returns correct percentage for partial resolution', () => {
    const result = getContradictionResolutionRate(4, ['c1', 'c2']);
    expect(result).toBe(50);
  });

  it('returns 100 when all contradictions resolved', () => {
    const result = getContradictionResolutionRate(3, ['c1', 'c2', 'c3']);
    expect(result).toBe(100);
  });

  it('handles odd percentages with rounding', () => {
    const result = getContradictionResolutionRate(3, ['c1']);
    expect(result).toBe(33); // 33.33% rounds to 33
  });

  it('handles two-thirds correctly', () => {
    const result = getContradictionResolutionRate(3, ['c1', 'c2']);
    expect(result).toBe(67); // 66.67% rounds to 67
  });

  it('handles single contradiction case', () => {
    expect(getContradictionResolutionRate(1, [])).toBe(0);
    expect(getContradictionResolutionRate(1, ['c1'])).toBe(100);
  });
});

// ============================================
// getContradictionDiscoveryRate Tests
// ============================================

describe('getContradictionDiscoveryRate', () => {
  it('returns 100 when no contradictions exist', () => {
    const result = getContradictionDiscoveryRate(0, []);
    expect(result).toBe(100);
  });

  it('returns 0 when no contradictions discovered', () => {
    const result = getContradictionDiscoveryRate(3, []);
    expect(result).toBe(0);
  });

  it('returns correct percentage for partial discovery', () => {
    const result = getContradictionDiscoveryRate(4, ['c1', 'c2']);
    expect(result).toBe(50);
  });

  it('returns 100 when all contradictions discovered', () => {
    const result = getContradictionDiscoveryRate(3, ['c1', 'c2', 'c3']);
    expect(result).toBe(100);
  });

  it('handles odd percentages with rounding', () => {
    const result = getContradictionDiscoveryRate(3, ['c1']);
    expect(result).toBe(33);
  });

  it('handles single contradiction case', () => {
    expect(getContradictionDiscoveryRate(1, [])).toBe(0);
    expect(getContradictionDiscoveryRate(1, ['c1'])).toBe(100);
  });
});

// ============================================
// Integration Tests
// ============================================

describe('Contradiction Detection Integration', () => {
  it('simulates full investigation flow', () => {
    const contradictions = allContradictions;
    let discovered: string[] = [];
    let resolved: string[] = [];

    // Initially nothing discovered
    expect(getContradictionDiscoveryRate(3, discovered)).toBe(0);
    expect(getContradictionResolutionRate(3, resolved)).toBe(0);
    expect(areAllContradictionsDiscovered(contradictions, discovered)).toBe(false);

    // Player collects e3 and e7, discovering c1
    const collected1 = ['e3', 'e7'];
    const newlyDiscovered1 = findNewlyDiscoveredContradictions(
      contradictions,
      collected1,
      discovered
    );
    expect(newlyDiscovered1).toHaveLength(1);
    discovered = [...discovered, ...newlyDiscovered1.map((c) => c.id)];

    expect(getContradictionDiscoveryRate(3, discovered)).toBe(33);

    // Player collects more evidence, discovering c2 and c3
    const collected2 = ['e3', 'e7', 'e4', 'e8', 'e2', 'e6'];
    const newlyDiscovered2 = findNewlyDiscoveredContradictions(
      contradictions,
      collected2,
      discovered
    );
    expect(newlyDiscovered2).toHaveLength(2);
    discovered = [...discovered, ...newlyDiscovered2.map((c) => c.id)];

    expect(getContradictionDiscoveryRate(3, discovered)).toBe(100);
    expect(areAllContradictionsDiscovered(contradictions, discovered)).toBe(true);

    // Player resolves one contradiction
    resolved = ['c1'];
    expect(getContradictionResolutionRate(3, resolved)).toBe(33);

    // Player resolves all contradictions
    resolved = ['c1', 'c2', 'c3'];
    expect(getContradictionResolutionRate(3, resolved)).toBe(100);
  });
});
