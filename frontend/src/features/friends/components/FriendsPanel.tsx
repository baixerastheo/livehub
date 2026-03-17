"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import styles from "./FriendsPanels.module.css";
import { useFriendsQuery } from "@/src/features/friends/friends.hooks";
import { useAuthModal } from "@/src/features/modalAuth/store/useAuthModal";
import { useAuth } from "@/src/core/store/auth/useAuth";
import { FiMessageSquare } from "react-icons/fi";
import { UserAvatar } from "@/src/features/shared/components/avatar/UserAvatar";
import { getDisplayName } from "@/src/features/shared/lib/displayName";
import type { FriendDto } from "@/src/features/friends/friends.types";

export function FriendsPanel() {
  const router = useRouter();
  const openLogin = useAuthModal((s) => s.openLogin);
  const { isAuthenticated } = useAuth();
  const friendsQuery = useFriendsQuery();
  const t = useTranslations("friends");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");

  const handleMessage = React.useCallback(
    (user: FriendDto) => {
      if (!isAuthenticated) return openLogin();
      const name = user.name ?? user.email ?? "";
      const params = new URLSearchParams({ with: user.id });
      if (name) params.set("name", name);
      router.push(`/messages?${params.toString()}`);
    },
    [isAuthenticated, openLogin, router],
  );

  if (!isAuthenticated) {
    return (
      <div className={styles.state}>
        <div className={styles.stateTitle}>{tAuth("notLoggedIn")}</div>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => openLogin()}
        >
          {tAuth("signIn")}
        </button>
      </div>
    );
  }

  if (friendsQuery.isLoading)
    return <div className={styles.state}>{t("loadingFriends")}</div>;
  if (friendsQuery.isError) {
    const message =
      friendsQuery.error instanceof Error
        ? friendsQuery.error.message
        : t("failedToLoadFriends");
    return (
      <div className={styles.stateError}>
        {message}{" "}
        <button
          type="button"
          className={styles.retryButton}
          onClick={() => friendsQuery.refetch()}
        >
          {tCommon("retry")}
        </button>
      </div>
    );
  }

  const friends = friendsQuery.data ?? [];
  if (friends.length === 0)
    return <div className={styles.state}>{t("noFriendsYet")}</div>;

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
            <button
              type="button"
              className={styles.iconButton}
              aria-label={t("sendMessage")}
              onClick={() => handleMessage(u)}
            >
              <FiMessageSquare
                className={styles.buttonIcon}
                aria-hidden="true"
              />
              <span className={styles.srOnly}>{t("sendMessage")}</span>
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
