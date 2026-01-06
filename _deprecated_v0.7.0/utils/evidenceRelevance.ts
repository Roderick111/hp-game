/**
 * Evidence-Hypothesis Relevance Utilities
 *
 * Pure functions to calculate which hypotheses an evidence piece supports or contradicts.
 * Used by EvidenceCard to display hypothesis relevance badges.
 *
 * @module utils/evidenceRelevance
 * @since Milestone 6
 */

import type { UnlockRequirement, ConditionalHypothesis, Contradiction } from '../types/enhanced';

/**
 * Relevance types for evidence-hypothesis relationships
 */
export type EvidenceRelevance = 'supports' | 'contradicts' | 'neutral';

/**
 * Non-neutral relevance type for results that have a meaningful relationship
 */
export type NonNeutralRelevance = Exclude<EvidenceRelevance, 'neutral'>;

/**
 * Result of relevance calculation for a single hypothesis
 * Note: getRelevantHypotheses only returns non-neutral results,
 * so relevance is typed as NonNeutralRelevance
 */
export interface HypothesisRelevanceResult {
  /** The hypothesis ID */
  hypothesisId: string;
  /** The hypothesis label for display */
  hypothesisLabel: string;
  /** How the evidence relates to this hypothesis (never neutral) */
  relevance: NonNeutralRelevance;
}

/**
 * Recursively check if evidence ID appears in unlock requirements.
 *
 * Handles all unlock requirement types:
 * - evidence_collected: Direct match against evidenceId
 * - threshold_met: Always returns false (no specific evidence)
 * - all_of: Checks all nested requirements
 * - any_of: Checks all nested requirements
 *
 * @param evidenceId - The evidence ID to search for
 * @param requirement - The unlock requirement to check
 * @returns true if evidenceId is referenced in the requirement
 *
 * @example
 * ```typescript
 * const requirement: UnlockRequirement = {
 *   type: 'any_of',
 *   requirements: [
 *     { type: 'evidence_collected', evidenceId: 'e1' },
 *     { type: 'evidence_collected', evidenceId: 'e2' }
 *   ]
 * };
 * checkEvidenceInRequirement('e1', requirement); // true
 * checkEvidenceInRequirement('e3', requirement); // false
 * ```
 */
export function checkEvidenceInRequirement(
  evidenceId: string,
  requirement: UnlockRequirement
): boolean {
  switch (requirement.type) {
    case 'evidence_collected':
      return requirement.evidenceId === evidenceId;

    case 'threshold_met':
      // Threshold requirements don't reference specific evidence
      return false;

    case 'all_of':
    case 'any_of':
      return requirement.requirements.some((r) =>
        checkEvidenceInRequirement(evidenceId, r)
      );

    default:
      // Exhaustive check - TypeScript will error if a case is missed
      return false;
  }
}

/**
 * Check if evidence is part of a contradiction.
 *
 * An evidence piece is involved in a contradiction if it appears as
 * either evidenceId1 or evidenceId2 in any contradiction definition.
 *
 * @param evidenceId - The evidence ID to check
 * @param contradictions - Array of contradictions to search
 * @returns true if evidenceId is part of any contradiction
 *
 * @example
 * ```typescript
 * const contradictions = [
 *   { id: 'c1', evidenceId1: 'e1', evidenceId2: 'e2', ... }
 * ];
 * checkEvidenceInContradiction('e1', contradictions); // true
 * checkEvidenceInContradiction('e3', contradictions); // false
 * ```
 */
export function checkEvidenceInContradiction(
  evidenceId: string,
  contradictions: readonly Contradiction[]
): boolean {
  return contradictions.some(
    (c) => c.evidenceId1 === evidenceId || c.evidenceId2 === evidenceId
  );
}

/**
 * Calculate relevance of evidence to a hypothesis.
 *
 * Logic:
 * - SUPPORTS: Evidence ID appears in hypothesis unlock requirements
 * - CONTRADICTS: Evidence ID appears in case contradictions
 * - NEUTRAL: No direct relationship
 *
 * Note: Evidence can both support AND contradict a hypothesis (rare but possible).
 * In this case, we return 'contradicts' as it's more important to highlight.
 *
 * @param evidenceId - The evidence ID to check
 * @param hypothesis - The hypothesis to check against
 * @param contradictions - All contradictions in the case
 * @returns The relevance relationship
 *
 * @example
 * ```typescript
 * const hypothesis = {
 *   id: 'h1',
 *   tier: 2,
 *   unlockRequirements: [
 *     { type: 'evidence_collected', evidenceId: 'e5' }
 *   ],
 *   ...
 * };
 * calculateEvidenceRelevance('e5', hypothesis, []); // 'supports'
 * ```
 */
export function calculateEvidenceRelevance(
  evidenceId: string,
  hypothesis: ConditionalHypothesis,
  contradictions: readonly Contradiction[]
): EvidenceRelevance {
  // Check if evidence is part of contradiction first (higher priority)
  if (checkEvidenceInContradiction(evidenceId, contradictions)) {
    return 'contradicts';
  }

  // Check if evidence is part of unlock requirements (supports)
  if (hypothesis.unlockRequirements) {
    for (const requirement of hypothesis.unlockRequirements) {
      if (checkEvidenceInRequirement(evidenceId, requirement)) {
        return 'supports';
      }
    }
  }

  return 'neutral';
}

/**
 * Get all hypotheses that are relevant to a given evidence piece.
 *
 * Filters out 'neutral' relationships to only return meaningful connections.
 *
 * @param evidenceId - The evidence ID to check
 * @param hypotheses - Array of all hypotheses in the case
 * @param contradictions - All contradictions in the case
 * @returns Array of hypotheses with their relevance (excluding neutral)
 *
 * @example
 * ```typescript
 * const hypotheses = [
 *   { id: 'h1', label: 'Theory A', tier: 1 },
 *   { id: 'h2', label: 'Theory B', tier: 2, unlockRequirements: [
 *     { type: 'evidence_collected', evidenceId: 'e1' }
 *   ]}
 * ];
 *
 * getRelevantHypotheses('e1', hypotheses, []);
 * // Returns: [{ hypothesisId: 'h2', hypothesisLabel: 'Theory B', relevance: 'supports' }]
 * ```
 */
export function getRelevantHypotheses(
  evidenceId: string,
  hypotheses: readonly ConditionalHypothesis[],
  contradictions: readonly Contradiction[]
): HypothesisRelevanceResult[] {
  const results: HypothesisRelevanceResult[] = [];

  for (const hypothesis of hypotheses) {
    const relevance = calculateEvidenceRelevance(evidenceId, hypothesis, contradictions);

    if (relevance !== 'neutral') {
      // Type narrowing: after the check, relevance is 'supports' | 'contradicts'
      results.push({
        hypothesisId: hypothesis.id,
        hypothesisLabel: hypothesis.label,
        relevance: relevance as NonNeutralRelevance,
      });
    }
  }

  return results;
}

/**
 * Get a short label for a hypothesis (e.g., "H1", "H2").
 *
 * Extracts the hypothesis number from the ID or generates one based on index.
 *
 * @param hypothesisId - The hypothesis ID
 * @param hypotheses - Array of all hypotheses for index lookup
 * @returns Short label like "H1", "H2", etc.
 *
 * @example
 * ```typescript
 * getHypothesisShortLabel('cursed-violin', hypotheses); // "H5" (if 5th in list)
 * getHypothesisShortLabel('h1', hypotheses); // "H1"
 * ```
 */
export function getHypothesisShortLabel(
  hypothesisId: string,
  hypotheses: readonly ConditionalHypothesis[]
): string {
  // Check if ID follows h1, h2 pattern
  const pattern = /^h(\d+)$/i;
  const match = pattern.exec(hypothesisId);
  if (match) {
    return `H${match[1]}`;
  }

  // Fall back to index-based label
  const index = hypotheses.findIndex((h) => h.id === hypothesisId);
  if (index >= 0) {
    return `H${index + 1}`;
  }

  // Last resort - use first 2 chars
  return hypothesisId.substring(0, 2).toUpperCase();
}

/**
 * Get the count of evidence supporting and contradicting each hypothesis.
 *
 * Useful for summary views or investigation strategy planning.
 *
 * @param collectedEvidenceIds - Evidence IDs the player has collected
 * @param hypotheses - Array of all hypotheses
 * @param contradictions - All contradictions in the case
 * @returns Map of hypothesis ID to support/contradict counts
 *
 * @example
 * ```typescript
 * const summary = getHypothesisSupportSummary(
 *   ['e1', 'e2', 'e3'],
 *   hypotheses,
 *   contradictions
 * );
 * // { 'h1': { supports: 2, contradicts: 1 }, 'h2': { supports: 0, contradicts: 0 } }
 * ```
 */
export function getHypothesisSupportSummary(
  collectedEvidenceIds: readonly string[],
  hypotheses: readonly ConditionalHypothesis[],
  contradictions: readonly Contradiction[]
): Map<string, { supports: number; contradicts: number }> {
  const summary = new Map<string, { supports: number; contradicts: number }>();

  // Initialize all hypotheses with zero counts
  for (const hypothesis of hypotheses) {
    summary.set(hypothesis.id, { supports: 0, contradicts: 0 });
  }

  // Count relevance for each collected evidence
  for (const evidenceId of collectedEvidenceIds) {
    for (const hypothesis of hypotheses) {
      const relevance = calculateEvidenceRelevance(evidenceId, hypothesis, contradictions);
      const counts = summary.get(hypothesis.id)!;

      if (relevance === 'supports') {
        counts.supports++;
      } else if (relevance === 'contradicts') {
        counts.contradicts++;
      }
    }
  }

  return summary;
}
