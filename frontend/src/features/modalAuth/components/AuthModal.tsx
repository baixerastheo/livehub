"use client";

import { useAppStore } from "@/src/core/store/appStore";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import styles from "../styles/AuthModal.module.css";

export function AuthModal() {
  const authModal = useAppStore((state) => state.authModal);
  const closeAuthModal = useAppStore((state) => state.closeAuthModal);

  if (!authModal.isOpen) return null;

  const isLogin = authModal.mode === "login";

  return (
    <div
      className={styles.backdrop}
      aria-modal="true"
      role="dialog"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isLogin
              ? "Sign in to get started"
              : "Create your LiveHub account"}
          </h2>
          <button
            type="button"
            onClick={closeAuthModal}
            aria-label="Close modal"
            className={styles.closeButton}
          >
            ×
          </button>
        </div>
        {isLogin ? <LoginForm /> : <RegisterForm />}
      </div>
    </div>
  );
}

