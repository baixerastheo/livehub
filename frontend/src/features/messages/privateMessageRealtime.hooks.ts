"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/src/lib/realtime/socketClient";
import {
  privateConversationKey,
  privateConversationsKey,
} from "@/src/features/messages/privateMessage.hooks";
import type {
  GetPrivateConversationResponseDto,
  ListPrivateConversationsResponseDto,
  PrivateMessageDto,
} from "@/src/features/messages/messages.types";
import { useAuth } from "@/src/core/store/auth/useAuth";

type PrivateMessageCreatedEvent = {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAtIso: string;
  read: boolean;
  peerUserId: string;
};

export function usePrivateMessagesRealtime(peerUserId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  useEffect(() => {
    if (!peerUserId) return;

    const socket = getSocket();

    const handler = (event: PrivateMessageCreatedEvent) => {
      if (event.peerUserId !== peerUserId) return;

      const isMe =
        currentUserId !== null && event.authorId === currentUserId;

      const newMessage: PrivateMessageDto = {
        id: event.id,
        content: event.content,
        authorId: event.authorId,
        authorName: event.authorName,
        createdAtIso: event.createdAtIso,
        isMe,
        read: event.read,
      };

      queryClient.setQueryData<GetPrivateConversationResponseDto>(
        privateConversationKey(peerUserId),
        (old) => {
          if (!old) return old;
          if (old.messages.some((m) => m.id === newMessage.id)) {
            return old;
          }
          return {
            ...old,
            messages: [...old.messages, newMessage],
          };
        },
      );

      queryClient.invalidateQueries({ queryKey: privateConversationsKey });
    };

    socket.on("private-message:created", handler);

    return () => {
      socket.off("private-message:created", handler);
    };
  }, [peerUserId, currentUserId, queryClient]);
}

export function usePrivateConversationListRealtime() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  useEffect(() => {
    if (!currentUserId) return;

    const socket = getSocket();

    const handler = (event: PrivateMessageCreatedEvent) => {
      // Ignore events that don't involve the current user (defensive)
      if (
        event.authorId !== currentUserId &&
        event.peerUserId !== currentUserId
      ) {
        return;
      }

      queryClient.setQueryData<ListPrivateConversationsResponseDto>(
        privateConversationsKey,
        (old) => {
          if (!old) return old;

          const idx = old.findIndex(
            (item) => item.peer.id === event.peerUserId,
          );
          if (idx === -1) {

            return old;
          }

          const updated = [...old];
          const item = updated[idx];
          updated.splice(idx, 1);
          updated.unshift({
            ...item,
            lastMessageAt: event.createdAtIso,
          });
          return updated;
        },
      );
    };

    socket.on("private-message:created", handler);

    return () => {
      socket.off("private-message:created", handler);
    };
  }, [currentUserId, queryClient]);
}

