"use client";

import React from "react";
import { useTranslations } from "next-intl";
import panelStyles from "@/src/features/messages/styles/ConversationDetailsPanel.module.css";
import styles from "../styles/ServerMembersPanel.module.css";
import {
  useServerMembersQuery,
  useUpdateMemberRoleMutation,
  useTransferOwnershipMutation,
  useUserServersQuery,
} from "../server.hooks";
import { useAppStore } from "@/src/core/store/appStore";
import type {
  ServerRole,
  ServerMemberDto,
  UserStatus,
} from "../server.types";
import { getDisplayName } from "@/src/features/shared/lib/displayName";
import { UserAvatar } from "@/src/features/shared/components/avatar/UserAvatar";

const ROLE_PROPRIETAIRE: ServerRole = "PROPRIETAIRE";
const ROLE_ADMINISTRATEUR: ServerRole = "ADMINISTRATEUR";
const ROLE_MEMBRE: ServerRole = "MEMBRE";

function isOnline(statut: UserStatus | undefined): boolean {
  return statut === "EN_LIGNE";
}

const ROLE_ORDER: ServerRole[] = ["PROPRIETAIRE", "ADMINISTRATEUR", "MEMBRE"];

function groupMembersByRole<T extends { role: ServerRole }>(
  members: T[],
): Map<ServerRole, T[]> {
  const map = new Map<ServerRole, T[]>();
  for (const role of ROLE_ORDER) {
    map.set(role, []);
  }
  for (const member of members) {
    map.get(member.role)!.push(member);
  }
  return map;
}

type Props = {
  serverId: number;
};

export function ServerMembersPanel({ serverId }: Props) {
  const t = useTranslations("server");
  const tCommon = useTranslations("common");
  const selectedServerId = useAppStore((s) => s.selectedServerId);
  const { data: userServers } = useUserServersQuery();
  const { data: members, isLoading, error } = useServerMembersQuery(serverId);
  const updateRoleMutation = useUpdateMemberRoleMutation(serverId);
  const transferOwnershipMutation = useTransferOwnershipMutation(serverId);

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
  const canChangeRoles = currentUserRole === ROLE_PROPRIETAIRE;

  const membersByRole = React.useMemo(
    () => (members ? groupMembersByRole(members) : new Map()),
    [members],
  );

  return (
    <aside
      className={panelStyles.rightPanel}
      aria-label={t("membersPanel")}
    >
      <div className={panelStyles.panelTitle}>{t("members")}</div>

      {error && (
        <div className={styles.error}>
          {t("cannotLoadMembers")}
        </div>
      )}

      {isLoading && (
        <div className={styles.loading}>{t("loadingMembers")}</div>
      )}

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
                    <li key={member.userId} className={styles.memberRow}>
                      <div className={styles.avatarWrapper}>
                        <UserAvatar
                          avatarUrl={member.user.avatarUrl}
                          displayName={getDisplayName(member.user)}
                          size="smMd"
                          className={styles.avatar}
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
                          title={
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
                        {canChangeRoles && member.role !== ROLE_PROPRIETAIRE && (
                          <>
                            <button
                              type="button"
                              className={styles.roleAction}
                              onClick={() => {
                                const newRole =
                                  member.role === ROLE_ADMINISTRATEUR
                                    ? ROLE_MEMBRE
                                    : ROLE_ADMINISTRATEUR;
                                updateRoleMutation.mutate({
                                  userId: member.userId,
                                  role: newRole,
                                });
                              }}
                              disabled={
                                updateRoleMutation.isPending ||
                                transferOwnershipMutation.isPending
                              }
                              title={
                                member.role === ROLE_ADMINISTRATEUR
                                  ? t("removeAdmin")
                                  : t("makeAdmin")
                              }
                            >
                              {member.role === ROLE_ADMINISTRATEUR
                                ? t("removeAdmin")
                                : t("makeAdmin")}
                            </button>
                            <button
                              type="button"
                              className={styles.roleAction}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    t("transferOwnership"),
                                  )
                                ) {
                                  transferOwnershipMutation.mutate(member.userId);
                                }
                              }}
                              disabled={
                                updateRoleMutation.isPending ||
                                transferOwnershipMutation.isPending
                              }
                              title={t("transferOwnership")}
                            >
                              {t("transferOwnership")}
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
