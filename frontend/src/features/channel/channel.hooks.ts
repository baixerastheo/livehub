"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getChannelsByServer,
  getChannelById,
  getChannelMessages,
  sendChannelMessage,
} from "./channel.service";
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
