/**
 * useInnerVoice Hook
 *
 * Manages Tom Thornfield's ghost inner voice system:
 * - Check for Tom triggers based on evidence count
 * - Returns tom_ghost messages for inline display
 * - Handle 404 silently (no eligible triggers)
 * - Non-blocking async (errors don't break investigation)
 *
 * @module hooks/useInnerVoice
 * @since Phase 4
 */

import { useState, useCallback } from 'react';
import { checkInnerVoice } from '../api/client';
import type { Message, InnerVoiceTrigger } from '../types/investigation';

// ============================================
// Types
// ============================================

export interface UseInnerVoiceOptions {
  /** Case ID (defaults to case_001) */
  caseId?: string;
  /** Player ID (defaults to default) */
  playerId?: string;
}

export interface UseInnerVoiceReturn {
  /** Check for Tom trigger based on evidence count, returns message or null */
  checkTomTrigger: (evidenceCount: number) => Promise<Message | null>;
  /** Whether a check is in progress */
  loading: boolean;
  /** Last trigger that fired (for debugging) */
  lastTrigger: InnerVoiceTrigger | null;
}

// ============================================
// Hook
// ============================================

export function useInnerVoice({
  caseId = 'case_001',
  playerId = 'default',
}: UseInnerVoiceOptions = {}): UseInnerVoiceReturn {
  // State
  const [loading, setLoading] = useState(false);
  const [lastTrigger, setLastTrigger] = useState<InnerVoiceTrigger | null>(null);

  /**
   * Check for Tom trigger based on evidence count
   * Returns a tom_ghost message if trigger fires, null otherwise
   * Handles 404 (no eligible triggers) silently
   * Non-blocking - errors are caught and logged, never thrown
   */
  const checkTomTrigger = useCallback(
    async (evidenceCount: number): Promise<Message | null> => {
      setLoading(true);

      try {
        const trigger = await checkInnerVoice(caseId, playerId, evidenceCount);

        if (!trigger) {
          // No eligible triggers (404 response)
          return null;
        }

        // Store last trigger for debugging
        setLastTrigger(trigger);

        // Convert trigger to tom_ghost message
        const message: Message = {
          type: 'tom_ghost',
          text: trigger.text,
          tone: trigger.type === 'helpful' ? 'helpful' : 'misleading',
        };

        return message;
      } catch (error) {
        // Non-blocking: log error but don't throw
        // Investigation should continue even if Tom trigger fails
        console.error('Tom inner voice check failed:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [caseId, playerId]
  );

  return {
    checkTomTrigger,
    loading,
    lastTrigger,
  };
}
