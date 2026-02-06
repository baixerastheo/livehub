"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addServerMember,
  getServerMembers,
  getUserServers,
} from "./server.service";
import type { ServerMemberDto, UserServerDto } from "./server.types";
import { useAuth } from "@/src/core/store/auth/useAuth";

export const serversKeys = {
  all: ["servers"] as const,
  user: () => [...serversKeys.all, "user"] as const,
  members: (serverId: number) =>
    [...serversKeys.all, "members", serverId] as const,
};

export function useUserServersQuery() {
  const { isAuthenticated } = useAuth();

  return useQuery<UserServerDto[]>({
    queryKey: serversKeys.user(),
    queryFn: () => getUserServers(),
    enabled: isAuthenticated,
  });
}

export function useServerMembersQuery(serverId: number | null) {
  return useQuery<ServerMemberDto[]>({
    queryKey:
      serverId != null
        ? serversKeys.members(serverId)
        : ["servers", "members", 0],
    queryFn: () => getServerMembers(serverId!),
    enabled: serverId != null,
  });
}

export function useAddServerMemberMutation(serverId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      if (serverId == null) {
        throw new Error("No server selected");
      }
      return addServerMember(serverId, userId);
    },
    onSuccess: async () => {
      if (serverId != null) {
        await qc.invalidateQueries({ queryKey: serversKeys.members(serverId) });
      }
    },
  });
}

