"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/src/core/store/appStore";
import styles from "../../styles/sidebar/SidebarRail.module.css";
import {
  FiBell,
  FiMessageSquare,
  FiUsers,
  FiPlus,
  FiChevronDown,
} from "react-icons/fi";
import { ModalCreateServer } from "@/src/features/server/components/modalCreateServer";
import { useUserServersQuery } from "@/src/features/server/server.hooks";

type RailItem = "activity" | "conversation" | "teams";

export function SidebarRail() {
  const router = useRouter();
  const isSidebarRailOpen = useAppStore((state) => state.isSidebarRailOpen);
  const active = useAppStore((state) => state.sidebarSection);
  const openSidebar = useAppStore((state) => state.openSidebar);
  const setSidebarSection = useAppStore((state) => state.setSidebarSection);
  const setSelectedServerId = useAppStore((state) => state.setSelectedServerId);
  const closeMobileSidebars = useAppStore((state) => state.closeMobileSidebars);

  const [isServerMenuOpen, setIsServerMenuOpen] = React.useState(false);
  const [isCreateServerOpen, setIsCreateServerOpen] = React.useState(false);
  const { data: userServers } = useUserServersQuery();

  const activate = (item: RailItem) => {
    setSidebarSection(item);
    openSidebar();
  };

  const toggleServerMenu = () => {
    setIsServerMenuOpen((v) => !v);
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
          aria-label="Notification"
        >
          <span className={styles.railIcon} aria-hidden="true">
            <FiBell className={styles.railIconSvg} />
          </span>
          <span className={styles.railLabel}>Notification</span>
          <span className={styles.railTooltip}>Notification</span>
        </button>

        <button
          type="button"
          className={`${styles.railItem} ${
            active === "conversation" ? styles.railItemActive : ""
          }`}
          onClick={() => activate("conversation")}
          aria-label="Private message"
        >
          <span className={styles.railIcon} aria-hidden="true">
            <FiMessageSquare className={styles.railIconSvg} />
          </span>
          <span className={styles.railLabel}>Private message</span>
          <span className={styles.railTooltip}>Private message</span>
        </button>

        <div
          className={`${styles.serverSection} ${
            isServerMenuOpen ? styles.serverSectionOpen : ""
          }`}
        >
          <button
            type="button"
            className={`${styles.railItem} ${styles.serverSectionTrigger} ${
              active === "teams" ? styles.railItemActive : ""
            }`}
            onClick={toggleServerMenu}
            aria-expanded={isServerMenuOpen}
            aria-controls="sidebar-server-menu"
            aria-label="Server"
          >
            <span className={styles.railIcon} aria-hidden="true">
              <FiUsers className={styles.railIconSvg} />
            </span>
            <span className={styles.railLabelRow}>
              <span className={styles.railLabel}>Server</span>
              <span
                className={`${styles.serverArrow} ${
                  isServerMenuOpen ? styles.serverArrowOpen : ""
                }`}
                aria-hidden="true"
              >
                <FiChevronDown className={styles.serverArrowIcon} />
              </span>
            </span>
            <span className={styles.railTooltip}>Server</span>
          </button>

          <div
            id="sidebar-server-menu"
            className={`${styles.serverMenu} ${
              isServerMenuOpen ? styles.serverMenuOpen : ""
            }`}
          >
            {userServers && userServers.length > 0 && (
              <div className={styles.serverList}>
                {userServers.map(({ server }) => {
                  const initials = server.name
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((word) => word[0]?.toUpperCase() ?? "")
                    .join("");

                  return (
                    <button
                      key={server.id}
                      type="button"
                      className={styles.serverAvatarButton}
                      onClick={() => {
                        setSelectedServerId(server.id);
                        activate("teams");
                        router.push(`/servers/${server.id}`);
                      }}
                      aria-label={`Open server ${server.name}`}
                    >
                      <span className={styles.serverAvatar}>
                        {initials || "S"}
                      </span>
                      <span className={styles.railTooltip}>{server.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <button
              type="button"
              className={styles.railItem}
              onClick={() => setIsCreateServerOpen(true)}
              aria-label="New server"
            >
              <span className={styles.railIcon} aria-hidden="true">
                <FiPlus className={styles.railIconSvg} />
              </span>
              <span className={styles.railLabel}>New server</span>
              <span className={styles.railTooltip}>New server</span>
            </button>
          </div>
        </div>
      </nav>
      {isSidebarRailOpen && (
        <button
          type="button"
          className={styles.railBackdrop}
          aria-label="Close sidebar"
          onClick={closeMobileSidebars}
        />
      )}
      <ModalCreateServer
        isOpen={isCreateServerOpen}
        onClose={() => setIsCreateServerOpen(false)}
      />
    </>
  );
}

