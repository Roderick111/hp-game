import React from 'react';
import { GamePhase } from '../../types/game';

interface ProgressIndicatorProps {
  currentPhase: GamePhase;
}

const phases: { id: GamePhase; label: string }[] = [
  { id: 'briefing', label: 'Briefing' },
  { id: 'hypothesis', label: 'Hypotheses' },
  { id: 'investigation', label: 'Investigation' },
  { id: 'prediction', label: 'Prediction' },
  { id: 'resolution', label: 'Resolution' },
  { id: 'review', label: 'Review' },
];

export function ProgressIndicator({ currentPhase }: ProgressIndicatorProps) {
  const currentIndex = phases.findIndex(p => p.id === currentPhase);

  return (
    <div className="flex items-center justify-center gap-1 md:gap-2">
      {phases.map((phase, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <React.Fragment key={phase.id}>
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  transition-colors duration-300
                  ${isComplete
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-amber-600 text-white ring-2 ring-amber-300'
                    : 'bg-amber-200 text-amber-600'
                  }
                `}
              >
                {isComplete ? '✓' : index + 1}
              </div>
              <span
                className={`
                  text-xs mt-1 hidden md:block
                  ${isCurrent ? 'text-amber-900 font-semibold' : 'text-amber-600'}
                `}
              >
                {phase.label}
              </span>
            </div>
            {index < phases.length - 1 && (
              <div
                className={`
                  w-4 md:w-8 h-0.5
                  ${index < currentIndex ? 'bg-green-500' : 'bg-amber-200'}
                `}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
