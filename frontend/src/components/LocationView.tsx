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
import { investigate, isApiError } from "../api/client";
import { AurorHandbook } from "./AurorHandbook";
import { TERMINAL_THEME } from "../styles/terminal-theme";
import type {
  LocationResponse,
  ConversationItem,
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
  const historyContainerRef = useRef<HTMLDivElement>(null);

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
    // Scroll to bottom when new messages arrive
    const currentLength = unifiedMessages.length;
    const prevLength = prevMessagesLengthRef.current;

    if (currentLength > prevLength) {
      // Scroll only the container, not the entire page
      // Use setTimeout to ensure DOM has updated before scrolling
      if (historyContainerRef.current) {
        setTimeout(() => {
          if (historyContainerRef.current) {
            historyContainerRef.current.scrollTo({
              top: historyContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 0);
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
      // Optimized: avoid creating intermediate arrays when possible
      setHistory((prev) => {
        // Fast path: under limit, just append
        if (prev.length < MAX_HISTORY_LENGTH) {
          return [...prev, historyItem];
        }
        // At/over limit: slice first to avoid double allocation
        // slice(1) removes first element, then spread adds new item
        return [...prev.slice(1), historyItem];
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
      setError(
        isApiError(err)
          ? err.message
          : "An unexpected error occurred. Please try again.",
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
      <Card className={TERMINAL_THEME.components.card.base}>
        <div className="flex items-center justify-center py-8">
          <div className={`${TERMINAL_THEME.animation.pulse} ${TERMINAL_THEME.colors.text.tertiary}`}>Loading location...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={TERMINAL_THEME.components.card.base}>
      {/* Location Header */}
      <div className="mb-0">
        <h2 className={TERMINAL_THEME.typography.header}>
          {locationData.name}
        </h2>
        <p className={`${TERMINAL_THEME.typography.bodySm} ${TERMINAL_THEME.colors.text.muted} mt-2 whitespace-normal leading-relaxed`}>
          {locationData.description}
        </p>
      </div>

      <div className={`border-t ${TERMINAL_THEME.colors.border.separator} mt-3 mb-6`}></div>

      {/* Conversation History - Unified Message Rendering (Phase 4.1) */}
      {unifiedMessages.length > 0 && (
        <div
          ref={historyContainerRef}
          className="mb-4 space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 pr-2"
        >
          {/* Render all messages in chronological order */}
          {unifiedMessages.map((message) => {
            // Player action
            if (message.type === "player") {
              return (
                <div
                  key={message.key}
                  className={TERMINAL_THEME.components.message.player.wrapper}
                >
                  <p className={TERMINAL_THEME.components.message.player.text}>
                    <span className={TERMINAL_THEME.components.message.player.prefix}>{TERMINAL_THEME.symbols.inputPrefix}</span> {message.text}
                  </p>
                </div>
              );
            }

            // Narrator response
            if (message.type === "narrator") {
              return (
                <div
                  key={message.key}
                  className={TERMINAL_THEME.components.message.narrator.wrapper}
                >
                  <p className={TERMINAL_THEME.components.message.narrator.text}>
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
                  className={TERMINAL_THEME.components.message.evidence.wrapper}
                >
                  <div className="text-xs">
                    {message.evidenceIds.map((evidenceId) => (
                      <span
                        key={evidenceId}
                        className={TERMINAL_THEME.components.message.evidence.tag}
                      >
                        {TERMINAL_THEME.messages.evidenceDiscovered(evidenceId)}
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
                  className={TERMINAL_THEME.components.message.tom.wrapper}
                >
                  <p className={TERMINAL_THEME.components.message.tom.text}>
                    <span className={TERMINAL_THEME.components.message.tom.label}>{TERMINAL_THEME.speakers.tom.prefix}</span>
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
        <div className={`mb-4 p-3 ${TERMINAL_THEME.colors.state.error.bg} border ${TERMINAL_THEME.colors.state.error.border} rounded ${TERMINAL_THEME.colors.state.error.text} text-sm uppercase tracking-widest flex justify-between items-center`}>
          <span>
            <span className="font-bold">{TERMINAL_THEME.messages.error("")}</span>{error}
          </span>
        </div>
      )}

      <div className={`border-t ${TERMINAL_THEME.colors.border.separator} mt-4 mb-6`}></div>

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
            <span className={`text-xs ${TERMINAL_THEME.colors.character.tom.label} font-mono ${TERMINAL_THEME.animation.pulse} uppercase tracking-widest font-bold`}>
              {TERMINAL_THEME.messages.spiritResonance("THORNFIELD")}
            </span>
          )}
        </div>

        {/* Input with witness-style absolute prefix and dynamic border */}
        <div className={TERMINAL_THEME.components.input.wrapper}>
          <div className={TERMINAL_THEME.components.input.prefix}>
            {TERMINAL_THEME.symbols.inputPrefix}
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
            className={`${TERMINAL_THEME.components.input.field}
                       ${isTomInput(inputValue)
                ? TERMINAL_THEME.components.input.borderSpecial
                : TERMINAL_THEME.components.input.borderDefault
              }`}
            aria-label="Enter your investigation action or talk to Tom"
          />
          <button
            onClick={() => void handleSubmit()}
            disabled={isLoading || tomLoading || !inputValue.trim()}
            className={TERMINAL_THEME.components.input.sendButton}
            title="Submit Action (Enter)"
            aria-label="Submit Action"
          >
            SEND
          </button>
        </div>

        {/* Terminal Quick Actions */}
        <div className="mt-4 mb-2 space-y-2">
          <div className={TERMINAL_THEME.typography.caption}>
            Quick Actions:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickAction("examine the desk")}
              className={TERMINAL_THEME.components.button.terminalAction}
              type="button"
            >
              <span className="text-gray-600 group-hover:text-amber-500 transition-colors font-bold">
                {TERMINAL_THEME.symbols.bullet}
              </span>
              EXAMINE DESK
            </button>
            <button
              onClick={() => handleQuickAction("check the window")}
              className={TERMINAL_THEME.components.button.terminalAction}
              type="button"
            >
              <span className="text-gray-600 group-hover:text-amber-500 transition-colors font-bold">
                {TERMINAL_THEME.symbols.bullet}
              </span>
              CHECK WINDOW
            </button>
            <button
              onClick={() => handleQuickAction("Tom, what do you think?")}
              className={TERMINAL_THEME.components.button.terminalAction}
              type="button"
            >
              <span className="text-amber-700/60 group-hover:text-amber-400 transition-colors font-bold">
                {TERMINAL_THEME.symbols.bullet}
              </span>
              ASK TOM
            </button>
            <button
              onClick={() => setIsHandbookOpen(true)}
              className={`${TERMINAL_THEME.components.button.terminalAction} hover:border-purple-500/50 hover:text-purple-400`}
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
          <div className={TERMINAL_THEME.typography.helper}>
            <span>* Press Enter to submit</span>
            {!isTomInput(inputValue) && (
              <span className="ml-2">
                | Start with &quot;Tom&quot; to ask the ghost
              </span>
            )}
          </div>

          {/* Loading indicators */}
          <div className={`${TERMINAL_THEME.typography.helper} uppercase`}>
            {tomLoading ? (
              <span className={`${TERMINAL_THEME.colors.character.tom.label} ${TERMINAL_THEME.animation.pulse}`}>
                Tom processing...
              </span>
            ) : isLoading ? (
              <span className={`${TERMINAL_THEME.colors.text.tertiary} ${TERMINAL_THEME.animation.pulse}`}>Analyzing...</span>
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
