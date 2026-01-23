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

import { generateAsciiBar } from '../styles/terminal-theme';
import { useTheme } from '../context/ThemeContext';

// ============================================
// Types
// ============================================

interface Fallacy {
  name: string;
  description: string;
  example?: string;
}

export interface MentorFeedbackData {
  analysis: string;
  fallacies_detected: Fallacy[];
  score: number;
  quality: string;
  critique: string;
  praise: string;
  hint: string | null;
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
  const { theme } = useTheme();

  // Helper to get score color based on theme
  const getScoreColor = (score: number): string => {
    if (score >= 75) return theme.colors.state.success.text;
    if (score >= 50) return theme.colors.state.warning.text;
    return theme.colors.state.error.text;
  };

  const getQualityLabel = (quality: string): string => {
    const labels: Record<string, string> = {
      excellent: 'EXCELLENT REASONING',
      good: 'GOOD REASONING',
      fair: 'FAIR REASONING',
      poor: 'POOR REASONING',
      failing: 'WEAK REASONING',
    };
    return labels[quality] || quality.toUpperCase();
  };

  // Loading state: show spinner while waiting for LLM feedback
  if (isLoading) {
    return (
      <div
        className={`${theme.colors.bg.primary} border ${theme.colors.border.default} p-6 font-mono`}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="flex items-center gap-4">
          {/* Spinner */}
          <div
            className={`animate-spin h-6 w-6 border-2 ${theme.colors.interactive.border} border-t-transparent rounded-sm`}
            aria-hidden="true"
          />
          <div>
            <p className={`${theme.colors.interactive.text} font-bold uppercase tracking-wider`}>
              {theme.symbols.block} MOODY IS EVALUATING YOUR VERDICT...
            </p>
            <p className={`${theme.colors.text.muted} text-sm mt-1`}>
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
    <div className="space-y-4 font-mono">
      {/* Verdict Result */}
      <div>
        <div className={`text-xs ${theme.colors.text.tertiary} uppercase tracking-wider mb-1`}>
          VERDICT STATUS
        </div>
        <div
          className={`text-sm font-bold uppercase tracking-wider border-l-2 pl-3 py-1 ${correct
            ? `${theme.colors.state.success.text} ${theme.colors.state.success.border}`
            : `${theme.colors.state.error.text} ${theme.colors.state.error.border}`
          }`}
          role="alert"
        >
          {correct ? `${theme.symbols.checkmark} CORRECT` : `${theme.symbols.cross} INCORRECT`}
        </div>
      </div>

      {/* Moody's Response */}
      {feedback.analysis && (
        <div className={`border-l-2 ${theme.colors.border.default} pl-3 py-1`}>
          <h3 className={`text-xs font-bold ${theme.colors.text.primary} mb-2 uppercase tracking-wider`}>
            {theme.symbols.prefix} MOODY'S RESPONSE:
          </h3>
          <p className={`text-sm ${theme.colors.text.secondary} whitespace-pre-wrap leading-relaxed`}>
            {feedback.analysis}
          </p>
        </div>
      )}

      {/* Pre-written wrong suspect response */}
      {!correct && wrongSuspectResponse && (
        <div className={`border-l-2 ${theme.colors.state.error.border} pl-3 py-1`}>
          <h3 className={`text-xs font-bold ${theme.colors.state.error.text} mb-2 uppercase tracking-wider`}>
            {theme.symbols.prefix} CASE NOTES:
          </h3>
          <p className={`text-sm ${theme.colors.text.secondary} whitespace-pre-wrap leading-relaxed`}>
            {wrongSuspectResponse}
          </p>
        </div>
      )}

      {/* Score Meter */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className={`text-xs ${theme.colors.text.tertiary} uppercase tracking-wider`}>
            REASONING QUALITY:
          </span>
          <span className={`text-base font-bold ${getScoreColor(feedback.score)}`}>
            {feedback.score}/100
          </span>
        </div>
        <div
          className={`w-full border ${theme.colors.border.default} p-2 text-center mb-2`}
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
        <div className={`text-xs ${theme.colors.text.muted} uppercase tracking-widest`}>
          {theme.symbols.bullet} {getQualityLabel(feedback.quality)}
        </div>
      </div>

      {/* Attempts Remaining */}
      {!correct && (
        <div className={`text-xs ${theme.colors.text.tertiary}`}>
          {theme.symbols.bullet} Attempts remaining:{' '}
          <span
            className={
              attemptsRemaining <= 3
                ? `${theme.colors.state.error.text} font-bold`
                : theme.colors.state.success.text
            }
          >
            {attemptsRemaining}/10
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Confrontation/Proceed Button */}
        {onConfront && (
          <button
            onClick={onConfront}
            className={`w-full py-3 px-4 bg-blue-600 border border-blue-700 text-white font-mono uppercase tracking-widest text-sm
                       hover:bg-blue-700 transition-all duration-200 group flex items-center justify-center`}
          >
            <span>{confrontLabel.toUpperCase()}</span>
            <span className="ml-2 group-hover:translate-x-2 transition-transform duration-200">{theme.symbols.arrowRight}</span>
          </button>
        )}

        {/* Retry Button */}
        {!correct && attemptsRemaining > 0 && onRetry && (
          <button
            onClick={onRetry}
            className={`w-full py-2.5 px-4 border ${theme.colors.border.default}
                       ${theme.colors.text.secondary} font-bold uppercase tracking-widest text-sm
                       ${theme.colors.interactive.borderHover} ${theme.colors.interactive.hover}
                       transition-colors`}
          >
            {theme.symbols.doubleArrowRight} TRY AGAIN
          </button>
        )}
      </div>

      {/* Out of Attempts Message */}
      {!correct && attemptsRemaining === 0 && (
        <div className={`border-l-2 ${theme.colors.state.error.border} pl-3 py-2`}>
          <p className={`${theme.colors.state.error.text} font-bold uppercase tracking-wider text-xs`}>
            {theme.symbols.warning} MAX ATTEMPTS REACHED
          </p>
          <p className={`${theme.colors.text.tertiary} text-xs mt-1`}>
            The correct answer will be revealed.
          </p>
        </div>
      )}
    </div>
  );
}
