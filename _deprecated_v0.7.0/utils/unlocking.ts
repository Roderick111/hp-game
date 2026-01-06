/**
 * Pure Unlock Evaluation Functions
 *
 * This module provides pure functions for evaluating hypothesis unlock requirements.
 * All functions are side-effect free: same inputs produce same outputs.
 *
 * @module utils/unlocking
 * @since Milestone 2
 * @see types/enhanced.ts for type definitions
 */

import type {
  UnlockRequirement,
  UnlockTrigger,
  ConditionalHypothesis,
  EnhancedPlayerState,
} from '../types/enhanced';

/**
 * Get the current value of a game metric from player state.
 *
 * Metrics:
 * - evidenceCount: Number of evidence pieces collected
 * - ipSpent: Investigation points spent (initial - remaining)
 * - investigationProgress: Percentage of IP spent (0-100)
 *
 * @param state - Current player state
 * @param metric - The metric to retrieve
 * @param initialIp - Initial investigation points (for calculating ipSpent)
 * @returns The numeric value of the metric
 *
 * @example
 * ```typescript
 * const evidenceCount = getMetricValue(state, 'evidenceCount');
 * const ipSpent = getMetricValue(state, 'ipSpent', 12);
 * ```
 */
export function getMetricValue(
  state: EnhancedPlayerState,
  metric: 'investigationProgress' | 'evidenceCount' | 'ipSpent',
  initialIp?: number
): number {
  switch (metric) {
    case 'evidenceCount':
      return state.collectedEvidenceIds.length;

    case 'ipSpent': {
      const initial = initialIp ?? state.investigationPointsRemaining;
      return initial - state.investigationPointsRemaining;
    }

    case 'investigationProgress': {
      const initial = initialIp ?? 12; // Default initial IP
      if (initial === 0) return 100;
      const spent = initial - state.investigationPointsRemaining;
      return Math.round((spent / initial) * 100);
    }

    default: {
      // Exhaustive check - TypeScript ensures all cases are handled
      const _exhaustive: never = metric;
      return _exhaustive;
    }
  }
}

/**
 * Evaluate whether a single unlock requirement is satisfied.
 *
 * Uses discriminated union type narrowing to handle each requirement type.
 * Recursively evaluates composite requirements (all_of, any_of).
 *
 * @param requirement - The requirement to evaluate
 * @param state - Current player state
 * @param initialIp - Initial investigation points (for threshold calculations)
 * @returns true if requirement is satisfied, false otherwise
 *
 * @example Evidence Collection
 * ```typescript
 * const req: UnlockRequirement = { type: 'evidence_collected', evidenceId: 'e5' };
 * const met = evaluateRequirement(req, state); // true if e5 collected
 * ```
 *
 * @example Composite Requirement
 * ```typescript
 * const req: UnlockRequirement = {
 *   type: 'all_of',
 *   requirements: [
 *     { type: 'evidence_collected', evidenceId: 'e1' },
 *     { type: 'threshold_met', metric: 'ipSpent', threshold: 4 }
 *   ]
 * };
 * const met = evaluateRequirement(req, state, 12); // true if BOTH met
 * ```
 */
export function evaluateRequirement(
  requirement: UnlockRequirement,
  state: EnhancedPlayerState,
  initialIp?: number
): boolean {
  switch (requirement.type) {
    case 'evidence_collected':
      return state.collectedEvidenceIds.includes(requirement.evidenceId);

    case 'threshold_met': {
      const value = getMetricValue(state, requirement.metric, initialIp);
      return value >= requirement.threshold;
    }

    case 'all_of':
      // All nested requirements must be satisfied
      return requirement.requirements.every((req) =>
        evaluateRequirement(req, state, initialIp)
      );

    case 'any_of':
      // At least one nested requirement must be satisfied
      return requirement.requirements.some((req) =>
        evaluateRequirement(req, state, initialIp)
      );

    default: {
      // Exhaustive check
      const _exhaustive: never = requirement;
      return _exhaustive;
    }
  }
}

/**
 * Check if a hypothesis is currently unlocked/available for selection.
 *
 * - Tier 1 hypotheses are always unlocked
 * - Tier 2 hypotheses require all unlock requirements to be met
 * - Already unlocked Tier 2 hypotheses remain unlocked
 *
 * @param hypothesis - The hypothesis to check
 * @param state - Current player state
 * @param initialIp - Initial investigation points
 * @returns true if hypothesis is available for selection
 *
 * @example
 * ```typescript
 * const isAvailable = isHypothesisUnlocked(hypothesis, state, 12);
 * if (isAvailable) {
 *   // Player can select this hypothesis
 * }
 * ```
 */
export function isHypothesisUnlocked(
  hypothesis: ConditionalHypothesis,
  state: EnhancedPlayerState,
  initialIp?: number
): boolean {
  // Tier 1 hypotheses are always available
  if (hypothesis.tier === 1) {
    return true;
  }

  // Check if already unlocked (persisted in state)
  if (state.unlockedHypotheses.includes(hypothesis.id)) {
    return true;
  }

  // Tier 2: check if requirements are now met
  // If no requirements specified, treat as locked (requires explicit unlock)
  if (!hypothesis.unlockRequirements || hypothesis.unlockRequirements.length === 0) {
    return false;
  }

  // All requirements must be met for Tier 2 unlock
  return hypothesis.unlockRequirements.every((req) =>
    evaluateRequirement(req, state, initialIp)
  );
}

/**
 * Find hypotheses that should be unlocked but are not yet in state.
 *
 * Compares current state against all hypotheses to find:
 * - Tier 2 hypotheses with met requirements
 * - That are not already in state.unlockedHypotheses
 *
 * @param hypotheses - All hypotheses in the case
 * @param state - Current player state
 * @param initialIp - Initial investigation points
 * @returns Array of hypothesis IDs that should be newly unlocked
 *
 * @example
 * ```typescript
 * const newUnlocks = findNewlyUnlockedHypotheses(hypotheses, state, 12);
 * newUnlocks.forEach(id => {
 *   dispatch({ type: 'UNLOCK_HYPOTHESIS', hypothesisId: id, trigger });
 * });
 * ```
 */
export function findNewlyUnlockedHypotheses(
  hypotheses: readonly ConditionalHypothesis[],
  state: EnhancedPlayerState,
  initialIp?: number
): string[] {
  return hypotheses
    .filter((hypothesis) => {
      // Only consider Tier 2 hypotheses
      if (hypothesis.tier !== 2) {
        return false;
      }

      // Skip if already unlocked
      if (state.unlockedHypotheses.includes(hypothesis.id)) {
        return false;
      }

      // Check if requirements are now met
      if (!hypothesis.unlockRequirements || hypothesis.unlockRequirements.length === 0) {
        return false;
      }

      return hypothesis.unlockRequirements.every((req) =>
        evaluateRequirement(req, state, initialIp)
      );
    })
    .map((hypothesis) => hypothesis.id);
}

/**
 * Create an unlock trigger object based on current game state.
 *
 * Determines the most appropriate trigger type:
 * - If evidence was just collected, uses 'evidence_collected'
 * - Otherwise falls back to threshold-based trigger
 *
 * @param evidenceId - The ID of evidence that was just collected
 * @param state - Current player state
 * @param initialIp - Initial investigation points
 * @returns An UnlockTrigger object describing what caused the unlock
 *
 * @example
 * ```typescript
 * const trigger = createUnlockTrigger('e5', state, 12);
 * dispatch({ type: 'UNLOCK_HYPOTHESIS', hypothesisId: 'h3', trigger });
 * ```
 */
export function createUnlockTrigger(
  evidenceId: string,
  state: EnhancedPlayerState,
  initialIp?: number
): UnlockTrigger {
  // If evidence ID is provided and in collected list, use evidence trigger
  if (evidenceId && state.collectedEvidenceIds.includes(evidenceId)) {
    return {
      type: 'evidence_collected',
      evidenceId,
    };
  }

  // Otherwise, create a threshold trigger based on evidence count
  return {
    type: 'threshold_met',
    metric: 'evidenceCount',
    value: getMetricValue(state, 'evidenceCount', initialIp),
  };
}
