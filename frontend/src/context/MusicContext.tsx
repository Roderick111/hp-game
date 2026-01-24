/**
 * MusicContext
 *
 * Provides music state management for background audio playback.
 * Persists volume/mute preferences to localStorage.
 *
 * @module context/MusicContext
 * @since Phase 6.5 (Music Ambience)
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

// ============================================
// Constants
// ============================================

const STORAGE_KEY_VOLUME = 'hp-detective-music-volume';
const STORAGE_KEY_MUTED = 'hp-detective-music-muted';
const STORAGE_KEY_ENABLED = 'hp-detective-music-enabled';

const DEFAULT_VOLUME = 50;

// ============================================
// Types
// ============================================

interface MusicContextValue {
  /** Current volume (0-100) */
  volume: number;
  /** Whether music is muted */
  muted: boolean;
  /** Whether music playback is enabled */
  enabled: boolean;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Current track path (e.g., /music/case_001_default.mp3) */
  currentTrack: string | null;
  /** Set volume (0-100) */
  setVolume: (volume: number) => void;
  /** Set muted state */
  setMuted: (muted: boolean) => void;
  /** Toggle mute on/off */
  toggleMute: () => void;
  /** Enable/disable music */
  setEnabled: (enabled: boolean) => void;
  /** Set current track path */
  setTrack: (trackPath: string | null) => void;
  /** Set playing state (used by MusicPlayer) */
  setIsPlaying: (playing: boolean) => void;
  /** Play music */
  play: () => void;
  /** Pause music */
  pause: () => void;
  /** Toggle play/pause */
  togglePlayback: () => void;
}

interface MusicProviderProps {
  children: ReactNode;
}

// ============================================
// Context
// ============================================

const MusicContext = createContext<MusicContextValue | null>(null);

// ============================================
// Helper Functions
// ============================================

/** Get initial volume from localStorage or default */
function getInitialVolume(): number {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY_VOLUME);
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        return parsed;
      }
    }
  }
  return DEFAULT_VOLUME;
}

/** Get initial muted state from localStorage or default */
function getInitialMuted(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY_MUTED);
    return stored === 'true';
  }
  return false;
}

/** Get initial enabled state from localStorage or default */
function getInitialEnabled(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY_ENABLED);
    // Default to true if not set
    return stored !== 'false';
  }
  return true;
}

// ============================================
// Provider Component
// ============================================

export function MusicProvider({ children }: MusicProviderProps) {
  const [volume, setVolumeState] = useState<number>(getInitialVolume);
  const [muted, setMutedState] = useState<boolean>(getInitialMuted);
  const [enabled, setEnabledState] = useState<boolean>(getInitialEnabled);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);

  // Playback request state (for communicating with MusicPlayer)
  const [playbackRequested, setPlaybackRequested] = useState<boolean>(false);

  // Persist volume to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_VOLUME, String(volume));
    }
  }, [volume]);

  // Persist muted to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_MUTED, String(muted));
    }
  }, [muted]);

  // Persist enabled to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ENABLED, String(enabled));
    }
  }, [enabled]);

  const setVolume = useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(100, newVolume));
    setVolumeState(clamped);
  }, []);

  const setMuted = useCallback((newMuted: boolean) => {
    setMutedState(newMuted);
  }, []);

  const toggleMute = useCallback(() => {
    setMutedState((prev) => !prev);
  }, []);

  const setEnabled = useCallback((newEnabled: boolean) => {
    setEnabledState(newEnabled);
    if (!newEnabled) {
      setIsPlaying(false);
    }
  }, []);

  const setTrack = useCallback((trackPath: string | null) => {
    setCurrentTrack(trackPath);
  }, []);

  const play = useCallback(() => {
    if (enabled) {
      setPlaybackRequested(true);
    }
  }, [enabled]);

  const pause = useCallback(() => {
    setPlaybackRequested(false);
    setIsPlaying(false);
  }, []);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // Sync playback request with playing state
  useEffect(() => {
    if (playbackRequested && enabled && currentTrack) {
      // MusicPlayer will handle actual playback and call setIsPlaying
    }
  }, [playbackRequested, enabled, currentTrack]);

  const value: MusicContextValue = {
    volume,
    muted,
    enabled,
    isPlaying,
    currentTrack,
    setVolume,
    setMuted,
    toggleMute,
    setEnabled,
    setTrack,
    setIsPlaying,
    play,
    pause,
    togglePlayback,
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

/**
 * Hook to access music context
 * @returns Music context value with volume, mute, and playback controls
 * @throws Error if used outside MusicProvider
 */
export function useMusic(): MusicContextValue {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}

// ============================================
// Exports
// ============================================

export type { MusicContextValue, MusicProviderProps };
