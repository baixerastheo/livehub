 "use client";

import styles from "../styles/FriendListSection.module.css";

export function FriendListSection() {
  return (
    <div className={styles.sectionStack}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardTitle}>Friends</div>
            <div className={styles.cardSubtle}>
              Simple placeholder section, easy to expand later.
            </div>
          </div>
        </div>

        <div className={styles.emptyBlock}>
          <div className={styles.emptyTitle}>No friends yet</div>
          <div className={styles.cardSubtle}>
            Add a search, requests, or an invite link later.
          </div>
        </div>
      </div>
    </div>
  );
}

