"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { FiTrash2 } from "react-icons/fi";
import styles from "../styles/MessageBubble.module.css";
import type { ChatMessage } from "@/src/features/messages/messages.mock";

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type Props = {
  message: ChatMessage;
  canDelete?: boolean;
  onDelete?: () => void;
  isDeleting?: boolean;
};

export function MessageBubble({
  message,
  canDelete = false,
  onDelete,
  isDeleting = false,
}: Props) {
  const t = useTranslations("messages");
  const isMe = message.isMe ?? false;
  const [showDelete, setShowDelete] = React.useState(false);

  return (
    <div
      className={`${styles.bubbleRow} ${isMe ? styles.bubbleRowMe : ""}`}
      role="listitem"
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : ""}`}>
        <div className={styles.bubbleMeta}>
          <span className={styles.author}>
            {isMe ? t("you") : message.author}
          </span>
          <span className={styles.time}>
            {formatTime(message.createdAtIso)}
          </span>
          {canDelete && onDelete && (showDelete || isDeleting) && (
            <button
              type="button"
              className={styles.deleteButton}
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
              disabled={isDeleting}
              aria-label={t("deleteMessage")}
              title={t("deleteMessage")}
            >
              <FiTrash2 size={14} aria-hidden />
              {isDeleting ? (
                <span className={styles.deletingLabel}>{t("deleting")}</span>
              ) : null}
            </button>
          )}
        </div>
        <div className={styles.text}>
          {message.content}
        </div>
      </div>
    </div>
  );
}
