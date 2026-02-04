 "use client";

import React from "react";
import { useUsersQuery } from "@/src/features/users/users.hooks";
import type { UtilisateurDto } from "@/src/features/users/users.types";
import { useAuthStore } from "@/src/core/store/auth/useAuthStore";
import { useAppStore } from "@/src/core/store/appStore";
import { UserDirectoryView } from "@/src/features/users/components/UserDirectoryView";

type UserDirectoryProps = {
  /**
   * Optional override for "Add friend" action.
   * Useful to reuse the directory UI from other places (ex: Friends modal).
   */
  onAddFriend?: (user: UtilisateurDto) => void | Promise<void>;
  /**
   * Optional override for "Message" action.
   */
  onMessage?: (user: UtilisateurDto) => void | Promise<void>;
  /**
   * User IDs to hide from the directory (ex: already friends).p
   */
  hiddenUserIds?: number[];
  /**
   * User IDs that should appear first (ex: outgoing friend requests).
   */
  prioritizeUserIds?: number[];
  /**
   * User IDs for which the "Add friend" action should show as pending/disabled.
   */
  pendingAddFriendUserIds?: number[];
};

function normalize(s: string): string {
  return s.trim();
}

function getUserSortLabel(user: UtilisateurDto): string {
  return (user.nomUtilisateur ?? "").trim().toLowerCase();
}

export function UserDirectory({
  onAddFriend,
  onMessage,
  hiddenUserIds,
  prioritizeUserIds,
  pendingAddFriendUserIds,
}: UserDirectoryProps) {
  const [q, setQ] = React.useState("");
  const [notice, setNotice] = React.useState<string | null>(null);
  const noticeTimeoutRef = React.useRef<number | null>(null);

  const openAuthModal = useAppStore((state) => state.openAuthModal);
  const authStatus = useAuthStore((state) => state.status);
  const authUserId = useAuthStore((state) => state.user?.id ?? null);

  const usersQuery = useUsersQuery({ q });

  const users = React.useMemo(() => {
    const allUsers = usersQuery.data ?? [];

    const hiddenIdSet = new Set(hiddenUserIds ?? []);
    const prioritizedIdSet = new Set(prioritizeUserIds ?? []);

    const isMe = (user: UtilisateurDto) => authUserId != null && user.id === authUserId;
    const isHidden = (user: UtilisateurDto) => hiddenIdSet.has(user.id);
    const isPrioritized = (user: UtilisateurDto) => prioritizedIdSet.has(user.id);

    const visibleUsers = allUsers.filter((user) => !isMe(user) && !isHidden(user));

    const prioritizedUsers = visibleUsers.filter(isPrioritized);
    const regularUsers = visibleUsers.filter((user) => !isPrioritized(user));

    const byUsername = (a: UtilisateurDto, b: UtilisateurDto) =>
      getUserSortLabel(a).localeCompare(getUserSortLabel(b), undefined, {
        sensitivity: "base",
      });

    prioritizedUsers.sort(byUsername);
    regularUsers.sort(byUsername);

    return [...prioritizedUsers, ...regularUsers];
  }, [authUserId, hiddenUserIds, prioritizeUserIds, usersQuery.data]);

  const isAuthed = authStatus === "authenticated";

  React.useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current) window.clearTimeout(noticeTimeoutRef.current);
    };
  }, []);

  const showNotice = React.useCallback((message: string) => {
    setNotice(message);
    if (noticeTimeoutRef.current) window.clearTimeout(noticeTimeoutRef.current);
    noticeTimeoutRef.current = window.setTimeout(() => setNotice(null), 2500);
  }, []);

  const handleAddFriend = async (user: UtilisateurDto) => {
    if (!isAuthed) return openAuthModal("login");
    if (onAddFriend) return onAddFriend(user);
    showNotice("Friends: bientôt disponible.");
  };

  const handleMessage = async (user: UtilisateurDto) => {
    if (!isAuthed) return openAuthModal("login");
    if (onMessage) return onMessage(user);
    showNotice("DM: bientôt disponible.");
  };

  return (
    <UserDirectoryView
      q={q}
      onQueryChange={(next) => setQ(normalize(next))}
      notice={notice}
      users={users}
      isLoading={usersQuery.isLoading}
      isError={usersQuery.isError}
      onAddFriend={handleAddFriend}
      onMessage={handleMessage}
      pendingAddFriendUserIds={pendingAddFriendUserIds}
    />
  );
}

