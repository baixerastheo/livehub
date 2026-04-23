"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getChannelsByServer,
  getChannelById,
  getChannelMessages,
  sendChannelMessage,
  deleteChannel,
  deleteChannelMessage,
  editChannelMessage,
} from "./channel.service";
import type { ChannelMessageBackendDto } from "./channel.service";
import type { ChannelDto } from "./channel.types";

export const channelsKeys = {
  all: ["channels"] as const,
  byServer: (serverId: number) =>
    [...channelsKeys.all, "server", serverId] as const,
  detail: (channelId: number) =>
    [...channelsKeys.all, "detail", channelId] as const,
  messages: (channelId: number) =>
    [...channelsKeys.all, "messages", channelId] as const,
};

export function useChannelsByServerQuery(serverId: number | null) {
  return useQuery<ChannelDto[]>({
    queryKey: channelsKeys.byServer(serverId ?? 0),
    queryFn: () => getChannelsByServer(serverId!),
    enabled: serverId !== null,
  });
}

export function useChannelQuery(channelId: number | null) {
  return useQuery({
    queryKey: channelId ? channelsKeys.detail(channelId) : ["channels", "detail", 0],
    queryFn: () => getChannelById(channelId!),
    enabled: channelId !== null,
  });
}

export function useChannelMessagesQuery(channelId: number | null) {
  return useQuery({
    queryKey: channelId ? channelsKeys.messages(channelId) : ["channels", "messages", 0],
    queryFn: () => getChannelMessages(channelId!),
    enabled: channelId !== null,
  });
}

export function useSendChannelMessageMutation(channelId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => sendChannelMessage(channelId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelsKeys.messages(channelId) });
    },
  });
}

export function useDeleteChannelMessageMutation(channelId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: number) => deleteChannelMessage(messageId),
    onSuccess: () => {
      if (channelId != null) {
        queryClient.invalidateQueries({
          queryKey: channelsKeys.messages(channelId),
        });
      }
    },
  });
}

export function useEditChannelMessageMutation(channelId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: number; content: string }) =>
      editChannelMessage(messageId, content),
    onSuccess: (data, { messageId }) => {
      if (channelId == null) return;
      queryClient.setQueryData<ChannelMessageBackendDto[]>(
        channelsKeys.messages(channelId),
        (old) => old?.map((m) =>
          m.id === messageId
            ? { ...m, contenu: data.content, editeLe: data.editedAtIso }
            : m,
        ) ?? old,
      );
    },
  });
}

export function useDeleteChannelMutation(serverId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (channelId: number) => deleteChannel(channelId),
    onSuccess: (_, channelId) => {
      if (serverId != null) {
        queryClient.invalidateQueries({ queryKey: channelsKeys.byServer(serverId) });
      }
      queryClient.invalidateQueries({ queryKey: channelsKeys.detail(channelId) });
      queryClient.invalidateQueries({ queryKey: channelsKeys.messages(channelId) });
    },
  });
}
