"use client";

import React from "react";
import { useTranslations } from "next-intl";
import styles from "../styles/MessageList.module.css";
import type { ChatMessage } from "@/src/features/messages/messages.mock";
import { MessageBubble } from "@/src/features/messages/components/MessageBubble";
import { FiChevronDown } from "react-icons/fi";

type Props = {
  messages: ChatMessage[];
  currentUserId?: string | null;
  canDeleteMessages?: boolean;
  onDeleteMessage?: (messageId: number) => void;
  isDeletingMessageId?: number | null;
  onToggleReaction?: (messageId: number, emoji: string) => void;
};

export function MessageList({
  messages,
  currentUserId = null,
  canDeleteMessages = false,
  onDeleteMessage,
  isDeletingMessageId = null,
  onToggleReaction,
}: Props) {
  const t = useTranslations("messages");
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages]);

  return (
    <div className={styles.messages} role="list" aria-label="Message list">
      {messages.length === 0 ? (
        <div className={styles.threadEmpty}>
          <p className={styles.threadEmptyMessage}>{t("startConversation")}</p>
          <FiChevronDown className={styles.threadEmptyArrow} aria-hidden />
        </div>
      ) : (
        messages.map((m, i) => {
          const prev = messages[i - 1];
          const showAvatar = !prev || prev.author !== m.author || prev.isMe !== m.isMe;
          return (
            <MessageBubble
              key={m.id}
              message={m}
              showAvatar={showAvatar}
              currentUserId={currentUserId}
              canDelete={canDeleteMessages}
              onDelete={
                onDeleteMessage
                  ? () => onDeleteMessage(Number(m.id))
                  : undefined
              }
              isDeleting={isDeletingMessageId === Number(m.id)}
              onToggleReaction={onToggleReaction}
            />
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
}
