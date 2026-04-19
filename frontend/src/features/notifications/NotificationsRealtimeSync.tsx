"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/src/core/store/auth/useAuth";
import { getSocket } from "@/src/lib/realtime/socketClient";
import { notificationsKey } from "./notification.hooks";
import type { NotificationDto, MentionData, PrivateMessageData, KickedData, BannedData } from "./notification.types";

type MessageMentionEvent = MentionData;
type PrivateMessageCreatedEvent = { id: string; content: string; authorId: string; authorName: string; createdAtIso: string; read: boolean; peerUserId: string };
type ServerMemberKickedEvent = { serverId: number; kickedUserId: string };
type ServerMemberBannedEvent = { serverId: number; bannedUserId: string; raison: string | null; expireLe: string | null };

let tempId = -1;
function makeTempNotif(partial: Omit<NotificationDto, "id" | "userId" | "lu" | "creeLe">): NotificationDto {
  return { id: tempId--, userId: "", lu: false, creeLe: new Date().toISOString(), ...partial };
}

export function NotificationsRealtimeSync() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  useEffect(() => {
    if (!currentUserId) return;

    const socket = getSocket();

    const push = (notif: NotificationDto) => {
      queryClient.setQueryData<NotificationDto[]>(notificationsKey, (old) =>
        old ? [notif, ...old] : [notif],
      );
    };

    const onMention = (event: MessageMentionEvent) => {
      push(makeTempNotif({
        type: "MENTION",
        data: event satisfies MentionData,
      }));
    };

    const onPrivateMessage = (event: PrivateMessageCreatedEvent) => {
      if (event.authorId === currentUserId) return;
      push(makeTempNotif({
        type: "PRIVATE_MESSAGE",
        data: { authorId: event.authorId, authorName: event.authorName, content: event.content } satisfies PrivateMessageData,
      }));
    };

    const onKicked = (event: ServerMemberKickedEvent) => {
      if (event.kickedUserId !== currentUserId) return;
      push(makeTempNotif({
        type: "KICKED",
        data: { serverId: event.serverId } satisfies KickedData,
      }));
    };

    const onBanned = (event: ServerMemberBannedEvent) => {
      if (event.bannedUserId !== currentUserId) return;
      push(makeTempNotif({
        type: "BANNED",
        data: { serverId: event.serverId, raison: event.raison, expireLe: event.expireLe } satisfies BannedData,
      }));
    };

    socket.on("message:mention", onMention);
    socket.on("private-message:created", onPrivateMessage);
    socket.on("server-member:kicked", onKicked);
    socket.on("server-member:banned", onBanned);

    return () => {
      socket.off("message:mention", onMention);
      socket.off("private-message:created", onPrivateMessage);
      socket.off("server-member:kicked", onKicked);
      socket.off("server-member:banned", onBanned);
    };
  }, [currentUserId, queryClient]);

  return null;
}
