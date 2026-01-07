/**
 * BriefingConversation Component
 *
 * Displays Q&A history from briefing conversation with Moody:
 * - Player questions with gray-700 background
 * - Moody answers with gray-800 background and amber text
 * - Scrollable container for many exchanges
 *
 * @module components/BriefingConversation
 * @since Phase 3.5
 */

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

  return (
    <div
      className="space-y-3 max-h-64 overflow-y-auto pr-2"
      role="log"
      aria-label="Conversation history with Moody"
    >
      {conversation.map((exchange, index) => (
        <div key={index} className="space-y-2">
          {/* Player Question */}
          <div className="bg-gray-700 rounded p-3">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              You:
            </span>
            <p className="text-sm text-gray-200 mt-1 whitespace-pre-wrap">
              {exchange.question}
            </p>
          </div>

          {/* Moody Answer */}
          <div className="bg-gray-800 border border-amber-900/50 rounded p-3">
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
              Moody:
            </span>
            <p className="text-sm text-amber-400/90 mt-1 whitespace-pre-wrap leading-relaxed">
              {exchange.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
