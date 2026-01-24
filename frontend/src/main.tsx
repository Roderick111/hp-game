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
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { MusicProvider } from './context/MusicContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <MusicProvider>
        <App />
      </MusicProvider>
    </ThemeProvider>
  </React.StrictMode>
);
