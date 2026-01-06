/**
 * EvidenceModal Component Tests
 *
 * Tests for the evidence details modal including:
 * - Rendering evidence details
 * - Loading state
 * - Error state
 * - Close functionality
 *
 * @module components/__tests__/EvidenceModal.test
 * @since Phase 2.5
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvidenceModal } from '../EvidenceModal';
import type { EvidenceDetails } from '../../types/investigation';

// ============================================
// Test Data
// ============================================

const mockEvidence: EvidenceDetails = {
  id: 'hidden_note',
  name: 'Hidden Note',
  location_found: 'Library - Under the Desk',
  description: 'A crumpled note with strange symbols and what appears to be a confession.',
};

// ============================================
// Test Suite
// ============================================

describe('EvidenceModal', () => {
  // ------------------------------------------
  // Rendering Tests
  // ------------------------------------------

  describe('Rendering', () => {
    it('renders nothing when evidence is null', () => {
      const { container } = render(
        <EvidenceModal evidence={null} onClose={vi.fn()} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders evidence name', () => {
      render(<EvidenceModal evidence={mockEvidence} onClose={vi.fn()} />);

      expect(screen.getByText(/Hidden Note/i)).toBeInTheDocument();
    });

    it('renders evidence location', () => {
      render(<EvidenceModal evidence={mockEvidence} onClose={vi.fn()} />);

      expect(screen.getByText(/Library - Under the Desk/i)).toBeInTheDocument();
    });

    it('renders evidence description', () => {
      render(<EvidenceModal evidence={mockEvidence} onClose={vi.fn()} />);

      expect(screen.getByText(/A crumpled note with strange symbols/i)).toBeInTheDocument();
    });

    it('renders modal title', () => {
      render(<EvidenceModal evidence={mockEvidence} onClose={vi.fn()} />);

      expect(screen.getByText(/Evidence Details/i)).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<EvidenceModal evidence={mockEvidence} onClose={vi.fn()} />);

      // There are multiple close buttons (X and text Close)
      const closeButtons = screen.getAllByRole('button');
      expect(closeButtons.length).toBeGreaterThan(0);
      expect(closeButtons.some(btn => btn.textContent === 'Close')).toBe(true);
    });
  });

  // ------------------------------------------
  // Loading State Tests
  // ------------------------------------------

  describe('Loading State', () => {
    it('shows loading message when loading', () => {
      render(
        <EvidenceModal evidence={null} onClose={vi.fn()} loading={true} />
      );

      expect(screen.getByText(/Loading evidence details/i)).toBeInTheDocument();
    });

    it('still allows closing during loading', () => {
      const onClose = vi.fn();
      render(
        <EvidenceModal evidence={null} onClose={onClose} loading={true} />
      );

      // The modal X button should be available
      const closeButton = screen.getByLabelText(/Close modal/i);
      expect(closeButton).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Error State Tests
  // ------------------------------------------

  describe('Error State', () => {
    it('shows error message when error is set', () => {
      render(
        <EvidenceModal
          evidence={null}
          onClose={vi.fn()}
          error="Failed to load evidence"
        />
      );

      expect(screen.getByText(/Failed to load evidence/i)).toBeInTheDocument();
    });

    it('shows error prefix', () => {
      render(
        <EvidenceModal
          evidence={null}
          onClose={vi.fn()}
          error="Failed to load evidence"
        />
      );

      expect(screen.getByText(/Error:/i)).toBeInTheDocument();
    });

    it('renders close button in error state', () => {
      render(
        <EvidenceModal
          evidence={null}
          onClose={vi.fn()}
          error="Failed to load evidence"
        />
      );

      // There are multiple close buttons (X and text Close)
      const closeButtons = screen.getAllByRole('button');
      expect(closeButtons.length).toBeGreaterThan(0);
    });
  });

  // ------------------------------------------
  // Interaction Tests
  // ------------------------------------------

  describe('Interactions', () => {
    it('calls onClose when close button clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<EvidenceModal evidence={mockEvidence} onClose={onClose} />);

      // Get the "Close" text button (not the X button)
      const closeButtons = screen.getAllByRole('button');
      const textCloseButton = closeButtons.find(btn => btn.textContent === 'Close');

      if (textCloseButton) {
        await user.click(textCloseButton);
        expect(onClose).toHaveBeenCalledTimes(1);
      } else {
        throw new Error('Close text button not found');
      }
    });

    it('calls onClose when modal X clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<EvidenceModal evidence={mockEvidence} onClose={onClose} />);

      // There are two close buttons - the X and the "Close" text button
      // Use getAllByRole and get the first one (the X button)
      const closeButtons = screen.getAllByRole('button');
      const xButton = closeButtons.find(btn =>
        btn.getAttribute('aria-label') === 'Close modal'
      );

      if (xButton) {
        await user.click(xButton);
        expect(onClose).toHaveBeenCalledTimes(1);
      } else {
        throw new Error('X button not found');
      }
    });

    it('calls onClose when backdrop clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<EvidenceModal evidence={mockEvidence} onClose={onClose} />);

      // Click the backdrop (the div with aria-hidden)
      const backdrop = document.querySelector('[aria-hidden="true"]');
      if (backdrop) {
        await user.click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });
  });

  // ------------------------------------------
  // Accessibility Tests
  // ------------------------------------------

  describe('Accessibility', () => {
    it('uses dialog role', () => {
      render(<EvidenceModal evidence={mockEvidence} onClose={vi.fn()} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal attribute', () => {
      render(<EvidenceModal evidence={mockEvidence} onClose={vi.fn()} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });
});
