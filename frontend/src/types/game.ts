import type { UnlockTrigger, Contradiction } from './enhanced';

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
  contradictions?: readonly Contradiction[];
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
  readonly currentPhase: GamePhase;

  // Phase 2: Hypothesis Formation
  readonly selectedHypotheses: readonly string[];
  readonly initialProbabilities: Readonly<Record<string, number>>;

  // Phase 3: Investigation
  readonly investigationPointsRemaining: number;
  readonly collectedEvidenceIds: readonly string[];

  // Phase 4: Prediction
  readonly finalProbabilities: Readonly<Record<string, number>>;
  readonly confidenceLevel: number;

  // Computed after resolution (for display in review)
  readonly scores: PlayerScores | null;
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

  // ============================================
  // Enhanced Scoring Metrics (Milestone 4)
  // ============================================

  /**
   * Investigation Efficiency Score (0-100)
   * Measures how efficiently the player used their Investigation Points.
   * Higher score = collected more evidence per IP spent.
   */
  investigationEfficiency: number;

  /**
   * Premature Closure Score (0-100)
   * Penalizes players who stopped investigating too early.
   * Higher score = better (used more of available IP).
   */
  prematureClosureScore: number;

  /**
   * Contradiction Discovery Score (0-100)
   * Measures what percentage of contradictions the player discovered.
   * Higher score = discovered more contradictions.
   */
  contradictionScore: number;

  /**
   * Tier Discovery Score (0-100)
   * Measures what percentage of Tier 2 hypotheses the player unlocked.
   * Higher score = unlocked more hidden hypotheses.
   */
  tierDiscoveryScore: number;
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
  | { type: 'RESET_GAME' }
  | { type: 'UNLOCK_HYPOTHESIS'; hypothesisId: string; trigger: UnlockTrigger }
  | { type: 'ACKNOWLEDGE_UNLOCK'; eventId: string }
  // Contradiction actions (Milestone 3)
  | { type: 'DISCOVER_CONTRADICTION'; contradictionId: string }
  | { type: 'RESOLVE_CONTRADICTION'; contradictionId: string; resolution: string }
  // Active hypothesis selection actions (Milestone 7)
  | {
      /** Set active hypothesis for investigation focus */
      type: 'SET_ACTIVE_HYPOTHESIS';
      hypothesisId: string;
    }
  | {
      /** Clear active hypothesis, return to exploratory mode */
      type: 'CLEAR_ACTIVE_HYPOTHESIS';
    };
