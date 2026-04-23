"use client";

import { useAppStore } from "@/src/core/store/appStore";
import { useServerRealtime } from "../serverRealtime.hooks";

/**
 * Subscribes to the currently selected server for realtime updates
 * new channels, new members.
 */
export function ServerRealtimeSync() {
  const selectedServerId = useAppStore((state) => state.selectedServerId);
  useServerRealtime(selectedServerId);
  return null;
}
