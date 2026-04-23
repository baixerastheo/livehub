"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { privateMessageService } from "@/src/features/messages/privateMessage.service";
import type { GetPrivateConversationResponseDto } from "@/src/features/messages/messages.types";

export const privateConversationsKey = ["conversations", "private"] as const;

export const privateConversationKey = (peerUserId: string) =>
  ["conversations", "private", peerUserId] as const;

export function usePrivateConversationsQuery(enabled: boolean) {
  return useQuery({
    queryKey: privateConversationsKey,
    queryFn: () => privateMessageService.listPrivateConversations(),
    enabled,
  });
}

export function usePrivateConversationQuery(peerUserId: string | null) {
  return useQuery({
    queryKey: peerUserId
      ? privateConversationKey(peerUserId)
      : (["conversations", "private", ""] as const),
    queryFn: () =>
      privateMessageService.getPrivateConversation(peerUserId as string),
    enabled: !!peerUserId,
  });
}

export function useEditPrivateMessageMutation(peerUserId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: number; content: string }) =>
      privateMessageService.editPrivateMessage(messageId, content),
    onSuccess: (data, { messageId }) => {
      if (!peerUserId) return;
      queryClient.setQueryData<GetPrivateConversationResponseDto>(
        privateConversationKey(peerUserId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            messages: old.messages.map((m) =>
              m.id === String(messageId)
                ? { ...m, content: data.content, editedAtIso: data.editedAtIso }
                : m,
            ),
          };
        },
      );
    },
  });
}

export function useSendPrivateMessageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      peerUserId,
      content,
    }: {
      peerUserId: string;
      content: string;
    }) => privateMessageService.sendPrivateMessage(peerUserId, content),
    onSuccess: (data, { peerUserId }) => {
      queryClient.setQueryData<GetPrivateConversationResponseDto>(
        privateConversationKey(peerUserId),
        (old) => {
          if (!old) return old;
          if (old.messages.some((m) => m.id === data.id)) return old;
          return { ...old, messages: [...old.messages, data] };
        },
      );
      void queryClient.refetchQueries({ queryKey: privateConversationsKey });
    },
  });
}
