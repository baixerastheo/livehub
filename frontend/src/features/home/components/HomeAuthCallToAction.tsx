"use client";

import { useAppStore } from "@/src/core/store/appStore";
import styles from "../styles/Home.module.css";

export function HomeAuthCallToAction() {
  const openLoginModal = useAppStore((state) => state.openLoginModal);

  const handleClick = () => {
    openLoginModal();
  };

  return (
    <div className={styles.authContainer}>
      <span className={styles.authLabel}>You&apos;re not logged in.</span>
      <div className={styles.authActions}>
        <button type="button" className={styles.primaryButton} onClick={handleClick}>
          Sign in
        </button>
        <button type="button" className={styles.secondaryButton} onClick={handleClick}>
          Sign up
        </button>
      </div>
    </div>
  );
}

