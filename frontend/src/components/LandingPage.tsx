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
      <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white font-mono tracking-widest mb-1">
            AUROR ACADEMY
          </h1>
          <p className="text-gray-500 text-xs font-mono mb-8">
            Case Investigation System v1.0
          </p>
          <p className="text-gray-400 text-sm font-mono animate-pulse">
            Loading cases...
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
      <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-white font-mono tracking-widest mb-1">
            AUROR ACADEMY
          </h1>
          <p className="text-gray-500 text-xs font-mono mb-8">
            Case Investigation System v1.0
          </p>
          <p className="text-red-400 text-sm font-mono mb-4">
            {error}
          </p>
          <button
            onClick={() => void fetchCases()}
            className="px-4 py-2 bg-gray-800 text-white font-mono text-sm border border-gray-700 hover:bg-gray-700 transition-colors"
          >
            &gt;&gt; RETRY
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
      <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white font-mono tracking-widest mb-1">
            AUROR ACADEMY
          </h1>
          <p className="text-gray-500 text-xs font-mono mb-8">
            Case Investigation System v1.0
          </p>
          <p className="text-gray-400 text-sm font-mono mb-4">
            No cases available.
          </p>
          <p className="text-gray-600 text-xs font-mono">
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
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-8">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white font-mono tracking-widest mb-1">
          AUROR ACADEMY
        </h1>
        <p className="text-gray-500 text-xs font-mono">
          Case Investigation System v1.0
        </p>
      </div>

      {/* Two-Pane Layout */}
      <div className="max-w-5xl w-full border border-gray-700 bg-gray-900">
        {/* Header */}
        <div className="grid grid-cols-2 border-b border-gray-700">
          <div className="px-4 py-2 border-r border-gray-700">
            <h2 className="text-sm font-bold text-white font-mono uppercase">
              Available Cases
            </h2>
          </div>
          <div className="px-4 py-2">
            <h2 className="text-sm font-bold text-white font-mono uppercase">
              Case Details
            </h2>
          </div>
        </div>

        {/* Content Panes */}
        <div className="grid grid-cols-2 min-h-[400px]">
          {/* Left Pane: Case List */}
          <div className="border-r border-gray-700">
            {cases.map((caseItem, index) => {
              const isSelected = index === selectedIndex;
              const isLocked = caseItem.status === 'locked';
              const caseNumber = String(index + 1).padStart(3, '0');

              return (
                <button
                  key={caseItem.id}
                  onClick={() => setSelectedIndex(index)}
                  className={`w-full text-left px-4 font-mono text-sm transition-colors border-b border-gray-800 min-h-[72px] flex items-center ${
                    isSelected
                      ? 'bg-gray-800'
                      : 'hover:bg-gray-850'
                  }`}
                >
                  <div className="flex items-start leading-tight">
                    <span className={isSelected ? 'text-white w-4 flex-shrink-0' : 'text-gray-600 w-4 flex-shrink-0'}>{isSelected ? '>' : ' '}</span>
                    <div className="flex-1">
                      <div className={`leading-tight ${isSelected ? 'text-white font-bold' : isLocked ? 'text-gray-600' : 'text-gray-400'}`}>
                        {caseNumber}. {caseItem.name}
                      </div>
                      <div className={`text-xs mt-1 leading-tight ${isSelected ? 'text-gray-400' : 'text-gray-600'}`}>
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
                  <h3 className="text-sm font-bold text-white font-mono uppercase">
                    {selectedCase.name}
                  </h3>
                  <span className="text-sm font-mono text-gray-500 whitespace-nowrap">
                    {selectedCase.status === 'unlocked' ? 'Available' : 'Locked'}
                  </span>
                </div>
                <p className="text-gray-400 text-sm font-mono leading-relaxed mb-6 flex-1">
                  {selectedCase.description}
                </p>
                <div className="text-sm font-mono text-gray-500 mb-6">
                  Difficulty: {selectedCase.difficulty}
                </div>
                <div className="border-t border-gray-700 pt-6 mt-6">
                  <button
                    onClick={() => onStartNewCase(selectedCase.id)}
                    disabled={selectedCase.status === 'locked'}
                    className="w-full py-2 font-mono text-sm text-left text-white font-bold hover:text-gray-300 hover:underline disabled:text-gray-600 disabled:no-underline transition-colors uppercase tracking-wider"
                  >
                    {selectedCase.status === 'locked' ? '>> [LOCKED]' : '>> [ENTER] START CASE'}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-gray-600 text-sm font-mono">No case selected</div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-700 p-4">
          <button
            onClick={onLoadGame}
            className="w-full py-2 font-mono text-sm text-left text-white font-bold hover:text-gray-300 hover:underline transition-colors uppercase tracking-wider"
          >
            &gt;&gt; [L] LOAD GAME
          </button>
        </div>
      </div>

      {/* Keyboard Hint */}
      <p className="text-center text-gray-600 text-xs font-mono mt-4">
        {String.fromCharCode(8593)}{String.fromCharCode(8595)} or W/S: Navigate | 1-9: Select Case | Enter: Start | L: Load Game
      </p>
    </div>
  );
}

export default LandingPage;
