/**
 * HypothesisFormation Phase Component
 *
 * Phase where players select hypotheses to track and assign initial probability estimates.
 *
 * Enhanced in Milestone 6 with:
 * - PhaseTransition wrapper for smooth entrance
 * - Staggered card animations
 * - Tier badges for Tier 2 hypotheses
 * - Improved visual hierarchy
 *
 * @module components/phases/HypothesisFormation
 * @since Milestone 1
 * @updated Milestone 6 - Added animations and enhanced UX
 */

import { motion, useReducedMotion } from 'framer-motion';
import { CaseData } from '../../types/game';
import type { ConditionalHypothesis } from '../../types/enhanced';
import { useGame } from '../../hooks/useGame';
import { probabilitiesAreValid } from '../../utils/scoring';
import { isHypothesisUnlocked } from '../../utils/unlocking';
import { PhaseTransition } from '../ui/PhaseTransition';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProbabilitySlider } from '../ui/ProbabilitySlider';

interface Props {
  caseData: CaseData;
}

/**
 * Lock icon SVG for locked Tier 2 hypotheses
 */
function LockIcon(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

/**
 * Container animation variants for staggered children
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

/**
 * Card animation variants
 */
const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 25,
    },
  },
};

/**
 * Reduced motion variants
 */
const reducedMotionContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.01 } },
};

const reducedMotionCardVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.01 } },
};

export function HypothesisFormation({ caseData }: Props) {
  const { state, dispatch } = useGame();
  const shouldReduceMotion = useReducedMotion();

  // Cast hypotheses to ConditionalHypothesis for tier checking
  // This is safe because ConditionalHypothesis extends HypothesisData
  const hypotheses = caseData.hypotheses as unknown as ConditionalHypothesis[];
  const initialIp = caseData.briefing.investigationPoints;

  const selectedCount = state.selectedHypotheses.length;
  const canProceed =
    selectedCount >= 3 && probabilitiesAreValid(state.initialProbabilities);

  // Toggle hypothesis selection
  const toggleHypothesis = (id: string) => {
    if (state.selectedHypotheses.includes(id)) {
      dispatch({ type: 'DESELECT_HYPOTHESIS', hypothesisId: id });
    } else {
      dispatch({ type: 'SELECT_HYPOTHESIS', hypothesisId: id });
    }
  };

  // Update probability
  const setProbability = (id: string, value: number) => {
    dispatch({ type: 'SET_INITIAL_PROBABILITY', hypothesisId: id, value });
  };

  // Calculate sum for display
  const probabilitySum = Object.values(state.initialProbabilities).reduce(
    (a, b) => a + b,
    0
  );

  // Select appropriate animation variants
  const container = shouldReduceMotion
    ? reducedMotionContainerVariants
    : containerVariants;
  const card = shouldReduceMotion ? reducedMotionCardVariants : cardVariants;

  return (
    <PhaseTransition variant="fade">
      <div className="space-y-6">
        <Card>
          <h2 className="text-2xl font-serif font-bold text-amber-900 mb-4">
            Hypothesis Formation
          </h2>
          <p className="text-amber-800 mb-4">
            Before investigating, consider all the possibilities. Select{' '}
            <strong>at least 3 hypotheses</strong> you want to track, then assign
            probability estimates that sum to 100%.
          </p>
          <div className="bg-amber-100 p-3 rounded border border-amber-300">
            <p className="text-amber-700 text-sm">
              <strong>Tip:</strong> Always leave some probability for "something
              else" - the true answer might not be on your list. This is called
              epistemic humility.
            </p>
          </div>
        </Card>

        {/* Hypothesis Selection with staggered animations */}
        <motion.div
          className="space-y-3"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          {hypotheses.map((hypothesis) => {
            const isSelected = state.selectedHypotheses.includes(hypothesis.id);
            const probability = state.initialProbabilities[hypothesis.id] || 0;

            // Check if hypothesis is unlocked (Tier 1 always unlocked, Tier 2 conditional)
            const isUnlocked = isHypothesisUnlocked(hypothesis, state, initialIp);
            const isTier2 = hypothesis.tier === 2;
            const isLocked = isTier2 && !isUnlocked;

            // Locked Tier 2 hypothesis - show gray card with lock icon
            if (isLocked) {
              return (
                <motion.div key={hypothesis.id} variants={card}>
                  <Card
                    variant="default"
                    className="opacity-60 cursor-not-allowed bg-gray-50"
                  >
                    <div className="flex items-start gap-4" aria-disabled="true">
                      {/* Lock icon */}
                      <div className="w-6 h-6 flex items-center justify-center mt-1 flex-shrink-0">
                        <LockIcon />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-500 text-lg">
                            {hypothesis.label}
                          </h3>
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-500 text-xs rounded-full">
                            Tier 2 - Locked
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mt-1 italic">
                          Continue investigating to reveal this hypothesis...
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            }

            // Unlocked hypothesis (Tier 1 or unlocked Tier 2)
            return (
              <motion.div key={hypothesis.id} variants={card}>
                <Card
                  variant={isSelected ? 'selected' : 'default'}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected ? '' : 'hover:border-amber-400'
                  }`}
                  onClick={() => toggleHypothesis(hypothesis.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox indicator with animation */}
                    <motion.div
                      className={`
                        w-6 h-6 rounded border-2 flex items-center justify-center mt-1 flex-shrink-0
                        transition-colors duration-200
                        ${
                          isSelected
                            ? 'bg-amber-600 border-amber-600 text-white'
                            : 'border-amber-400 bg-white'
                        }
                      `}
                      whileTap={{ scale: 0.9 }}
                    >
                      {isSelected && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500 }}
                        >
                          &#x2713;
                        </motion.span>
                      )}
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-amber-900 text-lg">
                          {hypothesis.label}
                        </h3>
                        {/* Tier badge */}
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${
                            hypothesis.tier === 1
                              ? 'bg-amber-100 text-amber-700 border border-amber-300'
                              : 'bg-green-100 text-green-700 border border-green-300'
                          }`}
                        >
                          {hypothesis.tier === 1
                            ? 'Tier 1'
                            : 'Tier 2 - Unlocked'}
                        </span>
                      </div>
                      <p className="text-amber-700 text-sm mt-1">
                        {hypothesis.description}
                      </p>

                      {/* Probability slider (only if selected) */}
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 p-3 bg-amber-50 rounded border border-amber-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <label className="block text-sm font-medium text-amber-800 mb-2">
                            Initial Probability Estimate
                          </label>
                          <ProbabilitySlider
                            value={probability}
                            onChange={(v) => setProbability(hypothesis.id, v)}
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Probability Sum Indicator */}
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant={probabilitySum === 100 ? 'success' : 'warning'}>
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium text-amber-900">
                    Total Probability:
                  </span>
                  {probabilitySum !== 100 && (
                    <span className="text-amber-700 text-sm ml-2">
                      (must equal 100%)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <motion.span
                    className={`text-3xl font-bold ${
                      probabilitySum === 100 ? 'text-green-600' : 'text-amber-600'
                    }`}
                    key={probabilitySum}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                  >
                    {probabilitySum}%
                  </motion.span>
                  {probabilitySum === 100 && (
                    <motion.span
                      className="text-green-600 text-xl"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      &#x2713;
                    </motion.span>
                  )}
                </div>
              </div>
              {probabilitySum !== 100 && (
                <div className="mt-2 h-2 bg-amber-200 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full transition-all duration-300 ${
                      probabilitySum > 100 ? 'bg-red-500' : 'bg-amber-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(probabilitySum, 100)}%`,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Proceed Button */}
        <div className="flex justify-between items-center pt-4 border-t border-amber-200">
          <span className="text-amber-700">
            {selectedCount < 3
              ? `Select at least ${3 - selectedCount} more hypothesis${
                  3 - selectedCount === 1 ? '' : 'es'
                }`
              : probabilitySum !== 100
              ? `Adjust probabilities to sum to 100% (currently ${probabilitySum}%)`
              : '&#x2713; Ready to begin investigation'}
          </span>
          <Button
            onClick={() => dispatch({ type: 'ADVANCE_PHASE' })}
            disabled={!canProceed}
            size="lg"
          >
            Begin Investigation &#x2192;
          </Button>
        </div>
      </div>
    </PhaseTransition>
  );
}
