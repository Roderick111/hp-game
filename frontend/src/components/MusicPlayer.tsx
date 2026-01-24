/**
 * MusicPlayer Component
 *
 * Hidden audio element that syncs with MusicContext state.
 * Auto-detects music file based on case ID.
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

  const {
    volume,
    muted,
    enabled,
    isPlaying,
    setIsPlaying,
    setTrack,
  } = useMusic();

  // Generate music file path from case ID
  const getMusicPath = useCallback((id: string): string => {
    return `/music/case_${id.replace('case_', '')}_default.mp3`;
  }, []);

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

  // Update track when case changes
  useEffect(() => {
    if (!caseId) {
      setTrack(null);
      return;
    }

    // Avoid reloading same case
    if (lastCaseIdRef.current === caseId) return;
    lastCaseIdRef.current = caseId;

    const musicPath = getMusicPath(caseId);
    setTrack(musicPath);
    hasAttemptedPlayRef.current = false;

    const audio = audioRef.current;
    if (!audio) return;

    // Load new track
    audio.src = musicPath;
    audio.load();
  }, [caseId, getMusicPath, setTrack]);

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

  // Handle enabled state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (enabled && caseId && audio.src) {
      // Try to play when enabled
      audio.play().catch(() => {
        // Autoplay blocked - silent fallback
      });
    } else {
      audio.pause();
    }
  }, [enabled, caseId]);

  // Handle external play/pause requests via isPlaying state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio?.src) return;

    if (isPlaying && enabled) {
      audio.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, enabled, setIsPlaying]);

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

  // Cleanup on unmount
  useEffect(() => {
    // Capture ref value for cleanup
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
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
