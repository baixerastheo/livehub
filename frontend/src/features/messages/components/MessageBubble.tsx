"use client";

import styles from "../styles/MessageBubble.module.css";
import type { ChatMessage } from "@/src/features/messages/messages.mock";

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type Props = {
  message: ChatMessage;
};

export function MessageBubble({ message }: Props) {
  const isMe = message.isMe ?? false;

  return (
    <div
      className={`${styles.bubbleRow} ${isMe ? styles.bubbleRowMe : ""}`}
      role="listitem"
    >
      <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : ""}`}>
        <div className={styles.bubbleMeta}>
          <span className={styles.author}>
            {isMe ? "You" : message.author}
          </span>
          <span className={styles.time}>
            {formatTime(message.createdAtIso)}
          </span>
        </div>
        <div className={styles.text}>{message.content}</div>
      </div>
    </div>
  );
}
