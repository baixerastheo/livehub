"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { privateMessageService } from "@/src/features/messages/privateMessage.service";

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
    onSuccess: (_data, { peerUserId }) => {
      // Refetch immédiat pour que la nouvelle conv apparaisse dans la sidebar sans refresh
      void queryClient.refetchQueries({ queryKey: privateConversationsKey });
      queryClient.invalidateQueries({
        queryKey: privateConversationKey(peerUserId),
      });
    },
  });
}
