/**
 * useActiveNotifications — single shared selector for all notification state.
 *
 * Called by both Topbar (for badge count) and NotificationPanel (for list
 * rendering).  All filtering logic lives here; neither component duplicates it.
 *
 * An "active" notification:
 *  - Is not resolved
 *  - Is not currently snoozed (snooze expiry ≤ now)
 *  - Passed deduplication when ALL_NOTIFICATIONS was built
 *  - Is otherwise eligible under the existing rules
 */
import { useMemo } from 'react';
import { useDemoStore } from '../store/demoStore';
import { useNotifNow } from './useNotifNow';
import {
  ALL_NOTIFICATIONS,
  CRITICAL_NOTIFICATION_IDS,
  type Notification,
} from '../data/notificationData';

export interface ActiveNotification extends Notification {
  /** True when this notification ID is in notificationReadIds */
  read: boolean;
  /** True when this notification ID is in notificationAcknowledgedIds */
  acknowledged: boolean;
}

export function useActiveNotifications(): {
  /** Active notifications (not resolved, not snoozed), enriched with read/acknowledged */
  notifications: ActiveNotification[];
  /** Number of notifications whose snooze expiry is still in the future */
  snoozedCount: number;
  /** Number of resolved notification IDs */
  resolvedCount: number;
  /** Total unread count across all active notifications */
  unreadTotal: number;
  /**
   * Unread critical-clinical count — drives the Topbar bell badge.
   * Excludes resolved and snoozed items exactly like the panel list.
   */
  criticalUnreadCount: number;
} {
  const { state } = useDemoStore();
  const now = useNotifNow();

  const notifications: ActiveNotification[] = useMemo(() => {
    return ALL_NOTIFICATIONS
      .filter(n => {
        if (state.notificationResolvedIds.includes(n.id)) return false;
        const snoozedUntil = state.notificationSnoozeExpiry[n.id] ?? 0;
        if (snoozedUntil > now) return false;
        return true;
      })
      .map(n => ({
        ...n,
        read:         state.notificationReadIds.includes(n.id),
        acknowledged: state.notificationAcknowledgedIds.includes(n.id),
      }));
  }, [
    state.notificationReadIds,
    state.notificationAcknowledgedIds,
    state.notificationResolvedIds,
    state.notificationSnoozeExpiry,
    now,
  ]);

  const snoozedCount = useMemo(
    () => ALL_NOTIFICATIONS.filter(n => (state.notificationSnoozeExpiry[n.id] ?? 0) > now).length,
    [state.notificationSnoozeExpiry, now],
  );

  const resolvedCount = state.notificationResolvedIds.length;

  const unreadTotal = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications],
  );

  const criticalUnreadCount = useMemo(
    () => notifications.filter(n => CRITICAL_NOTIFICATION_IDS.includes(n.id) && !n.read).length,
    [notifications],
  );

  return { notifications, snoozedCount, resolvedCount, unreadTotal, criticalUnreadCount };
}
