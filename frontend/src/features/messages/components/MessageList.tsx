"use client";

import styles from "../styles/MessageList.module.css";
import type { ChatMessage } from "@/src/features/messages/messages.mock";
import { MessageBubble } from "@/src/features/messages/components/MessageBubble";
import { FiChevronDown } from "react-icons/fi";

const EMPTY_LABEL = "Start the conversation";

type Props = {
  messages: ChatMessage[];
  canDeleteMessages?: boolean;
  onDeleteMessage?: (messageId: number) => void;
  isDeletingMessageId?: number | null;
};

export function MessageList({
  messages,
  canDeleteMessages = false,
  onDeleteMessage,
  isDeletingMessageId = null,
}: Props) {
  return (
    <div className={styles.messages} role="list" aria-label="Message list">
      {messages.length === 0 ? (
        <div className={styles.threadEmpty}>
          <p className={styles.threadEmptyMessage}>{EMPTY_LABEL}</p>
          <FiChevronDown className={styles.threadEmptyArrow} aria-hidden />
        </div>
      ) : (
        messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            canDelete={canDeleteMessages}
            onDelete={
              onDeleteMessage
                ? () => onDeleteMessage(Number(m.id))
                : undefined
            }
            isDeleting={isDeletingMessageId === Number(m.id)}
          />
        ))
      )}
    </div>
  );
}
