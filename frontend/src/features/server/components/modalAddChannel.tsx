"use client";

import React from "react";
import { useTranslations } from "next-intl";
import styles from "../styles/modalAddChannel.module.css";
import { useCreateChannelMutation } from "../server.hooks";

type ChannelType = "TEXTE" | "VOCAL";

type ModalAddChannelProps = {
  isOpen: boolean;
  onClose: () => void;
  serverId: number | null;
};

export function ModalAddChannel({
  isOpen,
  onClose,
  serverId,
}: ModalAddChannelProps) {
  const t = useTranslations("server");
  const tAuth = useTranslations("auth");
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<ChannelType>("TEXTE");
  const createChannelMutation = useCreateChannelMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || serverId == null) return;
    try {
      await createChannelMutation.mutateAsync({ serverId, name: trimmed, type });
      setName("");
      setType("TEXTE");
      onClose();
    } catch {
      // Error handled by mutation / UI if needed
    }
  };

  const handleClose = () => {
    if (!createChannelMutation.isPending) {
      setName("");
      setType("TEXTE");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={handleClose}
      onKeyDown={(e) => e.key === "Escape" && handleClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-add-channel-title"
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="modal-add-channel-title" className={styles.title}>
            {t("addChannel")}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
            disabled={createChannelMutation.isPending}
            aria-label={tAuth("closeModal")}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <p className={styles.label}>{t("channelType")}</p>
          <div className={styles.typeSelector}>
            <button
              type="button"
              className={`${styles.typeOption} ${type === "TEXTE" ? styles.typeOptionActive : ""}`}
              onClick={() => setType("TEXTE")}
              disabled={createChannelMutation.isPending}
            >
              <span className={styles.typeIcon}>#</span>
              {t("channelTypeText")}
            </button>
            <button
              type="button"
              className={`${styles.typeOption} ${type === "VOCAL" ? styles.typeOptionActive : ""}`}
              onClick={() => setType("VOCAL")}
              disabled={createChannelMutation.isPending}
            >
              <span className={styles.typeIcon}>🔊</span>
              {t("channelTypeVoice")}
            </button>
          </div>

          <label htmlFor="channel-name" className={styles.label}>
            {t("channelName")}
          </label>
          <input
            id="channel-name"
            type="text"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("channelNamePlaceholder")}
            maxLength={100}
            autoFocus
            disabled={createChannelMutation.isPending}
          />
          <div className={styles.footer}>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={handleClose}
              disabled={createChannelMutation.isPending}
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.buttonPrimary}`}
              disabled={!name.trim() || createChannelMutation.isPending}
            >
              {createChannelMutation.isPending ? t("creating") : t("create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
