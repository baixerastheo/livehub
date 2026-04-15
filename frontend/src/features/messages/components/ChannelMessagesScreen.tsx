"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import styles from "../styles/MessagesScreen.module.css";
import type { ChatMessage, ConversationHeader as ConversationHeaderType } from "@/src/features/messages/messages.mock";
import { ParticlesBackground } from "@/src/features/shared/components/particles/ParticlesBackground";
import { ConversationHeader } from "@/src/features/messages/components/ConversationHeader";
import { MessageList } from "@/src/features/messages/components/MessageList";
import { MessageComposer } from "@/src/features/messages/components/MessageComposer";
import { ServerMembersPanel } from "@/src/features/server/components/ServerMembersPanel";
import { useAuth } from "@/src/core/store/auth/useAuth";
import { useAppStore } from "@/src/core/store/appStore";
import {
  useChannelQuery,
  useChannelMessagesQuery,
  useSendChannelMessageMutation,
  useDeleteChannelMessageMutation,
} from "@/src/features/channel/channel.hooks";
import {
  useChannelMessagesRealtime,
  useChannelReactionRealtime,
  useChannelTyping,
  useChannelTypingEmitter,
} from "@/src/features/channel/channelRealtime.hooks";
import { useToggleChannelReactionMutation } from "@/src/features/messages/reaction.hooks";
import { useUserServersQuery, useServerMembersQuery } from "@/src/features/server/server.hooks";
import type { ServerRole } from "@/src/features/server/server.types";
import type { MentionMember } from "./MessageComposer";

const CHANNEL_AVATAR_COLOR = "#6b7280";

function buildChannelHeader(channelName: string, subtitle: string): ConversationHeaderType {
  const initial = channelName.slice(0, 1).toUpperCase() || "#";
  return {
    title: channelName,
    subtitle,
    avatarText: initial,
    avatarColor: CHANNEL_AVATAR_COLOR,
    showAvatar: false,
  };
}

export function ChannelMessagesScreen() {
  const t = useTranslations("messages");
  const params = useParams();
  const channelIdParam = params?.channelId;
  const channelId =
    typeof channelIdParam === "string" ? parseInt(channelIdParam, 10) : null;

  const { user } = useAuth();
  const setSelectedServerId = useAppStore((s) => s.setSelectedServerId);
  const setSidebarSection = useAppStore((s) => s.setSidebarSection);
  const { data: channel, isLoading: channelLoading } = useChannelQuery(channelId);
  const { data: messagesData, isLoading: messagesLoading } =
    useChannelMessagesQuery(channelId);
  const { data: userServers } = useUserServersQuery();
  const { data: serverMembers } = useServerMembersQuery(channel?.serverId ?? null);
  const sendMessageMutation = useSendChannelMessageMutation(channelId ?? 0);
  const deleteMessageMutation = useDeleteChannelMessageMutation(channelId);
  const toggleReactionMutation = useToggleChannelReactionMutation(channelId);
  const [rightPanelOpen, setRightPanelOpen] = React.useState(
    () => typeof window !== "undefined" && window.innerWidth > 980,
  );
  const [composerValue, setComposerValue] = React.useState("");

  useChannelMessagesRealtime(channelId);
  useChannelReactionRealtime(channelId);

  const typingUsers = useChannelTyping(channelId, user?.id ?? null);
  useChannelTypingEmitter(
    channelId,
    composerValue,
    user?.name ?? user?.email ?? "Someone",
  );

  const mentionMembers = React.useMemo<MentionMember[]>(
    () =>
      serverMembers?.map((m) => ({
        id: m.userId,
        name: m.user.name,
        avatarUrl: m.user.avatarUrl,
      })) ?? [],
    [serverMembers],
  );

  const membersById = React.useMemo<Record<string, string>>(
    () =>
      Object.fromEntries(mentionMembers.map((m) => [m.id, m.name])),
    [mentionMembers],
  );

  const canDeleteMessages = React.useMemo(() => {
    if (!channel || !userServers) return false;
    const membership = userServers.find(
      (u) => u.server.id === channel.serverId,
    );
    const role = membership?.role as ServerRole | undefined;
    return role === "PROPRIETAIRE" || role === "ADMINISTRATEUR";
  }, [channel, userServers]);

  React.useEffect(() => {
    if (channel) {
      setSelectedServerId(channel.serverId);
      setSidebarSection("teams");
    }
  }, [channel, setSelectedServerId, setSidebarSection]);

  const messages: ChatMessage[] = React.useMemo(() => {
    if (!messagesData || !user) return [];
    return messagesData.map((m) => ({
      id: String(m.id),
      author: m.auteur?.name ?? m.auteur?.email ?? "?",
      authorAvatarUrl: m.auteur?.avatarUrl,
      content: m.contenu,
      createdAtIso: m.creeLe,
      isMe: m.auteurId === user.id,
      reactions: m.reactions,
    }));
  }, [messagesData, user]);

  const send = async () => {
    const trimmed = composerValue.trim();
    if (!trimmed || channelId == null) return;
    try {
      await sendMessageMutation.mutateAsync(trimmed);
      setComposerValue("");
    } catch {
      // ignore
    }
  };

  const sendGif = async (gif: import("@/src/features/shared/lib/api/gifs.types").Gif) => {
    if (channelId == null) return;
    const url = gif.file?.md?.gif?.url ?? gif.file?.sm?.gif?.url ?? gif.file?.hd?.gif?.url ?? "";
    if (!url) return;
    try {
      await sendMessageMutation.mutateAsync(`[gif]${url}`);
    } catch {
      // ignore
    }
  };

  if (channelId == null || Number.isNaN(channelId)) {
    return (
      <main className={styles.root}>
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>{t("noChannelSelected")}</p>
          <p className={styles.emptyStateSubtitle}>{t("selectChannel")}</p>
        </div>
      </main>
    );
  }

  if (channelLoading || !channel) {
    return (
      <main className={styles.root}>
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>{t("loadingChannel")}</p>
        </div>
      </main>
    );
  }

  const conversationHeader = buildChannelHeader(channel.name, t("channel"));

  return (
    <main className={styles.root}>
      <ConversationHeader
        header={conversationHeader}
        onToggleDetails={() => setRightPanelOpen((v) => !v)}
      />

      <div className={styles.content}>
        <section className={styles.thread} aria-label="Channel message thread">
          <ParticlesBackground tone="black" />
          {messagesLoading ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyStateSubtitle}>{t("loadingMessages")}</p>
            </div>
          ) : (
            <>
              <MessageList
                messages={messages}
                currentUserId={user?.id ?? null}
                canDeleteMessages={canDeleteMessages}
                onDeleteMessage={(messageId) =>
                  deleteMessageMutation.mutate(messageId)
                }
                isDeletingMessageId={
                  deleteMessageMutation.isPending &&
                  deleteMessageMutation.variables !== undefined
                    ? deleteMessageMutation.variables
                    : null
                }
                onToggleReaction={(messageId, emoji) =>
                  toggleReactionMutation.mutate({ messageId, emoji })
                }
                membersById={membersById}
              />
              {typingUsers.length > 0 && (
                <p className={styles.typingIndicator} aria-live="polite">
                  {typingUsers.length === 1
                    ? t("isTyping", { name: typingUsers[0].userName })
                    : typingUsers.length === 2
                      ? t("twoTyping", { name: typingUsers[0].userName, name2: typingUsers[1].userName })
                      : t("manyTyping", { names: typingUsers.map((u) => u.userName).join(", ") })}
                </p>
              )}
              <MessageComposer
                value={composerValue}
                onChange={setComposerValue}
                onSubmit={send}
                onGifSelect={sendGif}
                members={mentionMembers}
              />
            </>
          )}
        </section>

        {rightPanelOpen ? (
          <ServerMembersPanel serverId={channel.serverId} />
        ) : null}
      </div>
    </main>
  );
}
