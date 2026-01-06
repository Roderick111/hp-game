/**
 * LocationView Component
 *
 * Main investigation interface with terminal UI aesthetic.
 * Displays location description, freeform input for player actions,
 * conversation history, and LLM narrator responses.
 *
 * @module components/LocationView
 * @since Phase 1
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from './ui/Card';
import { investigate } from '../api/client';
import type { LocationResponse, ConversationItem, ApiError } from '../types/investigation';

// ============================================
// Types
// ============================================

interface WitnessPresent {
  /** Witness ID */
  id: string;
  /** Witness name */
  name: string;
}

interface LocationViewProps {
  /** Current case ID */
  caseId: string;
  /** Current location ID */
  locationId: string;
  /** Location data from API */
  locationData: LocationResponse | null;
  /** Callback when new evidence is discovered */
  onEvidenceDiscovered: (evidenceIds: string[]) => void;
  /** Already discovered evidence (to prevent showing alerts for known evidence) */
  discoveredEvidence?: string[];
  /** Witnesses present at this location */
  witnessesPresent?: WitnessPresent[];
  /** Callback when witness is clicked for interview */
  onWitnessClick?: (witnessId: string) => void;
}

// ============================================
// Constants
// ============================================

/** Maximum number of history items to display */
const MAX_HISTORY_LENGTH = 5;

// ============================================
// Component
// ============================================

export function LocationView({
  caseId,
  locationId,
  locationData,
  onEvidenceDiscovered,
  discoveredEvidence = [],
  witnessesPresent = [],
  onWitnessClick,
}: LocationViewProps) {
  // State
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ConversationItem[]>([]);

  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest response
  useEffect(() => {
    if (historyEndRef.current && typeof historyEndRef.current.scrollIntoView === 'function') {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    const trimmedInput = inputValue.trim();

    // Validate input
    if (!trimmedInput) {
      setError('Please enter an action to investigate.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await investigate({
        player_input: trimmedInput,
        case_id: caseId,
        location_id: locationId,
      });

      // Create history item
      const historyItem: ConversationItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        action: trimmedInput,
        response: response.narrator_response,
        evidence_discovered: response.new_evidence,
        timestamp: new Date(),
      };

      // Update history (keep last MAX_HISTORY_LENGTH items)
      setHistory((prev) => {
        const newHistory = [...prev, historyItem];
        if (newHistory.length > MAX_HISTORY_LENGTH) {
          return newHistory.slice(-MAX_HISTORY_LENGTH);
        }
        return newHistory;
      });

      // Notify parent of discovered evidence (filter out already discovered)
      const newEvidenceToReport = response.new_evidence.filter(
        (id) => !discoveredEvidence.includes(id)
      );
      if (newEvidenceToReport.length > 0) {
        onEvidenceDiscovered(newEvidenceToReport);
      }

      // Clear input
      setInputValue('');

      // Focus input for next action
      inputRef.current?.focus();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, caseId, locationId, onEvidenceDiscovered, discoveredEvidence]);

  // Handle keyboard submit (Ctrl+Enter or Cmd+Enter)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isLoading) {
        e.preventDefault();
        void handleSubmit();
      }
    },
    [handleSubmit, isLoading]
  );

  // Handle quick action shortcut - fills input without submitting
  const handleQuickAction = useCallback((text: string) => {
    setInputValue(text);
    inputRef.current?.focus();
  }, []);

  // Handle witness click - opens interview modal
  const handleWitnessClick = useCallback((witnessId: string) => {
    if (onWitnessClick) {
      onWitnessClick(witnessId);
    }
  }, [onWitnessClick]);

  // Loading state for location data
  if (!locationData) {
    return (
      <Card className="font-mono bg-gray-900 text-gray-100 border-gray-700">
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-gray-400">Loading location...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="font-mono bg-gray-900 text-gray-100 border-gray-700">
      {/* Location Header */}
      <div className="border-b border-gray-700 pb-3 mb-4">
        <h2 className="text-xl font-bold text-green-400 tracking-wide">
          [{locationData.name}]
        </h2>
        <p className="text-sm text-gray-400 mt-1 whitespace-pre-line leading-relaxed">
          {locationData.description}
        </p>
      </div>

      {/* Conversation History */}
      {history.length > 0 && (
        <div className="mb-4 space-y-3 max-h-64 overflow-y-auto">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-900 py-1">
            Investigation Log ({history.length})
          </h3>
          {history.map((item) => (
            <div key={item.id} className="border-l-2 border-gray-700 pl-3 py-1">
              {/* Player action */}
              <p className="text-blue-400 text-sm">
                <span className="text-gray-500">{'>'}</span> {item.action}
              </p>

              {/* Narrator response */}
              <p className="text-gray-300 text-sm mt-1 leading-relaxed">
                {item.response}
              </p>

              {/* Evidence discovered indicator */}
              {item.evidence_discovered.length > 0 && (
                <div className="mt-2 text-xs">
                  {item.evidence_discovered.map((evidenceId) => (
                    <span
                      key={evidenceId}
                      className="inline-block bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded border border-yellow-600/40 mr-1"
                    >
                      + Evidence: {evidenceId}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={historyEndRef} />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm">
          <span className="font-bold">Error:</span> {error}
        </div>
      )}

      {/* Input Area */}
      <div className="space-y-3">
        <label htmlFor="action-input" className="block text-xs text-gray-500 uppercase tracking-wider">
          What do you do?
        </label>
        <textarea
          ref={inputRef}
          id="action-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="> describe your action..."
          rows={3}
          disabled={isLoading}
          className="w-full bg-gray-800 text-gray-100 border border-gray-700 rounded p-3
                     placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500
                     focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Enter your investigation action"
        />

        {/* Terminal Quick Actions */}
        <div className="mt-3 mb-2">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Quick Actions:
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleQuickAction("examine the desk")}
              className="text-xs px-3 py-1 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 text-gray-300"
              type="button"
            >
              examine desk
            </button>
            <button
              onClick={() => handleQuickAction("check the window")}
              className="text-xs px-3 py-1 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 text-gray-300"
              type="button"
            >
              check window
            </button>
            {/* Dynamic witness shortcuts */}
            {witnessesPresent.map((witness) => (
              <button
                key={witness.id}
                onClick={() => handleWitnessClick(witness.id)}
                className="text-xs px-3 py-1 bg-gray-800 border border-amber-700 rounded hover:bg-gray-700 text-amber-400"
                type="button"
              >
                talk to {witness.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Press Ctrl+Enter to submit
          </span>

          {/* Loading indicator */}
          {isLoading && (
            <span className="flex items-center text-green-400 text-sm">
              <span className="animate-spin mr-2">*</span>
              Investigating...
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
