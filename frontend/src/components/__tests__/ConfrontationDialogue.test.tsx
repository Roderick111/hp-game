/**
 * ConfrontationDialogue Component Tests
 *
 * Tests for the confrontation dialogue display including:
 * - Dialogue bubble rendering
 * - Speaker color coding
 * - Tone indicators
 * - Aftermath text display
 * - Case solved banner
 * - Close button functionality
 *
 * @module components/__tests__/ConfrontationDialogue.test
 * @since Phase 3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfrontationDialogue, type ConfrontationDialogueProps, type DialogueLine } from '../ConfrontationDialogue';

// ============================================
// Test Data
// ============================================

const mockDialogue: DialogueLine[] = [
  {
    speaker: 'moody',
    text: 'We need to discuss what happened, Draco.',
  },
  {
    speaker: 'draco',
    text: 'I... I never meant for this to happen.',
    tone: 'remorseful',
  },
  {
    speaker: 'player',
    text: 'The evidence was clear from the start.',
  },
  {
    speaker: 'moody',
    text: 'Good work, recruit. Take him to holding.',
  },
];

const mockAftermath = 'Draco Malfoy was sentenced to two years in Azkaban. His father\'s connections could not save him this time.';

const defaultProps: ConfrontationDialogueProps = {
  dialogue: mockDialogue,
  aftermath: mockAftermath,
  onClose: vi.fn(),
  caseSolvedCorrectly: true,
};

// ============================================
// Test Suite
// ============================================

describe('ConfrontationDialogue', () => {
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
    it('renders header', () => {
      render(<ConfrontationDialogue {...defaultProps} />);
      expect(screen.getByText(/Post-Verdict Confrontation/i)).toBeInTheDocument();
    });

    it('renders all dialogue lines', () => {
      render(<ConfrontationDialogue {...defaultProps} />);
      expect(screen.getByText(/We need to discuss/i)).toBeInTheDocument();
      expect(screen.getByText(/I never meant for this/i)).toBeInTheDocument();
      expect(screen.getByText(/evidence was clear/i)).toBeInTheDocument();
      expect(screen.getByText(/Good work, recruit/i)).toBeInTheDocument();
    });

    it('renders aftermath text', () => {
      render(<ConfrontationDialogue {...defaultProps} />);
      expect(screen.getByText(/sentenced to two years in Azkaban/i)).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<ConfrontationDialogue {...defaultProps} />);
      expect(screen.getByRole('button', { name: /close case file/i })).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Speaker Display Tests
  // ------------------------------------------

  describe('Speaker Display', () => {
    it('renders speaker names', () => {
      render(<ConfrontationDialogue {...defaultProps} />);
      expect(screen.getAllByText(/Moody/i).length).toBeGreaterThanOrEqual(1);
      // Draco appears as both speaker and in text, so check for multiple matches
      expect(screen.getAllByText(/Draco/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Player/i)).toBeInTheDocument();
    });

    it('capitalizes speaker names', () => {
      render(<ConfrontationDialogue {...defaultProps} />);
      // Moody should be capitalized
      const moodyElements = screen.getAllByText(/Moody/i);
      expect(moodyElements[0]).toHaveTextContent('Moody');
    });
  });

  // ------------------------------------------
  // Tone Display Tests
  // ------------------------------------------

  describe('Tone Display', () => {
    it('renders tone indicator when present', () => {
      render(<ConfrontationDialogue {...defaultProps} />);
      expect(screen.getByText(/\(remorseful\)/i)).toBeInTheDocument();
    });

    it('does not render tone when not present', () => {
      const dialogueWithoutTone: DialogueLine[] = [
        { speaker: 'moody', text: 'Test message without tone.' },
      ];
      render(<ConfrontationDialogue {...defaultProps} dialogue={dialogueWithoutTone} />);
      expect(screen.queryByText(/\(.*\)/)).not.toBeInTheDocument();
    });

    it('renders different tones correctly', () => {
      const dialogueWithTones: DialogueLine[] = [
        { speaker: 'suspect', text: 'Message 1', tone: 'defiant' },
        { speaker: 'suspect', text: 'Message 2', tone: 'angry' },
        { speaker: 'suspect', text: 'Message 3', tone: 'broken' },
      ];
      render(<ConfrontationDialogue {...defaultProps} dialogue={dialogueWithTones} />);
      expect(screen.getByText(/\(defiant\)/i)).toBeInTheDocument();
      expect(screen.getByText(/\(angry\)/i)).toBeInTheDocument();
      expect(screen.getByText(/\(broken\)/i)).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Case Solved Banner Tests
  // ------------------------------------------

  describe('Case Solved Banner', () => {
    it('shows CASE SOLVED when correct', () => {
      render(<ConfrontationDialogue {...defaultProps} caseSolvedCorrectly={true} />);
      expect(screen.getByText(/CASE SOLVED/i)).toBeInTheDocument();
    });

    it('shows CASE RESOLVED when incorrect (revealed after max attempts)', () => {
      render(<ConfrontationDialogue {...defaultProps} caseSolvedCorrectly={false} />);
      expect(screen.getByText(/CASE RESOLVED/i)).toBeInTheDocument();
    });

    it('shows success message when correct', () => {
      render(<ConfrontationDialogue {...defaultProps} caseSolvedCorrectly={true} />);
      expect(screen.getByText(/Justice has been served/i)).toBeInTheDocument();
    });

    it('shows review message when incorrect', () => {
      render(<ConfrontationDialogue {...defaultProps} caseSolvedCorrectly={false} />);
      expect(screen.getByText(/Review the evidence for future cases/i)).toBeInTheDocument();
    });

    it('applies green styling when correct', () => {
      render(<ConfrontationDialogue {...defaultProps} caseSolvedCorrectly={true} />);
      const banner = screen.getByText(/CASE SOLVED/i);
      expect(banner).toHaveClass('text-green-400');
    });

    it('applies yellow styling when incorrect', () => {
      render(<ConfrontationDialogue {...defaultProps} caseSolvedCorrectly={false} />);
      const banner = screen.getByText(/CASE RESOLVED/i);
      expect(banner).toHaveClass('text-yellow-400');
    });
  });

  // ------------------------------------------
  // Aftermath Tests
  // ------------------------------------------

  describe('Aftermath', () => {
    it('renders aftermath section', () => {
      render(<ConfrontationDialogue {...defaultProps} />);
      expect(screen.getByText(/Aftermath:/i)).toBeInTheDocument();
    });

    it('displays aftermath text in italics', () => {
      render(<ConfrontationDialogue {...defaultProps} />);
      const aftermathText = screen.getByText(/sentenced to two years/i);
      expect(aftermathText).toHaveClass('italic');
    });

    it('handles empty aftermath gracefully', () => {
      render(<ConfrontationDialogue {...defaultProps} aftermath="" />);
      expect(screen.queryByText(/Aftermath:/i)).not.toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Close Button Tests
  // ------------------------------------------

  describe('Close Button', () => {
    it('calls onClose when clicked', async () => {
      const mockOnClose = vi.fn();
      const user = userEvent.setup();

      render(<ConfrontationDialogue {...defaultProps} onClose={mockOnClose} />);

      await user.click(screen.getByRole('button', { name: /close case file/i }));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('button has correct text', () => {
      render(<ConfrontationDialogue {...defaultProps} />);
      expect(screen.getByText(/Close Case File/i)).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Empty Dialogue Tests
  // ------------------------------------------

  describe('Empty Dialogue', () => {
    it('renders without dialogue lines', () => {
      render(<ConfrontationDialogue {...defaultProps} dialogue={[]} />);
      expect(screen.getByText(/Post-Verdict Confrontation/i)).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Long Dialogue Tests
  // ------------------------------------------

  describe('Long Dialogue', () => {
    it('handles many dialogue lines', () => {
      const longDialogue: DialogueLine[] = Array.from({ length: 10 }, (_, i) => ({
        speaker: i % 2 === 0 ? 'moody' : 'suspect',
        text: `Line ${i + 1} of the dialogue.`,
      }));

      render(<ConfrontationDialogue {...defaultProps} dialogue={longDialogue} />);

      expect(screen.getByText('Line 1 of the dialogue.')).toBeInTheDocument();
      expect(screen.getByText('Line 10 of the dialogue.')).toBeInTheDocument();
    });
  });
});
