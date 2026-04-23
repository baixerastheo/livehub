"use client";

import { useOsNotifications } from "./useOsNotifications";

/**
 * Mounted once in AppShell. Requests notification permission and fires OS
 * notifications for mentions, private messages, and moderation events when
 * the tab is in the background.
 */
export function OsNotificationsSync() {
  useOsNotifications();
  return null;
}
