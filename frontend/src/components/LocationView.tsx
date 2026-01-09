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

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Card } from './ui/Card';
import { investigate } from '../api/client';
import type { LocationResponse, ConversationItem, ApiError, Message } from '../types/investigation';

// ============================================
// Message Types for Unified Rendering
// ============================================

/**
 * Unified message type for chronological rendering
 * Combines history items and inline messages into single sorted array
 */
interface UnifiedMessage {
  /** Unique key for React */
  key: string;
  /** Message type for rendering */
  type: 'player' | 'narrator' | 'tom_ghost' | 'evidence';
  /** Message text */
  text: string;
  /** Timestamp for sorting */
  timestamp: number;
  /** Evidence IDs (for evidence type) */
  evidenceIds?: string[];
  /** Tom's tone (for tom_ghost type) */
  tone?: 'helpful' | 'misleading';
}

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
  /** Inline messages (player, narrator, tom_ghost) for conversation feed */
  inlineMessages?: Message[];
  /** Callback when player sends message to Tom (detected by "tom" prefix) */
  onTomMessage?: (message: string) => void;
  /** Whether Tom is currently processing a response */
  tomLoading?: boolean;
}

// ============================================
// Constants
// ============================================

/** Maximum number of history items to display */
const MAX_HISTORY_LENGTH = 5;

// ============================================
// Component
// ============================================

// Regex for detecting Tom messages
const TOM_PREFIX_REGEX = /^tom[,:\s]+/i;

export function LocationView({
  caseId,
  locationId,
  locationData,
  onEvidenceDiscovered,
  discoveredEvidence = [],
  witnessesPresent = [],
  onWitnessClick,
  inlineMessages = [],
  onTomMessage,
  tomLoading = false,
}: LocationViewProps) {
  // State
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ConversationItem[]>([]);

  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest response (also scroll when inline messages change)
  useEffect(() => {
    if (historyEndRef.current && typeof historyEndRef.current.scrollIntoView === 'function') {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, inlineMessages]);

  // Check if input is for Tom
  const isTomInput = useCallback((input: string): boolean => {
    return TOM_PREFIX_REGEX.test(input.trim());
  }, []);

  // Strip Tom prefix from message
  const stripTomPrefix = useCallback((input: string): string => {
    return input.trim().replace(TOM_PREFIX_REGEX, '').trim();
  }, []);

  // Handle form submission (routes to Tom or narrator)
  const handleSubmit = useCallback(async () => {
    const trimmedInput = inputValue.trim();

    // Validate input
    if (!trimmedInput) {
      setError('Please enter an action to investigate.');
      return;
    }

    // Check if this is a Tom message
    if (isTomInput(trimmedInput) && onTomMessage) {
      const tomMessage = stripTomPrefix(trimmedInput);
      if (tomMessage) {
        // Route to Tom (async, handled by parent)
        onTomMessage(tomMessage);
        setInputValue('');
        inputRef.current?.focus();
        return;
      }
    }

    // Regular investigation (narrator)
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
  }, [inputValue, caseId, locationId, onEvidenceDiscovered, discoveredEvidence, isTomInput, stripTomPrefix, onTomMessage]);

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

  // ============================================
  // Unified Message Array (Phase 4.1 Fix)
  // ============================================

  /**
   * Combine history items and inline messages into a single sorted array
   * This fixes the bug where Tom messages stack at the bottom
   * Now: User -> Narrator -> Tom -> User -> Narrator -> Tom (chronological)
   */
  const unifiedMessages = useMemo((): UnifiedMessage[] => {
    const messages: UnifiedMessage[] = [];

    // Convert history items to unified messages
    history.forEach((item) => {
      const baseTimestamp = item.timestamp.getTime();

      // Player action
      messages.push({
        key: `history-player-${item.id}`,
        type: 'player',
        text: item.action,
        timestamp: baseTimestamp,
      });

      // Narrator response (slightly after player)
      messages.push({
        key: `history-narrator-${item.id}`,
        type: 'narrator',
        text: item.response,
        timestamp: baseTimestamp + 1,
      });

      // Evidence discovered (slightly after narrator)
      if (item.evidence_discovered.length > 0) {
        messages.push({
          key: `history-evidence-${item.id}`,
          type: 'evidence',
          text: '', // Rendered separately
          evidenceIds: item.evidence_discovered,
          timestamp: baseTimestamp + 2,
        });
      }
    });

    // Convert inline messages to unified messages
    inlineMessages.forEach((msg, index) => {
      // Use message timestamp if available, otherwise estimate based on index
      const timestamp = msg.timestamp ?? Date.now() - (inlineMessages.length - index) * 100;

      if (msg.type === 'player') {
        messages.push({
          key: `inline-player-${index}-${timestamp}`,
          type: 'player',
          text: msg.text,
          timestamp,
        });
      } else if (msg.type === 'narrator') {
        messages.push({
          key: `inline-narrator-${index}-${timestamp}`,
          type: 'narrator',
          text: msg.text,
          timestamp,
        });
      } else if (msg.type === 'tom_ghost') {
        messages.push({
          key: `inline-tom-${index}-${timestamp}`,
          type: 'tom_ghost',
          text: msg.text,
          tone: msg.tone,
          timestamp,
        });
      }
    });

    // Sort by timestamp (chronological order)
    return messages.sort((a, b) => a.timestamp - b.timestamp);
  }, [history, inlineMessages]);

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
        <h2 className="text-xl font-bold text-yellow-400 uppercase tracking-wide">
          {locationData.name}
        </h2>
        <p className="text-sm text-gray-400 mt-1 whitespace-normal leading-relaxed">
          {locationData.description}
        </p>
      </div>

      {/* Conversation History - Unified Message Rendering (Phase 4.1) */}
      {unifiedMessages.length > 0 && (
        <div className="mb-4 space-y-3 max-h-96 overflow-y-auto">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-900 py-1">
            Investigation Log ({unifiedMessages.length})
          </h3>

          {/* Render all messages in chronological order */}
          {unifiedMessages.map((message) => {
            // Player action
            if (message.type === 'player') {
              return (
                <div key={message.key} className="border-l-2 border-gray-700 pl-3 py-1">
                  <p className="text-blue-400 text-sm">
                    <span className="text-gray-500">{'>'}</span> {message.text}
                  </p>
                </div>
              );
            }

            // Narrator response
            if (message.type === 'narrator') {
              return (
                <div key={message.key} className="border-l-2 border-gray-700 pl-3 py-1">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {message.text}
                  </p>
                </div>
              );
            }

            // Evidence discovered
            if (message.type === 'evidence' && message.evidenceIds) {
              return (
                <div key={message.key} className="border-l-2 border-gray-700 pl-3 py-1">
                  <div className="text-xs">
                    {message.evidenceIds.map((evidenceId) => (
                      <span
                        key={evidenceId}
                        className="inline-block bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded border border-yellow-600/40 mr-1"
                      >
                        + Evidence: {evidenceId}
                      </span>
                    ))}
                  </div>
                </div>
              );
            }

            // Tom's ghost message
            if (message.type === 'tom_ghost') {
              return (
                <div
                  key={message.key}
                  className="border-l-2 border-amber-700/50 pl-3 py-2"
                >
                  <div className="flex gap-2 text-amber-300/90 font-mono text-sm">
                    <span className="flex-shrink-0" aria-label="Tom Thornfield">
                      {'💀'} TOM:
                    </span>
                    <span className="leading-relaxed italic">
                      &quot;{message.text}&quot;
                    </span>
                  </div>
                </div>
              );
            }

            return null;
          })}

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
        {/* Label with Tom target indicator */}
        <div className="flex items-center justify-between">
          <label htmlFor="action-input" className="block text-xs text-gray-500 uppercase tracking-wider">
            What do you do?
          </label>
          {isTomInput(inputValue) && (
            <span className="text-xs text-amber-400 font-mono animate-pulse">
              Talking to Tom...
            </span>
          )}
        </div>

        {/* Input with dynamic border color */}
        <textarea
          ref={inputRef}
          id="action-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="> describe your action, or 'Tom, <question>' to ask the ghost..."
          rows={3}
          disabled={isLoading || tomLoading}
          className={`w-full bg-gray-800 text-gray-100 border rounded p-3
                     placeholder-gray-500 focus:outline-none focus:ring-2
                     focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-200 ${
                       isTomInput(inputValue)
                         ? 'border-amber-600 focus:ring-amber-500'
                         : 'border-gray-700 focus:ring-green-500'
                     }`}
          aria-label="Enter your investigation action or talk to Tom"
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
            {/* Tom quick action */}
            <button
              onClick={() => handleQuickAction("Tom, what do you think?")}
              className="text-xs px-3 py-1 bg-gray-800 border border-amber-700/50 rounded hover:bg-gray-700 text-amber-400"
              type="button"
            >
              ask Tom
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
          <div className="text-xs text-gray-500">
            <span>Press Ctrl+Enter to submit</span>
            {!isTomInput(inputValue) && (
              <span className="ml-2 text-amber-500/70">
                | Prefix with &quot;Tom&quot; to ask him
              </span>
            )}
          </div>

          {/* Loading indicators */}
          {tomLoading && (
            <span className="flex items-center text-amber-400 text-sm font-mono">
              <span className="animate-spin mr-2">*</span>
              Tom thinking...
            </span>
          )}
          {isLoading && !tomLoading && (
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
