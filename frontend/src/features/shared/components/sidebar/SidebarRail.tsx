"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/src/core/store/appStore";
import styles from "../../styles/sidebar/SidebarRail.module.css";
import { FiBell, FiMessageSquare, FiPlus } from "react-icons/fi";
import { ModalCreateServer } from "@/src/features/server/components/modalCreateServer";
import { useUserServersQuery } from "@/src/features/server/server.hooks";
import { useNotificationsQuery } from "@/src/features/notifications/notification.hooks";
import { useAuth } from "@/src/core/store/auth/useAuth";
import badgeStyles from "../../styles/sidebar/SidebarNotifications.module.css";

type RailItem = "activity" | "conversation" | "teams";

type ServerTooltip = { name: string; y: number } | null;

export function SidebarRail() {
  const router = useRouter();
  const t = useTranslations("sidebar");
  const isSidebarRailOpen = useAppStore((state) => state.isSidebarRailOpen);
  const active = useAppStore((state) => state.sidebarSection);
  const openSidebar = useAppStore((state) => state.openSidebar);
  const setSidebarSection = useAppStore((state) => state.setSidebarSection);
  const setSelectedServerId = useAppStore((state) => state.setSelectedServerId);
  const closeMobileSidebars = useAppStore((state) => state.closeMobileSidebars);
  const selectedServerId = useAppStore((state) => state.selectedServerId);

  const [isCreateServerOpen, setIsCreateServerOpen] = React.useState(false);
  const [serverTooltip, setServerTooltip] = React.useState<ServerTooltip>(null);

  const { data: userServers } = useUserServersQuery();
  const { isAuthenticated } = useAuth();
  const { data: notifications = [] } = useNotificationsQuery(isAuthenticated);
  const unreadCount = notifications.filter((n) => !n.lu).length;

  React.useEffect(() => {
    if (unreadCount > 0) {
      window.electron?.setBadge(unreadCount);
    }
  }, [unreadCount]);

  const serverColor = React.useCallback((name: string, id: number): string => {
    const PALETTE = [
      ["#6366f1", "#818cf8"],
      ["#8b5cf6", "#a78bfa"],
      ["#ec4899", "#f472b6"],
      ["#f59e0b", "#fbbf24"],
      ["#10b981", "#34d399"],
      ["#3b82f6", "#60a5fa"],
      ["#ef4444", "#f87171"],
      ["#14b8a6", "#2dd4bf"],
      ["#f97316", "#fb923c"],
      ["#a855f7", "#c084fc"],
    ];
    const hash = (name + id)
      .split("")
      .reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0);
    const [from, to] = PALETTE[Math.abs(hash) % PALETTE.length];
    return `linear-gradient(135deg, ${from}, ${to})`;
  }, []);

  const activate = (item: RailItem) => {
    setSidebarSection(item);
    openSidebar();
  };

  return (
    <>
      <nav
        className={`${styles.rail} ${isSidebarRailOpen ? styles.railOpen : ""}`}
        aria-label={t("sidebarMenu")}
      >
        {/* Nav items */}
        <div className={styles.navSection}>
          <button
            type="button"
            className={`${styles.navItem} ${active === "activity" ? styles.navItemActive : ""}`}
            onClick={() => {
              activate("activity");
              window.electron?.setBadge(0);
            }}
            aria-label={t("notification")}
          >
            <span className={styles.navIcon}>
              <span className={badgeStyles.bellWrapper}>
                <FiBell className={styles.navIconSvg} />
                {unreadCount > 0 && (
                  <span className={badgeStyles.badge}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
            </span>
            <span className={styles.tooltip}>{t("notification")}</span>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${active === "conversation" ? styles.navItemActive : ""}`}
            onClick={() => activate("conversation")}
            aria-label={t("privateMessage")}
          >
            <span className={styles.navIcon}>
              <FiMessageSquare className={styles.navIconSvg} />
            </span>
            <span className={styles.tooltip}>{t("privateMessage")}</span>
          </button>
        </div>

        {/* Separator */}
        <div className={styles.separator} role="separator" />

        {/* Server list — always visible, scrollable */}
        <div className={styles.serverList} aria-label={t("server")}>
          <div className={styles.serverListScroll}>
            {userServers?.map(({ server }) => {
              const words = server.name.trim().split(/\s+/);
              const raw =
                words.length === 1
                  ? words[0].slice(0, 3)
                  : words.slice(0, 4).map((w) => w[0] ?? "").join("");
              const initials =
                raw.length > 0
                  ? raw[0].toUpperCase() + raw.slice(1).toLowerCase()
                  : "S";
              const isActive = selectedServerId === server.id;

              return (
                <button
                  key={server.id}
                  type="button"
                  className={`${styles.serverItem} ${isActive ? styles.serverItemActive : ""}`}
                  onClick={() => {
                    setSelectedServerId(server.id);
                    setSidebarSection("teams");
                    router.push(`/servers/${server.id}`);
                  }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setServerTooltip({ name: server.name, y: rect.top + rect.height / 2 });
                  }}
                  onMouseLeave={() => setServerTooltip(null)}
                  aria-label={server.name}
                  aria-current={isActive ? "true" : undefined}
                >
                  <span
                    className={styles.serverAvatar}
                    style={
                      server.avatarUrl
                        ? undefined
                        : { background: serverColor(server.name, server.id) }
                    }
                  >
                    {server.avatarUrl ? (
                      <img
                        src={server.avatarUrl}
                        alt={server.name}
                        className={styles.serverAvatarImg}
                      />
                    ) : (
                      initials || "S"
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom — add server */}
        <div className={styles.bottom}>
          <button
            type="button"
            className={styles.addServerButton}
            onClick={() => setIsCreateServerOpen(true)}
            aria-label={t("newServer")}
          >
            <FiPlus className={styles.addServerIcon} />
            <span className={styles.tooltip}>{t("newServer")}</span>
          </button>
        </div>
      </nav>

      {/* Server tooltip — position: fixed pour échapper au overflow du scroll container */}
      {serverTooltip && (
        <div
          className={styles.serverTooltipFixed}
          style={{ top: serverTooltip.y }}
          role="tooltip"
        >
          {serverTooltip.name}
        </div>
      )}

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
