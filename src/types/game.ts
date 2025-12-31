// ============================================
// CASE DATA TYPES (static, from mission1.ts)
// ============================================

export interface CaseData {
  id: string;
  title: string;
  subtitle: string;
  briefing: BriefingData;
  hypotheses: HypothesisData[];
  investigationActions: InvestigationAction[];
  resolution: ResolutionData;
  biasLessons: BiasLesson[];
}

export interface BriefingData {
  date: string;
  location: string;
  victim: string;
  status: string;
  summary: string;
  healerReport: string;
  initialWitness: {
    name: string;
    statement: string;
  };
  personsOfInterest: PersonOfInterest[];
  mentorIntro: string;
  investigationPoints: number;
}

export interface PersonOfInterest {
  id: string;
  name: string;
  description: string;
}

export interface HypothesisData {
  id: string;
  label: string;
  description: string;
  isCorrect: boolean;
  isAlwaysAvailable?: boolean;
}

export interface InvestigationAction {
  id: string;
  title: string;
  description: string;
  cost: number;
  category: 'location' | 'witness' | 'records';
  evidence: EvidenceData;
  hypothesisImpact: {
    hypothesisId: string;
    impact: 'supports' | 'weakens' | 'neutral';
    weight: number;
  }[];
}

export interface EvidenceData {
  title: string;
  content: string;
  interpretation: string;
  isCritical?: boolean;
}

export interface ResolutionData {
  truthSummary: string;
  culprit: string;
  correctHypothesisId: string;
  explanationOfDifficulty: string;
}

export interface BiasLesson {
  biasName: string;
  explanation: string;
  howItApplied: string;
  counterTechnique: string;
  realWorldExample: string;
}

// ============================================
// PLAYER STATE TYPES (dynamic, in context)
// ============================================

export type GamePhase =
  | 'briefing'
  | 'hypothesis'
  | 'investigation'
  | 'prediction'
  | 'resolution'
  | 'review';

export interface PlayerState {
  currentPhase: GamePhase;

  // Phase 2: Hypothesis Formation
  selectedHypotheses: string[];
  initialProbabilities: Record<string, number>;

  // Phase 3: Investigation
  investigationPointsRemaining: number;
  collectedEvidenceIds: string[];

  // Phase 4: Prediction
  finalProbabilities: Record<string, number>;
  confidenceLevel: number;

  // Computed after resolution (for display in review)
  scores: PlayerScores | null;
}

export interface PlayerScores {
  correctHypothesisSelected: boolean;
  initialProbabilityOnCorrect: number;
  finalProbabilityOnCorrect: number;
  confirmationBiasScore: number;
  mostInvestigatedHypothesis: string;
  foundCriticalEvidence: boolean;
  missedCriticalEvidence: string[];
  investigationBreakdown: {
    hypothesisId: string;
    hypothesisLabel: string;
    actionsCount: number;
    percentage: number;
  }[];
}

// ============================================
// ACTION TYPES (for reducer)
// ============================================

export type GameAction =
  | { type: 'START_GAME'; investigationPoints: number }
  | { type: 'ADVANCE_PHASE' }
  | { type: 'GO_TO_PHASE'; phase: GamePhase }
  | { type: 'SELECT_HYPOTHESIS'; hypothesisId: string }
  | { type: 'DESELECT_HYPOTHESIS'; hypothesisId: string }
  | { type: 'SET_INITIAL_PROBABILITY'; hypothesisId: string; value: number }
  | { type: 'COLLECT_EVIDENCE'; actionId: string; cost: number }
  | { type: 'SET_FINAL_PROBABILITY'; hypothesisId: string; value: number }
  | { type: 'SET_CONFIDENCE'; level: number }
  | { type: 'CALCULATE_SCORES'; caseData: CaseData }
  | { type: 'RESET_GAME' };
