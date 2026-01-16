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
import { TERMINAL_THEME } from '../styles/terminal-theme';

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
      setValidationError('SUSPECT_SELECTION_REQUIRED');
      return;
    }

    // Validate reasoning length
    if (reasoning.length < MIN_REASONING_LENGTH) {
      setValidationError(
        `INSUFFICIENT_DATA: Reasoning requires ${MIN_REASONING_LENGTH} characters.`
      );
      return;
    }

    try {
      await onSubmit(accusedSuspect, reasoning, selectedEvidence);
    } catch (err) {
      // Error handling is managed by parent component via loading/disabled props
      console.error('[VerdictSubmission] Failed to submit verdict:', err);
      setValidationError('SUBMISSION_FAILED: Please try again.');
    }
  }, [accusedSuspect, reasoning, selectedEvidence, onSubmit]);

  // Check if form is valid for submission
  const isValid = accusedSuspect && reasoning.length >= MIN_REASONING_LENGTH;

  return (
    <div className="space-y-6">
      {/* Attempts remaining indicator */}
      {attemptsRemaining !== undefined && (
        <div className="mb-6 flex justify-between items-center border-b border-gray-800 pb-2">
          <span className="text-gray-500 text-xs font-mono uppercase tracking-widest">
            ATTEMPTS_REMAINING
          </span>
          <span className={`font-mono font-bold text-sm ${attemptsRemaining <= 3 ? 'text-red-400' : 'text-gray-200'
            }`}>
            [{attemptsRemaining.toString().padStart(2, '0')}/10]
          </span>
        </div>
      )}

      <div className="space-y-6">
        {/* Suspect Selector */}
        <div className="space-y-2">
          <label
            htmlFor="suspect-select"
            className={TERMINAL_THEME.typography.caption}
          >
            1. Identify Perpetrator
          </label>
          <div className="relative">
            <select
              id="suspect-select"
              value={accusedSuspect}
              onChange={(e) => setAccusedSuspect(e.target.value)}
              disabled={disabled || loading}
              className={`w-full ${TERMINAL_THEME.colors.bg.primary} border ${TERMINAL_THEME.colors.border.default} rounded-sm px-3 py-3 ${TERMINAL_THEME.colors.text.secondary} font-mono text-sm
                         focus:outline-none focus:border-gray-400 hover:border-gray-500 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed appearance-none`}
              aria-label="Select suspect"
            >
              <option value="">-- SELECT SUSPECT --</option>
              {suspects.map((suspect) => (
                <option key={suspect.id} value={suspect.id}>
                  {suspect.name}
                </option>
              ))}
            </select>
            <div className={`absolute right-3 top-3.5 pointer-events-none ${TERMINAL_THEME.colors.text.muted} text-xs`}>
              {TERMINAL_THEME.symbols.arrowDown}
            </div>
          </div>
        </div>

        {/* Reasoning Textarea */}
        <div className="space-y-2">
          <label
            htmlFor="reasoning-input"
            className={TERMINAL_THEME.typography.caption}
          >
            2. Deductive Reasoning (Min {MIN_REASONING_LENGTH} chars)
          </label>
          <textarea
            id="reasoning-input"
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            disabled={disabled || loading}
            rows={5}
            placeholder={`${TERMINAL_THEME.symbols.inputPrefix} Describe your deduction...`}
            className={`w-full ${TERMINAL_THEME.colors.bg.primary} border ${TERMINAL_THEME.colors.border.default} rounded-sm p-3 ${TERMINAL_THEME.colors.text.secondary} font-mono text-sm
                       placeholder-gray-600 focus:outline-none focus:border-gray-400 focus:bg-gray-800
                       resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            aria-label="Enter your reasoning"
          />
          <div className="flex justify-between items-center px-1">
            <span className={`text-[10px] font-mono tracking-wider ${reasoning.length >= MIN_REASONING_LENGTH ? 'text-green-500' : 'text-gray-600'
              }`}>
              {reasoning.length}/{MIN_REASONING_LENGTH} CHARS
            </span>
          </div>
        </div>

        {/* Evidence Checklist */}
        {discoveredEvidence.length > 0 && (
          <div className="space-y-2">
            <label className={TERMINAL_THEME.typography.caption}>
              3. Key Evidence (Optional)
            </label>
            <div className="space-y-1 max-h-48 overflow-y-auto border border-gray-800 bg-gray-900/50 p-2 scrollbar-thin scrollbar-thumb-gray-700">
              {discoveredEvidence.map((evidence) => (
                <label
                  key={evidence.id}
                  className={`flex items-center space-x-3 cursor-pointer p-2 border border-transparent hover:bg-gray-800 transition-colors group ${selectedEvidence.includes(evidence.id) ? 'bg-gray-800/50 border-gray-700' : ''
                    }`}
                >
                  <div className={`w-3 h-3 border flex items-center justify-center transition-colors ${selectedEvidence.includes(evidence.id) ? 'border-amber-500 bg-amber-900/20' : 'border-gray-600 group-hover:border-gray-400'
                    }`}>
                    {selectedEvidence.includes(evidence.id) && <div className="w-1.5 h-1.5 bg-amber-500"></div>}
                  </div>
                  {/* Native checkbox hidden but functional for accessibility */}
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selectedEvidence.includes(evidence.id)}
                    onChange={() => handleEvidenceToggle(evidence.id)}
                    disabled={disabled || loading}
                  />
                  <span className={`text-xs font-mono ${selectedEvidence.includes(evidence.id) ? 'text-gray-200' : 'text-gray-500 group-hover:text-gray-300'
                    }`}>
                    {evidence.name}
                  </span>
                </label>
              ))}
            </div>
            {selectedEvidence.length > 0 && (
              <p className="text-[10px] text-amber-500/80 font-mono px-1">
                {selectedEvidence.length} ITEM(S) SELECTED
              </p>
            )}
          </div>
        )}
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className={`mt-4 p-2 border ${TERMINAL_THEME.colors.state.error.border} ${TERMINAL_THEME.colors.state.error.bgLight} flex items-center gap-2 ${TERMINAL_THEME.animation.fadeIn}`}>
          <span className={`${TERMINAL_THEME.colors.state.error.text} font-bold text-xs`}>{TERMINAL_THEME.speakers.system.prefix}</span>
          <p className={`text-xs ${TERMINAL_THEME.colors.state.error.text} font-mono uppercase tracking-wide`}>
            {validationError}
          </p>
        </div>
      )}

      {/* Disabled Warning */}
      {disabled && (
        <div className="mt-4 p-3 bg-gray-800 border border-gray-700">
          <p className="text-xs text-gray-400 font-mono text-center uppercase tracking-widest">
            {attemptsRemaining === 0
              ? 'CASE_CLOSED: ATTEMPTS_EXHAUSTED'
              : 'SUBMISSION_PROTOCOL_LOCKED'}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <div className="mt-8 pt-4 border-t border-gray-800 space-y-3">
        <button
          onClick={() => void handleSubmit()}
          disabled={disabled || loading || !isValid}
          className="w-full py-3 px-4 bg-amber-900/20 border border-amber-700/50 text-amber-500 font-mono text-sm uppercase tracking-widest
                     hover:bg-amber-900/40 hover:text-amber-400 transition-all duration-200 group
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-900/20 disabled:hover:border-amber-700/50
                     focus:outline-none focus:ring-1 focus:ring-amber-500/50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin text-amber-500">/</span>
              TRANSMITTING...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              SUBMIT VERDICT
              <span className="ml-2 group-hover:translate-x-2 transition-transform duration-200">{TERMINAL_THEME.symbols.current}</span>
            </span>
          )}
        </button>
        <p className={`${TERMINAL_THEME.typography.helper} text-center tracking-wide`}>
          * Be thorough in your reasoning. Moody will evaluate your logic.
        </p>
      </div>
    </div>
  );
}
