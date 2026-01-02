/**
 * Hook for Managing Unlock Notifications
 *
 * Provides access to pending unlock notifications with hypothesis labels
 * and a function to acknowledge (dismiss) notifications.
 *
 * @module hooks/useUnlockNotifications
 * @since Milestone 2
 */

import { useMemo, useCallback } from 'react';
import { useGame } from './useGame';
import type { ConditionalHypothesis } from '../types/enhanced';

/**
 * Notification data with hypothesis label for display
 */
export interface UnlockNotification {
  /** Unique event ID for this notification */
  eventId: string;
  /** Human-readable hypothesis label */
  hypothesisLabel: string;
}

/**
 * Hook to manage pending unlock notifications.
 *
 * Features:
 * - Retrieves pending notifications from state
 * - Maps event IDs to hypothesis labels
 * - Provides acknowledge function to dismiss notifications
 *
 * @param hypotheses - Array of conditional hypotheses for label lookup
 * @returns Object with notifications array and acknowledgeNotification function
 *
 * @example
 * ```tsx
 * const { notifications, acknowledgeNotification } = useUnlockNotifications(hypotheses);
 *
 * return (
 *   <>
 *     {notifications.map(notification => (
 *       <UnlockToast
 *         key={notification.eventId}
 *         hypothesisLabel={notification.hypothesisLabel}
 *         onDismiss={() => acknowledgeNotification(notification.eventId)}
 *       />
 *     ))}
 *   </>
 * );
 * ```
 */
export function useUnlockNotifications(
  hypotheses: readonly ConditionalHypothesis[]
): {
  notifications: UnlockNotification[];
  acknowledgeNotification: (eventId: string) => void;
} {
  const { state, dispatch } = useGame();

  // Create a memoized map of hypothesis ID to label for fast lookup
  const hypothesisLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const hypothesis of hypotheses) {
      map.set(hypothesis.id, hypothesis.label);
    }
    return map;
  }, [hypotheses]);

  // Build notifications array from pending events
  const notifications = useMemo(() => {
    const result: UnlockNotification[] = [];

    for (const eventId of state.pendingUnlockNotifications) {
      // Find the event in unlock history
      const event = state.unlockHistory.find((e) => e.id === eventId);
      if (!event) continue;

      // Look up the hypothesis label
      const label = hypothesisLabelMap.get(event.hypothesisId);
      if (!label) continue;

      result.push({
        eventId,
        hypothesisLabel: label,
      });
    }

    return result;
  }, [state.pendingUnlockNotifications, state.unlockHistory, hypothesisLabelMap]);

  // Memoized acknowledge function
  const acknowledgeNotification = useCallback(
    (eventId: string) => {
      dispatch({ type: 'ACKNOWLEDGE_UNLOCK', eventId });
    },
    [dispatch]
  );

  return {
    notifications,
    acknowledgeNotification,
  };
}
