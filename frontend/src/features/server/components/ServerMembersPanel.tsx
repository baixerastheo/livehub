"use client";

import React from "react";
import panelStyles from "@/src/features/messages/styles/ConversationDetailsPanel.module.css";
import styles from "../styles/ServerMembersPanel.module.css";
import {
  useServerMembersQuery,
  useUpdateMemberRoleMutation,
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
const ROLE_SECTION_LABELS: Record<ServerRole, string> = {
  PROPRIETAIRE: "Owner",
  ADMINISTRATEUR: "Admin",
  MEMBRE: "Member",
};

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
  const selectedServerId = useAppStore((s) => s.selectedServerId);
  const { data: userServers } = useUserServersQuery();
  const { data: members, isLoading, error } = useServerMembersQuery(serverId);
  const updateRoleMutation = useUpdateMemberRoleMutation(serverId);

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
      aria-label="Membres du serveur"
    >
      <div className={panelStyles.panelTitle}>Membres</div>

      {error && (
        <div className={styles.error}>
          Impossible de charger les membres.
        </div>
      )}

      {isLoading && (
        <div className={styles.loading}>Chargement…</div>
      )}

      {!error && !isLoading && (!members || members.length === 0) && (
        <div className={styles.empty}>Aucun membre.</div>
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
                              ? "En ligne"
                              : "Hors ligne"
                          }
                          title={
                            isOnline(member.user.statut)
                              ? "En ligne"
                              : "Hors ligne"
                          }
                        />
                      </div>
                      <div className={styles.memberInfo}>
                        <span className={styles.memberName}>
                          {getDisplayName(member.user)}
                        </span>
                        {canChangeRoles && member.role !== ROLE_PROPRIETAIRE && (
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
                            disabled={updateRoleMutation.isPending}
                            title={
                              member.role === ROLE_ADMINISTRATEUR
                                ? "Retirer le rôle admin"
                                : "Passer admin"
                            }
                          >
                            {member.role === ROLE_ADMINISTRATEUR
                              ? "Retirer admin"
                              : "Passer admin"}
                          </button>
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
