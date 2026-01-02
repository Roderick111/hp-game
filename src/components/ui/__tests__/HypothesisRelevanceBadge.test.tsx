/**
 * Unit tests for HypothesisRelevanceBadge component
 *
 * Tests for evidence-hypothesis relevance badge display including:
 * - Rendering with different relevance types
 * - Color coding for supports vs contradicts
 * - Compact mode display
 * - Icon display
 * - Accessibility
 *
 * @module components/ui/__tests__/HypothesisRelevanceBadge.test
 * @since Milestone 6
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HypothesisRelevanceBadge } from '../HypothesisRelevanceBadge';

describe('HypothesisRelevanceBadge', () => {
  describe('Supports relevance', () => {
    it('should render hypothesis label with action text', () => {
      render(
        <HypothesisRelevanceBadge
          hypothesisLabel="H1"
          relevance="supports"
        />
      );

      // The component renders "Supports H1" text
      expect(screen.getByText(/Supports H1/)).toBeInTheDocument();
    });

    it('should apply green color classes for supports', () => {
      const { container } = render(
        <HypothesisRelevanceBadge
          hypothesisLabel="H1"
          relevance="supports"
        />
      );

      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-green-100', 'text-green-700', 'border-green-300');
    });

    it('should include an icon for supports', () => {
      const { container } = render(
        <HypothesisRelevanceBadge
          hypothesisLabel="H1"
          relevance="supports"
        />
      );

      // Check for SVG icon (aria-hidden for decorative)
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Contradicts relevance', () => {
    it('should render hypothesis label with action text', () => {
      render(
        <HypothesisRelevanceBadge
          hypothesisLabel="H2"
          relevance="contradicts"
        />
      );

      // The component renders "Contradicts H2" text
      expect(screen.getByText(/Contradicts H2/)).toBeInTheDocument();
    });

    it('should apply red color classes for contradicts', () => {
      const { container } = render(
        <HypothesisRelevanceBadge
          hypothesisLabel="H2"
          relevance="contradicts"
        />
      );

      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-red-100', 'text-red-700', 'border-red-300');
    });

    it('should include an icon for contradicts', () => {
      const { container } = render(
        <HypothesisRelevanceBadge
          hypothesisLabel="H2"
          relevance="contradicts"
        />
      );

      // Check for SVG icon
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Compact mode', () => {
    it('should render in compact mode with smaller padding', () => {
      const { container } = render(
        <HypothesisRelevanceBadge
          hypothesisLabel="H3"
          relevance="supports"
          compact
        />
      );

      // Compact mode should still render the badge with compact classes
      expect(screen.getByText(/Supports H3/)).toBeInTheDocument();
      const badge = container.firstChild;
      expect(badge).toHaveClass('px-1.5', 'py-0.5');
    });

    it('should render with default padding when not compact', () => {
      const { container } = render(
        <HypothesisRelevanceBadge
          hypothesisLabel="H3"
          relevance="supports"
        />
      );

      const badge = container.firstChild;
      expect(badge).toHaveClass('px-2', 'py-0.5');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on the badge for supports', () => {
      render(
        <HypothesisRelevanceBadge
          hypothesisLabel="H1"
          relevance="supports"
        />
      );

      // The badge itself has an aria-label
      const badge = screen.getByLabelText('Supports hypothesis H1');
      expect(badge).toBeInTheDocument();
    });

    it('should have aria-label on the badge for contradicts', () => {
      render(
        <HypothesisRelevanceBadge
          hypothesisLabel="H1"
          relevance="contradicts"
        />
      );

      const badge = screen.getByLabelText('Contradicts hypothesis H1');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle long hypothesis labels', () => {
      render(
        <HypothesisRelevanceBadge
          hypothesisLabel="Very Long Hypothesis Label"
          relevance="supports"
        />
      );

      expect(screen.getByText(/Supports Very Long Hypothesis Label/)).toBeInTheDocument();
    });

    it('should handle single character labels', () => {
      render(
        <HypothesisRelevanceBadge
          hypothesisLabel="A"
          relevance="contradicts"
        />
      );

      expect(screen.getByText(/Contradicts A/)).toBeInTheDocument();
    });
  });
});
