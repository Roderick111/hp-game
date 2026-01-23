/**
 * EvidenceBoard Component
 *
 * Displays discovered evidence in a minimal B&W terminal aesthetic sidebar.
 * Auto-updates when new evidence is discovered during investigation.
 * Uses centralized design system for consistent styling.
 *
 * @module components/EvidenceBoard
 * @since Phase 1
 * @updated Phase 5.3.1 (Design System)
 */

import { useMemo } from "react";
import { TerminalPanel } from "./ui/TerminalPanel";
import { useTheme } from "../context/ThemeContext";

// ============================================
// Types
// ============================================

interface EvidenceBoardProps {
  /** Array of discovered evidence IDs */
  evidence: string[];
  /** Current case ID */
  caseId: string;
  /** Optional: Compact mode for smaller displays */
  compact?: boolean;
  /** Callback when evidence is clicked for details */
  onEvidenceClick?: (evidenceId: string) => void;
  /** Whether panel can be collapsed */
  collapsible?: boolean;
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
  /** Optional key to persist collapsed state */
  persistenceKey?: string;
}

// ============================================
// Component
// ============================================

export function EvidenceBoard({
  evidence,
  caseId: _caseId,
  compact = false,
  onEvidenceClick,
  collapsible = false,
  defaultCollapsed = false,
  persistenceKey,
}: EvidenceBoardProps) {
  const { theme } = useTheme();

  // Memoize the formatted evidence list to prevent re-computation on every render.
  const formattedEvidence = useMemo(
    () =>
      evidence.map((evidenceId, index) => ({
        id: evidenceId,
        formattedId: formatEvidenceId(evidenceId),
        displayIndex: String(index + 1).padStart(2, "0"),
      })),
    [evidence],
  );

  // Empty state
  if (evidence.length === 0) {
    return (
      <TerminalPanel
        title="EVIDENCE BOARD"
        collapsible={collapsible}
        defaultCollapsed={defaultCollapsed}
        persistenceKey={persistenceKey}
      >
        <div className="py-6 text-center">
          <p className={`${theme.colors.text.muted} text-sm`}>No evidence discovered yet</p>
          <p className={`${theme.colors.text.separator} text-xs mt-2`}>
            Investigate the location to find clues
          </p>
        </div>
      </TerminalPanel>
    );
  }

  return (
    <TerminalPanel
      title="EVIDENCE BOARD"
      subtitle={`${evidence.length} ITEM${evidence.length === 1 ? "" : "S"}`}
      footer="Click on evidence to view details"
      collapsible={collapsible}
      defaultCollapsed={defaultCollapsed}
      persistenceKey={persistenceKey}
    >
      {/* Evidence Items */}
      <ul className="space-y-2">
        {formattedEvidence.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => onEvidenceClick?.(item.id)}
              className={`
                w-full text-left rounded border ${theme.colors.border.default} ${theme.colors.bg.semiTransparent}
                cursor-pointer ${theme.colors.bg.hoverClass} ${theme.colors.border.hoverClass} transition-colors
                focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:outline-none
                ${compact ? "p-2" : "p-3"}
              `}
              type="button"
              aria-label={`View details for ${item.formattedId}`}
            >
              <div className="flex items-center gap-2">
                {/* Bullet */}
                <span className={theme.colors.text.tertiary}>{"\u2022"}</span>

                {/* Evidence ID */}
                <span className={`${theme.colors.interactive.text} ${theme.colors.interactive.hover} text-sm break-all transition-colors`}>
                  {item.formattedId}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </TerminalPanel>
  );
}

// ============================================
// Helpers
// ============================================

/**
 * Format evidence ID for display
 * Converts snake_case to Title Case with spaces
 *
 * @example
 * formatEvidenceId("hidden_note") // "Hidden Note"
 * formatEvidenceId("wand_signature") // "Wand Signature"
 */
function formatEvidenceId(id: string): string {
  return id
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
