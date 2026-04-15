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

/**
 * Payload for event server-channel:created - a channel was created in a server.
 */
export type ServerChannelCreatedEvent = {
  serverId: number;
  channel: {
    id: number;
    serverId: number;
    name: string;
    type: string;
    createdAtIso: string;
    updatedAtIso: string;
  };
};

/**
 * Payload for event server-channel:updated - a channel was updated in a server.
 */
export type ServerChannelUpdatedEvent = {
  serverId: number;
  channel: {
    id: number;
    serverId: number;
    name: string;
    createdAtIso: string;
    updatedAtIso: string;
  };
};

/**
 * Payload for event server-channel:deleted - a channel was deleted in a server.
 */
export type ServerChannelDeletedEvent = {
  serverId: number;
  channelId: number;
};

/**
 * Payload for event server-member:joined - a user joined a server.
 */
export type ServerMemberJoinedEvent = {
  serverId: number;
  member: {
    id: number;
    serveurId: number;
    userId: string;
    role: string;
    rejointLe: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatarUrl: string | null;
    };
  };
};

/**
 * Payload for event user:added-to-server - sent to the new member's personal room.
 * Allows their client to update the server list without a page reload.
 */
export type UserAddedToServerEvent = {
  serverId: number;
  serverName: string;
  role: string;
};

/**
 * Payload for event server-ownership:transferred - sent to all server members.
 */
export type ServerOwnershipTransferredEvent = {
  serverId: number;
  newOwnerId: string;
  previousOwnerId: string;
};

/**
 * Payload for event server-member:banned - sent to all server members and to the banned user.
 */
export type ServerMemberBannedEvent = {
  serverId: number;
  bannedUserId: string;
  bannedByUserId: string;
  raison: string | null;
  expireLe: string | null;
};

/**
 * Payload for event server-member:unbanned - sent to all server members.
 */
export type ServerMemberUnbannedEvent = {
  serverId: number;
  unbannedUserId: string;
  unbannedByUserId: string;
};

/**
 * Payload for event server-member:kicked - sent to all server members and to the kicked user.
 */
export type ServerMemberKickedEvent = {
  serverId: number;
  kickedUserId: string;
  kickedByUserId: string;
};

/**
 * Payload for event message:reaction-updated - sent when a reaction is toggled on a message.
 */
export type MessageReactionUpdatedEvent = {
  messageId: number;
  reactions: { emoji: string; count: number; userIds: string[] }[];
};

/**
 * Payload for event voice-channel:presence - sent when someone joins or leaves a voice channel.
 * Broadcast to all members of the server.
 */
export type VoiceChannelPresenceEvent = {
  channelId: number;
  serverId: number;
  participants: {
    userId: string;
    name: string;
    avatarUrl: string | null;
    isMuted: boolean;
  }[];
};
