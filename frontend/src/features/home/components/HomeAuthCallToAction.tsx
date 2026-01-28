"use client";

import { useAppStore } from "@/src/core/store/appStore";
import styles from "../styles/Home.module.css";

export function HomeAuthCallToAction() {
  const openAuthModal = useAppStore((state) => state.openAuthModal);

  return (
    <div className={styles.authContainer}>
      <span className={styles.authLabel}>You&apos;re not logged in.</span>
      <div className={styles.authActions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => openAuthModal("login")}
        >
          Sign in
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => openAuthModal("register")}
        >
          Sign up
        </button>
      </div>
    </div>
  );
}

