/**
 * VerdictSubmission Component
 *
 * Verdict submission form with:
 * - Suspect dropdown selector
 * - Reasoning textarea (minimum 50 characters)
 * - Evidence checklist
 * - Submit button with loading state
 *
 * @module components/VerdictSubmission
 * @since Phase 3
 */

import { useState, useCallback } from 'react';
import { Button } from './ui/Button';

// ============================================
// Types
// ============================================

interface Suspect {
  id: string;
  name: string;
}

interface Evidence {
  id: string;
  name: string;
}

export interface VerdictSubmissionProps {
  /** Available suspects to accuse */
  suspects: Suspect[];
  /** Evidence player has discovered */
  discoveredEvidence: Evidence[];
  /** Callback when verdict is submitted */
  onSubmit: (accusedId: string, reasoning: string, evidenceCited: string[]) => Promise<void>;
  /** Loading state during submission */
  loading: boolean;
  /** Disabled state (out of attempts or case solved) */
  disabled: boolean;
  /** Current attempts remaining */
  attemptsRemaining?: number;
}

// ============================================
// Constants
// ============================================

const MIN_REASONING_LENGTH = 50;

// ============================================
// Component
// ============================================

export function VerdictSubmission({
  suspects,
  discoveredEvidence,
  onSubmit,
  loading,
  disabled,
  attemptsRemaining,
}: VerdictSubmissionProps) {
  const [accusedSuspect, setAccusedSuspect] = useState<string>('');
  const [reasoning, setReasoning] = useState<string>('');
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Handle evidence checkbox toggle
  const handleEvidenceToggle = useCallback((evidenceId: string) => {
    setSelectedEvidence((prev) => {
      if (prev.includes(evidenceId)) {
        return prev.filter((id) => id !== evidenceId);
      }
      return [...prev, evidenceId];
    });
  }, []);

  // Validate and submit
  const handleSubmit = useCallback(async () => {
    setValidationError(null);

    // Validate suspect selection
    if (!accusedSuspect) {
      setValidationError('Please select a suspect.');
      return;
    }

    // Validate reasoning length
    if (reasoning.length < MIN_REASONING_LENGTH) {
      setValidationError(
        `Please provide at least ${MIN_REASONING_LENGTH} characters of reasoning (currently ${reasoning.length}).`
      );
      return;
    }

    await onSubmit(accusedSuspect, reasoning, selectedEvidence);
  }, [accusedSuspect, reasoning, selectedEvidence, onSubmit]);

  // Check if form is valid for submission
  const isValid = accusedSuspect && reasoning.length >= MIN_REASONING_LENGTH;

  return (
    <div className="bg-gray-900 border border-amber-700 rounded-lg p-6 font-mono">
      {/* Header */}
      <h2 className="text-xl font-bold text-amber-400 mb-4 tracking-wide">
        [Submit Verdict]
      </h2>

      {/* Attempts remaining indicator */}
      {attemptsRemaining !== undefined && (
        <div className="mb-4 text-sm text-gray-400">
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

      {/* Suspect Selector */}
      <div className="mb-4">
        <label
          htmlFor="suspect-select"
          className="block text-sm text-gray-400 mb-2"
        >
          Who is guilty?
        </label>
        <select
          id="suspect-select"
          value={accusedSuspect}
          onChange={(e) => setAccusedSuspect(e.target.value)}
          disabled={disabled || loading}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-200
                     focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Select suspect"
        >
          <option value="">Select suspect...</option>
          {suspects.map((suspect) => (
            <option key={suspect.id} value={suspect.id}>
              {suspect.name}
            </option>
          ))}
        </select>
      </div>

      {/* Reasoning Textarea */}
      <div className="mb-4">
        <label
          htmlFor="reasoning-input"
          className="block text-sm text-gray-400 mb-2"
        >
          Explain your reasoning (minimum {MIN_REASONING_LENGTH} characters):
        </label>
        <textarea
          id="reasoning-input"
          value={reasoning}
          onChange={(e) => setReasoning(e.target.value)}
          disabled={disabled || loading}
          rows={4}
          placeholder="> Describe your deduction. Why is this person guilty? What evidence supports your conclusion?"
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-200
                     placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500
                     focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Enter your reasoning"
        />
        <div className="flex justify-between items-center mt-1">
          <span
            className={`text-xs ${
              reasoning.length >= MIN_REASONING_LENGTH
                ? 'text-green-400'
                : 'text-gray-500'
            }`}
          >
            {reasoning.length}/{MIN_REASONING_LENGTH} characters
          </span>
          {reasoning.length > 0 && reasoning.length < MIN_REASONING_LENGTH && (
            <span className="text-xs text-yellow-400">
              {MIN_REASONING_LENGTH - reasoning.length} more needed
            </span>
          )}
        </div>
      </div>

      {/* Evidence Checklist */}
      {discoveredEvidence.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">
            Key evidence (optional but recommended):
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto bg-gray-800 border border-gray-700 rounded p-3">
            {discoveredEvidence.map((evidence) => (
              <label
                key={evidence.id}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-700/50 p-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedEvidence.includes(evidence.id)}
                  onChange={() => handleEvidenceToggle(evidence.id)}
                  disabled={disabled || loading}
                  className="rounded border-gray-600 bg-gray-700 text-amber-500
                           focus:ring-amber-500 focus:ring-offset-gray-800"
                />
                <span className="text-sm text-gray-300">{evidence.name}</span>
              </label>
            ))}
          </div>
          {selectedEvidence.length > 0 && (
            <p className="text-xs text-green-400 mt-1">
              {selectedEvidence.length} piece{selectedEvidence.length !== 1 ? 's' : ''} of evidence selected
            </p>
          )}
        </div>
      )}

      {/* Validation Error */}
      {validationError && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded">
          <p className="text-sm text-red-400">{validationError}</p>
        </div>
      )}

      {/* Disabled Warning */}
      {disabled && (
        <div className="mb-4 p-3 bg-gray-800 border border-gray-600 rounded">
          <p className="text-sm text-gray-400">
            {attemptsRemaining === 0
              ? 'No attempts remaining. The case has been resolved.'
              : 'Verdict submission is not available.'}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={() => void handleSubmit()}
        disabled={disabled || loading || !isValid}
        variant="primary"
        className="w-full bg-amber-700 hover:bg-amber-600 disabled:bg-gray-700
                   disabled:text-gray-500 text-white font-bold py-3 rounded
                   transition-colors border-amber-600"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <span className="animate-spin mr-2">*</span>
            Submitting Verdict...
          </span>
        ) : (
          'Submit Verdict'
        )}
      </Button>

      {/* Help Text */}
      <p className="mt-3 text-xs text-gray-500 text-center">
        Be thorough in your reasoning. Moody will evaluate your logic.
      </p>
    </div>
  );
}
