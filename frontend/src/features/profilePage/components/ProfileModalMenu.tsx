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
    <nav className={styles.nav} aria-label="Account sections">
      <div className={styles.navInner}>
        <span className={styles.sectionLabel}>COMPTE</span>

        <button
          type="button"
          className={`${styles.navItem} ${active === "profile" ? styles.navItemActive : ""}`}
          onClick={() => onChange("profile")}
          aria-current={active === "profile" ? "page" : undefined}
        >
          {t("myAccount")}
        </button>

        <button
          type="button"
          className={`${styles.navItem} ${active === "settings" ? styles.navItemActive : ""}`}
          onClick={() => onChange("settings")}
          aria-current={active === "settings" ? "page" : undefined}
        >
          {t("settings")}
        </button>
      </div>
    </nav>
  );
}
