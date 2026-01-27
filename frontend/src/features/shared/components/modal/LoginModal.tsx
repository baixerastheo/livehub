"use client";

import { ExampleForm } from "@/components/ExampleForm";
import { useAppStore } from "@/src/core/store/appStore";
import styles from "../../styles/modal/LoginModal.module.css";

export function LoginModal() {
  const isLoginModalOpen = useAppStore((state) => state.isLoginModalOpen);
  const closeLoginModal = useAppStore((state) => state.closeLoginModal);

  if (!isLoginModalOpen) return null;

  return (
    <div className={styles.backdrop} aria-modal="true" role="dialog">
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Sign in to get started</h2>
          <button
            type="button"
            onClick={closeLoginModal}
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

