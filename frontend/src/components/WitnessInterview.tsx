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

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { WitnessInfo, WitnessConversationItem } from '../types/investigation';
import { TERMINAL_THEME, generateAsciiBar } from '../styles/terminal-theme';

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
  // Use theme colors for logical levels, but keep implementation mapped to theme
  const getTextColor = (level: number): string => {
    if (level < 30) return 'text-red-400';
    if (level < 70) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="w-full font-mono mt-4 mb-6 text-center">
      <div className="text-xs text-gray-500 tracking-widest border border-gray-700 bg-gray-800/30 p-2 rounded">
        <span className="font-bold mr-2 text-gray-400">TRUST LEVEL:</span>
        <span className={`${getTextColor(trust)}`}>
          {generateAsciiBar(trust, 20)} {trust}%
        </span>
      </div>
    </div>
  );
}

/**
 * Portrait image component with convention-based auto-loading.
 * Loads portraits from /portraits/{witnessId}.png
 * Falls back to placeholder if image doesn't exist.
 */
interface PortraitImageProps {
  witnessId: string;
  witnessName: string;
}

function PortraitImage({ witnessId, witnessName }: PortraitImageProps) {
  const [hasError, setHasError] = React.useState(false);
  const portraitUrl = `/portraits/${witnessId}.png`;

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <span className="text-3xl text-gray-700 font-mono">?</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden relative">
      <img
        src={portraitUrl}
        alt={witnessName}
        className="w-full h-full object-cover filter contrast-125 transition-all duration-500"
        onError={() => setHasError(true)}
      />
      {/* Scanline overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50"></div>
    </div>
  );
}

interface ConversationBubbleProps {
  item: WitnessConversationItem;
  witnessName: string;
}

function ConversationBubble({ item, witnessName }: ConversationBubbleProps) {
  const isEvidencePresentation = item.question.startsWith('[Presented evidence:');
  const theme = TERMINAL_THEME.colors.character;

  return (
    <div className="space-y-4 animate-fade-in font-mono">
      {/* Player message (right-aligned) */}
      <div className="flex justify-end group">
        <div className={`max-w-[85%] border-l ${theme.detective.border} pl-3 py-1`}>
          <div className="text-sm leading-relaxed">
            <span className={`text-xs ${theme.detective.prefix} uppercase tracking-wide mb-1 block font-bold`}>
              {'>'} DETECTIVE
            </span>
            {isEvidencePresentation ? (
              <span className="italic text-gray-300 opacity-90">
                [PRESENTED EVIDENCE]: {item.question.replace('[Presented evidence: ', '').replace(']', '')}
              </span>
            ) : (
              <span className="text-gray-200">
                "{item.question}"
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Witness message (left-aligned) */}
      <div className="flex justify-start">
        <div className={`max-w-[85%] border-l ${theme.witness.border} pl-3 py-1 bg-gray-900/30`}>
          <div className="flex justify-between items-baseline mb-1">
            <span className={`text-xs ${theme.witness.prefix} uppercase tracking-widest font-bold`}>
              :: {witnessName} ::
            </span>
            {item.trust_delta !== undefined && item.trust_delta !== 0 && (
              <span className={`text-[10px] ml-2 ${item.trust_delta > 0 ? 'text-green-500' : 'text-red-500'}`}>
                [{item.trust_delta > 0 ? '+' : ''}{item.trust_delta}]
              </span>
            )}
          </div>
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">
            {item.response}
          </p>
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
  const theme = TERMINAL_THEME.colors.character.system;

  return (
    <div className={`mb-4 p-3 border ${theme.border} ${theme.bg} animate-pulse-subtle`}>
      <div className="flex items-start gap-3">
        <span className={`${theme.prefix} text-base mt-0.5 font-bold`}>!</span>
        <div>
          <p className={`text-[10px] ${theme.prefix} font-bold uppercase tracking-widest mb-1`}>
            [ SECRET DISCOVERED ]
          </p>
          <ul className={`text-sm ${theme.text} space-y-1 font-mono`}>
            {secrets.map((secret) => (
              <li key={secret} className="flex items-start gap-2">
                <span className={theme.prefix}>-</span>
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
  const [inputValue, setInputValue] = useState('');
  const [showEvidenceMenu, setShowEvidenceMenu] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

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
    <div className="font-mono text-gray-200 flex flex-col md:flex-row h-[85vh] md:h-[750px] gap-0 bg-gray-900 w-full shadow-lg">

      {/* LEFT PANE: Chat Interface */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 md:border-r border-gray-700 bg-gray-900 relative overflow-hidden">


        {/* Conversation History */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          {conversation.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
              <span className="text-4xl font-bold opacity-10">{TERMINAL_THEME.symbols.blockFilled}</span>
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest opacity-50 mb-1">Log Empty</p>
                <p className="text-[10px] text-gray-700">Initiate questioning protocol to begin record.</p>
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
          <div className="mx-4 mb-2 p-2 border border-red-800 bg-red-900/10 flex justify-between items-center animate-fade-in">
            <span className="text-red-400 text-xs font-mono uppercase"><span className="font-bold">[ SYSTEM_ERROR ]</span> {error}</span>
            {onClearError && (
              <button onClick={onClearError} className="text-red-500 hover:text-red-300 px-2 font-bold text-xs">DISMISS</button>
            )}
          </div>
        )}

        {/* Input Area - Docked to bottom */}
        <div className="mt-auto pt-5 pb-2 px-4">
          <div className="relative group w-full">
            <div className="absolute top-3 left-3 text-gray-500 font-bold select-none">{'>'}</div>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Query witness ${witness.name.split(' ')[0]}...`}
              rows={2}
              disabled={loading}
              className="w-full bg-gray-900 text-gray-100 border border-gray-600 rounded-sm p-3 pl-8
                         placeholder-gray-600 focus:outline-none focus:border-gray-400 focus:bg-gray-800
                         resize-none disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors duration-200 text-sm font-mono tracking-wide"
            />
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Profile & Actions */}
      <div className="w-full md:w-[320px] lg:w-[380px] bg-gray-900 flex flex-col">

        {/* Profile Header */}
        <div className="p-6 flex flex-col items-center bg-gray-800/20 border-b border-gray-700">
          {/* Portrait using standardized styles */}
          <div className="w-48 h-48 mb-3 bg-black border border-gray-700 p-[1px] shadow-lg relative group">
            {/* Corner brackets decoration */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gray-400"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gray-400"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gray-400"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gray-400"></div>

            {/* Portrait - auto-generated from witness ID */}
            <PortraitImage witnessId={witness.id} witnessName={witness.name} />
          </div>

          <h2 className="text-white font-mono uppercase text-sm font-bold tracking-[0.2em] mb-1">
            {witness.name}
          </h2>

          <TrustMeter trust={trust} />
        </div>

        {/* Personality - Simple text, no box */}
        <div className="flex-1 p-4 overflow-y-auto">
          {witness.personality && (
            <p className="text-xs text-gray-500 leading-relaxed font-mono italic">
              "{witness.personality}"
            </p>
          )}
        </div>

        {/* Footer Actions - Single container for bottom alignment */}
        <div className="mt-auto">
          {/* ACTIONS Header */}
          <div className="px-4">
            <div className="flex items-center gap-3 mb-2 opacity-60">
              <div className="h-px bg-gray-600 flex-1"></div>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                ACTIONS
              </span>
              <div className="h-px bg-gray-600 flex-1"></div>
            </div>
          </div>

          {/* Button - with pb-4 to match left pane input */}
          <div className="pb-4 px-4">
            <div className="relative">
              <button
                onClick={() => setShowEvidenceMenu(!showEvidenceMenu)}
                disabled={loading || discoveredEvidence.length === 0}
                className={`w-full py-3 px-4 flex items-center justify-between border transition-all duration-200 font-mono text-xs uppercase tracking-widest group
                  ${showEvidenceMenu
                    ? 'bg-gray-800 border-gray-500 text-white shadow-lg transform -translate-y-px'
                    : 'bg-gray-900 border-gray-600 text-gray-300 hover:border-amber-500/50 hover:text-amber-400 hover:bg-gray-800'}
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-600 disabled:hover:text-gray-300 disabled:hover:bg-gray-900`}
              >
                <span className="font-bold flex items-center gap-2">
                  {TERMINAL_THEME.symbols.current} PRESENT EVIDENCE
                </span>
                <span className="bg-gray-800 px-2 py-0.5 text-[10px] border border-gray-700 group-hover:border-gray-500 transition-colors text-gray-400 group-hover:text-amber-400">
                  {discoveredEvidence.length.toString().padStart(2, '0')}
                </span>
              </button>

              {/* Dropup Menu */}
              {showEvidenceMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-900 border border-gray-600 shadow-xl z-20 max-h-60 overflow-y-auto animate-slide-up">
                  <div className="sticky top-0 bg-gray-800 p-2 border-b border-gray-600 text-[10px] text-gray-400 uppercase tracking-widest text-center font-bold">
                    SELECT EVIDENCE ITEM
                  </div>
                  {discoveredEvidence.map((evidenceId) => (
                    <button
                      key={evidenceId}
                      onClick={() => void handlePresentEvidence(evidenceId)}
                      disabled={loading}
                      className="w-full px-4 py-3 text-left text-xs font-mono text-gray-400 hover:bg-gray-800 hover:text-white border-b border-gray-800 last:border-0 transition-colors uppercase tracking-wider flex items-center gap-3 group"
                    >
                      <span className="text-gray-600 group-hover:text-amber-400 text-[10px] transition-colors">
                        {TERMINAL_THEME.symbols.bullet}
                      </span>
                      {evidenceId}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div> {/* Close mt-auto wrapper */}
    </div>
  );
}
