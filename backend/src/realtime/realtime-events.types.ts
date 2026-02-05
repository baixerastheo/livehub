/**
 * Payload sent by the backend for event private-message:created.
 */
export type PrivateMessageCreatedEvent = {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAtIso: string;
  read: boolean;
  peerUserId: string;
};

/**
 * Payload sent by the backend for event channel-message:created.
 */
export type ChannelMessageCreatedEvent = {
  channelId: number;
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAtIso: string;
};
