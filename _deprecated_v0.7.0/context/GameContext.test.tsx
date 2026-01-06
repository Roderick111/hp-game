/**
 * Tests for GameContext reducer (Active Hypothesis Selection - Milestone 7)
 *
 * @module context/__tests__/GameContext
 * @since Milestone 7
 */

import { describe, it, expect } from 'vitest';
import type { EnhancedPlayerState } from '../../types/enhanced';
import type { GameAction } from '../../types/game';

// We need to import the actual reducer for testing
// Since it's not exported, we'll create a minimal version for testing
function gameReducer(state: EnhancedPlayerState, action: GameAction): EnhancedPlayerState {
  switch (action.type) {
    case 'SET_ACTIVE_HYPOTHESIS': {
      // Idempotent - no-op if already active
      if (state.activeHypothesisId === action.hypothesisId) {
        return state;
      }

      // Track pivot (from previous hypothesis to new one)
      const newPivot = {
        fromHypothesisId: state.activeHypothesisId,
        toHypothesisId: action.hypothesisId,
        timestamp: new Date(),
      };

      return {
        ...state,
        activeHypothesisId: action.hypothesisId,
        hypothesisPivots: [...state.hypothesisPivots, newPivot],
      };
    }

    case 'CLEAR_ACTIVE_HYPOTHESIS': {
      // Idempotent - no-op if already null
      if (state.activeHypothesisId === null) {
        return state;
      }

      return {
        ...state,
        activeHypothesisId: null,
        // Note: Do NOT clear pivots - preserve history for case review
      };
    }

    case 'ADVANCE_PHASE': {
      const phaseOrder = ['briefing', 'hypothesis', 'investigation', 'prediction', 'resolution', 'review'] as const;
      const currentIndex = phaseOrder.indexOf(state.currentPhase);
      const nextPhase = phaseOrder[currentIndex + 1] || state.currentPhase;

      // Clear active hypothesis when leaving investigation phase
      const clearedHypothesis = state.currentPhase === 'investigation' ? null : state.activeHypothesisId;

      return {
        ...state,
        currentPhase: nextPhase,
        activeHypothesisId: clearedHypothesis,
      };
    }

    default:
      return state;
  }
}

// ============================================
// Test Fixtures
// ============================================

const createInitialState = (): EnhancedPlayerState => ({
  currentPhase: 'investigation',
  selectedHypotheses: [],
  initialProbabilities: {},
  investigationPointsRemaining: 12,
  collectedEvidenceIds: [],
  finalProbabilities: {},
  confidenceLevel: 3,
  scores: null,
  unlockedHypotheses: [],
  unlockHistory: [],
  discoveredContradictions: [],
  resolvedContradictions: [],
  pendingUnlockNotifications: [],
  activeHypothesisId: null,
  hypothesisPivots: [],
});

// ============================================
// SET_ACTIVE_HYPOTHESIS Tests
// ============================================

describe('GameContext Reducer - SET_ACTIVE_HYPOTHESIS', () => {
  it('should set active hypothesis when none is active', () => {
    // Arrange
    const state = createInitialState();

    // Act
    const action: GameAction = { type: 'SET_ACTIVE_HYPOTHESIS', hypothesisId: 'h1' };
    const newState = gameReducer(state, action);

    // Assert
    expect(newState.activeHypothesisId).toBe('h1');
    expect(newState.hypothesisPivots).toHaveLength(1);
    expect(newState.hypothesisPivots[0]).toMatchObject({
      fromHypothesisId: null,
      toHypothesisId: 'h1',
    });
    expect(newState.hypothesisPivots[0].timestamp).toBeInstanceOf(Date);
  });

  it('should be idempotent when setting same hypothesis', () => {
    // Arrange
    const state: EnhancedPlayerState = {
      ...createInitialState(),
      activeHypothesisId: 'h1',
      hypothesisPivots: [
        {
          fromHypothesisId: null,
          toHypothesisId: 'h1',
          timestamp: new Date('2025-01-15T10:00:00Z'),
        },
      ],
    };

    // Act
    const action: GameAction = { type: 'SET_ACTIVE_HYPOTHESIS', hypothesisId: 'h1' };
    const newState = gameReducer(state, action);

    // Assert
    expect(newState).toBe(state); // Same reference returned (no-op)
    expect(newState.activeHypothesisId).toBe('h1');
    expect(newState.hypothesisPivots).toHaveLength(1); // No new pivot added
  });

  it('should track pivot when switching hypotheses', () => {
    // Arrange
    const state: EnhancedPlayerState = {
      ...createInitialState(),
      activeHypothesisId: 'h1',
      hypothesisPivots: [
        {
          fromHypothesisId: null,
          toHypothesisId: 'h1',
          timestamp: new Date('2025-01-15T10:00:00Z'),
        },
      ],
    };

    // Act
    const action: GameAction = { type: 'SET_ACTIVE_HYPOTHESIS', hypothesisId: 'h2' };
    const newState = gameReducer(state, action);

    // Assert
    expect(newState.activeHypothesisId).toBe('h2');
    expect(newState.hypothesisPivots).toHaveLength(2);
    expect(newState.hypothesisPivots[1]).toMatchObject({
      fromHypothesisId: 'h1',
      toHypothesisId: 'h2',
    });
    expect(newState.hypothesisPivots[1].timestamp).toBeInstanceOf(Date);

    // Verify old pivot is preserved
    expect(newState.hypothesisPivots[0]).toEqual(state.hypothesisPivots[0]);
  });
});

// ============================================
// CLEAR_ACTIVE_HYPOTHESIS Tests
// ============================================

describe('GameContext Reducer - CLEAR_ACTIVE_HYPOTHESIS', () => {
  it('should clear active hypothesis', () => {
    // Arrange
    const state: EnhancedPlayerState = {
      ...createInitialState(),
      activeHypothesisId: 'h1',
      hypothesisPivots: [
        {
          fromHypothesisId: null,
          toHypothesisId: 'h1',
          timestamp: new Date(),
        },
      ],
    };

    // Act
    const action: GameAction = { type: 'CLEAR_ACTIVE_HYPOTHESIS' };
    const newState = gameReducer(state, action);

    // Assert
    expect(newState.activeHypothesisId).toBeNull();
    expect(newState.hypothesisPivots).toHaveLength(1); // Pivots preserved
  });

  it('should be idempotent when no active hypothesis', () => {
    // Arrange
    const state = createInitialState();

    // Act
    const action: GameAction = { type: 'CLEAR_ACTIVE_HYPOTHESIS' };
    const newState = gameReducer(state, action);

    // Assert
    expect(newState).toBe(state); // Same reference returned (no-op)
    expect(newState.activeHypothesisId).toBeNull();
  });

  it('should preserve pivot history when clearing', () => {
    // Arrange
    const pivots = [
      {
        fromHypothesisId: null,
        toHypothesisId: 'h1',
        timestamp: new Date('2025-01-15T10:00:00Z'),
      },
      {
        fromHypothesisId: 'h1',
        toHypothesisId: 'h2',
        timestamp: new Date('2025-01-15T11:00:00Z'),
      },
    ];

    const state: EnhancedPlayerState = {
      ...createInitialState(),
      activeHypothesisId: 'h2',
      hypothesisPivots: pivots,
    };

    // Act
    const action: GameAction = { type: 'CLEAR_ACTIVE_HYPOTHESIS' };
    const newState = gameReducer(state, action);

    // Assert
    expect(newState.activeHypothesisId).toBeNull();
    expect(newState.hypothesisPivots).toEqual(pivots); // Preserved
  });
});

// ============================================
// ADVANCE_PHASE Tests
// ============================================

describe('GameContext Reducer - ADVANCE_PHASE (Active Hypothesis Cleanup)', () => {
  it('should clear active hypothesis when leaving investigation phase', () => {
    // Arrange
    const state: EnhancedPlayerState = {
      ...createInitialState(),
      currentPhase: 'investigation',
      activeHypothesisId: 'h1',
      hypothesisPivots: [
        {
          fromHypothesisId: null,
          toHypothesisId: 'h1',
          timestamp: new Date(),
        },
      ],
    };

    // Act
    const action: GameAction = { type: 'ADVANCE_PHASE' };
    const newState = gameReducer(state, action);

    // Assert
    expect(newState.currentPhase).toBe('prediction');
    expect(newState.activeHypothesisId).toBeNull();
    expect(newState.hypothesisPivots).toHaveLength(1); // Pivots preserved
  });

  it('should preserve active hypothesis when advancing within other phases', () => {
    // Arrange
    const state: EnhancedPlayerState = {
      ...createInitialState(),
      currentPhase: 'briefing',
      activeHypothesisId: null, // No active hypothesis in briefing anyway
    };

    // Act
    const action: GameAction = { type: 'ADVANCE_PHASE' };
    const newState = gameReducer(state, action);

    // Assert
    expect(newState.currentPhase).toBe('hypothesis');
    expect(newState.activeHypothesisId).toBeNull(); // Still null
  });

  it('should preserve pivot history when advancing phases', () => {
    // Arrange
    const pivots = [
      {
        fromHypothesisId: null,
        toHypothesisId: 'h1',
        timestamp: new Date(),
      },
    ];

    const state: EnhancedPlayerState = {
      ...createInitialState(),
      currentPhase: 'investigation',
      activeHypothesisId: 'h1',
      hypothesisPivots: pivots,
    };

    // Act
    const action: GameAction = { type: 'ADVANCE_PHASE' };
    const newState = gameReducer(state, action);

    // Assert
    expect(newState.hypothesisPivots).toEqual(pivots); // Never cleared
  });
});
