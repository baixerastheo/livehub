"use client";

import React from "react";
import { useCreateServerMutation } from "../server.hooks";
import { useToast } from "@/src/core/store/toast/useToastStore";
import styles from "../styles/modalCreateServer.module.css";

type ModalCreateServerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ModalCreateServer({ isOpen, onClose }: ModalCreateServerProps) {
  const { toast } = useToast();
  const createServerMutation = useCreateServerMutation();
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const isSubmitting = createServerMutation.isPending;

  if (!isOpen) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
    setName("");
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Server name is required.");
      return;
    }
    if (trimmed.length > 30) {
      setError("Server name must not exceed 30 characters.");
      return;
    }

    setError(null);
    try {
      await createServerMutation.mutateAsync({ name: trimmed });
      toast.success("Server created successfully.");
      handleClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create server.";
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div
      className={styles.backdrop}
      aria-modal="true"
      role="dialog"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Create a new server</h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className={styles.closeButton}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          <div className={styles.field}>
            <label htmlFor="create-server-name" className={styles.label}>
              Server name
            </label>
            <input
              id="create-server-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              disabled={isSubmitting}
              maxLength={30}
              className={styles.input}
            />
          </div>
          <div className={styles.footer}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className={`${styles.button} ${styles.buttonSecondary}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${styles.button} ${styles.buttonPrimary}`}
            >
              {isSubmitting ? "Creating…" : "Create server"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
