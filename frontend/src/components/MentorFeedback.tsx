/**
 * MentorFeedback Component
 *
 * Displays Moody's mentor feedback after verdict submission:
 * - Verdict result (correct/incorrect)
 * - Score meter with color coding
 * - Fallacy explanations
 * - Praise and critique sections
 * - Adaptive hints
 *
 * @module components/MentorFeedback
 * @since Phase 3
 */

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
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'failing' | string;
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
}

// ============================================
// Helper Functions
// ============================================

function getScoreColor(score: number): string {
  if (score >= 75) return 'text-green-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

function getScoreBarColor(score: number): string {
  if (score >= 75) return 'bg-green-500';
  if (score >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getQualityLabel(quality: string): string {
  const labels: Record<string, string> = {
    excellent: 'Excellent Reasoning',
    good: 'Good Reasoning',
    fair: 'Fair Reasoning',
    poor: 'Poor Reasoning',
    failing: 'Weak Reasoning',
  };
  return labels[quality] || quality;
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
}: MentorFeedbackProps) {
  // Loading state: show spinner while waiting for LLM feedback
  if (isLoading) {
    return (
      <div
        className="bg-gray-900 border border-gray-700 rounded-lg p-6 font-mono"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="flex items-center gap-4">
          {/* Spinner */}
          <div
            className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full"
            aria-hidden="true"
          />
          <div>
            <p className="text-amber-400 font-bold">Moody is evaluating your verdict...</p>
            <p className="text-gray-500 text-sm mt-1">Analyzing reasoning quality</p>
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
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-4 font-mono">
      {/* Header */}
      <h2 className="text-xl font-bold text-amber-400 tracking-wide">
        [Moody's Feedback]
      </h2>

      {/* Verdict Result Banner */}
      <div
        className={`text-lg font-bold p-3 rounded border ${
          correct
            ? 'text-green-400 bg-green-900/20 border-green-700'
            : 'text-red-400 bg-red-900/20 border-red-700'
        }`}
        role="alert"
      >
        {correct ? '* CORRECT VERDICT' : '* INCORRECT'}
      </div>

      {/* Attempts Remaining (only show if incorrect) */}
      {!correct && (
        <div className="text-sm text-gray-400">
          Attempts remaining:{' '}
          <span
            className={
              attemptsRemaining <= 3
                ? 'text-red-400 font-bold'
                : 'text-green-400'
            }
          >
            {attemptsRemaining}/10
          </span>
        </div>
      )}

      {/* Wrong Suspect Response (Moody's pre-written response) */}
      {wrongSuspectResponse && (
        <div className="bg-gray-800 border border-amber-900 rounded p-4">
          <h3 className="text-sm font-bold text-amber-400 mb-2">
            Moody's Response:
          </h3>
          <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
            {wrongSuspectResponse}
          </p>
        </div>
      )}

      {/* Score Meter */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Reasoning Quality:</span>
          <span className={`text-lg font-bold ${getScoreColor(feedback.score)}`}>
            {feedback.score}/100
          </span>
        </div>
        <div
          className="w-full bg-gray-800 rounded-full h-3 overflow-hidden"
          role="progressbar"
          aria-valuenow={feedback.score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Reasoning score: ${feedback.score} out of 100`}
        >
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getScoreBarColor(feedback.score)}`}
            style={{ width: `${feedback.score}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 italic">
          {getQualityLabel(feedback.quality)}
        </div>
      </div>

      {/* Analysis */}
      {feedback.analysis && (
        <div>
          <h3 className="text-sm font-bold text-gray-400 mb-2">Analysis:</h3>
          <p className="text-sm text-gray-300 leading-relaxed">
            {feedback.analysis}
          </p>
        </div>
      )}

      {/* Praise Section */}
      {feedback.praise && (
        <div className="bg-gray-800 border border-green-900 rounded p-3">
          <h3 className="text-sm font-bold text-green-400 mb-1">
            What You Did Well:
          </h3>
          <p className="text-sm text-gray-300">{feedback.praise}</p>
        </div>
      )}

      {/* Critique Section */}
      {feedback.critique && (
        <div className="bg-gray-800 border border-red-900 rounded p-3">
          <h3 className="text-sm font-bold text-red-400 mb-1">
            Areas to Improve:
          </h3>
          <p className="text-sm text-gray-300">{feedback.critique}</p>
        </div>
      )}

      {/* Fallacies Detected */}
      {feedback.fallacies_detected.length > 0 && (
        <div className="bg-gray-800 border border-yellow-900 rounded p-3">
          <h3 className="text-sm font-bold text-yellow-400 mb-2">
            Logical Fallacies Detected:
          </h3>
          <ul className="space-y-3">
            {feedback.fallacies_detected.map((fallacy, idx) => (
              <li key={idx} className="text-sm">
                <span className="font-bold text-yellow-300">{fallacy.name}:</span>
                <p className="text-gray-300 mt-1">{fallacy.description}</p>
                {fallacy.example && (
                  <p className="text-gray-500 italic mt-1 pl-2 border-l-2 border-yellow-700">
                    "{fallacy.example}"
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Adaptive Hint */}
      {feedback.hint && (
        <div className="bg-gray-800 border border-blue-900 rounded p-3">
          <h3 className="text-sm font-bold text-blue-400 mb-1">Hint:</h3>
          <p className="text-sm text-gray-300">{feedback.hint}</p>
        </div>
      )}

      {/* Retry Button (only show if incorrect and has attempts) */}
      {!correct && attemptsRemaining > 0 && onRetry && (
        <button
          onClick={onRetry}
          className="w-full mt-4 bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 rounded
                     transition-colors border border-blue-600"
        >
          Try Again
        </button>
      )}

      {/* Out of Attempts Message */}
      {!correct && attemptsRemaining === 0 && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded text-center">
          <p className="text-red-400 font-bold">Max attempts reached.</p>
          <p className="text-gray-400 text-sm mt-1">
            The correct answer will be revealed.
          </p>
        </div>
      )}
    </div>
  );
}
