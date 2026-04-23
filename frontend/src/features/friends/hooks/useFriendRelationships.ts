"use client";

import React from "react";
import { useAuth } from "@/src/core/store/auth/useAuth";
import {
  useFriendRequestsQuery,
  useFriendsQuery,
} from "@/src/features/friends/friends.hooks";

export function useFriendRelationships() {
  const { user } = useAuth();
  const myId = user?.id ?? null;

  const friendsQuery = useFriendsQuery();
  const requestsQuery = useFriendRequestsQuery();

  const friendIds = React.useMemo(() => {
    const friends = friendsQuery.data ?? [];
    return friends.map((friend) => friend.id);
  }, [friendsQuery.data]);

  const outgoingRequestUserIds = React.useMemo(() => {
    if (!myId) return [];
    const requests = requestsQuery.data ?? [];
    return requests
      .filter((r) => r.fromUser?.id === myId)
      .map((r) => r.toUser.id);
  }, [myId, requestsQuery.data]);

  const incomingRequestUserIds = React.useMemo(() => {
    if (!myId) return [];
    const requests = requestsQuery.data ?? [];
    return requests
      .filter((r) => r.toUser?.id === myId)
      .map((r) => r.fromUser.id);
  }, [myId, requestsQuery.data]);

  return {
    friendIds,
    outgoingRequestUserIds,
    incomingRequestUserIds,
  };
}
