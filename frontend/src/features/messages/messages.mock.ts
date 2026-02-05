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
  /** URL signée de l’avatar (si présente, affichée à la place de avatarColor + avatarText). */
  avatarUrl?: string | null;
};

export const MOCK_CONVERSATION: ConversationHeader = {
  title: "Default Channel",
  subtitle: "Private message",
  avatarText: "DC",
  avatarColor: "#7c3aed",
};


