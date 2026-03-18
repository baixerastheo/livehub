"use client";

import React from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import panelStyles from "@/src/features/messages/styles/ConversationDetailsPanel.module.css";
import styles from "../styles/ServerMembersPanel.module.css";
import {
  useServerMembersQuery,
  useUpdateMemberRoleMutation,
  useTransferOwnershipMutation,
  useKickMemberMutation,
  useBanMemberMutation,
  useUserServersQuery,
} from "../server.hooks";
import { useAppStore } from "@/src/core/store/appStore";
import { useAuth } from "@/src/core/store/auth/useAuth";
import type { ServerRole, ServerMemberDto, UserStatus } from "../server.types";
import { getDisplayName } from "@/src/features/shared/lib/displayName";
import { UserAvatar } from "@/src/features/shared/components/avatar/UserAvatar";
import { BanMemberModal } from "./BanMemberModal";

const ROLE_PROPRIETAIRE: ServerRole = "PROPRIETAIRE";
const ROLE_ADMINISTRATEUR: ServerRole = "ADMINISTRATEUR";
const ROLE_MEMBRE: ServerRole = "MEMBRE";
const ROLE_ORDER: ServerRole[] = ["PROPRIETAIRE", "ADMINISTRATEUR", "MEMBRE"];

function isOnline(statut: UserStatus | undefined) {
  return statut === "EN_LIGNE";
}

function groupMembersByRole<T extends { role: ServerRole }>(
  members: T[],
): Map<ServerRole, T[]> {
  const map = new Map<ServerRole, T[]>();
  for (const role of ROLE_ORDER) map.set(role, []);
  for (const m of members) map.get(m.role)!.push(m);
  return map;
}

type ContextMenuState = { member: ServerMemberDto; x: number; y: number };

type Props = { serverId: number };

export function ServerMembersPanel({ serverId }: Props) {
  const t = useTranslations("server");
  const tCommon = useTranslations("common");
  const { user } = useAuth();
  const selectedServerId = useAppStore((s) => s.selectedServerId);
  const { data: userServers } = useUserServersQuery();
  const { data: members, isLoading, error } = useServerMembersQuery(serverId);

  const updateRoleMutation = useUpdateMemberRoleMutation(serverId);
  const transferOwnershipMutation = useTransferOwnershipMutation(serverId);
  const kickMutation = useKickMemberMutation(serverId);
  const banMutation = useBanMemberMutation(serverId);

  const [contextMenu, setContextMenu] = React.useState<ContextMenuState | null>(null);
  const [banTarget, setBanTarget] = React.useState<ServerMemberDto | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const ROLE_SECTION_LABELS: Record<ServerRole, string> = {
    PROPRIETAIRE: t("owner"),
    ADMINISTRATEUR: t("admin"),
    MEMBRE: t("member"),
  };

  const currentUserRole = React.useMemo(
    () =>
      selectedServerId === serverId
        ? userServers?.find((u) => u.server.id === serverId)?.role
        : undefined,
    [selectedServerId, serverId, userServers],
  );

  const isOwner = currentUserRole === ROLE_PROPRIETAIRE;
  const canManageMembers =
    currentUserRole === ROLE_PROPRIETAIRE ||
    currentUserRole === ROLE_ADMINISTRATEUR;

  const membersByRole = React.useMemo(
    () => (members ? groupMembersByRole(members) : new Map()),
    [members],
  );

  const openMenu = (e: React.MouseEvent, member: ServerMemberDto) => {
    e.preventDefault();
    setContextMenu({ member, x: e.clientX, y: e.clientY });
  };

  const closeMenu = () => setContextMenu(null);

  React.useEffect(() => {
    if (!contextMenu) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) closeMenu();
    };
    const onScroll = () => closeMenu();
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [contextMenu]);

  const menuStyle: React.CSSProperties | undefined = contextMenu
    ? {
        position: "fixed",
        top: Math.min(contextMenu.y, window.innerHeight - 160),
        left: Math.min(contextMenu.x, window.innerWidth - 210),
        zIndex: 9999,
      }
    : undefined;

  const canShowContextMenu = (member: ServerMemberDto) =>
    canManageMembers &&
    member.role !== ROLE_PROPRIETAIRE &&
    member.userId !== user?.id;

  return (
    <aside className={panelStyles.rightPanel} aria-label={t("membersPanel")}>
      {error && <div className={styles.error}>{t("cannotLoadMembers")}</div>}
      {isLoading && <div className={styles.loading}>{t("loadingMembers")}</div>}
      {!error && !isLoading && (!members || members.length === 0) && (
        <div className={styles.empty}>{t("noMembers")}</div>
      )}
      {!error && !isLoading && members && members.length > 0 && (
        <div className={styles.sections}>
          {ROLE_ORDER.map((role) => {
            const roleMembers = membersByRole.get(role) ?? [];
            if (roleMembers.length === 0) return null;
            return (
              <div key={role} className={styles.section}>
                <div className={styles.sectionTitle}>
                  {ROLE_SECTION_LABELS[role]} — {roleMembers.length}
                </div>
                <ul className={styles.list} role="list">
                  {roleMembers.map((member: ServerMemberDto) => (
                    <li
                      key={member.userId}
                      className={styles.memberRow}
                      onContextMenu={
                        canShowContextMenu(member)
                          ? (e) => openMenu(e, member)
                          : undefined
                      }
                    >
                      <div className={styles.avatarWrapper}>
                        <UserAvatar
                          avatarUrl={member.user.avatarUrl}
                          displayName={getDisplayName(member.user)}
                          size="smMd"
                          aria-hidden
                        />
                        <span
                          className={
                            isOnline(member.user.statut)
                              ? styles.statusOnline
                              : styles.statusOffline
                          }
                          aria-label={
                            isOnline(member.user.statut)
                              ? tCommon("online")
                              : tCommon("offline")
                          }
                        />
                      </div>
                      <div className={styles.memberInfo}>
                        <span className={styles.memberName}>
                          {getDisplayName(member.user)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Context menu ── */}
      {contextMenu &&
        createPortal(
          <div ref={menuRef} style={menuStyle} className={styles.contextMenu}>
            {isOwner && (
              <>
                <button
                  type="button"
                  className={styles.contextMenuItem}
                  onClick={() => {
                    const newRole =
                      contextMenu.member.role === ROLE_ADMINISTRATEUR
                        ? ROLE_MEMBRE
                        : ROLE_ADMINISTRATEUR;
                    updateRoleMutation.mutate({
                      userId: contextMenu.member.userId,
                      role: newRole,
                    });
                    closeMenu();
                  }}
                  disabled={updateRoleMutation.isPending}
                >
                  {contextMenu.member.role === ROLE_ADMINISTRATEUR
                    ? t("removeAdmin")
                    : t("makeAdmin")}
                </button>
                <button
                  type="button"
                  className={`${styles.contextMenuItem} ${styles.contextMenuItemDanger}`}
                  onClick={() => {
                    if (window.confirm(t("transferOwnership"))) {
                      transferOwnershipMutation.mutate(contextMenu.member.userId);
                    }
                    closeMenu();
                  }}
                  disabled={transferOwnershipMutation.isPending}
                >
                  {t("transferOwnership")}
                </button>
                <div className={styles.contextMenuDivider} />
              </>
            )}
            <button
              type="button"
              className={`${styles.contextMenuItem} ${styles.contextMenuItemWarn}`}
              onClick={() => {
                kickMutation.mutate(contextMenu.member.userId);
                closeMenu();
              }}
              disabled={kickMutation.isPending}
            >
              {t("kick")}
            </button>
            <button
              type="button"
              className={`${styles.contextMenuItem} ${styles.contextMenuItemDanger}`}
              onClick={() => {
                setBanTarget(contextMenu.member);
                closeMenu();
              }}
            >
              {t("ban")}
            </button>
          </div>,
          document.body,
        )}

      <BanMemberModal
        isOpen={banTarget !== null}
        onClose={() => setBanTarget(null)}
        targetName={banTarget ? getDisplayName(banTarget.user) : ""}
        onConfirm={(raison, expireLe) => {
          if (!banTarget) return;
          banMutation.mutate(
            { userId: banTarget.userId, raison, expireLe },
            { onSuccess: () => setBanTarget(null) },
          );
        }}
        isPending={banMutation.isPending}
      />
    </aside>
  );
}
