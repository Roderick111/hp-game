/**
 * useMusic Hook
 *
 * Convenience re-export of useMusic hook from MusicContext.
 * Provides type-safe access to music state and controls.
 *
 * @module hooks/useMusic
 * @since Phase 6.5 (Music Ambience)
 */

// Re-export from context for consistent import pattern
export { useMusic } from '../context/MusicContext';
export type { MusicContextValue, Track } from '../context/MusicContext';
