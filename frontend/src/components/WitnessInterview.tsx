/**
 * WitnessInterview Component
 *
 * Main witness interrogation interface with a dual-pane layout:
 * - Left Pane: Conversation history and input
 * - Right Pane: Witness profile, trust meter, and quick actions
 *
 * Uses strict TerminalPanel styling with formalized character colors.
 *
 * @module components/WitnessInterview
 * @since Phase 2 (Refactored Phase 5.3.1)
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import type {
  WitnessInfo,
  WitnessConversationItem,
} from "../types/investigation";
import { generateAsciiBar } from "../styles/terminal-theme";
import { useTheme } from "../context/ThemeContext";

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
}

function TrustMeter({ trust }: TrustMeterProps) {
  const { theme } = useTheme();
  return (
    <div className={theme.components.trustMeter.wrapper}>
      <div className={theme.components.trustMeter.container}>
        <span className={theme.components.trustMeter.label}>
          TRUST LEVEL:
        </span>
        <span className={theme.components.trustMeter.getColor(trust)}>
          {generateAsciiBar(trust, 20)} {trust}%
        </span>
      </div>
    </div>
  );
}

/**
 * Portrait image component with convention-based auto-loading.
 * Loads portraits from /portraits/{witnessId}.{avif,webp,png}
 * Uses modern formats with automatic fallback.
 * Falls back to placeholder if image doesn't exist.
 */
interface PortraitImageProps {
  witnessId: string;
  witnessName: string;
}

function PortraitImage({ witnessId, witnessName }: PortraitImageProps) {
  const { theme } = useTheme();
  const [hasError, setHasError] = React.useState(false);
  const [imgSrc, setImgSrc] = React.useState<string | null>(null);

  // Try formats in order: AVIF → WebP → PNG
  React.useEffect(() => {
    setHasError(false);
    setImgSrc(null);

    const formats = ['avif', 'webp', 'png'];
    let cancelled = false;

    const tryFormat = async (index: number) => {
      if (cancelled || index >= formats.length) {
        if (!cancelled && index >= formats.length) {
          setHasError(true);
        }
        return;
      }

      const url = `/portraits/${witnessId}.${formats[index]}`;

      try {
        const response = await fetch(url, { method: 'HEAD' });
        const contentType = response.headers.get('Content-Type') ?? '';
        // Check both response.ok AND that Content-Type is an image
        // (Vite returns 200 with text/html for missing files)
        if (!cancelled && response.ok && contentType.startsWith('image/')) {
          setImgSrc(url);
          return;
        }
      } catch {
        // Format not available, try next
      }

      if (!cancelled) {
        void tryFormat(index + 1);
      }
    };

    void tryFormat(0);

    return () => {
      cancelled = true;
    };
  }, [witnessId]);

  if (hasError) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${theme.colors.bg.primary}`}>
        <span className={`text-3xl ${theme.colors.text.muted} font-mono`}>?</span>
      </div>
    );
  }

  if (!imgSrc) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${theme.colors.bg.primary}`}>
        <span className={`text-xl ${theme.colors.text.muted} font-mono animate-pulse`}>...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden relative">
      <img
        src={imgSrc}
        alt={witnessName}
        className="w-full h-full object-cover transition-all duration-500"
        onError={() => setHasError(true)}
      />
      {/* Scanline overlay */}
      <div
        className={`absolute inset-0 ${theme.effects.scanlines}`}
      ></div>
    </div>
  );
}

interface ConversationBubbleProps {
  item: WitnessConversationItem;
  witnessName: string;
}

function ConversationBubble({ item, witnessName }: ConversationBubbleProps) {
  const { theme } = useTheme();
  const isEvidencePresentation = item.question.startsWith(
    "[Presented evidence:",
  );
  const charTheme = theme.colors.character;
  const msgTheme = theme.components.message.witness;

  return (
    <div className={`space-y-4 ${theme.animation.fadeIn} font-mono`}>
      {/* Player message (right-aligned) */}
      <div className="flex justify-end group">
        <div className={msgTheme.wrapperPlayer}>
          <div className="text-sm leading-relaxed">
            <span
              className={`${msgTheme.label} ${charTheme.detective.prefix} mb-1 block`}
            >
              {theme.speakers.detective.prefix}{" "}
              {theme.speakers.detective.label}
            </span>
            {isEvidencePresentation ? (
              <span
                className={`italic ${theme.colors.text.secondary} opacity-90`}
              >
                [PRESENTED EVIDENCE]:{" "}
                {item.question
                  .replace("[Presented evidence: ", "")
                  .replace("]", "")}
              </span>
            ) : (
              <span className={theme.colors.text.secondary}>
                "{item.question}"
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Witness message (left-aligned) */}
      <div className="flex justify-start">
        <div className={msgTheme.wrapperWitness}>
          <div className="flex justify-between items-baseline mb-1">
            <span className={`${msgTheme.label} ${charTheme.witness.prefix}`}>
              {theme.speakers.witness.format(witnessName)}
            </span>
            {item.trust_delta !== undefined && item.trust_delta !== 0 && (
              <span
                className={`text-[10px] ml-2 ${item.trust_delta > 0 ? theme.colors.state.success.text : theme.colors.state.error.text}`}
              >
                [{item.trust_delta > 0 ? "+" : ""}
                {item.trust_delta}]
              </span>
            )}
          </div>
          <p className={msgTheme.text}>{item.response}</p>
        </div>
      </div>
    </div>
  );
}

interface SecretRevealedToastProps {
  secrets: string[];
}

function SecretRevealedToast({ secrets }: SecretRevealedToastProps) {
  const { theme } = useTheme();
  if (secrets.length === 0) return null;
  const sysTheme = theme.colors.character.system;

  return (
    <div
      className={`mb-4 p-3 border ${sysTheme.border} ${sysTheme.bg} ${theme.animation.pulseSubtle}`}
    >
      <div className="flex items-start gap-3">
        <span className={`${sysTheme.prefix} text-base mt-0.5 font-bold`}>
          {theme.speakers.system.prefix}
        </span>
        <div>
          <p
            className={`text-[10px] ${sysTheme.prefix} font-bold uppercase tracking-widest mb-1`}
          >
            {theme.messages.secretDiscovered}
          </p>
          <ul className={`text-sm ${sysTheme.text} space-y-1 font-mono`}>
            {secrets.map((secret) => (
              <li key={secret} className="flex items-start gap-2">
                <span className={sysTheme.prefix}>-</span>
                <span>{secret}</span>
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
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState("");
  const [showEvidenceMenu, setShowEvidenceMenu] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);
  const historyContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  // Use direct container scroll to avoid scrolling the entire page
  useEffect(() => {
    if (historyContainerRef.current) {
      historyContainerRef.current.scrollTop =
        historyContainerRef.current.scrollHeight;
    }
  }, [conversation]);

  // Handle question submission
  const handleSubmit = useCallback(async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || loading) return;

    setInputValue("");
    try {
      await onAskQuestion(trimmedInput);
    } catch (err) {
      // Error handling is managed by parent component via error prop
      // Re-throw to allow parent to catch if needed, or log silently
      console.error("[WitnessInterview] Failed to submit question:", err);
    }
    inputRef.current?.focus();
  }, [inputValue, loading, onAskQuestion]);

  // Handle keyboard submit (Enter to submit, Shift+Enter for newline)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !loading) {
        e.preventDefault();
        void handleSubmit();
      }
    },
    [handleSubmit, loading],
  );

  // Handle evidence presentation
  const handlePresentEvidence = useCallback(
    async (evidenceId: string) => {
      setShowEvidenceMenu(false);
      try {
        await onPresentEvidence(evidenceId);
      } catch (err) {
        // Error handling is managed by parent component via error prop
        console.error("[WitnessInterview] Failed to present evidence:", err);
      }
    },
    [onPresentEvidence],
  );

  return (
    <div className={`font-mono ${theme.colors.text.secondary} flex flex-col md:flex-row h-[85vh] md:h-[750px] gap-0 ${theme.colors.bg.primary} w-full shadow-lg`}>
      {/* LEFT PANE: Chat Interface */}
      <div className={`flex-1 flex flex-col min-w-0 min-h-0 md:border-r ${theme.colors.border.default} ${theme.colors.bg.primary} relative overflow-hidden`}>
        {/* Conversation History */}
        <div
          ref={historyContainerRef}
          className={`flex-1 min-h-0 overflow-y-auto p-6 space-y-8 scrollbar-thin ${theme.colors.bg.primary}`}
        >
          {conversation.length === 0 ? (
            <div className={`h-full flex flex-col items-center justify-center ${theme.colors.text.muted} space-y-4`}>
              <span className="text-4xl font-bold opacity-10">
                {theme.symbols.blockFilled}
              </span>
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest opacity-50 mb-1">
                  Interrogation Log: Unwritten
                </p>
                <p className={`text-[10px] ${theme.colors.text.separator}`}>
                  Awaiting initial inquiry to commence transcripts.
                </p>
              </div>
            </div>
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

        {/* Secrets Toast - above input area */}
        <SecretRevealedToast secrets={secretsRevealed} />

        {/* Error Display - above input area */}
        {error && (
          <div
            className={`mx-4 mb-2 p-2 border ${theme.colors.state.error.border} ${theme.colors.state.error.bgLight} flex justify-between items-center ${theme.animation.fadeIn}`}
          >
            <span
              className={`${theme.colors.state.error.text} text-xs font-mono uppercase`}
            >
              <span className="font-bold">
                {theme.messages.error("")}
              </span>
              {error}
            </span>
            {onClearError && (
              <button
                onClick={onClearError}
                className={`${theme.colors.state.error.text} hover:brightness-90 px-2 font-bold text-xs`}
              >
                DISMISS
              </button>
            )}
          </div>
        )}

        {/* Input Area - Docked to bottom */}
        <div className="mt-auto pt-5 pb-2 px-4">
          <div className={theme.components.input.wrapper}>
            <div className={theme.components.input.prefix}>
              {theme.symbols.inputPrefix}
            </div>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Query witness ${witness.name.split(" ")[0]}...`}
              rows={2}
              disabled={loading}
              className={`${theme.components.input.field} ${theme.components.input.borderDefault} pr-20`}
            />
            <button
              onClick={() => void handleSubmit()}
              disabled={loading || !inputValue.trim()}
              className={theme.components.input.sendButton}
            >
              SEND
            </button>
          </div>
        </div>
      </div>
      {/* RIGHT PANE: Profile & Actions */}
      <div className={`w-full md:w-[320px] lg:w-[380px] ${theme.colors.bg.primary} flex flex-col`}>
        {/* Profile Header */}
        <div className={`p-6 flex flex-col items-center ${theme.colors.bg.semiTransparent} border-b ${theme.colors.border.default}`}>
          {/* Portrait using standardized styles */}
          <div
            className={`w-48 h-48 mb-3 ${theme.colors.bg.primary} border ${theme.colors.border.default} p-[1px] shadow-lg relative group`}
          >
            {/* Corner brackets decoration */}
            <div
              className={theme.effects.cornerBrackets.topLeft}
            ></div>
            <div
              className={theme.effects.cornerBrackets.topRight}
            ></div>
            <div
              className={theme.effects.cornerBrackets.bottomLeft}
            ></div>
            <div
              className={theme.effects.cornerBrackets.bottomRight}
            ></div>

            {/* Portrait - auto-generated from witness ID */}
            <PortraitImage witnessId={witness.id} witnessName={witness.name} />
          </div>

          <h2
            className={`${theme.typography.header} tracking-[0.2em] mb-1`}
          >
            {witness.name}
          </h2>

          <TrustMeter trust={trust} />
        </div>

        {/* Personality - Simple text, no box */}
        <div className="flex-1 p-4 overflow-y-auto">
          {witness.personality && (
            <p className={`text-xs ${theme.colors.text.muted} leading-relaxed font-mono italic`}>
              "{witness.personality}"
            </p>
          )}
        </div>

        {/* Footer Actions - Single container for bottom alignment */}
        <div className="mt-auto">
          {/* ACTIONS Header */}
          <div className="px-4">
            <div className={theme.components.sectionSeparator.wrapper}>
              <div
                className={theme.components.sectionSeparator.line}
              ></div>
              <span
                className={theme.components.sectionSeparator.label}
              >
                ACTIONS
              </span>
              <div
                className={theme.components.sectionSeparator.line}
              ></div>
            </div>
          </div>

          {/* Button - with pb-4 to match left pane input */}
          <div className="pb-4 px-4">
            <div className="relative">
              <button
                onClick={() => setShowEvidenceMenu(!showEvidenceMenu)}
                disabled={loading || discoveredEvidence.length === 0}
                className={`w-full py-3 px-4 flex items-center justify-between border transition-all duration-200 font-mono text-xs uppercase tracking-widest group
                  ${
                    showEvidenceMenu
                      ? `${theme.colors.bg.hover} ${theme.colors.border.hover} ${theme.colors.text.primary} shadow-lg transform -translate-y-px`
                      : `${theme.colors.bg.primary} ${theme.colors.border.default} ${theme.colors.text.tertiary} ${theme.colors.interactive.borderHover} ${theme.colors.interactive.hover} hover:brightness-90`
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="font-bold flex items-center gap-2">
                  {theme.symbols.current} PRESENT EVIDENCE
                </span>
                <span className={`${theme.colors.bg.semiTransparent} px-2 py-0.5 text-[10px] border ${theme.colors.border.default} transition-colors ${theme.colors.text.muted}`}>
                  {discoveredEvidence.length.toString().padStart(2, "0")}
                </span>
              </button>

              {/* Dropup Menu */}
              {showEvidenceMenu && (
                <div
                  className={`absolute bottom-full left-0 right-0 mb-2 ${theme.colors.bg.primary} border ${theme.colors.border.default} shadow-xl z-20 max-h-60 overflow-y-auto ${theme.animation.slideUp}`}
                >
                  <div className={`sticky top-0 ${theme.colors.bg.hover} p-2 border-b ${theme.colors.border.default} text-[10px] ${theme.colors.text.secondary} uppercase tracking-widest text-center font-bold`}>
                    SELECT EVIDENCE ITEM
                  </div>
                  {discoveredEvidence.map((evidenceId) => (
                    <button
                      key={evidenceId}
                      onClick={() => void handlePresentEvidence(evidenceId)}
                      disabled={loading}
                      className={`w-full px-4 py-3 text-left text-xs font-mono ${theme.colors.text.tertiary} ${theme.colors.bg.primary} ${theme.colors.bg.hoverClass} ${theme.colors.interactive.hover} border-b ${theme.colors.border.default} last:border-0 transition-colors uppercase tracking-wider flex items-center gap-3 group`}
                    >
                      <span className={`${theme.colors.text.muted} ${theme.colors.interactive.hover} text-[10px] transition-colors`}>
                        {theme.symbols.bullet}
                      </span>
                      {evidenceId}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>{" "}
      {/* Close mt-auto wrapper */}
    </div>
  );
}
