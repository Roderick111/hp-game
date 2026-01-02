/**
 * Unit tests for MetricCard component
 *
 * Tests for metric display with educational tooltips including:
 * - Basic rendering of metric data
 * - Performance level color coding
 * - Tooltip interaction (hover, click, keyboard)
 * - Accessibility features
 * - Progress bar display
 *
 * @module components/ui/__tests__/MetricCard.test
 * @since Milestone 6
 */

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MetricCard } from '../MetricCard';

describe('MetricCard', () => {
  const defaultProps = {
    name: 'Investigation Efficiency',
    value: '85%',
    explanation: 'How well did you use your investigation points?',
  };

  it('should render metric name', () => {
    render(<MetricCard {...defaultProps} />);

    expect(screen.getByText('Investigation Efficiency')).toBeInTheDocument();
  });

  it('should render metric value', () => {
    render(<MetricCard {...defaultProps} />);

    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('should render explanation', () => {
    render(<MetricCard {...defaultProps} />);

    expect(screen.getByText('How well did you use your investigation points?')).toBeInTheDocument();
  });

  it('should render performance badge with default level', () => {
    render(<MetricCard {...defaultProps} />);

    expect(screen.getByText('Fair')).toBeInTheDocument();
  });

  describe('Performance levels', () => {
    it('should show Excellent for excellent level', () => {
      render(<MetricCard {...defaultProps} performanceLevel="excellent" />);

      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });

    it('should show Good for good level', () => {
      render(<MetricCard {...defaultProps} performanceLevel="good" />);

      expect(screen.getByText('Good')).toBeInTheDocument();
    });

    it('should show Fair for fair level', () => {
      render(<MetricCard {...defaultProps} performanceLevel="fair" />);

      expect(screen.getByText('Fair')).toBeInTheDocument();
    });

    it('should show Needs Work for poor level', () => {
      render(<MetricCard {...defaultProps} performanceLevel="poor" />);

      expect(screen.getByText('Needs Work')).toBeInTheDocument();
    });

    it('should apply correct color classes for excellent', () => {
      const { container } = render(
        <MetricCard {...defaultProps} performanceLevel="excellent" />
      );

      expect(container.firstChild).toHaveClass('border-green-300', 'bg-green-50');
    });

    it('should apply correct color classes for poor', () => {
      const { container } = render(
        <MetricCard {...defaultProps} performanceLevel="poor" />
      );

      expect(container.firstChild).toHaveClass('border-red-300', 'bg-red-50');
    });
  });

  describe('Progress bar', () => {
    it('should not render progress bar when progressValue is undefined', () => {
      render(<MetricCard {...defaultProps} />);

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('should render progress bar when progressValue is provided', () => {
      render(<MetricCard {...defaultProps} progressValue={75} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    });

    it('should cap progress bar at 100%', () => {
      render(<MetricCard {...defaultProps} progressValue={150} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });

    it('should floor progress bar at 0%', () => {
      render(<MetricCard {...defaultProps} progressValue={-10} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ width: '0%' });
    });
  });

  describe('Educational tooltip', () => {
    const propsWithNote = {
      ...defaultProps,
      educationalNote: 'This is an educational explanation about the metric.',
    };

    it('should render info button when educationalNote is provided', () => {
      render(<MetricCard {...propsWithNote} />);

      expect(
        screen.getByRole('button', { name: /more information/i })
      ).toBeInTheDocument();
    });

    it('should not render info button when educationalNote is not provided', () => {
      render(<MetricCard {...defaultProps} />);

      expect(
        screen.queryByRole('button', { name: /more information/i })
      ).not.toBeInTheDocument();
    });

    it('should show tooltip on hover', async () => {
      const user = userEvent.setup();
      render(<MetricCard {...propsWithNote} />);

      const infoButton = screen.getByRole('button', { name: /more information/i });
      await user.hover(infoButton);

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
        expect(screen.getByText(propsWithNote.educationalNote)).toBeInTheDocument();
      });
    });

    it('should hide tooltip on mouse leave', async () => {
      const user = userEvent.setup();
      render(<MetricCard {...propsWithNote} />);

      const infoButton = screen.getByRole('button', { name: /more information/i });
      await user.hover(infoButton);

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });

      await user.unhover(infoButton);

      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    it('should show tooltip on focus and toggle on click', async () => {
      const user = userEvent.setup();
      render(<MetricCard {...propsWithNote} />);

      const infoButton = screen.getByRole('button', { name: /more information/i });

      // Focus shows the tooltip (onFocus handler)
      await user.tab();
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });

      // Click while focused toggles tooltip off
      await user.click(infoButton);
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    it('should toggle tooltip with keyboard Enter key', async () => {
      const user = userEvent.setup();
      render(<MetricCard {...propsWithNote} />);

      const infoButton = screen.getByRole('button', { name: /more information/i });

      // Focus shows tooltip
      infoButton.focus();
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });

      // Enter key toggles off
      await user.keyboard('{Enter}');
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });

      // Enter again toggles on
      await user.keyboard('{Enter}');
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('should close tooltip with Escape key', async () => {
      const user = userEvent.setup();
      render(<MetricCard {...propsWithNote} />);

      const infoButton = screen.getByRole('button', { name: /more information/i });

      // Focus shows tooltip
      infoButton.focus();
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });

      // Escape closes it
      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    it('should have proper ARIA attributes', () => {
      render(<MetricCard {...propsWithNote} />);

      const infoButton = screen.getByRole('button', { name: /more information/i });
      expect(infoButton).toHaveAttribute('aria-expanded', 'false');
      expect(infoButton).toHaveAttribute(
        'aria-describedby',
        'tooltip-investigation-efficiency'
      );
    });
  });

  describe('Accessibility', () => {
    it('should have accessible name for info button', () => {
      render(
        <MetricCard
          {...defaultProps}
          educationalNote="Test note"
        />
      );

      const infoButton = screen.getByRole('button');
      expect(infoButton).toHaveAccessibleName('More information about Investigation Efficiency');
    });

    it('should have proper progressbar accessibility', () => {
      render(
        <MetricCard {...defaultProps} progressValue={75} />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAccessibleName('Investigation Efficiency: 75%');
    });
  });
});
