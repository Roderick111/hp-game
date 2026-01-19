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

import { useEffect, useCallback } from "react";
import { TerminalPanel } from "./ui/TerminalPanel";
import { generateAsciiBar, TERMINAL_THEME } from "../styles/terminal-theme";
import type { WitnessInfo } from "../types/investigation";

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
  /** Compact mode: show names only, hide trust bars and secret counts (Phase 6.5) */
  compact?: boolean;
}

// ============================================
// Sub-components
// ============================================

interface WitnessCardProps {
  witness: WitnessInfo;
  onClick: () => void;
  keyboardNumber?: number;
  /** Compact mode: hide trust bars and secret counts (Phase 6.5) */
  compact?: boolean;
}

function WitnessCard({
  witness,
  onClick,
  keyboardNumber,
  compact = false,
}: WitnessCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded border transition-colors
        bg-gray-900/50 border-gray-700 hover:border-gray-300 hover:bg-gray-800
        focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:outline-none
        ${compact ? "p-2" : "p-3"}`}
      aria-label={`Select ${witness.name} for interrogation. Trust: ${witness.trust}%. Secrets revealed: ${witness.secrets_revealed.length}`}
    >
      {/* Witness name with bullet and keyboard shortcut */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 group">
          {/* Bullet dot */}
          <span className="text-gray-400 group-hover:text-amber-400 transition-colors">
            {TERMINAL_THEME.symbols.bullet}
          </span>
          <span className="font-medium text-amber-400 hover:text-amber-300 transition-colors">
            {witness.name}
          </span>
        </div>
        {/* Keyboard shortcut number */}
        {keyboardNumber && keyboardNumber <= 9 && (
          <span className="text-gray-600 text-xs font-mono">
            [{keyboardNumber}]
          </span>
        )}
      </div>

      {/* Trust bar - hidden in compact mode (Phase 6.5) */}
      {!compact && (
        <div className="mt-1 text-sm text-gray-400 font-mono ml-6">
          Trust: {generateAsciiBar(witness.trust)} {witness.trust}%
        </div>
      )}

      {/* Secrets count - hidden in compact mode (Phase 6.5) */}
      {!compact && witness.secrets_revealed.length > 0 && (
        <div className="text-sm text-gray-400 ml-6">
          {witness.secrets_revealed.length} secret
          {witness.secrets_revealed.length !== 1 ? "s" : ""}
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
  compact = false,
}: WitnessSelectorProps) {
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
    [witnesses, keyboardStartIndex, onSelectWitness],
  );

  // Register keyboard listener
  useEffect(() => {
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
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
          <div className="animate-pulse text-gray-400">
            Loading witnesses...
          </div>
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
  const maxWitnessesShown = Math.min(
    witnesses.length,
    9 - keyboardStartIndex + 1,
  );
  const endIndex = keyboardStartIndex + maxWitnessesShown - 1;
  const footerText =
    maxWitnessesShown > 0
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
              compact={compact}
            />
          );
        })}
      </div>
    </TerminalPanel>
  );
}
