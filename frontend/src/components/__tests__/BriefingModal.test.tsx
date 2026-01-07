/**
 * BriefingModal Component Tests
 *
 * Tests for the dialogue-based briefing UI:
 * - Dialogue feed display (no separated boxes)
 * - Interactive teaching question with choices
 * - Q&A conversation history
 * - Text input for follow-up questions
 * - Start Investigation button
 *
 * @module components/__tests__/BriefingModal.test
 * @since Phase 3.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BriefingModal, type BriefingModalProps } from '../BriefingModal';
import type {
  BriefingContent,
  BriefingConversation,
} from '../../types/investigation';

// ============================================
// Test Data
// ============================================

const mockBriefing: BriefingContent = {
  case_id: 'case_001',
  case_assignment: `*Mad-Eye Moody tosses a thin case file onto the desk*

VICTIM: Third-year student
LOCATION: Hogwarts Library, Restricted Section
TIME: Approximately 9:15pm last night
STATUS: Found petrified near frost-covered window`,
  teaching_question: {
    prompt: `Before you start, recruit - a question:

Out of 100 school incidents ruled "accidents," how many actually ARE accidents?`,
    choices: [
      {
        id: '25_percent',
        text: '25%',
        response: '*eye narrows* Too low. You\'re being paranoid.',
      },
      {
        id: '50_percent',
        text: '50%',
        response: 'Not quite. You\'re guessing, not deducing.',
      },
      {
        id: '85_percent',
        text: '85%',
        response: '*nods* Correct. 85%. Hogwarts is dangerous.',
      },
      {
        id: 'almost_all',
        text: 'Almost all (95%+)',
        response: 'Close, but overcorrecting. 85% is the number.',
      },
    ],
    concept_summary:
      "That's base rates, recruit. Always start with what's LIKELY.",
  },
  rationality_concept: 'base_rates',
  concept_description:
    'Start with likely scenarios (base rates), not dramatic theories.',
  transition: `Now get to work. The library's waiting.

CONSTANT VIGILANCE.`,
};

const mockConversation: BriefingConversation[] = [
  {
    question: 'What are base rates?',
    answer: 'Base rates are prior probabilities. Most Hogwarts accidents are just accidents.',
  },
];

const defaultProps: BriefingModalProps = {
  briefing: mockBriefing,
  conversation: [],
  selectedChoice: null,
  choiceResponse: null,
  onSelectChoice: vi.fn(),
  onAskQuestion: vi.fn(),
  onComplete: vi.fn(),
  loading: false,
};

// ============================================
// Test Suite
// ============================================

describe('BriefingModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ------------------------------------------
  // Dialogue Feed Tests
  // ------------------------------------------

  describe('Dialogue Feed', () => {
    it('renders case assignment as Moody message', () => {
      render(<BriefingModal {...defaultProps} />);

      expect(screen.getByText(/VICTIM: Third-year student/)).toBeInTheDocument();
    });

    it('displays MOODY label for case assignment', () => {
      render(<BriefingModal {...defaultProps} />);

      const moodyLabels = screen.getAllByText('MOODY:');
      expect(moodyLabels.length).toBeGreaterThan(0);
    });

    it('renders teaching question prompt', () => {
      render(<BriefingModal {...defaultProps} />);

      expect(screen.getByText(/Before you start, recruit/)).toBeInTheDocument();
    });

    it('hides transition text when no questions asked', () => {
      render(<BriefingModal {...defaultProps} conversation={[]} />);

      expect(screen.queryByText(/Now get to work/)).not.toBeInTheDocument();
    });

    it('hides CONSTANT VIGILANCE when no questions asked', () => {
      render(<BriefingModal {...defaultProps} conversation={[]} />);

      expect(screen.queryByText(/CONSTANT VIGILANCE/)).not.toBeInTheDocument();
    });

    it('displays transition text after asking question', () => {
      render(<BriefingModal {...defaultProps} conversation={mockConversation} />);

      expect(screen.getByText(/Now get to work/)).toBeInTheDocument();
    });

    it('displays CONSTANT VIGILANCE after asking question', () => {
      render(<BriefingModal {...defaultProps} conversation={mockConversation} />);

      expect(screen.getByText(/CONSTANT VIGILANCE/)).toBeInTheDocument();
    });

    it('preserves whitespace in messages', () => {
      render(<BriefingModal {...defaultProps} />);

      const content = screen.getByText(/VICTIM: Third-year student/);
      expect(content).toHaveClass('whitespace-pre-wrap');
    });
  });

  // ------------------------------------------
  // Teaching Question Choice Tests
  // ------------------------------------------

  describe('Teaching Question Choices', () => {
    it('renders choice buttons when not answered', () => {
      render(<BriefingModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: '25%' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '50%' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '85%' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Almost all (95%+)' })).toBeInTheDocument();
    });

    it('calls onSelectChoice when choice clicked', async () => {
      const user = userEvent.setup();
      const onSelectChoice = vi.fn();

      render(<BriefingModal {...defaultProps} onSelectChoice={onSelectChoice} />);

      await user.click(screen.getByRole('button', { name: '85%' }));

      expect(onSelectChoice).toHaveBeenCalledWith('85_percent');
    });

    it('hides choice buttons after selection', () => {
      render(
        <BriefingModal
          {...defaultProps}
          selectedChoice="85_percent"
          choiceResponse="*nods* Correct. 85%. Hogwarts is dangerous."
        />
      );

      expect(screen.queryByRole('button', { name: '25%' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '50%' })).not.toBeInTheDocument();
    });

    it('shows player choice as message after selection', () => {
      render(
        <BriefingModal
          {...defaultProps}
          selectedChoice="85_percent"
          choiceResponse="*nods* Correct. 85%. Hogwarts is dangerous."
        />
      );

      expect(screen.getByText('My answer: 85%')).toBeInTheDocument();
    });

    it('shows YOU label for player choice', () => {
      render(
        <BriefingModal
          {...defaultProps}
          selectedChoice="85_percent"
          choiceResponse="*nods* Correct."
        />
      );

      expect(screen.getByText('YOU:')).toBeInTheDocument();
    });

    it('shows Moody response after selection', () => {
      render(
        <BriefingModal
          {...defaultProps}
          selectedChoice="85_percent"
          choiceResponse="*nods* Correct. 85%. Hogwarts is dangerous."
        />
      );

      expect(screen.getByText(/\*nods\* Correct. 85%/)).toBeInTheDocument();
    });

    it('shows concept summary after response', () => {
      render(
        <BriefingModal
          {...defaultProps}
          selectedChoice="85_percent"
          choiceResponse="*nods* Correct."
        />
      );

      expect(screen.getByText(/That's base rates, recruit/)).toBeInTheDocument();
    });

    it('choice buttons have amber text', () => {
      render(<BriefingModal {...defaultProps} />);

      const button = screen.getByRole('button', { name: '85%' });
      expect(button).toHaveClass('text-amber-400');
    });

    it('choice buttons are disabled when loading', () => {
      render(<BriefingModal {...defaultProps} loading={true} />);

      const button = screen.getByRole('button', { name: '85%' });
      expect(button).toBeDisabled();
    });
  });

  // ------------------------------------------
  // Q&A Section Tests
  // ------------------------------------------

  describe('Q&A Section', () => {
    it('renders question input', () => {
      render(<BriefingModal {...defaultProps} />);

      expect(
        screen.getByPlaceholderText('Ask Mad-Eye a question...')
      ).toBeInTheDocument();
    });

    it('renders Ask button', () => {
      render(<BriefingModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Ask' })).toBeInTheDocument();
    });

    it('input has aria-label', () => {
      render(<BriefingModal {...defaultProps} />);

      const input = screen.getByPlaceholderText('Ask Mad-Eye a question...');
      expect(input).toHaveAttribute('aria-label', 'Question for Moody');
    });

    it('displays conversation history', () => {
      render(
        <BriefingModal {...defaultProps} conversation={mockConversation} />
      );

      expect(screen.getByText('What are base rates?')).toBeInTheDocument();
      expect(
        screen.getByText(/Base rates are prior probabilities/)
      ).toBeInTheDocument();
    });

    it('shows Ctrl+Enter hint', () => {
      render(<BriefingModal {...defaultProps} />);

      expect(screen.getByText('Press Ctrl+Enter to submit')).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Question Submission Tests
  // ------------------------------------------

  describe('Question Submission', () => {
    it('calls onAskQuestion when form is submitted', async () => {
      const user = userEvent.setup();
      const onAskQuestion = vi.fn().mockResolvedValue(undefined);

      render(<BriefingModal {...defaultProps} onAskQuestion={onAskQuestion} />);

      const input = screen.getByPlaceholderText('Ask Mad-Eye a question...');
      await user.type(input, 'What are base rates?');
      await user.click(screen.getByRole('button', { name: 'Ask' }));

      expect(onAskQuestion).toHaveBeenCalledWith('What are base rates?');
    });

    it('clears input after submission', async () => {
      const user = userEvent.setup();
      const onAskQuestion = vi.fn().mockResolvedValue(undefined);

      render(<BriefingModal {...defaultProps} onAskQuestion={onAskQuestion} />);

      const input = screen.getByPlaceholderText('Ask Mad-Eye a question...');
      await user.type(input, 'Test question');
      await user.click(screen.getByRole('button', { name: 'Ask' }));

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });

    it('trims whitespace from question', async () => {
      const user = userEvent.setup();
      const onAskQuestion = vi.fn().mockResolvedValue(undefined);

      render(<BriefingModal {...defaultProps} onAskQuestion={onAskQuestion} />);

      const input = screen.getByPlaceholderText('Ask Mad-Eye a question...');
      await user.type(input, '  Test question  ');
      await user.click(screen.getByRole('button', { name: 'Ask' }));

      expect(onAskQuestion).toHaveBeenCalledWith('Test question');
    });

    it('does not submit empty questions', async () => {
      const user = userEvent.setup();
      const onAskQuestion = vi.fn().mockResolvedValue(undefined);

      render(<BriefingModal {...defaultProps} onAskQuestion={onAskQuestion} />);

      await user.click(screen.getByRole('button', { name: 'Ask' }));

      expect(onAskQuestion).not.toHaveBeenCalled();
    });

    it('submits on Ctrl+Enter', async () => {
      const user = userEvent.setup();
      const onAskQuestion = vi.fn().mockResolvedValue(undefined);

      render(<BriefingModal {...defaultProps} onAskQuestion={onAskQuestion} />);

      const input = screen.getByPlaceholderText('Ask Mad-Eye a question...');
      await user.type(input, 'Test question');
      await user.keyboard('{Control>}{Enter}{/Control}');

      expect(onAskQuestion).toHaveBeenCalledWith('Test question');
    });

    it('submits on Meta+Enter (Mac)', async () => {
      const user = userEvent.setup();
      const onAskQuestion = vi.fn().mockResolvedValue(undefined);

      render(<BriefingModal {...defaultProps} onAskQuestion={onAskQuestion} />);

      const input = screen.getByPlaceholderText('Ask Mad-Eye a question...');
      await user.type(input, 'Test question');
      await user.keyboard('{Meta>}{Enter}{/Meta}');

      expect(onAskQuestion).toHaveBeenCalledWith('Test question');
    });
  });

  // ------------------------------------------
  // Start Investigation Button Tests
  // ------------------------------------------

  describe('Start Investigation Button', () => {
    it('renders Start Investigation button', () => {
      render(<BriefingModal {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: 'Start Investigation' })
      ).toBeInTheDocument();
    });

    it('button has amber background', () => {
      render(<BriefingModal {...defaultProps} />);

      const button = screen.getByRole('button', { name: 'Start Investigation' });
      expect(button).toHaveClass('bg-amber-700');
    });

    it('button has uppercase text', () => {
      render(<BriefingModal {...defaultProps} />);

      const button = screen.getByRole('button', { name: 'Start Investigation' });
      expect(button).toHaveClass('uppercase');
    });

    it('calls onComplete when button clicked', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      render(<BriefingModal {...defaultProps} onComplete={onComplete} />);

      await user.click(
        screen.getByRole('button', { name: 'Start Investigation' })
      );

      expect(onComplete).toHaveBeenCalled();
    });

    it('button is disabled when loading', () => {
      render(<BriefingModal {...defaultProps} loading={true} />);

      const button = screen.getByRole('button', { name: 'Start Investigation' });
      expect(button).toBeDisabled();
    });
  });

  // ------------------------------------------
  // Loading State Tests
  // ------------------------------------------

  describe('Loading States', () => {
    it('disables input when loading', () => {
      render(<BriefingModal {...defaultProps} loading={true} />);

      const input = screen.getByPlaceholderText('Ask Mad-Eye a question...');
      expect(input).toBeDisabled();
    });

    it('disables Ask button when loading', () => {
      render(<BriefingModal {...defaultProps} loading={true} />);

      const button = screen.getByRole('button', { name: /Asking/i });
      expect(button).toBeDisabled();
    });

    it('shows loading spinner on Ask button', () => {
      render(<BriefingModal {...defaultProps} loading={true} />);

      expect(screen.getByText('Asking...')).toBeInTheDocument();
    });

    it('does not submit question when loading', async () => {
      const user = userEvent.setup();
      const onAskQuestion = vi.fn().mockResolvedValue(undefined);

      render(
        <BriefingModal
          {...defaultProps}
          onAskQuestion={onAskQuestion}
          loading={true}
        />
      );

      // Input is disabled, so we can only click the button (which is also disabled)
      await user.click(screen.getByRole('button', { name: /Asking/i }));

      expect(onAskQuestion).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------
  // Button State Tests
  // ------------------------------------------

  describe('Button States', () => {
    it('Ask button disabled when input is empty', () => {
      render(<BriefingModal {...defaultProps} />);

      const button = screen.getByRole('button', { name: 'Ask' });
      expect(button).toBeDisabled();
    });

    it('Ask button enabled when input has text', async () => {
      const user = userEvent.setup();
      render(<BriefingModal {...defaultProps} />);

      const input = screen.getByPlaceholderText('Ask Mad-Eye a question...');
      await user.type(input, 'Test');

      const button = screen.getByRole('button', { name: 'Ask' });
      expect(button).not.toBeDisabled();
    });
  });

  // ------------------------------------------
  // Styling Tests
  // ------------------------------------------

  describe('Styling', () => {
    it('uses font-mono throughout', () => {
      render(<BriefingModal {...defaultProps} />);

      const container = screen.getByText(/VICTIM: Third-year student/).closest('.font-mono');
      expect(container).toBeInTheDocument();
    });

    it('has gray-900 background', () => {
      render(<BriefingModal {...defaultProps} />);

      const container = screen.getByText(/VICTIM: Third-year student/).closest('.bg-gray-900');
      expect(container).toBeInTheDocument();
    });

    it('has max-height for scrolling', () => {
      render(<BriefingModal {...defaultProps} />);

      const container = screen.getByText(/VICTIM: Third-year student/).closest('.max-h-\\[80vh\\]');
      expect(container).toBeInTheDocument();
    });

    it('has overflow-y-auto for scrolling', () => {
      render(<BriefingModal {...defaultProps} />);

      const container = screen
        .getByText(/VICTIM: Third-year student/)
        .closest('.overflow-y-auto');
      expect(container).toBeInTheDocument();
    });

    it('input has focus ring styling', () => {
      render(<BriefingModal {...defaultProps} />);

      const input = screen.getByPlaceholderText('Ask Mad-Eye a question...');
      expect(input).toHaveClass('focus:border-amber-500');
      expect(input).toHaveClass('focus:ring-amber-500');
    });
  });

  // ------------------------------------------
  // Accessibility Tests
  // ------------------------------------------

  describe('Accessibility', () => {
    it('input is a textarea for multiline questions', () => {
      render(<BriefingModal {...defaultProps} />);

      const input = screen.getByPlaceholderText('Ask Mad-Eye a question...');
      expect(input.tagName.toLowerCase()).toBe('textarea');
    });

    it('textarea is resizable none', () => {
      render(<BriefingModal {...defaultProps} />);

      const input = screen.getByPlaceholderText('Ask Mad-Eye a question...');
      expect(input).toHaveClass('resize-none');
    });

    it('loading spinner is aria-hidden', () => {
      render(<BriefingModal {...defaultProps} loading={true} />);

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });
  });

  // ------------------------------------------
  // Conditional Transition Tests
  // ------------------------------------------

  describe('Conditional Transition', () => {
    it('hides transition when conversation is empty', () => {
      render(<BriefingModal {...defaultProps} conversation={[]} />);

      expect(screen.queryByText(/Now get to work/)).not.toBeInTheDocument();
      expect(screen.queryByText(/CONSTANT VIGILANCE/)).not.toBeInTheDocument();
    });

    it('shows transition when conversation has entries', () => {
      render(<BriefingModal {...defaultProps} conversation={mockConversation} />);

      expect(screen.getByText(/Now get to work/)).toBeInTheDocument();
      expect(screen.getByText(/CONSTANT VIGILANCE/)).toBeInTheDocument();
    });

    it('shows transition after player asks first question', async () => {
      const user = userEvent.setup();
      let conversationState: BriefingConversation[] = [];

      const onAskQuestion = vi.fn().mockImplementation(() => {
        conversationState = [
          { question: 'Test question', answer: 'Test answer' },
        ];
        return Promise.resolve();
      });

      const { rerender } = render(
        <BriefingModal
          {...defaultProps}
          conversation={conversationState}
          onAskQuestion={onAskQuestion}
        />
      );

      // Initially hidden
      expect(screen.queryByText(/CONSTANT VIGILANCE/)).not.toBeInTheDocument();

      // Type and submit question
      const input = screen.getByPlaceholderText('Ask Mad-Eye a question...');
      await user.type(input, 'Test question');
      await user.click(screen.getByRole('button', { name: 'Ask' }));

      // Rerender with updated conversation
      rerender(
        <BriefingModal
          {...defaultProps}
          conversation={conversationState}
          onAskQuestion={onAskQuestion}
        />
      );

      // Now visible
      expect(screen.getByText(/CONSTANT VIGILANCE/)).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Edge Cases
  // ------------------------------------------

  describe('Edge Cases', () => {
    it('handles missing transition text when conversation present', () => {
      const briefingNoTransition = {
        ...mockBriefing,
        transition: '',
      };

      render(
        <BriefingModal
          {...defaultProps}
          briefing={briefingNoTransition}
          conversation={mockConversation}
        />
      );

      // Should still render Start Investigation button
      expect(
        screen.getByRole('button', { name: 'Start Investigation' })
      ).toBeInTheDocument();
    });

    it('handles empty transition with no conversation', () => {
      const briefingNoTransition = {
        ...mockBriefing,
        transition: '',
      };

      render(
        <BriefingModal {...defaultProps} briefing={briefingNoTransition} conversation={[]} />
      );

      // Should still render without errors
      expect(
        screen.getByRole('button', { name: 'Start Investigation' })
      ).toBeInTheDocument();
    });

    it('handles long conversation history', () => {
      const longConversation: BriefingConversation[] = Array.from(
        { length: 10 },
        (_, i) => ({
          question: `Question ${i + 1}`,
          answer: `Answer ${i + 1}`,
        })
      );

      render(
        <BriefingModal {...defaultProps} conversation={longConversation} />
      );

      // Should render all conversations
      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getByText('Question 10')).toBeInTheDocument();
    });

    it('handles special characters in content', () => {
      const briefingSpecialChars = {
        ...mockBriefing,
        case_assignment: 'Test <script>alert("xss")</script> content',
      };

      render(
        <BriefingModal {...defaultProps} briefing={briefingSpecialChars} />
      );

      // Should escape HTML
      expect(screen.getByText(/Test.*content/)).toBeInTheDocument();
    });
  });
});
