"use client";

import React from "react";
import { useAuthStore } from "@/src/core/store/auth/useAuthStore";
import {
  useFriendRequestsQuery,
  useFriendsQuery,
} from "@/src/features/friends/friends.hooks";

export function useFriendRelationships() {
  const myUserId = useAuthStore((state) => state.user?.id ?? null);

  const friendsQuery = useFriendsQuery();
  const requestsQuery = useFriendRequestsQuery();

  const friendIds = React.useMemo(() => {
    const friends = friendsQuery.data ?? [];
    return friends.map((friend) => friend.id);
  }, [friendsQuery.data]);

  const outgoingRequestUserIds = React.useMemo(() => {
    if (!myUserId) return [];

    const requests = requestsQuery.data ?? [];
    const isOutgoingRequest = (request: (typeof requests)[number]) =>
      request.fromUser?.id === myUserId;

    return requests.filter(isOutgoingRequest).map((request) => request.toUser.id);
  }, [myUserId, requestsQuery.data]);

  const incomingRequestUserIds = React.useMemo(() => {
    if (!myUserId) return [];

    const requests = requestsQuery.data ?? [];
    const isIncomingRequest = (request: (typeof requests)[number]) =>
      request.toUser?.id === myUserId;

    return requests.filter(isIncomingRequest).map((request) => request.fromUser.id);
  }, [myUserId, requestsQuery.data]);

  return {
    friendIds,
    outgoingRequestUserIds,
    incomingRequestUserIds,
  };
}

