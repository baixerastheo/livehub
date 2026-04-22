"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/src/core/store/appStore";
import styles from "../styles/ProfileDefaultPage.module.css";
import { ProfileSection } from "./ProfileSection";
import { SettingSection } from "./SettingSection";
import { ProfileModalMenu } from "./ProfileModalMenu";

export function ProfileDefaultPage() {
  const t = useTranslations("profile");
  const accountModal = useAppStore((state) => state.accountModal);
  const closeAccountModal = useAppStore((state) => state.closeAccountModal);
  const setAccountModalSection = useAppStore(
    (state) => state.setAccountModalSection,
  );

  useEffect(() => {
    if (!accountModal.isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAccountModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [accountModal.isOpen, closeAccountModal]);

  if (!accountModal.isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      aria-modal="true"
      role="dialog"
      aria-label="Account settings"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeAccountModal();
      }}
    >
      <div className={styles.modal}>
        <ProfileModalMenu
          active={accountModal.section}
          onChange={setAccountModalSection}
        />

        <div className={styles.content}>
          <button
            type="button"
            className={styles.closeButton}
            onClick={closeAccountModal}
            aria-label={t("close")}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M1 1l14 14M15 1L1 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>

          <div className={styles.body}>
            {accountModal.section === "profile" ? <ProfileSection /> : null}
            {accountModal.section === "settings" ? <SettingSection /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
