/**
 * useTomChat Hook
 *
 * Manages Tom Thornfield's LLM-powered ghost conversation system:
 * - Check for auto-comments after evidence discovery (30% chance)
 * - Handle direct chat ("Tom, what do you think?")
 * - Returns tom_ghost messages with timestamps for ordering
 * - Non-blocking async (errors don't break investigation)
 *
 * @module hooks/useTomChat
 * @since Phase 4.1
 */

import { useState, useCallback } from 'react';
import { checkTomAutoComment, sendTomChat } from '../api/client';
import type { Message } from '../types/investigation';

// ============================================
// Types
// ============================================

export interface TomMessage extends Extract<Message, { type: 'tom_ghost' }> {
  /** Response mode (auto_helpful, auto_misleading, direct_chat_*) */
  mode: string;
  /** Current trust level (0-100) */
  trust_level: number;
  /** Timestamp for message ordering */
  timestamp: number;
}

export interface UseTomChatOptions {
  /** Case ID (defaults to case_001) */
  caseId?: string;
  /** Player ID (defaults to default) */
  playerId?: string;
}

export interface UseTomChatReturn {
  /** Check if Tom wants to auto-comment after evidence discovery */
  checkAutoComment: (isCritical?: boolean) => Promise<TomMessage | null>;
  /** Send direct message to Tom (always responds) */
  sendMessage: (message: string) => Promise<TomMessage>;
  /** Whether an LLM call is in progress */
  loading: boolean;
  /** Last Tom message (for debugging/display) */
  lastTomMessage: TomMessage | null;
}

// ============================================
// Hook
// ============================================

export function useTomChat({
  caseId = 'case_001',
  playerId = 'default',
}: UseTomChatOptions = {}): UseTomChatReturn {
  // State
  const [loading, setLoading] = useState(false);
  const [lastTomMessage, setLastTomMessage] = useState<TomMessage | null>(null);

  /**
   * Check if Tom wants to auto-comment after evidence discovery
   * Returns a tom_ghost message if Tom comments, null otherwise (70% chance quiet)
   * Handles 404 (Tom stays quiet) silently
   * Non-blocking - errors are caught and logged, never thrown
   */
  const checkAutoComment = useCallback(
    async (isCritical = false): Promise<TomMessage | null> => {
      setLoading(true);

      try {
        const response = await checkTomAutoComment(caseId, playerId, isCritical);

        if (!response) {
          // Tom stays quiet (404 response or 70% chance)
          return null;
        }

        // Determine tone from mode
        const tone = response.mode.includes('helpful') ? 'helpful' : 'misleading';

        // Convert response to tom_ghost message
        const message: TomMessage = {
          type: 'tom_ghost',
          text: response.text,
          tone,
          mode: response.mode,
          trust_level: response.trust_level,
          timestamp: Date.now(),
        };

        setLastTomMessage(message);
        return message;
      } catch (error) {
        // Non-blocking: log error but don't throw
        // Investigation should continue even if Tom fails
        console.error('Tom auto-comment failed:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [caseId, playerId]
  );

  /**
   * Send direct message to Tom (always responds)
   * Unlike auto-comment, this always returns a response
   * Throws on error (direct chat should show error to user)
   */
  const sendMessage = useCallback(
    async (message: string): Promise<TomMessage> => {
      setLoading(true);

      try {
        const response = await sendTomChat(caseId, playerId, message);

        // Determine tone from mode
        const tone = response.mode.includes('helpful') ? 'helpful' : 'misleading';

        // Convert response to tom_ghost message
        const tomMessage: TomMessage = {
          type: 'tom_ghost',
          text: response.text,
          tone,
          mode: response.mode,
          trust_level: response.trust_level,
          timestamp: Date.now(),
        };

        setLastTomMessage(tomMessage);
        return tomMessage;
      } catch (error) {
        console.error('Tom chat error:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [caseId, playerId]
  );

  return {
    checkAutoComment,
    sendMessage,
    loading,
    lastTomMessage,
  };
}
