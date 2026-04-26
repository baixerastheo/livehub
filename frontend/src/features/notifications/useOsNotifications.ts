"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { getSocket } from "@/src/lib/realtime/socketClient";
import { useAuth } from "@/src/core/store/auth/useAuth";
import { channelsKeys } from "@/src/features/channel/channel.hooks";
import type { ChannelDto } from "@/src/features/channel/channel.types";
import { serversKeys } from "@/src/features/server/server.hooks";
import type { ServerMemberDto } from "@/src/features/server/server.types";

type MessageMentionEvent = {
  channelId: number;
  serverId: number;
  authorName: string;
  messagePreview: string;
};

type PrivateMessageCreatedEvent = {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAtIso: string;
  read: boolean;
  peerUserId: string;
};

type ServerMemberKickedEvent = {
  serverId: number;
  kickedUserId: string;
};

type ServerMemberBannedEvent = {
  serverId: number;
  bannedUserId: string;
};

function resolveMentions(
  text: string,
  members: ServerMemberDto[] | undefined,
): string {
  if (!members) return text;
  return text.replace(/@\[([a-z0-9-]+)\]/gi, (_, userId: string) => {
    const name = members.find((m) => m.userId === userId)?.user.name;
    return name ? `@${name}` : "@unknown";
  });
}

function fireNotification(title: string, body?: string) {
  if (typeof window === "undefined") return;
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  if (document.visibilityState !== "hidden") return;
  try {
    new Notification(title, { body, icon: "/brand/livehub_icon.svg" });
  } catch {
    // Notification API unavailable or permission revoked mid-session
  }
}

export function useOsNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const t = useTranslations("notifications");

  // Request permission once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const socket = getSocket();

    const onMention = (event: MessageMentionEvent) => {
      const channels = queryClient.getQueryData<ChannelDto[]>(
        channelsKeys.byServer(event.serverId),
      );
      const channelName =
        channels?.find((c) => c.id === event.channelId)?.name ??
        `${event.channelId}`;
      const members = queryClient.getQueryData<ServerMemberDto[]>(
        serversKeys.members(event.serverId),
      );
      const preview = resolveMentions(event.messagePreview, members);
      fireNotification(
        t("mentionTitle", { author: event.authorName, channel: channelName }),
        preview,
      );
    };

    const onPrivateMessage = (event: PrivateMessageCreatedEvent) => {
      if (event.authorId === currentUserId) return;
      fireNotification(
        t("privateMessageTitle", { author: event.authorName }),
        event.content,
      );
    };

    const onKicked = (event: ServerMemberKickedEvent) => {
      if (event.kickedUserId !== currentUserId) return;
      fireNotification(t("kickedTitle"));
    };

    const onBanned = (event: ServerMemberBannedEvent) => {
      if (event.bannedUserId !== currentUserId) return;
      fireNotification(t("bannedTitle"));
    };

    const onFriendRequestReceived = () => {
      fireNotification(t("friendRequestReceivedTitle", { name: "…" }));
    };

    const onFriendRequestAccepted = () => {
      fireNotification(t("friendRequestAcceptedTitle", { name: "…" }));
    };

    socket.on("message:mention", onMention);
    socket.on("private-message:created", onPrivateMessage);
    socket.on("server-member:kicked", onKicked);
    socket.on("server-member:banned", onBanned);
    socket.on("friend-request:received", onFriendRequestReceived);
    socket.on("friend-request:accepted", onFriendRequestAccepted);

    return () => {
      socket.off("message:mention", onMention);
      socket.off("private-message:created", onPrivateMessage);
      socket.off("server-member:kicked", onKicked);
      socket.off("server-member:banned", onBanned);
      socket.off("friend-request:received", onFriendRequestReceived);
      socket.off("friend-request:accepted", onFriendRequestAccepted);
    };
  }, [currentUserId, queryClient, t]);
}
