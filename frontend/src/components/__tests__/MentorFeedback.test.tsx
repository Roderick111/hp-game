/**
 * MentorFeedback Component Tests
 *
 * Tests for the mentor feedback display including:
 * - Verdict result display
 * - Score meter rendering and colors
 * - Fallacy list display
 * - Praise and critique sections
 * - Adaptive hints
 * - Retry functionality
 *
 * @module components/__tests__/MentorFeedback.test
 * @since Phase 3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MentorFeedback, type MentorFeedbackProps, type MentorFeedbackData } from '../MentorFeedback';

// ============================================
// Test Data
// ============================================

const mockFeedbackExcellent: MentorFeedbackData = {
  analysis: 'You correctly identified the culprit and provided strong reasoning.',
  fallacies_detected: [],
  score: 85,
  quality: 'excellent',
  critique: '',
  praise: 'Your deduction was thorough and logical.',
  hint: null,
};

const mockFeedbackPoor: MentorFeedbackData = {
  analysis: 'Your reasoning has significant gaps.',
  fallacies_detected: [
    {
      name: 'Confirmation Bias',
      description: 'You focused only on evidence supporting your theory.',
      example: 'You ignored the alibi testimony.',
    },
    {
      name: 'Correlation Not Causation',
      description: 'Presence at the scene does not prove guilt.',
      example: 'The scarf proves presence, not murder.',
    },
  ],
  score: 35,
  quality: 'poor',
  critique: 'You ignored key timeline evidence.',
  praise: '',
  hint: 'Check when the suspect actually left the library.',
};

const mockFeedbackMedium: MentorFeedbackData = {
  analysis: 'Reasonable attempt but incomplete reasoning.',
  fallacies_detected: [
    {
      name: 'Post Hoc Fallacy',
      description: 'Timing alone does not prove causation.',
      example: '',
    },
  ],
  score: 55,
  quality: 'fair',
  critique: 'Consider the magical signature evidence.',
  praise: 'Good attention to witness statements.',
  hint: null,
};

const defaultProps: MentorFeedbackProps = {
  feedback: mockFeedbackExcellent,
  correct: true,
  attemptsRemaining: 10,
};

// ============================================
// Test Suite
// ============================================

describe('MentorFeedback', () => {
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
      render(<MentorFeedback {...defaultProps} />);
      expect(screen.getByText(/Moody's Feedback/i)).toBeInTheDocument();
    });

    it('renders analysis text', () => {
      render(<MentorFeedback {...defaultProps} />);
      expect(screen.getByText(/correctly identified the culprit/i)).toBeInTheDocument();
    });

    it('renders score meter', () => {
      render(<MentorFeedback {...defaultProps} />);
      expect(screen.getByText('85/100')).toBeInTheDocument();
    });

    it('renders quality label', () => {
      render(<MentorFeedback {...defaultProps} />);
      expect(screen.getByText(/Excellent Reasoning/i)).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Verdict Result Tests
  // ------------------------------------------

  describe('Verdict Result', () => {
    it('shows CORRECT banner when correct', () => {
      render(<MentorFeedback {...defaultProps} correct={true} />);
      expect(screen.getByText(/CORRECT VERDICT/i)).toBeInTheDocument();
    });

    it('shows INCORRECT banner when incorrect', () => {
      render(<MentorFeedback {...defaultProps} correct={false} />);
      expect(screen.getByText(/INCORRECT/i)).toBeInTheDocument();
    });

    it('applies green styling to correct verdict', () => {
      render(<MentorFeedback {...defaultProps} correct={true} />);
      const banner = screen.getByText(/CORRECT VERDICT/i);
      expect(banner).toHaveClass('text-green-400');
    });

    it('applies red styling to incorrect verdict', () => {
      render(<MentorFeedback {...defaultProps} correct={false} />);
      const banner = screen.getByText(/INCORRECT/i);
      expect(banner).toHaveClass('text-red-400');
    });
  });

  // ------------------------------------------
  // Score Meter Tests
  // ------------------------------------------

  describe('Score Meter', () => {
    it('shows green for high scores (>=75)', () => {
      render(<MentorFeedback {...defaultProps} feedback={{ ...mockFeedbackExcellent, score: 80 }} />);
      const scoreText = screen.getByText('80/100');
      expect(scoreText).toHaveClass('text-green-400');
    });

    it('shows yellow for medium scores (50-74)', () => {
      render(<MentorFeedback {...defaultProps} feedback={mockFeedbackMedium} />);
      const scoreText = screen.getByText('55/100');
      expect(scoreText).toHaveClass('text-yellow-400');
    });

    it('shows red for low scores (<50)', () => {
      render(<MentorFeedback {...defaultProps} feedback={mockFeedbackPoor} correct={false} />);
      const scoreText = screen.getByText('35/100');
      expect(scoreText).toHaveClass('text-red-400');
    });

    it('renders progress bar with correct width', () => {
      render(<MentorFeedback {...defaultProps} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '85');
    });
  });

  // ------------------------------------------
  // Fallacy Display Tests
  // ------------------------------------------

  describe('Fallacy Display', () => {
    it('renders fallacy section when fallacies detected', () => {
      render(<MentorFeedback {...defaultProps} feedback={mockFeedbackPoor} correct={false} />);
      expect(screen.getByText(/Logical Fallacies Detected/i)).toBeInTheDocument();
    });

    it('hides fallacy section when no fallacies', () => {
      render(<MentorFeedback {...defaultProps} />);
      expect(screen.queryByText(/Logical Fallacies Detected/i)).not.toBeInTheDocument();
    });

    it('renders all fallacy names', () => {
      render(<MentorFeedback {...defaultProps} feedback={mockFeedbackPoor} correct={false} />);
      expect(screen.getByText('Confirmation Bias:')).toBeInTheDocument();
      expect(screen.getByText('Correlation Not Causation:')).toBeInTheDocument();
    });

    it('renders fallacy descriptions', () => {
      render(<MentorFeedback {...defaultProps} feedback={mockFeedbackPoor} correct={false} />);
      expect(screen.getByText(/focused only on evidence supporting/i)).toBeInTheDocument();
    });

    it('renders fallacy examples when provided', () => {
      render(<MentorFeedback {...defaultProps} feedback={mockFeedbackPoor} correct={false} />);
      expect(screen.getByText(/"You ignored the alibi testimony."/i)).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Praise and Critique Tests
  // ------------------------------------------

  describe('Praise and Critique', () => {
    it('renders praise section when praise provided', () => {
      render(<MentorFeedback {...defaultProps} />);
      expect(screen.getByText(/What You Did Well/i)).toBeInTheDocument();
      expect(screen.getByText(/thorough and logical/i)).toBeInTheDocument();
    });

    it('hides praise section when empty', () => {
      render(<MentorFeedback {...defaultProps} feedback={mockFeedbackPoor} correct={false} />);
      expect(screen.queryByText(/What You Did Well/i)).not.toBeInTheDocument();
    });

    it('renders critique section when critique provided', () => {
      render(<MentorFeedback {...defaultProps} feedback={mockFeedbackPoor} correct={false} />);
      expect(screen.getByText(/Areas to Improve/i)).toBeInTheDocument();
      expect(screen.getByText(/ignored key timeline/i)).toBeInTheDocument();
    });

    it('hides critique section when empty', () => {
      render(<MentorFeedback {...defaultProps} />);
      expect(screen.queryByText(/Areas to Improve/i)).not.toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Hint Display Tests
  // ------------------------------------------

  describe('Hint Display', () => {
    it('renders hint when provided', () => {
      render(<MentorFeedback {...defaultProps} feedback={mockFeedbackPoor} correct={false} />);
      expect(screen.getByText(/Hint:/i)).toBeInTheDocument();
      expect(screen.getByText(/Check when the suspect actually left/i)).toBeInTheDocument();
    });

    it('hides hint section when null', () => {
      render(<MentorFeedback {...defaultProps} />);
      expect(screen.queryByText(/^Hint:/i)).not.toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Attempts Remaining Tests
  // ------------------------------------------

  describe('Attempts Remaining', () => {
    it('shows attempts remaining when incorrect', () => {
      render(<MentorFeedback {...defaultProps} correct={false} attemptsRemaining={7} />);
      expect(screen.getByText('7/10')).toBeInTheDocument();
    });

    it('does not show attempts when correct', () => {
      render(<MentorFeedback {...defaultProps} correct={true} attemptsRemaining={7} />);
      expect(screen.queryByText(/attempts remaining/i)).not.toBeInTheDocument();
    });

    it('shows red warning for low attempts', () => {
      render(<MentorFeedback {...defaultProps} correct={false} attemptsRemaining={2} />);
      const attemptsText = screen.getByText('2/10');
      expect(attemptsText).toHaveClass('text-red-400');
    });

    it('shows green for normal attempts', () => {
      render(<MentorFeedback {...defaultProps} correct={false} attemptsRemaining={8} />);
      const attemptsText = screen.getByText('8/10');
      expect(attemptsText).toHaveClass('text-green-400');
    });
  });

  // ------------------------------------------
  // Retry Button Tests
  // ------------------------------------------

  describe('Retry Button', () => {
    it('renders retry button when incorrect and has attempts', () => {
      const mockOnRetry = vi.fn();
      render(
        <MentorFeedback
          {...defaultProps}
          correct={false}
          attemptsRemaining={5}
          onRetry={mockOnRetry}
        />
      );
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('calls onRetry when clicked', async () => {
      const mockOnRetry = vi.fn();
      const user = userEvent.setup();

      render(
        <MentorFeedback
          {...defaultProps}
          correct={false}
          attemptsRemaining={5}
          onRetry={mockOnRetry}
        />
      );

      await user.click(screen.getByRole('button', { name: /try again/i }));
      expect(mockOnRetry).toHaveBeenCalled();
    });

    it('does not render retry when correct', () => {
      const mockOnRetry = vi.fn();
      render(
        <MentorFeedback
          {...defaultProps}
          correct={true}
          attemptsRemaining={5}
          onRetry={mockOnRetry}
        />
      );
      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    });

    it('does not render retry when no attempts remaining', () => {
      const mockOnRetry = vi.fn();
      render(
        <MentorFeedback
          {...defaultProps}
          correct={false}
          attemptsRemaining={0}
          onRetry={mockOnRetry}
        />
      );
      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    });

    it('shows max attempts message when exhausted', () => {
      render(
        <MentorFeedback
          {...defaultProps}
          correct={false}
          attemptsRemaining={0}
        />
      );
      expect(screen.getByText(/Max attempts reached/i)).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Wrong Suspect Response Tests
  // ------------------------------------------

  describe('Wrong Suspect Response', () => {
    it('renders wrong suspect response when provided', () => {
      render(
        <MentorFeedback
          {...defaultProps}
          correct={false}
          wrongSuspectResponse="MOODY: Wrong! Draco couldn't have done it because..."
        />
      );
      expect(screen.getByText(/Moody's Response/i)).toBeInTheDocument();
      expect(screen.getByText(/Draco couldn't have done it/i)).toBeInTheDocument();
    });

    it('does not render when null', () => {
      render(
        <MentorFeedback
          {...defaultProps}
          correct={false}
          wrongSuspectResponse={null}
        />
      );
      expect(screen.queryByText(/Moody's Response/i)).not.toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Loading State Tests (Phase 3.1)
  // ------------------------------------------

  describe('Loading State', () => {
    it('shows loading spinner when isLoading is true', () => {
      render(
        <MentorFeedback
          {...defaultProps}
          isLoading={true}
          feedback={undefined}
        />
      );

      expect(screen.getByText(/Moody is evaluating your verdict/i)).toBeInTheDocument();
      expect(screen.getByText(/Analyzing reasoning quality/i)).toBeInTheDocument();
    });

    it('does not show feedback content when loading', () => {
      render(
        <MentorFeedback
          {...defaultProps}
          isLoading={true}
          feedback={mockFeedbackExcellent}
        />
      );

      // Should show loading, not the feedback
      expect(screen.getByText(/Moody is evaluating/i)).toBeInTheDocument();
      expect(screen.queryByText(/CORRECT VERDICT/i)).not.toBeInTheDocument();
    });

    it('shows feedback when not loading and feedback provided', () => {
      render(
        <MentorFeedback
          {...defaultProps}
          isLoading={false}
          feedback={mockFeedbackExcellent}
        />
      );

      expect(screen.queryByText(/Moody is evaluating/i)).not.toBeInTheDocument();
      expect(screen.getByText(/CORRECT VERDICT/i)).toBeInTheDocument();
    });

    it('renders nothing when not loading and no feedback', () => {
      const { container } = render(
        <MentorFeedback
          {...defaultProps}
          isLoading={false}
          feedback={undefined}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('loading state has proper ARIA attributes', () => {
      render(
        <MentorFeedback
          {...defaultProps}
          isLoading={true}
          feedback={undefined}
        />
      );

      const loadingContainer = screen.getByRole('status');
      expect(loadingContainer).toHaveAttribute('aria-live', 'polite');
      expect(loadingContainer).toHaveAttribute('aria-busy', 'true');
    });

    it('loading spinner has aria-hidden', () => {
      render(
        <MentorFeedback
          {...defaultProps}
          isLoading={true}
          feedback={undefined}
        />
      );

      // The spinner div should be aria-hidden for screen readers
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
