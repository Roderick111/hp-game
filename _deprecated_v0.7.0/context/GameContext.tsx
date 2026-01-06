import React, { createContext, useReducer, ReactNode } from 'react';
import { GameAction, GamePhase } from '../types/game';
import type { EnhancedPlayerState, UnlockEvent } from '../types/enhanced';
import { calculateScores } from '../utils/scoring';

// Initial state when game starts
const initialState: EnhancedPlayerState = {
  // Base PlayerState fields
  currentPhase: 'briefing',
  selectedHypotheses: [],
  initialProbabilities: {},
  investigationPointsRemaining: 7,
  collectedEvidenceIds: [],
  finalProbabilities: {},
  confidenceLevel: 3,
  scores: null,

  // Enhanced fields for Milestone 2+
  unlockedHypotheses: [],
  unlockHistory: [],
  discoveredContradictions: [],
  resolvedContradictions: [],
  pendingUnlockNotifications: [],

  // Active hypothesis selection (Milestone 7)
  activeHypothesisId: null,
  hypothesisPivots: [],
};

/**
 * Generate a unique ID for unlock events.
 * Uses timestamp + random suffix for uniqueness.
 */
function generateEventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// The reducer handles all state transitions
function gameReducer(state: EnhancedPlayerState, action: GameAction): EnhancedPlayerState {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...initialState,
        investigationPointsRemaining: action.investigationPoints,
      };

    case 'ADVANCE_PHASE': {
      const phaseOrder: GamePhase[] = [
        'briefing', 'hypothesis', 'investigation',
        'prediction', 'resolution', 'review'
      ];
      const currentIndex = phaseOrder.indexOf(state.currentPhase);
      const nextPhase = phaseOrder[currentIndex + 1] || state.currentPhase;

      // Clear active hypothesis when leaving investigation phase
      const clearedHypothesis = state.currentPhase === 'investigation'
        ? null
        : state.activeHypothesisId;

      return {
        ...state,
        currentPhase: nextPhase,
        activeHypothesisId: clearedHypothesis,
      };
    }

    case 'GO_TO_PHASE':
      return { ...state, currentPhase: action.phase };

    case 'SELECT_HYPOTHESIS':
      return {
        ...state,
        selectedHypotheses: [...state.selectedHypotheses, action.hypothesisId],
        initialProbabilities: {
          ...state.initialProbabilities,
          [action.hypothesisId]: 0,
        },
      };

    case 'DESELECT_HYPOTHESIS': {
      const newSelected = state.selectedHypotheses.filter(
        id => id !== action.hypothesisId
      );
      const newProbs = { ...state.initialProbabilities };
      delete newProbs[action.hypothesisId];
      return {
        ...state,
        selectedHypotheses: newSelected,
        initialProbabilities: newProbs,
      };
    }

    case 'SET_INITIAL_PROBABILITY':
      return {
        ...state,
        initialProbabilities: {
          ...state.initialProbabilities,
          [action.hypothesisId]: action.value,
        },
      };

    case 'COLLECT_EVIDENCE':
      return {
        ...state,
        collectedEvidenceIds: [...state.collectedEvidenceIds, action.actionId],
        investigationPointsRemaining: state.investigationPointsRemaining - action.cost,
      };

    case 'SET_FINAL_PROBABILITY':
      return {
        ...state,
        finalProbabilities: {
          ...state.finalProbabilities,
          [action.hypothesisId]: action.value,
        },
      };

    case 'SET_CONFIDENCE':
      return { ...state, confidenceLevel: action.level };

    case 'CALCULATE_SCORES':
      return {
        ...state,
        scores: calculateScores(state, action.caseData),
      };

    case 'RESET_GAME':
      return { ...initialState };

    case 'UNLOCK_HYPOTHESIS': {
      // Prevent duplicate unlocks
      if (state.unlockedHypotheses.includes(action.hypothesisId)) {
        return state;
      }

      // Create the unlock event
      const eventId = generateEventId();
      const unlockEvent: UnlockEvent = {
        id: eventId,
        hypothesisId: action.hypothesisId,
        trigger: action.trigger,
        timestamp: new Date(),
        acknowledged: false,
      };

      return {
        ...state,
        unlockedHypotheses: [...state.unlockedHypotheses, action.hypothesisId],
        unlockHistory: [...state.unlockHistory, unlockEvent],
        pendingUnlockNotifications: [...state.pendingUnlockNotifications, eventId],
      };
    }

    case 'ACKNOWLEDGE_UNLOCK': {
      // Remove from pending notifications
      const newPending = state.pendingUnlockNotifications.filter(
        (id) => id !== action.eventId
      );

      // Mark event as acknowledged in history
      const newHistory = state.unlockHistory.map((event) =>
        event.id === action.eventId ? { ...event, acknowledged: true } : event
      );

      return {
        ...state,
        pendingUnlockNotifications: newPending,
        unlockHistory: newHistory,
      };
    }

    // ============================================
    // Contradiction Actions (Milestone 3)
    // ============================================

    case 'DISCOVER_CONTRADICTION': {
      // Prevent duplicate discoveries
      if (state.discoveredContradictions.includes(action.contradictionId)) {
        return state;
      }

      return {
        ...state,
        discoveredContradictions: [...state.discoveredContradictions, action.contradictionId],
      };
    }

    case 'RESOLVE_CONTRADICTION': {
      // Can only resolve if already discovered
      if (!state.discoveredContradictions.includes(action.contradictionId)) {
        return state;
      }

      // Prevent duplicate resolutions
      if (state.resolvedContradictions.includes(action.contradictionId)) {
        return state;
      }

      return {
        ...state,
        resolvedContradictions: [...state.resolvedContradictions, action.contradictionId],
      };
    }

    // ============================================
    // Active Hypothesis Selection (Milestone 7)
    // ============================================

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

    default:
      return state;
  }
}

// Create context
interface GameContextType {
  state: EnhancedPlayerState;
  dispatch: React.Dispatch<GameAction>;
}

export const GameContext = createContext<GameContextType | null>(null);

// Provider component
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}
