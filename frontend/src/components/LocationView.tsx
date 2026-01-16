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

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Card } from "./ui/Card";
import { investigate } from "../api/client";
import { AurorHandbook } from "./AurorHandbook";
import { TERMINAL_THEME } from "../styles/terminal-theme";
import type {
  LocationResponse,
  ConversationItem,
  ApiError,
  Message,
} from "../types/investigation";

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
  type: "player" | "narrator" | "tom_ghost" | "evidence";
  /** Message text */
  text: string;
  /** Timestamp for sorting */
  timestamp: number;
  /** Evidence IDs (for evidence type) */
  evidenceIds?: string[];
  /** Tom's tone (for tom_ghost type) */
  tone?: "helpful" | "misleading";
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
  /** Witnesses present at this location (unused - reserved for future feature) */
  _witnessesPresent?: WitnessPresent[];
  /** Callback when witness is clicked for interview (unused - reserved for future feature) */
  _onWitnessClick?: (witnessId: string) => void;
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
  inlineMessages = [],
  onTomMessage,
  tomLoading = false,
}: LocationViewProps) {
  // State
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ConversationItem[]>([]);
  const [isHandbookOpen, setIsHandbookOpen] = useState(false);

  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

  // ============================================
  // Unified Message Array
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
        type: "player",
        text: item.action,
        timestamp: baseTimestamp,
      });

      // Narrator response (slightly after player)
      messages.push({
        key: `history-narrator-${item.id}`,
        type: "narrator",
        text: item.response,
        timestamp: baseTimestamp + 1,
      });

      // Evidence discovered (slightly after narrator)
      if (item.evidence_discovered.length > 0) {
        messages.push({
          key: `history-evidence-${item.id}`,
          type: "evidence",
          text: "", // Rendered separately
          evidenceIds: item.evidence_discovered,
          timestamp: baseTimestamp + 2,
        });
      }
    });

    // Convert inline messages to unified messages
    inlineMessages.forEach((msg, index) => {
      // Use message timestamp if available, otherwise estimate based on index
      const timestamp =
        msg.timestamp ?? Date.now() - (inlineMessages.length - index) * 100;

      if (msg.type === "player") {
        messages.push({
          key: `inline-player-${index}-${timestamp}`,
          type: "player",
          text: msg.text,
          timestamp,
        });
      } else if (msg.type === "narrator") {
        messages.push({
          key: `inline-narrator-${index}-${timestamp}`,
          type: "narrator",
          text: msg.text,
          timestamp,
        });
      } else if (msg.type === "tom_ghost") {
        messages.push({
          key: `inline-tom-${index}-${timestamp}`,
          type: "tom_ghost",
          text: msg.text,
          tone: msg.tone,
          timestamp,
        });
      }
    });

    // Sort by timestamp (chronological order)
    return messages.sort((a, b) => a.timestamp - b.timestamp);
  }, [history, inlineMessages]);

  // Auto-scroll to latest response, but NOT on initial load of a location
  // We want users to see the location description first
  const prevMessagesLengthRef = useRef(0);

  useEffect(() => {
    // If location changed, reset the tracking ref so we don't auto-scroll initially
    prevMessagesLengthRef.current = 0;
    // Clear local history when switching locations (Phase 5.6)
    setHistory([]);
    // Scroll to top of page/component to show description
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [locationId]);

  useEffect(() => {
    // Only scroll to bottom if we have NEW messages (length increased)
    // and it's not the very first render cycle (length > 0)
    const currentLength = unifiedMessages.length;
    const prevLength = prevMessagesLengthRef.current;

    if (currentLength > prevLength && prevLength > 0) {
      if (
        historyEndRef.current &&
        typeof historyEndRef.current.scrollIntoView === "function"
      ) {
        historyEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }

    // Update ref for next render
    prevMessagesLengthRef.current = currentLength;
  }, [unifiedMessages, locationId]);

  // Keyboard shortcut for Auror's Handbook (Cmd/Ctrl+H) - Phase 4.5
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "h") {
        e.preventDefault();
        setIsHandbookOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Check if input is for Tom
  const isTomInput = useCallback((input: string): boolean => {
    return TOM_PREFIX_REGEX.test(input.trim());
  }, []);

  // Strip Tom prefix from message
  const stripTomPrefix = useCallback((input: string): string => {
    return input.trim().replace(TOM_PREFIX_REGEX, "").trim();
  }, []);

  // Handle form submission (routes to Tom or narrator)
  const handleSubmit = useCallback(async () => {
    const trimmedInput = inputValue.trim();

    // Validate input
    if (!trimmedInput) {
      setError("Please enter an action to investigate.");
      return;
    }

    // Check if this is a Tom message
    if (isTomInput(trimmedInput) && onTomMessage) {
      const tomMessage = stripTomPrefix(trimmedInput);
      if (tomMessage) {
        // Route to Tom (async, handled by parent)
        onTomMessage(tomMessage);
        setInputValue("");
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
        (id) => !discoveredEvidence.includes(id),
      );
      if (newEvidenceToReport.length > 0) {
        onEvidenceDiscovered(newEvidenceToReport);
      }

      // Clear input
      setInputValue("");

      // Focus input for next action
      inputRef.current?.focus();
    } catch (err) {
      const apiError = err as ApiError;
      setError(
        apiError.message || "An unexpected error occurred. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    inputValue,
    caseId,
    locationId,
    onEvidenceDiscovered,
    discoveredEvidence,
    isTomInput,
    stripTomPrefix,
    onTomMessage,
  ]);

  // Handle keyboard submit (Enter to submit, Shift+Enter for newline)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !isLoading) {
        e.preventDefault();
        void handleSubmit();
      }
    },
    [handleSubmit, isLoading],
  );

  // Handle quick action shortcut - fills input without submitting
  const handleQuickAction = useCallback((text: string) => {
    setInputValue(text);
    inputRef.current?.focus();
  }, []);

  // Handle spell selection from handbook (Phase 5.7)
  const handleSpellSelect = useCallback((spellName: string) => {
    setInputValue(`I cast ${spellName}`);
    setIsHandbookOpen(false);
    inputRef.current?.focus();
  }, []);

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
      <div className="mb-0">
        <h2 className="text-white font-mono uppercase text-sm font-bold tracking-wide">
          {locationData.name}
        </h2>
        <p className="text-sm text-gray-500 mt-2 whitespace-normal leading-relaxed">
          {locationData.description}
        </p>
      </div>

      <div className="border-t border-gray-800 mt-3 mb-6"></div>

      {/* Conversation History - Unified Message Rendering (Phase 4.1) */}
      {unifiedMessages.length > 0 && (
        <div className="mb-4 space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 pr-2">
          {/* Render all messages in chronological order */}
          {unifiedMessages.map((message) => {
            // Player action
            if (message.type === "player") {
              return (
                <div
                  key={message.key}
                  className="border-l border-blue-500 pl-3 py-1"
                >
                  <p className="text-blue-400 text-sm">
                    <span className="text-gray-500">{">"}</span> {message.text}
                  </p>
                </div>
              );
            }

            // Narrator response
            if (message.type === "narrator") {
              return (
                <div
                  key={message.key}
                  className="border-l border-gray-400 pl-3 py-1"
                >
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                    {message.text}
                  </p>
                </div>
              );
            }

            // Evidence discovered
            if (message.type === "evidence" && message.evidenceIds) {
              return (
                <div
                  key={message.key}
                  className="border-l border-gray-700 pl-3 py-1"
                >
                  <div className="text-xs">
                    {message.evidenceIds.map((evidenceId) => (
                      <span
                        key={evidenceId}
                        className="inline-block bg-gray-800 text-gray-200 px-2 py-0.5 rounded border border-gray-600 mr-1"
                      >
                        + Evidence: {evidenceId}
                      </span>
                    ))}
                  </div>
                </div>
              );
            }

            // Tom's ghost message
            if (message.type === "tom_ghost") {
              return (
                <div
                  key={message.key}
                  className="border-l border-amber-600 pl-3 py-1"
                >
                  <p className="text-sm leading-relaxed text-gray-300">
                    <span className="text-amber-500 font-bold mr-2">TOM:</span>
                    {message.text}
                  </p>
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
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm uppercase tracking-widest flex justify-between items-center">
          <span>
            <span className="font-bold">[ SYSTEM_ERROR ]</span> {error}
          </span>
        </div>
      )}

      <div className="border-t border-gray-800 mt-4 mb-6"></div>

      {/* Input Area */}
      <div className="space-y-3">
        {/* Label with Tom target indicator */}
        <div className="flex items-center justify-between">
          <label
            htmlFor="action-input"
            className="block text-xs text-gray-500 uppercase tracking-wider"
          >
            What do you do?
          </label>
          {isTomInput(inputValue) && (
            <span className="text-xs text-amber-500 font-mono animate-pulse uppercase tracking-widest font-bold">
              [ SPIRIT RESONANCE: THORNFIELD ]
            </span>
          )}
        </div>

        {/* Input with witness-style absolute prefix and dynamic border */}
        <div className="relative group w-full">
          <div className="absolute top-3 left-3 text-gray-500 font-bold select-none">
            {">"}
          </div>
          <textarea
            ref={inputRef}
            id="action-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="describe your action, or question..."
            rows={3}
            disabled={isLoading || tomLoading}
            className={`w-full bg-gray-900 text-gray-100 border rounded-sm p-3 pl-8 pr-10
                       placeholder-gray-600 focus:outline-none
                       resize-none disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200 text-sm font-mono tracking-wide
                       ${
                         isTomInput(inputValue)
                           ? "border-amber-600/50 focus:border-amber-500 focus:bg-gray-800"
                           : "border-gray-600 focus:border-gray-400 focus:bg-gray-800"
                       }`}
            aria-label="Enter your investigation action or talk to Tom"
          />
          <button
            onClick={() => void handleSubmit()}
            disabled={isLoading || tomLoading || !inputValue.trim()}
            className="absolute right-[0px] bottom-[8px] h-8 w-16 flex items-center justify-center rounded-sm border border-gray-600 bg-gray-900 text-gray-500 hover:border-amber-500 hover:text-amber-500 hover:bg-gray-800 disabled:opacity-0 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            title="Submit Action (Enter)"
            aria-label="Submit Action"
          >
            <span className="font-mono text-xl leading-none pt-1">↵</span>
          </button>
        </div>

        {/* Terminal Quick Actions */}
        <div className="mt-4 mb-2 space-y-2">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Quick Actions:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickAction("examine the desk")}
              className="py-2.5 px-4 flex items-center gap-3 border border-gray-600 bg-gray-900 text-gray-300 transition-all duration-200 font-mono text-xs uppercase tracking-widest group hover:border-amber-500/50 hover:text-amber-400 hover:bg-gray-800 rounded-sm"
              type="button"
            >
              <span className="text-gray-600 group-hover:text-amber-500 transition-colors font-bold">
                {TERMINAL_THEME.symbols.bullet}
              </span>
              EXAMINE DESK
            </button>
            <button
              onClick={() => handleQuickAction("check the window")}
              className="py-2.5 px-4 flex items-center gap-3 border border-gray-600 bg-gray-900 text-gray-300 transition-all duration-200 font-mono text-xs uppercase tracking-widest group hover:border-amber-500/50 hover:text-amber-400 hover:bg-gray-800 rounded-sm"
              type="button"
            >
              <span className="text-gray-600 group-hover:text-amber-500 transition-colors font-bold">
                {TERMINAL_THEME.symbols.bullet}
              </span>
              CHECK WINDOW
            </button>
            <button
              onClick={() => handleQuickAction("Tom, what do you think?")}
              className="py-2.5 px-4 flex items-center gap-3 border border-gray-600 bg-gray-900 text-gray-300 transition-all duration-200 font-mono text-xs uppercase tracking-widest group hover:border-amber-500/50 hover:text-amber-400 hover:bg-gray-800 rounded-sm"
              type="button"
            >
              <span className="text-amber-700/60 group-hover:text-amber-400 transition-colors font-bold">
                {TERMINAL_THEME.symbols.bullet}
              </span>
              ASK TOM
            </button>
            <button
              onClick={() => setIsHandbookOpen(true)}
              className="py-2.5 px-4 flex items-center gap-3 border border-gray-600 bg-gray-900 text-gray-300 transition-all duration-200 font-mono text-xs uppercase tracking-widest group hover:border-purple-500/50 hover:text-purple-400 hover:bg-gray-800 rounded-sm"
              type="button"
            >
              <span className="text-purple-700/60 group-hover:text-purple-400 transition-colors font-bold">
                {TERMINAL_THEME.symbols.bullet}
              </span>
              HANDBOOK
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            <span>* Press Enter to submit</span>
            {!isTomInput(inputValue) && (
              <span className="ml-2">
                | Start with &quot;Tom&quot; to ask the ghost
              </span>
            )}
          </div>

          {/* Loading indicators */}
          <div className="text-xs font-mono uppercase">
            {tomLoading ? (
              <span className="text-amber-500 animate-pulse">
                Tom processing...
              </span>
            ) : isLoading ? (
              <span className="text-gray-400 animate-pulse">Analyzing...</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Auror's Handbook Modal (Phase 4.5) */}
      <AurorHandbook
        isOpen={isHandbookOpen}
        onClose={() => setIsHandbookOpen(false)}
        onSelectSpell={handleSpellSelect}
      />
    </Card>
  );
}
