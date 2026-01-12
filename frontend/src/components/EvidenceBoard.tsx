/**
 * EvidenceBoard Component
 *
 * Displays discovered evidence in a terminal UI aesthetic sidebar.
 * Auto-updates when new evidence is discovered during investigation.
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
  caseId,
  compact = false,
  onEvidenceClick,
}: EvidenceBoardProps) {
  // ⚡ Bolt: Memoize the formatted evidence list to prevent re-computation on every render.
  // This avoids re-mapping and re-formatting the entire list if the parent component
  // re-renders for reasons unrelated to the evidence list itself.
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
      <div className="border-b border-gray-700 pb-2 mb-3">
        <h3 className="text-xl font-bold text-yellow-400 uppercase tracking-wide">
          EVIDENCE BOARD
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Case: {caseId}
        </p>
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
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
            Collected: {evidence.length} item{evidence.length === 1 ? '' : 's'}
          </p>

          {/* Evidence Items */}
          <ul className="space-y-2">
            {formattedEvidence.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onEvidenceClick?.(item.id)}
                  className={`
                    w-full text-left rounded border border-gray-700 bg-gray-800
                    cursor-pointer hover:bg-gray-750 hover:border-green-600 transition-colors
                    ${compact ? 'p-1.5' : 'p-2'}
                  `}
                  type="button"
                  aria-label={`View details for ${item.formattedId}`}
                >
                  <div className="flex items-start">
                    {/* Evidence Number */}
                    <span className="text-yellow-500 text-xs mr-2 font-bold">
                      [{item.displayIndex}]
                    </span>

                    {/* Evidence ID */}
                    <span className="text-gray-300 text-sm break-all">
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
          <p className="text-xs text-gray-600 italic">
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
