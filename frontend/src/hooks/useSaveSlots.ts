/**
 * useSaveSlots Hook
 *
 * Manages save slot operations (save, load, list, delete).
 * Handles loading states and errors for save/load UI.
 *
 * @module hooks/useSaveSlots
 * @since Phase 5.3
 */

import { useState, useCallback, useEffect } from 'react';
import {
  saveGameState,
  loadGameState,
  listSaveSlots,
  deleteSaveSlot,
} from '../api/client';
import type { SaveSlotMetadata, InvestigationState } from '../types/investigation';

// ============================================
// Hook
// ============================================

export function useSaveSlots(caseId: string) {
  const [slots, setSlots] = useState<SaveSlotMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Refresh the list of save slots from backend
   */
  const refreshSlots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const savedSlots = await listSaveSlots(caseId);
      setSlots(savedSlots);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load save slots';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  /**
   * Save game state to a specific slot
   */
  const saveToSlot = useCallback(
    async (slot: string, state: InvestigationState): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);
        await saveGameState(caseId, state, slot);
        await refreshSlots(); // Refresh to update metadata
        return true;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : `Failed to save to ${slot}`;
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [caseId, refreshSlots]
  );

  /**
   * Load game state from a specific slot
   */
  const loadFromSlot = useCallback(
    async (slot: string): Promise<InvestigationState | null> => {
      try {
        setLoading(true);
        setError(null);
        const loadedState = await loadGameState(caseId, slot);
        return loadedState;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : `Failed to load from ${slot}`;
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [caseId]
  );

  /**
   * Delete a specific save slot
   */
  const deleteSlot = useCallback(
    async (slot: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);
        await deleteSaveSlot(caseId, slot);
        await refreshSlots(); // Refresh to remove deleted slot
        return true;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : `Failed to delete ${slot}`;
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [caseId, refreshSlots]
  );

  // Load slots on mount
  useEffect(() => {
    void refreshSlots();
  }, [refreshSlots]);

  return {
    slots,
    loading,
    error,
    saveToSlot,
    loadFromSlot,
    deleteSlot,
    refreshSlots,
  };
}

export default useSaveSlots;
