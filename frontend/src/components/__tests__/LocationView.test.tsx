/**
 * LocationView Component Tests
 *
 * Tests for the main investigation interface including:
 * - Rendering location data
 * - Freeform input handling
 * - API integration (mocked)
 * - Loading and error states
 * - Conversation history
 * - Terminal shortcuts
 *
 * @module components/__tests__/LocationView.test
 * @since Phase 1, updated Phase 2.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationView } from '../LocationView';
import * as api from '../../api/client';
import type { LocationResponse, InvestigateResponse } from '../../types/investigation';

// ============================================
// Mocks
// ============================================

vi.mock('../../api/client', () => ({
  investigate: vi.fn(),
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
    'Frost-covered window',
  ],
};

const mockInvestigateResponse: InvestigateResponse = {
  narrator_response: 'You carefully examine the area under the desk and find a crumpled note.',
  new_evidence: ['hidden_note'],
  already_discovered: false,
};

const defaultProps = {
  caseId: 'case_001',
  locationId: 'library',
  locationData: mockLocationData,
  onEvidenceDiscovered: vi.fn(),
  discoveredEvidence: [],
};

// ============================================
// Test Suite
// ============================================

describe('LocationView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ------------------------------------------
  // Rendering Tests
  // ------------------------------------------

  describe('Rendering', () => {
    it('renders location name', () => {
      render(<LocationView {...defaultProps} />);

      expect(screen.getByText(/Hogwarts Library - Crime Scene/i)).toBeInTheDocument();
    });

    it('renders location description', () => {
      render(<LocationView {...defaultProps} />);

      expect(
        screen.getByText(/You enter the library\. A heavy oak desk dominates the center\./i)
      ).toBeInTheDocument();
    });

    it('does not render explicit surface elements list (integrated into prose)', () => {
      render(<LocationView {...defaultProps} />);

      // Surface elements should NOT be displayed as explicit list items
      // They are now integrated into the narrator's prose response
      expect(screen.queryByText('You can see:')).not.toBeInTheDocument();
    });

    it('renders input textarea with terminal-style placeholder', () => {
      render(<LocationView {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/describe your action/i);
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('rows', '3');
    });

    it('renders quick action shortcuts', () => {
      render(<LocationView {...defaultProps} />);

      expect(screen.getByText(/Quick Actions:/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /examine desk/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /check window/i })).toBeInTheDocument();
    });

    it('renders loading state when locationData is null', () => {
      render(<LocationView {...defaultProps} locationData={null} />);

      expect(screen.getByText(/Loading location/i)).toBeInTheDocument();
    });

    it('renders witness shortcuts when witnesses are present', () => {
      render(
        <LocationView
          {...defaultProps}
          witnessesPresent={[{ id: 'witness1', name: 'Hermione' }]}
        />
      );

      expect(screen.getByRole('button', { name: /talk to Hermione/i })).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Quick Actions Tests
  // ------------------------------------------

  describe('Quick Actions', () => {
    it('fills input when quick action clicked (does not submit)', async () => {
      const user = userEvent.setup();
      render(<LocationView {...defaultProps} />);

      const examineButton = screen.getByRole('button', { name: /examine desk/i });
      await user.click(examineButton);

      const textarea = screen.getByPlaceholderText(/describe your action/i);
      expect(textarea).toHaveValue('examine the desk');
      expect(api.investigate).not.toHaveBeenCalled();
    });

    it('calls onWitnessClick when witness shortcut clicked', async () => {
      const user = userEvent.setup();
      const onWitnessClick = vi.fn();
      render(
        <LocationView
          {...defaultProps}
          witnessesPresent={[{ id: 'witness1', name: 'Hermione' }]}
          onWitnessClick={onWitnessClick}
        />
      );

      const witnessButton = screen.getByRole('button', { name: /talk to Hermione/i });
      await user.click(witnessButton);

      expect(onWitnessClick).toHaveBeenCalledWith('witness1');
    });
  });

  // ------------------------------------------
  // Input Handling Tests
  // ------------------------------------------

  describe('Input Handling', () => {
    it('updates input value when typing', async () => {
      const user = userEvent.setup();
      render(<LocationView {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/describe your action/i);
      await user.type(textarea, 'I look at the bookshelf');

      expect(textarea).toHaveValue('I look at the bookshelf');
    });

    it('shows Ctrl+Enter hint', () => {
      render(<LocationView {...defaultProps} />);

      expect(screen.getByText(/Ctrl\+Enter to submit/i)).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // API Integration Tests
  // ------------------------------------------

  describe('API Integration', () => {
    it('calls investigate API on Ctrl+Enter submit', async () => {
      const user = userEvent.setup();
      vi.mocked(api.investigate).mockResolvedValueOnce(mockInvestigateResponse);

      render(<LocationView {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/describe your action/i);
      await user.type(textarea, 'I search under the desk');
      await user.keyboard('{Control>}{Enter}{/Control}');

      expect(api.investigate).toHaveBeenCalledWith({
        player_input: 'I search under the desk',
        case_id: 'case_001',
        location_id: 'library',
      });
    });

    it('displays narrator response after successful submit', async () => {
      const user = userEvent.setup();
      vi.mocked(api.investigate).mockResolvedValueOnce(mockInvestigateResponse);

      render(<LocationView {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/describe your action/i);
      await user.type(textarea, 'I search under the desk');
      await user.keyboard('{Control>}{Enter}{/Control}');

      await waitFor(() => {
        expect(
          screen.getByText(/You carefully examine the area under the desk/i)
        ).toBeInTheDocument();
      });
    });

    it('shows evidence discovery indicator', async () => {
      const user = userEvent.setup();
      vi.mocked(api.investigate).mockResolvedValueOnce(mockInvestigateResponse);

      render(<LocationView {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/describe your action/i);
      await user.type(textarea, 'I search under the desk');
      await user.keyboard('{Control>}{Enter}{/Control}');

      await waitFor(() => {
        expect(screen.getByText(/Evidence: hidden_note/i)).toBeInTheDocument();
      });
    });

    it('calls onEvidenceDiscovered when evidence is found', async () => {
      const user = userEvent.setup();
      const onEvidenceDiscovered = vi.fn();
      vi.mocked(api.investigate).mockResolvedValueOnce(mockInvestigateResponse);

      render(<LocationView {...defaultProps} onEvidenceDiscovered={onEvidenceDiscovered} />);

      const textarea = screen.getByPlaceholderText(/describe your action/i);
      await user.type(textarea, 'I search under the desk');
      await user.keyboard('{Control>}{Enter}{/Control}');

      await waitFor(() => {
        expect(onEvidenceDiscovered).toHaveBeenCalledWith(['hidden_note']);
      });
    });

    it('does not call onEvidenceDiscovered when no evidence found', async () => {
      const user = userEvent.setup();
      const onEvidenceDiscovered = vi.fn();
      vi.mocked(api.investigate).mockResolvedValueOnce({
        narrator_response: 'You search but find nothing of note.',
        new_evidence: [],
        already_discovered: false,
      });

      render(<LocationView {...defaultProps} onEvidenceDiscovered={onEvidenceDiscovered} />);

      const textarea = screen.getByPlaceholderText(/describe your action/i);
      await user.type(textarea, 'I look at the ceiling');
      await user.keyboard('{Control>}{Enter}{/Control}');

      await waitFor(() => {
        expect(screen.getByText(/You search but find nothing of note/i)).toBeInTheDocument();
      });

      expect(onEvidenceDiscovered).not.toHaveBeenCalled();
    });

    it('clears input after successful submit', async () => {
      const user = userEvent.setup();
      vi.mocked(api.investigate).mockResolvedValueOnce(mockInvestigateResponse);

      render(<LocationView {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/describe your action/i);
      await user.type(textarea, 'I search under the desk');
      await user.keyboard('{Control>}{Enter}{/Control}');

      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });
    });
  });

  // ------------------------------------------
  // Loading State Tests
  // ------------------------------------------

  describe('Loading State', () => {
    it('shows loading indicator during API call', async () => {
      const user = userEvent.setup();
      // Create a promise that we can resolve manually
      let resolvePromise: (value: InvestigateResponse) => void;
      const promise = new Promise<InvestigateResponse>((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(api.investigate).mockReturnValueOnce(promise);

      render(<LocationView {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/describe your action/i);
      await user.type(textarea, 'I search');
      await user.keyboard('{Control>}{Enter}{/Control}');

      // Should show loading state
      expect(screen.getByText(/Investigating/i)).toBeInTheDocument();

      // Resolve the promise
      resolvePromise!(mockInvestigateResponse);

      // Loading should go away
      await waitFor(() => {
        expect(screen.queryByText(/Investigating\.\.\./i)).not.toBeInTheDocument();
      });
    });

    it('disables input during loading', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: InvestigateResponse) => void;
      const promise = new Promise<InvestigateResponse>((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(api.investigate).mockReturnValueOnce(promise);

      render(<LocationView {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/describe your action/i);
      await user.type(textarea, 'I search');
      await user.keyboard('{Control>}{Enter}{/Control}');

      // Textarea should be disabled during loading
      expect(textarea).toBeDisabled();

      // Resolve the promise
      resolvePromise!(mockInvestigateResponse);

      // Textarea should be enabled again
      await waitFor(() => {
        expect(textarea).not.toBeDisabled();
      });
    });
  });

  // ------------------------------------------
  // Error Handling Tests
  // ------------------------------------------

  describe('Error Handling', () => {
    it('displays error message on API failure', async () => {
      const user = userEvent.setup();
      vi.mocked(api.investigate).mockRejectedValueOnce({
        status: 500,
        message: 'Internal server error',
      });

      render(<LocationView {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/describe your action/i);
      await user.type(textarea, 'I search');
      await user.keyboard('{Control>}{Enter}{/Control}');

      await waitFor(() => {
        expect(screen.getByText(/Internal server error/i)).toBeInTheDocument();
      });
    });

    it('displays network error message', async () => {
      const user = userEvent.setup();
      vi.mocked(api.investigate).mockRejectedValueOnce({
        status: 0,
        message: 'Network error: Unable to connect to server.',
      });

      render(<LocationView {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/describe your action/i);
      await user.type(textarea, 'I search');
      await user.keyboard('{Control>}{Enter}{/Control}');

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('clears error when successful submit follows', async () => {
      const user = userEvent.setup();

      // First call fails
      vi.mocked(api.investigate).mockRejectedValueOnce({
        status: 500,
        message: 'Server error',
      });

      render(<LocationView {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/describe your action/i);

      // First attempt - fails
      await user.type(textarea, 'I search');
      await user.keyboard('{Control>}{Enter}{/Control}');

      await waitFor(() => {
        expect(screen.getByText(/Server error/i)).toBeInTheDocument();
      });

      // Second call succeeds
      vi.mocked(api.investigate).mockResolvedValueOnce(mockInvestigateResponse);

      // Second attempt - succeeds
      await user.type(textarea, 'I try again');
      await user.keyboard('{Control>}{Enter}{/Control}');

      await waitFor(() => {
        expect(screen.queryByText(/Server error/i)).not.toBeInTheDocument();
      });
    });
  });

  // ------------------------------------------
  // Conversation History Tests
  // ------------------------------------------

  describe('Conversation History', () => {
    it('displays player action in history', async () => {
      const user = userEvent.setup();
      vi.mocked(api.investigate).mockResolvedValueOnce(mockInvestigateResponse);

      render(<LocationView {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/describe your action/i);
      await user.type(textarea, 'I search under the desk');
      await user.keyboard('{Control>}{Enter}{/Control}');

      await waitFor(() => {
        expect(screen.getByText(/I search under the desk/i)).toBeInTheDocument();
      });
    });

    it('maintains history of multiple interactions', async () => {
      const user = userEvent.setup();

      // First interaction
      vi.mocked(api.investigate).mockResolvedValueOnce({
        narrator_response: 'First response.',
        new_evidence: [],
        already_discovered: false,
      });

      render(<LocationView {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/describe your action/i);

      await user.type(textarea, 'First action');
      await user.keyboard('{Control>}{Enter}{/Control}');

      await waitFor(() => {
        expect(screen.getByText(/First response/i)).toBeInTheDocument();
      });

      // Second interaction
      vi.mocked(api.investigate).mockResolvedValueOnce({
        narrator_response: 'Second response.',
        new_evidence: [],
        already_discovered: false,
      });

      await user.type(textarea, 'Second action');
      await user.keyboard('{Control>}{Enter}{/Control}');

      await waitFor(() => {
        expect(screen.getByText(/First response/i)).toBeInTheDocument();
        expect(screen.getByText(/Second response/i)).toBeInTheDocument();
      });
    });
  });

  // ------------------------------------------
  // Keyboard Shortcuts Tests
  // ------------------------------------------

  describe('Keyboard Shortcuts', () => {
    it('submits on Ctrl+Enter', async () => {
      const user = userEvent.setup();
      vi.mocked(api.investigate).mockResolvedValueOnce(mockInvestigateResponse);

      render(<LocationView {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/describe your action/i);
      await user.type(textarea, 'I search');
      await user.keyboard('{Control>}{Enter}{/Control}');

      expect(api.investigate).toHaveBeenCalled();
    });

    it('submits on Cmd+Enter (Mac)', async () => {
      const user = userEvent.setup();
      vi.mocked(api.investigate).mockResolvedValueOnce(mockInvestigateResponse);

      render(<LocationView {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/describe your action/i);
      await user.type(textarea, 'I search');
      await user.keyboard('{Meta>}{Enter}{/Meta}');

      expect(api.investigate).toHaveBeenCalled();
    });
  });
});
