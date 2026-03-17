"use client";

import { useTranslations } from "next-intl";
import styles from "../styles/ProfileModalMenu.module.css";
import type { AccountModalSection } from "@/src/core/store/appStore";

type ProfileModalMenuProps = {
  active: AccountModalSection;
  onChange: (section: AccountModalSection) => void;
};

export function ProfileModalMenu({ active, onChange }: ProfileModalMenuProps) {
  const t = useTranslations("profile");

  return (
    <div className={styles.menuBar} role="tablist" aria-label="Account sections">
      <button
        type="button"
        role="tab"
        aria-selected={active === "profile"}
        className={`${styles.menuTab} ${
          active === "profile" ? styles.menuTabActive : ""
        }`}
        onClick={() => onChange("profile")}
      >
        {t("security")}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active === "settings"}
        className={`${styles.menuTab} ${
          active === "settings" ? styles.menuTabActive : ""
        }`}
        onClick={() => onChange("settings")}
      >
        {t("status")}
      </button>
    </div>
  );
}

