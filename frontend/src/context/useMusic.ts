/**
 * useMusic hook
 * Access music context for volume, mute, and playback controls.
 */

import { useContext, type Context } from 'react';
import { MusicContext, type MusicContextValue } from './MusicContext';

/**
 * Hook to access music context
 * @returns Music context value with volume, mute, and playback controls
 * @throws Error if used outside MusicProvider
 */
export function useMusic(): MusicContextValue {
  const context = useContext(MusicContext as unknown as Context<MusicContextValue>);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}
