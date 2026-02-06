export type ChatMessage = {
  id: string;
  author: string;
  content: string;
  createdAtIso: string;
  isMe?: boolean;
};

export type ConversationHeader = {
  title: string;
  subtitle: string;
  avatarText: string;
  avatarColor: string;
  avatarUrl?: string | null;
  showAvatar?: boolean;
};

export const MOCK_CONVERSATION: ConversationHeader = {
  title: "Default Channel",
  subtitle: "Private message",
  avatarText: "DC",
  avatarColor: "#7c3aed",
};


