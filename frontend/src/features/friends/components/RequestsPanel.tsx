"use client";

import React from "react";
import { useTranslations } from "next-intl";
import styles from "./FriendsPanels.module.css";
import {
  useAcceptFriendRequestMutation,
  useDeclineFriendRequestMutation,
  useFriendRequestsQuery,
} from "@/src/features/friends/friends.hooks";
import { useAuthModal } from "@/src/features/modalAuth/store/useAuthModal";
import { useAuth } from "@/src/core/store/auth/useAuth";
import { FiCheck, FiX } from "react-icons/fi";
import { UserAvatar } from "@/src/features/shared/components/avatar/UserAvatar";
import { getDisplayName } from "@/src/features/shared/lib/displayName";

export function RequestsPanel() {
  const openLogin = useAuthModal((s) => s.openLogin);
  const { user, isAuthenticated } = useAuth();
  const meId = user?.id ?? null;
  const requestsQuery = useFriendRequestsQuery();
  const acceptMutation = useAcceptFriendRequestMutation();
  const declineMutation = useDeclineFriendRequestMutation();
  const t = useTranslations("friends");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");

  const incoming = React.useMemo(() => {
    const all = requestsQuery.data ?? [];
    if (!meId) return all;
    return all.filter((r) => r.toUser?.id === meId);
  }, [meId, requestsQuery.data]);

  const outgoing = React.useMemo(() => {
    const all = requestsQuery.data ?? [];
    if (!meId) return all;
    return all.filter((r) => r.fromUser?.id === meId);
  }, [meId, requestsQuery.data]);

  const count = incoming.length + outgoing.length;

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

  if (requestsQuery.isLoading)
    return <div className={styles.state}>{t("loadingRequests")}</div>;
  if (requestsQuery.isError) {
    const message =
      requestsQuery.error instanceof Error
        ? requestsQuery.error.message
        : t("failedToLoadRequests");
    return (
      <div className={styles.stateError}>
        {message}{" "}
        <button
          type="button"
          className={styles.retryButton}
          onClick={() => requestsQuery.refetch()}
        >
          {tCommon("retry")}
        </button>
      </div>
    );
  }
  if (count === 0) return <div className={styles.state}>{t("noRequests")}</div>;

  return (
    <div className={styles.requestsGrid}>
      <div>
        <div className={styles.subTitle}>{t("incoming")}</div>
        {incoming.length === 0 ? (
          <div className={styles.state}>{t("noIncomingRequests")}</div>
        ) : (
          <ul className={styles.list}>
            {incoming.map((r) => (
              <li key={r.id} className={styles.row}>
                <div className={styles.meta}>
                  <UserAvatar
                    avatarUrl={r.fromUser.avatarUrl}
                    displayName={getDisplayName(r.fromUser)}
                    size="md"
                    className={styles.avatar}
                    aria-hidden
                  />
                  <div className={styles.text}>
                    <div className={styles.username}>
                      {getDisplayName(r.fromUser)}
                    </div>
                    <div className={styles.subtleRow}>{t("pending")}</div>
                  </div>
                </div>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${styles.acceptButton}`}
                    disabled={acceptMutation.isPending}
                    onClick={() => acceptMutation.mutate(r.id)}
                    aria-label={t("acceptRequest")}
                  >
                    <FiCheck className={styles.buttonIcon} aria-hidden="true" />
                    <span className={styles.srOnly}>{t("accept")}</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${styles.declineButton}`}
                    disabled={declineMutation.isPending}
                    onClick={() => declineMutation.mutate(r.id)}
                    aria-label={t("declineRequest")}
                  >
                    <FiX className={styles.buttonIcon} aria-hidden="true" />
                    <span className={styles.srOnly}>{t("decline")}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className={styles.subTitle}>{t("outgoing")}</div>
        {outgoing.length === 0 ? (
          <div className={styles.state}>{t("noOutgoingRequests")}</div>
        ) : (
          <ul className={styles.list}>
            {outgoing.map((r) => (
              <li key={r.id} className={styles.row}>
                <div className={styles.meta}>
                  <UserAvatar
                    avatarUrl={r.toUser.avatarUrl}
                    displayName={getDisplayName(r.toUser)}
                    size="md"
                    className={styles.avatar}
                    aria-hidden
                  />
                  <div className={styles.text}>
                    <div className={styles.username}>
                      {getDisplayName(r.toUser)}
                    </div>
                    <div className={styles.subtleRow}>{t("pending")}</div>
                  </div>
                </div>
                <div className={styles.actions}>
                  <span className={styles.pill}>{t("sent")}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
