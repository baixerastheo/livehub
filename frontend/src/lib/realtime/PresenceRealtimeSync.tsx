"use client";

import { useAuth } from "@/src/core/store/auth/useAuth";
import { usePresenceRealtime } from "./usePresenceRealtime";

/**
 * Invisible component that subscribes to global presence events
 * (user:online / user:offline) and keeps React Query caches up to date.
 * Mount once in the app shell.
 */
export function PresenceRealtimeSync() {
  const { isAuthenticated } = useAuth();
  usePresenceRealtime(isAuthenticated);
  return null;
}
