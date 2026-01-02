/**
 * Pure Contradiction Detection Functions
 *
 * This module provides pure functions for evaluating evidence contradictions.
 * All functions are side-effect free: same inputs produce same outputs.
 *
 * @module utils/contradictions
 * @since Milestone 3
 * @see types/enhanced.ts for type definitions
 */

import type { Contradiction } from '../types/enhanced';

/**
 * Check if a contradiction has been discovered by the player.
 *
 * A contradiction is discovered when the player has collected BOTH
 * pieces of conflicting evidence (evidenceId1 and evidenceId2).
 *
 * @param contradiction - The contradiction to check
 * @param collectedEvidenceIds - Array of evidence IDs the player has collected
 * @returns true if both evidence pieces have been collected
 *
 * @example
 * ```typescript
 * const contradiction = { id: 'c1', evidenceId1: 'e3', evidenceId2: 'e7', ... };
 * const collected = ['e1', 'e3', 'e7'];
 * isContradictionDiscovered(contradiction, collected); // true
 * ```
 */
export function isContradictionDiscovered(
  contradiction: Contradiction,
  collectedEvidenceIds: readonly string[]
): boolean {
  return (
    collectedEvidenceIds.includes(contradiction.evidenceId1) &&
    collectedEvidenceIds.includes(contradiction.evidenceId2)
  );
}

/**
 * Find contradictions that should be newly discovered based on collected evidence.
 *
 * Compares current evidence collection against all contradictions to find:
 * - Contradictions where both evidence pieces are now collected
 * - That are not already in the discoveredIds set
 *
 * @param contradictions - All contradictions in the case
 * @param collectedEvidenceIds - Array of evidence IDs the player has collected
 * @param discoveredIds - Array of contradiction IDs already discovered
 * @returns Array of Contradiction objects that should be newly discovered
 *
 * @example
 * ```typescript
 * const contradictions = [c1, c2, c3];
 * const collected = ['e3', 'e7', 'e4'];
 * const alreadyDiscovered = [];
 * const newlyDiscovered = findNewlyDiscoveredContradictions(
 *   contradictions, collected, alreadyDiscovered
 * );
 * // Returns [c1] if c1 requires e3 and e7
 * ```
 */
export function findNewlyDiscoveredContradictions(
  contradictions: readonly Contradiction[],
  collectedEvidenceIds: readonly string[],
  discoveredIds: readonly string[]
): Contradiction[] {
  return contradictions.filter((contradiction) => {
    // Skip if already discovered
    if (discoveredIds.includes(contradiction.id)) {
      return false;
    }

    // Check if both evidence pieces are collected
    return isContradictionDiscovered(contradiction, collectedEvidenceIds);
  });
}

/**
 * Check if all contradictions in a case have been discovered.
 *
 * Useful for tracking investigation completeness and scoring.
 *
 * @param contradictions - All contradictions in the case
 * @param discoveredIds - Array of contradiction IDs the player has discovered
 * @returns true if all contradictions have been discovered
 *
 * @example
 * ```typescript
 * const contradictions = [c1, c2, c3];
 * const discovered = ['c1', 'c2', 'c3'];
 * areAllContradictionsDiscovered(contradictions, discovered); // true
 * ```
 */
export function areAllContradictionsDiscovered(
  contradictions: readonly Contradiction[],
  discoveredIds: readonly string[]
): boolean {
  // Handle edge case: no contradictions means all are "discovered"
  if (contradictions.length === 0) {
    return true;
  }

  return contradictions.every((contradiction) =>
    discoveredIds.includes(contradiction.id)
  );
}

/**
 * Calculate the contradiction resolution rate as a percentage.
 *
 * Used for scoring and progress tracking. Returns 100 if there are
 * no contradictions (edge case handling for division by zero).
 *
 * @param totalContradictions - Total number of contradictions in the case
 * @param resolvedIds - Array of contradiction IDs the player has resolved
 * @returns Resolution rate as a percentage (0-100)
 *
 * @example
 * ```typescript
 * getContradictionResolutionRate(4, ['c1', 'c2']); // 50
 * getContradictionResolutionRate(0, []); // 100 (no contradictions = perfect)
 * getContradictionResolutionRate(3, ['c1', 'c2', 'c3']); // 100
 * ```
 */
export function getContradictionResolutionRate(
  totalContradictions: number,
  resolvedIds: readonly string[]
): number {
  // Handle edge case: no contradictions means 100% resolution
  if (totalContradictions === 0) {
    return 100;
  }

  const resolvedCount = resolvedIds.length;
  return Math.round((resolvedCount / totalContradictions) * 100);
}

/**
 * Get the discovery rate as a percentage.
 *
 * Measures what percentage of contradictions the player has discovered.
 * Returns 100 if there are no contradictions.
 *
 * @param totalContradictions - Total number of contradictions in the case
 * @param discoveredIds - Array of contradiction IDs the player has discovered
 * @returns Discovery rate as a percentage (0-100)
 *
 * @example
 * ```typescript
 * getContradictionDiscoveryRate(4, ['c1', 'c2']); // 50
 * getContradictionDiscoveryRate(0, []); // 100
 * ```
 */
export function getContradictionDiscoveryRate(
  totalContradictions: number,
  discoveredIds: readonly string[]
): number {
  // Handle edge case: no contradictions means 100% discovery
  if (totalContradictions === 0) {
    return 100;
  }

  const discoveredCount = discoveredIds.length;
  return Math.round((discoveredCount / totalContradictions) * 100);
}
