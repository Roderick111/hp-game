/**
 * WitnessInterview Component Tests
 *
 * Tests for the witness interrogation interface including:
 * - Trust meter display
 * - Conversation history rendering
 * - Question input handling
 * - Evidence presentation UI
 * - Secret revelation display
 *
 * @module components/__tests__/WitnessInterview.test
 * @since Phase 2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WitnessInterview } from '../WitnessInterview';
import type { WitnessInfo, WitnessConversationItem } from '../../types/investigation';

// ============================================
// Test Data
// ============================================

const mockWitness: WitnessInfo = {
  id: 'hermione',
  name: 'Hermione Granger',
  personality: 'helpful',
  trust: 55,
  secrets_revealed: [],
};

const mockConversation: WitnessConversationItem[] = [
  {
    question: 'What did you see?',
    response: 'I was in the library studying when I heard a noise.',
    timestamp: '2026-01-05T12:00:00Z',
    trust_delta: 5,
  },
];

const defaultProps = {
  witness: mockWitness,
  conversation: [],
  trust: 55,
  secretsRevealed: [],
  discoveredEvidence: [],
  loading: false,
  error: null,
  onAskQuestion: vi.fn(),
  onPresentEvidence: vi.fn(),
  onClearError: vi.fn(),
};

// ============================================
// Test Suite
// ============================================

describe('WitnessInterview', () => {
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
    it('renders witness personality', () => {
      render(<WitnessInterview {...defaultProps} />);

      // Personality text displayed directly (title now in Modal, not component)
      expect(screen.getByText('helpful')).toBeInTheDocument();
    });

    it('renders trust meter with correct percentage', () => {
      render(<WitnessInterview {...defaultProps} trust={55} />);

      expect(screen.getByText('55%')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '55');
    });

    it('renders question input textarea', () => {
      render(<WitnessInterview {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/What do you know about the incident/i);
      expect(textarea).toBeInTheDocument();
    });

    it('renders question input textarea', () => {
      render(<WitnessInterview {...defaultProps} />);

      expect(screen.getByPlaceholderText(/What do you know about the incident/i)).toBeInTheDocument();
    });

    it('renders empty conversation placeholder', () => {
      render(<WitnessInterview {...defaultProps} conversation={[]} />);

      expect(screen.getByText(/Begin your interrogation/i)).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Trust Meter Tests
  // ------------------------------------------

  describe('Trust Meter', () => {
    it('shows red color for low trust (<30)', () => {
      render(<WitnessInterview {...defaultProps} trust={20} />);

      expect(screen.getByText('20%')).toHaveClass('text-red-400');
    });

    it('shows yellow color for medium trust (30-70)', () => {
      render(<WitnessInterview {...defaultProps} trust={50} />);

      expect(screen.getByText('50%')).toHaveClass('text-yellow-400');
    });

    it('shows green color for high trust (>70)', () => {
      render(<WitnessInterview {...defaultProps} trust={80} />);

      expect(screen.getByText('80%')).toHaveClass('text-green-400');
    });

    it('shows trust delta when present in conversation', () => {
      render(
        <WitnessInterview
          {...defaultProps}
          trust={60}
          conversation={mockConversation}
        />
      );

      expect(screen.getByText('(+5)')).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Conversation History Tests
  // ------------------------------------------

  describe('Conversation History', () => {
    it('renders conversation items', () => {
      render(
        <WitnessInterview {...defaultProps} conversation={mockConversation} />
      );

      expect(screen.getByText('What did you see?')).toBeInTheDocument();
      expect(
        screen.getByText(/I was in the library studying when I heard a noise/i)
      ).toBeInTheDocument();
    });

    it('shows witness name in responses', () => {
      render(
        <WitnessInterview {...defaultProps} conversation={mockConversation} />
      );

      expect(screen.getByText('Hermione Granger')).toBeInTheDocument();
    });

    it('shows trust delta for conversation items', () => {
      render(
        <WitnessInterview {...defaultProps} conversation={mockConversation} />
      );

      expect(screen.getByText(/Trust \+5/i)).toBeInTheDocument();
    });

    it('renders evidence presentation in conversation', () => {
      const conversationWithEvidence: WitnessConversationItem[] = [
        {
          question: '[Presented evidence: hidden_note]',
          response: 'Where did you find that?!',
          timestamp: '2026-01-05T12:00:00Z',
          trust_delta: 5,
        },
      ];

      render(
        <WitnessInterview {...defaultProps} conversation={conversationWithEvidence} />
      );

      expect(screen.getByText(/\[Presented evidence: hidden_note\]/i)).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Input Handling Tests
  // ------------------------------------------

  describe('Input Handling', () => {
    it('updates input value when typing', async () => {
      const user = userEvent.setup();
      render(<WitnessInterview {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/What do you know about the incident/i);
      await user.type(textarea, 'Tell me what happened');

      expect(textarea).toHaveValue('Tell me what happened');
    });

    it('disables textarea when loading', () => {
      render(<WitnessInterview {...defaultProps} loading={true} />);

      const textarea = screen.getByPlaceholderText(/What do you know about the incident/i);
      expect(textarea).toBeDisabled();
    });

    it('enables textarea when not loading', () => {
      render(<WitnessInterview {...defaultProps} loading={false} />);

      const textarea = screen.getByPlaceholderText(/What do you know about the incident/i);
      expect(textarea).not.toBeDisabled();
    });

    it('calls onAskQuestion via keyboard submit', async () => {
      const user = userEvent.setup();
      const onAskQuestion = vi.fn().mockResolvedValue(undefined);

      render(<WitnessInterview {...defaultProps} onAskQuestion={onAskQuestion} />);

      const textarea = screen.getByPlaceholderText(/What do you know about the incident/i);
      await user.type(textarea, 'What did you see?');
      await user.keyboard('{Control>}{Enter}{/Control}');

      expect(onAskQuestion).toHaveBeenCalledWith('What did you see?');
    });

    it('clears input after submission', async () => {
      const user = userEvent.setup();
      const onAskQuestion = vi.fn().mockResolvedValue(undefined);

      render(<WitnessInterview {...defaultProps} onAskQuestion={onAskQuestion} />);

      const textarea = screen.getByPlaceholderText(/What do you know about the incident/i);
      await user.type(textarea, 'Question');
      await user.keyboard('{Control>}{Enter}{/Control}');

      expect(textarea).toHaveValue('');
    });

    it('submits on Ctrl+Enter', async () => {
      const user = userEvent.setup();
      const onAskQuestion = vi.fn().mockResolvedValue(undefined);

      render(<WitnessInterview {...defaultProps} onAskQuestion={onAskQuestion} />);

      const textarea = screen.getByPlaceholderText(/What do you know about the incident/i);
      await user.type(textarea, 'Question');
      await user.keyboard('{Control>}{Enter}{/Control}');

      expect(onAskQuestion).toHaveBeenCalledWith('Question');
    });
  });

  // ------------------------------------------
  // Evidence Presentation Tests
  // ------------------------------------------

  describe('Evidence Presentation', () => {
    it('renders evidence button when evidence available', () => {
      render(
        <WitnessInterview
          {...defaultProps}
          discoveredEvidence={['hidden_note', 'wand_signature']}
        />
      );

      expect(
        screen.getByRole('button', { name: /Present Evidence/i })
      ).toBeInTheDocument();
    });

    it('shows evidence count', () => {
      render(
        <WitnessInterview
          {...defaultProps}
          discoveredEvidence={['hidden_note', 'wand_signature']}
        />
      );

      expect(screen.getByText(/2 available/i)).toBeInTheDocument();
    });

    it('does not render evidence button when no evidence', () => {
      render(<WitnessInterview {...defaultProps} discoveredEvidence={[]} />);

      expect(
        screen.queryByRole('button', { name: /Present Evidence/i })
      ).not.toBeInTheDocument();
    });

    it('shows evidence menu when button clicked', async () => {
      const user = userEvent.setup();
      render(
        <WitnessInterview
          {...defaultProps}
          discoveredEvidence={['hidden_note', 'wand_signature']}
        />
      );

      const button = screen.getByRole('button', { name: /Present Evidence/i });
      await user.click(button);

      expect(screen.getByText('hidden_note')).toBeInTheDocument();
      expect(screen.getByText('wand_signature')).toBeInTheDocument();
    });

    it('calls onPresentEvidence when evidence selected', async () => {
      const user = userEvent.setup();
      const onPresentEvidence = vi.fn().mockResolvedValue(undefined);

      render(
        <WitnessInterview
          {...defaultProps}
          discoveredEvidence={['hidden_note']}
          onPresentEvidence={onPresentEvidence}
        />
      );

      const button = screen.getByRole('button', { name: /Present Evidence/i });
      await user.click(button);

      const evidenceButton = screen.getByText('hidden_note');
      await user.click(evidenceButton);

      expect(onPresentEvidence).toHaveBeenCalledWith('hidden_note');
    });
  });

  // ------------------------------------------
  // Secrets Revealed Tests
  // ------------------------------------------

  describe('Secrets Revealed', () => {
    it('renders secrets revealed toast when secrets exist', () => {
      render(
        <WitnessInterview
          {...defaultProps}
          secretsRevealed={['secret_1', 'secret_2']}
        />
      );

      expect(screen.getByText(/Secrets Revealed/i)).toBeInTheDocument();
      expect(screen.getByText('secret_1')).toBeInTheDocument();
      expect(screen.getByText('secret_2')).toBeInTheDocument();
    });

    it('does not render secrets toast when no secrets', () => {
      render(<WitnessInterview {...defaultProps} secretsRevealed={[]} />);

      expect(screen.queryByText(/Secrets Revealed/i)).not.toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Loading State Tests
  // ------------------------------------------

  describe('Loading State', () => {
    it('disables controls when loading', () => {
      render(<WitnessInterview {...defaultProps} loading={true} />);

      const textarea = screen.getByPlaceholderText(/What do you know about the incident/i);
      expect(textarea).toBeDisabled();
    });

    it('disables evidence button when loading', () => {
      render(
        <WitnessInterview
          {...defaultProps}
          loading={true}
          discoveredEvidence={['hidden_note']}
        />
      );

      const button = screen.getByRole('button', { name: /Present Evidence/i });
      expect(button).toBeDisabled();
    });
  });

  // ------------------------------------------
  // Error Handling Tests
  // ------------------------------------------

  describe('Error Handling', () => {
    it('displays error message', () => {
      render(
        <WitnessInterview {...defaultProps} error="Failed to interrogate witness" />
      );

      expect(screen.getByText(/Failed to interrogate witness/i)).toBeInTheDocument();
    });

    it('calls onClearError when dismiss clicked', async () => {
      const user = userEvent.setup();
      const onClearError = vi.fn();

      render(
        <WitnessInterview
          {...defaultProps}
          error="Some error"
          onClearError={onClearError}
        />
      );

      const dismissButton = screen.getByLabelText(/Dismiss error/i);
      await user.click(dismissButton);

      expect(onClearError).toHaveBeenCalled();
    });
  });

  // ------------------------------------------
  // Accessibility Tests
  // ------------------------------------------

  describe('Accessibility', () => {
    it('has accessible trust meter', () => {
      render(<WitnessInterview {...defaultProps} trust={55} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '55');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
      expect(progressbar).toHaveAttribute('aria-label', 'Trust level: 55%');
    });

    it('has accessible question input', () => {
      render(<WitnessInterview {...defaultProps} />);

      const textarea = screen.getByLabelText(/Enter your question/i);
      expect(textarea).toBeInTheDocument();
    });
  });
});
