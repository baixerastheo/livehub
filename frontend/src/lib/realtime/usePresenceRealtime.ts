"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "./socketClient";
import { friendsKeys } from "@/src/features/friends/friends.types";
import { usersKeys } from "@/src/features/users/users.types";
import type { FriendDto } from "@/src/features/friends/friends.types";
import type { UtilisateurDto } from "@/src/features/users/users.types";

type PresencePayload = { userId: string };

/**
 * Global hook: listens to `user:online` / `user:offline` WebSocket events
 * and updates the friends & users React Query caches in real time.
 *
 * Mount this once at the app layout level when authenticated.
 */
export function usePresenceRealtime(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const socket = getSocket();

    const updateStatus = (userId: string, statut: "EN_LIGNE" | "HORS_LIGNE") => {
      // Update all friends list caches
      queryClient.setQueriesData<FriendDto[]>(
        { queryKey: friendsKeys.lists() },
        (old) =>
          old?.map((f) => (f.id === userId ? { ...f, statut } : f)),
      );

      // Update all users list caches
      queryClient.setQueriesData<UtilisateurDto[]>(
        { queryKey: usersKeys.lists() },
        (old) =>
          old?.map((u) => (u.id === userId ? { ...u, statut } : u)),
      );

      // Update single user detail cache
      queryClient.setQueriesData<UtilisateurDto>(
        { queryKey: usersKeys.details() },
        (old) => (old?.id === userId ? { ...old, statut } : old),
      );
    };

    const onOnline = (payload: PresencePayload) =>
      updateStatus(payload.userId, "EN_LIGNE");

    const onOffline = (payload: PresencePayload) =>
      updateStatus(payload.userId, "HORS_LIGNE");

    socket.on("user:online", onOnline);
    socket.on("user:offline", onOffline);

    return () => {
      socket.off("user:online", onOnline);
      socket.off("user:offline", onOffline);
    };
  }, [enabled, queryClient]);
}
