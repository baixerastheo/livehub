"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  addServerMember,
  createServer,
  deleteServer,
  getServerMembers,
  getUserServers,
  leaveServer,
  updateServer,
  updateMemberRole,
  transferOwnership,
  kickMember,
  banMember,
  unbanMember,
  getBans,
  uploadServerAvatar,
  serverService,
} from "./server.service";
import type { BanDto, BanMemberBody } from "./server.types";
import type {
  ServerMemberDto,
  UserServerDto,
  ServerRole,
} from "./server.types";
import { serverKeys } from "./server.types";
import { useAuth } from "@/src/core/store/auth/useAuth";
import { useAppStore } from "@/src/core/store/appStore";
import { channelsKeys } from "@/src/features/channel/channel.hooks";

/* Clés utilisées par nos hooks (liste user, members, etc.) */
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

export function useUpdateMemberRoleMutation(serverId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: ServerRole;
    }) => {
      if (serverId == null) throw new Error("No server selected");
      return updateMemberRole(serverId, userId, { role });
    },
    onSuccess: () => {
      if (serverId != null) {
        qc.invalidateQueries({ queryKey: serversKeys.members(serverId) });
      }
    },
  });
}

/* Refacto CRUD : mutations create / update server, create channel */
export function useCreateServerMutation() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name: string }) => createServer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serversKeys.user() });
      if (userId != null) {
        queryClient.invalidateQueries({
          queryKey: serverKeys.list({ userId }),
        });
      }
    },
  });
}

export function useUpdateServerMutation() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serverId, name }: { serverId: number; name: string }) =>
      updateServer(serverId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serversKeys.user() });
      if (userId != null) {
        queryClient.invalidateQueries({
          queryKey: serverKeys.list({ userId }),
        });
      }
    },
  });
}

export function useCreateChannelMutation() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      serverId,
      name,
    }: {
      serverId: number;
      name: string;
    }) => serverService.createChannel(serverId, { name }),
    onSuccess: (_, { serverId }) => {
      queryClient.invalidateQueries({ queryKey: serversKeys.user() });
      if (userId != null) {
        queryClient.invalidateQueries({
          queryKey: serverKeys.list({ userId }),
        });
      }
      queryClient.invalidateQueries({
        queryKey: channelsKeys.byServer(serverId),
      });
    },
  });
}

export function useDeleteServerMutation() {
  const queryClient = useQueryClient();
  const setSelectedServerId = useAppStore((s) => s.setSelectedServerId);

  return useMutation({
    mutationFn: (serverId: number) => deleteServer(serverId),
    onSuccess: (_, serverId) => {
      queryClient.invalidateQueries({ queryKey: serversKeys.user() });
      queryClient.invalidateQueries({ queryKey: channelsKeys.all });
      setSelectedServerId(null);
    },
  });
}

export function useLeaveServerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serverId: number) => leaveServer(serverId),
    onSuccess: (_, serverId) => {
      queryClient.invalidateQueries({ queryKey: serversKeys.user() });
      queryClient.invalidateQueries({ queryKey: channelsKeys.all });
      const current = useAppStore.getState().selectedServerId;
      if (current === serverId) {
        useAppStore.getState().setSelectedServerId(null);
      }
    },
  });
}

export const serverBansKey = (serverId: number) =>
  ["servers", "bans", serverId] as const;

export function useKickMemberMutation(serverId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => {
      if (serverId == null) throw new Error("No server selected");
      return kickMember(serverId, userId);
    },
    onSuccess: () => {
      if (serverId != null)
        queryClient.invalidateQueries({ queryKey: serversKeys.members(serverId) });
    },
  });
}

export function useBanMemberMutation(serverId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: BanMemberBody) => {
      if (serverId == null) throw new Error("No server selected");
      return banMember(serverId, body);
    },
    onSuccess: () => {
      if (serverId != null) {
        queryClient.invalidateQueries({ queryKey: serversKeys.members(serverId) });
        queryClient.invalidateQueries({ queryKey: serverBansKey(serverId) });
      }
    },
    onError: (error: Error) => {
      // 409 = already banned — invalidate cache to sync UI and swallow the error
      if (error.message?.includes("already banned") && serverId != null) {
        queryClient.invalidateQueries({ queryKey: serversKeys.members(serverId) });
        queryClient.invalidateQueries({ queryKey: serverBansKey(serverId) });
      }
    },
  });
}

export function useUnbanMemberMutation(serverId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => {
      if (serverId == null) throw new Error("No server selected");
      return unbanMember(serverId, userId);
    },
    onSuccess: () => {
      if (serverId != null)
        queryClient.invalidateQueries({ queryKey: serverBansKey(serverId) });
    },
  });
}

export function useBansQuery(serverId: number | null) {
  return useQuery<BanDto[]>({
    queryKey: serverId != null ? serverBansKey(serverId) : ["servers", "bans", 0],
    queryFn: () => getBans(serverId!),
    enabled: serverId != null,
    retry: false,
  });
}

export function useUploadServerAvatarMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ serverId, file }: { serverId: number; file: File }) =>
      uploadServerAvatar(serverId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serversKeys.user() });
    },
  });
}

export function useTransferOwnershipMutation(serverId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newOwnerId: string) => {
      if (serverId == null) throw new Error("No server selected");
      return transferOwnership(serverId, newOwnerId);
    },
    onSuccess: () => {
      if (serverId != null) {
        queryClient.invalidateQueries({ queryKey: serversKeys.members(serverId) });
        queryClient.invalidateQueries({ queryKey: serversKeys.user() });
      }
    },
  });
}
