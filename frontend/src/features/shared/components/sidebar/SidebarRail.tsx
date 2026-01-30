"use client";

import { useAppStore } from "@/src/core/store/appStore";
import styles from "../../styles/sidebar/SidebarRail.module.css";
import { FiBell, FiMessageSquare, FiUsers } from "react-icons/fi";

type RailItem = "activity" | "conversation" | "teams";

export function SidebarRail() {
  const isSidebarRailOpen = useAppStore((state) => state.isSidebarRailOpen);
  const active = useAppStore((state) => state.sidebarSection);
  const openSidebar = useAppStore((state) => state.openSidebar);
  const setSidebarSection = useAppStore((state) => state.setSidebarSection);
  const closeMobileSidebars = useAppStore((state) => state.closeMobileSidebars);

  const activate = (item: RailItem) => {
    setSidebarSection(item);
    openSidebar();
  };

  return (
    <>
      <nav
        className={`${styles.rail} ${isSidebarRailOpen ? styles.railOpen : ""}`}
        aria-label="Sidebar menu"
      >
      <button
        type="button"
        className={`${styles.railItem} ${
          active === "activity" ? styles.railItemActive : ""
        }`}
        onClick={() => activate("activity")}
      >
        <span className={styles.railIcon} aria-hidden="true">
          <FiBell className={styles.railIconSvg} />
        </span>
        <span className={styles.railLabel}>Notification</span>
      </button>

      <button
        type="button"
        className={`${styles.railItem} ${
          active === "conversation" ? styles.railItemActive : ""
        }`}
        onClick={() => activate("conversation")}
      >
        <span className={styles.railIcon} aria-hidden="true">
          <FiMessageSquare className={styles.railIconSvg} />
        </span>
        <span className={styles.railLabel}>Private message</span>
      </button>

      <button
        type="button"
        className={`${styles.railItem} ${
          active === "teams" ? styles.railItemActive : ""
        }`}
        onClick={() => activate("teams")}
      >
        <span className={styles.railIcon} aria-hidden="true">
          <FiUsers className={styles.railIconSvg} />
        </span>
        <span className={styles.railLabel}>Server</span>
      </button>
      </nav>
      {isSidebarRailOpen && (
        <button
          type="button"
          className={styles.railBackdrop}
          aria-label="Close sidebar"
          onClick={closeMobileSidebars}
        />
      )}
    </>
  );
}

