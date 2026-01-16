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

  // Common button class for consistency (rounded-sm for terminal-style sharp corners)
  const menuButtonClass = "w-full text-left font-mono text-sm font-bold uppercase tracking-wider py-3 px-4 border rounded-sm transition-all duration-200 flex items-center gap-3";

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Backdrop overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-[1px]" />

        {/* Menu content */}
        <Dialog.Content
          className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     ${TERMINAL_THEME.colors.bg.primary} border ${TERMINAL_THEME.colors.interactive.border} rounded-sm
                     w-full max-w-sm shadow-2xl
                     focus:outline-none`}
          onEscapeKeyDown={onClose}
        >
          {/* Menu title */}
          <div className={`border-b ${TERMINAL_THEME.colors.interactive.border} px-6 py-4 flex items-center justify-between ${TERMINAL_THEME.colors.bg.semiTransparent}`}>
            <Dialog.Title className={`${TERMINAL_THEME.typography.headerLg} ${TERMINAL_THEME.colors.interactive.text}`}>
              SYSTEM MENU
            </Dialog.Title>
          </div>

          {/* Menu options */}
          <div className="p-6 space-y-3">
            {/* 1. Save Game - FUNCTIONAL (Phase 5.3) */}
            <button
              onClick={onSave}
              disabled={loading}
              className={`${menuButtonClass} ${TERMINAL_THEME.colors.bg.semiTransparent} ${TERMINAL_THEME.colors.border.default} ${TERMINAL_THEME.colors.text.secondary} ${TERMINAL_THEME.colors.interactive.borderHover} ${TERMINAL_THEME.colors.interactive.hover} ${TERMINAL_THEME.colors.bg.hover} disabled:opacity-50`}
            >
              <span className={`${TERMINAL_THEME.colors.text.muted} font-normal`}>[1]</span>
              <span className={TERMINAL_THEME.colors.interactive.text}>{TERMINAL_THEME.symbols.current}</span>
              SAVE GAME
            </button>

            {/* 2. Load Game - FUNCTIONAL (Phase 5.3) */}
            <button
              onClick={onLoad}
              disabled={loading}
              className={`${menuButtonClass} ${TERMINAL_THEME.colors.bg.semiTransparent} ${TERMINAL_THEME.colors.border.default} ${TERMINAL_THEME.colors.text.secondary} ${TERMINAL_THEME.colors.interactive.borderHover} ${TERMINAL_THEME.colors.interactive.hover} ${TERMINAL_THEME.colors.bg.hover} disabled:opacity-50`}
            >
              <span className={`${TERMINAL_THEME.colors.text.muted} font-normal`}>[2]</span>
              <span className={TERMINAL_THEME.colors.interactive.text}>{TERMINAL_THEME.symbols.current}</span>
              LOAD GAME
            </button>

            {/* 3. Settings - DISABLED (Future) */}
            <button
              disabled
              className={`${menuButtonClass} ${TERMINAL_THEME.colors.bg.primary}/50 ${TERMINAL_THEME.colors.border.separator} ${TERMINAL_THEME.colors.text.separator} cursor-not-allowed`}
              title="Coming soon"
            >
              <span className={`${TERMINAL_THEME.colors.text.separator} font-normal`}>[3]</span>
              <span className={TERMINAL_THEME.colors.text.separator}>{TERMINAL_THEME.symbols.bullet}</span>
              SETTINGS <span className="text-[10px] ml-auto opacity-50 lowercase font-normal">(soon)</span>
            </button>

            {/* Divider */}
            <div className={`border-t ${TERMINAL_THEME.colors.border.separator} my-2`}></div>

            {/* 4. Restart Case - FUNCTIONAL (RED WARNING) */}
            <button
              onClick={onRestart}
              disabled={loading}
              className={`${menuButtonClass} ${TERMINAL_THEME.colors.state.error.bgLight} ${TERMINAL_THEME.colors.state.error.border} ${TERMINAL_THEME.colors.state.error.text} hover:border-red-600 hover:text-red-300 hover:bg-red-900/30 disabled:opacity-50`}
            >
              <span className={`text-red-700 font-normal`}>[4]</span>
              <span className={TERMINAL_THEME.colors.state.error.text}>{TERMINAL_THEME.symbols.warning}</span>
              RESTART CASE
            </button>

            {/* 5. Exit to Main Menu - FUNCTIONAL (Phase 5.3.1) */}
            {onExitToMainMenu && (
              <button
                onClick={onExitToMainMenu}
                disabled={loading}
                className={`${menuButtonClass} ${TERMINAL_THEME.colors.bg.semiTransparent} ${TERMINAL_THEME.colors.border.default} ${TERMINAL_THEME.colors.text.tertiary} ${TERMINAL_THEME.colors.interactive.borderHover} ${TERMINAL_THEME.colors.interactive.hover} ${TERMINAL_THEME.colors.bg.hover} disabled:opacity-50`}
              >
                <span className={`${TERMINAL_THEME.colors.text.muted} font-normal`}>[5]</span>
                <span className={TERMINAL_THEME.colors.text.muted}>{TERMINAL_THEME.symbols.cross}</span>
                EXIT TO TITLE
              </button>
            )}
          </div>

          {/* Keyboard hint */}
          <div className={`border-t ${TERMINAL_THEME.colors.interactive.border} px-6 py-3 ${TERMINAL_THEME.colors.bg.semiTransparent}`}>
            <p className={`text-center ${TERMINAL_THEME.colors.text.muted} text-[10px] font-mono uppercase tracking-widest`}>
              Press ESC to close
            </p>
          </div>

          {/* Close button (X) */}
          <Dialog.Close asChild>
            <button
              className={`absolute top-4 right-4 ${TERMINAL_THEME.colors.text.muted} hover:text-white
                         focus-visible:outline-none
                         transition-colors font-mono text-base`}
              aria-label="Close menu"
            >
              {TERMINAL_THEME.symbols.closeButton}
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default MainMenu;
