/**
 * Enhanced Type System for Auror Academy: Case Files
 *
 * This module extends the core game.ts types to support advanced mechanics:
 * - Conditional hypothesis unlocking (Tier 1 = always available, Tier 2 = unlockable)
 * - Evidence contradiction tracking and resolution
 * - Unlock event notifications for UI feedback
 * - Extended player state for progression tracking
 *
 * @module types/enhanced
 * @since Milestone 1
 * @see game.ts for base type definitions
 */

import type { HypothesisData, PlayerState } from './game';

// ============================================
// DISCRIMINATED UNION TYPES
// ============================================

/**
 * Specifies conditions that must be met to unlock a Tier 2 hypothesis.
 *
 * Uses discriminated union pattern: the `type` field determines
 * which additional fields are present, enabling type-safe narrowing.
 *
 * @example Evidence Collection Requirement
 * ```typescript
 * const requirement: UnlockRequirement = {
 *   type: 'evidence_collected',
 *   evidenceId: 'e5'
 * };
 * ```
 *
 * @example Threshold Requirement
 * ```typescript
 * const requirement: UnlockRequirement = {
 *   type: 'threshold_met',
 *   metric: 'evidenceCount',
 *   threshold: 3
 * };
 * ```
 *
 * @example Composite Requirements (ALL must be met)
 * ```typescript
 * const requirement: UnlockRequirement = {
 *   type: 'all_of',
 *   requirements: [
 *     { type: 'evidence_collected', evidenceId: 'e1' },
 *     { type: 'evidence_collected', evidenceId: 'e2' }
 *   ]
 * };
 * ```
 *
 * @example Composite Requirements (ANY can unlock)
 * ```typescript
 * const requirement: UnlockRequirement = {
 *   type: 'any_of',
 *   requirements: [
 *     { type: 'evidence_collected', evidenceId: 'e3' },
 *     { type: 'threshold_met', metric: 'ipSpent', threshold: 6 }
 *   ]
 * };
 * ```
 */
export type UnlockRequirement =
  | {
      /** Unlock when specific evidence is collected */
      readonly type: 'evidence_collected';
      /** The ID of the evidence that triggers unlock */
      readonly evidenceId: string;
    }
  | {
      /** Unlock when a game metric reaches a threshold */
      readonly type: 'threshold_met';
      /** The metric to track */
      readonly metric: 'investigationProgress' | 'evidenceCount' | 'ipSpent';
      /** The value that must be reached */
      readonly threshold: number;
    }
  | {
      /** Unlock when ALL nested requirements are met */
      readonly type: 'all_of';
      /** All requirements in this array must be satisfied */
      readonly requirements: readonly UnlockRequirement[];
    }
  | {
      /** Unlock when ANY nested requirement is met */
      readonly type: 'any_of';
      /** At least one requirement in this array must be satisfied */
      readonly requirements: readonly UnlockRequirement[];
    };

/**
 * Specifies what caused a Tier 2 hypothesis to unlock.
 *
 * Uses discriminated union pattern: the `type` field determines
 * which additional fields are present, enabling type-safe narrowing.
 *
 * @example Type Narrowing in Switch
 * ```typescript
 * function describeUnlock(trigger: UnlockTrigger): string {
 *   switch (trigger.type) {
 *     case 'evidence_collected':
 *       // TypeScript knows trigger.evidenceId exists here
 *       return `Unlocked by collecting evidence ${trigger.evidenceId}`;
 *
 *     case 'threshold_met':
 *       // TypeScript knows trigger.metric and trigger.value exist
 *       return `Unlocked when ${trigger.metric} reached ${trigger.value}`;
 *
 *     case 'manual_unlock':
 *       // TypeScript knows no additional fields
 *       return 'Manually unlocked (debug mode)';
 *   }
 * }
 * ```
 */
export type UnlockTrigger =
  | {
      /** Triggered when evidence was collected */
      readonly type: 'evidence_collected';
      /** The ID of the evidence that triggered the unlock */
      readonly evidenceId: string;
    }
  | {
      /** Triggered when a threshold was reached */
      readonly type: 'threshold_met';
      /** The metric that was tracked */
      readonly metric: 'investigationProgress' | 'evidenceCount' | 'ipSpent';
      /** The value that was reached */
      readonly value: number;
    }
  | {
      /** Triggered manually (for debugging/testing only) */
      readonly type: 'manual_unlock';
    };

// ============================================
// CONDITIONAL HYPOTHESIS INTERFACE
// ============================================

/**
 * Hypothesis that can be locked or unlocked based on investigation progress.
 *
 * Tier 1 hypotheses are always available from the start of the investigation.
 * Tier 2 hypotheses unlock when specific requirements are met, creating
 * "aha!" moments when players discover new investigation paths.
 *
 * @extends HypothesisData from './game'
 *
 * @property tier - Hypothesis accessibility level (1=always available, 2=conditional)
 * @property unlockRequirements - Conditions to unlock (only for Tier 2)
 *
 * @example Tier 1 Hypothesis (Always Available)
 * ```typescript
 * const basicHypothesis: ConditionalHypothesis = {
 *   id: "h1",
 *   label: "The witness lied",
 *   description: "Initial testimony was fabricated",
 *   isCorrect: false,
 *   tier: 1
 *   // No unlockRequirements needed for tier 1
 * };
 * ```
 *
 * @example Tier 2 Hypothesis (Simple Unlock)
 * ```typescript
 * const advancedHypothesis: ConditionalHypothesis = {
 *   id: "h3",
 *   label: "Complex conspiracy theory",
 *   description: "Only makes sense after finding key evidence",
 *   isCorrect: true,
 *   tier: 2,
 *   unlockRequirements: [
 *     { type: 'evidence_collected', evidenceId: 'e5' }
 *   ]
 * };
 * ```
 *
 * @example Tier 2 Hypothesis (Complex Unlock)
 * ```typescript
 * const complexHypothesis: ConditionalHypothesis = {
 *   id: "h4",
 *   label: "Elaborate scheme",
 *   description: "Requires multiple pieces of evidence to consider",
 *   isCorrect: false,
 *   tier: 2,
 *   unlockRequirements: [
 *     {
 *       type: 'all_of',
 *       requirements: [
 *         { type: 'evidence_collected', evidenceId: 'e5' },
 *         { type: 'threshold_met', metric: 'ipSpent', threshold: 6 }
 *       ]
 *     }
 *   ]
 * };
 * ```
 *
 * @see UnlockRequirement for requirement specification
 * @see EnhancedPlayerState for tracking unlock status
 */
export interface ConditionalHypothesis extends HypothesisData {
  /**
   * Tier level determines accessibility:
   * - 1: Always available from the start
   * - 2: Must be unlocked through investigation
   */
  readonly tier: 1 | 2;

  /**
   * Conditions that must be met to unlock this hypothesis.
   * Only applicable for Tier 2 hypotheses.
   * Tier 1 hypotheses should not have this field.
   */
  readonly unlockRequirements?: readonly UnlockRequirement[];
}

// ============================================
// CONTRADICTION INTERFACE
// ============================================

/**
 * Represents a conflict between two pieces of evidence.
 *
 * Contradictions teach players about conflicting information and
 * critical thinking. Players must collect both pieces of evidence
 * to discover the contradiction, then reason about which is accurate.
 *
 * Lifecycle:
 * 1. Created when system detects conflicting evidence in case data
 * 2. discoveredAt set when player collects both evidence pieces
 * 3. Player must reason about the conflict
 * 4. isResolved becomes true when player acknowledges resolution
 * 5. resolution stores the explanation of the truth
 *
 * @property id - Unique identifier for this contradiction (e.g., "c1")
 * @property evidenceId1 - First conflicting evidence
 * @property evidenceId2 - Second conflicting evidence
 * @property description - Human-readable explanation of the conflict
 * @property resolution - Explanation of which evidence is accurate (optional)
 * @property isResolved - Whether player has resolved this contradiction
 * @property discoveredAt - When player found both pieces of evidence
 *
 * @example Unresolved Contradiction
 * ```typescript
 * const contradiction: Contradiction = {
 *   id: "c1",
 *   evidenceId1: "e3",
 *   evidenceId2: "e7",
 *   description: "Witness A says suspect was home, Witness B saw suspect leaving",
 *   isResolved: false
 * };
 * ```
 *
 * @example Discovered Contradiction
 * ```typescript
 * const discoveredContradiction: Contradiction = {
 *   id: "c1",
 *   evidenceId1: "e3",
 *   evidenceId2: "e7",
 *   description: "Witness A says suspect was home, Witness B saw suspect leaving",
 *   isResolved: false,
 *   discoveredAt: new Date('2025-01-15T10:30:00')
 * };
 * ```
 *
 * @example Resolved Contradiction
 * ```typescript
 * const resolved: Contradiction = {
 *   id: "c1",
 *   evidenceId1: "e3",
 *   evidenceId2: "e7",
 *   description: "Witness A says suspect was home, Witness B saw suspect leaving",
 *   resolution: "Witness A was mistaken about the time - they saw the suspect earlier",
 *   isResolved: true,
 *   discoveredAt: new Date('2025-01-15T10:30:00')
 * };
 * ```
 */
export interface Contradiction {
  /** Unique identifier for this contradiction */
  readonly id: string;

  /** ID of the first conflicting evidence */
  readonly evidenceId1: string;

  /** ID of the second conflicting evidence */
  readonly evidenceId2: string;

  /** Human-readable explanation of why these evidence pieces conflict */
  readonly description: string;

  /**
   * Explanation of which evidence is accurate and why.
   * Only set after the contradiction is resolved.
   */
  readonly resolution?: string;

  /** Whether the player has resolved this contradiction */
  readonly isResolved: boolean;

  /**
   * Timestamp when player collected both pieces of evidence,
   * making the contradiction discoverable.
   */
  readonly discoveredAt?: Date;
}

// ============================================
// UNLOCK EVENT INTERFACE
// ============================================

/**
 * Event fired when a Tier 2 hypothesis is unlocked.
 *
 * Used for UI notifications ("New hypothesis unlocked!") and
 * tracking unlock history for the case review phase.
 *
 * Lifecycle:
 * 1. Created when unlock requirements are met
 * 2. Added to EnhancedPlayerState.unlockHistory (permanent record)
 * 3. ID added to EnhancedPlayerState.pendingUnlockNotifications (temporary)
 * 4. UI shows notification to player
 * 5. Player acknowledges -> acknowledged = true
 * 6. ID removed from pendingUnlockNotifications
 *
 * @note Events are kept in unlockHistory for case review but should have
 * TTL in pendingUnlockNotifications to prevent memory leaks in long sessions.
 *
 * @property id - Unique event identifier (UUID recommended)
 * @property hypothesisId - The hypothesis that was unlocked
 * @property trigger - What caused the unlock
 * @property timestamp - When the unlock occurred
 * @property acknowledged - Whether player has seen the notification
 *
 * @example Evidence-Based Unlock Event
 * ```typescript
 * const unlockEvent: UnlockEvent = {
 *   id: "evt-1234",
 *   hypothesisId: "h3",
 *   trigger: {
 *     type: 'evidence_collected',
 *     evidenceId: 'e5'
 *   },
 *   timestamp: new Date(),
 *   acknowledged: false
 * };
 * ```
 *
 * @example Threshold-Based Unlock Event
 * ```typescript
 * const thresholdUnlock: UnlockEvent = {
 *   id: "evt-5678",
 *   hypothesisId: "h4",
 *   trigger: {
 *     type: 'threshold_met',
 *     metric: 'evidenceCount',
 *     value: 5
 *   },
 *   timestamp: new Date(),
 *   acknowledged: true
 * };
 * ```
 */
export interface UnlockEvent {
  /** Unique identifier for this event (UUID recommended) */
  readonly id: string;

  /** The ID of the hypothesis that was unlocked */
  readonly hypothesisId: string;

  /** What triggered this unlock */
  readonly trigger: UnlockTrigger;

  /** When this unlock occurred */
  readonly timestamp: Date;

  /** Whether the player has acknowledged/seen this notification */
  readonly acknowledged: boolean;
}

// ============================================
// HYPOTHESIS PIVOT TRACKING (Milestone 7)
// ============================================

/**
 * Hypothesis pivot tracking for investigation strategy analysis.
 * Records when player switches investigation focus between hypotheses.
 * Used in future Milestone 8 for confirmation bias detection.
 *
 * @property fromHypothesisId - Previous active hypothesis (null if first selection)
 * @property toHypothesisId - New active hypothesis
 * @property timestamp - When the pivot occurred
 *
 * @example First Hypothesis Selection
 * ```typescript
 * const firstPivot: HypothesisPivot = {
 *   fromHypothesisId: null,
 *   toHypothesisId: 'h1',
 *   timestamp: new Date()
 * };
 * ```
 *
 * @example Switching Focus
 * ```typescript
 * const switchPivot: HypothesisPivot = {
 *   fromHypothesisId: 'h1',
 *   toHypothesisId: 'h3',
 *   timestamp: new Date()
 * };
 * ```
 */
export interface HypothesisPivot {
  /** Previous active hypothesis (null if first selection) */
  readonly fromHypothesisId: string | null;

  /** New active hypothesis */
  readonly toHypothesisId: string;

  /** When the pivot occurred */
  readonly timestamp: Date;
}

// ============================================
// ENHANCED PLAYER STATE INTERFACE
// ============================================

/**
 * Extended PlayerState with hypothesis tier and contradiction tracking.
 *
 * Backward Compatible: Existing code using PlayerState continues working.
 * New fields support Milestones 2-7 enhanced mechanics.
 *
 * This interface adds tracking for:
 * - Which Tier 2 hypotheses have been unlocked
 * - History of all unlock events (for case review)
 * - Which contradictions have been discovered/resolved
 * - Pending UI notifications for unlocks
 * - Active hypothesis selection for investigation focus (Milestone 7)
 * - Hypothesis pivot history for strategic analysis (Milestone 7)
 *
 * @extends PlayerState from './game'
 *
 * @property unlockedHypotheses - IDs of Tier 2 hypotheses the player has unlocked
 * @property unlockHistory - Complete timeline of unlock events
 * @property discoveredContradictions - IDs of contradictions the player has found
 * @property resolvedContradictions - IDs of contradictions the player has resolved
 * @property pendingUnlockNotifications - IDs of UnlockEvents awaiting acknowledgment
 * @property activeHypothesisId - Currently active hypothesis for investigation focus
 * @property hypothesisPivots - History of hypothesis pivots during investigation
 *
 * @example Initial Enhanced State
 * ```typescript
 * const initialEnhancedState: EnhancedPlayerState = {
 *   // Base PlayerState fields
 *   currentPhase: 'briefing',
 *   selectedHypotheses: [],
 *   initialProbabilities: {},
 *   investigationPointsRemaining: 12,
 *   collectedEvidenceIds: [],
 *   finalProbabilities: {},
 *   confidenceLevel: 3,
 *   scores: null,
 *
 *   // Enhanced fields (all start empty)
 *   unlockedHypotheses: [],
 *   unlockHistory: [],
 *   discoveredContradictions: [],
 *   resolvedContradictions: [],
 *   pendingUnlockNotifications: []
 * };
 * ```
 *
 * @example State After Progress
 * ```typescript
 * const progressState: EnhancedPlayerState = {
 *   currentPhase: 'investigation',
 *   selectedHypotheses: ['h1', 'h2'],
 *   initialProbabilities: { h1: 40, h2: 60 },
 *   investigationPointsRemaining: 6,
 *   collectedEvidenceIds: ['e1', 'e2', 'e5'],
 *   finalProbabilities: {},
 *   confidenceLevel: 3,
 *   scores: null,
 *
 *   // Player unlocked h3 by collecting e5
 *   unlockedHypotheses: ['h3'],
 *   unlockHistory: [{
 *     id: 'evt-1',
 *     hypothesisId: 'h3',
 *     trigger: { type: 'evidence_collected', evidenceId: 'e5' },
 *     timestamp: new Date(),
 *     acknowledged: true
 *   }],
 *   discoveredContradictions: ['c1'],
 *   resolvedContradictions: [],
 *   pendingUnlockNotifications: []
 * };
 * ```
 *
 * @see PlayerState for base state fields
 * @see UnlockEvent for unlock event structure
 * @see Contradiction for contradiction tracking
 */
export interface EnhancedPlayerState extends PlayerState {
  // ============================================
  // Hypothesis Tier Tracking
  // ============================================

  /**
   * IDs of Tier 2 hypotheses that the player has unlocked.
   * Initially empty; populated as player meets unlock requirements.
   */
  readonly unlockedHypotheses: readonly string[];

  /**
   * Complete timeline of all unlock events.
   * Preserved for case review phase to show investigation journey.
   */
  readonly unlockHistory: readonly UnlockEvent[];

  // ============================================
  // Contradiction Tracking
  // ============================================

  /**
   * IDs of contradictions the player has discovered.
   * A contradiction is discovered when player collects both
   * pieces of conflicting evidence.
   */
  readonly discoveredContradictions: readonly string[];

  /**
   * IDs of contradictions the player has resolved.
   * Subset of discoveredContradictions.
   */
  readonly resolvedContradictions: readonly string[];

  // ============================================
  // UI Notification State (Transient)
  // ============================================

  /**
   * IDs of UnlockEvents awaiting player acknowledgment.
   * Used to display "New hypothesis unlocked!" notifications.
   * Cleared after player acknowledges each notification.
   */
  readonly pendingUnlockNotifications: readonly string[];

  // ============================================
  // Active Hypothesis Selection (Milestone 7)
  // ============================================

  /**
   * Currently active hypothesis for investigation focus.
   * When set, evidence cards show relevance relative to this hypothesis.
   * Null = exploratory mode (no active focus).
   *
   * @example No Active Hypothesis (Exploratory Mode)
   * ```typescript
   * state.activeHypothesisId === null
   * // Evidence cards show no relevance badges
   * ```
   *
   * @example Active Hypothesis Selected
   * ```typescript
   * state.activeHypothesisId === 'h2'
   * // Evidence cards show green/red/gray relevance badges relative to h2
   * ```
   */
  readonly activeHypothesisId: string | null;

  /**
   * History of hypothesis pivots during investigation.
   * Tracks strategic decision-making for case review.
   * Array order = chronological (oldest first).
   *
   * @example Investigation Journey
   * ```typescript
   * state.hypothesisPivots = [
   *   { fromHypothesisId: null, toHypothesisId: 'h1', timestamp: ... },  // First selection
   *   { fromHypothesisId: 'h1', toHypothesisId: 'h3', timestamp: ... },  // Switched focus
   *   { fromHypothesisId: 'h3', toHypothesisId: 'h1', timestamp: ... }   // Switched back
   * ]
   * ```
   */
  readonly hypothesisPivots: readonly HypothesisPivot[];
}
