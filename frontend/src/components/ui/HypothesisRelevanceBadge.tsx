/**
 * HypothesisRelevanceBadge Component (Stub)
 *
 * This is a stub component for legacy compatibility.
 * Part of the v0.7.0 prototype that has been deprecated.
 *
 * @deprecated Will be removed in Phase 2
 * @module components/ui/HypothesisRelevanceBadge
 */

interface HypothesisRelevanceBadgeProps {
  hypothesisLabel: string;
  relevance: 'supports' | 'contradicts';
  compact?: boolean;
}

/**
 * @deprecated Legacy component - not used in Phase 1
 */
export function HypothesisRelevanceBadge({
  hypothesisLabel,
  relevance,
  compact = false,
}: HypothesisRelevanceBadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full text-xs font-medium';
  const sizeClasses = compact ? 'px-1.5 py-0.5' : 'px-2 py-1';
  const colorClasses =
    relevance === 'supports'
      ? 'bg-green-100 text-green-800 border border-green-200'
      : 'bg-red-100 text-red-800 border border-red-200';

  return (
    <span className={`${baseClasses} ${sizeClasses} ${colorClasses}`}>
      {relevance === 'supports' ? '+' : '-'} {hypothesisLabel}
    </span>
  );
}
