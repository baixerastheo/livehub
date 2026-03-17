"use client";

import { useTranslations } from "next-intl";
import styles from "../../styles/navbar/NavbarSearch.module.css";

type NavbarSearchProps = {
  placeholder?: string;
};

export function NavbarSearch({ placeholder }: NavbarSearchProps) {
  const t = useTranslations("nav");
  const resolvedPlaceholder = placeholder ?? t("searchPlaceholder");

  return (
    <div className={styles.searchWrapper}>
      <input
        type="text"
        className={styles.searchInput}
        placeholder={resolvedPlaceholder}
      />
      <button
        type="button"
        aria-label={t("search")}
        className={styles.searchIconButton}
      >
        <span className={styles.searchIcon} aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            className={styles.searchIconSvg}
            focusable="false"
          >
            <circle cx="11" cy="11" r="6" />
            <line x1="15.5" y1="15.5" x2="20" y2="20" />
          </svg>
        </span>
      </button>
    </div>
  );
}

