"use client";

import styles from "../styles/ConversationDetailsPanel.module.css";

type Props = {
  mode: string;
  activeTitle: string;
};

export function ConversationDetailsPanel({ mode, activeTitle }: Props) {
  return (
    <aside className={styles.rightPanel} aria-label="Conversation details">
      <div className={styles.panelTitle}>Details</div>
      <div className={styles.panelCard}>
        <div className={styles.panelRow}>
          <div className={styles.panelLabel}>Mode</div>
          <div className={styles.panelValue}>{mode}</div>
        </div>
      </div>

      <div className={styles.panelCard}>
        <div className={styles.panelRow}>
          <div className={styles.panelLabel}>Active</div>
          <div className={styles.panelValue}>{activeTitle}</div>
        </div>
      </div>
    </aside>
  );
}
