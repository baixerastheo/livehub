"use client";

import React from "react";
import styles from "./FriendsPanels.module.css";
import { useFriendsQuery } from "@/src/features/friends/friends.hooks";
import { useAppStore } from "@/src/core/store/appStore";
import { useAuthStore } from "@/src/core/store/auth/useAuthStore";
import { FiMessageSquare } from "react-icons/fi";

export function FriendsPanel() {
  const openAuthModal = useAppStore((s) => s.openAuthModal);
  const status = useAuthStore((s) => s.status);
  const friendsQuery = useFriendsQuery();

  if (status !== "authenticated") {
    return (
      <div className={styles.state}>
        <div className={styles.stateTitle}>You&apos;re not logged in.</div>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => openAuthModal("login")}
        >
          Sign in
        </button>
      </div>
    );
  }

  if (friendsQuery.isLoading) return <div className={styles.state}>Loading friends…</div>;
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
  if (friends.length === 0) return <div className={styles.state}>No friends yet.</div>;

  return (
    <ul className={styles.list}>
      {friends.map((u) => (
        <li key={u.id} className={styles.row}>
          <div className={styles.meta}>
            <div className={styles.avatar} aria-hidden="true">
              {u.nomUtilisateur?.slice(0, 1)?.toUpperCase() ?? "?"}
            </div>
            <div className={styles.text}>
              <div className={styles.username}>{u.nomUtilisateur}</div>
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

