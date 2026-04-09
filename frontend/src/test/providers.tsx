/**
 * Test providers wrapper
 * Provides all required context providers for tests.
 */

import { ThemeProvider } from '../context/ThemeContext';

export function AllProviders({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
