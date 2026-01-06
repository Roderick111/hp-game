/**
 * HypothesisRelevanceBadge Component
 *
 * Visual badge showing how evidence relates to a hypothesis.
 * Displays "Supports H1" or "Contradicts H2" with appropriate color coding.
 *
 * Features:
 * - Green styling for "supports" relationship
 * - Red styling for "contradicts" relationship
 * - Compact pill/badge style
 * - Accessible with ARIA labels
 *
 * @module components/ui/HypothesisRelevanceBadge
 * @since Milestone 6
 */

import type { EvidenceRelevance } from '../../utils/evidenceRelevance';

export interface HypothesisRelevanceBadgeProps {
  /** Short hypothesis label (e.g., "H1", "H2") */
  hypothesisLabel: string;
  /** Relationship type: supports or contradicts */
  relevance: Exclude<EvidenceRelevance, 'neutral'>;
  /** Optional: Use compact styling (smaller text, less padding) */
  compact?: boolean;
}

/**
 * Up arrow icon for "supports" relationship
 */
function SupportsIcon(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-3 h-3"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Down arrow icon for "contradicts" relationship
 */
function ContradictsIcon(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-3 h-3"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * HypothesisRelevanceBadge displays the relationship between evidence and a hypothesis.
 *
 * @example Supports badge
 * ```tsx
 * <HypothesisRelevanceBadge
 *   hypothesisLabel="H1"
 *   relevance="supports"
 * />
 * ```
 *
 * @example Contradicts badge (compact)
 * ```tsx
 * <HypothesisRelevanceBadge
 *   hypothesisLabel="H2"
 *   relevance="contradicts"
 *   compact
 * />
 * ```
 */
export function HypothesisRelevanceBadge({
  hypothesisLabel,
  relevance,
  compact = false,
}: HypothesisRelevanceBadgeProps): JSX.Element {
  const isSupports = relevance === 'supports';

  // Style variants based on relevance type
  const colorClasses = isSupports
    ? 'bg-green-100 text-green-700 border-green-300'
    : 'bg-red-100 text-red-700 border-red-300';

  // Size variants
  const sizeClasses = compact
    ? 'px-1.5 py-0.5 text-xs gap-0.5'
    : 'px-2 py-0.5 text-xs gap-1';

  // Action label for accessibility
  const actionLabel = isSupports ? 'Supports' : 'Contradicts';

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium border
        ${colorClasses}
        ${sizeClasses}
      `}
      aria-label={`${actionLabel} hypothesis ${hypothesisLabel}`}
    >
      {isSupports ? <SupportsIcon /> : <ContradictsIcon />}
      <span>
        {actionLabel} {hypothesisLabel}
      </span>
    </span>
  );
}

export default HypothesisRelevanceBadge;
