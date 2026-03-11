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

type ServerOwnershipTransferredEvent = {
  serverId: number;
  newOwnerId: string;
  previousOwnerId: string;
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
    const subscribe = () => socket.emit("server:subscribe", { serverId });
    subscribe();

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
        // If channels not yet cached, force a refetch so the new channel appears.
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

    const onOwnershipTransferred = (event: ServerOwnershipTransferredEvent) => {
      if (event.serverId !== serverId) return;
      // Invalidate members and user's own server list to reflect the new roles.
      queryClient.invalidateQueries({ queryKey: serversKeys.members(serverId) });
      queryClient.invalidateQueries({ queryKey: serversKeys.user() });
    };

    // Re-subscribe after reconnect: Socket.IO rooms are per-connection and
    // are lost when the socket disconnects.
    socket.on("connect", subscribe);
    socket.on("server-channel:created", onChannelCreated);
    socket.on("server-channel:deleted", onChannelDeleted);
    socket.on("server-member:joined", onMemberJoined);
    socket.on("server-member:online", onMemberOnline);
    socket.on("server-member:offline", onMemberOffline);
    socket.on("server-ownership:transferred", onOwnershipTransferred);

    return () => {
      socket.off("connect", subscribe);
      socket.off("server-channel:created", onChannelCreated);
      socket.off("server-channel:deleted", onChannelDeleted);
      socket.off("server-member:joined", onMemberJoined);
      socket.off("server-member:online", onMemberOnline);
      socket.off("server-member:offline", onMemberOffline);
      socket.off("server-ownership:transferred", onOwnershipTransferred);
      socket.emit("server:unsubscribe", { serverId });
    };
  }, [serverId, queryClient]);
}

/**
 * Listens globally for the "you were added to a server" event on the user's
 * personal room and invalidates the server list so the sidebar updates without
 * a page reload.
 */
export function useUserServerAddedRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();

    const onAddedToServer = () => {
      queryClient.invalidateQueries({ queryKey: serversKeys.user() });
    };

    socket.on("user:added-to-server", onAddedToServer);
    return () => {
      socket.off("user:added-to-server", onAddedToServer);
    };
  }, [queryClient]);
}
