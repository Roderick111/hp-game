/**
 * EvidenceCard Component
 *
 * Displays collected evidence with findings, interpretation, and hypothesis relevance.
 *
 * Enhanced in Milestone 6 with:
 * - Hypothesis relevance badges (Supports H1, Contradicts H2)
 * - Improved information hierarchy
 * - Visual unlock potential hints
 *
 * @module components/ui/EvidenceCard
 * @since Milestone 1
 * @updated Milestone 6 - Added hypothesis relevance display
 */

import { EvidenceData } from '../../types/game';
import type { ConditionalHypothesis, Contradiction } from '../../types/enhanced';
import { HypothesisRelevanceBadge } from './HypothesisRelevanceBadge';
import {
  getRelevantHypotheses,
  getHypothesisShortLabel,
} from '../../utils/evidenceRelevance';

interface EvidenceCardProps {
  /** The evidence data to display */
  evidence: EvidenceData;
  /** The evidence ID (from InvestigationAction) for relevance lookup */
  evidenceId?: string;
  /** All hypotheses in the case (for relevance calculation) */
  hypotheses?: readonly ConditionalHypothesis[];
  /** All contradictions in the case (for relevance calculation) */
  contradictions?: readonly Contradiction[];
  /** Whether to show hypothesis relevance badges */
  showRelevance?: boolean;
  /** Compact mode for list views */
  compact?: boolean;
}

/**
 * EvidenceCard displays collected evidence with enhanced information hierarchy.
 *
 * @example Basic usage (no relevance)
 * ```tsx
 * <EvidenceCard evidence={action.evidence} />
 * ```
 *
 * @example With hypothesis relevance
 * ```tsx
 * <EvidenceCard
 *   evidence={action.evidence}
 *   hypotheses={caseData.hypotheses}
 *   contradictions={caseData.contradictions}
 *   showRelevance={true}
 * />
 * ```
 */
export function EvidenceCard({
  evidence,
  evidenceId,
  hypotheses = [],
  contradictions = [],
  showRelevance = true,
  compact = false,
}: EvidenceCardProps) {
  // Calculate relevance to hypotheses (requires evidenceId)
  const relevantHypotheses = showRelevance && hypotheses.length > 0 && evidenceId
    ? getRelevantHypotheses(evidenceId, hypotheses, contradictions)
    : [];

  // Limit displayed badges to prevent overflow
  const maxBadges = 3;
  const displayedRelevance = relevantHypotheses.slice(0, maxBadges);
  const remainingCount = relevantHypotheses.length - maxBadges;

  return (
    <div className="space-y-4">
      {/* Header with title + relevance badges */}
      <div className="border-b-2 border-amber-700 pb-2">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-serif font-bold text-amber-900">
            {evidence.isCritical && (
              <span className="text-red-600" aria-label="Critical evidence">
                *{' '}
              </span>
            )}
            {evidence.title}
          </h3>

          {/* Hypothesis relevance badges */}
          {displayedRelevance.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-end flex-shrink-0">
              {displayedRelevance.map(({ hypothesisId, relevance }) => (
                <HypothesisRelevanceBadge
                  key={hypothesisId}
                  hypothesisLabel={getHypothesisShortLabel(hypothesisId, hypotheses)}
                  relevance={relevance}
                  compact={compact}
                />
              ))}
              {remainingCount > 0 && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200"
                  title={`${remainingCount} more hypothesis connection${remainingCount === 1 ? '' : 's'}`}
                >
                  +{remainingCount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Evidence ID for reference (if provided) */}
        {evidenceId && (
          <p className="text-xs text-amber-600 mt-1 font-mono">{evidenceId}</p>
        )}
      </div>

      {/* Findings section */}
      <div className="bg-parchment-100 p-4 rounded border border-amber-200">
        <h4 className="font-bold text-amber-800 mb-2 text-sm uppercase tracking-wide">
          Findings
        </h4>
        <div className="text-amber-900 whitespace-pre-line leading-relaxed">
          {evidence.content}
        </div>
      </div>

      {/* Interpretation section */}
      <div className="bg-amber-100 p-4 rounded border border-amber-300">
        <h4 className="font-bold text-amber-800 mb-2 text-sm uppercase tracking-wide">
          Interpretation
        </h4>
        <p className="text-amber-900 italic">{evidence.interpretation}</p>
      </div>

      {/* Critical evidence indicator */}
      {evidence.isCritical && (
        <div className="bg-red-50 p-3 rounded border border-red-200 text-center">
          <span className="text-red-700 font-semibold text-sm">CRITICAL EVIDENCE</span>
          <p className="text-red-600 text-xs mt-1">
            This evidence is essential for solving the case
          </p>
        </div>
      )}

      {/* Relevance summary (if has relevant hypotheses) */}
      {relevantHypotheses.length > 0 && !compact && (
        <div className="bg-blue-50 p-3 rounded border border-blue-200">
          <h4 className="font-bold text-blue-800 mb-2 text-sm uppercase tracking-wide">
            Hypothesis Connections
          </h4>
          <ul className="space-y-1 text-sm">
            {relevantHypotheses.map(({ hypothesisId, hypothesisLabel, relevance }) => (
              <li key={hypothesisId} className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    relevance === 'supports' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-blue-900">
                  <span className="font-medium">
                    {getHypothesisShortLabel(hypothesisId, hypotheses)}
                  </span>
                  : {hypothesisLabel}
                  <span className="text-blue-600 ml-1">
                    ({relevance === 'supports' ? 'supporting' : 'contradicting'})
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
