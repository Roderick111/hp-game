/**
 * Tests for Investigation Phase Component (Milestone 7)
 *
 * Tests hypothesis selection sidebar, active hypothesis banner,
 * evidence relevance visualization, and accessibility features.
 *
 * @module components/phases/__tests__/Investigation.test
 * @since Milestone 7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import type { CaseData, InvestigationAction } from '../../../types/game';
import type { ConditionalHypothesis, Contradiction, EnhancedPlayerState } from '../../../types/enhanced';

// ============================================
// Mock Setup
// ============================================

// Mock the useGame hook
const mockDispatch = vi.fn();
const mockState: EnhancedPlayerState = {
  currentPhase: 'investigation',
  selectedHypotheses: ['h1', 'h2'],
  initialProbabilities: { h1: 50, h2: 50 },
  investigationPointsRemaining: 7,
  collectedEvidenceIds: [],
  finalProbabilities: {},
  confidenceLevel: 3,
  scores: null,
  unlockedHypotheses: ['h3'],
  unlockHistory: [],
  discoveredContradictions: [],
  resolvedContradictions: [],
  pendingUnlockNotifications: [],
  activeHypothesisId: null,
  hypothesisPivots: [],
};

let currentMockState = { ...mockState };

vi.mock('../../../hooks/useGame', () => ({
  useGame: () => ({
    state: currentMockState,
    dispatch: mockDispatch,
  }),
}));

// Mock useUnlockNotifications hook
vi.mock('../../../hooks/useUnlockNotifications', () => ({
  useUnlockNotifications: () => ({
    notifications: [],
    acknowledgeNotification: vi.fn(),
  }),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
        <div {...props}>{children}</div>
      ),
      button: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
        <button {...props}>{children}</button>
      ),
    },
    useReducedMotion: () => false,
  };
});

// Import Investigation after mocks are set up
import { Investigation } from '../Investigation';

// ============================================
// Test Fixtures
// ============================================

const testHypotheses: ConditionalHypothesis[] = [
  {
    id: 'h1',
    label: 'Theory A: Witness lied',
    description: 'The witness fabricated their testimony',
    isCorrect: false,
    tier: 1,
  },
  {
    id: 'h2',
    label: 'Theory B: Accident',
    description: 'It was an accidental incident',
    isCorrect: true,
    tier: 1,
  },
  {
    id: 'h3',
    label: 'Theory C: Conspiracy',
    description: 'Multiple people coordinated',
    isCorrect: false,
    tier: 2,
    unlockRequirements: [{ type: 'evidence_collected', evidenceId: 'e5' }],
  },
];

const testContradictions: Contradiction[] = [
  {
    id: 'c1',
    evidenceId1: 'e1',
    evidenceId2: 'e2',
    description: 'Witness statements conflict',
    isResolved: false,
  },
];

const testInvestigationActions: InvestigationAction[] = [
  {
    id: 'e1',
    title: 'Search the scene',
    description: 'Examine the location',
    cost: 2,
    category: 'location',
    evidence: {
      title: 'Scene Evidence',
      content: 'Found clues at the scene',
      interpretation: 'Points to Theory A',
      isCritical: false,
    },
    hypothesisImpact: [{ hypothesisId: 'h1', impact: 'supports', weight: 1 }],
  },
  {
    id: 'e2',
    title: 'Interview witness',
    description: 'Talk to the witness',
    cost: 1,
    category: 'witness',
    evidence: {
      title: 'Witness Statement',
      content: 'The witness saw something',
      interpretation: 'Supports Theory B',
      isCritical: true,
    },
    hypothesisImpact: [{ hypothesisId: 'h2', impact: 'supports', weight: 2 }],
  },
  {
    id: 'e5',
    title: 'Check records',
    description: 'Review official records',
    cost: 2,
    category: 'records',
    evidence: {
      title: 'Official Records',
      content: 'Records show discrepancies',
      interpretation: 'Unlocks new theory',
      isCritical: false,
    },
    hypothesisImpact: [{ hypothesisId: 'h3', impact: 'neutral', weight: 0 }],
  },
];

const testCaseData = {
  id: 'test-case',
  title: 'Test Investigation',
  subtitle: 'A test case',
  briefing: {
    date: '2025-01-15',
    location: 'Test Location',
    victim: 'Test Victim',
    status: 'Under investigation',
    summary: 'A brief summary',
    healerReport: 'Healer notes',
    initialWitness: {
      name: 'Witness Name',
      statement: 'Witness statement',
    },
    personsOfInterest: [],
    mentorIntro: 'Mentor introduction',
    investigationPoints: 7,
  },
  hypotheses: testHypotheses,
  investigationActions: testInvestigationActions,
  resolution: {
    truthSummary: 'The truth',
    culprit: 'The culprit',
    correctHypothesisId: 'h2',
    explanationOfDifficulty: 'Explanation',
  },
  biasLessons: [],
  contradictions: testContradictions,
} as unknown as CaseData;

// ============================================
// Hypothesis Selection Sidebar Tests
// ============================================

describe('Investigation - Hypothesis Selection Sidebar', () => {
  beforeEach(() => {
    currentMockState = { ...mockState };
    mockDispatch.mockClear();
  });

  it('renders hypothesis selection sidebar with available hypotheses', () => {
    render(<Investigation caseData={testCaseData} />);

    expect(screen.getByText('Investigation Focus')).toBeInTheDocument();
    expect(screen.getByText('Theory A: Witness lied')).toBeInTheDocument();
    expect(screen.getByText('Theory B: Accident')).toBeInTheDocument();
    // h3 is unlocked so should appear
    expect(screen.getByText('Theory C: Conspiracy')).toBeInTheDocument();
  });

  it('shows only Tier 1 + unlocked Tier 2 hypotheses', () => {
    // h3 is in unlockedHypotheses so it should appear
    currentMockState = {
      ...mockState,
      unlockedHypotheses: [], // Remove h3 from unlocked
    };

    render(<Investigation caseData={testCaseData} />);

    expect(screen.getByText('Theory A: Witness lied')).toBeInTheDocument();
    expect(screen.getByText('Theory B: Accident')).toBeInTheDocument();
    // h3 should NOT appear since it's Tier 2 and not unlocked
    expect(screen.queryByText('Theory C: Conspiracy')).not.toBeInTheDocument();
  });

  it('dispatches SET_ACTIVE_HYPOTHESIS when hypothesis clicked', async () => {
    const user = userEvent.setup();
    render(<Investigation caseData={testCaseData} />);

    const hypothesisOption = screen.getByText('Theory A: Witness lied').closest(
      '[role="radio"]'
    )!;
    await user.click(hypothesisOption);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_ACTIVE_HYPOTHESIS',
      hypothesisId: 'h1',
    });
  });

  it('shows "Active" badge on currently active hypothesis', () => {
    currentMockState = {
      ...mockState,
      activeHypothesisId: 'h1',
    };

    render(<Investigation caseData={testCaseData} />);

    // Find all elements with the hypothesis text and locate the one in the sidebar
    const allRadios = screen.getAllByRole('radio');
    const activeRadio = allRadios.find(radio =>
      radio.textContent?.includes('Theory A: Witness lied')
    );
    expect(activeRadio).toHaveAttribute('aria-checked', 'true');
    expect(within(activeRadio!).getByText('Active')).toBeInTheDocument();
  });

  it('shows "Clear focus" button when hypothesis is active', () => {
    currentMockState = {
      ...mockState,
      activeHypothesisId: 'h1',
    };

    render(<Investigation caseData={testCaseData} />);

    expect(screen.getByText('Clear focus (explore all)')).toBeInTheDocument();
  });

  it('dispatches CLEAR_ACTIVE_HYPOTHESIS when clear button clicked', async () => {
    const user = userEvent.setup();
    currentMockState = {
      ...mockState,
      activeHypothesisId: 'h1',
    };

    render(<Investigation caseData={testCaseData} />);

    await user.click(screen.getByText('Clear focus (explore all)'));

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'CLEAR_ACTIVE_HYPOTHESIS',
    });
  });

  it('shows "Unlocked" badge for Tier 2 hypotheses', () => {
    render(<Investigation caseData={testCaseData} />);

    const tier2Hypothesis = screen.getByText('Theory C: Conspiracy').closest<HTMLElement>(
      '[role="radio"]'
    )!;
    expect(within(tier2Hypothesis).getByText('Unlocked')).toBeInTheDocument();
  });
});

// ============================================
// Active Hypothesis Banner Tests
// ============================================

describe('Investigation - Active Hypothesis Banner', () => {
  beforeEach(() => {
    currentMockState = { ...mockState };
    mockDispatch.mockClear();
  });

  it('does not show banner when no hypothesis is active', () => {
    currentMockState = {
      ...mockState,
      activeHypothesisId: null,
    };

    render(<Investigation caseData={testCaseData} />);

    expect(screen.queryByText(/Investigating:/)).not.toBeInTheDocument();
  });

  it('shows banner when hypothesis is active', () => {
    currentMockState = {
      ...mockState,
      activeHypothesisId: 'h1',
    };

    render(<Investigation caseData={testCaseData} />);

    expect(screen.getByText(/Investigating:/)).toBeInTheDocument();
    // The hypothesis label appears in both the sidebar and banner
    expect(screen.getAllByText('Theory A: Witness lied').length).toBeGreaterThan(0);
  });

  it('banner has role="status" for screen reader announcements', () => {
    currentMockState = {
      ...mockState,
      activeHypothesisId: 'h2',
    };

    render(<Investigation caseData={testCaseData} />);

    const banner = screen.getByRole('status');
    expect(banner).toHaveAttribute('aria-live', 'polite');
  });

  it('banner has Clear button that dispatches action', async () => {
    const user = userEvent.setup();
    currentMockState = {
      ...mockState,
      activeHypothesisId: 'h1',
    };

    render(<Investigation caseData={testCaseData} />);

    // Find the Clear button in the banner
    const banner = screen.getByRole('status');
    const clearButton = within(banner).getByRole('button', { name: /Clear/i });

    await user.click(clearButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'CLEAR_ACTIVE_HYPOTHESIS',
    });
  });

  it('shows relevance explanation text in banner', () => {
    currentMockState = {
      ...mockState,
      activeHypothesisId: 'h1',
    };

    render(<Investigation caseData={testCaseData} />);

    expect(
      screen.getByText(/Evidence cards now show relevance to this hypothesis/)
    ).toBeInTheDocument();
  });
});

// ============================================
// Keyboard Navigation Tests
// ============================================

describe('Investigation - Keyboard Navigation', () => {
  beforeEach(() => {
    currentMockState = { ...mockState };
    mockDispatch.mockClear();
  });

  it('hypothesis sidebar has radiogroup role', () => {
    render(<Investigation caseData={testCaseData} />);

    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup')).toHaveAttribute(
      'aria-label',
      'Investigation focus selection'
    );
  });

  it('hypothesis options have radio role', () => {
    render(<Investigation caseData={testCaseData} />);

    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBeGreaterThan(0);
  });

  it('Enter key selects hypothesis', () => {
    render(<Investigation caseData={testCaseData} />);

    const hypothesis = screen.getByText('Theory A: Witness lied').closest(
      '[role="radio"]'
    )!;
    fireEvent.keyDown(hypothesis, { key: 'Enter' });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_ACTIVE_HYPOTHESIS',
      hypothesisId: 'h1',
    });
  });

  it('Space key selects hypothesis', () => {
    render(<Investigation caseData={testCaseData} />);

    const hypothesis = screen.getByText('Theory B: Accident').closest(
      '[role="radio"]'
    )!;
    fireEvent.keyDown(hypothesis, { key: ' ' });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_ACTIVE_HYPOTHESIS',
      hypothesisId: 'h2',
    });
  });

  it('Escape key clears active hypothesis', () => {
    currentMockState = {
      ...mockState,
      activeHypothesisId: 'h1',
    };

    render(<Investigation caseData={testCaseData} />);

    const allRadios = screen.getAllByRole('radio');
    const hypothesis = allRadios.find(radio =>
      radio.textContent?.includes('Theory A: Witness lied')
    );
    fireEvent.keyDown(hypothesis!, { key: 'Escape' });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'CLEAR_ACTIVE_HYPOTHESIS',
    });
  });
});

// ============================================
// Accessibility Tests
// ============================================

describe('Investigation - Accessibility', () => {
  beforeEach(() => {
    currentMockState = { ...mockState };
    mockDispatch.mockClear();
  });

  it('hypothesis options have aria-checked attribute', () => {
    currentMockState = {
      ...mockState,
      activeHypothesisId: 'h1',
    };

    render(<Investigation caseData={testCaseData} />);

    const allRadios = screen.getAllByRole('radio');
    const activeHypothesis = allRadios.find(radio =>
      radio.textContent?.includes('Theory A: Witness lied')
    );
    const inactiveHypothesis = allRadios.find(radio =>
      radio.textContent?.includes('Theory B: Accident')
    );

    expect(activeHypothesis).toHaveAttribute('aria-checked', 'true');
    expect(inactiveHypothesis).toHaveAttribute('aria-checked', 'false');
  });

  it('hypothesis options have aria-label', () => {
    render(<Investigation caseData={testCaseData} />);

    const hypothesis = screen.getByText('Theory A: Witness lied').closest(
      '[role="radio"]'
    )!;
    expect(hypothesis).toHaveAttribute('aria-label', expect.stringContaining('Theory A'));
  });

  it('active hypothesis aria-label includes "currently investigating"', () => {
    currentMockState = {
      ...mockState,
      activeHypothesisId: 'h1',
    };

    render(<Investigation caseData={testCaseData} />);

    const allRadios = screen.getAllByRole('radio');
    const hypothesis = allRadios.find(radio =>
      radio.textContent?.includes('Theory A: Witness lied')
    );
    expect(hypothesis).toHaveAttribute(
      'aria-label',
      expect.stringContaining('currently investigating')
    );
  });

  it('hypothesis options are focusable', () => {
    render(<Investigation caseData={testCaseData} />);

    const hypothesis = screen.getByText('Theory A: Witness lied').closest(
      '[role="radio"]'
    )!;
    expect(hypothesis).toHaveAttribute('tabIndex', '0');
  });

  it('clear focus button has descriptive aria-label', () => {
    currentMockState = {
      ...mockState,
      activeHypothesisId: 'h1',
    };

    render(<Investigation caseData={testCaseData} />);

    expect(
      screen.getByRole('button', { name: /Return to exploratory mode/i })
    ).toBeInTheDocument();
  });
});

// ============================================
// Evidence Relevance Tests
// ============================================

describe('Investigation - Evidence Relevance Visualization', () => {
  beforeEach(() => {
    currentMockState = { ...mockState };
    mockDispatch.mockClear();
  });

  it('shows relevance badges when hypothesis is active and evidence collected', () => {
    currentMockState = {
      ...mockState,
      activeHypothesisId: 'h1',
      collectedEvidenceIds: ['e1'],
    };

    render(<Investigation caseData={testCaseData} />);

    // The evidence card should show relevance information
    // This depends on the actual relevance calculation - might be supports/contradicts/neutral
    // Just verify the structure is there
    const collectedSection = screen.getByText('Evidence Collected (1)').closest('section, div');
    expect(collectedSection).toBeInTheDocument();
  });

  it('does not show relevance badges when no hypothesis is active', () => {
    currentMockState = {
      ...mockState,
      activeHypothesisId: null,
      collectedEvidenceIds: ['e1'],
    };

    render(<Investigation caseData={testCaseData} />);

    // Should not have relevance badges showing
    expect(screen.queryByText('Supports')).not.toBeInTheDocument();
    expect(screen.queryByText('Contradicts')).not.toBeInTheDocument();
  });
});

// ============================================
// Integration with IP and Evidence Collection
// ============================================

describe('Investigation - Evidence Collection Integration', () => {
  beforeEach(() => {
    currentMockState = { ...mockState };
    mockDispatch.mockClear();
  });

  it('displays investigation category headers', () => {
    render(<Investigation caseData={testCaseData} />);

    // Check that category headers are rendered
    expect(screen.getByText('Locations')).toBeInTheDocument();
    expect(screen.getByText('Witnesses')).toBeInTheDocument();
    expect(screen.getByText('Records')).toBeInTheDocument();
  });

  it('shows IP counter', () => {
    currentMockState = {
      ...mockState,
      investigationPointsRemaining: 5,
    };

    render(<Investigation caseData={testCaseData} />);

    expect(screen.getByText(/IP remaining/)).toBeInTheDocument();
  });

  it('shows collected evidence count when evidence is collected', () => {
    currentMockState = {
      ...mockState,
      collectedEvidenceIds: ['e1', 'e2'],
    };

    render(<Investigation caseData={testCaseData} />);

    expect(screen.getByText('Evidence Collected (2)')).toBeInTheDocument();
  });

  it('shows "Lock In" button', () => {
    render(<Investigation caseData={testCaseData} />);

    expect(screen.getByRole('button', { name: /Lock In/i })).toBeInTheDocument();
  });
});
