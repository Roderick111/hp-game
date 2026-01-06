/**
 * Evidence Relevance Utilities (Stub)
 *
 * Stub utilities for legacy compatibility.
 * Part of the v0.7.0 prototype that has been deprecated.
 *
 * @deprecated Will be removed in Phase 2
 * @module utils/evidenceRelevance
 */

import type { ConditionalHypothesis, Contradiction } from '../types/enhanced';

/**
 * @deprecated Legacy function - not used in Phase 1
 */
export function getRelevantHypotheses(
  _evidenceId: string,
  _hypotheses: readonly ConditionalHypothesis[],
  _contradictions: readonly Contradiction[]
): {
  hypothesisId: string;
  hypothesisLabel: string;
  relevance: 'supports' | 'contradicts';
}[] {
  // Stub implementation - returns empty array
  return [];
}

/**
 * @deprecated Legacy function - not used in Phase 1
 */
export function getHypothesisShortLabel(
  hypothesisId: string,
  hypotheses: readonly ConditionalHypothesis[]
): string {
  const hypothesis = hypotheses.find((h) => h.id === hypothesisId);
  if (!hypothesis) return hypothesisId;

  // Create short label like "H1", "H2", etc.
  const index = hypotheses.findIndex((h) => h.id === hypothesisId);
  return `H${index + 1}`;
}
