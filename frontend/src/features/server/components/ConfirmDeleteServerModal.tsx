"use client";

import React from "react";
import { useRouter } from "next/navigation";
import styles from "../styles/ConfirmDeleteServerModal.module.css";
import { useDeleteServerMutation } from "../server.hooks";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  serverId: number;
  serverName: string;
};

export function ConfirmDeleteServerModal({
  isOpen,
  onClose,
  serverId,
  serverName,
}: Props) {
  const router = useRouter();
  const deleteMutation = useDeleteServerMutation();

  const handleConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(serverId);
      onClose();
      router.push("/");
    } catch {
      // Error with toast later
    }
  };

  const handleClose = () => {
    if (!deleteMutation.isPending) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={handleClose}
      onKeyDown={(e) => e.key === "Escape" && handleClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-server-title"
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="confirm-delete-server-title" className={styles.title}>
            Supprimer le serveur
          </h2>
        </div>
        <p className={styles.message}>
          Êtes-vous sûr de vouloir supprimer <strong>{serverName}</strong> ? Cette
          action est irréversible.
        </p>
        <div className={styles.footer}>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={handleClose}
            disabled={deleteMutation.isPending}
          >
            Annuler
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonDanger}`}
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Suppression…" : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}
