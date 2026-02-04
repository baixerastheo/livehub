import { fetchJson } from "@/src/lib/apiClient";
import type {
  ListFriendRequestsResponseDto,
  ListFriendsResponseDto,
} from "@/src/features/friends/friends.types";

/** Auth is via cookies (credentials: "include") — no Bearer token. */

export async function listFriends(): Promise<ListFriendsResponseDto> {
  return fetchJson<ListFriendsResponseDto>("/friends", { method: "GET" });
}

export async function listRequests(): Promise<ListFriendRequestsResponseDto> {
  return fetchJson<ListFriendRequestsResponseDto>("/friends/requests", {
    method: "GET",
  });
}

export async function sendRequest(toUserId: string): Promise<void> {
  await fetchJson<void>("/friends/requests", {
    method: "POST",
    body: { toUserId },
  });
}

export async function acceptRequest(requestId: string): Promise<void> {
  await fetchJson<void>(`/friends/requests/${requestId}/accept`, {
    method: "POST",
  });
}

export async function declineRequest(requestId: string): Promise<void> {
  await fetchJson<void>(`/friends/requests/${requestId}/decline`, {
    method: "POST",
  });
}

export const friendsService = {
  acceptRequest,
  declineRequest,
  listFriends,
  listRequests,
  sendRequest,
};
