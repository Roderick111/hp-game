/**
 * Main Entry Point
 *
 * Vite entry point for the Phase 1 Investigation frontend.
 *
 * @module main
 * @since Phase 1, updated Phase 6.5 (Music Ambience)
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { MusicProvider } from './context/MusicContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <MusicProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </MusicProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
