/**
 * MusicPlayer Component
 *
 * Hidden audio element that syncs with MusicContext state.
 * Loads track manifest and auto-detects default track based on case ID.
 * Handles browser autoplay policy and missing files gracefully.
 *
 * @module components/MusicPlayer
 * @since Phase 6.5 (Music Ambience)
 */

import { useRef, useEffect, useCallback } from 'react';
import { useMusic } from '../hooks/useMusic';

// ============================================
// Types
// ============================================

interface MusicPlayerProps {
  /** Current case ID for auto-detecting music file */
  caseId: string | null;
}

// ============================================
// Component
// ============================================

export function MusicPlayer({ caseId }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasAttemptedPlayRef = useRef(false);
  const lastCaseIdRef = useRef<string | null>(null);
  const manifestLoadedRef = useRef(false);

  const {
    volume,
    muted,
    enabled,
    tracks,
    setIsPlaying,
    setTrack,
    registerAudio,
    loadManifest,
    getSavedTrackForCase,
    selectTrack,
    setCaseId,
    currentTrackIndex,
  } = useMusic();

  // Handle audio load error (missing file) - silent fallback
  const handleError = useCallback(() => {
    // Silent fallback: don't crash, don't show error
    // Just mark as not playing
    setIsPlaying(false);
    setTrack(null);
  }, [setIsPlaying, setTrack]);

  // Handle audio can play event
  const handleCanPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !enabled) return;

    // Try to play when audio is ready
    if (!hasAttemptedPlayRef.current) {
      hasAttemptedPlayRef.current = true;
      audio.play().catch(() => {
        // Autoplay blocked by browser policy - silently handle
        // User can click play button in settings to start
        setIsPlaying(false);
      });
    }
  }, [enabled, setIsPlaying]);

  // Handle play event from audio element
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, [setIsPlaying]);

  // Handle pause event from audio element
  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, [setIsPlaying]);

  // Load manifest on mount
  useEffect(() => {
    if (!manifestLoadedRef.current) {
      manifestLoadedRef.current = true;
      void loadManifest();
    }
  }, [loadManifest]);

  // Initialize track when case changes or tracks become available
  useEffect(() => {
    if (!caseId || tracks.length === 0) return;

    // Update case ID in context
    setCaseId(caseId);

    // Skip if we already handled this case
    if (lastCaseIdRef.current === caseId) return;
    lastCaseIdRef.current = caseId;

    const audio = audioRef.current;
    if (!audio) return;

    // Check for saved track selection for this case
    const savedTrackId = getSavedTrackForCase(caseId);

    let trackIndex = -1;

    if (savedTrackId) {
      // User has a saved track preference for this case
      trackIndex = tracks.findIndex((t) => t.id === savedTrackId);
    }

    if (trackIndex === -1) {
      // No saved track - try to find case default
      const caseNumber = caseId.replace('case_', '');
      const defaultTrackId = `case_${caseNumber}_default`;
      trackIndex = tracks.findIndex((t) => t.id === defaultTrackId);
    }

    if (trackIndex === -1) {
      // No case default found - use first track
      trackIndex = 0;
    }

    // Select the track (this will update audio.src and save to localStorage)
    const track = tracks[trackIndex];
    const trackPath = `/music/${track.file}`;

    hasAttemptedPlayRef.current = false;

    // Load new track
    audio.src = trackPath;
    audio.load();

    // Update context
    setTrack(trackPath);
    selectTrack(trackIndex, caseId);
  }, [caseId, tracks, getSavedTrackForCase, setCaseId, setTrack, selectTrack]);

  // Handle track changes from context (next/prev buttons)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || tracks.length === 0) return;

    const track = tracks[currentTrackIndex];
    if (!track) return;

    const expectedPath = `/music/${track.file}`;
    const currentSrc = audio.src ? new URL(audio.src).pathname : '';

    // Only update if the source actually needs to change
    if (currentSrc !== expectedPath) {
      const wasPlaying = !audio.paused;
      audio.src = expectedPath;
      audio.load();
      if (wasPlaying && enabled) {
        audio.play().catch(() => {
          setIsPlaying(false);
        });
      }
    }
  }, [currentTrackIndex, tracks, enabled, setIsPlaying]);

  // Sync volume with audio element (convert 0-100 to 0-1)
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume / 100;
    }
  }, [volume]);

  // Sync muted state with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = muted;
    }
  }, [muted]);

  // Handle enabled state changes - only pause when disabled
  // MusicContext now controls play() directly via audioRef for user gesture compliance
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Only pause when music is disabled - don't auto-play (MusicContext handles that)
    if (!enabled) {
      audio.pause();
      setIsPlaying(false);
    }
  }, [enabled, setIsPlaying]);

  // Register event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [handleError, handleCanPlay, handlePlay, handlePause]);

  // Register audio element with context for direct playback control
  // This enables synchronous play() calls from user gestures
  useEffect(() => {
    const audio = audioRef.current;
    registerAudio(audio);

    return () => {
      registerAudio(null);
    };
  }, [registerAudio]);

  // Cleanup on unmount - just pause, don't clear src
  // This allows music to resume if component remounts quickly
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
        // Don't clear src - let it resume if remounting
      }
    };
  }, []);

  return (
    <audio
      ref={audioRef}
      loop
      preload="auto"
      aria-hidden="true"
      style={{ display: 'none' }}
    />
  );
}

export default MusicPlayer;
