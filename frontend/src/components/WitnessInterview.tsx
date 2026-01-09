/**
 * WitnessInterview Component
 *
 * Main witness interrogation interface with:
 * - Trust meter (0-100 bar with color coding)
 * - Conversation history display
 * - Question input
 * - Evidence presentation UI
 * - Secret revelation notifications
 *
 * @module components/WitnessInterview
 * @since Phase 2
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { WitnessInfo, WitnessConversationItem } from '../types/investigation';

// ============================================
// Types
// ============================================

interface WitnessInterviewProps {
  /** Currently selected witness */
  witness: WitnessInfo;
  /** Conversation history */
  conversation: WitnessConversationItem[];
  /** Current trust level (0-100) */
  trust: number;
  /** Secrets revealed in current session */
  secretsRevealed: string[];
  /** Available evidence to present */
  discoveredEvidence: string[];
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Callback when player asks a question */
  onAskQuestion: (question: string) => Promise<void>;
  /** Callback when player presents evidence */
  onPresentEvidence: (evidenceId: string) => Promise<void>;
  /** Callback to clear error */
  onClearError?: () => void;
}

// ============================================
// Sub-components
// ============================================

interface TrustMeterProps {
  trust: number;
  trustDelta?: number;
}

function TrustMeter({ trust, trustDelta }: TrustMeterProps) {
  // Color based on trust level
  const getBarColor = (level: number): string => {
    if (level < 30) return 'bg-red-500';
    if (level < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColor = (level: number): string => {
    if (level < 30) return 'text-red-400';
    if (level < 70) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400 uppercase tracking-wider">Trust Level</span>
        <span className={`text-sm font-mono ${getTextColor(trust)}`}>
          {trust}%
          {trustDelta !== undefined && trustDelta !== 0 && (
            <span className={trustDelta > 0 ? 'text-green-400' : 'text-red-400'}>
              {' '}({trustDelta > 0 ? '+' : ''}{trustDelta})
            </span>
          )}
        </span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getBarColor(trust)}`}
          style={{ width: `${trust}%` }}
          role="progressbar"
          aria-valuenow={trust}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Trust level: ${trust}%`}
        />
      </div>
    </div>
  );
}

interface ConversationBubbleProps {
  item: WitnessConversationItem;
  witnessName: string;
}

function ConversationBubble({ item, witnessName }: ConversationBubbleProps) {
  const isEvidencePresentation = item.question.startsWith('[Presented evidence:');

  return (
    <div className="space-y-2">
      {/* Player message (right-aligned, blue) */}
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-blue-600/20 border border-blue-600/40 rounded-lg px-3 py-2">
          <p className="text-sm text-blue-300">
            {isEvidencePresentation ? (
              <span className="italic">{item.question}</span>
            ) : (
              item.question
            )}
          </p>
        </div>
      </div>

      {/* Witness message (left-aligned, gray) */}
      <div className="flex justify-start">
        <div className="max-w-[80%] bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2">
          <p className="text-xs text-gray-400 mb-1">{witnessName}</p>
          <p className="text-sm text-gray-200 leading-relaxed">{item.response}</p>
          {item.trust_delta !== undefined && item.trust_delta !== 0 && (
            <p className={`text-xs mt-1 ${item.trust_delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
              Trust {item.trust_delta > 0 ? '+' : ''}{item.trust_delta}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface SecretRevealedToastProps {
  secrets: string[];
}

function SecretRevealedToast({ secrets }: SecretRevealedToastProps) {
  if (secrets.length === 0) return null;

  return (
    <div className="mb-4 p-3 bg-purple-900/30 border border-purple-600 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-purple-400 text-lg">*</span>
        <div>
          <p className="text-xs text-purple-300 uppercase tracking-wider">Secrets Revealed</p>
          <ul className="text-sm text-purple-200 mt-1">
            {secrets.map((secret) => (
              <li key={secret} className="flex items-center gap-1">
                <span className="text-purple-400">-</span> {secret}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function WitnessInterview({
  witness,
  conversation,
  trust,
  secretsRevealed,
  discoveredEvidence,
  loading,
  error,
  onAskQuestion,
  onPresentEvidence,
  onClearError,
}: WitnessInterviewProps) {
  const [inputValue, setInputValue] = useState('');
  const [showEvidenceMenu, setShowEvidenceMenu] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

  // Get last trust delta for display
  const lastTrustDelta = conversation.length > 0
    ? conversation[conversation.length - 1].trust_delta
    : undefined;

  // Auto-scroll to latest message
  useEffect(() => {
    if (historyEndRef.current && typeof historyEndRef.current.scrollIntoView === 'function') {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  // Handle question submission
  const handleSubmit = useCallback(async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || loading) return;

    setInputValue('');
    await onAskQuestion(trimmedInput);
    inputRef.current?.focus();
  }, [inputValue, loading, onAskQuestion]);

  // Handle keyboard submit (Ctrl+Enter or Cmd+Enter)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !loading) {
        e.preventDefault();
        void handleSubmit();
      }
    },
    [handleSubmit, loading]
  );

  // Handle evidence presentation
  const handlePresentEvidence = useCallback(
    async (evidenceId: string) => {
      setShowEvidenceMenu(false);
      await onPresentEvidence(evidenceId);
    },
    [onPresentEvidence]
  );

  return (
    <div className="font-mono text-gray-100">
      {/* Witness Info */}
      {witness.personality && (
        <p className="text-sm text-gray-300 mb-4">
          {witness.personality}
        </p>
      )}

      {/* Trust Meter */}
      <TrustMeter trust={trust} trustDelta={lastTrustDelta} />

      {/* Secrets Revealed */}
      <SecretRevealedToast secrets={secretsRevealed} />

      {/* Conversation History */}
      <div className="mb-4 space-y-3 max-h-64 overflow-y-auto">
        {conversation.length === 0 ? (
          <p className="text-gray-500 text-sm italic text-center py-4">
            Begin your interrogation...
          </p>
        ) : (
          <>
            {conversation.map((item, index) => (
              <ConversationBubble
                key={`${item.timestamp}-${index}`}
                item={item}
                witnessName={witness.name}
              />
            ))}
            <div ref={historyEndRef} />
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm">
          <div className="flex items-center justify-between">
            <span><span className="font-bold">Error:</span> {error}</span>
            {onClearError && (
              <button
                onClick={onClearError}
                className="text-red-400 hover:text-red-300"
                aria-label="Dismiss error"
              >
                x
              </button>
            )}
          </div>
        </div>
      )}

      {/* Question Input */}
      <div className="space-y-3">
        <label
          htmlFor="question-input"
          className="block text-xs text-gray-400 uppercase tracking-wider"
        >
          Ask a question
        </label>
        <textarea
          ref={inputRef}
          id="question-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What do you know about the incident?"
          rows={3}
          disabled={loading}
          className="w-full bg-gray-800 text-gray-100 border border-gray-700 rounded p-3
                     placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500
                     focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Enter your question"
        />

        {/* Quick Actions Section */}
        {discoveredEvidence.length > 0 && (
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
              Quick Actions:
            </label>
            <div className="flex gap-2">
              <div className="relative inline-block">
                <button
                  onClick={() => setShowEvidenceMenu(!showEvidenceMenu)}
                  disabled={loading}
                  className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-750 hover:border-green-600 text-gray-300 border border-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Present Evidence ({discoveredEvidence.length} available)
                </button>

                {showEvidenceMenu && (
                  <div className="absolute bottom-full left-0 mb-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-10 max-h-48 overflow-y-auto min-w-max">
                    {discoveredEvidence.map((evidenceId) => (
                      <button
                        key={evidenceId}
                        onClick={() => void handlePresentEvidence(evidenceId)}
                        disabled={loading}
                        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-750 hover:border-green-600 disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-700 last:border-b-0 whitespace-nowrap transition-colors"
                      >
                        {evidenceId}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
