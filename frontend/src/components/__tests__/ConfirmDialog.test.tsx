/**
 * ConfirmDialog Component Tests
 *
 * Tests for the reusable confirmation dialog:
 * - Rendering with title and message
 * - Confirm/Cancel button functionality
 * - Keyboard accessibility (Escape key)
 * - Destructive mode styling
 *
 * @module components/__tests__/ConfirmDialog.test
 * @since Phase 3.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from '../ConfirmDialog';

// ============================================
// Test Data
// ============================================

const defaultProps = {
  open: true,
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

// ============================================
// Test Suite
// ============================================

describe('ConfirmDialog', () => {
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
    it('renders nothing when closed', () => {
      render(<ConfirmDialog {...defaultProps} open={false} />);
      expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
    });

    it('renders title when open', () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(screen.getByText('[Confirm Action]')).toBeInTheDocument();
    });

    it('renders message when open', () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    });

    it('renders confirm and cancel buttons', () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('renders custom button text', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          confirmText="Delete"
          cancelText="Keep"
        />
      );
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /keep/i })).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Button Interaction Tests
  // ------------------------------------------

  describe('Button Interactions', () => {
    it('calls onConfirm when confirm button clicked', async () => {
      const onConfirm = vi.fn();
      const user = userEvent.setup();

      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      await user.click(screen.getByRole('button', { name: /confirm/i }));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when cancel button clicked', async () => {
      const onCancel = vi.fn();
      const user = userEvent.setup();

      render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when backdrop clicked (via Modal)', async () => {
      const onCancel = vi.fn();
      const user = userEvent.setup();

      render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);

      // Click backdrop (aria-hidden div)
      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
      if (backdrop) {
        await user.click(backdrop);
        expect(onCancel).toHaveBeenCalledTimes(1);
      }
    });
  });

  // ------------------------------------------
  // Keyboard Accessibility Tests
  // ------------------------------------------

  describe('Keyboard Accessibility', () => {
    it('calls onCancel when Escape key pressed', async () => {
      const onCancel = vi.fn();
      const user = userEvent.setup();

      render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);

      await user.keyboard('{Escape}');
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('does not call onCancel on Escape when closed', async () => {
      const onCancel = vi.fn();
      const user = userEvent.setup();

      render(<ConfirmDialog {...defaultProps} open={false} onCancel={onCancel} />);

      await user.keyboard('{Escape}');
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------
  // Destructive Mode Tests
  // ------------------------------------------

  describe('Destructive Mode', () => {
    it('applies red styling to confirm button when destructive', () => {
      render(<ConfirmDialog {...defaultProps} destructive={true} />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toHaveClass('bg-red-600');
    });

    it('applies amber styling to confirm button when not destructive', () => {
      render(<ConfirmDialog {...defaultProps} destructive={false} />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toHaveClass('bg-amber-600');
    });
  });

  // ------------------------------------------
  // Restart Case Flow Tests
  // ------------------------------------------

  describe('Restart Case Flow', () => {
    it('renders restart confirmation dialog correctly', () => {
      render(
        <ConfirmDialog
          open={true}
          title="Restart Case"
          message="Reset all progress? Evidence, witnesses, and verdicts will be lost."
          confirmText="Restart"
          cancelText="Cancel"
          destructive={true}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('[Restart Case]')).toBeInTheDocument();
      expect(screen.getByText(/Reset all progress/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /restart/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('confirms restart when confirm clicked', async () => {
      const onConfirm = vi.fn();
      const user = userEvent.setup();

      render(
        <ConfirmDialog
          open={true}
          title="Restart Case"
          message="Reset all progress?"
          confirmText="Restart"
          destructive={true}
          onConfirm={onConfirm}
          onCancel={vi.fn()}
        />
      );

      await user.click(screen.getByRole('button', { name: /restart/i }));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('cancels restart when cancel clicked', async () => {
      const onCancel = vi.fn();
      const user = userEvent.setup();

      render(
        <ConfirmDialog
          open={true}
          title="Restart Case"
          message="Reset all progress?"
          confirmText="Restart"
          destructive={true}
          onConfirm={vi.fn()}
          onCancel={onCancel}
        />
      );

      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });
});
