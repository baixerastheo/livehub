"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import styles from "../styles/Home.module.css";
import { useAuthModal } from "../../modalAuth/store/useAuthModal";

export function HomeAuthCallToAction() {
  const { openLogin, openRegister } = useAuthModal();
  const t = useTranslations("auth");

  return (
    <div className={styles.authContainer}>
      <Image
        src="/brand/livehub_icon.svg"
        alt="LiveHub"
        width={56}
        height={56}
        className={styles.authLogo}
        priority
      />
      <span className={styles.authLabel}>{t("notLoggedIn")}</span>
      <div className={styles.authActions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={openLogin}
          data-testid="home-signin-btn"
        >
          {t("signIn")}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={openRegister}
          data-testid="home-signup-btn"
        >
          {t("signUp")}
        </button>
      </div>
    </div>
  );
}