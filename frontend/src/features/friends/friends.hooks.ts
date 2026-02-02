"use client";

import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/src/core/store/auth/useAuthStore";
import { friendsKeys } from "@/src/features/friends/friends.types";
import { friendsService } from "@/src/features/friends/friends.service";

export function useFriendsQuery() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useQuery({
    queryKey: friendsKeys.list({ userId }),
    queryFn: accessToken ? () => friendsService.listFriends(accessToken) : skipToken,
  });
}

export function useFriendRequestsQuery() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useQuery({
    queryKey: friendsKeys.requestsList({ userId }),
    queryFn: accessToken ? () => friendsService.listRequests(accessToken) : skipToken,
  });
}

export function useSendFriendRequestMutation() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (toUserId: number) => {
      if (!accessToken) throw new Error("Unauthenticated");
      await friendsService.sendRequest(accessToken, toUserId);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: friendsKeys.requestsList({ userId }) });
      await qc.invalidateQueries({ queryKey: friendsKeys.list({ userId }) });
    },
  });
}

export function useAcceptFriendRequestMutation() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!accessToken) throw new Error("Unauthenticated");
      await friendsService.acceptRequest(accessToken, requestId);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: friendsKeys.requestsList({ userId }) });
      await qc.invalidateQueries({ queryKey: friendsKeys.list({ userId }) });
    },
  });
}

export function useDeclineFriendRequestMutation() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!accessToken) throw new Error("Unauthenticated");
      await friendsService.declineRequest(accessToken, requestId);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: friendsKeys.requestsList({ userId }) });
      await qc.invalidateQueries({ queryKey: friendsKeys.list({ userId }) });
    },
  });
}

