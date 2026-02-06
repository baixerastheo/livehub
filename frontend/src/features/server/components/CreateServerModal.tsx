"use client";

import { useState } from "react";
import styles from "../styles/CreateServerModal.module.css";
import { useCreateServerMutation } from "../server.hooks";

type CreateServerModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function CreateServerModal({ isOpen, onClose }: CreateServerModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createServer = useCreateServerMutation();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Le nom du serveur est requis.");
      return;
    }
    if (trimmed.length > 100) {
      setError("Le nom ne doit pas dépasser 100 caractères.");
      return;
    }
    try {
      await createServer.mutateAsync({ name: trimmed });
      setName("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création.");
    }
  };

  return (
    <div
      className={styles.backdrop}
      aria-modal="true"
      role="dialog"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Créer un serveur</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className={styles.closeButton}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="server-name" className={styles.label}>
              Nom du serveur
            </label>
            <input
              id="server-name"
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mon serveur"
              maxLength={100}
              autoFocus
            />
            {error && <p className={styles.error}>{error}</p>}
          </div>
          <button
            type="submit"
            className={styles.submit}
            disabled={createServer.isPending}
          >
            {createServer.isPending ? "Création…" : "Créer le serveur"}
          </button>
        </form>
      </div>
    </div>
  );
}
