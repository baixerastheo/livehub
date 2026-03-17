"use client";

import { useLocale, useTranslations } from "next-intl";
import { setLocale } from "@/src/i18n/actions";
import styles from "../styles/SettingSection.module.css";

export function SettingSection() {
  const t = useTranslations("profile");
  const locale = useLocale();

  return (
    <div className={styles.sectionStack}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardTitle}>{t("preferences")}</div>
            <div className={styles.cardSubtle}>{t("preferencesSubtitle")}</div>
          </div>
        </div>

        <div className={styles.preferenceRow}>
          <div>
            <div className={styles.preferenceTitle}>{t("language")}</div>
            <div className={styles.cardSubtle}>{t("languageSubtitle")}</div>
          </div>
          <div className={styles.segmented}>
            <button
              type="button"
              className={`${styles.segment} ${locale === "fr" ? styles.segmentActive : ""}`}
              onClick={() => setLocale("fr")}
            >
              {t("french")}
            </button>
            <button
              type="button"
              className={`${styles.segment} ${locale === "en" ? styles.segmentActive : ""}`}
              onClick={() => setLocale("en")}
            >
              {t("english")}
            </button>
            <button
              type="button"
              className={`${styles.segment} ${locale === "es" ? styles.segmentActive : ""}`}
              onClick={() => setLocale("es")}
            >
              {t("spanish")}
            </button>
            <button
              type="button"
              className={`${styles.segment} ${locale === "de" ? styles.segmentActive : ""}`}
              onClick={() => setLocale("de")}
            >
              {t("german")}
            </button>
          
          </div>
        </div>
      </div>
    </div>
  );
}

