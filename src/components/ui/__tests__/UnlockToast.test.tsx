/**
 * Unit Tests for UnlockToast Component
 *
 * Tests accessibility, auto-dismiss behavior, and user interactions.
 *
 * @module components/ui/__tests__/UnlockToast.test
 * @since Milestone 2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnlockToast } from '../UnlockToast';

describe('UnlockToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders hypothesis label correctly', () => {
      const onDismiss = vi.fn();
      render(
        <UnlockToast
          hypothesisLabel="Complex conspiracy theory"
          onDismiss={onDismiss}
        />
      );

      expect(screen.getByText('Complex conspiracy theory')).toBeInTheDocument();
    });

    it('renders unlock notification title', () => {
      const onDismiss = vi.fn();
      render(
        <UnlockToast
          hypothesisLabel="Test hypothesis"
          onDismiss={onDismiss}
        />
      );

      expect(screen.getByText('New hypothesis unlocked!')).toBeInTheDocument();
    });

    it('renders dismiss button with accessible label', () => {
      const onDismiss = vi.fn();
      render(
        <UnlockToast
          hypothesisLabel="Test hypothesis"
          onDismiss={onDismiss}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss notification/i });
      expect(dismissButton).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has role="alert" attribute', () => {
      const onDismiss = vi.fn();
      render(
        <UnlockToast
          hypothesisLabel="Test hypothesis"
          onDismiss={onDismiss}
        />
      );

      const toast = screen.getByRole('alert');
      expect(toast).toBeInTheDocument();
    });

    it('has aria-live="polite" attribute', () => {
      const onDismiss = vi.fn();
      render(
        <UnlockToast
          hypothesisLabel="Test hypothesis"
          onDismiss={onDismiss}
        />
      );

      const toast = screen.getByRole('alert');
      expect(toast).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-atomic="true" attribute', () => {
      const onDismiss = vi.fn();
      render(
        <UnlockToast
          hypothesisLabel="Test hypothesis"
          onDismiss={onDismiss}
        />
      );

      const toast = screen.getByRole('alert');
      expect(toast).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('dismiss button', () => {
    it('calls onDismiss when dismiss button is clicked', async () => {
      // Use real timers for user interactions
      vi.useRealTimers();
      const user = userEvent.setup();
      const onDismiss = vi.fn();

      render(
        <UnlockToast
          hypothesisLabel="Test hypothesis"
          onDismiss={onDismiss}
          autoDismissMs={60000} // Long timeout to prevent auto-dismiss during test
        />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss notification/i });
      await user.click(dismissButton);

      // Wait for exit animation (200ms)
      await new Promise((r) => setTimeout(r, 250));

      expect(onDismiss).toHaveBeenCalledTimes(1);

      // Restore fake timers for subsequent tests
      vi.useFakeTimers();
    });

    it('handles keyboard dismiss with Enter key', async () => {
      // Use real timers for user interactions
      vi.useRealTimers();
      const user = userEvent.setup();
      const onDismiss = vi.fn();

      render(
        <UnlockToast
          hypothesisLabel="Test hypothesis"
          onDismiss={onDismiss}
          autoDismissMs={60000}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss notification/i });
      dismissButton.focus();
      await user.keyboard('{Enter}');

      // Wait for exit animation
      await new Promise((r) => setTimeout(r, 250));

      expect(onDismiss).toHaveBeenCalledTimes(1);

      // Restore fake timers for subsequent tests
      vi.useFakeTimers();
    });

    it('handles keyboard dismiss with Space key', async () => {
      // Use real timers for user interactions
      vi.useRealTimers();
      const user = userEvent.setup();
      const onDismiss = vi.fn();

      render(
        <UnlockToast
          hypothesisLabel="Test hypothesis"
          onDismiss={onDismiss}
          autoDismissMs={60000}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss notification/i });
      dismissButton.focus();
      await user.keyboard(' ');

      // Wait for exit animation
      await new Promise((r) => setTimeout(r, 250));

      expect(onDismiss).toHaveBeenCalledTimes(1);

      // Restore fake timers for subsequent tests
      vi.useFakeTimers();
    });
  });

  describe('auto-dismiss', () => {
    it('auto-dismisses after default timeout (5000ms)', () => {
      const onDismiss = vi.fn();

      render(
        <UnlockToast
          hypothesisLabel="Test hypothesis"
          onDismiss={onDismiss}
        />
      );

      // Before timeout
      expect(onDismiss).not.toHaveBeenCalled();

      // Advance past auto-dismiss timeout
      vi.advanceTimersByTime(5000);

      // Wait for exit animation
      vi.advanceTimersByTime(200);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('uses custom auto-dismiss timeout', () => {
      const onDismiss = vi.fn();

      render(
        <UnlockToast
          hypothesisLabel="Test hypothesis"
          onDismiss={onDismiss}
          autoDismissMs={3000}
        />
      );

      // Before custom timeout
      vi.advanceTimersByTime(2999);
      expect(onDismiss).not.toHaveBeenCalled();

      // After custom timeout
      vi.advanceTimersByTime(1);

      // Wait for exit animation
      vi.advanceTimersByTime(200);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not auto-dismiss before timeout', () => {
      const onDismiss = vi.fn();

      render(
        <UnlockToast
          hypothesisLabel="Test hypothesis"
          onDismiss={onDismiss}
          autoDismissMs={8000}
        />
      );

      // Well before timeout
      vi.advanceTimersByTime(7000);
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('clears timeout on unmount to prevent memory leaks', () => {
      const onDismiss = vi.fn();

      const { unmount } = render(
        <UnlockToast
          hypothesisLabel="Test hypothesis"
          onDismiss={onDismiss}
        />
      );

      // Unmount before timeout
      unmount();

      // Advance past timeout
      vi.advanceTimersByTime(6000);

      // onDismiss should not have been called since component was unmounted
      expect(onDismiss).not.toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('applies amber gradient background classes', () => {
      const onDismiss = vi.fn();
      render(
        <UnlockToast
          hypothesisLabel="Test hypothesis"
          onDismiss={onDismiss}
        />
      );

      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('bg-gradient-to-r');
      expect(toast).toHaveClass('from-amber-500');
      expect(toast).toHaveClass('to-amber-600');
    });

    it('renders with framer-motion animation wrapper', () => {
      const onDismiss = vi.fn();
      render(
        <UnlockToast
          hypothesisLabel="Test hypothesis"
          onDismiss={onDismiss}
        />
      );

      // With framer-motion, animations are applied via inline styles
      // The component should render and be visible
      const toast = screen.getByRole('alert');
      expect(toast).toBeInTheDocument();
      // Framer motion applies styles - check for the component structure
      expect(toast).toHaveClass('max-w-sm');
      expect(toast).toHaveClass('rounded-lg');
    });
  });
});
