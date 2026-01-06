/**
 * ContradictionPanel Component
 *
 * Displays discovered evidence contradictions with visual distinction
 * between unresolved and resolved states.
 *
 * Enhanced in Milestone 6 with framer-motion animations for dramatic
 * reveal when contradictions are discovered.
 *
 * Features:
 * - Only shows discovered contradictions
 * - Visual distinction: Unresolved (amber warning) vs Resolved (green checkmark)
 * - Color-blind safe (uses icons in addition to colors)
 * - WCAG 2.1 AA accessible
 * - Dramatic entrance animation with shake effect for newly discovered
 *
 * @module components/ui/ContradictionPanel
 * @since Milestone 3
 * @updated Milestone 6 - Added framer-motion animations
 */

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Contradiction } from '../../types/enhanced';

interface EvidenceInfo {
  title: string;
  description: string;
}

interface ContradictionPanelProps {
  /** All contradictions in the case */
  contradictions: readonly Contradiction[];
  /** IDs of contradictions the player has discovered */
  discoveredIds: readonly string[];
  /** IDs of contradictions the player has resolved */
  resolvedIds: readonly string[];
  /** Map of evidence ID to evidence details */
  evidenceMap: Map<string, EvidenceInfo>;
  /** Callback when player resolves a contradiction */
  onResolve?: (contradictionId: string) => void;
  /** IDs of newly discovered contradictions (for shake animation) */
  newlyDiscoveredIds?: readonly string[];
}

/**
 * Panel animation variants - entrance with spring
 * Updated: stiffness 400, damping 15 for more dramatic entrance
 */
const panelVariants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: -10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 15,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Shake animation for newly discovered contradictions
 * Exact pattern: x: [0, -5, 5, -5, 5, 0] over 0.4s
 */
const shakeVariants = {
  shake: {
    x: [0, -5, 5, -5, 5, 0],
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
};

/**
 * Item animation variants for staggered list
 */
const itemVariants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 25,
    },
  },
  exit: { opacity: 0, x: 20 },
};

/**
 * Reduced motion variants
 */
const reducedMotionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.01 } },
  exit: { opacity: 0, transition: { duration: 0.01 } },
};

/**
 * ContradictionPanel displays evidence contradictions discovered during investigation.
 *
 * Returns null if no contradictions have been discovered yet.
 *
 * @example
 * ```tsx
 * <ContradictionPanel
 *   contradictions={caseData.contradictions}
 *   discoveredIds={state.discoveredContradictions}
 *   resolvedIds={state.resolvedContradictions}
 *   evidenceMap={evidenceMap}
 *   onResolve={handleResolve}
 *   newlyDiscoveredIds={newContradictionIds}
 * />
 * ```
 */
export function ContradictionPanel({
  contradictions,
  discoveredIds,
  resolvedIds,
  evidenceMap,
  onResolve,
  newlyDiscoveredIds = [],
}: ContradictionPanelProps) {
  const shouldReduceMotion = useReducedMotion();

  // Filter to only discovered contradictions
  const discoveredContradictions = contradictions.filter((c) =>
    discoveredIds.includes(c.id)
  );

  // Return null if no contradictions discovered
  if (discoveredContradictions.length === 0) {
    return null;
  }

  const isResolved = (id: string) => resolvedIds.includes(id);
  const isNewlyDiscovered = (id: string) => newlyDiscoveredIds.includes(id);

  // Select appropriate variants
  const variants = shouldReduceMotion ? reducedMotionVariants : panelVariants;
  const listItemVariants = shouldReduceMotion ? reducedMotionVariants : itemVariants;

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      role="status"
      aria-live="polite"
      aria-label="Evidence Contradictions"
      className="rounded-lg border-2 border-red-500 bg-red-50 p-4 shadow-md"
    >
      <h3 className="flex items-center gap-2 text-lg font-bold text-red-800 mb-3">
        <motion.span
          className="text-xl"
          aria-hidden="true"
          animate={!shouldReduceMotion ? { scale: [1, 1.2, 1] } : undefined}
          transition={{ duration: 0.5, repeat: 1 }}
        >
          &#x26A0;
        </motion.span>
        <span>Evidence Contradictions ({discoveredContradictions.length})</span>
      </h3>

      <p className="text-sm text-red-700 mb-4">
        You have discovered conflicting evidence. Consider what this means for your investigation.
      </p>

      <AnimatePresence mode="popLayout">
        <ul className="space-y-3" aria-label="List of contradictions">
          {discoveredContradictions.map((contradiction) => {
            const resolved = isResolved(contradiction.id);
            const isNew = isNewlyDiscovered(contradiction.id);
            const evidence1 = evidenceMap.get(contradiction.evidenceId1);
            const evidence2 = evidenceMap.get(contradiction.evidenceId2);

            return (
              <motion.li
                key={contradiction.id}
                variants={listItemVariants}
                initial="initial"
                animate={isNew && !shouldReduceMotion ? ['animate', 'shake'] : 'animate'}
                exit="exit"
                {...(isNew && !shouldReduceMotion ? shakeVariants : {})}
                className={`
                  p-3 rounded-lg border-2 transition-colors duration-200
                  ${resolved
                    ? 'bg-green-50 border-green-300'
                    : isNew
                    ? 'bg-red-100 border-red-500 shadow-lg'
                    : 'bg-amber-100 border-amber-400'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon - Color-blind safe with distinct icons */}
                  <motion.span
                    className={`
                      flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold
                      ${resolved
                        ? 'bg-green-200 text-green-800'
                        : isNew
                        ? 'bg-red-200 text-red-800'
                        : 'bg-amber-200 text-amber-800'
                      }
                    `}
                    aria-label={resolved ? 'Resolved' : 'Unresolved'}
                    animate={
                      isNew && !shouldReduceMotion
                        ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] }
                        : undefined
                    }
                    transition={{ duration: 0.5 }}
                  >
                    {resolved ? (
                      <span aria-hidden="true">&#x2713;</span>
                    ) : (
                      <span aria-hidden="true">!</span>
                    )}
                  </motion.span>

                  <div className="flex-1 min-w-0">
                    {/* Status Label */}
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`
                          text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded
                          ${resolved
                            ? 'bg-green-100 text-green-700'
                            : isNew
                            ? 'bg-red-200 text-red-800'
                            : 'bg-amber-200 text-amber-800'
                          }
                        `}
                      >
                        {resolved ? 'Resolved' : isNew ? 'New!' : 'Unresolved'}
                      </span>
                    </div>

                    {/* Contradiction Description */}
                    <p
                      className={`
                        text-sm font-medium mb-2
                        ${resolved ? 'text-green-800' : isNew ? 'text-red-900' : 'text-amber-900'}
                      `}
                    >
                      {contradiction.description}
                    </p>

                    {/* Evidence References */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span
                        className={`
                          px-2 py-1 rounded
                          ${resolved
                            ? 'bg-green-100 text-green-700'
                            : isNew
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                          }
                        `}
                      >
                        {evidence1?.title ?? contradiction.evidenceId1}
                      </span>
                      <span
                        className={`
                          font-bold
                          ${resolved ? 'text-green-600' : isNew ? 'text-red-600' : 'text-amber-600'}
                        `}
                        aria-label="conflicts with"
                      >
                        vs
                      </span>
                      <span
                        className={`
                          px-2 py-1 rounded
                          ${resolved
                            ? 'bg-green-100 text-green-700'
                            : isNew
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                          }
                        `}
                      >
                        {evidence2?.title ?? contradiction.evidenceId2}
                      </span>
                    </div>

                    {/* Resolution (if resolved) */}
                    {resolved && contradiction.resolution && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 p-2 bg-green-100 rounded text-sm text-green-800"
                      >
                        <span className="font-semibold">Resolution: </span>
                        {contradiction.resolution}
                      </motion.div>
                    )}

                    {/* Resolve Button (if not resolved and handler provided) */}
                    {!resolved && onResolve && (
                      <motion.button
                        onClick={() => onResolve(contradiction.id)}
                        className={`
                          mt-2 px-3 py-1 text-sm font-medium rounded
                          transition-colors
                          focus:outline-none focus:ring-2 focus:ring-offset-2
                          ${isNew
                            ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                            : 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500'
                          }
                        `}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Mark as Understood
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </AnimatePresence>

      {/* Summary */}
      <div className="mt-4 pt-3 border-t border-red-200 text-sm text-red-700">
        <span className="font-medium">
          {resolvedIds.length} of {discoveredContradictions.length} contradictions resolved
        </span>
      </div>
    </motion.div>
  );
}

export default ContradictionPanel;
