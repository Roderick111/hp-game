/**
 * MainMenu Component
 *
 * In-game menu modal accessible via ESC key or MENU button.
 * Uses Radix UI Dialog for accessibility (focus management, ESC handling).
 * Minimal B&W terminal aesthetic with keyboard navigation (1-5 number keys).
 *
 * Phase 5.1: Restart, Load, Save functional. Settings disabled.
 * Phase 5.3.1: Added "Exit to Main Menu" (button 5).
 *
 * @module components/MainMenu
 * @since Phase 5.1, updated Phase 5.3.1
 */

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect } from 'react';

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
  /** Callback when "Exit to Main Menu" is selected (Phase 5.3.1) */
  onExitToMainMenu?: () => void;
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
  onExitToMainMenu,
  loading = false,
}: MainMenuProps) {
  // Number key shortcuts (1-5)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC: Close menu
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Number key shortcuts (1-5)
      if (loading) return; // Disable all shortcuts when loading

      if (e.key === '1') {
        e.preventDefault();
        onSave();
      } else if (e.key === '2') {
        e.preventDefault();
        onLoad();
      } else if (e.key === '4') {
        e.preventDefault();
        onRestart();
      } else if (e.key === '5' && onExitToMainMenu) {
        // Key 5: Exit to Main Menu (Phase 5.3.1)
        e.preventDefault();
        onExitToMainMenu();
      } else if (e.key === 'Enter' && onExitToMainMenu) {
        // Enter: Exit to Main Menu
        e.preventDefault();
        onExitToMainMenu();
      }
      // Key 3 (Settings) does nothing (button still disabled)
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onRestart, onLoad, onSave, onExitToMainMenu, onClose, loading]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Backdrop overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />

        {/* Menu content */}
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     bg-gray-900 border border-gray-700
                     w-full max-w-md shadow-xl
                     focus:outline-none"
          onEscapeKeyDown={onClose}
        >
          {/* Menu title */}
          <div className="border-b border-gray-700 px-6 py-4">
            <Dialog.Title className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              MENU
            </Dialog.Title>
          </div>

          {/* Menu options */}
          <div className="p-6 space-y-3">
            {/* 1. Save Game - FUNCTIONAL (Phase 5.3) */}
            <div className="border border-gray-700 p-4 bg-gray-800/50">
              <button
                onClick={onSave}
                disabled={loading}
                className="w-full text-left font-mono text-sm text-white font-bold hover:text-gray-300 hover:underline disabled:text-gray-600 disabled:no-underline transition-colors uppercase tracking-wider"
              >
                &gt;&gt; [1] SAVE GAME
              </button>
            </div>

            {/* 2. Load Game - FUNCTIONAL (Phase 5.3) */}
            <div className="border border-gray-700 p-4 bg-gray-800/50">
              <button
                onClick={onLoad}
                disabled={loading}
                className="w-full text-left font-mono text-sm text-white font-bold hover:text-gray-300 hover:underline disabled:text-gray-600 disabled:no-underline transition-colors uppercase tracking-wider"
              >
                &gt;&gt; [2] LOAD GAME
              </button>
            </div>

            {/* 3. Settings - DISABLED (Future) */}
            <div className="border border-gray-800 p-4 bg-gray-900/50 opacity-50">
              <button
                disabled
                className="w-full text-left font-mono text-sm text-gray-600 font-bold uppercase tracking-wider"
                title="Coming soon"
              >
                &gt;&gt; [3] SETTINGS
              </button>
              <div className="text-xs text-gray-600 font-mono mt-2">
                Coming soon
              </div>
            </div>

            {/* 4. Restart Case - FUNCTIONAL (RED WARNING) */}
            <div className="border border-red-900 p-4 bg-red-950/30">
              <button
                onClick={onRestart}
                disabled={loading}
                className="w-full text-left font-mono text-sm text-red-400 font-bold hover:text-red-300 hover:underline disabled:text-gray-600 disabled:no-underline transition-colors uppercase tracking-wider"
              >
                &gt;&gt; [4] RESTART CASE
              </button>
            </div>

            {/* 5. Exit to Main Menu - FUNCTIONAL (Phase 5.3.1) */}
            {onExitToMainMenu && (
              <div className="border border-gray-700 p-4 bg-gray-800/50">
                <button
                  onClick={onExitToMainMenu}
                  disabled={loading}
                  className="w-full text-left font-mono text-sm text-white font-bold hover:text-gray-300 hover:underline disabled:text-gray-600 disabled:no-underline transition-colors uppercase tracking-wider"
                >
                  &gt;&gt; [5] EXIT TO MAIN MENU
                </button>
              </div>
            )}
          </div>

          {/* Keyboard hint */}
          <div className="border-t border-gray-700 px-6 py-4">
            <p className="text-center text-gray-600 text-xs font-mono">
              Press ESC to close | Press 1-{onExitToMainMenu ? '5' : '4'} to select
            </p>
          </div>

          {/* Close button (X) */}
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white
                         focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none
                         p-1 transition-colors"
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
