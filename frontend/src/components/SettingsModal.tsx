/**
 * SettingsModal Component
 *
 * Modal for game settings, including theme toggle and narrator verbosity.
 * Accessible via System Menu > Settings.
 *
 * @module components/SettingsModal
 * @since Phase 5.7 (Theme Support)
 */

import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

// ============================================
// Types
// ============================================

export type NarratorVerbosity = 'concise' | 'storyteller' | 'atmospheric';

export interface SettingsModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Current case ID */
  caseId: string;
  /** Current player ID */
  playerId: string;
  /** Current narrator verbosity */
  narratorVerbosity: NarratorVerbosity;
  /** Callback when verbosity changes */
  onVerbosityChange?: () => void | Promise<void>;
}

// ============================================
// Component
// ============================================

export function SettingsModal({
  isOpen,
  onClose,
  caseId,
  playerId,
  narratorVerbosity,
  onVerbosityChange,
}: SettingsModalProps) {
  const { mode, toggleTheme, theme } = useTheme();
  const [updating, setUpdating] = useState(false);

  // Use prop directly, no local state needed
  const selectedVerbosity = narratorVerbosity;

  const handleVerbosityChange = async (newVerbosity: NarratorVerbosity) => {
    if (newVerbosity === selectedVerbosity || updating) return;

    setUpdating(true);
    try {
      const response = await fetch('/api/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId,
          player_id: playerId,
          narrator_verbosity: newVerbosity,
        }),
      });

      const data = await response.json() as { success: boolean; message?: string };
      if (data.success) {
        // Reload state to get updated verbosity from backend
        await onVerbosityChange?.();
      } else {
        console.error('Failed to update verbosity:', data.message);
      }
    } catch (error) {
      console.error('Error updating verbosity:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Backdrop overlay */}
        <Dialog.Overlay className={theme.components.modal.overlay} />

        {/* Modal content */}
        <Dialog.Content
          className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     ${theme.colors.bg.primary} border ${theme.colors.interactive.border} rounded-sm
                     w-full max-w-sm shadow-2xl
                     focus:outline-none`}
          onEscapeKeyDown={onClose}
        >
          {/* Header */}
          <div className={`border-b ${theme.colors.interactive.border} px-6 py-4 flex items-center justify-between ${theme.colors.bg.semiTransparent}`}>
            <Dialog.Title className={`${theme.typography.headerLg} ${theme.colors.interactive.text}`}>
              SETTINGS
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Configure game settings including theme and narrator style
            </Dialog.Description>
          </div>

          {/* Settings Content */}
          <div className="p-6 space-y-6">
            {/* Theme Toggle Section */}
            <div className="space-y-3">
              <h3 className={`${theme.typography.caption} ${theme.colors.text.tertiary}`}>
                DISPLAY MODE
              </h3>

              {/* Theme Toggle Buttons */}
              <div className="flex gap-2">
                {/* Dark Mode Button */}
                <button
                  onClick={() => mode !== 'dark' && toggleTheme()}
                  className={`flex-1 py-3 px-4 border rounded-sm font-mono text-xs uppercase tracking-wider transition-all duration-200
                    ${mode === 'dark'
                      ? `${theme.colors.interactive.border} ${theme.colors.interactive.text} ${theme.colors.bg.hover}`
                      : `${theme.colors.border.default} ${theme.colors.text.muted} ${theme.colors.border.hoverClass}`
                    }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-base">🌙</span>
                    <span>CRT DARK</span>
                  </div>
                  {mode === 'dark' && (
                    <div className={`text-[10px] mt-1 ${theme.colors.text.muted}`}>
                      {theme.symbols.checkmark} ACTIVE
                    </div>
                  )}
                </button>

                {/* Light Mode Button */}
                <button
                  onClick={() => mode !== 'light' && toggleTheme()}
                  className={`flex-1 py-3 px-4 border rounded-sm font-mono text-xs uppercase tracking-wider transition-all duration-200
                    ${mode === 'light'
                      ? `${theme.colors.interactive.border} ${theme.colors.interactive.text} ${theme.colors.bg.hover}`
                      : `${theme.colors.border.default} ${theme.colors.text.muted} ${theme.colors.border.hoverClass}`
                    }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-base">☀️</span>
                    <span>LCARS LIGHT</span>
                  </div>
                  {mode === 'light' && (
                    <div className={`text-[10px] mt-1 ${theme.colors.text.muted}`}>
                      {theme.symbols.checkmark} ACTIVE
                    </div>
                  )}
                </button>
              </div>

              {/* Theme Description */}
              <p className={`text-[10px] ${theme.colors.text.muted} italic`}>
                {mode === 'dark'
                  ? 'Classic CRT terminal with scanlines and glow effects.'
                  : 'Modern light interface, easier on the eyes in bright environments.'}
              </p>
            </div>

            {/* Divider */}
            <div className={`border-t ${theme.colors.border.separator}`}></div>

            {/* Narrator Verbosity Section */}
            <div className="space-y-3">
              <h3 className={`${theme.typography.caption} ${theme.colors.text.tertiary}`}>
                NARRATOR STYLE
              </h3>

              {/* Verbosity Buttons */}
              <div className="flex flex-col gap-2">
                {/* Concise */}
                <button
                  onClick={() => void handleVerbosityChange('concise')}
                  disabled={updating}
                  className={`w-full py-2.5 px-4 border rounded-sm font-mono text-xs uppercase tracking-wider transition-all duration-200 text-left
                    ${selectedVerbosity === 'concise'
                      ? `${theme.colors.interactive.border} ${theme.colors.interactive.text} ${theme.colors.bg.hover}`
                      : `${theme.colors.border.default} ${theme.colors.text.muted} ${theme.colors.border.hoverClass}`
                    }
                    ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span>CONCISE</span>
                    {selectedVerbosity === 'concise' && (
                      <span className={`text-[10px] ${theme.colors.text.muted}`}>
                        {theme.symbols.checkmark} ACTIVE
                      </span>
                    )}
                  </div>
                  <div className={`text-[10px] mt-1 ${theme.colors.text.muted} normal-case`}>
                    Brief, direct, facts-focused
                  </div>
                </button>

                {/* Storyteller (default) */}
                <button
                  onClick={() => void handleVerbosityChange('storyteller')}
                  disabled={updating}
                  className={`w-full py-2.5 px-4 border rounded-sm font-mono text-xs uppercase tracking-wider transition-all duration-200 text-left
                    ${selectedVerbosity === 'storyteller'
                      ? `${theme.colors.interactive.border} ${theme.colors.interactive.text} ${theme.colors.bg.hover}`
                      : `${theme.colors.border.default} ${theme.colors.text.muted} ${theme.colors.border.hoverClass}`
                    }
                    ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span>STORYTELLER</span>
                    {selectedVerbosity === 'storyteller' && (
                      <span className={`text-[10px] ${theme.colors.text.muted}`}>
                        {theme.symbols.checkmark} ACTIVE
                      </span>
                    )}
                  </div>
                  <div className={`text-[10px] mt-1 ${theme.colors.text.muted} normal-case`}>
                    Casual, conversational, engaging
                  </div>
                </button>

                {/* Atmospheric */}
                <button
                  onClick={() => void handleVerbosityChange('atmospheric')}
                  disabled={updating}
                  className={`w-full py-2.5 px-4 border rounded-sm font-mono text-xs uppercase tracking-wider transition-all duration-200 text-left
                    ${selectedVerbosity === 'atmospheric'
                      ? `${theme.colors.interactive.border} ${theme.colors.interactive.text} ${theme.colors.bg.hover}`
                      : `${theme.colors.border.default} ${theme.colors.text.muted} ${theme.colors.border.hoverClass}`
                    }
                    ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span>ATMOSPHERIC</span>
                    {selectedVerbosity === 'atmospheric' && (
                      <span className={`text-[10px] ${theme.colors.text.muted}`}>
                        {theme.symbols.checkmark} ACTIVE
                      </span>
                    )}
                  </div>
                  <div className={`text-[10px] mt-1 ${theme.colors.text.muted} normal-case`}>
                    Rich, immersive, detailed prose
                  </div>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className={`border-t ${theme.colors.border.separator}`}></div>

            {/* Future Settings Placeholder */}
            <div className="space-y-3">
              <h3 className={`${theme.typography.caption} ${theme.colors.text.separator}`}>
                AUDIO
              </h3>
              <div className={`py-2 px-3 border ${theme.colors.border.separator} rounded-sm`}>
                <span className={`text-xs ${theme.colors.text.separator} font-mono`}>
                  Coming soon...
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`border-t ${theme.colors.interactive.border} px-6 py-3 ${theme.colors.bg.semiTransparent}`}>
            <p className={`text-center ${theme.colors.text.muted} text-[10px] font-mono uppercase tracking-widest`}>
              Press ESC to close
            </p>
          </div>

          {/* Close button (X) */}
          <Dialog.Close asChild>
            <button
              className={`absolute top-4 right-4 ${theme.colors.text.muted} hover:text-white
                         focus-visible:outline-none
                         transition-colors font-mono text-base`}
              aria-label="Close settings"
            >
              {theme.symbols.closeButton}
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default SettingsModal;
