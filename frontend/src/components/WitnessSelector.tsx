/**
 * WitnessSelector Component
 *
 * Lists available witnesses with:
 * - ASCII trust level indicator per witness
 * - Click to select for interrogation
 * - Visual indicator for secrets revealed count
 * - Keyboard shortcuts (dynamic based on location count)
 * Uses centralized design system for consistent styling.
 *
 * @module components/WitnessSelector
 * @since Phase 2
 * @updated Phase 5.3.1 (Design System)
 */

import { useEffect, useCallback } from 'react';
import { TerminalPanel } from './ui/TerminalPanel';
import { generateAsciiBar } from '../styles/terminal-theme';
import type { WitnessInfo } from '../types/investigation';

// ============================================
// Types
// ============================================

interface WitnessSelectorProps {
  /** List of available witnesses */
  witnesses: WitnessInfo[];
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Callback when witness is selected */
  onSelectWitness: (witnessId: string) => void;
  /** Starting index for keyboard shortcuts (e.g., if 3 locations, start at 4) */
  keyboardStartIndex?: number;
  /** Whether panel can be collapsed */
  collapsible?: boolean;
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
  /** Optional key to persist collapsed state */
  persistenceKey?: string;
}

// ============================================
// Sub-components
// ============================================

interface WitnessCardProps {
  witness: WitnessInfo;
  onClick: () => void;
  keyboardNumber?: number;
}

function WitnessCard({ witness, onClick, keyboardNumber }: WitnessCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded border transition-colors
        bg-gray-800/50 border-gray-700 hover:border-gray-300 hover:bg-gray-800
        focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:outline-none"
      aria-label={`Select ${witness.name} for interrogation. Trust: ${witness.trust}%. Secrets revealed: ${witness.secrets_revealed.length}`}
    >
      {/* Witness name with keyboard shortcut */}
      <div className="flex items-center gap-2">
        {/* Keyboard shortcut number */}
        {keyboardNumber && keyboardNumber <= 9 && (
          <span className="text-gray-600 text-xs font-mono">[{keyboardNumber}]</span>
        )}
        <span className="font-medium text-amber-400 hover:text-amber-300 transition-colors">
          {witness.name}
        </span>
      </div>

      {/* Trust bar */}
      <div className={`mt-1 text-sm text-gray-400 font-mono ${keyboardNumber && keyboardNumber <= 9 ? 'ml-9' : 'ml-0'}`}>
        Trust: {generateAsciiBar(witness.trust)} {witness.trust}%
      </div>

      {/* Secrets count */}
      {witness.secrets_revealed.length > 0 && (
        <div className={`text-sm text-gray-400 ${keyboardNumber && keyboardNumber <= 9 ? 'ml-9' : 'ml-0'}`}>
          {witness.secrets_revealed.length} secret{witness.secrets_revealed.length !== 1 ? 's' : ''}
        </div>
      )}
    </button>
  );
}

// ============================================
// Main Component
// ============================================

export function WitnessSelector({
  witnesses,
  loading,
  error,
  onSelectWitness,
  keyboardStartIndex = 1,
  collapsible = false,
  defaultCollapsed = false,
  persistenceKey,
}: WitnessSelectorProps) { // Restore logic below

  // Keyboard shortcuts: starting from keyboardStartIndex
  const handleKeydown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Ignore if a modal is open (common role="dialog")
      if (document.querySelector('[role="dialog"]')) {
        return;
      }

      // Only handle number keys 1-9
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        // Calculate witness index based on keyboard start
        const witnessIndex = num - keyboardStartIndex;
        if (witnessIndex >= 0 && witnessIndex < witnesses.length) {
          e.preventDefault();
          const targetWitness = witnesses[witnessIndex];
          if (targetWitness) {
            onSelectWitness(targetWitness.id);
          }
        }
      }
    },
    [witnesses, keyboardStartIndex, onSelectWitness]
  );

  // Register keyboard listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [handleKeydown]);

  // Loading state
  if (loading && witnesses.length === 0) {
    return (
      <TerminalPanel
        title="AVAILABLE WITNESSES"
        collapsible={collapsible}
        defaultCollapsed={defaultCollapsed}
        persistenceKey={persistenceKey}
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-gray-400">Loading witnesses...</div>
        </div>
      </TerminalPanel>
    );
  }

  // Error state
  if (error && witnesses.length === 0) {
    return (
      <TerminalPanel
        title="AVAILABLE WITNESSES"
        collapsible={collapsible}
        defaultCollapsed={defaultCollapsed}
        persistenceKey={persistenceKey}
      >
        <div className="p-4 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm">
          <span className="font-bold">Error:</span> {error}
        </div>
      </TerminalPanel>
    );
  }

  // Empty state
  if (witnesses.length === 0) {
    return (
      <TerminalPanel
        title="AVAILABLE WITNESSES"
        collapsible={collapsible}
        defaultCollapsed={defaultCollapsed}
        persistenceKey={persistenceKey}
      >
        <p className="text-gray-500 text-sm italic text-center py-4">
          No witnesses available for this case.
        </p>
      </TerminalPanel>
    );
  }

  // Calculate keyboard shortcuts display range
  const maxWitnessesShown = Math.min(witnesses.length, 9 - keyboardStartIndex + 1);
  const endIndex = keyboardStartIndex + maxWitnessesShown - 1;
  const footerText = maxWitnessesShown > 0
    ? `Press ${keyboardStartIndex}-${endIndex} to quick-select`
    : "Select a witness to begin interrogation";

  return (
    <TerminalPanel
      title="AVAILABLE WITNESSES"
      footer={footerText}
      collapsible={collapsible}
      defaultCollapsed={defaultCollapsed}
      persistenceKey={persistenceKey}
    >
      {/* Witness List */}
      <div className="space-y-2">
        {witnesses.map((witness, index) => {
          const keyboardNum = keyboardStartIndex + index;
          return (
            <WitnessCard
              key={witness.id}
              witness={witness}
              onClick={() => onSelectWitness(witness.id)}
              keyboardNumber={keyboardNum <= 9 ? keyboardNum : undefined}
            />
          );
        })}
      </div>
    </TerminalPanel>
  );
}
