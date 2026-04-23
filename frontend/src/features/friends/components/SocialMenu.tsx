"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import styles from "../styles/SocialMenu.module.css";

export type SocialTab = "users" | "friends" | "requests";

export function SocialMenu({ active }: { active: SocialTab }) {
  const t = useTranslations("friends");

  return (
    <nav className={styles.tabs} aria-label="Social navigation">
      <Link
        className={`${styles.tab} ${active === "users" ? styles.tabActive : ""}`}
        href="/people?tab=users"
      >
        {t("users")}
      </Link>
      <Link
        className={`${styles.tab} ${active === "requests" ? styles.tabActive : ""}`}
        href="/people?tab=requests"
      >
        {t("requests")}
      </Link>
      <Link
        className={`${styles.tab} ${active === "friends" ? styles.tabActive : ""}`}
        href="/people?tab=friends"
      >
        {t("friends")}
      </Link>
    </nav>
  );
}

