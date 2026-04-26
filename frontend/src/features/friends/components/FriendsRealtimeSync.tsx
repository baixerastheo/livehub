"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/src/core/store/auth/useAuth";
import { getSocket } from "@/src/lib/realtime/socketClient";
import { friendsKeys } from "@/src/features/friends/friends.types";

export function FriendsRealtimeSync() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return;

    const socket = getSocket();

    const invalidate = () => {
      void qc.invalidateQueries({ queryKey: friendsKeys.requests() });
      void qc.invalidateQueries({ queryKey: friendsKeys.lists() });
    };

    socket.on("friend-request:received", invalidate);
    socket.on("friend-request:accepted", invalidate);
    socket.on("friend-request:declined", invalidate);

    return () => {
      socket.off("friend-request:received", invalidate);
      socket.off("friend-request:accepted", invalidate);
      socket.off("friend-request:declined", invalidate);
    };
  }, [userId, qc]);

  return null;
}
