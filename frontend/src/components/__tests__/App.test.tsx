/**
 * App Integration Tests
 *
 * Tests for the main application integration including:
 * - Initial loading state
 * - Layout rendering
 * - State management
 * - Save/Load functionality
 *
 * @module components/__tests__/App.test
 * @since Phase 1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import * as api from '../../api/client';
import type { LocationResponse, LoadResponse } from '../../types/investigation';

// ============================================
// Mocks
// ============================================

vi.mock('../../api/client', () => ({
  loadState: vi.fn(),
  saveState: vi.fn(),
  getLocation: vi.fn(),
  investigate: vi.fn(),
  getWitnesses: vi.fn(),
  interrogateWitness: vi.fn(),
  presentEvidence: vi.fn(),
  getEvidenceDetails: vi.fn(),
}));

// ============================================
// Test Data
// ============================================

const mockLocationData: LocationResponse = {
  id: 'library',
  name: 'Hogwarts Library - Crime Scene',
  description: 'You enter the library. A heavy oak desk dominates the center.',
  surface_elements: [
    'Oak desk with scattered papers',
    'Dark arts books on shelves',
  ],
};

const mockLoadedState: LoadResponse = {
  case_id: 'case_001',
  current_location: 'library',
  discovered_evidence: ['hidden_note'],
  visited_locations: ['library'],
};

// Unused - but keeping for reference
// const mockInvestigateResponse: InvestigateResponse = {
//   narrator_response: 'You examine the area carefully.',
//   new_evidence: [],
//   already_discovered: false,
// };

// ============================================
// Test Suite
// ============================================

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ------------------------------------------
  // Loading State Tests
  // ------------------------------------------

  describe('Loading State', () => {
    it('shows loading indicator on initial mount', async () => {
      // Create promises that won't resolve immediately
      let resolveLoad: (value: LoadResponse | null) => void;
      const loadPromise = new Promise<LoadResponse | null>((resolve) => {
        resolveLoad = resolve;
      });

      let resolveLocation: (value: LocationResponse) => void;
      const locationPromise = new Promise<LocationResponse>((resolve) => {
        resolveLocation = resolve;
      });

      vi.mocked(api.loadState).mockReturnValueOnce(loadPromise);
      vi.mocked(api.getLocation).mockReturnValueOnce(locationPromise);
      vi.mocked(api.getWitnesses).mockResolvedValue([]);

      render(<App />);

      // Should show loading state
      expect(screen.getByText(/Initializing Investigation/i)).toBeInTheDocument();

      // Resolve promises
      resolveLoad!(null);
      resolveLocation!(mockLocationData);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText(/Initializing Investigation/i)).not.toBeInTheDocument();
      });
    });
  });

  // ------------------------------------------
  // Layout Tests
  // ------------------------------------------

  describe('Layout', () => {
    beforeEach(() => {
      vi.mocked(api.loadState).mockResolvedValue(null);
      vi.mocked(api.getLocation).mockResolvedValue(mockLocationData);
      vi.mocked(api.getWitnesses).mockResolvedValue([]);
    });

    it('renders header with title', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: /AUROR ACADEMY/i })).toBeInTheDocument();
      });
    });

    it('renders save button', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^Save$/i })).toBeInTheDocument();
      });
    });

    it('renders load button', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Load/i })).toBeInTheDocument();
      });
    });

    it('renders LocationView component', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Hogwarts Library - Crime Scene/i)).toBeInTheDocument();
      });
    });

    it('renders EvidenceBoard component', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Evidence Board/i)).toBeInTheDocument();
      });
    });

    it('renders Case Status panel', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Case Status/i)).toBeInTheDocument();
      });
    });

    it('renders Quick Help panel', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Quick Help/i)).toBeInTheDocument();
      });
    });
  });

  // ------------------------------------------
  // State Integration Tests
  // ------------------------------------------

  describe('State Integration', () => {
    it('loads saved state on mount', async () => {
      vi.mocked(api.loadState).mockResolvedValue(mockLoadedState);
      vi.mocked(api.getLocation).mockResolvedValue(mockLocationData);
      vi.mocked(api.getWitnesses).mockResolvedValue([]);

      render(<App />);

      await waitFor(() => {
        // Evidence from saved state should appear
        expect(screen.getByText(/Hidden Note/i)).toBeInTheDocument();
      });
    });

    it('displays evidence count from loaded state', async () => {
      vi.mocked(api.loadState).mockResolvedValue(mockLoadedState);
      vi.mocked(api.getLocation).mockResolvedValue(mockLocationData);
      vi.mocked(api.getWitnesses).mockResolvedValue([]);

      render(<App />);

      await waitFor(() => {
        // Evidence count should reflect loaded state (1 item) - now shown in EvidenceBoard subtitle
        expect(screen.getByText(/1 ITEM$/i)).toBeInTheDocument();
      });
    });

    it('starts with empty state when no saved state exists', async () => {
      vi.mocked(api.loadState).mockResolvedValue(null);
      vi.mocked(api.getLocation).mockResolvedValue(mockLocationData);
      vi.mocked(api.getWitnesses).mockResolvedValue([]);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/No evidence discovered yet/i)).toBeInTheDocument();
      });
    });
  });

  // ------------------------------------------
  // Save/Load Tests
  // ------------------------------------------

  describe('Save/Load', () => {
    beforeEach(() => {
      vi.mocked(api.loadState).mockResolvedValue(null);
      vi.mocked(api.getLocation).mockResolvedValue(mockLocationData);
      vi.mocked(api.getWitnesses).mockResolvedValue([]);
    });

    it('calls saveState when save button clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(api.saveState).mockResolvedValue({ success: true });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^Save$/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /^Save$/i });
      await user.click(saveButton);

      expect(api.saveState).toHaveBeenCalled();
    });

    it('calls loadState when load button clicked', async () => {
      const user = userEvent.setup();

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Load/i })).toBeInTheDocument();
      });

      // Clear mock calls from initial load
      vi.mocked(api.loadState).mockClear();

      const loadButton = screen.getByRole('button', { name: /Load/i });
      await user.click(loadButton);

      expect(api.loadState).toHaveBeenCalled();
    });

    it('shows error when save fails', async () => {
      const user = userEvent.setup();
      vi.mocked(api.saveState).mockRejectedValue({
        status: 500,
        message: 'Failed to save progress',
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^Save$/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /^Save$/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to save progress/i)).toBeInTheDocument();
      });
    });

    it('dismisses error when X clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(api.saveState).mockRejectedValue({
        status: 500,
        message: 'Failed to save progress',
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^Save$/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /^Save$/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to save progress/i)).toBeInTheDocument();
      });

      const dismissButton = screen.getByLabelText(/Dismiss error/i);
      await user.click(dismissButton);

      expect(screen.queryByText(/Failed to save progress/i)).not.toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Evidence Discovery Flow Tests
  // ------------------------------------------

  describe('Evidence Discovery Flow', () => {
    beforeEach(() => {
      vi.mocked(api.loadState).mockResolvedValue(null);
      vi.mocked(api.getLocation).mockResolvedValue(mockLocationData);
      vi.mocked(api.getWitnesses).mockResolvedValue([]);
    });

    it('updates evidence board when evidence discovered', async () => {
      const user = userEvent.setup();

      // First call discovers evidence
      vi.mocked(api.investigate).mockResolvedValueOnce({
        narrator_response: 'You find a hidden note under the desk.',
        new_evidence: ['hidden_note'],
        already_discovered: false,
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/describe your action/i)).toBeInTheDocument();
      });

      // Type and submit with Ctrl+Enter (no Investigate button anymore)
      const textarea = screen.getByPlaceholderText(/describe your action/i);
      await user.type(textarea, 'I search under the desk');
      await user.keyboard('{Control>}{Enter}{/Control}');

      // Wait for evidence count to update in Evidence Board (subtitle format)
      await waitFor(() => {
        expect(screen.getByText(/1 ITEM$/i)).toBeInTheDocument();
      });
    });

    it('updates evidence count in case status', async () => {
      const user = userEvent.setup();

      vi.mocked(api.investigate).mockResolvedValueOnce({
        narrator_response: 'You find evidence.',
        new_evidence: ['hidden_note'],
        already_discovered: false,
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/describe your action/i)).toBeInTheDocument();
      });

      // Initially 0 evidence
      expect(screen.getByText(/0 items/i)).toBeInTheDocument();

      // Discover evidence with Ctrl+Enter
      const textarea = screen.getByPlaceholderText(/describe your action/i);
      await user.type(textarea, 'I search');
      await user.keyboard('{Control>}{Enter}{/Control}');

      // Wait for count to update (uses EvidenceBoard subtitle format now)
      await waitFor(() => {
        // Evidence count shown in EvidenceBoard subtitle
        expect(screen.getByText(/1 ITEM$/i)).toBeInTheDocument();
      });
    });
  });
});
