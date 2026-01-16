/**
 * BriefingConversation Component
 *
 * Displays Q&A history from briefing conversation with Moody:
 * - Player questions with detective styling (blue border-left)
 * - Moody answers with witness styling (amber border-left)
 * - Scrollable container for many exchanges
 *
 * Uses TERMINAL_THEME for consistent terminal aesthetic.
 *
 * @module components/BriefingConversation
 * @since Phase 3.5
 */

import { TERMINAL_THEME } from '../styles/terminal-theme';
import type { BriefingConversation as BriefingConversationType } from '../types/investigation';

// ============================================
// Types
// ============================================

export interface BriefingConversationProps {
  /** Q&A conversation history */
  conversation: BriefingConversationType[];
}

// ============================================
// Component
// ============================================

export function BriefingConversation({ conversation }: BriefingConversationProps) {
  if (conversation.length === 0) {
    return null;
  }

  const theme = TERMINAL_THEME.colors.character;
  const messageStyles = TERMINAL_THEME.components.message.witness;

  return (
    <div
      className="space-y-4 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700"
      role="log"
      aria-label="Conversation history with Moody"
    >
      {conversation.map((exchange, index) => (
        <div key={index} className="space-y-3">
          {/* Player Question - Detective styling */}
          <div className={messageStyles.wrapperPlayer}>
            <span className={`${messageStyles.label} ${theme.detective.prefix}`}>
              {TERMINAL_THEME.speakers.detective.prefix} DETECTIVE
            </span>
            <p className={`${messageStyles.text} mt-1 whitespace-pre-wrap`}>
              "{exchange.question}"
            </p>
          </div>

          {/* Moody Answer - Witness styling */}
          <div className={messageStyles.wrapperWitness}>
            <span className={`${messageStyles.label} ${theme.witness.prefix}`}>
              {TERMINAL_THEME.speakers.witness.format('Moody')}
            </span>
            <p className={`${messageStyles.text} mt-1 whitespace-pre-wrap leading-relaxed`}>
              {exchange.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
