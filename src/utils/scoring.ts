import { PlayerState, CaseData, PlayerScores } from '../types/game';

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

  return {
    correctHypothesisSelected,
    initialProbabilityOnCorrect,
    finalProbabilityOnCorrect,
    confirmationBiasScore,
    mostInvestigatedHypothesis,
    foundCriticalEvidence: foundCriticalIds.length === criticalIds.length,
    missedCriticalEvidence,
    investigationBreakdown,
  };
}

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

// Helper: Check if probabilities sum to approximately 100
export function probabilitiesAreValid(probabilities: Record<string, number>): boolean {
  const sum = Object.values(probabilities).reduce((a, b) => a + b, 0);
  return sum >= 99 && sum <= 101;
}

// Helper: Get confirmation bias interpretation
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
