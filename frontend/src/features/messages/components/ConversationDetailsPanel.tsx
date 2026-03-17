"use client";

import { useTranslations } from "next-intl";
import styles from "../styles/ConversationDetailsPanel.module.css";

type Props = {
  mode: string;
  activeTitle: string;
  onClose?: () => void;
};

export function ConversationDetailsPanel({ mode, activeTitle }: Props) {
  const t = useTranslations("messages");

  return (
    <aside className={styles.rightPanel} aria-label="Conversation details">
      <div className={styles.panelTitle}>{t("details")}</div>
      <div className={styles.panelCard}>
        <div className={styles.panelRow}>
          <div className={styles.panelLabel}>{t("mode")}</div>
          <div className={styles.panelValue}>{mode}</div>
        </div>
      </div>

      <div className={styles.panelCard}>
        <div className={styles.panelRow}>
          <div className={styles.panelLabel}>{t("active")}</div>
          <div className={styles.panelValue}>{activeTitle}</div>
        </div>
      </div>
    </aside>
  );
}
