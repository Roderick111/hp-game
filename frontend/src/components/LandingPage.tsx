/**
 * LandingPage Component
 *
 * Two-pane terminal layout: case list (left) + selected case details (right).
 * Minimal B&W aesthetic, scalable to multiple cases.
 *
 * Phase 5.4: Dynamic case loading from backend API.
 *
 * Keyboard shortcuts:
 * - 1-9: Select case by number
 * - Enter: Start selected case
 * - L: Load Game
 *
 * @module components/LandingPage
 * @since Phase 5.3.1
 */

import { useCallback, useEffect, useState } from 'react';
import { getCases } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import type { CaseMetadata, ApiCaseMetadata } from '../types/investigation';

// ============================================
// Types
// ============================================

export interface LandingPageProps {
  /** Callback when player starts a new case */
  onStartNewCase: (caseId: string) => void;
  /** Callback when player clicks Load Game */
  onLoadGame: () => void;
}

// ============================================
// Helpers
// ============================================

/**
 * Map backend difficulty to frontend display format
 */
function mapDifficulty(
  backendDifficulty: 'beginner' | 'intermediate' | 'advanced'
): 'Easy' | 'Medium' | 'Hard' {
  const mapping: Record<string, 'Easy' | 'Medium' | 'Hard'> = {
    beginner: 'Easy',
    intermediate: 'Medium',
    advanced: 'Hard',
  };
  return mapping[backendDifficulty] ?? 'Medium';
}

/**
 * Transform backend case metadata to frontend format
 */
function transformCase(apiCase: ApiCaseMetadata): CaseMetadata {
  return {
    id: apiCase.id,
    name: apiCase.title,
    difficulty: mapDifficulty(apiCase.difficulty),
    // For now, all cases from backend are unlocked (Phase 5.4)
    // Future: lock progression system
    status: 'unlocked',
    description: apiCase.description || 'No description available.',
  };
}

// ============================================
// Component
// ============================================

export function LandingPage({ onStartNewCase, onLoadGame }: LandingPageProps) {
  const { theme } = useTheme();

  // Dynamic case state (Phase 5.4)
  const [cases, setCases] = useState<CaseMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected case (default to first)
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedCase = cases[selectedIndex];

  // Fetch cases from backend on mount
  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCases();

      // Transform backend format to frontend format
      const transformedCases = response.cases.map(transformCase);
      setCases(transformedCases);

      // Log warnings if some cases failed to load
      if (response.errors && response.errors.length > 0) {
        console.warn('Some cases failed to load:', response.errors);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load cases';
      setError(message);
      console.error('Case loading error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCases();
  }, [fetchCases]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Arrow Up / W: Previous case
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : cases.length - 1));
      }
      // Arrow Down / S: Next case
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < cases.length - 1 ? prev + 1 : 0));
      }
      // Number keys 1-9: Select case
      else if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (index < cases.length) {
          setSelectedIndex(index);
        }
      }
      // Enter: Start selected case
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedCase?.status === 'unlocked') {
          onStartNewCase(selectedCase.id);
        }
      }
      // L: Load game
      else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        onLoadGame();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onStartNewCase, onLoadGame, cases, selectedCase, selectedIndex]);

  // ============================================
  // Loading State
  // ============================================
  if (loading) {
    return (
      <div className={`min-h-screen ${theme.colors.bg.primary} ${theme.colors.text.secondary} flex flex-col items-center justify-center p-8`}>
        <div className="text-center">
          <h1 className={`text-4xl font-bold ${theme.colors.text.primary} font-mono tracking-widest mb-1`}>
            AUROR ACADEMY
          </h1>
          <p className={`${theme.colors.text.muted} text-xs font-mono mb-8`}>
            Case Investigation System v1.0
          </p>
          <p className={`${theme.colors.text.tertiary} text-sm font-mono animate-pulse`}>
            {theme.symbols.block} Loading cases...
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // Error State
  // ============================================
  if (error) {
    return (
      <div className={`min-h-screen ${theme.colors.bg.primary} ${theme.colors.text.secondary} flex flex-col items-center justify-center p-8`}>
        <div className="text-center max-w-md">
          <h1 className={`text-4xl font-bold ${theme.colors.text.primary} font-mono tracking-widest mb-1`}>
            AUROR ACADEMY
          </h1>
          <p className={`${theme.colors.text.muted} text-xs font-mono mb-8`}>
            Case Investigation System v1.0
          </p>
          <p className={`${theme.colors.state.error.text} text-sm font-mono mb-4`}>
            {theme.symbols.warning} {error}
          </p>
          <button
            onClick={() => void fetchCases()}
            className={`px-4 py-2 ${theme.colors.bg.hover} ${theme.colors.text.primary} font-mono text-sm border ${theme.colors.border.default} ${theme.colors.interactive.borderHover} ${theme.colors.interactive.hover} transition-colors uppercase tracking-wider`}
          >
            {theme.symbols.doubleArrowRight} RETRY
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // Empty State
  // ============================================
  if (cases.length === 0) {
    return (
      <div className={`min-h-screen ${theme.colors.bg.primary} ${theme.colors.text.secondary} flex flex-col items-center justify-center p-8`}>
        <div className="text-center">
          <h1 className={`text-4xl font-bold ${theme.colors.text.primary} font-mono tracking-widest mb-1`}>
            AUROR ACADEMY
          </h1>
          <p className={`${theme.colors.text.muted} text-xs font-mono mb-8`}>
            Case Investigation System v1.0
          </p>
          <p className={`${theme.colors.text.tertiary} text-sm font-mono mb-4`}>
            {theme.symbols.bullet} No cases available.
          </p>
          <p className={`${theme.colors.text.separator} text-xs font-mono`}>
            Add case files to backend/src/case_store/ to get started.
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // Main Render
  // ============================================
  return (
    <div className={`min-h-screen ${theme.colors.bg.primary} ${theme.colors.text.secondary} flex flex-col items-center justify-center p-8`}>
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className={`text-4xl font-bold ${theme.colors.text.primary} font-mono tracking-widest mb-1`}>
          AUROR ACADEMY
        </h1>
        <p className={`${theme.colors.text.muted} text-xs font-mono`}>
          Case Investigation System v1.0
        </p>
      </div>

      {/* Two-Pane Layout */}
      <div className={`max-w-5xl w-full border ${theme.colors.border.default} ${theme.colors.bg.primary}`}>
        {/* Header */}
        <div className={`grid grid-cols-2 border-b ${theme.colors.border.default}`}>
          <div className={`px-4 py-2 border-r ${theme.colors.border.default}`}>
            <h2 className={`text-sm font-bold ${theme.colors.text.primary} font-mono uppercase tracking-wider`}>
              {theme.symbols.block} Available Cases
            </h2>
          </div>
          <div className="px-4 py-2">
            <h2 className={`text-sm font-bold ${theme.colors.text.primary} font-mono uppercase tracking-wider`}>
              {theme.symbols.block} Case Details
            </h2>
          </div>
        </div>

        {/* Content Panes */}
        <div className="grid grid-cols-2 min-h-[400px]">
          {/* Left Pane: Case List */}
          <div className={`border-r ${theme.colors.border.default}`}>
            {cases.map((caseItem, index) => {
              const isSelected = index === selectedIndex;
              const isLocked = caseItem.status === 'locked';
              const caseNumber = String(index + 1).padStart(3, '0');

              return (
                <button
                  key={caseItem.id}
                  onClick={() => setSelectedIndex(index)}
                  className={`w-full text-left px-4 font-mono text-sm transition-colors border-b ${theme.colors.border.default} min-h-[72px] flex items-center ${
                    isSelected
                      ? `${theme.colors.bg.hover} border-l-2 ${theme.colors.interactive.border}`
                      : `${theme.colors.bg.hoverClass}`
                  }`}
                >
                  <div className="flex items-start leading-tight">
                    <span className={isSelected ? `${theme.colors.interactive.text} w-4 flex-shrink-0` : `${theme.colors.text.separator} w-4 flex-shrink-0`}>
                      {isSelected ? theme.symbols.current : theme.symbols.other}
                    </span>
                    <div className="flex-1">
                      <div className={`leading-tight ${isSelected ? `${theme.colors.text.primary} font-bold` : isLocked ? theme.colors.text.separator : theme.colors.text.tertiary}`}>
                        {caseNumber}. {caseItem.name}
                      </div>
                      <div className={`text-xs mt-1 leading-tight ${isSelected ? theme.colors.text.tertiary : theme.colors.text.separator}`}>
                        {isLocked ? '[LOCKED]' : caseItem.difficulty}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Pane: Case Details */}
          <div className="p-6 flex flex-col">
            {selectedCase ? (
              <>
                <div className="flex items-baseline justify-between gap-4 mb-4">
                  <h3 className={`text-sm font-bold ${theme.colors.text.primary} font-mono uppercase tracking-wider`}>
                    {theme.symbols.prefix} {selectedCase.name}
                  </h3>
                  <span className={`text-sm font-mono ${theme.colors.text.muted} whitespace-nowrap`}>
                    {selectedCase.status === 'unlocked' ? 'Available' : 'Locked'}
                  </span>
                </div>
                <p className={`${theme.colors.text.tertiary} text-sm font-mono leading-relaxed mb-6 flex-1`}>
                  {selectedCase.description}
                </p>
                <div className={`text-sm font-mono ${theme.colors.text.muted} mb-6`}>
                  {theme.symbols.bullet} Difficulty: {selectedCase.difficulty}
                </div>
                <div className={`border-t ${theme.colors.border.default} pt-6 mt-6`}>
                  <button
                    onClick={() => onStartNewCase(selectedCase.id)}
                    disabled={selectedCase.status === 'locked'}
                    className={`w-full py-2 font-mono text-sm text-left font-bold transition-colors uppercase tracking-wider ${
                      selectedCase.status === 'locked'
                        ? theme.colors.text.separator
                        : `${theme.colors.interactive.text} ${theme.colors.interactive.hover}`
                    } disabled:cursor-not-allowed`}
                  >
                    {selectedCase.status === 'locked'
                      ? `${theme.symbols.doubleArrowRight} [LOCKED]`
                      : `${theme.symbols.doubleArrowRight} [ENTER] START CASE`}
                  </button>
                </div>
              </>
            ) : (
              <div className={`${theme.colors.text.separator} text-sm font-mono`}>
                No case selected
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`border-t ${theme.colors.border.default} p-4`}>
          <button
            onClick={onLoadGame}
            className={`w-full py-2 font-mono text-sm text-left font-bold ${theme.colors.interactive.text} ${theme.colors.interactive.hover} transition-colors uppercase tracking-wider`}
          >
            {theme.symbols.doubleArrowRight} [L] LOAD GAME
          </button>
        </div>
      </div>

      {/* Keyboard Hint */}
      <p className={`text-center ${theme.colors.text.separator} text-xs font-mono mt-4`}>
        {theme.symbols.arrowUp}{theme.symbols.arrowDown} or W/S: Navigate {theme.symbols.bullet} 1-9: Select Case {theme.symbols.bullet} Enter: Start {theme.symbols.bullet} L: Load Game
      </p>
    </div>
  );
}

export default LandingPage;
