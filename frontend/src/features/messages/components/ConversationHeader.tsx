"use client";

import styles from "../styles/ConversationHeader.module.css";
import type { ConversationHeader as ConversationHeaderType } from "@/src/features/messages/messages.mock";
import { FiInfo, FiPhone, FiVideo } from "react-icons/fi";
import { UserAvatar } from "@/src/features/shared/components/avatar/UserAvatar";

type Props = {
  header: ConversationHeaderType;
  onToggleDetails: () => void;
};

export function ConversationHeader({ header, onToggleDetails }: Props) {
  const showAvatar = header.showAvatar !== false;

  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <div className={styles.titleRow}>
          {showAvatar &&
            (header.avatarUrl ? (
              <span className={styles.avatar}>
                <UserAvatar
                  avatarUrl={header.avatarUrl}
                  displayName={header.title}
                  size="md"
                  className={styles.avatarInner}
                  aria-hidden
                />
              </span>
            ) : (
              <span
                className={styles.avatar}
                style={{ background: header.avatarColor }}
              >
                {header.avatarText}
              </span>
            ))}
          <div style={{ minWidth: 0 }}>
            <div className={styles.title}>{header.title}</div>
            <div className={styles.subtitle}>
              {header.subtitle === "Online" || header.subtitle === "Offline" ? (
                <>
                  <span className={header.subtitle === "Online" ? styles.dotOnline : styles.dotOffline} />
                  <span className={header.subtitle === "Online" ? styles.textOnline : styles.textOffline}>
                    {header.subtitle}
                  </span>
                </>
              ) : header.subtitle}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.headerActions}>
        <button type="button" className={styles.iconButton} aria-label="Call">
          <FiPhone />
        </button>
        <button type="button" className={styles.iconButton} aria-label="Video">
          <FiVideo />
        </button>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Toggle details panel"
          onClick={onToggleDetails}
        >
          <FiInfo />
        </button>
      </div>
    </div>
  );
}
