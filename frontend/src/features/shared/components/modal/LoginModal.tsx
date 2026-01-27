import React from "react";
import { ExampleForm } from "@/components/ExampleForm";
import styles from "../../styles/modal/LoginModal.module.css";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
};

export function LoginModal({ open, onClose }: LoginModalProps) {
  if (!open) return null;

  return (
    <div className={styles.backdrop} aria-modal="true" role="dialog">
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Sign in to get started</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign-in modal"
            className={styles.closeButton}
          >
            ×
          </button>
        </div>
        <ExampleForm />
      </div>
    </div>
  );
}

