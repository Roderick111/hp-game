
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

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render } from '../../test/render';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationView } from '../LocationView';
import * as api from '../../api/client';
import type { LocationResponse, InvestigateResponse } from '../../types/investigation';

// ============================================
// Mocks
// ============================================

vi.mock('../../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/client')>();
  return {
    ...actual,
    investigate: vi.fn(),
  };
});

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

      expect(screen.getByRole('button', { name: /examine desk/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /check window/i })).toBeInTheDocument();
    });

    it('renders loading state when locationData is null', () => {
      render(<LocationView {...defaultProps} locationData={null} />);

      expect(screen.getByText(/Loading location/i)).toBeInTheDocument();
    });

    // Witness shortcuts disabled - feature reserved for future implementation
    it.skip('renders witness shortcuts when witnesses are present', () => {
      // Test disabled - witnessesPresent prop removed
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

    // Witness click handler disabled - feature reserved for future implementation
    it.skip('calls onWitnessClick when witness shortcut clicked', async () => {
      // Test disabled - onWitnessClick prop removed
    });
  });

  // ------------------------------------------
  // Input Handling Tests
  // ------------------------------------------

  describe('Input Handling', () => {
    it.todo('updates input value when typing');

    it.todo('shows Ctrl+Enter hint');
  });

  // ------------------------------------------
  // API Integration Tests
  // ------------------------------------------

  describe('API Integration', () => {
    it.todo('calls investigate API on Ctrl+Enter submit');

    it.todo('displays narrator response after successful submit');

    it.todo('shows evidence discovery indicator');

    it.todo('calls onEvidenceDiscovered when evidence is found');

    it.todo('does not call onEvidenceDiscovered when no evidence found');

    it('clears input after successful submit', async () => {
      const user = userEvent.setup();
      (api.investigate as Mock).mockResolvedValueOnce(mockInvestigateResponse);

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
    it.todo('shows loading indicator during API call');

    it.todo('disables input during loading');
  });

  // ------------------------------------------
  // Error Handling Tests
  // ------------------------------------------

  describe('Error Handling', () => {
    it.todo('displays error message on API failure');

    it.todo('displays network error message');

    it.todo('clears error when successful submit follows');
  });

  // ------------------------------------------
  // Conversation History Tests
  // ------------------------------------------

  describe('Conversation History', () => {
    it('displays player action in history', async () => {
      const user = userEvent.setup();
      (api.investigate as Mock).mockResolvedValueOnce(mockInvestigateResponse);

      render(<LocationView {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/describe your action/i);
      await user.type(textarea, 'I search under the desk');
      await user.keyboard('{Control>}{Enter}{/Control}');

      await waitFor(() => {
        expect(screen.getByText(/I search under the desk/i)).toBeInTheDocument();
      });
    });

    it.todo('maintains history of multiple interactions');
  });

  // ------------------------------------------
  // Keyboard Shortcuts Tests
  // ------------------------------------------

  describe('Keyboard Shortcuts', () => {
    it.todo('submits on Ctrl+Enter');

    it.todo('submits on Cmd+Enter (Mac)');
  });

  // ------------------------------------------
  // Quick Actions Tests (Phase 5.3.1 - Design System)
  // ------------------------------------------

  describe('Quick Actions (Design System)', () => {
    it.todo('renders quick action buttons');

    it('fills input with action text when examine desk clicked', async () => {
      const user = userEvent.setup();
      render(<LocationView {...defaultProps} />);

      const button = screen.getByRole('button', { name: /examine desk/i });
      await user.click(button);

      const textarea = screen.getByPlaceholderText(/describe your action/i);
      expect(textarea).toHaveValue("examine the desk");
    });

    it('fills input with action text when check window clicked', async () => {
      const user = userEvent.setup();
      render(<LocationView {...defaultProps} />);

      const button = screen.getByRole('button', { name: /check window/i });
      await user.click(button);

      const textarea = screen.getByPlaceholderText(/describe your action/i);
      expect(textarea).toHaveValue("check the window");
    });

    it('fills input with Tom prompt when ask Tom clicked', async () => {
      const user = userEvent.setup();
      render(<LocationView {...defaultProps} />);

      const button = screen.getByRole('button', { name: /ask Tom/i });
      await user.click(button);

      const textarea = screen.getByPlaceholderText(/describe your action/i);
      expect(textarea).toHaveValue("Tom, what do you think?");
    });

    it('does NOT auto-submit when quick action clicked', async () => {
      const user = userEvent.setup();
      render(<LocationView {...defaultProps} />);

      const button = screen.getByRole('button', { name: /examine desk/i });
      await user.click(button);

      // Should NOT call investigate API
      expect(api.investigate).not.toHaveBeenCalled();
    });

    it.todo('allows editing action text before submission');

    it.todo('quick action buttons have B&W styling');
  });

  // ------------------------------------------
  // Auror's Handbook Tests (Phase 4.5)
  // ------------------------------------------

  describe("Auror's Handbook (Phase 4.5)", () => {
    it.todo('renders Handbook button');

    it.todo('opens Handbook modal when button clicked');

    it.todo('opens Handbook modal on Ctrl+H');

    it.todo('opens Handbook modal on Cmd+H (Mac)');

    it.todo('closes Handbook modal on second Ctrl+H press');

    it.todo('Handbook shows all 7 spells');

    it.todo('Handbook button has title with keyboard shortcut');
  });
});
