/**
 * Type Fixtures for Enhanced Type System
 *
 * Example data demonstrating correct usage of all enhanced types.
 * Used for testing, documentation, and development reference.
 *
 * @module types/enhanced.fixtures
 * @since Milestone 1
 * @see enhanced.ts for type definitions
 */

import type {
  ConditionalHypothesis,
  Contradiction,
  UnlockEvent,
  EnhancedPlayerState,
  UnlockRequirement,
  UnlockTrigger,
} from './enhanced';

// ============================================
// UNLOCK REQUIREMENT FIXTURES
// ============================================

/**
 * Simple evidence-based unlock requirement.
 * Hypothesis unlocks when player collects specific evidence.
 */
export const evidenceRequirement: UnlockRequirement = {
  type: 'evidence_collected',
  evidenceId: 'e5',
};

/**
 * Threshold-based unlock requirement.
 * Hypothesis unlocks when player spends enough investigation points.
 */
export const thresholdRequirement: UnlockRequirement = {
  type: 'threshold_met',
  metric: 'ipSpent',
  threshold: 6,
};

/**
 * Composite requirement: ALL conditions must be met.
 * Hypothesis unlocks when player collects evidence AND reaches threshold.
 */
export const allOfRequirement: UnlockRequirement = {
  type: 'all_of',
  requirements: [
    { type: 'evidence_collected', evidenceId: 'e3' },
    { type: 'evidence_collected', evidenceId: 'e7' },
  ],
};

/**
 * Composite requirement: ANY condition can unlock.
 * Hypothesis unlocks via multiple possible paths.
 */
export const anyOfRequirement: UnlockRequirement = {
  type: 'any_of',
  requirements: [
    { type: 'evidence_collected', evidenceId: 'e5' },
    { type: 'threshold_met', metric: 'evidenceCount', threshold: 5 },
  ],
};

// ============================================
// UNLOCK TRIGGER FIXTURES
// ============================================

/**
 * Trigger: Hypothesis unlocked by collecting evidence.
 */
export const evidenceTrigger: UnlockTrigger = {
  type: 'evidence_collected',
  evidenceId: 'e5',
};

/**
 * Trigger: Hypothesis unlocked by reaching threshold.
 */
export const thresholdTrigger: UnlockTrigger = {
  type: 'threshold_met',
  metric: 'evidenceCount',
  value: 5,
};

/**
 * Trigger: Manual unlock for debugging/testing.
 */
export const manualTrigger: UnlockTrigger = {
  type: 'manual_unlock',
};

// ============================================
// CONDITIONAL HYPOTHESIS FIXTURES
// ============================================

/**
 * Tier 1 hypothesis: Always available from start.
 * No unlock requirements needed.
 */
export const tier1Hypothesis: ConditionalHypothesis = {
  id: 'h1',
  label: 'The witness lied about the timing',
  description: 'Marcus Blackwood fabricated his alibi to cover his involvement.',
  isCorrect: false,
  tier: 1,
};

/**
 * Tier 1 hypothesis: Another always-available option.
 */
export const tier1HypothesisCorrect: ConditionalHypothesis = {
  id: 'h2',
  label: 'It was an accident',
  description: 'The victim was injured through accidental magical discharge.',
  isCorrect: true,
  tier: 1,
};

/**
 * Tier 2 hypothesis: Simple unlock (single evidence).
 * Unlocks when player collects evidence e5.
 */
export const tier2SimpleHypothesis: ConditionalHypothesis = {
  id: 'h3',
  label: 'Conspiracy between witnesses',
  description: 'Multiple witnesses coordinated their stories to mislead investigators.',
  isCorrect: false,
  tier: 2,
  unlockRequirements: [
    { type: 'evidence_collected', evidenceId: 'e5' },
  ],
};

/**
 * Tier 2 hypothesis: Complex unlock (multiple conditions).
 * Unlocks when player collects specific evidence AND spends enough IP.
 */
export const tier2ComplexHypothesis: ConditionalHypothesis = {
  id: 'h4',
  label: 'Memory charm was used',
  description: 'The victim had their memory modified before the incident.',
  isCorrect: true,
  tier: 2,
  unlockRequirements: [
    {
      type: 'all_of',
      requirements: [
        { type: 'evidence_collected', evidenceId: 'e7' },
        { type: 'threshold_met', metric: 'ipSpent', threshold: 4 },
      ],
    },
  ],
};

/**
 * Tier 2 hypothesis: Multiple unlock paths.
 * Can be unlocked by either collecting evidence OR reaching evidence threshold.
 */
export const tier2MultiPathHypothesis: ConditionalHypothesis = {
  id: 'h5',
  label: 'Third party involvement',
  description: 'Someone outside the immediate circle orchestrated the incident.',
  isCorrect: false,
  tier: 2,
  unlockRequirements: [
    {
      type: 'any_of',
      requirements: [
        { type: 'evidence_collected', evidenceId: 'e9' },
        { type: 'threshold_met', metric: 'evidenceCount', threshold: 6 },
      ],
    },
  ],
};

// ============================================
// CONTRADICTION FIXTURES
// ============================================

/**
 * Contradiction: Not yet discovered by player.
 * Player has not collected both pieces of conflicting evidence.
 */
export const undiscoveredContradiction: Contradiction = {
  id: 'c1',
  evidenceId1: 'e3',
  evidenceId2: 'e7',
  description: 'Witness A claims suspect was at the tavern, but tavern records show no entry.',
  isResolved: false,
};

/**
 * Contradiction: Discovered but not resolved.
 * Player has collected both pieces and can see the conflict.
 */
export const discoveredContradiction: Contradiction = {
  id: 'c2',
  evidenceId1: 'e4',
  evidenceId2: 'e8',
  description: 'The wand analysis shows no recent spells, but magical residue was found at scene.',
  isResolved: false,
  discoveredAt: new Date('2025-01-15T10:30:00Z'),
};

/**
 * Contradiction: Fully resolved.
 * Player has acknowledged the explanation of the conflict.
 */
export const resolvedContradiction: Contradiction = {
  id: 'c3',
  evidenceId1: 'e2',
  evidenceId2: 'e6',
  description: 'Time of incident conflicts between healer report and witness statement.',
  resolution: 'The witness was confused about the time due to a Confundus charm effect.',
  isResolved: true,
  discoveredAt: new Date('2025-01-15T09:15:00Z'),
};

// ============================================
// UNLOCK EVENT FIXTURES
// ============================================

/**
 * Unlock event: Pending notification.
 * Player has not yet acknowledged this unlock.
 */
export const pendingUnlockEvent: UnlockEvent = {
  id: 'evt-001',
  hypothesisId: 'h3',
  trigger: {
    type: 'evidence_collected',
    evidenceId: 'e5',
  },
  timestamp: new Date('2025-01-15T10:45:00Z'),
  acknowledged: false,
};

/**
 * Unlock event: Acknowledged.
 * Player has seen and dismissed the notification.
 */
export const acknowledgedUnlockEvent: UnlockEvent = {
  id: 'evt-002',
  hypothesisId: 'h4',
  trigger: {
    type: 'threshold_met',
    metric: 'ipSpent',
    value: 6,
  },
  timestamp: new Date('2025-01-15T11:00:00Z'),
  acknowledged: true,
};

/**
 * Unlock event: Manual unlock (debug mode).
 */
export const debugUnlockEvent: UnlockEvent = {
  id: 'evt-debug-001',
  hypothesisId: 'h5',
  trigger: {
    type: 'manual_unlock',
  },
  timestamp: new Date('2025-01-15T12:00:00Z'),
  acknowledged: true,
};

// ============================================
// ENHANCED PLAYER STATE FIXTURES
// ============================================

/**
 * Initial enhanced state: Game just started.
 * All enhanced tracking fields are empty.
 */
export const initialEnhancedState: EnhancedPlayerState = {
  // Base PlayerState fields
  currentPhase: 'briefing',
  selectedHypotheses: [],
  initialProbabilities: {},
  investigationPointsRemaining: 12,
  collectedEvidenceIds: [],
  finalProbabilities: {},
  confidenceLevel: 3,
  scores: null,

  // Enhanced fields (all start empty)
  unlockedHypotheses: [],
  unlockHistory: [],
  discoveredContradictions: [],
  resolvedContradictions: [],
  pendingUnlockNotifications: [],
};

/**
 * Mid-game enhanced state: Player is investigating.
 * Some hypotheses unlocked, some contradictions found.
 */
export const midGameEnhancedState: EnhancedPlayerState = {
  // Base PlayerState fields
  currentPhase: 'investigation',
  selectedHypotheses: ['h1', 'h2'],
  initialProbabilities: { h1: 40, h2: 60 },
  investigationPointsRemaining: 6,
  collectedEvidenceIds: ['e1', 'e2', 'e5'],
  finalProbabilities: {},
  confidenceLevel: 3,
  scores: null,

  // Enhanced fields with progress
  unlockedHypotheses: ['h3'],
  unlockHistory: [
    {
      id: 'evt-001',
      hypothesisId: 'h3',
      trigger: { type: 'evidence_collected', evidenceId: 'e5' },
      timestamp: new Date('2025-01-15T10:45:00Z'),
      acknowledged: true,
    },
  ],
  discoveredContradictions: ['c1'],
  resolvedContradictions: [],
  pendingUnlockNotifications: [],
};

/**
 * Late-game enhanced state: Near resolution.
 * Multiple unlocks, contradictions discovered and some resolved.
 */
export const lateGameEnhancedState: EnhancedPlayerState = {
  // Base PlayerState fields
  currentPhase: 'prediction',
  selectedHypotheses: ['h1', 'h2', 'h3', 'h4'],
  initialProbabilities: { h1: 25, h2: 25, h3: 25, h4: 25 },
  investigationPointsRemaining: 2,
  collectedEvidenceIds: ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7'],
  finalProbabilities: { h1: 10, h2: 15, h3: 5, h4: 70 },
  confidenceLevel: 4,
  scores: null,

  // Enhanced fields with significant progress
  unlockedHypotheses: ['h3', 'h4'],
  unlockHistory: [
    {
      id: 'evt-001',
      hypothesisId: 'h3',
      trigger: { type: 'evidence_collected', evidenceId: 'e5' },
      timestamp: new Date('2025-01-15T10:45:00Z'),
      acknowledged: true,
    },
    {
      id: 'evt-002',
      hypothesisId: 'h4',
      trigger: { type: 'threshold_met', metric: 'ipSpent', value: 6 },
      timestamp: new Date('2025-01-15T11:30:00Z'),
      acknowledged: true,
    },
  ],
  discoveredContradictions: ['c1', 'c2', 'c3'],
  resolvedContradictions: ['c3'],
  pendingUnlockNotifications: [],
};

/**
 * State with pending notification: Player just triggered unlock.
 * Used to test notification UI flow.
 */
export const stateWithPendingNotification: EnhancedPlayerState = {
  // Base PlayerState fields
  currentPhase: 'investigation',
  selectedHypotheses: ['h1', 'h2'],
  initialProbabilities: { h1: 50, h2: 50 },
  investigationPointsRemaining: 5,
  collectedEvidenceIds: ['e1', 'e5'],
  finalProbabilities: {},
  confidenceLevel: 3,
  scores: null,

  // Enhanced fields with pending notification
  unlockedHypotheses: ['h3'],
  unlockHistory: [
    {
      id: 'evt-new',
      hypothesisId: 'h3',
      trigger: { type: 'evidence_collected', evidenceId: 'e5' },
      timestamp: new Date(),
      acknowledged: false,
    },
  ],
  discoveredContradictions: [],
  resolvedContradictions: [],
  pendingUnlockNotifications: ['evt-new'],
};
