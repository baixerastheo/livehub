"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/src/lib/realtime/socketClient";
import { channelsKeys } from "./channel.hooks";
import type { ChannelMessageBackendDto } from "./channel.service";
import { useAuth } from "@/src/core/store/auth/useAuth";

type ChannelMessageCreatedEvent = {
  channelId: number;
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAtIso: string;
};

export function useChannelMessagesRealtime(channelId: number | null) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  useEffect(() => {
    if (channelId == null) return;

    const socket = getSocket();
    socket.emit("channel:subscribe", { channelId });

    const handler = (event: ChannelMessageCreatedEvent) => {
      if (event.channelId !== channelId) return;

      const newMessage: ChannelMessageBackendDto = {
        id: Number(event.id),
        contenu: event.content,
        creeLe: event.createdAtIso,
        auteurId: event.authorId,
        auteur: {
          id: event.authorId,
          name: event.authorName,
          email: "",
        },
      };

      const key = channelsKeys.messages(channelId);
      queryClient.setQueryData<ChannelMessageBackendDto[]>(key, (old) => {
        if (!old) return old;
        if (old.some((m) => m.id === newMessage.id)) return old;
        return [...old, newMessage];
      });
    };

    socket.on("channel-message:created", handler);

    return () => {
      socket.off("channel-message:created", handler);
      socket.emit("channel:unsubscribe", { channelId });
    };
  }, [channelId, currentUserId, queryClient]);
}
