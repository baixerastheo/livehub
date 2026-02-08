"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/src/lib/realtime/socketClient";
import { serversKeys } from "./server.hooks";
import { channelsKeys } from "@/src/features/channel/channel.hooks";
import type { ChannelDto } from "@/src/features/channel/channel.types";
import type { ServerMemberDto } from "./server.types";

type ServerChannelCreatedEvent = {
  serverId: number;
  channel: {
    id: number;
    serverId: number;
    name: string;
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

  useEffect(() => {
    if (serverId == null) return;

    const socket = getSocket();
    socket.emit("server:subscribe", { serverId });

    const onChannelCreated = (event: ServerChannelCreatedEvent) => {
      if (event.serverId !== serverId) return;
      const channel: ChannelDto = {
        id: event.channel.id,
        serverId: event.channel.serverId,
        name: event.channel.name,
        createdAtIso: event.channel.createdAtIso,
        updatedAtIso: event.channel.updatedAtIso,
      };
      const key = channelsKeys.byServer(serverId);
      queryClient.setQueryData<ChannelDto[]>(key, (old) => {
        if (!old) return old;
        if (old.some((c) => c.id === channel.id)) return old;
        return [...old, channel];
      });
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

    socket.on("server-channel:created", onChannelCreated);
    socket.on("server-member:joined", onMemberJoined);
    socket.on("server-member:online", onMemberOnline);
    socket.on("server-member:offline", onMemberOffline);

    return () => {
      socket.off("server-channel:created", onChannelCreated);
      socket.off("server-member:joined", onMemberJoined);
      socket.off("server-member:online", onMemberOnline);
      socket.off("server-member:offline", onMemberOffline);
      socket.emit("server:unsubscribe", { serverId });
    };
  }, [serverId, queryClient]);
}
