"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "../styles/SocialMenu.module.css";

type SocialTab = "users" | "friends" | "requests";

function normalizeTab(value: string | null): SocialTab {
  if (value === "friends") return "friends";
  if (value === "requests") return "requests";
  return "users";
}

export function SocialMenu() {
  const sp = useSearchParams();
  const active = normalizeTab(sp?.get("tab") ?? null);

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

