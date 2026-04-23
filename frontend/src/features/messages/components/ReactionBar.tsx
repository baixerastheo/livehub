"use client";

import React from "react";
import styles from "../styles/ReactionBar.module.css";
import type { ReactionDto } from "@/src/features/messages/messages.types";

type Props = {
  reactions: ReactionDto[];
  currentUserId: string | null;
  onToggle: (emoji: string) => void;
};

export function ReactionBar({ reactions, currentUserId, onToggle }: Props) {
  if (reactions.length === 0) return null;

  return (
    <div className={styles.bar}>
      {reactions.map((r) => {
        const active =
          currentUserId !== null && r.userIds.includes(currentUserId);
        return (
          <button
            key={r.emoji}
            type="button"
            className={`${styles.chip} ${active ? styles.chipActive : ""}`}
            onClick={() => onToggle(r.emoji)}
            title={`${r.count} reaction${r.count > 1 ? "s" : ""}`}
          >
            <span>{r.emoji}</span>
            <span className={styles.count}>{r.count}</span>
          </button>
        );
      })}
    </div>
  );
}
