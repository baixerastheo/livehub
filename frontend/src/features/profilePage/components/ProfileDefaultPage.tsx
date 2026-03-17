"use client";

import { useEffect, useMemo } from "react";
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
      if (e.key === "Escape") {
        closeAccountModal();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [accountModal.isOpen, closeAccountModal]);

  const title = useMemo(() => {
    switch (accountModal.section) {
      case "profile":
        return t("myAccount");
      case "settings":
        return t("settings");
      default:
        return t("myAccount");
    }
  }, [accountModal.section, t]);

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
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={closeAccountModal}
            aria-label={t("close")}
          >
            ×
          </button>
        </div>

        <ProfileModalMenu
          active={accountModal.section}
          onChange={setAccountModalSection}
        />

        <div className={styles.body}>
          {accountModal.section === "profile" ? <ProfileSection /> : null}
          {accountModal.section === "settings" ? <SettingSection /> : null}
        </div>
      </div>
    </div>
  );
}

