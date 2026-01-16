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

import { TERMINAL_THEME } from '../styles/terminal-theme';

// ... (existing helper interface/component code if distinct, but here we update the main component block)

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

  // Common button class for consistency
  const menuButtonClass = "w-full text-left font-mono text-sm font-bold uppercase tracking-wider py-3 px-4 border transition-all duration-200 flex items-center gap-3";

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Backdrop overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-[1px]" />

        {/* Menu content */}
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     bg-gray-950 border border-gray-700
                     w-full max-w-sm shadow-2xl
                     focus:outline-none"
          onEscapeKeyDown={onClose}
        >
          {/* Menu title */}
          <div className="border-b border-gray-800 px-6 py-4 flex items-center gap-2">
            <span className="text-gray-500">{TERMINAL_THEME.symbols.block}</span>
            <Dialog.Title className="text-sm font-bold text-white font-mono uppercase tracking-[0.2em]">
              SYSTEM MENU
            </Dialog.Title>
          </div>

          {/* Menu options */}
          <div className="p-6 space-y-3">
            {/* 1. Save Game - FUNCTIONAL (Phase 5.3) */}
            <button
              onClick={onSave}
              disabled={loading}
              className={`${menuButtonClass} bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-50`}
            >
              <span className="text-gray-500 font-normal">[1]</span>
              <span className="text-amber-500">{TERMINAL_THEME.symbols.current}</span>
              SAVE GAME
            </button>

            {/* 2. Load Game - FUNCTIONAL (Phase 5.3) */}
            <button
              onClick={onLoad}
              disabled={loading}
              className={`${menuButtonClass} bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-50`}
            >
              <span className="text-gray-500 font-normal">[2]</span>
              <span className="text-amber-500">{TERMINAL_THEME.symbols.current}</span>
              LOAD GAME
            </button>

            {/* 3. Settings - DISABLED (Future) */}
            <button
              disabled
              className={`${menuButtonClass} bg-gray-900/50 border-gray-800 text-gray-600 cursor-not-allowed`}
              title="Coming soon"
            >
              <span className="text-gray-700 font-normal">[3]</span>
              <span className="text-gray-700">{TERMINAL_THEME.symbols.bullet}</span>
              SETTINGS <span className="text-[10px] ml-auto opacity-50 lowercase font-normal">(soon)</span>
            </button>

            {/* Divider */}
            <div className="border-t border-gray-800 my-2"></div>

            {/* 4. Restart Case - FUNCTIONAL (RED WARNING) */}
            <button
              onClick={onRestart}
              disabled={loading}
              className={`${menuButtonClass} bg-red-950/20 border-red-900/50 text-red-400 hover:border-red-600 hover:text-red-300 hover:bg-red-900/30 disabled:opacity-50`}
            >
              <span className="text-red-700 font-normal">[4]</span>
              <span className="text-red-500">!</span>
              RESTART CASE
            </button>

            {/* 5. Exit to Main Menu - FUNCTIONAL (Phase 5.3.1) */}
            {onExitToMainMenu && (
              <button
                onClick={onExitToMainMenu}
                disabled={loading}
                className={`${menuButtonClass} bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-50`}
              >
                <span className="text-gray-500 font-normal">[5]</span>
                <span className="text-gray-500">{TERMINAL_THEME.symbols.cross}</span>
                EXIT TO TITLE
              </button>
            )}
          </div>

          {/* Keyboard hint */}
          <div className="border-t border-gray-800 px-6 py-3 bg-gray-900/50">
            <p className="text-center text-gray-600 text-[10px] font-mono uppercase tracking-widest">
              [ ESC TO CLOSE ]
            </p>
          </div>

          {/* Close button (X) */}
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-gray-600 hover:text-white
                         focus-visible:ring-1 focus-visible:ring-gray-500 focus-visible:outline-none
                         transition-colors font-mono text-sm"
              aria-label="Close menu"
            >
              [X]
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default MainMenu;
