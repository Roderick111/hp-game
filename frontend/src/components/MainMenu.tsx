/**
 * MainMenu Component
 *
 * In-game menu modal accessible via ESC key or MENU button.
 * Uses Radix UI Dialog for accessibility (focus management, ESC handling).
 * Terminal dark theme with keyboard navigation (1-4 number keys).
 *
 * Phase 5.1: Only "Restart Case" is functional; Load/Save/Settings disabled with tooltips.
 *
 * @module components/MainMenu
 * @since Phase 5.1
 */

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useRef } from 'react';
import { Button } from './ui/Button';

// ============================================
// Types
// ============================================

export interface MainMenuProps {
  /** Whether the menu is open */
  isOpen: boolean;
  /** Callback when menu should close */
  onClose: () => void;
  /** Callback when "Restart Case" is selected (triggers confirmation) */
  onRestart: () => void;
  /** Callback when "Load Game" is selected (Phase 5.3) */
  onLoad: () => void;
  /** Callback when "Save Game" is selected (Phase 5.3) */
  onSave: () => void;
  /** Loading state (disables buttons during async operations) */
  loading?: boolean;
}

// ============================================
// Component
// ============================================

export function MainMenu({
  isOpen,
  onClose,
  onRestart,
  onLoad,
  onSave,
  loading = false,
}: MainMenuProps) {
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  // Number key shortcuts (1-4) - only "1" key active in Phase 5.1
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Number key shortcuts (1-4)
      if (loading) return; // Disable all shortcuts when loading

      if (e.key === '1') {
        e.preventDefault();
        onRestart();
      } else if (e.key === '2') {
        e.preventDefault();
        onLoad();
      } else if (e.key === '3') {
        e.preventDefault();
        onSave();
      }
      // Key 4 (Settings) does nothing (button still disabled)
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onRestart, onLoad, onSave, loading]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Backdrop overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />

        {/* Menu content */}
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     bg-gray-900 border-2 border-gray-700 rounded-lg
                     w-full max-w-md p-6 shadow-xl
                     focus:outline-none"
          onEscapeKeyDown={onClose}
          onOpenAutoFocus={(e) => {
            // Focus first button when menu opens
            firstButtonRef.current?.focus();
            e.preventDefault();
          }}
        >
          {/* Menu title */}
          <Dialog.Title className="text-2xl font-bold text-amber-400 font-mono mb-6 tracking-wider">
            MAIN MENU
          </Dialog.Title>

          {/* Menu options */}
          <div className="space-y-3">
            {/* 1. Restart Case - FUNCTIONAL */}
            <Button
              ref={firstButtonRef}
              variant="primary"
              size="lg"
              onClick={onRestart}
              disabled={loading}
              className="w-full font-mono focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            >
              1. RESTART CASE
            </Button>

            {/* 2. Load Game - FUNCTIONAL (Phase 5.3) */}
            <Button
              variant="secondary"
              size="lg"
              onClick={onLoad}
              disabled={loading}
              className="w-full font-mono focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            >
              2. LOAD GAME
            </Button>

            {/* 3. Save Game - FUNCTIONAL (Phase 5.3) */}
            <Button
              variant="secondary"
              size="lg"
              onClick={onSave}
              disabled={loading}
              className="w-full font-mono focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            >
              3. SAVE GAME
            </Button>

            {/* 4. Settings - DISABLED (Future) */}
            <Button
              variant="ghost"
              size="lg"
              className="w-full font-mono opacity-50 bg-gray-800 hover:bg-gray-800 border-gray-600 text-gray-400 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none"
              disabled
              title="Coming soon"
            >
              4. SETTINGS
            </Button>
          </div>

          {/* Keyboard hint */}
          <p className="mt-6 text-center text-gray-500 text-xs font-mono">
            Press ESC to close | Press 1-4 to select
          </p>

          {/* Close button (X) */}
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white
                         focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none
                         rounded p-1 transition-colors"
              aria-label="Close menu"
            >
              <span className="text-xl font-mono">&times;</span>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default MainMenu;
