"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { getSocket } from "@/src/lib/realtime/socketClient";
import { serversKeys, serverBansKey } from "./server.hooks";
import { channelsKeys } from "@/src/features/channel/channel.hooks";
import type { ChannelDto, ChannelType } from "@/src/features/channel/channel.types";
import type { ServerMemberDto } from "./server.types";
import { useAuth } from "@/src/core/store/auth/useAuth";
import { useAppStore } from "@/src/core/store/appStore";
import { useVoiceStore } from "@/src/features/voice/voice.store";
import { useToastStore } from "@/src/core/store/toast/useToastStore";

type ServerChannelCreatedEvent = {
  serverId: number;
  channel: {
    id: number;
    serverId: number;
    name: string;
    type?: string;
    createdAtIso: string;
    updatedAtIso: string;
  };
};

type ServerMemberJoinedEvent = {
  serverId: number;
  member: {
    id: number;
    serveurId: number;
    userId: string;
    role: string;
    rejointLe: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatarUrl: string | null;
    };
  };
};

type ServerOwnershipTransferredEvent = {
  serverId: number;
  newOwnerId: string;
  previousOwnerId: string;
};

type MessageMentionEvent = {
  channelId: number;
  serverId: number;
  authorName: string;
  messagePreview: string;
};

function mapRealtimeMemberToDto(m: ServerMemberJoinedEvent["member"]): ServerMemberDto {
  return {
    id: m.id,
    serverId: m.serveurId,
    userId: m.userId,
    role: m.role as ServerMemberDto["role"],
    joinedAtIso: m.rejointLe,
    user: {
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl ?? null,
    },
  };
}

export function useServerRealtime(serverId: number | null) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const setSelectedServerId = useAppStore((s) => s.setSelectedServerId);
  const setVoicePresence = useVoiceStore((s) => s.setVoicePresence);
  const t = useTranslations("mentions");

  useEffect(() => {
    if (serverId == null) return;

    const socket = getSocket();
    const subscribe = () => {
      socket.emit("server:subscribe", { serverId });
      // Re-announce voice presence after a reconnect
      const { isConnected, currentChannelId, isMuted } = useVoiceStore.getState();
      if (isConnected && currentChannelId != null) {
        socket.emit("voice:join", { channelId: currentChannelId, isMuted });
      }
    };
    subscribe();

    const onChannelCreated = (event: ServerChannelCreatedEvent) => {
      if (event.serverId !== serverId) return;
      const channel: ChannelDto = {
        id: event.channel.id,
        serverId: event.channel.serverId,
        name: event.channel.name,
        type: (event.channel.type ?? "TEXTE") as ChannelType,
        createdAtIso: event.channel.createdAtIso,
        updatedAtIso: event.channel.updatedAtIso,
      };
      const key = channelsKeys.byServer(serverId);
      queryClient.setQueryData<ChannelDto[]>(key, (old) => {
        if (!old) {
          void queryClient.invalidateQueries({ queryKey: key });
          return old;
        }
        if (old.some((c) => c.id === channel.id)) return old;
        return [...old, channel];
      });
    };

    const onChannelDeleted = (event: { serverId: number; channelId: number }) => {
      if (event.serverId !== serverId) return;
      queryClient.invalidateQueries({ queryKey: channelsKeys.byServer(serverId) });
    };

    const onMemberJoined = (event: ServerMemberJoinedEvent) => {
      if (event.serverId !== serverId) return;
      const member = mapRealtimeMemberToDto(event.member);
      const key = serversKeys.members(serverId);
      queryClient.setQueryData<ServerMemberDto[]>(key, (old) => {
        if (!old) return old;
        if (old.some((m) => m.id === member.id)) return old;
        return [...old, member];
      });
    };

    const onMemberOnline = (payload: { userId: string }) => {
      const key = serversKeys.members(serverId);
      queryClient.setQueryData<ServerMemberDto[]>(key, (old) => {
        if (!old) return old;
        return old.map((m) =>
          m.userId === payload.userId
            ? { ...m, user: { ...m.user, statut: "EN_LIGNE" as const } }
            : m,
        );
      });
    };

    const onMemberOffline = (payload: { userId: string }) => {
      const key = serversKeys.members(serverId);
      queryClient.setQueryData<ServerMemberDto[]>(key, (old) => {
        if (!old) return old;
        return old.map((m) =>
          m.userId === payload.userId
            ? { ...m, user: { ...m.user, statut: "HORS_LIGNE" as const } }
            : m,
        );
      });
    };

    const onMemberKicked = (event: { serverId: number; kickedUserId: string }) => {
      if (event.serverId !== serverId) return;
      queryClient.setQueryData<ServerMemberDto[]>(
        serversKeys.members(serverId),
        (old) => old?.filter((m) => m.userId !== event.kickedUserId) ?? old,
      );
      if (event.kickedUserId === currentUserId) {
        queryClient.invalidateQueries({ queryKey: serversKeys.user() });
        setSelectedServerId(null);
      }
    };

    const onMemberBanned = (event: { serverId: number; bannedUserId: string }) => {
      if (event.serverId !== serverId) return;
      queryClient.setQueryData<ServerMemberDto[]>(
        serversKeys.members(serverId),
        (old) => old?.filter((m) => m.userId !== event.bannedUserId) ?? old,
      );
      queryClient.invalidateQueries({ queryKey: serverBansKey(serverId) });
      if (event.bannedUserId === currentUserId) {
        queryClient.invalidateQueries({ queryKey: serversKeys.user() });
        setSelectedServerId(null);
      }
    };

    const onMemberUnbanned = (event: { serverId: number }) => {
      if (event.serverId !== serverId) return;
      queryClient.invalidateQueries({ queryKey: serverBansKey(serverId) });
    };

    const onOwnershipTransferred = (event: ServerOwnershipTransferredEvent) => {
      if (event.serverId !== serverId) return;
      queryClient.invalidateQueries({ queryKey: serversKeys.members(serverId) });
      queryClient.invalidateQueries({ queryKey: serversKeys.user() });
    };

    const onVoicePresence = (event: {
      channelId: number;
      serverId: number;
      participants: { userId: string; name: string; avatarUrl: string | null; isMuted: boolean }[];
    }) => {
      if (event.serverId !== serverId) return;
      setVoicePresence(event.channelId, event.participants);
    };

    const onMention = (event: MessageMentionEvent) => {
      if (event.serverId !== serverId) return;
      if (document.visibilityState === "hidden") return;
      const match = /\/channels\/(\d+)/.exec(window.location.pathname);
      const viewingChannelId = match ? parseInt(match[1], 10) : null;
      if (viewingChannelId === event.channelId) return;
      const channels = queryClient.getQueryData<ChannelDto[]>(channelsKeys.byServer(serverId));
      const channelName = channels?.find((c) => c.id === event.channelId)?.name ?? String(event.channelId);
      useToastStore.getState().push({
        type: "info",
        message: t("mentioned", { author: event.authorName, channel: channelName }),
      });
    };

    socket.on("connect", subscribe);
    socket.on("server-channel:created", onChannelCreated);
    socket.on("server-channel:deleted", onChannelDeleted);
    socket.on("server-member:joined", onMemberJoined);
    socket.on("server-member:online", onMemberOnline);
    socket.on("server-member:offline", onMemberOffline);
    socket.on("server-member:kicked", onMemberKicked);
    socket.on("server-member:banned", onMemberBanned);
    socket.on("server-member:unbanned", onMemberUnbanned);
    socket.on("server-ownership:transferred", onOwnershipTransferred);
    socket.on("voice-channel:presence", onVoicePresence);
    socket.on("message:mention", onMention);

    return () => {
      socket.off("connect", subscribe);
      socket.off("server-channel:created", onChannelCreated);
      socket.off("server-channel:deleted", onChannelDeleted);
      socket.off("server-member:joined", onMemberJoined);
      socket.off("server-member:online", onMemberOnline);
      socket.off("server-member:offline", onMemberOffline);
      socket.off("server-member:kicked", onMemberKicked);
      socket.off("server-member:banned", onMemberBanned);
      socket.off("server-member:unbanned", onMemberUnbanned);
      socket.off("server-ownership:transferred", onOwnershipTransferred);
      socket.off("voice-channel:presence", onVoicePresence);
      socket.off("message:mention", onMention);
      socket.emit("server:unsubscribe", { serverId });
    };
  }, [serverId, currentUserId, queryClient, setSelectedServerId, setVoicePresence, t]);
}

