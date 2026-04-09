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
import { generateAsciiBar } from "../styles/terminal-theme";
import { useTheme } from '../context/useTheme';
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
  /** Bare mode: render content without TerminalPanel wrapper (for use inside modals) */
  bare?: boolean;
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
  const { theme } = useTheme();

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 border group transition-all duration-200
        ${theme.colors.border.default} ${theme.colors.bg.primary} ${theme.colors.interactive.borderHover} ${theme.colors.bg.hoverClass}
        cursor-pointer shadow-sm hover:shadow-md
        focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:outline-none`}
      aria-label={`Select ${witness.name} for interrogation. Trust: ${witness.trust}%. Secrets revealed: ${witness.secrets_revealed.length}`}
    >
      {/* Header: name + shortcut */}
      <div className="flex items-start justify-between mb-1">
        <h3 className={`${theme.fonts.ui} font-bold uppercase tracking-wider text-sm flex items-center gap-2 ${theme.colors.text.primary}`}>
          <span className={`${theme.colors.text.muted} group-hover:text-amber-400 transition-colors`}>
            {theme.symbols.bullet}
          </span>
          {witness.name}
        </h3>
        {keyboardNumber && keyboardNumber <= 9 && (
          <span className={`${theme.colors.text.separator} text-xs ${theme.fonts.ui}`}>
            [{keyboardNumber}]
          </span>
        )}
      </div>

      {/* Trust bar */}
      {!compact && (
        <p className={`${theme.colors.text.tertiary} text-sm ${theme.fonts.ui} pl-5 opacity-90 group-hover:opacity-100 transition-opacity`}>
          Trust: {generateAsciiBar(witness.trust)} {witness.trust}%
        </p>
      )}

      {/* Secrets count */}
      {!compact && witness.secrets_revealed.length > 0 && (
        <p className={`${theme.colors.text.tertiary} text-sm ${theme.fonts.ui} pl-5 mt-0.5`}>
          {witness.secrets_revealed.length} secret
          {witness.secrets_revealed.length !== 1 ? "s" : ""} revealed
        </p>
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
  bare = false,
}: WitnessSelectorProps) {
  const { theme } = useTheme();
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

      // Ignore if a modal is open — unless we're in bare mode (rendered inside a modal)
      if (!bare && document.querySelector('[role="dialog"]')) {
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
    [witnesses, keyboardStartIndex, onSelectWitness, bare],
  );

  // Register keyboard listener
  useEffect(() => {
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [handleKeydown]);

  // Loading state
  if (loading && witnesses.length === 0) {
    const content = (
      <div className="flex items-center justify-center py-8">
        <div className={`animate-pulse ${theme.colors.text.tertiary}`}>
          Loading witnesses...
        </div>
      </div>
    );
    if (bare) return content;
    return (
      <TerminalPanel title="AVAILABLE WITNESSES" collapsible={collapsible} defaultCollapsed={defaultCollapsed} persistenceKey={persistenceKey}>
        {content}
      </TerminalPanel>
    );
  }

  // Error state
  if (error && witnesses.length === 0) {
    const content = (
      <div className={`p-4 ${theme.colors.state.error.bg} border ${theme.colors.state.error.border} rounded ${theme.colors.state.error.text} text-sm`}>
        <span className="font-bold">Error:</span> {error}
      </div>
    );
    if (bare) return content;
    return (
      <TerminalPanel title="AVAILABLE WITNESSES" collapsible={collapsible} defaultCollapsed={defaultCollapsed} persistenceKey={persistenceKey}>
        {content}
      </TerminalPanel>
    );
  }

  // Empty state
  if (witnesses.length === 0) {
    const content = (
      <p className={`${theme.colors.text.muted} text-sm italic text-center py-4`}>
        No witnesses available for this case.
      </p>
    );
    if (bare) return content;
    return (
      <TerminalPanel title="AVAILABLE WITNESSES" collapsible={collapsible} defaultCollapsed={defaultCollapsed} persistenceKey={persistenceKey}>
        {content}
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

  const content = (
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
      {!bare && footerText && (
        <p className={`${theme.colors.text.muted} text-xs mt-3`}>* {footerText}</p>
      )}
    </div>
  );

  if (bare) return content;

  return (
    <TerminalPanel
      title="AVAILABLE WITNESSES"
      footer={footerText}
      collapsible={collapsible}
      defaultCollapsed={defaultCollapsed}
      persistenceKey={persistenceKey}
    >
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
