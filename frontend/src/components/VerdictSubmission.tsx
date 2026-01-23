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
import { useTheme } from '../context/ThemeContext';

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
  const { theme } = useTheme();
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
        <div className={`mb-6 flex justify-between items-center border-b ${theme.colors.border.default} pb-2`}>
          <span className={`${theme.colors.text.muted} text-xs font-mono uppercase tracking-widest`}>
            ATTEMPTS_REMAINING
          </span>
          <span className={`font-mono font-bold text-sm ${attemptsRemaining <= 3 ? theme.colors.state.error.text : theme.colors.text.primary
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
            className={theme.typography.caption}
          >
            1. Identify Perpetrator
          </label>
          <div className="relative">
            <select
              id="suspect-select"
              value={accusedSuspect}
              onChange={(e) => setAccusedSuspect(e.target.value)}
              disabled={disabled || loading}
              className={`w-full ${theme.colors.bg.primary} border ${theme.colors.border.default} rounded-sm px-3 py-3 ${theme.colors.text.secondary} font-mono text-sm
                         focus:outline-none ${theme.colors.border.hover} transition-colors
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
            <div className={`absolute right-3 top-3.5 pointer-events-none ${theme.colors.text.muted} text-xs`}>
              {theme.symbols.arrowDown}
            </div>
          </div>
        </div>

        {/* Reasoning Textarea */}
        <div className="space-y-2">
          <label
            htmlFor="reasoning-input"
            className={theme.typography.caption}
          >
            2. Deductive Reasoning (Min {MIN_REASONING_LENGTH} chars)
          </label>
          <textarea
            id="reasoning-input"
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            disabled={disabled || loading}
            rows={5}
            placeholder={`${theme.symbols.inputPrefix} Describe your deduction...`}
            className={`w-full ${theme.colors.bg.primary} border ${theme.colors.border.default} rounded-sm p-3 ${theme.colors.text.secondary} font-mono text-sm
                       ${theme.colors.text.muted} focus:outline-none ${theme.colors.border.hover} ${theme.colors.bg.hover}
                       resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            aria-label="Enter your reasoning"
          />
          <div className="flex justify-between items-center px-1">
            <span className={`text-[10px] font-mono tracking-wider ${reasoning.length >= MIN_REASONING_LENGTH ? theme.colors.state.success.text : theme.colors.text.separator
              }`}>
              {reasoning.length}/{MIN_REASONING_LENGTH} CHARS
            </span>
          </div>
        </div>

        {/* Evidence Checklist */}
        {discoveredEvidence.length > 0 && (
          <div className="space-y-2">
            <label className={theme.typography.caption}>
              3. Key Evidence (Optional)
            </label>
            <div className={`space-y-1 max-h-48 overflow-y-auto border ${theme.colors.border.default} ${theme.colors.bg.semiTransparent} p-2 scrollbar-thin`}>
              {discoveredEvidence.map((evidence) => (
                <label
                  key={evidence.id}
                  className={`flex items-center space-x-3 cursor-pointer p-2 border border-transparent ${theme.colors.bg.hover} transition-colors group ${selectedEvidence.includes(evidence.id) ? `${theme.colors.bg.active} ${theme.colors.border.default}` : ''
                    }`}
                >
                  <div className={`w-3 h-3 border flex items-center justify-center transition-colors ${selectedEvidence.includes(evidence.id) ? `${theme.colors.interactive.border} ${theme.colors.bg.hover}` : `${theme.colors.border.default} group-hover:border-gray-500`
                    }`}>
                    {selectedEvidence.includes(evidence.id) && <div className={`w-1.5 h-1.5 ${theme.colors.interactive.text.replace('text-', 'bg-')}`}></div>}
                  </div>
                  {/* Native checkbox hidden but functional for accessibility */}
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selectedEvidence.includes(evidence.id)}
                    onChange={() => handleEvidenceToggle(evidence.id)}
                    disabled={disabled || loading}
                  />
                  <span className={`text-xs font-mono ${selectedEvidence.includes(evidence.id) ? theme.colors.text.primary : `${theme.colors.text.muted} group-hover:text-gray-700`
                    }`}>
                    {evidence.name}
                  </span>
                </label>
              ))}
            </div>
            {selectedEvidence.length > 0 && (
              <p className={`text-[10px] ${theme.colors.interactive.text} font-mono px-1`}>
                {selectedEvidence.length} ITEM(S) SELECTED
              </p>
            )}
          </div>
        )}
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className={`mt-4 p-2 border ${theme.colors.state.error.border} ${theme.colors.state.error.bgLight} flex items-center gap-2 ${theme.animation.fadeIn}`}>
          <span className={`${theme.colors.state.error.text} font-bold text-xs`}>{theme.speakers.system.prefix}</span>
          <p className={`text-xs ${theme.colors.state.error.text} font-mono uppercase tracking-wide`}>
            {validationError}
          </p>
        </div>
      )}

      {/* Disabled Warning */}
      {disabled && (
        <div className={`mt-4 p-3 ${theme.colors.bg.hover} border ${theme.colors.border.default}`}>
          <p className={`text-xs ${theme.colors.text.muted} font-mono text-center uppercase tracking-widest`}>
            {attemptsRemaining === 0
              ? 'CASE_CLOSED: ATTEMPTS_EXHAUSTED'
              : 'SUBMISSION_PROTOCOL_LOCKED'}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <div className={`mt-8 pt-4 border-t ${theme.colors.border.default} space-y-3`}>
        <button
          onClick={() => void handleSubmit()}
          disabled={disabled || loading || !isValid}
          className={`w-full py-3 px-4 bg-blue-600 border border-blue-700 text-white font-mono text-sm uppercase tracking-widest
                     hover:bg-blue-700 transition-all duration-200 group
                     disabled:opacity-50 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-1`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">/</span>
              TRANSMITTING...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              SUBMIT VERDICT
              <span className="ml-2 group-hover:translate-x-2 transition-transform duration-200">{theme.symbols.arrowRight}</span>
            </span>
          )}
        </button>
        <p className={`${theme.typography.helper} text-center tracking-wide`}>
          * Be thorough in your reasoning. Moody will evaluate your logic.
        </p>
      </div>
    </div>
  );
}
