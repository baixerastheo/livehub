"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reactionService } from "@/src/features/messages/reaction.service";
import { channelsKeys } from "@/src/features/channel/channel.hooks";
import { privateConversationKey } from "@/src/features/messages/privateMessage.hooks";
import type { ChannelMessageBackendDto } from "@/src/features/channel/channel.service";
import type { GetPrivateConversationResponseDto } from "@/src/features/messages/messages.types";

export function useToggleChannelReactionMutation(channelId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: number; emoji: string }) =>
      reactionService.toggleChannelReaction(messageId, emoji),
    onSuccess: (reactions, { messageId }) => {
      if (channelId == null) return;
      queryClient.setQueryData<ChannelMessageBackendDto[]>(
        channelsKeys.messages(channelId),
        (old) => {
          if (!old) return old;
          return old.map((m) =>
            m.id === messageId ? { ...m, reactions } : m,
          );
        },
      );
    },
  });
}

export function useTogglePrivateReactionMutation(peerUserId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: number; emoji: string }) =>
      reactionService.togglePrivateReaction(messageId, emoji),
    onSuccess: (reactions, { messageId }) => {
      if (!peerUserId) return;
      queryClient.setQueryData<GetPrivateConversationResponseDto>(
        privateConversationKey(peerUserId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            messages: old.messages.map((m) =>
              m.id === String(messageId) ? { ...m, reactions } : m,
            ),
          };
        },
      );
    },
  });
}
