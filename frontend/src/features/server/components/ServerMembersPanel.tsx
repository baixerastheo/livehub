"use client";

import React from "react";
import panelStyles from "@/src/features/messages/styles/ConversationDetailsPanel.module.css";
import styles from "../styles/ServerMembersPanel.module.css";
import { useServerMembersQuery } from "../server.hooks";
import type { ServerRole, ServerMemberDto } from "../server.types";
import { getDisplayName } from "@/src/features/shared/lib/displayName";
import { UserAvatar } from "@/src/features/shared/components/avatar/UserAvatar";

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
  const { data: members, isLoading, error } = useServerMembersQuery(serverId);

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
                      <UserAvatar
                        avatarUrl={member.user.avatarUrl}
                        displayName={getDisplayName(member.user)}
                        size="smMd"
                        className={styles.avatar}
                        aria-hidden
                      />
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
    </aside>
  );
}
