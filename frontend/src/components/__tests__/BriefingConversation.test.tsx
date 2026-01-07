/**
 * BriefingConversation Component Tests
 *
 * Tests for the Q&A history display:
 * - Empty state rendering
 * - Question display with styling
 * - Answer display with styling
 * - Multiple exchanges
 * - Accessibility attributes
 *
 * @module components/__tests__/BriefingConversation.test
 * @since Phase 3.5
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BriefingConversation } from '../BriefingConversation';
import type { BriefingConversation as BriefingConversationType } from '../../types/investigation';

// ============================================
// Test Data
// ============================================

const mockConversation: BriefingConversationType[] = [
  {
    question: 'What are base rates?',
    answer: 'Base rates are prior probabilities before evidence.',
  },
  {
    question: 'Where should I start?',
    answer: 'Start at the crime scene. Observe first, theorize later.',
  },
];

const singleExchange: BriefingConversationType[] = [
  {
    question: 'Test question?',
    answer: 'Test answer.',
  },
];

// ============================================
// Test Suite
// ============================================

describe('BriefingConversation', () => {
  // ------------------------------------------
  // Empty State Tests
  // ------------------------------------------

  describe('Empty State', () => {
    it('renders nothing when conversation is empty', () => {
      const { container } = render(<BriefingConversation conversation={[]} />);

      expect(container.firstChild).toBeNull();
    });
  });

  // ------------------------------------------
  // Question Display Tests
  // ------------------------------------------

  describe('Question Display', () => {
    it('displays question text', () => {
      render(<BriefingConversation conversation={singleExchange} />);

      expect(screen.getByText('Test question?')).toBeInTheDocument();
    });

    it('displays "You:" prefix for questions', () => {
      render(<BriefingConversation conversation={singleExchange} />);

      expect(screen.getByText('You:')).toBeInTheDocument();
    });

    it('displays all questions in order', () => {
      render(<BriefingConversation conversation={mockConversation} />);

      expect(screen.getByText('What are base rates?')).toBeInTheDocument();
      expect(screen.getByText('Where should I start?')).toBeInTheDocument();
    });

    it('applies gray-700 background to question containers', () => {
      render(<BriefingConversation conversation={singleExchange} />);

      const questionContainer = screen.getByText('Test question?').parentElement;
      expect(questionContainer).toHaveClass('bg-gray-700');
    });

    it('preserves whitespace in questions', () => {
      const multiLineQuestion: BriefingConversationType[] = [
        {
          question: 'Line 1\nLine 2',
          answer: 'Answer',
        },
      ];

      render(<BriefingConversation conversation={multiLineQuestion} />);

      // Find by partial text since getByText normalizes whitespace
      const questionText = screen.getByText((content, element) => {
        return element?.tagName === 'P' && content.includes('Line 1') && content.includes('Line 2');
      });
      expect(questionText).toHaveClass('whitespace-pre-wrap');
    });
  });

  // ------------------------------------------
  // Answer Display Tests
  // ------------------------------------------

  describe('Answer Display', () => {
    it('displays answer text', () => {
      render(<BriefingConversation conversation={singleExchange} />);

      expect(screen.getByText('Test answer.')).toBeInTheDocument();
    });

    it('displays "Moody:" prefix for answers', () => {
      render(<BriefingConversation conversation={singleExchange} />);

      expect(screen.getByText('Moody:')).toBeInTheDocument();
    });

    it('displays all answers in order', () => {
      render(<BriefingConversation conversation={mockConversation} />);

      expect(
        screen.getByText('Base rates are prior probabilities before evidence.')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Start at the crime scene. Observe first, theorize later.')
      ).toBeInTheDocument();
    });

    it('applies gray-800 background to answer containers', () => {
      render(<BriefingConversation conversation={singleExchange} />);

      const answerContainer = screen.getByText('Test answer.').parentElement;
      expect(answerContainer).toHaveClass('bg-gray-800');
    });

    it('applies amber border to answer containers', () => {
      render(<BriefingConversation conversation={singleExchange} />);

      const answerContainer = screen.getByText('Test answer.').parentElement;
      expect(answerContainer).toHaveClass('border-amber-900/50');
    });

    it('applies amber text color to answers', () => {
      render(<BriefingConversation conversation={singleExchange} />);

      const answerText = screen.getByText('Test answer.');
      expect(answerText).toHaveClass('text-amber-400/90');
    });

    it('preserves whitespace in answers', () => {
      const multiLineAnswer: BriefingConversationType[] = [
        {
          question: 'Question',
          answer: 'Line 1\nLine 2\nLine 3',
        },
      ];

      render(<BriefingConversation conversation={multiLineAnswer} />);

      // Find by partial text since getByText normalizes whitespace
      const answerText = screen.getByText((content, element) => {
        return element?.tagName === 'P' && content.includes('Line 1') && content.includes('Line 3');
      });
      expect(answerText).toHaveClass('whitespace-pre-wrap');
    });
  });

  // ------------------------------------------
  // Multiple Exchanges Tests
  // ------------------------------------------

  describe('Multiple Exchanges', () => {
    it('renders all exchanges', () => {
      render(<BriefingConversation conversation={mockConversation} />);

      // Should have 2 "You:" prefixes
      expect(screen.getAllByText('You:')).toHaveLength(2);

      // Should have 2 "Moody:" prefixes
      expect(screen.getAllByText('Moody:')).toHaveLength(2);
    });

    it('renders exchanges in order', () => {
      render(<BriefingConversation conversation={mockConversation} />);

      const container = screen.getByRole('log');
      const questions = container.querySelectorAll('.bg-gray-700');

      // First question should be "What are base rates?"
      expect(questions[0].textContent).toContain('What are base rates?');

      // Second question should be "Where should I start?"
      expect(questions[1].textContent).toContain('Where should I start?');
    });
  });

  // ------------------------------------------
  // Scroll Container Tests
  // ------------------------------------------

  describe('Scroll Container', () => {
    it('has max-height for scrolling', () => {
      render(<BriefingConversation conversation={mockConversation} />);

      const container = screen.getByRole('log');
      expect(container).toHaveClass('max-h-64');
    });

    it('has overflow-y-auto for scrolling', () => {
      render(<BriefingConversation conversation={mockConversation} />);

      const container = screen.getByRole('log');
      expect(container).toHaveClass('overflow-y-auto');
    });

    it('has padding-right for scrollbar', () => {
      render(<BriefingConversation conversation={mockConversation} />);

      const container = screen.getByRole('log');
      expect(container).toHaveClass('pr-2');
    });
  });

  // ------------------------------------------
  // Accessibility Tests
  // ------------------------------------------

  describe('Accessibility', () => {
    it('has role="log" for screen readers', () => {
      render(<BriefingConversation conversation={mockConversation} />);

      expect(screen.getByRole('log')).toBeInTheDocument();
    });

    it('has aria-label describing the conversation', () => {
      render(<BriefingConversation conversation={mockConversation} />);

      const container = screen.getByRole('log');
      expect(container).toHaveAttribute(
        'aria-label',
        'Conversation history with Moody'
      );
    });

    it('question prefix has uppercase tracking', () => {
      render(<BriefingConversation conversation={singleExchange} />);

      const youPrefix = screen.getByText('You:');
      expect(youPrefix).toHaveClass('uppercase');
      expect(youPrefix).toHaveClass('tracking-wider');
    });

    it('answer prefix has uppercase tracking', () => {
      render(<BriefingConversation conversation={singleExchange} />);

      const moodyPrefix = screen.getByText('Moody:');
      expect(moodyPrefix).toHaveClass('uppercase');
      expect(moodyPrefix).toHaveClass('tracking-wider');
    });
  });

  // ------------------------------------------
  // Styling Tests
  // ------------------------------------------

  describe('Styling', () => {
    it('questions have gray-400 prefix color', () => {
      render(<BriefingConversation conversation={singleExchange} />);

      const youPrefix = screen.getByText('You:');
      expect(youPrefix).toHaveClass('text-gray-400');
    });

    it('answers have amber-400 prefix color', () => {
      render(<BriefingConversation conversation={singleExchange} />);

      const moodyPrefix = screen.getByText('Moody:');
      expect(moodyPrefix).toHaveClass('text-amber-400');
    });

    it('question text has gray-200 color', () => {
      render(<BriefingConversation conversation={singleExchange} />);

      const questionText = screen.getByText('Test question?');
      expect(questionText).toHaveClass('text-gray-200');
    });

    it('answer text has leading-relaxed spacing', () => {
      render(<BriefingConversation conversation={singleExchange} />);

      const answerText = screen.getByText('Test answer.');
      expect(answerText).toHaveClass('leading-relaxed');
    });
  });
});
