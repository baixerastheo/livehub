"use client";

import Link from "next/link";
import styles from "../styles/SocialMenu.module.css";

export type SocialTab = "users" | "friends" | "requests";

export function SocialMenu({ active }: { active: SocialTab }) {
  return (
    <nav className={styles.tabs} aria-label="Social navigation">
      <Link
        className={`${styles.tab} ${active === "users" ? styles.tabActive : ""}`}
        href="/people?tab=users"
      >
        Users
      </Link>
      <Link
        className={`${styles.tab} ${active === "requests" ? styles.tabActive : ""}`}
        href="/people?tab=requests"
      >
        Requests
      </Link>
      <Link
        className={`${styles.tab} ${active === "friends" ? styles.tabActive : ""}`}
        href="/people?tab=friends"
      >
        Friends
      </Link>
    </nav>
  );
}

