/**
 * useMusic Hook
 *
 * Convenience re-export of useMusic hook from context.
 * Provides type-safe access to music state and controls.
 *
 * @module hooks/useMusic
 * @since Phase 6.5 (Music Ambience)
 */

// Re-export from context for consistent import pattern
export { useMusic } from '../context/useMusic';
export type { MusicContextValue } from '../context/MusicContext';
export type { Track } from '../context/MusicContext';
