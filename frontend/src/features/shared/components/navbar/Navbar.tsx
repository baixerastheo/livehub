"use client";

import React from "react";
import { useTranslations } from "next-intl";
import styles from "../../styles/navbar/Navbar.module.css";
import { NavbarLogo } from "@/src/features/shared/components/navbar/NavbarLogo";
import { BiArrowFromLeft } from "react-icons/bi";
import { useAppStore } from "@/src/core/store/appStore";

type NavbarProps = {
  children?: React.ReactNode;
};

export function Navbar({ children }: NavbarProps) {
  const t = useTranslations("nav");
  const toggleMobileSidebars = useAppStore((state) => state.toggleMobileSidebars);

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.menuButton}
          aria-label={t("toggleConversationList")}
          onClick={toggleMobileSidebars}
        >
          <span aria-hidden="true">
            <BiArrowFromLeft size={22} />
          </span>
        </button>
        <NavbarLogo />
      </div>
      <div className={styles.right}>{children}</div>
    </header>
  );
}

