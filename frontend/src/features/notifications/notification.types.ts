export type NotificationType = "MENTION" | "PRIVATE_MESSAGE" | "KICKED" | "BANNED";

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

export type NotificationDto = {
  id: number;
  userId: string;
  type: NotificationType;
  data: MentionData | PrivateMessageData | KickedData | BannedData;
  lu: boolean;
  creeLe: string;
};
