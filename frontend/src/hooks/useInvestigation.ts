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
}

// ============================================
// Hook
// ============================================

export function useInvestigation({
  caseId,
  locationId,
  playerId = 'default',
  autoLoad = true,
}: UseInvestigationOptions): UseInvestigationReturn {
  // State
  const [state, setState] = useState<InvestigationState | null>(null);
  const [location, setLocation] = useState<LocationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        loadState(caseId, playerId),
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
      } else {
        setState(createDefaultState());
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
  }, [caseId, locationId, playerId, createDefaultState]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      void loadInitialData();
    }
  }, [autoLoad, loadInitialData]);

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
  };
}
