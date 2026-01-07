/**
 * BriefingMessage Component Tests
 *
 * Tests for the dialogue message bubble component.
 *
 * @module components/__tests__/BriefingMessage.test
 * @since Phase 3.6
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BriefingMessage } from '../BriefingMessage';

describe('BriefingMessage', () => {
  describe('Moody Messages', () => {
    it('renders Moody label', () => {
      render(<BriefingMessage speaker="moody" text="Test message" />);

      expect(screen.getByText('MOODY:')).toBeInTheDocument();
    });

    it('renders message text', () => {
      render(<BriefingMessage speaker="moody" text="Test message content" />);

      expect(screen.getByText('Test message content')).toBeInTheDocument();
    });

    it('has amber color for Moody label', () => {
      render(<BriefingMessage speaker="moody" text="Test" />);

      const label = screen.getByText('MOODY:');
      expect(label).toHaveClass('text-amber-400');
    });

    it('has gray-300 text for Moody messages', () => {
      render(<BriefingMessage speaker="moody" text="Test message" />);

      const content = screen.getByText('Test message');
      expect(content).toHaveClass('text-gray-300');
    });

    it('does not have left margin for Moody messages', () => {
      render(<BriefingMessage speaker="moody" text="Test" />);

      const container = screen.getByText('MOODY:').parentElement?.parentElement;
      expect(container).not.toHaveClass('ml-8');
    });
  });

  describe('Player Messages', () => {
    it('renders YOU label', () => {
      render(<BriefingMessage speaker="player" text="Test message" />);

      expect(screen.getByText('YOU:')).toBeInTheDocument();
    });

    it('renders message text', () => {
      render(<BriefingMessage speaker="player" text="Player message content" />);

      expect(screen.getByText('Player message content')).toBeInTheDocument();
    });

    it('has gray color for YOU label', () => {
      render(<BriefingMessage speaker="player" text="Test" />);

      const label = screen.getByText('YOU:');
      expect(label).toHaveClass('text-gray-400');
    });

    it('has gray-400 text for player messages', () => {
      render(<BriefingMessage speaker="player" text="Player message" />);

      const content = screen.getByText('Player message');
      expect(content).toHaveClass('text-gray-400');
    });

    it('has left margin for player messages', () => {
      render(<BriefingMessage speaker="player" text="Test" />);

      const container = screen.getByText('YOU:').parentElement?.parentElement;
      expect(container).toHaveClass('ml-8');
    });
  });

  describe('Styling', () => {
    it('preserves whitespace', () => {
      render(<BriefingMessage speaker="moody" text="Line 1\nLine 2" />);

      const content = screen.getByText(/Line 1/);
      expect(content).toHaveClass('whitespace-pre-wrap');
    });

    it('has relaxed line height', () => {
      render(<BriefingMessage speaker="moody" text="Test message" />);

      const content = screen.getByText('Test message');
      expect(content).toHaveClass('leading-relaxed');
    });

    it('has small text size', () => {
      render(<BriefingMessage speaker="moody" text="Test message" />);

      const content = screen.getByText('Test message');
      expect(content).toHaveClass('text-sm');
    });

    it('has bottom margin for spacing', () => {
      render(<BriefingMessage speaker="moody" text="Test" />);

      const container = screen.getByText('MOODY:').parentElement?.parentElement;
      expect(container).toHaveClass('mb-4');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty text', () => {
      render(<BriefingMessage speaker="moody" text="" />);

      expect(screen.getByText('MOODY:')).toBeInTheDocument();
    });

    it('handles special characters', () => {
      render(<BriefingMessage speaker="moody" text="*pauses* Test <content>" />);

      expect(screen.getByText('*pauses* Test <content>')).toBeInTheDocument();
    });

    it('handles multiline text', () => {
      const multilineText = `Line 1
Line 2
Line 3`;
      render(<BriefingMessage speaker="moody" text={multilineText} />);

      expect(screen.getByText(/Line 1/)).toBeInTheDocument();
    });
  });
});
