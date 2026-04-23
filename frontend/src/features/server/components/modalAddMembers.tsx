"use client";

import React from "react";
import { useTranslations } from "next-intl";
import styles from "../styles/modalAddMembers.module.css";
import { useAuth } from "@/src/core/store/auth/useAuth";
import { useFriendsQuery } from "@/src/features/friends/friends.hooks";
import { usePrivateConversationsQuery } from "@/src/features/messages/privateMessage.hooks";
import { useServerMembersQuery, useAddServerMemberMutation } from "../server.hooks";
import { getDisplayName } from "@/src/features/shared/lib/displayName";
import { UserAvatar } from "@/src/features/shared/components/avatar/UserAvatar";

type UserOption = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
};

type ModalAddMembersProps = {
  isOpen: boolean;
  onClose: () => void;
  serverId: number | null;
};

export function ModalAddMembers({
  isOpen,
  onClose,
  serverId,
}: ModalAddMembersProps) {
  const t = useTranslations("server");
  const tAuth = useTranslations("auth");
  const { user: currentUser, isAuthenticated } = useAuth();
  const { data: friends = [], isLoading: friendsLoading } = useFriendsQuery();
  const { data: conversations = [], isLoading: convLoading } =
    usePrivateConversationsQuery(!!isAuthenticated);
  const { data: serverMembers = [] } = useServerMembersQuery(serverId);
  const addMemberMutation = useAddServerMemberMutation(serverId);

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const memberIds = React.useMemo(
    () => new Set(serverMembers.map((m) => m.userId)),
    [serverMembers],
  );
  const currentUserId = currentUser?.id ?? null;

  const { friendsList, privateMessagesList } = React.useMemo(() => {
    const friendIds = new Set(friends.map((f) => f.id));
    const friendsList: UserOption[] = friends
      .filter(
        (f) =>
          f.id !== currentUserId &&
          !memberIds.has(f.id),
      )
      .map((f) => ({
        id: f.id,
        name: f.name ?? "",
        email: f.email ?? "",
        avatarUrl: (f as { avatarUrl?: string | null }).avatarUrl ?? null,
      }));

    const privateMessagesList: UserOption[] = conversations
      .filter(
        (c) =>
          c.peer.id !== currentUserId &&
          !memberIds.has(c.peer.id) &&
          !friendIds.has(c.peer.id),
      )
      .map((c) => ({
        id: c.peer.id,
        name: c.peer.name ?? "",
        email: c.peer.email ?? "",
        avatarUrl: c.peer.avatarUrl ?? null,
      }));

    return { friendsList, privateMessagesList };
  }, [friends, conversations, currentUserId, memberIds]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleClose = () => {
    onClose();
    setSelectedIds(new Set());
  };

  if (!isOpen) return null;

  const isLoading = friendsLoading || convLoading;

  return (
    <div
      className={styles.backdrop}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-add-members-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 id="modal-add-members-title" className={styles.title}>
            {t("addMembers")}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label={tAuth("closeModal")}
            className={styles.closeButton}
          >
            ×
          </button>
        </div>

        <div className={styles.listWrapper}>
          {isLoading ? (
            <div className={styles.loading}>{t("loadingMembers")}</div>
          ) : (
            <>
              <div className={styles.section}>
                <div className={styles.sectionTitle}>{t("friendsSection")}</div>
                {friendsList.length === 0 ? (
                  <div className={styles.empty}>{t("noFriendsToAdd")}</div>
                ) : (
                  friendsList.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className={styles.optionRow}
                      onClick={() => toggle(u.id)}
                    >
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={selectedIds.has(u.id)}
                        onChange={() => toggle(u.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${getDisplayName(u)}`}
                      />
                      <UserAvatar
                        avatarUrl={u.avatarUrl}
                        displayName={getDisplayName(u)}
                        size="smMd"
                        className={styles.avatar}
                        aria-hidden
                      />
                      <span className={styles.optionLabel}>
                        {getDisplayName(u)}
                      </span>
                    </button>
                  ))
                )}
              </div>

              <div className={styles.section}>
                <div className={styles.sectionTitle}>{t("privateMessagesSection")}</div>
                {privateMessagesList.length === 0 ? (
                  <div className={styles.empty}>
                    {t("noUsersToAdd")}
                  </div>
                ) : (
                  privateMessagesList.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className={styles.optionRow}
                      onClick={() => toggle(u.id)}
                    >
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={selectedIds.has(u.id)}
                        onChange={() => toggle(u.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${getDisplayName(u)}`}
                      />
                      <UserAvatar
                        avatarUrl={u.avatarUrl}
                        displayName={getDisplayName(u)}
                        size="smMd"
                        className={styles.avatar}
                        aria-hidden
                      />
                      <span className={styles.optionLabel}>
                        {getDisplayName(u)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            onClick={handleClose}
            className={`${styles.button} ${styles.buttonSecondary}`}
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={selectedIds.size === 0 || addMemberMutation.isPending}
            onClick={async () => {
              try {
                for (const userId of selectedIds) {
                  await addMemberMutation.mutateAsync(userId);
                }
              } finally {
                handleClose();
              }
            }}
          >
            {addMemberMutation.isPending
              ? t("adding")
              : t("addCount", { count: selectedIds.size })}
          </button>
        </div>
      </div>
    </div>
  );
}
