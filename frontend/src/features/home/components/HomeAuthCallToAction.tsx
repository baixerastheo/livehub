"use client";

import styles from "../styles/Home.module.css";
import { useAuthModal } from "../../modalAuth/store/useAuthModal";

export function HomeAuthCallToAction() {
  const { openLogin, openRegister } = useAuthModal();

  return (
    <div className={styles.authContainer}>
      <span className={styles.authLabel}>You&apos;re not logged in.</span>
      <div className={styles.authActions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={openLogin}
        >
          Sign in
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={openRegister}
        >
          Sign up
        </button>
      </div>
    </div>
  );
}