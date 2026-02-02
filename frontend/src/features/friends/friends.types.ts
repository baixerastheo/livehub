import type { UtilisateurDto } from "@/src/features/users/users.types";

export type FriendshipStatus =
  | "none"
  | "friends"
  | "outgoing_request"
  | "incoming_request";

export type FriendDto = UtilisateurDto;

export type FriendRequestStatus = "pending" | "accepted" | "declined";

export type FriendRequestDto = {
  id: string;
  fromUser: UtilisateurDto;
  toUser: UtilisateurDto;
  status: FriendRequestStatus;
  createdAt: string;
};

export type ListFriendsResponseDto = FriendDto[];
export type ListFriendRequestsResponseDto = FriendRequestDto[];

export type FriendsKeysInput = {
  userId?: number | null;
};

export const friendsKeys = {
  all: ["friends"] as const,
  lists: () => [...friendsKeys.all, "list"] as const,
  list: (input: FriendsKeysInput) => [...friendsKeys.lists(), input] as const,
  requests: () => [...friendsKeys.all, "requests"] as const,
  requestsList: (input: FriendsKeysInput) =>
    [...friendsKeys.requests(), input] as const,
};

