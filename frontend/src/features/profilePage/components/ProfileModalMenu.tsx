 "use client";

import styles from "../styles/ProfileModalMenu.module.css";
import type { AccountModalSection } from "@/src/core/store/appStore";

type ProfileModalMenuProps = {
  active: AccountModalSection;
  onChange: (section: AccountModalSection) => void;
};

export function ProfileModalMenu({ active, onChange }: ProfileModalMenuProps) {
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
        Sécurité
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
        Statut
      </button>
    </div>
  );
}

