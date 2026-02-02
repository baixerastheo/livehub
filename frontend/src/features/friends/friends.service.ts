import { fetchJson } from "@/src/lib/apiClient";
import type {
  ListFriendRequestsResponseDto,
  ListFriendsResponseDto,
} from "@/src/features/friends/friends.types";

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function listFriends(
  accessToken: string,
): Promise<ListFriendsResponseDto> {
  return fetchJson<ListFriendsResponseDto>("/friends", {
    method: "GET",
    headers: authHeaders(accessToken),
  });
}

export async function listRequests(
  accessToken: string,
): Promise<ListFriendRequestsResponseDto> {
  return fetchJson<ListFriendRequestsResponseDto>("/friends/requests", {
    method: "GET",
    headers: authHeaders(accessToken),
  });
}

export async function sendRequest(
  accessToken: string,
  toUserId: number,
): Promise<void> {
  await fetchJson<void>("/friends/requests", {
    method: "POST",
    headers: authHeaders(accessToken),
    body: { toUserId },
  });
}

export async function acceptRequest(
  accessToken: string,
  requestId: string,
): Promise<void> {
  await fetchJson<void>(`/friends/requests/${requestId}/accept`, {
    method: "POST",
    headers: authHeaders(accessToken),
  });
}

export async function declineRequest(
  accessToken: string,
  requestId: string,
): Promise<void> {
  await fetchJson<void>(`/friends/requests/${requestId}/decline`, {
    method: "POST",
    headers: authHeaders(accessToken),
  });
}

export const friendsService = {
  acceptRequest,
  declineRequest,
  listFriends,
  listRequests,
  sendRequest,
};

