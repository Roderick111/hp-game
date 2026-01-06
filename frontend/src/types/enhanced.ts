/**
 * Enhanced Types (Stub file for legacy compatibility)
 *
 * These types were part of the v0.7.0 prototype that has been deprecated.
 * This stub file exists to prevent TypeScript errors from legacy code that
 * hasn't been fully migrated yet.
 *
 * Phase 1 uses types from ./investigation.ts instead.
 *
 * @module types/enhanced
 * @deprecated Legacy types - will be removed in Phase 2
 */

// ============================================
// Stub Types for Legacy Compatibility
// ============================================

/**
 * @deprecated Use investigation.ts types instead
 */
export interface UnlockTrigger {
  type: 'evidence' | 'location' | 'time';
  id: string;
  description?: string;
}

/**
 * @deprecated Use investigation.ts types instead
 */
export interface Contradiction {
  id: string;
  evidenceId1: string;
  evidenceId2: string;
  description: string;
  resolution?: string;
  severity?: 'low' | 'medium' | 'high';
  isResolved?: boolean;
}

/**
 * @deprecated Use investigation.ts types instead
 */
export interface ConditionalHypothesis {
  id: string;
  label: string;
  description: string;
  tier: 1 | 2;
  unlockRequirements?: UnlockTrigger[];
}
