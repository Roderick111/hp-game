/**
 * Test providers wrapper
 * Provides all required context providers for tests.
 */

import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';

export function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <MemoryRouter>{children}</MemoryRouter>
    </ThemeProvider>
  );
}
