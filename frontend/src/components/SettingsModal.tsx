/**
 * SettingsModal Component
 *
 * Modal for game settings, including theme toggle, narrator verbosity,
 * and audio controls with track switching.
 * Accessible via System Menu > Settings.
 *
 * @module components/SettingsModal
 * @since Phase 5.7 (Theme Support)
 */

import * as Dialog from '@radix-ui/react-dialog';
import { useState, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useMusic } from '../hooks/useMusic';

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

  // Music context for audio controls
  const {
    volume: musicVolume,
    muted: musicMuted,
    enabled: musicEnabled,
    isPlaying: musicPlaying,
    tracks,
    currentTrackName,
    setVolume: setMusicVolume,
    toggleMute: toggleMusicMute,
    setEnabled: setMusicEnabled,
    togglePlayback: toggleMusicPlayback,
    nextTrack,
    prevTrack,
  } = useMusic();

  // Handle volume slider change
  const handleVolumeChange = useCallback((newVolume: number) => {
    setMusicVolume(newVolume);
  }, [setMusicVolume]);

  // Handle music enable/disable toggle
  const handleMusicToggle = useCallback(() => {
    setMusicEnabled(!musicEnabled);
  }, [musicEnabled, setMusicEnabled]);

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    toggleMusicPlayback();
  }, [toggleMusicPlayback]);

  // Handle next track
  const handleNextTrack = useCallback(() => {
    nextTrack();
  }, [nextTrack]);

  // Handle previous track
  const handlePrevTrack = useCallback(() => {
    prevTrack();
  }, [prevTrack]);

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
              <h3 className={`${theme.colors.text.primary} font-mono text-xs font-bold uppercase tracking-wider`}>
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
                    <span className="text-lg">🌙</span>
                    <span className={`text-sm ${theme.colors.text.tertiary}`}>CRT DARK</span>
                  </div>
                  {mode === 'dark' && (
                    <div className={`${theme.typography.helper} mt-1`}>
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
                    <span className="text-lg">☀️</span>
                    <span className={`text-sm ${theme.colors.text.tertiary}`}>LCARS LIGHT</span>
                  </div>
                  {mode === 'light' && (
                    <div className={`${theme.typography.helper} mt-1`}>
                      {theme.symbols.checkmark} ACTIVE
                    </div>
                  )}
                </button>
              </div>

              {/* Theme Description */}
              <p className={`${theme.typography.helper} italic`}>
                {mode === 'dark'
                  ? 'Classic CRT terminal with scanlines and glow effects.'
                  : 'Modern light interface, easier on the eyes in bright environments.'}
              </p>
            </div>

            {/* Divider */}
            <div className={`border-t ${theme.colors.border.separator}`}></div>

            {/* Narrator Verbosity Section */}
            <div className="space-y-3">
              <h3 className={`${theme.colors.text.primary} font-mono text-xs font-bold uppercase tracking-wider`}>
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
                    <span className={theme.colors.text.tertiary}>CONCISE</span>
                    {selectedVerbosity === 'concise' && (
                      <span className={theme.typography.helper}>
                        {theme.symbols.checkmark} ACTIVE
                      </span>
                    )}
                  </div>
                  <div className={`${theme.typography.helper} mt-1 normal-case`}>
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
                    <span className={theme.colors.text.tertiary}>STORYTELLER</span>
                    {selectedVerbosity === 'storyteller' && (
                      <span className={theme.typography.helper}>
                        {theme.symbols.checkmark} ACTIVE
                      </span>
                    )}
                  </div>
                  <div className={`${theme.typography.helper} mt-1 normal-case`}>
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
                    <span className={theme.colors.text.tertiary}>ATMOSPHERIC</span>
                    {selectedVerbosity === 'atmospheric' && (
                      <span className={theme.typography.helper}>
                        {theme.symbols.checkmark} ACTIVE
                      </span>
                    )}
                  </div>
                  <div className={`${theme.typography.helper} mt-1 normal-case`}>
                    Rich, immersive, detailed prose
                  </div>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className={`border-t ${theme.colors.border.separator}`}></div>

            {/* Audio Settings */}
            <div className="space-y-3">
              <h3 className={`${theme.colors.text.primary} font-mono text-xs font-bold uppercase tracking-wider`}>
                AUDIO
              </h3>

              {/* Music Enable/Disable Toggle */}
              <div className="flex items-center justify-between">
                <span className={`${theme.typography.helper}`}>
                  Background Music
                </span>
                <button
                  onClick={handleMusicToggle}
                  className={`px-3 py-1 border rounded-sm font-mono text-xs uppercase tracking-wider transition-all duration-200
                    ${musicEnabled
                      ? `${theme.colors.interactive.border} ${theme.colors.interactive.text}`
                      : `${theme.colors.border.default} ${theme.colors.text.muted}`
                    }`}
                  aria-label={musicEnabled ? 'Disable background music' : 'Enable background music'}
                >
                  {musicEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Current Track Display */}
              <div className="flex items-center justify-between">
                <span className={theme.typography.helper}>
                  Current Track
                </span>
                <span
                  className={`${theme.typography.helper} truncate max-w-[180px]`}
                  title={currentTrackName}
                >
                  {currentTrackName}
                </span>
              </div>

              {/* Track Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevTrack}
                  disabled={!musicEnabled || tracks.length <= 1}
                  className={`flex-1 py-2 px-3 border rounded-sm font-mono text-xs uppercase tracking-wider transition-all duration-200
                    ${musicEnabled && tracks.length > 1
                      ? `${theme.colors.border.default} ${theme.colors.text.muted} ${theme.colors.border.hoverClass}`
                      : 'opacity-50 cursor-not-allowed'
                    }`}
                  aria-label="Previous track"
                >
                  PREV
                </button>
                <button
                  onClick={handleNextTrack}
                  disabled={!musicEnabled || tracks.length <= 1}
                  className={`flex-1 py-2 px-3 border rounded-sm font-mono text-xs uppercase tracking-wider transition-all duration-200
                    ${musicEnabled && tracks.length > 1
                      ? `${theme.colors.border.default} ${theme.colors.text.muted} ${theme.colors.border.hoverClass}`
                      : 'opacity-50 cursor-not-allowed'
                    }`}
                  aria-label="Next track"
                >
                  NEXT
                </button>
              </div>

              {/* Volume Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="music-volume-slider"
                    className={theme.typography.helper}
                  >
                    Volume
                  </label>
                  <span className={`${theme.typography.helper} tabular-nums`}>
                    {musicVolume}%
                  </span>
                </div>
                <input
                  id="music-volume-slider"
                  type="range"
                  min="0"
                  max="100"
                  value={musicVolume}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
                  disabled={!musicEnabled}
                  className={`w-full h-2 rounded-sm appearance-none cursor-pointer
                    ${musicEnabled
                      ? `${theme.colors.bg.hover}`
                      : 'opacity-50 cursor-not-allowed'
                    }
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-amber-500
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:w-4
                    [&::-moz-range-thumb]:h-4
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-amber-500
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:cursor-pointer`}
                  aria-label="Music volume"
                />
              </div>

              {/* Playback Controls */}
              <div className="flex items-center gap-2">
                {/* Play/Pause Button */}
                <button
                  onClick={handlePlayPause}
                  disabled={!musicEnabled}
                  className={`flex-1 py-2 px-3 border rounded-sm font-mono text-xs uppercase tracking-wider transition-all duration-200
                    ${musicEnabled
                      ? `${theme.colors.border.default} ${theme.colors.text.muted} ${theme.colors.border.hoverClass}`
                      : 'opacity-50 cursor-not-allowed'
                    }`}
                  aria-label={musicPlaying ? 'Pause music' : 'Play music'}
                >
                  {musicPlaying ? 'PAUSE' : 'PLAY'}
                </button>

                {/* Mute Button */}
                <button
                  onClick={toggleMusicMute}
                  disabled={!musicEnabled}
                  className={`py-2 px-3 border rounded-sm font-mono text-xs uppercase tracking-wider transition-all duration-200
                    ${musicMuted && musicEnabled
                      ? `${theme.colors.interactive.border} ${theme.colors.interactive.text}`
                      : musicEnabled
                        ? `${theme.colors.border.default} ${theme.colors.text.muted} ${theme.colors.border.hoverClass}`
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                  aria-label={musicMuted ? 'Unmute music' : 'Mute music'}
                >
                  {musicMuted ? 'MUTED' : 'MUTE'}
                </button>
              </div>

              {/* Status Indicator */}
              <p className={`${theme.typography.helper} italic`}>
                {!musicEnabled
                  ? 'Music is disabled.'
                  : musicPlaying
                    ? musicMuted
                      ? 'Playing (muted)'
                      : 'Playing'
                    : 'Paused'}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className={`border-t ${theme.colors.interactive.border} px-6 py-3 ${theme.colors.bg.semiTransparent}`}>
            <p className={`text-center ${theme.typography.helper} uppercase tracking-widest`}>
              Press ESC to close
            </p>
          </div>

          {/* Close button (X) */}
          <Dialog.Close asChild>
            <button
              className={`absolute top-4 right-4 ${theme.colors.text.muted} ${theme.colors.text.primaryHover}
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
