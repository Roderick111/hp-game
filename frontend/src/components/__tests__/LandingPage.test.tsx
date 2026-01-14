/**
 * LandingPage Component Tests
 *
 * Tests for the main menu landing page (Phase 5.4):
 * - Dynamic case loading from API
 * - Loading, error, and empty states
 * - Case list display with backend data
 * - Start Case button functionality
 * - Load Game button functionality
 * - Keyboard shortcuts
 *
 * @module components/__tests__/LandingPage.test
 * @since Phase 5.3.1
 * @updated Phase 5.4 - Dynamic case loading
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandingPage } from '../LandingPage';
import * as client from '../../api/client';
import type { CaseListResponse } from '../../types/investigation';

// ============================================
// Mocks
// ============================================

vi.mock('../../api/client', () => ({
  getCases: vi.fn(),
}));

const mockCasesResponse: CaseListResponse = {
  cases: [
    {
      id: 'case_001',
      title: 'The Restricted Section',
      difficulty: 'intermediate',
      description:
        'A third-year student has been found petrified in the Hogwarts Library.',
    },
    {
      id: 'case_002',
      title: 'The Poisoned Potion',
      difficulty: 'advanced',
      description: 'A professor has been found unconscious after drinking a remedy.',
    },
  ],
  count: 2,
  errors: null,
};

const mockSingleCaseResponse: CaseListResponse = {
  cases: [
    {
      id: 'case_001',
      title: 'The Restricted Section',
      difficulty: 'intermediate',
      description:
        'A third-year student has been found petrified in the Hogwarts Library.',
    },
  ],
  count: 1,
  errors: null,
};

const mockEmptyResponse: CaseListResponse = {
  cases: [],
  count: 0,
  errors: null,
};

const mockPartialErrorResponse: CaseListResponse = {
  cases: [
    {
      id: 'case_001',
      title: 'The Restricted Section',
      difficulty: 'intermediate',
      description: 'A student has been found petrified.',
    },
  ],
  count: 1,
  errors: ['case_002: Missing required field: title'],
};

// ============================================
// Test Data
// ============================================

const defaultProps = {
  onStartNewCase: vi.fn(),
  onLoadGame: vi.fn(),
};

// ============================================
// Test Suite
// ============================================

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (client.getCases as any).mockResolvedValue(mockCasesResponse);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ------------------------------------------
  // Loading State Tests
  // ------------------------------------------

  describe('Loading State', () => {
    it('displays loading state while fetching cases', () => {
      // Make getCases never resolve to keep loading state
      (client.getCases as any).mockImplementation(
        () => new Promise<CaseListResponse>(() => { /* intentionally never resolves */ })
      );

      render(<LandingPage {...defaultProps} />);

      expect(screen.getByText('Loading cases...')).toBeInTheDocument();
      expect(screen.getByText('AUROR ACADEMY')).toBeInTheDocument();
    });

    it('shows game title during loading', () => {
      (client.getCases as any).mockImplementation(
        () => new Promise<CaseListResponse>(() => { /* intentionally never resolves */ })
      );

      render(<LandingPage {...defaultProps} />);

      expect(screen.getByText('AUROR ACADEMY')).toBeInTheDocument();
      expect(screen.getByText(/Case Investigation System/i)).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Error State Tests
  // ------------------------------------------

  describe('Error State', () => {
    it('displays error message when API fails', async () => {
      (client.getCases as any).mockRejectedValue(new Error('Network error'));

      render(<LandingPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('shows retry button on error', async () => {
      (client.getCases as any).mockRejectedValue(new Error('API error'));

      render(<LandingPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /RETRY/i })).toBeInTheDocument();
      });
    });

    it('retries fetching when retry button clicked', async () => {
      const user = userEvent.setup();

      // First call fails, second succeeds
      (client.getCases as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockCasesResponse);

      render(<LandingPage {...defaultProps} />);

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      // Click retry
      await user.click(screen.getByRole('button', { name: /RETRY/i }));

      // Wait for cases to load
      await waitFor(() => {
        expect(screen.getByText('The Restricted Section')).toBeInTheDocument();
      });

      expect(client.getCases).toHaveBeenCalledTimes(2);
    });
  });

  // ------------------------------------------
  // Empty State Tests
  // ------------------------------------------

  describe('Empty State', () => {
    it('displays empty state when no cases available', async () => {
      (client.getCases as any).mockResolvedValue(mockEmptyResponse);

      render(<LandingPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No cases available.')).toBeInTheDocument();
      });
    });

    it('shows help text in empty state', async () => {
      (client.getCases as any).mockResolvedValue(mockEmptyResponse);

      render(<LandingPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Add case files/i)).toBeInTheDocument();
      });
    });
  });

  // ------------------------------------------
  // Successful Load Tests
  // ------------------------------------------

  describe('Successful Case Loading', () => {
    it('fetches cases on mount', async () => {
      render(<LandingPage {...defaultProps} />);

      await waitFor(() => {
        expect(client.getCases).toHaveBeenCalledTimes(1);
      });
    });

    it('displays cases from API', async () => {
      render(<LandingPage {...defaultProps} />);

      // Wait for first case
      await waitFor(() => {
        expect(screen.getByText('The Restricted Section')).toBeInTheDocument();
      });

      // Second case should also be visible in the list (button text includes case name)
      expect(screen.getByRole('button', { name: /The Poisoned Potion/i })).toBeInTheDocument();
    });

    it('maps backend difficulty to frontend format', async () => {
      render(<LandingPage {...defaultProps} />);

      await waitFor(() => {
        // intermediate -> Medium
        expect(screen.getByText('Difficulty: Medium')).toBeInTheDocument();
      });
    });

    it('logs warnings when some cases fail to load', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { /* suppress console output */ });

      (client.getCases as any).mockResolvedValue(mockPartialErrorResponse);

      render(<LandingPage {...defaultProps} />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Some cases failed to load:',
          ['case_002: Missing required field: title']
        );
      });

      consoleSpy.mockRestore();
    });
  });

  // ------------------------------------------
  // Rendering Tests
  // ------------------------------------------

  describe('Rendering', () => {
    it('renders the game title', async () => {
      render(<LandingPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('The Restricted Section')).toBeInTheDocument();
      });

      expect(screen.getByText('AUROR ACADEMY')).toBeInTheDocument();
    });

    it('renders the version text', async () => {
      render(<LandingPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('The Restricted Section')).toBeInTheDocument();
      });

      expect(screen.getByText(/Case Investigation System/i)).toBeInTheDocument();
    });

    it('renders the Available Cases section', async () => {
      render(<LandingPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Available Cases')).toBeInTheDocument();
      });
    });

    it('renders case description', async () => {
      render(<LandingPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/petrified/i)).toBeInTheDocument();
      });
    });

    it('renders Load Game button', async () => {
      render(<LandingPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('The Restricted Section')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /LOAD GAME/i })).toBeInTheDocument();
    });

    it('renders keyboard hints', async () => {
      render(<LandingPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('The Restricted Section')).toBeInTheDocument();
      });

      expect(screen.getByText(/Navigate/i)).toBeInTheDocument();
      expect(screen.getByText(/Select Case/i)).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Button Click Tests
  // ------------------------------------------

  describe('Button Interactions', () => {
    it('calls onStartNewCase with case_001 when Start Case clicked', async () => {
      const onStartNewCase = vi.fn();
      const user = userEvent.setup();

      render(<LandingPage {...defaultProps} onStartNewCase={onStartNewCase} />);

      await waitFor(() => {
        expect(screen.getByText('The Restricted Section')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /START CASE/i }));
      expect(onStartNewCase).toHaveBeenCalledTimes(1);
      expect(onStartNewCase).toHaveBeenCalledWith('case_001');
    });

    it('calls onLoadGame when Load Game clicked', async () => {
      const onLoadGame = vi.fn();
      const user = userEvent.setup();

      render(<LandingPage {...defaultProps} onLoadGame={onLoadGame} />);

      await waitFor(() => {
        expect(screen.getByText('The Restricted Section')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /LOAD GAME/i }));
      expect(onLoadGame).toHaveBeenCalledTimes(1);
    });

    it('selects a different case when clicked', async () => {
      const user = userEvent.setup();

      render(<LandingPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('The Restricted Section')).toBeInTheDocument();
      });

      // Find and click case_002 button
      const case002Button = screen.getByRole('button', {
        name: /002.*The Poisoned Potion/i,
      });
      await user.click(case002Button);

      // Check that case_002 details are shown
      expect(screen.getByText('Difficulty: Hard')).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Keyboard Shortcut Tests
  // ------------------------------------------

  describe('Keyboard Shortcuts', () => {
    it('calls onStartNewCase when Enter pressed on selected case', async () => {
      const onStartNewCase = vi.fn();
      const user = userEvent.setup();

      render(<LandingPage {...defaultProps} onStartNewCase={onStartNewCase} />);

      await waitFor(() => {
        expect(screen.getByText('The Restricted Section')).toBeInTheDocument();
      });

      await user.keyboard('{Enter}');
      expect(onStartNewCase).toHaveBeenCalledTimes(1);
      expect(onStartNewCase).toHaveBeenCalledWith('case_001');
    });

    it('calls onLoadGame when L key pressed', async () => {
      const onLoadGame = vi.fn();
      const user = userEvent.setup();

      render(<LandingPage {...defaultProps} onLoadGame={onLoadGame} />);

      await waitFor(() => {
        expect(screen.getByText('The Restricted Section')).toBeInTheDocument();
      });

      await user.keyboard('l');
      expect(onLoadGame).toHaveBeenCalledTimes(1);
    });

    it('selects case with number key', async () => {
      const user = userEvent.setup();

      render(<LandingPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('The Restricted Section')).toBeInTheDocument();
      });

      // Press 2 to select second case
      await user.keyboard('2');

      // Verify case_002 is now selected (shown in details pane)
      expect(screen.getByText('Difficulty: Hard')).toBeInTheDocument();
    });

    it('navigates with arrow keys', async () => {
      const user = userEvent.setup();

      render(<LandingPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('The Restricted Section')).toBeInTheDocument();
      });

      // Press ArrowDown to select second case
      await user.keyboard('{ArrowDown}');

      // Verify case_002 is now selected
      expect(screen.getByText('Difficulty: Hard')).toBeInTheDocument();
    });

    it('does not trigger shortcuts when typing in input fields', async () => {
      const onLoadGame = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <div>
          <LandingPage {...defaultProps} onLoadGame={onLoadGame} />
          <input type="text" data-testid="test-input" />
        </div>
      );

      await waitFor(() => {
        expect(screen.getByText('The Restricted Section')).toBeInTheDocument();
      });

      const input = container.querySelector('[data-testid="test-input"]');
      if (input) {
        await user.click(input);
        await user.keyboard('l');
      }

      // Shortcut should not fire when focus is on input
      expect(onLoadGame).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------
  // Styling Tests
  // ------------------------------------------

  describe('Styling', () => {
    it('applies terminal B&W aesthetic', async () => {
      render(<LandingPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('The Restricted Section')).toBeInTheDocument();
      });

      const title = screen.getByText('AUROR ACADEMY');
      expect(title).toHaveClass('font-mono');
      expect(title).toHaveClass('text-white');
      expect(title).toHaveClass('tracking-widest');
    });

    it('has proper container styling', async () => {
      const { container } = render(<LandingPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('The Restricted Section')).toBeInTheDocument();
      });

      const rootDiv = container.firstChild;
      expect(rootDiv).toHaveClass('bg-gray-900');
      expect(rootDiv).toHaveClass('text-gray-100');
    });
  });

  // ------------------------------------------
  // Accessibility Tests
  // ------------------------------------------

  describe('Accessibility', () => {
    it('has proper heading hierarchy', async () => {
      render(<LandingPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('The Restricted Section')).toBeInTheDocument();
      });

      // h1 for main title
      const mainTitle = screen.getByRole('heading', { level: 1 });
      expect(mainTitle).toHaveTextContent('AUROR ACADEMY');

      // h2 for sections
      const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(sectionHeadings.length).toBeGreaterThan(0);
    });

    it('buttons are focusable', async () => {
      render(<LandingPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('The Restricted Section')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /START CASE/i });
      const loadButton = screen.getByRole('button', { name: /LOAD GAME/i });

      expect(startButton).not.toHaveAttribute('tabindex', '-1');
      expect(loadButton).not.toHaveAttribute('tabindex', '-1');
    });
  });

  // ------------------------------------------
  // Single Case Tests
  // ------------------------------------------

  describe('Single Case', () => {
    it('displays single case correctly', async () => {
      (client.getCases as any).mockResolvedValue(mockSingleCaseResponse);

      render(<LandingPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('The Restricted Section')).toBeInTheDocument();
      });

      // Only one case should be visible
      expect(screen.queryByText('The Poisoned Potion')).not.toBeInTheDocument();
    });

    it('starts first case with Enter key', async () => {
      const onStartNewCase = vi.fn();
      const user = userEvent.setup();

      (client.getCases as any).mockResolvedValue(mockSingleCaseResponse);

      render(<LandingPage {...defaultProps} onStartNewCase={onStartNewCase} />);

      await waitFor(() => {
        expect(screen.getByText('The Restricted Section')).toBeInTheDocument();
      });

      await user.keyboard('{Enter}');
      expect(onStartNewCase).toHaveBeenCalledWith('case_001');
    });
  });
});
