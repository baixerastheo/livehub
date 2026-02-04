"use client";

import React from "react";
import { useUsersQuery } from "@/src/features/users/users.hooks";
import type { UtilisateurDto } from "@/src/features/users/users.types";
import { useAuth } from "@/src/core/store/auth/useAuth";
import { useAuthModal } from "@/src/features/modalAuth/store/useAuthModal";
import { UserDirectoryView } from "@/src/features/users/components/UserDirectoryView";

type UserDirectoryProps = {
  onAddFriend?: (user: UtilisateurDto) => void | Promise<void>;
  onMessage?: (user: UtilisateurDto) => void | Promise<void>;
  hiddenUserIds?: string[];
  prioritizeUserIds?: string[];
  pendingAddFriendUserIds?: string[];
};

function normalize(s: string): string {
  return s.trim();
}

function getUserSortLabel(user: UtilisateurDto): string {
  return (user.name ?? "").trim().toLowerCase();
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

  const openLogin = useAuthModal((state) => state.openLogin);
  const { user: authUser, isAuthenticated } = useAuth();
  const authUserId = authUser?.id ?? null;

  const usersQuery = useUsersQuery({ q });

  const users = React.useMemo(() => {
    const allUsers = usersQuery.data ?? [];
    const hiddenIdSet = new Set(hiddenUserIds ?? []);
    const prioritizedIdSet = new Set(prioritizeUserIds ?? []);

    const isMe = (user: UtilisateurDto) =>
      authUserId != null && user.id === authUserId;
    const isHidden = (user: UtilisateurDto) => hiddenIdSet.has(user.id);
    const isPrioritized = (user: UtilisateurDto) =>
      prioritizedIdSet.has(user.id);

    const visibleUsers = allUsers.filter(
      (user) => !isMe(user) && !isHidden(user),
    );

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

  React.useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current)
        window.clearTimeout(noticeTimeoutRef.current);
    };
  }, []);

  const showNotice = React.useCallback((message: string) => {
    setNotice(message);
    if (noticeTimeoutRef.current) window.clearTimeout(noticeTimeoutRef.current);
    noticeTimeoutRef.current = window.setTimeout(() => setNotice(null), 2500);
  }, []);

  const handleAddFriend = async (user: UtilisateurDto) => {
    if (!isAuthenticated) return openLogin();
    if (onAddFriend) return onAddFriend(user);
    showNotice("Friends: bientôt disponible.");
  };

  const handleMessage = async (user: UtilisateurDto) => {
    if (!isAuthenticated) return openLogin();
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
