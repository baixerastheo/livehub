import { fetchJson } from "@/src/lib/apiClient";
import type {
  GetPrivateConversationResponseDto,
  ListPrivateConversationsResponseDto,
  SendPrivateMessageResponseDto,
} from "@/src/features/messages/messages.types";

export async function listPrivateConversations(): Promise<ListPrivateConversationsResponseDto> {
  return fetchJson<ListPrivateConversationsResponseDto>(
    "/conversations/private",
    { method: "GET" },
  );
}

export async function getPrivateConversation(
  peerUserId: string,
): Promise<GetPrivateConversationResponseDto> {
  return fetchJson<GetPrivateConversationResponseDto>(
    `/messages/private/${encodeURIComponent(peerUserId)}`,
    { method: "GET" },
  );
}

export async function sendPrivateMessage(
  peerUserId: string,
  content: string,
): Promise<SendPrivateMessageResponseDto> {
  return fetchJson<SendPrivateMessageResponseDto>(
    `/messages/private/${encodeURIComponent(peerUserId)}`,
    {
      method: "POST",
      body: { content },
    },
  );
}

export async function editPrivateMessage(
  messageId: number,
  content: string,
): Promise<{ id: string; content: string; editedAtIso: string | null }> {
  return fetchJson(`/messages/private/${messageId}`, {
    method: "PATCH",
    body: { content },
  });
}

export const privateMessageService = {
  listPrivateConversations,
  getPrivateConversation,
  sendPrivateMessage,
  editPrivateMessage,
};
