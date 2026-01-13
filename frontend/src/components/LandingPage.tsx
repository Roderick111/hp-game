/**
 * LandingPage Component
 *
 * Two-pane terminal layout: case list (left) + selected case details (right).
 * Minimal B&W aesthetic, scalable to multiple cases.
 *
 * Keyboard shortcuts:
 * - 1-9: Select case by number
 * - Enter: Start selected case
 * - L: Load Game
 *
 * @module components/LandingPage
 * @since Phase 5.3.1
 */

import { useEffect, useMemo, useState } from 'react';
import type { CaseMetadata } from '../types/investigation';

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
// Component
// ============================================

export function LandingPage({ onStartNewCase, onLoadGame }: LandingPageProps) {
  // Hardcoded case list (Phase 1 - single case + mock cases for testing)
  // Future: Fetch from backend /api/cases endpoint
  const cases: CaseMetadata[] = useMemo(
    () => [
      {
        id: 'case_001',
        name: 'The Restricted Section',
        difficulty: 'Medium',
        status: 'unlocked',
        description:
          'A third-year student has been found petrified in the Hogwarts Library. As a trainee Auror, you must investigate the crime scene, interview witnesses, and identify the culprit using evidence and deductive reasoning.',
      },
      {
        id: 'case_002',
        name: 'The Poisoned Potion',
        difficulty: 'Hard',
        status: 'locked',
        description:
          'A Potions professor has been found unconscious after drinking a supposedly harmless remedy. Examine the brewing equipment, analyze ingredient traces, and determine whether this was an accident or deliberate poisoning.',
      },
      {
        id: 'case_003',
        name: 'The Missing Wand',
        difficulty: 'Easy',
        status: 'locked',
        description:
          'A valuable family heirloom wand has vanished from a secured display case in the Auror Office. No signs of forced entry, no witnesses. Use your investigative skills to track down the thief and recover the artifact.',
      },
      {
        id: 'case_004',
        name: 'The Forbidden Forest',
        difficulty: 'Hard',
        status: 'locked',
        description:
          'Strange magical disturbances have been detected deep in the Forbidden Forest. Students report seeing unusual lights and hearing unexplained sounds. Investigate the forest, interview creatures, and identify the source of the disturbances.',
      },
      {
        id: 'case_005',
        name: 'The Dark Artifact',
        difficulty: 'Medium',
        status: 'locked',
        description:
          'A cursed object has been discovered hidden in Borgin and Burkes. The shopkeeper denies knowledge of its origin. Trace the artifact\'s history, identify its magical properties, and find who placed it there.',
      },
      {
        id: 'case_006',
        name: 'The Memory Charm',
        difficulty: 'Easy',
        status: 'locked',
        description:
          'A Ministry official claims to have no memory of the past three days. Medical examination reveals traces of a Memory Charm. Interview witnesses, reconstruct the timeline, and discover who cast the spell and why.',
      },
    ],
    []
  );

  // Selected case (default to first)
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedCase = cases[selectedIndex];

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
        ↑↓ or W/S: Navigate | 1-9: Select Case | Enter: Start | L: Load Game
      </p>
    </div>
  );
}

export default LandingPage;
