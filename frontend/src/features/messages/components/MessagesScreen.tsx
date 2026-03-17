"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import styles from "../styles/MessagesScreen.module.css";
import type {
  ChatMessage,
  ConversationHeader as ConversationHeaderType,
} from "@/src/features/messages/messages.mock";
import { ParticlesBackground } from "@/src/features/shared/components/particles/ParticlesBackground";
import { ConversationHeader } from "@/src/features/messages/components/ConversationHeader";
import { MessageList } from "@/src/features/messages/components/MessageList";
import { MessageComposer } from "@/src/features/messages/components/MessageComposer";
import { ConversationDetailsPanel } from "@/src/features/messages/components/ConversationDetailsPanel";
import { useUserQuery } from "@/src/features/users/users.hooks";
import {
  usePrivateConversationQuery,
  useSendPrivateMessageMutation,
} from "@/src/features/messages/privateMessage.hooks";
import { usePrivateMessagesRealtime } from "@/src/features/messages/privateMessageRealtime.hooks";

const AVATAR_COLORS = [
  "#7c3aed",
  "#2563eb",
  "#059669",
  "#b45309",
  "#be123c",
  "#4f46e5",
];

function buildHeaderFromPeer(
  displayName: string,
  userId: string,
  peerUser: { avatarUrl?: string | null } | null | undefined,
  subtitle: string,
): ConversationHeaderType {
  const initial = displayName.slice(0, 2).toUpperCase() || "?";
  const colorIndex =
    userId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    AVATAR_COLORS.length;
  return {
    title: displayName,
    subtitle,
    avatarText: initial,
    avatarColor: AVATAR_COLORS[colorIndex],
    avatarUrl: peerUser?.avatarUrl ?? undefined,
  };
}

export function MessagesScreen() {
  const searchParams = useSearchParams();
  const t = useTranslations("messages");
  const peerUserId = searchParams.get("with");
  const peerNameFromUrl = searchParams.get("name");
  const decodedPeerName = peerNameFromUrl
    ? decodeURIComponent(peerNameFromUrl)
    : null;

  const { data: peerUser } = useUserQuery(peerUserId ?? undefined);
  const { data: conversationData } = usePrivateConversationQuery(peerUserId);
  const sendMessageMutation = useSendPrivateMessageMutation();

  usePrivateMessagesRealtime(peerUserId);

  const displayName =
    peerUser?.name ?? peerUser?.email ?? decodedPeerName ?? "User";

  const messages: ChatMessage[] = React.useMemo(() => {
    const list = conversationData?.messages ?? [];
    return list.map((m) => ({
      id: m.id,
      author: m.authorName,
      content: m.content,
      createdAtIso: m.createdAtIso,
      isMe: m.isMe,
    }));
  }, [conversationData?.messages]);

  const [rightPanelOpen, setRightPanelOpen] = React.useState(true);
  const [composerValue, setComposerValue] = React.useState("");

  const send = async () => {
    const trimmed = composerValue.trim();
    if (!trimmed || !peerUserId) return;
    try {
      await sendMessageMutation.mutateAsync({ peerUserId, content: trimmed });
      setComposerValue("");
    } catch {
    }
  };

  const sendGif = async (gif: import("@/src/features/shared/lib/api/gifs.types").Gif) => {
    if (!peerUserId) return;
    const url = gif.file?.md?.gif?.url ?? gif.file?.sm?.gif?.url ?? gif.file?.hd?.gif?.url ?? "";
    if (!url) return;
    try {
      await sendMessageMutation.mutateAsync({ peerUserId, content: `[gif]${url}` });
    } catch {
    }
  };

  if (!peerUserId) {
    return (
      <main className={styles.root}>
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>{t("noConversationSelected")}</p>
          <p className={styles.emptyStateSubtitle}>
            {t("startPrivateConversation")}
          </p>
          <Link href="/people" className={styles.emptyStateLink}>
            {t("goToPeople")}
          </Link>
        </div>
      </main>
    );
  }

  const conversationHeader = buildHeaderFromPeer(
    displayName,
    peerUserId,
    peerUser,
    t("privateMessage"),
  );

  return (
    <main className={styles.root}>
      <ConversationHeader
        header={conversationHeader}
        onToggleDetails={() => setRightPanelOpen((v) => !v)}
      />

      <div className={styles.content}>
        <section className={styles.thread} aria-label="Message thread">
          <ParticlesBackground tone="black" />
          <MessageList messages={messages} />
          <MessageComposer
            value={composerValue}
            onChange={setComposerValue}
            onSubmit={send}
            onGifSelect={sendGif}
          />
        </section>

        {rightPanelOpen ? (
          <ConversationDetailsPanel
            mode={t("privateMessage")}
            activeTitle={conversationHeader.title}
            onClose={() => setRightPanelOpen(false)}
          />
        ) : null}
      </div>
    </main>
  );
}
