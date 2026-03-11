"use client";

import { useUserServerAddedRealtime } from "../serverRealtime.hooks";

/**
 * Mounted once in AppShell. Listens for "user:added-to-server" events so the
 * sidebar server list refreshes automatically when an admin adds this user to a
 * server, without requiring a page reload.
 */
export function UserServerAddedRealtimeSync() {
  useUserServerAddedRealtime();
  return null;
}
