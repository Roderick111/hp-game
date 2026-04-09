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
import { investigateStream, isApiError } from "../api/client";
import { AurorHandbook } from "./AurorHandbook";
import { renderInlineMarkdown } from "../utils/renderInlineMarkdown";
import { useTheme } from '../context/useTheme';
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
  /** Whether to show the location header (name, description) - Phase 6.5 */
  showLocationHeader?: boolean;
  /** Player ID for API calls */
  playerId?: string;
  /** Whether to show hints/quick actions (default: true) */
  hintsEnabled?: boolean;
  /** Trigger counter to open handbook from external source */
  handbookTrigger?: number;
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
  showLocationHeader = true,
  playerId = 'default',
  hintsEnabled = true,
  handbookTrigger,
}: LocationViewProps) {
  // Theme hook for dynamic styling
  const { theme } = useTheme();

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
      setTimeout(() => {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth',
        });
      }, 0);
    }

    // Update ref for next render
    prevMessagesLengthRef.current = currentLength;
  }, [unifiedMessages, locationId]);

  // Auto-scroll during streaming (content growing in last message)
  useEffect(() => {
    if (!isLoading) return;
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  }, [isLoading, history]);

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

  // External handbook trigger (from sidebar) — only open on increment, not on mount
  const prevHandbookTrigger = useRef(handbookTrigger);
  useEffect(() => {
    if (handbookTrigger !== prevHandbookTrigger.current && handbookTrigger && handbookTrigger > 0) {
      setIsHandbookOpen(true);
    }
    prevHandbookTrigger.current = handbookTrigger;
  }, [handbookTrigger]);

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

    // Create a placeholder history item for streaming
    const itemId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const streamingItem: ConversationItem = {
      id: itemId,
      action: trimmedInput,
      response: "",
      evidence_discovered: [],
      timestamp: new Date(),
    };

    setHistory((prev) => {
      if (prev.length < MAX_HISTORY_LENGTH) {
        return [...prev, streamingItem];
      }
      return [...prev.slice(1), streamingItem];
    });

    setInputValue("");
    inputRef.current?.focus();

    try {
      await investigateStream(
        {
          player_input: trimmedInput,
          case_id: caseId,
          location_id: locationId,
          player_id: playerId,
          slot: 'autosave',
        },
        {
          onChunk: (text) => {
            setHistory((prev) =>
              prev.map((item) =>
                item.id === itemId
                  ? { ...item, response: item.response + text }
                  : item,
              ),
            );
          },
          onDone: (data) => {
            const newEvidence = (data.new_evidence as string[] | undefined) ?? [];
            if (newEvidence.length > 0) {
              setHistory((prev) =>
                prev.map((item) =>
                  item.id === itemId
                    ? { ...item, evidence_discovered: newEvidence }
                    : item,
                ),
              );
              const toReport = newEvidence.filter(
                (id) => !discoveredEvidence.includes(id),
              );
              if (toReport.length > 0) {
                onEvidenceDiscovered(toReport);
              }
            }
            // Log metadata (dev only)
            if (import.meta.env.DEV) {
              const meta = data.meta as { model?: string; latency_ms?: number; is_spell?: boolean; spell_id?: string } | undefined;
              if (meta) {
                const parts = [`[${meta.model ?? '?'}]`, `${meta.latency_ms ?? '?'}ms`];
                if (meta.is_spell) parts.push(`spell:${meta.spell_id}`);
                console.log(`%c${parts.join(' · ')}`, 'color: #6b7280; font-size: 11px');
              }
            }
            setIsLoading(false);
          },
          onError: (errMsg) => {
            setError(errMsg);
            setIsLoading(false);
          },
        },
      );
    } catch (err) {
      setError(
        isApiError(err)
          ? err.message
          : "An unexpected error occurred. Please try again.",
      );
      setIsLoading(false);
    }
  }, [
    inputValue,
    caseId,
    locationId,
    playerId,
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
      <Card className={theme.components.card.base}>
        <div className="flex items-center justify-center py-8">
          <div className={`${theme.animation.pulse} ${theme.colors.text.tertiary}`}>Loading location...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={theme.components.card.base}>
      {/* Location Header - Conditionally shown (Phase 6.5: moved to LocationHeaderBar) */}
      {showLocationHeader && (
        <>
          <div className="mb-0">
            <h2 className={theme.typography.header}>
              {locationData.name}
            </h2>
            <p className={`${theme.typography.bodySm} ${theme.colors.text.muted} mt-2 whitespace-normal leading-relaxed`}>
              {locationData.description}
            </p>
          </div>

          <div className={`border-t ${theme.colors.border.separator} mt-3 mb-6`}></div>
        </>
      )}

      {/* Conversation History - Unified Message Rendering (Phase 4.1) */}
        <div
          ref={historyContainerRef}
          className="space-y-5 mb-4"
        >
          {/* Location description as first narrator message (only when header is hidden) */}
          {!showLocationHeader && locationData.description && (
            <div className={theme.components.message.narrator.wrapper}>
              <div className={`${theme.components.message.narrator.text} space-y-3`}>
                {locationData.description.split('\n').filter(Boolean).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          )}

          {/* Render all messages in chronological order */}
          {unifiedMessages.map((message) => {
            // Player action
            if (message.type === "player") {
              return (
                <div
                  key={message.key}
                  className={theme.components.message.player.wrapper}
                >
                  <p className={theme.components.message.player.text}>
                    <span className={theme.components.message.player.prefix}>{theme.symbols.inputPrefix}</span> {message.text}
                  </p>
                </div>
              );
            }

            // Narrator response
            if (message.type === "narrator") {
              const paragraphs = message.text.split('\n').filter(Boolean);
              return (
                <div
                  key={message.key}
                  className={theme.components.message.narrator.wrapper}
                >
                  <div className={`${theme.components.message.narrator.text} space-y-3`}>
                    {paragraphs.map((para, i) => (
                      <p key={i}>{renderInlineMarkdown(para)}</p>
                    ))}
                  </div>
                </div>
              );
            }

            // Evidence discovered
            if (message.type === "evidence" && message.evidenceIds) {
              return (
                <div
                  key={message.key}
                  className={theme.components.message.evidence.wrapper}
                >
                  <div className="text-xs">
                    {message.evidenceIds.map((evidenceId) => (
                      <span
                        key={evidenceId}
                        className={theme.components.message.evidence.tag}
                      >
                        {theme.messages.evidenceDiscovered(evidenceId)}
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
                  className={theme.components.message.tom.wrapper}
                >
                  <p className={theme.components.message.tom.text}>
                    <span className={theme.components.message.tom.label}>{theme.speakers.tom.prefix}</span>
                    {renderInlineMarkdown(message.text)}
                  </p>
                </div>
              );
            }

            return null;
          })}

          <div ref={historyEndRef} />
        </div>

      {/* Error Display */}
      {error && (
        <div className={`mb-4 p-3 ${theme.colors.state.error.bg} border ${theme.colors.state.error.border} rounded ${theme.colors.state.error.text} text-sm uppercase tracking-widest flex justify-between items-center`}>
          <span>
            <span className="font-bold">{theme.messages.error("")}</span>{error}
          </span>
        </div>
      )}

      {/* Input Area — sticky bottom */}
      <div className={`relative sticky bottom-0 z-20 space-y-3 pt-4 pb-2 ${theme.colors.bg.primary}`}>
        {/* Fade gradient above input — dissolves content into input area */}
        <div className={`pointer-events-none absolute left-0 right-0 bottom-full h-8 bg-gradient-to-t ${theme.colors.gradient.fromBg} to-transparent`} />
        {/* Tom target indicator */}
        {isTomInput(inputValue) && (
          <div className="flex items-center justify-end">
            <span className={`text-xs ${theme.colors.character.tom.label} ${theme.fonts.ui} ${theme.animation.pulse} uppercase tracking-widest font-bold`}>
              {theme.messages.spiritResonance("THORNFIELD")}
            </span>
          </div>
        )}

        {/* Input with witness-style absolute prefix and dynamic border */}
        <div className={theme.components.input.wrapper}>
          <div className={theme.components.input.prefix}>
            {theme.symbols.inputPrefix}
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
            className={`${theme.components.input.field}
                       ${isTomInput(inputValue)
                ? theme.components.input.borderSpecial
                : theme.components.input.borderDefault
              }`}
            aria-label="Enter your investigation action or talk to Tom"
          />
          <button
            onClick={() => void handleSubmit()}
            disabled={isLoading || tomLoading || !inputValue.trim()}
            className={theme.components.input.sendButton}
            title="Submit Action (Enter)"
            aria-label="Submit Action"
          >
            SEND
          </button>
        </div>

        {/* Quick Actions (shown when hints enabled) */}
        {hintsEnabled && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleQuickAction("examine the desk")}
              className={theme.components.button.terminalAction}
              type="button"
            >
              <span className={`${theme.colors.text.muted} ${theme.colors.interactive.hover} transition-colors font-bold`}>
                {theme.symbols.bullet}
              </span>
              EXAMINE DESK
            </button>
            <button
              onClick={() => handleQuickAction("check the window")}
              className={theme.components.button.terminalAction}
              type="button"
            >
              <span className={`${theme.colors.text.muted} ${theme.colors.interactive.hover} transition-colors font-bold`}>
                {theme.symbols.bullet}
              </span>
              CHECK WINDOW
            </button>
            <button
              onClick={() => handleQuickAction("Tom, what do you think?")}
              className={theme.components.button.terminalAction}
              type="button"
            >
              <span className={`${theme.colors.character.tom.prefix} ${theme.colors.interactive.hover} transition-colors font-bold`}>
                {theme.symbols.bullet}
              </span>
              ASK TOM
            </button>
          </div>
        )}

        {/* Loading indicators */}
        <div className={`${theme.typography.helper} uppercase text-right`}>
          {tomLoading ? (
            <span className={`${theme.colors.character.tom.label} ${theme.animation.pulse}`}>
              Tom processing...
            </span>
          ) : isLoading ? (
            <span className={`${theme.colors.text.tertiary} ${theme.animation.pulse}`}>Analyzing...</span>
          ) : null}
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
