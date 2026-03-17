"use client";

import { useTranslations } from "next-intl";
import styles from "../styles/UserDirectory.module.css";
import type { UtilisateurDto } from "@/src/features/users/users.types";
import { FiClock, FiMessageSquare, FiUserPlus } from "react-icons/fi";
import { UserAvatar } from "@/src/features/shared/components/avatar/UserAvatar";
import { getDisplayName } from "@/src/features/shared/lib/displayName";

type UserDirectoryRowProps = {
  user: UtilisateurDto;
  onAddFriend: (user: UtilisateurDto) => void;
  onMessage: (user: UtilisateurDto) => void;
  isAddFriendPending?: boolean;
};

export function UserDirectoryRow({
  user,
  onAddFriend,
  onMessage,
  isAddFriendPending,
}: UserDirectoryRowProps) {
  const t = useTranslations("friends");
  const tMessages = useTranslations("messages");
  const tCommon = useTranslations("common");

  const statusKeyMap: Record<string, string> = {
    EN_LIGNE: "online",
    HORS_LIGNE: "offline",
    ABSENT: "absent",
    INVISIBLE: "invisible",
  };
  const statusLabel = user.statut
    ? tCommon(statusKeyMap[user.statut] ?? "offline")
    : tCommon("offline");

  return (
    <li className={styles.row}>
      <div className={styles.userBlock}>
        <UserAvatar
          avatarUrl={user.avatarUrl}
          displayName={getDisplayName(user)}
          size="md"
          className={styles.avatar}
          aria-hidden
        />
        <div className={styles.userMeta}>
          <div className={styles.username}>{getDisplayName(user)}</div>
          <div className={styles.userSubtle}>
            <span className={styles.statusDot} data-status={user.statut} />
            {statusLabel}
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => onAddFriend(user)}
          aria-label={isAddFriendPending ? t("friendRequestPending") : t("addFriend")}
          disabled={isAddFriendPending}
        >
          {isAddFriendPending ? (
            <>
              <FiClock className={styles.buttonIcon} aria-hidden="true" />
              <span className={styles.srOnly}>{t("pending")}</span>
            </>
          ) : (
            <>
              <FiUserPlus className={styles.buttonIcon} aria-hidden="true" />
              <span className={styles.srOnly}>{t("addFriend")}</span>
            </>
          )}
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => onMessage(user)}
          aria-label={t("sendMessage")}
        >
          <FiMessageSquare className={styles.buttonIcon} aria-hidden="true" />
          <span className={styles.srOnly}>{t("sendMessage")}</span>
        </button>
      </div>
    </li>
  );
}

