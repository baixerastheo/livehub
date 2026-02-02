"use client";

import Link from "next/link";
import { FiUsers } from "react-icons/fi";
import styles from "../../styles/navbar/NavbarPeopleButton.module.css";

export function NavbarPeopleButton() {
  return (
    <Link
      href="/people?tab=users"
      className={styles.navIconButton}
      aria-label="Open People"
    >
      <FiUsers className={styles.navIcon} aria-hidden="true" />
      <span className={styles.srOnly}>People</span>
    </Link>
  );
}

