/**
 * Unit Tests for ContradictionPanel Component
 *
 * Tests:
 * - Conditional rendering (null when no contradictions discovered)
 * - Accessibility attributes (role, aria-label)
 * - Visual distinction between resolved and unresolved
 * - Evidence reference display
 * - Resolve button interaction
 *
 * @module components/ui/__tests__/ContradictionPanel.test
 * @since Milestone 3
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContradictionPanel } from '../ContradictionPanel';
import type { Contradiction } from '../../../types/enhanced';

// ============================================
// Test Fixtures
// ============================================

const testContradictions: Contradiction[] = [
  {
    id: 'c1',
    evidenceId1: 'e1',
    evidenceId2: 'e2',
    description: 'Witness A says north, Witness B says south.',
    isResolved: false,
  },
  {
    id: 'c2',
    evidenceId1: 'e3',
    evidenceId2: 'e4',
    description: 'Time of incident differs between reports.',
    resolution: 'Witness B had the correct time.',
    isResolved: true,
  },
  {
    id: 'c3',
    evidenceId1: 'e5',
    evidenceId2: 'e6',
    description: 'Physical evidence contradicts testimony.',
    isResolved: false,
  },
];

const evidenceMap = new Map([
  ['e1', { title: 'Witness A Statement', description: 'Statement from Witness A' }],
  ['e2', { title: 'Witness B Statement', description: 'Statement from Witness B' }],
  ['e3', { title: 'Time Record', description: 'Official time record' }],
  ['e4', { title: 'Watch Evidence', description: 'Broken watch evidence' }],
  ['e5', { title: 'Physical Evidence', description: 'Physical evidence from scene' }],
  ['e6', { title: 'Testimony', description: 'Testimony from suspect' }],
]);

// ============================================
// Conditional Rendering Tests
// ============================================

describe('ContradictionPanel - Conditional Rendering', () => {
  it('returns null when no contradictions discovered', () => {
    const { container } = render(
      <ContradictionPanel
        contradictions={testContradictions}
        discoveredIds={[]}
        resolvedIds={[]}
        evidenceMap={evidenceMap}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('returns null when contradictions array is empty', () => {
    const { container } = render(
      <ContradictionPanel
        contradictions={[]}
        discoveredIds={['c1']}
        resolvedIds={[]}
        evidenceMap={evidenceMap}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders panel when contradictions are discovered', () => {
    render(
      <ContradictionPanel
        contradictions={testContradictions}
        discoveredIds={['c1']}
        resolvedIds={[]}
        evidenceMap={evidenceMap}
      />
    );

    // ContradictionPanel uses role="status" for live region announcements
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

// ============================================
// Accessibility Tests
// ============================================

describe('ContradictionPanel - Accessibility', () => {
  it('has correct role and aria-label attributes', () => {
    render(
      <ContradictionPanel
        contradictions={testContradictions}
        discoveredIds={['c1']}
        resolvedIds={[]}
        evidenceMap={evidenceMap}
      />
    );

    // ContradictionPanel uses role="status" for live region updates
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Evidence Contradictions'
    );
  });

  it('has accessible list of contradictions', () => {
    render(
      <ContradictionPanel
        contradictions={testContradictions}
        discoveredIds={['c1', 'c2']}
        resolvedIds={['c2']}
        evidenceMap={evidenceMap}
      />
    );

    expect(screen.getByRole('list')).toHaveAttribute(
      'aria-label',
      'List of contradictions'
    );
  });

  it('includes status labels for resolved/unresolved', () => {
    render(
      <ContradictionPanel
        contradictions={testContradictions}
        discoveredIds={['c1', 'c2']}
        resolvedIds={['c2']}
        evidenceMap={evidenceMap}
      />
    );

    expect(screen.getByText('Unresolved')).toBeInTheDocument();
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });
});

// ============================================
// Visual Distinction Tests
// ============================================

describe('ContradictionPanel - Visual Distinction', () => {
  it('displays unresolved contradictions with amber styling', () => {
    render(
      <ContradictionPanel
        contradictions={testContradictions}
        discoveredIds={['c1']}
        resolvedIds={[]}
        evidenceMap={evidenceMap}
      />
    );

    const item = screen.getByText('Witness A says north, Witness B says south.').closest('li');
    expect(item).toHaveClass('bg-amber-100');
    expect(item).toHaveClass('border-amber-400');
  });

  it('displays resolved contradictions with green styling', () => {
    render(
      <ContradictionPanel
        contradictions={testContradictions}
        discoveredIds={['c2']}
        resolvedIds={['c2']}
        evidenceMap={evidenceMap}
      />
    );

    const item = screen.getByText('Time of incident differs between reports.').closest('li');
    expect(item).toHaveClass('bg-green-50');
    expect(item).toHaveClass('border-green-300');
  });

  it('shows warning icon for unresolved contradictions', () => {
    render(
      <ContradictionPanel
        contradictions={testContradictions}
        discoveredIds={['c1']}
        resolvedIds={[]}
        evidenceMap={evidenceMap}
      />
    );

    // Check for the exclamation mark icon
    const statusIcon = screen.getByLabelText('Unresolved');
    expect(statusIcon).toBeInTheDocument();
    expect(statusIcon.textContent).toContain('!');
  });

  it('shows checkmark icon for resolved contradictions', () => {
    render(
      <ContradictionPanel
        contradictions={testContradictions}
        discoveredIds={['c2']}
        resolvedIds={['c2']}
        evidenceMap={evidenceMap}
      />
    );

    // Check for the checkmark icon
    const statusIcon = screen.getByLabelText('Resolved');
    expect(statusIcon).toBeInTheDocument();
  });
});

// ============================================
// Evidence Reference Tests
// ============================================

describe('ContradictionPanel - Evidence References', () => {
  it('displays evidence titles from evidence map', () => {
    render(
      <ContradictionPanel
        contradictions={testContradictions}
        discoveredIds={['c1']}
        resolvedIds={[]}
        evidenceMap={evidenceMap}
      />
    );

    expect(screen.getByText('Witness A Statement')).toBeInTheDocument();
    expect(screen.getByText('Witness B Statement')).toBeInTheDocument();
  });

  it('falls back to evidence ID if not in map', () => {
    const emptyMap = new Map<string, { title: string; description: string }>();

    render(
      <ContradictionPanel
        contradictions={testContradictions}
        discoveredIds={['c1']}
        resolvedIds={[]}
        evidenceMap={emptyMap}
      />
    );

    expect(screen.getByText('e1')).toBeInTheDocument();
    expect(screen.getByText('e2')).toBeInTheDocument();
  });

  it('shows vs separator between evidence pieces', () => {
    render(
      <ContradictionPanel
        contradictions={testContradictions}
        discoveredIds={['c1']}
        resolvedIds={[]}
        evidenceMap={evidenceMap}
      />
    );

    expect(screen.getByText('vs')).toBeInTheDocument();
  });
});

// ============================================
// Resolution Display Tests
// ============================================

describe('ContradictionPanel - Resolution Display', () => {
  it('shows resolution text for resolved contradictions', () => {
    render(
      <ContradictionPanel
        contradictions={testContradictions}
        discoveredIds={['c2']}
        resolvedIds={['c2']}
        evidenceMap={evidenceMap}
      />
    );

    expect(screen.getByText(/Resolution:/)).toBeInTheDocument();
    expect(screen.getByText(/Witness B had the correct time/)).toBeInTheDocument();
  });

  it('does not show resolution text for unresolved contradictions', () => {
    render(
      <ContradictionPanel
        contradictions={testContradictions}
        discoveredIds={['c1']}
        resolvedIds={[]}
        evidenceMap={evidenceMap}
      />
    );

    expect(screen.queryByText(/Resolution:/)).not.toBeInTheDocument();
  });
});

// ============================================
// Resolve Button Tests
// ============================================

describe('ContradictionPanel - Resolve Button', () => {
  it('shows resolve button for unresolved contradictions when handler provided', () => {
    const handleResolve = vi.fn();

    render(
      <ContradictionPanel
        contradictions={testContradictions}
        discoveredIds={['c1']}
        resolvedIds={[]}
        evidenceMap={evidenceMap}
        onResolve={handleResolve}
      />
    );

    expect(screen.getByText('Mark as Understood')).toBeInTheDocument();
  });

  it('does not show resolve button when handler not provided', () => {
    render(
      <ContradictionPanel
        contradictions={testContradictions}
        discoveredIds={['c1']}
        resolvedIds={[]}
        evidenceMap={evidenceMap}
      />
    );

    expect(screen.queryByText('Mark as Understood')).not.toBeInTheDocument();
  });

  it('does not show resolve button for resolved contradictions', () => {
    const handleResolve = vi.fn();

    render(
      <ContradictionPanel
        contradictions={testContradictions}
        discoveredIds={['c2']}
        resolvedIds={['c2']}
        evidenceMap={evidenceMap}
        onResolve={handleResolve}
      />
    );

    expect(screen.queryByText('Mark as Understood')).not.toBeInTheDocument();
  });

  it('calls onResolve with correct ID when button clicked', () => {
    const handleResolve = vi.fn();

    render(
      <ContradictionPanel
        contradictions={testContradictions}
        discoveredIds={['c1']}
        resolvedIds={[]}
        evidenceMap={evidenceMap}
        onResolve={handleResolve}
      />
    );

    fireEvent.click(screen.getByText('Mark as Understood'));

    expect(handleResolve).toHaveBeenCalledTimes(1);
    expect(handleResolve).toHaveBeenCalledWith('c1');
  });
});

// ============================================
// Summary Display Tests
// ============================================

describe('ContradictionPanel - Summary Display', () => {
  it('shows correct summary count', () => {
    render(
      <ContradictionPanel
        contradictions={testContradictions}
        discoveredIds={['c1', 'c2', 'c3']}
        resolvedIds={['c2']}
        evidenceMap={evidenceMap}
      />
    );

    expect(screen.getByText('1 of 3 contradictions resolved')).toBeInTheDocument();
  });

  it('shows all resolved when all are resolved', () => {
    render(
      <ContradictionPanel
        contradictions={testContradictions}
        discoveredIds={['c1', 'c2']}
        resolvedIds={['c1', 'c2']}
        evidenceMap={evidenceMap}
      />
    );

    expect(screen.getByText('2 of 2 contradictions resolved')).toBeInTheDocument();
  });

  it('shows header with count', () => {
    render(
      <ContradictionPanel
        contradictions={testContradictions}
        discoveredIds={['c1', 'c2']}
        resolvedIds={[]}
        evidenceMap={evidenceMap}
      />
    );

    expect(screen.getByText(/Evidence Contradictions \(2\)/)).toBeInTheDocument();
  });
});

// ============================================
// Multiple Contradictions Tests
// ============================================

describe('ContradictionPanel - Multiple Contradictions', () => {
  it('renders all discovered contradictions', () => {
    render(
      <ContradictionPanel
        contradictions={testContradictions}
        discoveredIds={['c1', 'c2', 'c3']}
        resolvedIds={['c2']}
        evidenceMap={evidenceMap}
      />
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('only renders discovered contradictions', () => {
    render(
      <ContradictionPanel
        contradictions={testContradictions}
        discoveredIds={['c1', 'c3']}
        resolvedIds={[]}
        evidenceMap={evidenceMap}
      />
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByText('Time of incident differs between reports.')).not.toBeInTheDocument();
  });
});
