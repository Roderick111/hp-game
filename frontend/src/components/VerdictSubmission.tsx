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
import { TerminalPanel } from './ui/TerminalPanel';

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

    await onSubmit(accusedSuspect, reasoning, selectedEvidence);
  }, [accusedSuspect, reasoning, selectedEvidence, onSubmit]);

  // Check if form is valid for submission
  const isValid = accusedSuspect && reasoning.length >= MIN_REASONING_LENGTH;

  return (
    <TerminalPanel
      title="SUBMIT VERDICT"
      footer="Be thorough in your reasoning. Moody will evaluate your logic."
      className="max-w-2xl mx-auto"
    >
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
            className="block text-xs text-gray-400 font-mono uppercase tracking-wider"
          >
            1. Identify Perpetrator
          </label>
          <div className="relative">
            <select
              id="suspect-select"
              value={accusedSuspect}
              onChange={(e) => setAccusedSuspect(e.target.value)}
              disabled={disabled || loading}
              className="w-full bg-gray-900 border border-gray-600 rounded-sm px-3 py-3 text-gray-200 font-mono text-sm
                         focus:outline-none focus:border-gray-400 hover:border-gray-500 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed appearance-none rounded-none"
              aria-label="Select suspect"
            >
              <option value="">-- SELECT SUSPECT --</option>
              {suspects.map((suspect) => (
                <option key={suspect.id} value={suspect.id}>
                  {suspect.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-3.5 pointer-events-none text-gray-500 text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* Reasoning Textarea */}
        <div className="space-y-2">
          <label
            htmlFor="reasoning-input"
            className="block text-xs text-gray-400 font-mono uppercase tracking-wider"
          >
            2. Deductive Reasoning (Min {MIN_REASONING_LENGTH} chars)
          </label>
          <textarea
            id="reasoning-input"
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            disabled={disabled || loading}
            rows={5}
            placeholder="> Describe your deduction..."
            className="w-full bg-gray-900 border border-gray-600 rounded-sm p-3 text-gray-200 font-mono text-sm
                       placeholder-gray-600 focus:outline-none focus:border-gray-400 focus:bg-gray-800
                       resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            <label className="block text-xs text-gray-400 font-mono uppercase tracking-wider">
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
        <div className="mt-4 p-2 border border-red-900/50 bg-red-900/10 flex items-center gap-2 animate-fade-in">
          <span className="text-red-500 font-bold text-xs">!</span>
          <p className="text-xs text-red-400 font-mono uppercase tracking-wide">
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
      <div className="mt-8 pt-4 border-t border-gray-800">
        <button
          onClick={() => void handleSubmit()}
          disabled={disabled || loading || !isValid}
          className="w-full py-3 px-4 bg-gray-900 border border-gray-500 text-white font-mono text-sm uppercase tracking-widest
                     hover:bg-gray-800 hover:border-gray-300 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-900 disabled:hover:border-gray-600
                     focus:outline-none focus:ring-1 focus:ring-gray-400"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin text-amber-500">/</span>
              TRANSMITTING...
            </span>
          ) : (
            '>> SUBMIT VERDICT_'
          )}
        </button>
      </div>
    </TerminalPanel>
  );
}
