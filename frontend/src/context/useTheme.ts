/**
 * useTheme hook
 * Access theme context for mode and theme controls.
 */

import { useContext, type Context } from 'react';
import { ThemeContext, type ThemeContextValue } from './ThemeContext';

export type { ThemeContextValue };

/**
 * Hook to access theme context
 * @returns Theme context value with mode, theme object, and toggle function
 * @throws Error if used outside ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext as unknown as Context<ThemeContextValue>);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
