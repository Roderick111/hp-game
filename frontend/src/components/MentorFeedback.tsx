/**
 * MentorFeedback Component
 *
 * Displays Moody's mentor feedback after verdict submission:
 * - Verdict result (correct/incorrect)
 * - Moody's Response (natural LLM prose via analysis field)
 * - Score meter with color coding
 * - Retry functionality
 *
 * @module components/MentorFeedback
 * @since Phase 3
 */

import { TERMINAL_THEME, generateAsciiBar } from '../styles/terminal-theme';

// ============================================
// Types
// ============================================

interface Fallacy {
  name: string;
  description: string;
  example: string;
}

export interface MentorFeedbackData {
  analysis: string;
  fallacies_detected: Fallacy[];
  score: number;
  quality: string;
  critique: string;
  praise: string;
  hint?: string;
}

export interface MentorFeedbackProps {
  /** Mentor feedback data */
  feedback?: MentorFeedbackData;
  /** Whether the verdict was correct */
  correct: boolean;
  /** Number of attempts remaining */
  attemptsRemaining: number;
  /** Pre-written response for wrong suspect (optional) */
  wrongSuspectResponse?: string | null;
  /** Callback for retry button */
  onRetry?: () => void;
  /** Whether feedback is loading (LLM call in progress) */
  isLoading?: boolean;
  /** Callback for proceeding to confrontation (e.g., "Arrest the Culprit") */
  onConfront?: () => void;
  /** Label for the confrontation button */
  confrontLabel?: string;
}

// ============================================
// Helper Functions
// ============================================

function getScoreColor(score: number): string {
  if (score >= 75) return TERMINAL_THEME.colors.state.success.text;
  if (score >= 50) return TERMINAL_THEME.colors.state.warning.text;
  return TERMINAL_THEME.colors.state.error.text;
}

function getQualityLabel(quality: string): string {
  const labels: Record<string, string> = {
    excellent: 'EXCELLENT REASONING',
    good: 'GOOD REASONING',
    fair: 'FAIR REASONING',
    poor: 'POOR REASONING',
    failing: 'WEAK REASONING',
  };
  return labels[quality] || quality.toUpperCase();
}

// ============================================
// Component
// ============================================

export function MentorFeedback({
  feedback,
  correct,
  attemptsRemaining,
  wrongSuspectResponse,
  onRetry,
  isLoading = false,
  onConfront,
  confrontLabel = 'Proceed',
}: MentorFeedbackProps) {
  // Loading state: show spinner while waiting for LLM feedback
  if (isLoading) {
    return (
      <div
        className={`${TERMINAL_THEME.colors.bg.primary} border ${TERMINAL_THEME.colors.border.default} p-6 font-mono`}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="flex items-center gap-4">
          {/* Spinner */}
          <div
            className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-sm"
            aria-hidden="true"
          />
          <div>
            <p className={`${TERMINAL_THEME.colors.interactive.text} font-bold uppercase tracking-wider`}>
              {TERMINAL_THEME.symbols.block} MOODY IS EVALUATING YOUR VERDICT...
            </p>
            <p className={`${TERMINAL_THEME.colors.text.muted} text-sm mt-1`}>
              Analyzing reasoning quality
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No feedback yet and not loading
  if (!feedback) {
    return null;
  }

  return (
    <div className={`${TERMINAL_THEME.colors.bg.primary} border ${TERMINAL_THEME.colors.border.default} p-6 space-y-4 font-mono`}>
      {/* Verdict Result Banner */}
      <div
        className={`text-lg font-bold p-3 border uppercase tracking-wider ${correct
          ? `${TERMINAL_THEME.colors.state.success.text} ${TERMINAL_THEME.colors.state.success.bg} ${TERMINAL_THEME.colors.state.success.border}`
          : `${TERMINAL_THEME.colors.state.error.text} ${TERMINAL_THEME.colors.state.error.bg} ${TERMINAL_THEME.colors.state.error.border}`
          }`}
        role="alert"
      >
        {correct ? `${TERMINAL_THEME.symbols.checkmark} CORRECT VERDICT` : `${TERMINAL_THEME.symbols.cross} INCORRECT`}
      </div>

      {/* Attempts Remaining (only show if incorrect) */}
      {!correct && (
        <div className={`text-sm ${TERMINAL_THEME.colors.text.tertiary}`}>
          {TERMINAL_THEME.symbols.bullet} Attempts remaining:{' '}
          <span
            className={
              attemptsRemaining <= 3
                ? `${TERMINAL_THEME.colors.state.error.text} font-bold`
                : TERMINAL_THEME.colors.state.success.text
            }
          >
            {attemptsRemaining}/10
          </span>
        </div>
      )}

      {/* Moody's Response (LLM-generated natural feedback) */}
      {feedback.analysis && (
        <div className={`${TERMINAL_THEME.colors.bg.hover} border border-amber-900/50 p-4`}>
          <h3 className={`text-sm font-bold ${TERMINAL_THEME.colors.interactive.text} mb-2 uppercase tracking-wider`}>
            {TERMINAL_THEME.symbols.prefix} MOODY'S RESPONSE:
          </h3>
          <p className={`text-sm ${TERMINAL_THEME.colors.text.secondary} whitespace-pre-wrap leading-relaxed`}>
            {feedback.analysis}
          </p>
        </div>
      )}

      {/* Pre-written wrong suspect response (case-specific feedback) */}
      {!correct && wrongSuspectResponse && (
        <div className={`${TERMINAL_THEME.colors.bg.hover} border ${TERMINAL_THEME.colors.state.error.border} p-4`}>
          <h3 className={`text-sm font-bold ${TERMINAL_THEME.colors.state.error.text} mb-2 uppercase tracking-wider`}>
            {TERMINAL_THEME.symbols.prefix} CASE NOTES:
          </h3>
          <p className={`text-sm ${TERMINAL_THEME.colors.text.secondary} whitespace-pre-wrap leading-relaxed italic`}>
            {wrongSuspectResponse}
          </p>
        </div>
      )}

      {/* Score Meter - Terminal ASCII style */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className={`text-sm ${TERMINAL_THEME.colors.text.tertiary} uppercase tracking-wider`}>
            Reasoning Quality:
          </span>
          <span className={`text-lg font-bold ${getScoreColor(feedback.score)}`}>
            {feedback.score}/100
          </span>
        </div>
        <div
          className={`w-full ${TERMINAL_THEME.colors.bg.hover} border ${TERMINAL_THEME.colors.border.default} p-2 text-center`}
          role="progressbar"
          aria-valuenow={feedback.score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Reasoning score: ${feedback.score} out of 100`}
        >
          <span className={`font-mono text-sm tracking-widest ${getScoreColor(feedback.score)}`}>
            {generateAsciiBar(feedback.score, 20)}
          </span>
        </div>
        <div className={`text-xs ${TERMINAL_THEME.colors.text.muted} uppercase tracking-widest`}>
          {TERMINAL_THEME.symbols.bullet} {getQualityLabel(feedback.quality)}
        </div>
      </div>

      {/* Retry Button (only show if incorrect and has attempts) */}
      {!correct && attemptsRemaining > 0 && onRetry && (
        <button
          onClick={onRetry}
          className={`w-full mt-4 py-2.5 px-4 border ${TERMINAL_THEME.colors.border.default} ${TERMINAL_THEME.colors.bg.primary}
                     ${TERMINAL_THEME.colors.text.secondary} font-bold uppercase tracking-widest text-sm
                     hover:border-amber-500/50 hover:text-amber-400 hover:bg-gray-800
                     transition-colors rounded-sm`}
        >
          {TERMINAL_THEME.symbols.doubleArrowRight} TRY AGAIN
        </button>
      )}

      {/* Confrontation/Proceed Button (e.g. Arrest) */}
      {onConfront && (
        <button
          onClick={onConfront}
          className={`w-full mt-4 py-3 px-4 border ${TERMINAL_THEME.colors.state.success.border} ${TERMINAL_THEME.colors.state.success.bg}
                     ${TERMINAL_THEME.colors.state.success.text} font-bold uppercase tracking-widest text-sm
                     hover:bg-green-800 transition-colors rounded-sm flex items-center justify-center gap-2`}
        >
          <span>{confrontLabel.toUpperCase()}</span>
          <span>{TERMINAL_THEME.symbols.arrowRight}</span>
        </button>
      )}

      {/* Out of Attempts Message */}
      {!correct && attemptsRemaining === 0 && (
        <div className={`mt-4 p-3 ${TERMINAL_THEME.colors.state.error.bg} border ${TERMINAL_THEME.colors.state.error.border} text-center`}>
          <p className={`${TERMINAL_THEME.colors.state.error.text} font-bold uppercase tracking-wider`}>
            {TERMINAL_THEME.symbols.warning} MAX ATTEMPTS REACHED
          </p>
          <p className={`${TERMINAL_THEME.colors.text.tertiary} text-sm mt-1`}>
            The correct answer will be revealed.
          </p>
        </div>
      )}
    </div>
  );
}
