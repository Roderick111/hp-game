/**
 * useMainMenu Hook
 *
 * Manages main menu modal state (open/close, loading, error).
 * Phase 5.1 foundation - minimal state management.
 *
 * @module hooks/useMainMenu
 * @since Phase 5.1
 */

import { useState, useCallback } from 'react';

// ============================================
// Types
// ============================================

export interface UseMainMenuReturn {
  /** Whether the menu is open */
  isOpen: boolean;
  /** Set menu open state directly */
  setIsOpen: (open: boolean) => void;
  /** Toggle menu open/close */
  handleToggle: () => void;
  /** Close the menu */
  handleClose: () => void;
  /** Open the menu */
  handleOpen: () => void;
  /** Loading state (for future async operations) */
  loading: boolean;
  /** Error state (for future async operations) */
  error: string | null;
}

// ============================================
// Hook
// ============================================

export function useMainMenu(): UseMainMenuReturn {
  const [isOpen, setIsOpen] = useState(false);
  // Note: setLoading/setError reserved for Phase 5.3 save/load async operations
  const [loading, _setLoading] = useState(false);
  const [error, _setError] = useState<string | null>(null);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Expose setLoading and setError for future phases (save/load)
  // For now, they're internal state placeholders

  return {
    isOpen,
    setIsOpen,
    handleToggle,
    handleClose,
    handleOpen,
    loading,
    error,
  };
}

export default useMainMenu;
