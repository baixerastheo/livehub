 "use client";

import { useEffect, useMemo } from "react";
import { useAppStore } from "@/src/core/store/appStore";
import styles from "../styles/ProfileDefaultPage.module.css";
import { ProfileSection } from "./ProfileSection";
import { FriendListSection } from "./FriendListSection";
import { SettingSection } from "./SettingSection";
import { ProfileModalMenu } from "./ProfileModalMenu";

export function ProfileDefaultPage() {
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
        return "My Account";
      case "friends":
        return "Friends";
      case "settings":
        return "Settings";
      default:
        return "My Account";
    }
  }, [accountModal.section]);

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
            aria-label="Close"
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
          {accountModal.section === "friends" ? <FriendListSection /> : null}
          {accountModal.section === "settings" ? <SettingSection /> : null}
        </div>
      </div>
    </div>
  );
}

