"use client";

import { useEffect } from "react";
import { flushSync } from "react-dom";
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
  ReactionDto,
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

type MessageReactionUpdatedEvent = {
  messageId: number;
  reactions: ReactionDto[];
};

export function usePrivateReactionRealtime(peerUserId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!peerUserId) return;

    const socket = getSocket();

    const handler = (event: MessageReactionUpdatedEvent) => {
      const key = privateConversationKey(peerUserId);
      queryClient.setQueryData<GetPrivateConversationResponseDto>(key, (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: old.messages.map((m) =>
            m.id === String(event.messageId)
              ? { ...m, reactions: event.reactions }
              : m,
          ),
        };
      });
    };

    socket.on("message:reaction-updated", handler);
    return () => {
      socket.off("message:reaction-updated", handler);
    };
  }, [peerUserId, queryClient]);
}

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

      const key = privateConversationKey(peerUserId);
      const existing = queryClient.getQueryData<GetPrivateConversationResponseDto>(key);

      if (!existing) {
        void queryClient.refetchQueries({ queryKey: key });
        void queryClient.refetchQueries({ queryKey: privateConversationsKey });
      } else {
        queryClient.setQueryData<GetPrivateConversationResponseDto>(key, (old) => {
          if (!old) return old;
          if (old.messages.some((m) => m.id === newMessage.id)) {
            return old;
          }
          return {
            ...old,
            messages: [...old.messages, newMessage],
          };
        });
      }

      void queryClient.refetchQueries({ queryKey: privateConversationsKey });
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

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void queryClient.refetchQueries({ queryKey: privateConversationsKey });
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const handler = (event: PrivateMessageCreatedEvent) => {

      const peerId = event.peerUserId;

      const peerName =
        event.authorId === currentUserId ? undefined : event.authorName;

      const key = privateConversationsKey;
      const old = queryClient.getQueryData<ListPrivateConversationsResponseDto>(key);
      const idx = old?.findIndex((item) => item.peer.id === peerId) ?? -1;

      if (idx === -1) {
        const newItem: ListPrivateConversationsResponseDto[number] = {
          peer: {
            id: peerId,
            name: peerName ?? "User",
            email: "",
            avatarUrl: null,
          },
          lastMessageAt: event.createdAtIso,
          lastMessageContent: event.content ?? null,
        };
        flushSync(() => {
          queryClient.setQueryData<ListPrivateConversationsResponseDto>(key, (prev) => [
            newItem,
            ...(prev ?? []),
          ]);
        });
        void queryClient.refetchQueries({ queryKey: key });
        return;
      }

      flushSync(() => {
        queryClient.setQueryData<ListPrivateConversationsResponseDto>(key, (prev) => {
          if (!prev) return prev;
          const updated = [...prev];
          const item = updated[idx];
          updated.splice(idx, 1);
          updated.unshift({
            ...item,
            lastMessageAt: event.createdAtIso,
            lastMessageContent: event.content ?? item.lastMessageContent ?? null,
          });
          return updated;
        });
      });
      void queryClient.refetchQueries({ queryKey: key });
    };

    socket.on("private-message:created", handler);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      socket.off("private-message:created", handler);
    };
  }, [currentUserId, queryClient]);
}
