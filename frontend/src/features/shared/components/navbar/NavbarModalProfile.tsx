"use client";

import { useTranslations } from "next-intl";
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
  const tNav = useTranslations("nav");
  const tAuth = useTranslations("auth");

  return (
    <div className={styles.profileDropdown} role="menu" aria-label={tNav("profileMenu")}>
      <div className={styles.profileHeader}>
        <p className={styles.profileUsername}>{username}</p>
        <div className={styles.profileSubtle}>{tNav("account")}</div>
      </div>
      <div className={styles.dropdownDivider} />
      <div className={styles.dropdownActions}>
        <button type="button" className={styles.dropdownButton} onClick={onMyAccount}>
          {tNav("myAccount")}
        </button>
        <button type="button" className={styles.dropdownButton} onClick={onMyFriends}>
          {tNav("friends")}
        </button>
        <div className={styles.dropdownDivider} />
        <button
          type="button"
          className={`${styles.dropdownButton} ${styles.dropdownButtonDanger}`}
          onClick={onLogout}
        >
          {tAuth("logout")}
        </button>
      </div>
    </div>
  );
}

