"use client";

import styles from "../styles/ConversationDetailsPanel.module.css";

type Props = {
  mode: string;
  activeTitle: string;
  onClose?: () => void;
};

export function ConversationDetailsPanel({ mode, activeTitle, onClose }: Props) {
  return (
    <aside className={styles.rightPanel} aria-label="Conversation details">
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>Details</div>
        {onClose && (
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fermer">
            ×
          </button>
        )}
      </div>
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
