/**
 * CaseReview Phase Component
 *
 * Phase where players review their investigation performance with
 * educational metrics and bias lessons.
 *
 * Enhanced in Milestone 6 with:
 * - PhaseTransition wrapper for smooth entrance
 * - MetricCard components with educational tooltips
 * - Staggered metric card animations
 * - Improved visual hierarchy
 *
 * @module components/phases/CaseReview
 * @since Milestone 1
 * @updated Milestone 6 - Added animations and MetricCard tooltips
 */

import { motion, useReducedMotion } from 'framer-motion';
import { CaseData } from '../../types/game';
import { useGame } from '../../hooks/useGame';
import { getConfirmationBiasInterpretation } from '../../utils/scoring';
import { PhaseTransition } from '../ui/PhaseTransition';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { MetricCard, PerformanceLevel } from '../ui/MetricCard';

interface Props {
  caseData: CaseData;
}

/**
 * Container animation variants for staggered children
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
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

/**
 * Convert metric interpretation to PerformanceLevel
 */
function getPerformanceLevel(value: number): PerformanceLevel {
  if (value >= 80) return 'excellent';
  if (value >= 60) return 'good';
  if (value >= 40) return 'fair';
  return 'poor';
}

/**
 * Educational notes for each metric type
 */
const educationalNotes = {
  efficiency:
    'Investigation Efficiency measures how well you used your limited investigation points. ' +
    'Skilled investigators gather diverse evidence from multiple sources rather than focusing ' +
    'on a single lead. High efficiency means you explored various angles before drawing conclusions.',
  prematureClosure:
    'Premature Closure is the tendency to stop investigating too early, once you find evidence ' +
    'that seems to confirm your initial theory. Good investigators keep exploring even when ' +
    'they think they have the answer, to avoid missing critical contradictory evidence.',
  contradiction:
    'Contradiction Handling measures your ability to identify and resolve conflicting evidence. ' +
    'Real investigations often contain evidence that seems to point in different directions. ' +
    'Skilled investigators recognize these contradictions and use them to refine their theories.',
  tierDiscovery:
    'Hypothesis Discovery tracks how many hidden theories you uncovered through investigation. ' +
    'Some hypotheses are only revealed when you find specific evidence. Thorough investigators ' +
    'discover these alternatives, expanding the range of possibilities they consider.',
  confirmationBias:
    'Confirmation Bias is the tendency to seek evidence that supports your existing beliefs ' +
    'while ignoring evidence that contradicts them. It is one of the most common cognitive biases ' +
    'in investigations, leading to tunnel vision on the "obvious suspect."',
};

export function CaseReview({ caseData }: Props) {
  const { state, dispatch } = useGame();
  const shouldReduceMotion = useReducedMotion();
  const { biasLessons } = caseData;
  const scores = state.scores;

  // Select appropriate animation variants
  const container = shouldReduceMotion ? reducedMotionContainerVariants : containerVariants;
  const card = shouldReduceMotion ? reducedMotionCardVariants : cardVariants;

  if (!scores) {
    return (
      <Card>
        <p className="text-amber-800">Loading review data...</p>
      </Card>
    );
  }

  const biasInterpretation = getConfirmationBiasInterpretation(scores.confirmationBiasScore);

  // Calculate metric values
  const efficiency = scores.investigationEfficiency ?? 0;
  const premature = scores.prematureClosureScore ?? 0;
  const contradiction = scores.contradictionScore ?? 0;
  const tier = scores.tierDiscoveryScore ?? 0;

  return (
    <PhaseTransition variant="slide-up">
      <motion.div
        className="space-y-6"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={card}>
          <Card variant="official">
            <div className="text-center">
              <h1 className="text-3xl font-serif font-bold text-amber-900">Case Review</h1>
              <p className="text-amber-700 mt-2">Learning from your investigation</p>
            </div>
          </Card>
        </motion.div>

        {/* Investigation Pattern Analysis */}
        <motion.div variants={card}>
          <Card>
            <h2 className="text-2xl font-serif font-bold text-amber-900 mb-4 border-b-2 border-amber-300 pb-2">
              Your Investigation Pattern
            </h2>

            <div className="space-y-4">
              <p className="text-amber-800">Investigation Points spent by hypothesis relevance:</p>

              {/* Visualization */}
              <div className="space-y-3">
                {scores.investigationBreakdown.map((item, index) => (
                  <motion.div
                    key={item.hypothesisId}
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-amber-900 font-medium">{item.hypothesisLabel}</span>
                      <span className="text-amber-700">{item.percentage}%</span>
                    </div>
                    <div className="h-4 bg-amber-100 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          item.hypothesisId === scores.investigationBreakdown[0]?.hypothesisId
                            ? 'bg-amber-600'
                            : 'bg-amber-400'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Confirmation Bias Assessment */}
              <motion.div
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={`p-4 rounded-lg mt-6 ${
                  biasInterpretation.level === 'low'
                    ? 'bg-green-50 border border-green-200'
                    : biasInterpretation.level === 'medium'
                    ? 'bg-amber-50 border border-amber-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {biasInterpretation.level === 'low' ? '\u2713' : '\u26A0'}
                  </span>
                  <div>
                    <p
                      className={`font-bold mb-1 ${
                        biasInterpretation.level === 'low'
                          ? 'text-green-800'
                          : biasInterpretation.level === 'medium'
                          ? 'text-amber-800'
                          : 'text-red-800'
                      }`}
                    >
                      {biasInterpretation.level === 'low'
                        ? 'WELL-DIVERSIFIED INVESTIGATION'
                        : biasInterpretation.level === 'medium'
                        ? 'MODERATE FOCUS DETECTED'
                        : 'CONFIRMATION BIAS DETECTED'}
                    </p>
                    <p className="text-sm">{biasInterpretation.message}</p>
                  </div>
                </div>
              </motion.div>

              {/* Critical Evidence Check */}
              <motion.div
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className={`p-4 rounded-lg ${
                  scores.foundCriticalEvidence
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {scores.foundCriticalEvidence ? '\u2713' : '\u2717'}
                  </span>
                  <div>
                    <p
                      className={`font-bold mb-1 ${
                        scores.foundCriticalEvidence ? 'text-green-800' : 'text-red-800'
                      }`}
                    >
                      {scores.foundCriticalEvidence
                        ? 'FOUND ALL CRITICAL EVIDENCE'
                        : 'MISSED CRITICAL EVIDENCE'}
                    </p>
                    {!scores.foundCriticalEvidence && scores.missedCriticalEvidence.length > 0 && (
                      <p className="text-sm text-red-700">
                        You missed: {scores.missedCriticalEvidence.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </Card>
        </motion.div>

        {/* Investigation Quality Metrics (Milestone 6 - MetricCard with tooltips) */}
        <motion.div variants={card}>
          <Card>
            <h2 className="text-2xl font-serif font-bold text-amber-900 mb-4 border-b-2 border-amber-300 pb-2">
              Investigation Quality Metrics
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Investigation Efficiency */}
              <MetricCard
                name="Investigation Efficiency"
                value={`${Math.round(efficiency)}%`}
                explanation="How well did you use your limited investigation points?"
                educationalNote={educationalNotes.efficiency}
                performanceLevel={getPerformanceLevel(efficiency)}
                progressValue={efficiency}
              />

              {/* Premature Closure Risk - Lower is better */}
              <MetricCard
                name="Premature Closure Risk"
                value={`${Math.round(premature)}%`}
                explanation="Did you stop investigating too early?"
                educationalNote={educationalNotes.prematureClosure}
                performanceLevel={getPerformanceLevel(100 - premature)}
                progressValue={premature}
              />

              {/* Contradiction Handling */}
              <MetricCard
                name="Contradiction Handling"
                value={`${Math.round(contradiction)}%`}
                explanation="How well did you address conflicting evidence?"
                educationalNote={educationalNotes.contradiction}
                performanceLevel={getPerformanceLevel(contradiction)}
                progressValue={contradiction}
              />

              {/* Hypothesis Discovery */}
              <MetricCard
                name="Hypothesis Discovery"
                value={`${Math.round(tier)}%`}
                explanation="How many hidden theories did you uncover?"
                educationalNote={educationalNotes.tierDiscovery}
                performanceLevel={getPerformanceLevel(tier)}
                progressValue={tier}
              />
            </div>
          </Card>
        </motion.div>

        {/* Bias Lessons */}
        <motion.div variants={card}>
          <Card>
            <h2 className="text-2xl font-serif font-bold text-amber-900 mb-4 border-b-2 border-amber-300 pb-2">
              Biases in This Case
            </h2>

            <div className="space-y-6">
              {biasLessons.map((lesson, index) => (
                <motion.div
                  key={index}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className="border-b border-amber-200 pb-6 last:border-0 last:pb-0"
                >
                  <h3 className="text-lg font-bold text-amber-900 mb-2">
                    {index + 1}. {lesson.biasName}
                  </h3>
                  <p className="text-amber-800 mb-3">{lesson.explanation}</p>
                  <div className="bg-amber-50 p-3 rounded mb-3">
                    <p className="text-amber-700 text-sm">
                      <strong>In this case:</strong> {lesson.howItApplied}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Counter-Technique */}
        <motion.div variants={card}>
          <Card variant="selected">
            <h2 className="text-xl font-serif font-bold text-amber-900 mb-4">
              The Counter-Technique: &quot;What Would Distinguish?&quot;
            </h2>
            <p className="text-amber-800 leading-relaxed">
              Before investigating any single lead, ask:{' '}
              <strong>
                &quot;What evidence would tell me whether Hypothesis A or Hypothesis B is
                true?&quot;
              </strong>
            </p>
            <p className="text-amber-800 leading-relaxed mt-3">
              In this case, that question leads directly to mechanism. If someone in the room cast
              the curse, there&apos;d be wand residue. If the curse was on an object, the object
              would show magical traces. This discriminating evidence was available for just 2 IP
              (examine the violin)&mdash;but only if you thought to look.
            </p>
          </Card>
        </motion.div>

        {/* Real-World Application */}
        <motion.div variants={card}>
          <Card>
            <h2 className="text-2xl font-serif font-bold text-amber-900 mb-4 border-b-2 border-amber-300 pb-2">
              Real-World Application
            </h2>

            <p className="text-amber-800 mb-4">
              The &quot;obvious suspect&quot; trap applies everywhere:
            </p>

            <div className="space-y-4">
              {biasLessons.map((lesson, index) => (
                <motion.div
                  key={index}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-amber-50 p-4 rounded"
                >
                  <h4 className="font-bold text-amber-900 mb-2">{lesson.biasName}</h4>
                  <p className="text-amber-700 text-sm">{lesson.realWorldExample}</p>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Practice Prompt */}
        <motion.div variants={card}>
          <Card variant="speech">
            <div className="flex items-start gap-4">
              <span className="text-3xl" aria-hidden="true">
                &#x1F3AF;
              </span>
              <div>
                <h3 className="font-bold text-amber-900 mb-2">Your Practice Prompt</h3>
                <p className="text-amber-800">
                  Think of a recent situation where you were confident about someone&apos;s motives
                  or the cause of a problem.
                </p>
                <p className="text-amber-800 mt-2">
                  Ask yourself:{' '}
                  <em>
                    &quot;What&apos;s an alternative explanation I haven&apos;t seriously
                    considered? What evidence would distinguish between my current theory and this
                    alternative?&quot;
                  </em>
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Play Again */}
        <motion.div variants={card} className="flex justify-center pt-6">
          <Button onClick={() => dispatch({ type: 'RESET_GAME' })} size="lg" variant="primary">
            Play Again
          </Button>
        </motion.div>

        {/* Final Message */}
        <motion.div variants={card}>
          <Card variant="official">
            <div className="text-center py-4">
              <p className="text-amber-800 font-serif text-lg">
                &quot;The best Aurors I know? They look for evidence that would prove them
                wrong.&quot;
              </p>
              <p className="text-amber-700 mt-2">&mdash; Senior Auror G. Moody</p>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </PhaseTransition>
  );
}
