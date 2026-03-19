"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("sidebar");
  const isSidebarRailOpen = useAppStore((state) => state.isSidebarRailOpen);
  const active = useAppStore((state) => state.sidebarSection);
  const openSidebar = useAppStore((state) => state.openSidebar);
  const setSidebarSection = useAppStore((state) => state.setSidebarSection);
  const setSelectedServerId = useAppStore((state) => state.setSelectedServerId);
  const closeMobileSidebars = useAppStore((state) => state.closeMobileSidebars);

  const [isServerMenuOpen, setIsServerMenuOpen] = React.useState(false);

  const serverColor = React.useCallback((name: string, id: number): string => {
    const PALETTE = [
      ["#6366f1", "#818cf8"], // indigo
      ["#8b5cf6", "#a78bfa"], // violet
      ["#ec4899", "#f472b6"], // pink
      ["#f59e0b", "#fbbf24"], // amber
      ["#10b981", "#34d399"], // emerald
      ["#3b82f6", "#60a5fa"], // blue
      ["#ef4444", "#f87171"], // red
      ["#14b8a6", "#2dd4bf"], // teal
      ["#f97316", "#fb923c"], // orange
      ["#a855f7", "#c084fc"], // purple
    ];
    const hash = (name + id)
      .split("")
      .reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0);
    const [from, to] = PALETTE[Math.abs(hash) % PALETTE.length];
    return `linear-gradient(135deg, ${from}, ${to})`;
  }, []);
  const [isCreateServerOpen, setIsCreateServerOpen] = React.useState(false);
  const { data: userServers } = useUserServersQuery();
  const selectedServerId = useAppStore((state) => state.selectedServerId);

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
        aria-label={t("sidebarMenu")}
      >
        <button
          type="button"
          className={`${styles.railItem} ${
            active === "activity" ? styles.railItemActive : ""
          }`}
          onClick={() => activate("activity")}
          aria-label={t("notification")}
        >
          <span className={styles.railIcon} aria-hidden="true">
            <FiBell className={styles.railIconSvg} />
          </span>
          <span className={styles.railLabel}>{t("notification")}</span>
          <span className={styles.railTooltip}>{t("notification")}</span>
        </button>

        <button
          type="button"
          className={`${styles.railItem} ${
            active === "conversation" ? styles.railItemActive : ""
          }`}
          onClick={() => activate("conversation")}
          aria-label={t("privateMessage")}
        >
          <span className={styles.railIcon} aria-hidden="true">
            <FiMessageSquare className={styles.railIconSvg} />
          </span>
          <span className={styles.railLabel}>{t("privateMessage")}</span>
          <span className={styles.railTooltip}>{t("privateMessage")}</span>
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
            aria-label={t("server")}
          >
            <span className={styles.railIcon} aria-hidden="true">
              <FiUsers className={styles.railIconSvg} />
            </span>
            <span className={styles.railLabelRow}>
              <span className={styles.railLabel}>{t("server")}</span>
              <span
                className={styles.serverArrow}
                aria-hidden="true"
              >
                <FiChevronDown className={styles.serverArrowIcon} />
              </span>
            </span>
            <span className={styles.railTooltip}>{t("server")}</span>
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
                  const words = server.name.trim().split(/\s+/);
                  const raw = words.length === 1
                    ? words[0].slice(0, 3)
                    : words.slice(0, 4).map((w) => w[0] ?? "").join("");
                  const initials = raw.length > 0
                    ? raw[0].toUpperCase() + raw.slice(1).toLowerCase()
                    : "S";

                  const isActive = selectedServerId === server.id;
                  return (
                    <button
                      key={server.id}
                      type="button"
                      className={`${styles.serverAvatarButton} ${isActive ? styles.serverAvatarActive : ""}`}
                      onClick={() => {
                        setSelectedServerId(server.id);
                        setSidebarSection("teams");
                        router.push(`/servers/${server.id}`);
                      }}
                      aria-label={`Open server ${server.name}`}
                    >
                      {server.avatarUrl ? (
                        <span className={styles.serverAvatar}>
                          <img
                            src={server.avatarUrl}
                            alt={server.name}
                            className={styles.serverAvatarImg}
                          />
                        </span>
                      ) : (
                        <span
                          className={styles.serverAvatar}
                          style={{ background: serverColor(server.name, server.id) }}
                        >
                          {initials || "S"}
                        </span>
                      )}
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
              aria-label={t("newServer")}
            >
              <span className={styles.railIcon} aria-hidden="true">
                <FiPlus className={styles.railIconSvg} />
              </span>
              <span className={styles.railLabel}>{t("newServer")}</span>
              <span className={styles.railTooltip}>{t("newServer")}</span>
            </button>
          </div>
        </div>
      </nav>
      {isSidebarRailOpen && (
        <button
          type="button"
          className={styles.railBackdrop}
          aria-label={t("sidebarMenu")}
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

