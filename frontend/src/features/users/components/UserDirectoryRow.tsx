"use client";

import React from "react";
import styles from "../styles/UserDirectory.module.css";
import type { UtilisateurDto } from "@/src/features/users/users.types";
import { FiClock, FiMessageSquare, FiUserPlus } from "react-icons/fi";

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
        <div className={styles.avatar} aria-hidden="true">
          {user.nomUtilisateur?.slice(0, 1)?.toUpperCase() ?? "?"}
        </div>
        <div className={styles.userMeta}>
          <div className={styles.username}>{user.nomUtilisateur}</div>
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

