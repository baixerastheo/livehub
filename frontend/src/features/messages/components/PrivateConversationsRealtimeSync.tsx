"use client";

import { usePrivateConversationListRealtime } from "../privateMessageRealtime.hooks";

/**
 * Doit être monté une seule fois dans l’app (ex. AppShell) pour que l’écoute
 * Socket.IO des messages privés soit active même quand la sidebar n’affiche
 * pas la section "conversations". Sinon la liste ne se met pas à jour en temps réel.
 */
export function PrivateConversationsRealtimeSync() {
  usePrivateConversationListRealtime();
  return null;
}
