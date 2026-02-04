"use client";

import React from "react";
import styles from "./FriendsPanels.module.css";
import {
  useAcceptFriendRequestMutation,
  useDeclineFriendRequestMutation,
  useFriendRequestsQuery,
} from "@/src/features/friends/friends.hooks";
import { useAuthModal } from "@/src/features/modalAuth/store/useAuthModal";
import { useAuth } from "@/src/core/store/auth/useAuth";
import { FiCheck, FiX } from "react-icons/fi";

function displayName(u: { name?: string; email?: string }): string {
  return u.name ?? u.email ?? "?";
}

export function RequestsPanel() {
  const openLogin = useAuthModal((s) => s.openLogin);
  const { user, isAuthenticated } = useAuth();
  const meId = user?.id ?? null;
  const requestsQuery = useFriendRequestsQuery();
  const acceptMutation = useAcceptFriendRequestMutation();
  const declineMutation = useDeclineFriendRequestMutation();

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

  if (requestsQuery.isLoading)
    return <div className={styles.state}>Loading requests…</div>;
  if (requestsQuery.isError) {
    const message =
      requestsQuery.error instanceof Error
        ? requestsQuery.error.message
        : "Failed to load requests.";
    return (
      <div className={styles.stateError}>
        {message}{" "}
        <button
          type="button"
          className={styles.retryButton}
          onClick={() => requestsQuery.refetch()}
        >
          Retry
        </button>
      </div>
    );
  }
  if (count === 0) return <div className={styles.state}>No requests.</div>;

  return (
    <div className={styles.requestsGrid}>
      <div>
        <div className={styles.subTitle}>Incoming</div>
        {incoming.length === 0 ? (
          <div className={styles.state}>No incoming requests.</div>
        ) : (
          <ul className={styles.list}>
            {incoming.map((r) => (
              <li key={r.id} className={styles.row}>
                <div className={styles.meta}>
                  <div className={styles.avatar} aria-hidden="true">
                    {displayName(r.fromUser).slice(0, 1).toUpperCase()}
                  </div>
                  <div className={styles.text}>
                    <div className={styles.username}>
                      {displayName(r.fromUser)}
                    </div>
                    <div className={styles.subtleRow}>pending</div>
                  </div>
                </div>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${styles.acceptButton}`}
                    disabled={acceptMutation.isPending}
                    onClick={() => acceptMutation.mutate(r.id)}
                    aria-label="Accept request"
                  >
                    <FiCheck className={styles.buttonIcon} aria-hidden="true" />
                    <span className={styles.srOnly}>Accept</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${styles.declineButton}`}
                    disabled={declineMutation.isPending}
                    onClick={() => declineMutation.mutate(r.id)}
                    aria-label="Decline request"
                  >
                    <FiX className={styles.buttonIcon} aria-hidden="true" />
                    <span className={styles.srOnly}>Decline</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className={styles.subTitle}>Outgoing</div>
        {outgoing.length === 0 ? (
          <div className={styles.state}>No outgoing requests.</div>
        ) : (
          <ul className={styles.list}>
            {outgoing.map((r) => (
              <li key={r.id} className={styles.row}>
                <div className={styles.meta}>
                  <div className={styles.avatar} aria-hidden="true">
                    {displayName(r.toUser).slice(0, 1).toUpperCase()}
                  </div>
                  <div className={styles.text}>
                    <div className={styles.username}>
                      {displayName(r.toUser)}
                    </div>
                    <div className={styles.subtleRow}>pending</div>
                  </div>
                </div>
                <div className={styles.actions}>
                  <span className={styles.pill}>Sent</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
