export type PrivateConversationPeerDto = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
};

export type ReactionDto = {
  emoji: string;
  count: number;
  userIds: string[];
};

export type PrivateMessageDto = {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAtIso: string;
  isMe: boolean;
  read: boolean;
  reactions?: ReactionDto[];
};

export type GetPrivateConversationResponseDto = {
  peer: PrivateConversationPeerDto;
  messages: PrivateMessageDto[];
};

export type SendPrivateMessageResponseDto = PrivateMessageDto;

/** One item from GET /conversations/private (list of conversation peers). */
export type PrivateConversationListItemDto = {
  peer: PrivateConversationPeerDto;
  lastMessageAt: string | null;
  lastMessageContent: string | null;
};

export type ListPrivateConversationsResponseDto =
  PrivateConversationListItemDto[];
