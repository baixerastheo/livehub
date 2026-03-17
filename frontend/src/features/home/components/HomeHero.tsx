"use client";

import { useTranslations } from "next-intl";
import styles from "../styles/Home.module.css";

export function HomeHero() {
  const t = useTranslations("home");
  return (
    <section className={styles.hero}>
      <h1 className={styles.heroTitle}>{t("welcomeTitle")}</h1>
      <p className={styles.heroSubtitle}>{t("welcomeSubtitle")}</p>
    </section>
  );
}

