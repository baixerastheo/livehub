"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FiUsers } from "react-icons/fi";
import { useAuth } from "@/src/core/store/auth/useAuth";
import styles from "../../styles/navbar/NavbarPeopleButton.module.css";

export function NavbarPeopleButton() {
  const { isAuthenticated } = useAuth();
  const t = useTranslations("nav");

  if (!isAuthenticated) return null;

  return (
    <Link
      href="/people?tab=users"
      className={styles.navIconButton}
      aria-label={t("openPeople")}
    >
      <FiUsers className={styles.navIcon} aria-hidden="true" />
      <span className={styles.srOnly}>{t("people")}</span>
    </Link>
  );
}

