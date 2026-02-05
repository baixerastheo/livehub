"use client";

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
            {user.statut?.replaceAll("_", " ")?.toLowerCase()}
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => onAddFriend(user)}
          aria-label={isAddFriendPending ? "Friend request pending" : "Add friend"}
          disabled={isAddFriendPending}
        >
          {isAddFriendPending ? (
            <>
              <FiClock className={styles.buttonIcon} aria-hidden="true" />
              <span className={styles.srOnly}>Pending</span>
            </>
          ) : (
            <>
              <FiUserPlus className={styles.buttonIcon} aria-hidden="true" />
              <span className={styles.srOnly}>Add friend</span>
            </>
          )}
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => onMessage(user)}
          aria-label="Message"
        >
          <FiMessageSquare className={styles.buttonIcon} aria-hidden="true" />
          <span className={styles.srOnly}>Message</span>
        </button>
      </div>
    </li>
  );
}

