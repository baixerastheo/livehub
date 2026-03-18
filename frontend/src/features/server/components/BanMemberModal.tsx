"use client";

import React from "react";
import { useTranslations } from "next-intl";
import styles from "../styles/BanMemberModal.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  targetName: string;
  onConfirm: (raison?: string, expireLe?: string) => void;
  isPending?: boolean;
};

export function BanMemberModal({
  isOpen,
  onClose,
  targetName,
  onConfirm,
  isPending = false,
}: Props) {
  const t = useTranslations("server");
  const [raison, setRaison] = React.useState("");
  const [expireLe, setExpireLe] = React.useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(raison.trim() || undefined, expireLe || undefined);
  };

  const handleClose = () => {
    setRaison("");
    setExpireLe("");
    onClose();
  };

  // min date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 10);

  return (
    <div
      className={styles.backdrop}
      onClick={handleClose}
      onKeyDown={(e) => e.key === "Escape" && handleClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{t("banTitle", { name: targetName })}</h2>

        <div className={styles.fields}>
          <div className={styles.field}>
            <label className={styles.label}>{t("banReason")}</label>
            <input
              type="text"
              className={styles.input}
              placeholder={t("banReasonPlaceholder")}
              value={raison}
              onChange={(e) => setRaison(e.target.value)}
              disabled={isPending}
              maxLength={200}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t("banExpiry")}</label>
            <input
              type="date"
              className={styles.input}
              value={expireLe}
              min={minDate}
              onChange={(e) => setExpireLe(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={handleClose}
            disabled={isPending}
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonDanger}`}
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? t("deleting") : t("banConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
