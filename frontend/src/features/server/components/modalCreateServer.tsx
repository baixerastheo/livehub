"use client";

import React from "react";
import { useCreateServerMutation, useUploadServerAvatarMutation } from "../server.hooks";
import { useToast } from "@/src/core/store/toast/useToastStore";
import { AvatarCropModal } from "./AvatarCropModal";
import styles from "../styles/modalCreateServer.module.css";

type ModalCreateServerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ModalCreateServer({ isOpen, onClose }: ModalCreateServerProps) {
  const { toast } = useToast();
  const createServerMutation = useCreateServerMutation();
  const uploadAvatarMutation = useUploadServerAvatarMutation();
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [cropSrc, setCropSrc] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isSubmitting = createServerMutation.isPending || uploadAvatarMutation.isPending;

  if (!isOpen) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
    setName("");
    setError(null);
    setAvatarFile(null);
    setAvatarPreview(null);
    setCropSrc(null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setCropSrc(URL.createObjectURL(file));
  };

  const handleCropConfirm = (croppedFile: File) => {
    setAvatarFile(croppedFile);
    setAvatarPreview(URL.createObjectURL(croppedFile));
    setCropSrc(null);
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
      const server = await createServerMutation.mutateAsync({ name: trimmed });
      if (avatarFile) {
        await uploadAvatarMutation.mutateAsync({ serverId: server.id, file: avatarFile });
      }
      toast.success("Server created successfully.");
      handleClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create server.";
      setError(message);
      toast.error(message);
    }
  };

  if (cropSrc) {
    return (
      <AvatarCropModal
        src={cropSrc}
        onConfirm={handleCropConfirm}
        onClose={() => setCropSrc(null)}
      />
    );
  }

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
            <p role="alert" className={styles.error} data-testid="create-server-error">
              {error}
            </p>
          )}

          <div className={styles.avatarPicker}>
            <button
              type="button"
              className={styles.avatarButton}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Choose server avatar"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Server avatar preview" className={styles.avatarPreview} />
              ) : (
                <span className={styles.avatarPlaceholder}>+</span>
              )}
            </button>
            <span className={styles.avatarHint}>Server icon (optional)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className={styles.fileInput}
              onChange={handleAvatarChange}
            />
          </div>

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
              data-testid="create-server-name"
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
              data-testid="create-server-submit"
            >
              {isSubmitting ? "Creating…" : "Create server"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
