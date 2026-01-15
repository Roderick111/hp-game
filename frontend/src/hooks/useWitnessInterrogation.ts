/**
 * useWitnessInterrogation Hook
 *
 * Manages witness interrogation state including:
 * - Current witness selection
 * - Conversation history
 * - Trust level tracking
 * - Evidence presentation
 * - Secret revelation tracking
 *
 * @module hooks/useWitnessInterrogation
 * @since Phase 2
 */

import { useReducer, useCallback, useEffect } from 'react';
import {
  interrogateWitness,
  presentEvidence,
  getWitnesses,
  getWitness,
} from '../api/client';
import type {
  WitnessInfo,
  WitnessConversationItem,
  ApiError,
} from '../types/investigation';

// ============================================
// Types
// ============================================

interface WitnessInterrogationState {
  /** List of available witnesses */
  witnesses: WitnessInfo[];
  /** Currently selected witness */
  currentWitness: WitnessInfo | null;
  /** Local conversation history (display purposes) */
  conversation: WitnessConversationItem[];
  /** Current trust level */
  trust: number;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Secrets revealed in current session */
  secretsRevealed: string[];
}

type WitnessAction =
  | { type: 'SET_WITNESSES'; payload: WitnessInfo[] }
  | { type: 'SELECT_WITNESS'; payload: WitnessInfo }
  | { type: 'ADD_CONVERSATION'; payload: WitnessConversationItem }
  | { type: 'UPDATE_TRUST'; payload: number }
  | { type: 'REVEAL_SECRETS'; payload: string[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_CONVERSATION' }
  | { type: 'RESET' };

interface UseWitnessInterrogationOptions {
  /** Case ID */
  caseId?: string;
  /** Player ID */
  playerId?: string;
  /** Auto-load witnesses on mount */
  autoLoad?: boolean;
}

interface UseWitnessInterrogationReturn {
  /** Current state */
  state: WitnessInterrogationState;
  /** Ask a question to the current witness */
  askQuestion: (question: string) => Promise<void>;
  /** Present evidence to the current witness */
  presentEvidenceToWitness: (evidenceId: string) => Promise<void>;
  /** Select a witness for interrogation */
  selectWitness: (witnessId: string) => Promise<void>;
  /** Clear current conversation */
  clearConversation: () => void;
  /** Reload witnesses list */
  reloadWitnesses: () => Promise<void>;
}

// ============================================
// Reducer
// ============================================

const initialState: WitnessInterrogationState = {
  witnesses: [],
  currentWitness: null,
  conversation: [],
  trust: 50,
  loading: false,
  error: null,
  secretsRevealed: [],
};

function witnessReducer(
  state: WitnessInterrogationState,
  action: WitnessAction
): WitnessInterrogationState {
  switch (action.type) {
    case 'SET_WITNESSES':
      return { ...state, witnesses: action.payload };

    case 'SELECT_WITNESS':
      return {
        ...state,
        currentWitness: action.payload,
        trust: action.payload.trust,
        conversation: action.payload.conversation_history ?? [],
        secretsRevealed: action.payload.secrets_revealed ?? [],
        error: null,
      };

    case 'ADD_CONVERSATION':
      return {
        ...state,
        conversation: [...state.conversation, action.payload],
      };

    case 'UPDATE_TRUST':
      // Update trust in current state AND in witnesses array for sidebar sync
      return {
        ...state,
        trust: action.payload,
        currentWitness: state.currentWitness
          ? { ...state.currentWitness, trust: action.payload }
          : null,
        witnesses: state.witnesses.map((w) =>
          w.id === state.currentWitness?.id ? { ...w, trust: action.payload } : w
        ),
      };

    case 'REVEAL_SECRETS': {
      const newSecretsRevealed = [...new Set([...state.secretsRevealed, ...action.payload])];
      return {
        ...state,
        secretsRevealed: newSecretsRevealed,
        currentWitness: state.currentWitness
          ? { ...state.currentWitness, secrets_revealed: newSecretsRevealed }
          : null,
        witnesses: state.witnesses.map((w) =>
          w.id === state.currentWitness?.id
            ? { ...w, secrets_revealed: newSecretsRevealed }
            : w
        ),
      };
    }

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'CLEAR_CONVERSATION':
      return { ...state, conversation: [] };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// ============================================
// Hook
// ============================================

export function useWitnessInterrogation({
  caseId = 'case_001',
  playerId = 'default',
  autoLoad = true,
}: UseWitnessInterrogationOptions = {}): UseWitnessInterrogationReturn {
  const [state, dispatch] = useReducer(witnessReducer, initialState);

  // Load witnesses list
  const reloadWitnesses = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const witnesses = await getWitnesses(caseId, playerId);
      dispatch({ type: 'SET_WITNESSES', payload: witnesses });
    } catch (err) {
      const apiError = err as ApiError;
      dispatch({
        type: 'SET_ERROR',
        payload: apiError.message || 'Failed to load witnesses',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [caseId, playerId]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      void reloadWitnesses();
    }
  }, [autoLoad, reloadWitnesses]);

  // Select witness for interrogation
  const selectWitness = useCallback(
    async (witnessId: string) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      try {
        const witness = await getWitness(witnessId, caseId, playerId);
        dispatch({ type: 'SELECT_WITNESS', payload: witness });
      } catch (err) {
        const apiError = err as ApiError;
        dispatch({
          type: 'SET_ERROR',
          payload: apiError.message || 'Failed to load witness',
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [caseId, playerId]
  );

  // Ask question to current witness
  const askQuestion = useCallback(
    async (question: string) => {
      if (!state.currentWitness) {
        dispatch({ type: 'SET_ERROR', payload: 'No witness selected' });
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      try {
        const response = await interrogateWitness({
          witness_id: state.currentWitness.id,
          question,
          case_id: caseId,
          player_id: playerId,
        });

        // Add to conversation
        const conversationItem: WitnessConversationItem = {
          question,
          response: response.response,
          timestamp: new Date().toISOString(),
          trust_delta: response.trust_delta,
        };
        dispatch({ type: 'ADD_CONVERSATION', payload: conversationItem });

        // Update trust
        dispatch({ type: 'UPDATE_TRUST', payload: response.trust });

        // Track revealed secrets
        if (response.secrets_revealed && response.secrets_revealed.length > 0) {
          dispatch({ type: 'REVEAL_SECRETS', payload: response.secrets_revealed });
        }
      } catch (err) {
        const apiError = err as ApiError;
        dispatch({
          type: 'SET_ERROR',
          payload: apiError.message || 'Failed to interrogate witness',
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [state.currentWitness, caseId, playerId]
  );

  // Present evidence to current witness
  const presentEvidenceToWitness = useCallback(
    async (evidenceId: string) => {
      if (!state.currentWitness) {
        dispatch({ type: 'SET_ERROR', payload: 'No witness selected' });
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      try {
        const response = await presentEvidence({
          witness_id: state.currentWitness.id,
          evidence_id: evidenceId,
          case_id: caseId,
          player_id: playerId,
        });

        // Add to conversation
        const conversationItem: WitnessConversationItem = {
          question: `[Presented evidence: ${evidenceId}]`,
          response: response.response,
          timestamp: new Date().toISOString(),
          trust_delta: response.trust_delta,
        };
        dispatch({ type: 'ADD_CONVERSATION', payload: conversationItem });

        // Update trust
        dispatch({ type: 'UPDATE_TRUST', payload: response.trust });

        // Track revealed secrets
        if (response.secrets_revealed && response.secrets_revealed.length > 0) {
          dispatch({ type: 'REVEAL_SECRETS', payload: response.secrets_revealed });
        }
      } catch (err) {
        const apiError = err as ApiError;
        dispatch({
          type: 'SET_ERROR',
          payload: apiError.message || 'Failed to present evidence',
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [state.currentWitness, caseId, playerId]
  );

  // Clear conversation
  const clearConversation = useCallback(() => {
    dispatch({ type: 'CLEAR_CONVERSATION' });
  }, []);

  return {
    state,
    askQuestion,
    presentEvidenceToWitness,
    selectWitness,
    clearConversation,
    reloadWitnesses,
  };
}
