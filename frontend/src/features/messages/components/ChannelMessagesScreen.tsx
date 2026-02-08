"use client";

import React from "react";
import { useParams } from "next/navigation";
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
} from "@/src/features/channel/channel.hooks";
import { useChannelMessagesRealtime } from "@/src/features/channel/channelRealtime.hooks";

const CHANNEL_AVATAR_COLOR = "#6b7280";

function buildChannelHeader(channelName: string): ConversationHeaderType {
  const initial = channelName.slice(0, 1).toUpperCase() || "#";
  return {
    title: channelName,
    subtitle: "Channel",
    avatarText: initial,
    avatarColor: CHANNEL_AVATAR_COLOR,
    showAvatar: false,
  };
}

export function ChannelMessagesScreen() {
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
  const sendMessageMutation = useSendChannelMessageMutation(channelId ?? 0);

  useChannelMessagesRealtime(channelId);

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
      content: m.contenu,
      createdAtIso: m.creeLe,
      isMe: m.auteurId === user.id,
    }));
  }, [messagesData, user]);

  const [rightPanelOpen, setRightPanelOpen] = React.useState(true);
  const [composerValue, setComposerValue] = React.useState("");

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

  if (channelId == null || Number.isNaN(channelId)) {
    return (
      <main className={styles.root}>
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>No channel selected</p>
          <p className={styles.emptyStateSubtitle}>
            Select a channel from the sidebar.
          </p>
        </div>
      </main>
    );
  }

  if (channelLoading || !channel) {
    return (
      <main className={styles.root}>
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>Loading channel…</p>
        </div>
      </main>
    );
  }

  const conversationHeader = buildChannelHeader(channel.name);

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
              <p className={styles.emptyStateSubtitle}>Loading messages…</p>
            </div>
          ) : (
            <>
              <MessageList messages={messages} />
              <MessageComposer
                value={composerValue}
                onChange={setComposerValue}
                onSubmit={send}
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
