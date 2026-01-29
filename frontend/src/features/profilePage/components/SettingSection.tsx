 "use client";

import { useEffect, useState } from "react";
import styles from "../styles/SettingSection.module.css";

type ThemeMode = "light" | "dark";

function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const value = window.localStorage.getItem("livehub.theme");
  return value === "dark" ? "dark" : "light";
}

export function SettingSection() {
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("livehub.theme", theme);
  }, [theme]);

  return (
    <div className={styles.sectionStack}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardTitle}>Preferences</div>
            <div className={styles.cardSubtle}>
              Easy client-side settings stored locally.
            </div>
          </div>
        </div>

        <div className={styles.preferenceRow}>
          <div>
            <div className={styles.preferenceTitle}>Theme</div>
            <div className={styles.cardSubtle}>Light / Dark</div>
          </div>
          <div className={styles.segmented}>
            <button
              type="button"
              className={`${styles.segment} ${
                theme === "light" ? styles.segmentActive : ""
              }`}
              onClick={() => setTheme("light")}
            >
              Light
            </button>
            <button
              type="button"
              className={`${styles.segment} ${
                theme === "dark" ? styles.segmentActive : ""
              }`}
              onClick={() => setTheme("dark")}
            >
              Dark
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

