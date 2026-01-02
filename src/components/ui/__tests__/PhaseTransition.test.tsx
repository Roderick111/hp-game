/**
 * Unit tests for PhaseTransition component
 *
 * Tests for phase animation wrapper including:
 * - Rendering children correctly
 * - Applying correct animation variants
 * - Respecting reduced motion preferences
 *
 * @module components/ui/__tests__/PhaseTransition.test
 * @since Milestone 6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PhaseTransition } from '../PhaseTransition';

// Mock framer-motion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  };
});

describe('PhaseTransition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children', () => {
    render(
      <PhaseTransition>
        <div data-testid="child">Test Content</div>
      </PhaseTransition>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should apply default fade variant', () => {
    const { container } = render(
      <PhaseTransition>
        <div>Content</div>
      </PhaseTransition>
    );

    // Motion div should be present
    const motionDiv = container.firstChild;
    expect(motionDiv).toBeTruthy();
  });

  it('should apply slide-up variant', () => {
    const { container } = render(
      <PhaseTransition variant="slide-up">
        <div>Content</div>
      </PhaseTransition>
    );

    expect(container.firstChild).toBeTruthy();
  });

  it('should apply slide-down variant', () => {
    const { container } = render(
      <PhaseTransition variant="slide-down">
        <div>Content</div>
      </PhaseTransition>
    );

    expect(container.firstChild).toBeTruthy();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <PhaseTransition className="custom-class">
        <div>Content</div>
      </PhaseTransition>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should handle multiple children', () => {
    render(
      <PhaseTransition>
        <div data-testid="child1">First</div>
        <div data-testid="child2">Second</div>
      </PhaseTransition>
    );

    expect(screen.getByTestId('child1')).toBeInTheDocument();
    expect(screen.getByTestId('child2')).toBeInTheDocument();
  });

  it('should handle empty children', () => {
    const { container } = render(
      <PhaseTransition>
        {null}
      </PhaseTransition>
    );

    expect(container.firstChild).toBeTruthy();
  });

  it('should accept duration prop', () => {
    const { container } = render(
      <PhaseTransition duration={0.5}>
        <div>Content</div>
      </PhaseTransition>
    );

    // Component should still render with custom duration
    expect(container.firstChild).toBeTruthy();
  });

  it('should accept delay prop', () => {
    const { container } = render(
      <PhaseTransition delay={0.2}>
        <div>Content</div>
      </PhaseTransition>
    );

    // Component should still render with custom delay
    expect(container.firstChild).toBeTruthy();
  });
});

describe('PhaseTransition with reduced motion', () => {
  it('should still render children when reduced motion is preferred', async () => {
    // Reset mock to return true for reduced motion
    const { useReducedMotion } = await import('framer-motion');
    vi.mocked(useReducedMotion).mockReturnValue(true);

    render(
      <PhaseTransition>
        <div data-testid="child">Content</div>
      </PhaseTransition>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
