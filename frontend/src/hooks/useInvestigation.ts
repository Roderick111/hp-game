/**
 * useInvestigation Hook
 *
 * Manages investigation state including:
 * - Loading/saving player state
 * - Fetching location data
 * - Tracking discovered evidence
 * - Handling state persistence
 *
 * @module hooks/useInvestigation
 * @since Phase 1
 */

import { useState, useEffect, useCallback } from 'react';
import {
  loadState,
  saveState,
  getLocation,
} from '../api/client';
import type {
  InvestigationState,
  LocationResponse,
  ApiError,
  Message,
  ConversationMessage,
} from '../types/investigation';

// ============================================
// Types
// ============================================

interface UseInvestigationOptions {
  /** Case ID to load */
  caseId: string;
  /** Location ID to load */
  locationId: string;
  /** Player ID for state persistence (defaults to "default") */
  playerId?: string;
  /** Auto-load state on mount (defaults to true) */
  autoLoad?: boolean;
  /** Save slot to load from (defaults to "default") */
  slot?: string;
}

interface UseInvestigationReturn {
  /** Current investigation state */
  state: InvestigationState | null;
  /** Current location data */
  location: LocationResponse | null;
  /** Whether initial data is loading */
  loading: boolean;
  /** Error message if loading failed */
  error: string | null;
  /** Whether save is in progress */
  saving: boolean;
  /** Save current state to backend */
  handleSave: () => Promise<boolean>;
  /** Reload state from backend */
  handleLoad: () => Promise<void>;
  /** Add newly discovered evidence to state */
  handleEvidenceDiscovered: (evidenceIds: string[]) => void;
  /** Clear error state */
  clearError: () => void;
  /** Restored conversation messages from backend (Phase 4.4) */
  restoredMessages: Message[] | null;
}

// ============================================
// Hook
// ============================================

/**
 * Convert backend conversation messages to frontend Message format
 * Maps 'tom' type to 'tom_ghost' for rendering compatibility
 */
function convertConversationMessages(
  messages: ConversationMessage[] | undefined
): Message[] | null {
  if (!messages || messages.length === 0) {
    return null;
  }

  return messages.map((msg) => {
    if (msg.type === 'tom') {
      // Convert 'tom' backend type to 'tom_ghost' frontend type
      return {
        type: 'tom_ghost' as const,
        text: msg.text,
        timestamp: msg.timestamp,
      };
    } else if (msg.type === 'player') {
      return {
        type: 'player' as const,
        text: msg.text,
        timestamp: msg.timestamp,
      };
    } else {
      return {
        type: 'narrator' as const,
        text: msg.text,
        timestamp: msg.timestamp,
      };
    }
  });
}

export function useInvestigation({
  caseId,
  locationId,
  playerId = 'default',
  autoLoad = true,
  slot = 'default',
}: UseInvestigationOptions): UseInvestigationReturn {
  // State
  const [state, setState] = useState<InvestigationState | null>(null);
  const [location, setLocation] = useState<LocationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Restored conversation messages from backend (Phase 4.4)
  const [restoredMessages, setRestoredMessages] = useState<Message[] | null>(null);

  // Initialize default state
  const createDefaultState = useCallback((): InvestigationState => ({
    case_id: caseId,
    current_location: locationId,
    discovered_evidence: [],
    visited_locations: [locationId],
  }), [caseId, locationId]);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load state and location in parallel
      const [loadedState, locationData] = await Promise.all([
        loadState(caseId, playerId, slot, locationId),
        getLocation(caseId, locationId),
      ]);

      // Use loaded state or create default
      if (loadedState) {
        setState({
          case_id: loadedState.case_id,
          current_location: loadedState.current_location,
          discovered_evidence: loadedState.discovered_evidence,
          visited_locations: loadedState.visited_locations,
        });

        // Restore conversation history (Phase 4.4)
        const converted = convertConversationMessages(loadedState.conversation_history);
        setRestoredMessages(converted);
      } else {
        setState(createDefaultState());
        setRestoredMessages(null);
      }

      setLocation(locationData);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load investigation data');
      // Still create default state so the app is usable
      setState(createDefaultState());
    } finally {
      setLoading(false);
    }
  }, [caseId, locationId, playerId, slot, createDefaultState]);

  // Auto-load on mount and when locationId changes (Phase 5.2)
  useEffect(() => {
    if (autoLoad && locationId) {
      void loadInitialData();
    }
  }, [autoLoad, loadInitialData, locationId]);

  // Save state handler
  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!state) {
      setError('No state to save');
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await saveState(playerId, state);
      return response.success;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to save progress');
      return false;
    } finally {
      setSaving(false);
    }
  }, [state, playerId]);

  // Load state handler
  const handleLoad = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  // Evidence discovered handler
  const handleEvidenceDiscovered = useCallback((evidenceIds: string[]) => {
    setState((prev) => {
      if (!prev) return prev;

      // Filter out already discovered evidence
      const newEvidence = evidenceIds.filter(
        (id) => !prev.discovered_evidence.includes(id)
      );

      if (newEvidence.length === 0) {
        return prev;
      }

      return {
        ...prev,
        discovered_evidence: [...prev.discovered_evidence, ...newEvidence],
      };
    });
  }, []);

  // Clear error handler
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    state,
    location,
    loading,
    error,
    saving,
    handleSave,
    handleLoad,
    handleEvidenceDiscovered,
    clearError,
    restoredMessages,
  };
}
