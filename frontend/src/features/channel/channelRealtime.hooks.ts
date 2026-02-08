"use client";

import React, { useEffect } from "react";
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

const TYPING_EXPIRY_MS = 5000;

export type TypingUser = { userId: string; userName: string };

export function useChannelTyping(
  channelId: number | null,
  currentUserId: string | null,
) {
  const [typingUsers, setTypingUsers] = React.useState<TypingUser[]>([]);
  const typingRef = React.useRef<Map<string, { userName: string; expiresAt: number }>>(new Map());

  useEffect(() => {
    if (channelId == null) return;

    const socket = getSocket();

    const removeExpired = () => {
      const now = Date.now();
      let changed = false;
      typingRef.current.forEach((v, k) => {
        if (v.expiresAt <= now) {
          typingRef.current.delete(k);
          changed = true;
        }
      });
      if (changed) {
        setTypingUsers(
          Array.from(typingRef.current.entries(), ([userId, v]) => ({
            userId,
            userName: v.userName,
          })),
        );
      }
    };

    const onTyping = (event: { channelId: number; userId: string; userName: string }) => {
      if (event.channelId !== channelId) return;
      if (event.userId === currentUserId) return;
      typingRef.current.set(event.userId, {
        userName: event.userName,
        expiresAt: Date.now() + TYPING_EXPIRY_MS,
      });
      setTypingUsers(
        Array.from(typingRef.current.entries()).map(([userId, v]) => ({
          userId,
          userName: v.userName,
        })),
      );
    };

    const onStopTyping = (event: { channelId: number; userId: string }) => {
      if (event.channelId !== channelId) return;
      typingRef.current.delete(event.userId);
      setTypingUsers(
        Array.from(typingRef.current.entries()).map(([userId, v]) => ({
          userId,
          userName: v.userName,
        })),
      );
    };

    socket.on("channel:typing", onTyping);
    socket.on("channel:stop-typing", onStopTyping);
    const intervalId = setInterval(removeExpired, 1000);
    const typingMap = typingRef.current;

    return () => {
      socket.off("channel:typing", onTyping);
      socket.off("channel:stop-typing", onStopTyping);
      clearInterval(intervalId);
      setTypingUsers([]);
      typingMap.clear();
    };
  }, [channelId, currentUserId]);

  return typingUsers;
}

const TYPING_DEBOUNCE_MS = 300;
const TYPING_INTERVAL_MS = 2000;

export function useChannelTypingEmitter(
  channelId: number | null,
  value: string,
  userName: string,
) {
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const channelIdRef = React.useRef(channelId);
  const userNameRef = React.useRef(userName);

  useEffect(() => {
    channelIdRef.current = channelId;
    userNameRef.current = userName;
  }, [channelId, userName]);

  useEffect(() => {
    if (channelId == null || !userName) return;

    const socket = getSocket();
    const trimmed = value.trim();

    if (trimmed === "") {
      socket.emit("channel:stop-typing", { channelId });
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      return;
    }

    const emitTyping = () => {
      socket.emit("channel:typing", {
        channelId: channelIdRef.current,
        userName: userNameRef.current,
      });
    };

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      emitTyping();
      if (!intervalRef.current) {
        intervalRef.current = setInterval(emitTyping, TYPING_INTERVAL_MS);
      }
    }, TYPING_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [channelId, value, userName]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (channelId != null) {
        getSocket().emit("channel:stop-typing", { channelId });
      }
    };
  }, [channelId]);
}
