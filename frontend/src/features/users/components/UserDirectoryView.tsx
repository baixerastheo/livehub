"use client";

import styles from "../styles/UserDirectory.module.css";
import type { UtilisateurDto } from "@/src/features/users/users.types";
import { UserDirectoryRow } from "@/src/features/users/components/UserDirectoryRow";

type UserDirectoryViewProps = {
  q: string;
  onQueryChange: (q: string) => void;
  notice?: string | null;
  users: UtilisateurDto[];
  isLoading: boolean;
  isError: boolean;
  onAddFriend: (user: UtilisateurDto) => void;
  onMessage: (user: UtilisateurDto) => void;
  pendingAddFriendUserIds?: string[];
};

export function UserDirectoryView({
  q,
  onQueryChange,
  notice,
  users,
  isLoading,
  isError,
  onAddFriend,
  onMessage,
  pendingAddFriendUserIds,
}: UserDirectoryViewProps) {
  const pending = new Set(pendingAddFriendUserIds ?? []);

  return (
    <section className={styles.container} aria-label="User directory">
      <header className={styles.header}>
        <div>
          <div className={styles.title}>People</div>
          <div className={styles.subtle}>Search users and start a conversation.</div>
        </div>
        <div className={styles.searchWrap}>
          <input
            id="user-search"
            className={styles.searchInput}
            type="search"
            placeholder="Search by username…"
            value={q}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>
      </header>

      {notice && <div className={styles.notice}>{notice}</div>}

      {isLoading && <div className={styles.state}>Loading users…</div>}

      {isError && (
        <div className={styles.stateError}>
          Failed to load users. Please try again.
        </div>
      )}

      {!isLoading && !isError && users.length === 0 && (
        <div className={styles.state}>No users found.</div>
      )}

      {!isLoading && !isError && users.length > 0 && (
        <ul className={styles.list}>
          {users.map((user) => (
            <UserDirectoryRow
              key={user.id}
              user={user}
              onAddFriend={onAddFriend}
              onMessage={onMessage}
              isAddFriendPending={pending.has(user.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

