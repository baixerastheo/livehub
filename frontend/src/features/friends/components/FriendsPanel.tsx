"use client";

import React from "react";
import styles from "./FriendsPanels.module.css";
import { useFriendsQuery } from "@/src/features/friends/friends.hooks";
import { useAuthModal } from "@/src/features/modalAuth/store/useAuthModal";
import { useAuth } from "@/src/core/store/auth/useAuth";
import { FiMessageSquare } from "react-icons/fi";
import { UserAvatar } from "@/src/features/shared/components/avatar/UserAvatar";
import { getDisplayName } from "@/src/features/shared/lib/displayName";

export function FriendsPanel() {
  const openLogin = useAuthModal((s) => s.openLogin);
  const { isAuthenticated } = useAuth();
  const friendsQuery = useFriendsQuery();

  if (!isAuthenticated) {
    return (
      <div className={styles.state}>
        <div className={styles.stateTitle}>You&apos;re not logged in.</div>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => openLogin()}
        >
          Sign in
        </button>
      </div>
    );
  }

  if (friendsQuery.isLoading)
    return <div className={styles.state}>Loading friends…</div>;
  if (friendsQuery.isError) {
    const message =
      friendsQuery.error instanceof Error
        ? friendsQuery.error.message
        : "Failed to load friends.";
    return (
      <div className={styles.stateError}>
        {message}{" "}
        <button
          type="button"
          className={styles.retryButton}
          onClick={() => friendsQuery.refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  const friends = friendsQuery.data ?? [];
  if (friends.length === 0)
    return <div className={styles.state}>No friends yet.</div>;

  return (
    <ul className={styles.list}>
      {friends.map((u) => (
        <li key={u.id} className={styles.row}>
          <div className={styles.meta}>
            <UserAvatar
              avatarUrl={u.avatarUrl}
              displayName={getDisplayName(u)}
              size="md"
              className={styles.avatar}
              aria-hidden
            />
            <div className={styles.text}>
              <div className={styles.username}>{getDisplayName(u)}</div>
              <div className={styles.subtleRow}>
                {u.statut?.replaceAll("_", " ")?.toLowerCase()}
              </div>
            </div>
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.iconButton} aria-label="Message">
              <FiMessageSquare className={styles.buttonIcon} aria-hidden="true" />
              <span className={styles.srOnly}>Message</span>
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
