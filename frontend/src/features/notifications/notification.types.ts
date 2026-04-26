export type NotificationType =
  | "MENTION"
  | "PRIVATE_MESSAGE"
  | "KICKED"
  | "BANNED"
  | "FRIEND_REQUEST_RECEIVED"
  | "FRIEND_REQUEST_ACCEPTED"
  | "FRIEND_REQUEST_DECLINED";

export type MentionData = {
  channelId: number;
  serverId: number;
  authorName: string;
  messagePreview: string;
};

export type PrivateMessageData = {
  authorId: string;
  authorName: string;
  content: string;
};

export type KickedData = {
  serverId: number;
};

export type BannedData = {
  serverId: number;
  raison: string | null;
  expireLe: string | null;
};

export type FriendRequestReceivedData = {
  fromUserId: string;
  fromUserName: string;
};

export type FriendRequestAcceptedData = {
  byUserId: string;
  byUserName: string;
};

export type FriendRequestDeclinedData = {
  byUserId: string;
  byUserName: string;
};

export type NotificationDto = {
  id: number;
  userId: string;
  type: NotificationType;
  data:
    | MentionData
    | PrivateMessageData
    | KickedData
    | BannedData
    | FriendRequestReceivedData
    | FriendRequestAcceptedData
    | FriendRequestDeclinedData;
  lu: boolean;
  creeLe: string;
};
