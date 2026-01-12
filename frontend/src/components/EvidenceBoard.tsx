/**
 * EvidenceBoard Component
 *
 * Displays discovered evidence in a terminal UI aesthetic sidebar.
 * Auto-updates when new evidence is discovered during investigation.
 * Uses minimal black & white styling.
 *
 * @module components/EvidenceBoard
 * @since Phase 1
 */

import { useMemo } from 'react';
import { Card } from './ui/Card';

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
}

// ============================================
// Component
// ============================================

export function EvidenceBoard({
  evidence,
  caseId: _caseId,
  compact = false,
  onEvidenceClick,
}: EvidenceBoardProps) {
  // Memoize the formatted evidence list to prevent re-computation on every render.
  const formattedEvidence = useMemo(
    () =>
      evidence.map((evidenceId, index) => ({
        id: evidenceId,
        formattedId: formatEvidenceId(evidenceId),
        displayIndex: String(index + 1).padStart(2, '0'),
      })),
    [evidence],
  );

  return (
    <Card className="font-mono bg-gray-900 text-gray-100 border-gray-700">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white uppercase tracking-wide">
          EVIDENCE BOARD
        </h3>
        <div className="text-gray-600 mt-1">────────────────────────────────</div>
      </div>

      {/* Evidence List or Empty State */}
      {evidence.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-gray-500 text-sm">No evidence discovered yet</p>
          <p className="text-gray-600 text-xs mt-2">
            Investigate the location to find clues
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Evidence Count */}
          <p className="text-sm text-gray-400 uppercase tracking-wider mb-3">
            COLLECTED: {evidence.length} ITEM{evidence.length === 1 ? '' : 'S'}
          </p>

          {/* Evidence Items */}
          <ul className="space-y-2">
            {formattedEvidence.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onEvidenceClick?.(item.id)}
                  className={`
                    w-full text-left rounded border border-gray-700 bg-gray-800
                    cursor-pointer hover:bg-gray-800 hover:border-gray-500 transition-colors
                    ${compact ? 'p-1.5' : 'p-2'}
                  `}
                  type="button"
                  aria-label={`View details for ${item.formattedId}`}
                >
                  <div className="flex items-start">
                    {/* Evidence Number */}
                    <span className="text-gray-400 text-xs mr-2 font-bold">
                      [{item.displayIndex}]
                    </span>

                    {/* Evidence ID */}
                    <span className="text-gray-200 text-sm break-all">
                      {item.formattedId}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer hint */}
      {evidence.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            * Click on evidence to view details
          </p>
        </div>
      )}
    </Card>
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
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
