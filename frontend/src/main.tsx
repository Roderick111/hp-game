/**
 * Main Entry Point
 *
 * Vite entry point for the Phase 1 Investigation frontend.
 *
 * @module main
 * @since Phase 1, updated Phase 5.7 (Theme Support)
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
