/**
 * TomChatInput Component
 *
 * Input component that detects "tom" prefix and routes messages:
 * - Messages starting with "tom" -> onTomMessage (direct Tom chat)
 * - Other messages -> onNarratorMessage (regular investigation)
 *
 * @module components/TomChatInput
 * @since Phase 4.1
 */

import { useState, useCallback, useRef, useEffect, forwardRef } from 'react';

// ============================================
// Types
// ============================================

interface TomChatInputProps {
  /** Callback when message is for Tom (detected "tom" prefix) */
  onTomMessage: (message: string) => void;
  /** Callback when message is for narrator (no "tom" prefix) */
  onNarratorMessage: (message: string) => void;
  /** Whether input is disabled (during loading) */
  disabled?: boolean;
  /** Whether Tom is currently processing */
  tomLoading?: boolean;
  /** Whether narrator is currently processing */
  narratorLoading?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
}

// ============================================
// Regex for detecting Tom messages
// ============================================

/**
 * Matches messages that start with "tom" followed by comma, colon, or whitespace
 * Case insensitive
 * Examples: "Tom, what do you think?", "tom: help me", "TOM should I trust her?"
 */
const TOM_PREFIX_REGEX = /^tom[,:\s]+/i;

/**
 * Check if a message is directed at Tom
 */
function isTomMessage(input: string): boolean {
  return TOM_PREFIX_REGEX.test(input.trim());
}

/**
 * Strip the "tom" prefix from a message
 */
function stripTomPrefix(input: string): string {
  return input.trim().replace(TOM_PREFIX_REGEX, '').trim();
}

// ============================================
// Component
// ============================================

export const TomChatInput = forwardRef<HTMLTextAreaElement, TomChatInputProps>(
  (
    {
      onTomMessage,
      onNarratorMessage,
      disabled = false,
      tomLoading = false,
      narratorLoading = false,
      placeholder = "> Type actions or 'Tom, <question>' to talk to Tom...",
      className = '',
    },
    ref
  ) => {
    // State
    const [input, setInput] = useState('');
    const [isTomTarget, setIsTomTarget] = useState(false);

    // Internal ref (fallback if no ref provided)
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    // Detect if input is for Tom (for visual feedback)
    useEffect(() => {
      setIsTomTarget(isTomMessage(input));
    }, [input]);

    // Handle form submission
    const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedInput = input.trim();
        if (!trimmedInput) return;

        if (isTomMessage(trimmedInput)) {
          // Route to Tom (strip prefix)
          const message = stripTomPrefix(trimmedInput);
          if (message) {
            onTomMessage(message);
          }
        } else {
          // Route to narrator
          onNarratorMessage(trimmedInput);
        }

        // Clear input
        setInput('');
        setIsTomTarget(false);
      },
      [input, onTomMessage, onNarratorMessage]
    );

    // Handle keyboard submit (Ctrl+Enter or Cmd+Enter)
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !disabled) {
          e.preventDefault();
          handleSubmit(e);
        }
      },
      [handleSubmit, disabled]
    );

    // Combined loading state
    const isLoading = tomLoading || narratorLoading || disabled;


    return (
      <form onSubmit={handleSubmit} className={`space-y-2 ${className}`}>
        {/* Input label with dynamic target indicator */}
        <div className="flex items-center justify-between">
          <label
            htmlFor="action-input"
            className="block text-xs text-gray-500 uppercase tracking-wider"
          >
            What do you do?
          </label>
          {isTomTarget && (
            <span className="text-xs text-amber-400 font-mono animate-pulse">
              Talking to Tom...
            </span>
          )}
        </div>

        {/* Textarea input */}
        <textarea
          ref={textareaRef}
          id="action-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
          disabled={isLoading}
          className={`
            w-full bg-gray-900 text-gray-100 border rounded-sm p-3
            placeholder-gray-600 focus:outline-none resize-none
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200 text-sm font-mono tracking-wide
            ${isTomTarget
              ? 'border-amber-600/50 focus:border-amber-500 focus:bg-gray-800'
              : 'border-gray-600 focus:border-gray-400 focus:bg-gray-800'
            }
          `}
          aria-label="Enter your investigation action or talk to Tom"
        />

        {/* Footer with hints and loading states */}
        <div className="flex items-center justify-between text-xs">
          <div className="text-gray-500">
            <span>Press Ctrl+Enter to submit</span>
            {!isTomTarget && (
              <span className="ml-2 text-amber-500/70">
                | Prefix with &quot;Tom&quot; to ask him
              </span>
            )}
          </div>

          {/* Loading indicators */}
          {tomLoading && (
            <span className="flex items-center text-amber-400 font-mono">
              <span className="animate-spin mr-2">*</span>
              Tom thinking...
            </span>
          )}
          {narratorLoading && !tomLoading && (
            <span className="flex items-center text-green-400 font-mono">
              <span className="animate-spin mr-2">*</span>
              Investigating...
            </span>
          )}
        </div>
      </form>
    );
  }
);

TomChatInput.displayName = 'TomChatInput';
