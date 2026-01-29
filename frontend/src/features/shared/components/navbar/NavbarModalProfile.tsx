"use client";

import styles from "../../styles/navbar/Navbar.module.css";

type NavbarModalProfileProps = {
  username: string;
  onMyAccount: () => void;
  onMyFriends: () => void;
  onLogout: () => void;
};

export function NavbarModalProfile({
  username,
  onMyAccount,
  onMyFriends,
  onLogout,
}: NavbarModalProfileProps) {
  return (
    <div className={styles.profileDropdown} role="menu" aria-label="Profile menu">
      <div className={styles.profileHeader}>
        <p className={styles.profileUsername}>{username || "Logged in"}</p>
        <div className={styles.profileSubtle}>Account</div>
      </div>
      <div className={styles.dropdownDivider} />
      <div className={styles.dropdownActions}>
        <button type="button" className={styles.dropdownButton} onClick={onMyAccount}>
          My Account
        </button>
        <button type="button" className={styles.dropdownButton} onClick={onMyFriends}>
          My Friend
        </button>
        <div className={styles.dropdownDivider} />
        <button
          type="button"
          className={`${styles.dropdownButton} ${styles.dropdownButtonDanger}`}
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

