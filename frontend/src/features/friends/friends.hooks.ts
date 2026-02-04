"use client";

import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@/src/core/store/auth/useAuth";
import { friendsKeys } from "@/src/features/friends/friends.types";
import { friendsService } from "@/src/features/friends/friends.service";

/** Returns [] when backend has no friends API (404). */
async function safeListFriends() {
  try {
    return await friendsService.listFriends();
  } catch {
    return [];
  }
}

/** Returns [] when backend has no friends API (404). */
async function safeListRequests() {
  try {
    return await friendsService.listRequests();
  } catch {
    return [];
  }
}

export function useFriendsQuery() {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: friendsKeys.list({ userId }),
    queryFn: isAuthenticated ? safeListFriends : skipToken,
  });
}

export function useFriendRequestsQuery() {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: friendsKeys.requestsList({ userId }),
    queryFn: isAuthenticated ? safeListRequests : skipToken,
  });
}

export function useSendFriendRequestMutation() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (toUserId: string) => {
      await friendsService.sendRequest(toUserId);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: friendsKeys.requestsList({ userId }),
      });
      await qc.invalidateQueries({ queryKey: friendsKeys.list({ userId }) });
    },
  });
}

export function useAcceptFriendRequestMutation() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      await friendsService.acceptRequest(requestId);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: friendsKeys.requestsList({ userId }),
      });
      await qc.invalidateQueries({ queryKey: friendsKeys.list({ userId }) });
    },
  });
}

export function useDeclineFriendRequestMutation() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      await friendsService.declineRequest(requestId);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: friendsKeys.requestsList({ userId }),
      });
      await qc.invalidateQueries({ queryKey: friendsKeys.list({ userId }) });
    },
  });
}
