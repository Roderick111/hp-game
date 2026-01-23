/**
 * BriefingConversation Component
 *
 * Displays Q&A history from briefing conversation with Moody:
 * - Player questions with detective styling (blue border-left)
 * - Moody answers with witness styling (amber border-left)
 * - Scrollable container for many exchanges
 *
 * Uses dynamic theme for consistent terminal aesthetic.
 *
 * @module components/BriefingConversation
 * @since Phase 3.5
 */

import { useTheme } from '../context/ThemeContext';
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
  const { theme } = useTheme();

  if (conversation.length === 0) {
    return null;
  }

  const charTheme = theme.colors.character;
  const messageStyles = theme.components.message.witness;

  return (
    <div
      className={`space-y-4 max-h-64 overflow-y-auto pr-2 scrollbar-thin ${theme.colors.bg.primary}`}
      role="log"
      aria-label="Conversation history with Moody"
    >
      {conversation.map((exchange, index) => (
        <div key={index} className="space-y-3">
          {/* Player Question - Detective styling */}
          <div className={messageStyles.wrapperPlayer}>
            <span className={`${messageStyles.label} ${charTheme.detective.prefix}`}>
              {theme.speakers.detective.prefix} DETECTIVE
            </span>
            <p className={`${messageStyles.text} mt-1 whitespace-pre-wrap`}>
              "{exchange.question}"
            </p>
          </div>

          {/* Moody Answer - Witness styling */}
          <div className={messageStyles.wrapperWitness}>
            <span className={`${messageStyles.label} ${charTheme.witness.prefix}`}>
              {theme.speakers.witness.format('Moody')}
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
