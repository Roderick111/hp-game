/**
 * Scoring Utilities for Auror Academy: Case Files
 *
 * This module provides functions for calculating player scores and metrics.
 * Includes both original metrics and enhanced Milestone 4 metrics.
 *
 * @module utils/scoring
 * @since Milestone 1
 * @updated Milestone 4
 */

import { PlayerState, CaseData, PlayerScores } from '../types/game';
import type { EnhancedPlayerState, ConditionalHypothesis, Contradiction } from '../types/enhanced';

/**
 * Extended CaseData interface that includes contradictions.
 * Used for enhanced scoring calculations.
 */
export interface CaseDataWithContradictions extends CaseData {
  contradictions?: readonly Contradiction[];
}

/**
 * Calculate all player scores for case review.
 *
 * @param playerState - Current player state (can be EnhancedPlayerState)
 * @param caseData - Case data (can include contradictions)
 * @returns Complete PlayerScores object
 */
export function calculateScores(
  playerState: PlayerState,
  caseData: CaseData
): PlayerScores {
  const correctHypothesis = caseData.hypotheses.find(h => h.isCorrect);
  const correctId = correctHypothesis?.id ?? '';

  // 1. Did they select the correct hypothesis?
  const correctHypothesisSelected = playerState.selectedHypotheses.includes(correctId);

  // 2. Initial probability on correct answer
  const initialProbabilityOnCorrect = playerState.initialProbabilities[correctId] || 0;

  // 3. Final probability on correct answer
  const finalProbabilityOnCorrect = playerState.finalProbabilities[correctId] || 0;

  // 4. Confirmation bias calculation
  const { confirmationBiasScore, mostInvestigatedHypothesis, investigationBreakdown } =
    calculateConfirmationBias(playerState, caseData);

  // 5. Critical evidence check
  const criticalActions = caseData.investigationActions.filter(
    a => a.evidence.isCritical
  );
  const criticalIds = criticalActions.map(a => a.id);
  const foundCriticalIds = playerState.collectedEvidenceIds.filter(
    id => criticalIds.includes(id)
  );
  const missedCriticalEvidence = criticalActions
    .filter(a => !playerState.collectedEvidenceIds.includes(a.id))
    .map(a => a.title);

  // 6. Enhanced metrics (Milestone 4)
  const investigationEfficiency = calculateInvestigationEfficiency(playerState, caseData);
  const prematureClosureScore = calculatePrematureClosureScore(playerState, caseData);
  const contradictionScore = calculateContradictionScore(
    playerState as EnhancedPlayerState,
    caseData as CaseDataWithContradictions
  );
  const tierDiscoveryScore = calculateTierDiscoveryScore(
    playerState as EnhancedPlayerState,
    caseData
  );

  return {
    correctHypothesisSelected,
    initialProbabilityOnCorrect,
    finalProbabilityOnCorrect,
    confirmationBiasScore,
    mostInvestigatedHypothesis,
    foundCriticalEvidence: foundCriticalIds.length === criticalIds.length,
    missedCriticalEvidence,
    investigationBreakdown,
    // Enhanced metrics
    investigationEfficiency,
    prematureClosureScore,
    contradictionScore,
    tierDiscoveryScore,
  };
}

/**
 * Calculate Investigation Efficiency Score (0-100).
 *
 * Measures how efficiently the player collected evidence relative to IP spent.
 * Formula: (evidence collected / total available evidence) * 100
 * Adjusted by how much IP was used.
 *
 * Edge cases:
 * - No evidence actions available: returns 100 (nothing to collect)
 * - No evidence collected: returns 0
 *
 * @param playerState - Current player state
 * @param caseData - Case data with investigation actions
 * @returns Efficiency score (0-100)
 */
export function calculateInvestigationEfficiency(
  playerState: PlayerState,
  caseData: CaseData
): number {
  const totalActions = caseData.investigationActions.length;

  // Edge case: no actions available
  if (totalActions === 0) {
    return 100;
  }

  const collectedCount = playerState.collectedEvidenceIds.length;

  // Edge case: no evidence collected
  if (collectedCount === 0) {
    return 0;
  }

  // Calculate total IP cost of collected evidence
  const ipSpent = caseData.investigationActions
    .filter(a => playerState.collectedEvidenceIds.includes(a.id))
    .reduce((sum, a) => sum + a.cost, 0);

  // Edge case: avoid division by zero
  if (ipSpent === 0) {
    return 100; // Got evidence for free (shouldn't happen normally)
  }

  // Efficiency = evidence per IP point, scaled to 0-100
  // Higher efficiency = more evidence per IP spent
  const averageIpPerAction = totalActions > 0
    ? caseData.investigationActions.reduce((sum, a) => sum + a.cost, 0) / totalActions
    : 1;

  const playerIpPerAction = ipSpent / collectedCount;

  // If player's IP per action is less than average, they're efficient
  // Score = 100 * (averageIpPerAction / playerIpPerAction), capped at 100
  const efficiency = Math.min(100, Math.round((averageIpPerAction / playerIpPerAction) * 100));

  return efficiency;
}

/**
 * Calculate Premature Closure Score (0-100).
 *
 * Penalizes players who stopped investigating too early.
 * Higher score = better (used more of available IP).
 *
 * Formula: ((initialIP - remainingIP) / initialIP) * 100
 *
 * Edge cases:
 * - Initial IP is 0: returns 100 (nothing to spend)
 * - All IP spent: returns 100
 *
 * @param playerState - Current player state
 * @param caseData - Case data with briefing info
 * @returns Premature closure score (0-100), higher is better
 */
export function calculatePrematureClosureScore(
  playerState: PlayerState,
  caseData: CaseData
): number {
  const initialIp = caseData.briefing.investigationPoints;

  // Edge case: no IP to spend
  if (initialIp === 0) {
    return 100;
  }

  const ipSpent = initialIp - playerState.investigationPointsRemaining;
  const score = Math.round((ipSpent / initialIp) * 100);

  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate Contradiction Discovery Score (0-100).
 *
 * Measures what percentage of contradictions the player discovered.
 * Higher score = discovered more contradictions.
 *
 * Edge cases:
 * - No contradictions in case: returns 100 (nothing to discover)
 * - Player state doesn't have discoveredContradictions: returns 0
 *
 * @param playerState - Enhanced player state with contradiction tracking
 * @param caseData - Case data with contradictions
 * @returns Contradiction score (0-100)
 */
export function calculateContradictionScore(
  playerState: EnhancedPlayerState,
  caseData: CaseDataWithContradictions
): number {
  const contradictions = caseData.contradictions ?? [];
  const totalContradictions = contradictions.length;

  // Edge case: no contradictions to discover
  if (totalContradictions === 0) {
    return 100;
  }

  // Edge case: player state doesn't track contradictions (backward compatibility)
  if (!playerState.discoveredContradictions) {
    return 0;
  }

  const discoveredCount = playerState.discoveredContradictions.length;
  const score = Math.round((discoveredCount / totalContradictions) * 100);

  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate Tier Discovery Score (0-100).
 *
 * Measures what percentage of Tier 2 hypotheses the player unlocked.
 * Higher score = unlocked more hidden hypotheses.
 *
 * Edge cases:
 * - No Tier 2 hypotheses in case: returns 100 (nothing to unlock)
 * - Player state doesn't have unlockedHypotheses: returns 0
 *
 * @param playerState - Enhanced player state with unlock tracking
 * @param caseData - Case data with hypotheses
 * @returns Tier discovery score (0-100)
 */
export function calculateTierDiscoveryScore(
  playerState: EnhancedPlayerState,
  caseData: CaseData
): number {
  // Cast to ConditionalHypothesis to check tier
  const hypotheses = caseData.hypotheses as unknown as ConditionalHypothesis[];

  // Count Tier 2 hypotheses
  const tier2Hypotheses = hypotheses.filter(h => h.tier === 2);
  const totalTier2 = tier2Hypotheses.length;

  // Edge case: no Tier 2 hypotheses
  if (totalTier2 === 0) {
    return 100;
  }

  // Edge case: player state doesn't track unlocks (backward compatibility)
  if (!playerState.unlockedHypotheses) {
    return 0;
  }

  // Count how many Tier 2 hypotheses were unlocked
  const unlockedTier2Count = tier2Hypotheses.filter(
    h => playerState.unlockedHypotheses.includes(h.id)
  ).length;

  const score = Math.round((unlockedTier2Count / totalTier2) * 100);

  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate confirmation bias metrics.
 * Internal helper function.
 */
function calculateConfirmationBias(
  playerState: PlayerState,
  caseData: CaseData
): {
  confirmationBiasScore: number;
  mostInvestigatedHypothesis: string;
  investigationBreakdown: PlayerScores['investigationBreakdown'];
} {
  // Find which hypothesis the player seemed to favor initially (highest initial probability)
  let topHypothesisId = '';
  let topProbability = 0;

  for (const [hypId, prob] of Object.entries(playerState.initialProbabilities)) {
    if (prob > topProbability) {
      topProbability = prob;
      topHypothesisId = hypId;
    }
  }

  if (!topHypothesisId || playerState.collectedEvidenceIds.length === 0) {
    return {
      confirmationBiasScore: 0,
      mostInvestigatedHypothesis: 'N/A',
      investigationBreakdown: [],
    };
  }

  // Count actions per hypothesis
  const hypothesisActionCounts: Record<string, number> = {};

  for (const actionId of playerState.collectedEvidenceIds) {
    const action = caseData.investigationActions.find(a => a.id === actionId);
    if (!action) continue;

    for (const impact of action.hypothesisImpact) {
      if (!hypothesisActionCounts[impact.hypothesisId]) {
        hypothesisActionCounts[impact.hypothesisId] = 0;
      }
      hypothesisActionCounts[impact.hypothesisId]++;
    }
  }

  // Calculate actions for top hypothesis
  const actionsForTop = hypothesisActionCounts[topHypothesisId] || 0;
  const totalActions = playerState.collectedEvidenceIds.length;

  // Confirmation bias score
  const confirmationBiasScore = totalActions > 0
    ? Math.round((actionsForTop / totalActions) * 100)
    : 0;

  // Get the name of the most investigated hypothesis
  const topHypothesis = caseData.hypotheses.find(h => h.id === topHypothesisId);
  const mostInvestigatedHypothesis = topHypothesis?.label ?? 'Unknown';

  // Build investigation breakdown
  const investigationBreakdown = caseData.hypotheses
    .filter(h => playerState.selectedHypotheses.includes(h.id))
    .map(h => ({
      hypothesisId: h.id,
      hypothesisLabel: h.label,
      actionsCount: hypothesisActionCounts[h.id] || 0,
      percentage: totalActions > 0
        ? Math.round(((hypothesisActionCounts[h.id] || 0) / totalActions) * 100)
        : 0,
    }))
    .sort((a, b) => b.actionsCount - a.actionsCount);

  return { confirmationBiasScore, mostInvestigatedHypothesis, investigationBreakdown };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Check if probabilities sum to approximately 100.
 */
export function probabilitiesAreValid(probabilities: Record<string, number>): boolean {
  const sum = Object.values(probabilities).reduce((a, b) => a + b, 0);
  return sum >= 99 && sum <= 101;
}

/**
 * Get interpretation of confirmation bias score.
 */
export function getConfirmationBiasInterpretation(score: number): {
  level: 'low' | 'medium' | 'high';
  message: string;
} {
  if (score <= 40) {
    return {
      level: 'low',
      message: 'Well-diversified investigation! You spread your effort across multiple theories.',
    };
  } else if (score <= 65) {
    return {
      level: 'medium',
      message: 'Some focus on your leading theory, but you explored alternatives too.',
    };
  } else {
    return {
      level: 'high',
      message: 'High confirmation bias detected. You focused heavily on your favorite theory.',
    };
  }
}

/**
 * Get interpretation of a generic metric score.
 */
export function getMetricInterpretation(score: number): {
  level: 'low' | 'medium' | 'high';
  color: 'red' | 'amber' | 'green';
} {
  if (score <= 40) {
    return { level: 'low', color: 'red' };
  } else if (score <= 70) {
    return { level: 'medium', color: 'amber' };
  } else {
    return { level: 'high', color: 'green' };
  }
}
