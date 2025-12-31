import React from 'react';
import { GamePhase } from '../../types/game';
import { ProgressIndicator } from '../ui/ProgressIndicator';

interface GameShellProps {
  children: React.ReactNode;
  caseTitle: string;
  currentPhase: GamePhase;
}

export function GameShell({ children, caseTitle, currentPhase }: GameShellProps) {
  return (
    <div className="min-h-screen bg-parchment-50">
      {/* Header */}
      <header className="bg-amber-900 text-amber-50 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-serif font-bold">
                Auror Academy
              </h1>
              <p className="text-amber-200 text-sm">
                {caseTitle}
              </p>
            </div>
            <ProgressIndicator currentPhase={currentPhase} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-amber-100 border-t border-amber-200 py-4 mt-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-amber-700 text-sm">
          <p>Ministry of Magic - Auror Training Division</p>
        </div>
      </footer>
    </div>
  );
}
