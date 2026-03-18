import { fetchJson } from "@/src/lib/apiClient";
import type { ReactionDto } from "@/src/features/messages/messages.types";

export async function toggleChannelReaction(
  messageId: number,
  emoji: string,
): Promise<ReactionDto[]> {
  return fetchJson<ReactionDto[]>(
    `/messages/channel/${messageId}/reactions`,
    { method: "POST", body: { emoji } },
  );
}

export async function togglePrivateReaction(
  messageId: number,
  emoji: string,
): Promise<ReactionDto[]> {
  return fetchJson<ReactionDto[]>(
    `/messages/private/${messageId}/reactions`,
    { method: "POST", body: { emoji } },
  );
}

export const reactionService = {
  toggleChannelReaction,
  togglePrivateReaction,
};
