import React, { createContext, useReducer, ReactNode } from 'react';
import { PlayerState, GameAction, GamePhase } from '../types/game';
import { calculateScores } from '../utils/scoring';

// Initial state when game starts
const initialState: PlayerState = {
  currentPhase: 'briefing',
  selectedHypotheses: [],
  initialProbabilities: {},
  investigationPointsRemaining: 7,
  collectedEvidenceIds: [],
  finalProbabilities: {},
  confidenceLevel: 3,
  scores: null,
};

// The reducer handles all state transitions
function gameReducer(state: PlayerState, action: GameAction): PlayerState {
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
      return { ...state, currentPhase: nextPhase };
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

    default:
      return state;
  }
}

// Create context
interface GameContextType {
  state: PlayerState;
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
