"use client";

import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/src/core/store/auth/useAuth";
import { serverKeys } from "@/src/features/server/server.types";
import { serverService } from "@/src/features/server/server.service";

export function useUserServersQuery() {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: serverKeys.list({ userId }),
    queryFn: isAuthenticated ? () => serverService.listUserServers() : skipToken,
  });
}

export function useCreateServerMutation() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name: string }) => serverService.createServer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serverKeys.list({ userId }) });
    },
  });
}

export function useUpdateServerMutation() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serverId, name }: { serverId: number; name: string }) =>
      serverService.updateServer(serverId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serverKeys.list({ userId }) });
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
      queryClient.invalidateQueries({ queryKey: serverKeys.list({ userId }) });
      queryClient.invalidateQueries({ queryKey: serverKeys.channels(serverId) });
    },
  });
}
