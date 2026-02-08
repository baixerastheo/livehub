"use client";

import Image from "next/image";
import styles from "../styles/Home.module.css";
import { useAuthModal } from "../../modalAuth/store/useAuthModal";

export function HomeAuthCallToAction() {
  const { openLogin, openRegister } = useAuthModal();

  return (
    <div className={styles.authContainer}>
      <Image
        src="/brand/Livehub_logo.png"
        alt="LiveHub"
        width={280}
        height={56}
        className={styles.authLogo}
        priority
      />
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