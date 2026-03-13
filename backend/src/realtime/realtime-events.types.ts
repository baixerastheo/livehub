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
