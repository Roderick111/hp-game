/**
 * useVerdictFlow Hook
 *
 * Manages verdict submission flow state using useReducer pattern:
 * - Submission state (loading, submitted)
 * - Mentor feedback
 * - Confrontation dialogue
 * - Attempts tracking
 * - Error handling
 *
 * @module hooks/useVerdictFlow
 * @since Phase 3
 */

import { useReducer, useCallback } from 'react';
import { submitVerdict as submitVerdictAPI } from '../api/client';
import type {
  MentorFeedbackData,
  ConfrontationDialogueData,
  SubmitVerdictResponse,
} from '../types/investigation';
import { isApiError } from '../types/investigation';

// ============================================
// Types
// ============================================

export interface VerdictState {
  /** Whether submission is in progress */
  submitting: boolean;
  /** Whether a verdict has been submitted */
  submitted: boolean;
  /** Mentor feedback data */
  feedback: MentorFeedbackData | null;
  /** Confrontation dialogue (only if correct or after max attempts) */
  confrontation: ConfrontationDialogueData | null;
  /** Reveal message (correct answer after max attempts) */
  reveal: string | null;
  /** Pre-written wrong suspect response */
  wrongSuspectResponse: string | null;
  /** Whether the verdict was correct */
  correct: boolean;
  /** Remaining verdict attempts */
  attemptsRemaining: number;
  /** Whether the case is fully solved */
  caseSolved: boolean;
  /** Whether the user has manually confirmed to proceed to confrontation */
  confrontationConfirmed: boolean;
  /** Error message if submission failed */
  error: string | null;
}

type VerdictAction =
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS'; payload: SubmitVerdictResponse }
  | { type: 'SUBMIT_ERROR'; error: string }
  | { type: 'RESET' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CONFIRM_CONFRONTATION' };

interface UseVerdictFlowOptions {
  /** Case ID (defaults to case_001) */
  caseId?: string;
  /** Player ID (defaults to default) */
  playerId?: string;
}

export interface UseVerdictFlowReturn {
  /** Current verdict state */
  state: VerdictState;
  /** Submit a verdict */
  submitVerdict: (accusedId: string, reasoning: string, evidenceCited: string[]) => Promise<void>;
  /** Reset state for retry */
  reset: () => void;
  /** Clear error state */
  clearError: () => void;
  /** Confirm to proceed to confrontation */
  confirmConfrontation: () => void;
}

// ============================================
// Initial State
// ============================================

const initialState: VerdictState = {
  submitting: false,
  submitted: false,
  feedback: null,
  confrontation: null,
  reveal: null,
  wrongSuspectResponse: null,
  correct: false,
  attemptsRemaining: 10,
  caseSolved: false,
  confrontationConfirmed: false,
  error: null,
};

// ============================================
// Reducer
// ============================================

function verdictReducer(state: VerdictState, action: VerdictAction): VerdictState {
  switch (action.type) {
    case 'SUBMIT_START':
      return {
        ...state,
        submitting: true,
        error: null,
      };

    case 'SUBMIT_SUCCESS': {
      const { payload } = action;
      return {
        ...state,
        submitting: false,
        submitted: true,
        feedback: payload.mentor_feedback,
        confrontation: payload.confrontation ?? null,
        reveal: payload.reveal ?? null,
        wrongSuspectResponse: payload.wrong_suspect_response ?? null,
        correct: payload.correct,
        attemptsRemaining: payload.attempts_remaining,
        caseSolved: payload.case_solved,
        confrontationConfirmed: false, // Reset confirmation on new submission
        error: null,
      };
    }

    case 'SUBMIT_ERROR':
      return {
        ...state,
        submitting: false,
        error: action.error,
      };

    case 'RESET':
      return {
        ...initialState,
        // Preserve attempts remaining for educational tracking
        attemptsRemaining: state.attemptsRemaining,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'CONFIRM_CONFRONTATION':
      return {
        ...state,
        confrontationConfirmed: true,
      };

    default:
      return state;
  }
}

// ============================================
// Hook
// ============================================

export function useVerdictFlow({
  caseId = 'case_001',
  playerId = 'default',
}: UseVerdictFlowOptions = {}): UseVerdictFlowReturn {
  const [state, dispatch] = useReducer(verdictReducer, initialState);

  // Submit verdict
  const submitVerdict = useCallback(
    async (accusedId: string, reasoning: string, evidenceCited: string[]) => {
      dispatch({ type: 'SUBMIT_START' });

      try {
        const response = await submitVerdictAPI({
          case_id: caseId,
          player_id: playerId,
          accused_suspect_id: accusedId,
          reasoning,
          evidence_cited: evidenceCited,
        });

        dispatch({ type: 'SUBMIT_SUCCESS', payload: response });
      } catch (err) {
        dispatch({
          type: 'SUBMIT_ERROR',
          error: isApiError(err) ? err.message : 'Failed to submit verdict',
        });
      }
    },
    [caseId, playerId]
  );

  // Reset state for retry
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Confirm confrontation
  const confirmConfrontation = useCallback(() => {
    dispatch({ type: 'CONFIRM_CONFRONTATION' });
  }, []);

  return {
    state,
    submitVerdict,
    reset,
    clearError,
    confirmConfrontation,
  };
}
