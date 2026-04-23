"use client";

import Image from "next/image";
import styles from "../../styles/avatar/UserAvatar.module.css";

const DEFAULT_AVATAR_SRC = "/icons/avatar-default.svg";

export type UserAvatarSize = "sm" | "smMd" | "md" | "lg";

type UserAvatarProps = {
  avatarUrl?: string | null;
  displayName?: string;
  size?: UserAvatarSize;
  className?: string;
  "aria-hidden"?: boolean;
};

export function UserAvatar({
  avatarUrl,
  displayName,
  size = "md",
  className,
  "aria-hidden": ariaHidden,
}: UserAvatarProps) {
  const initial = displayName?.trim()
    ? displayName.trim().slice(0, 1).toUpperCase()
    : "?";

  return (
    <span
      className={`${styles.root} ${styles[size]} ${className ?? ""}`.trim()}
      aria-hidden={ariaHidden}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className={styles.img}
        />
      ) : displayName ? (
        <span className={styles.initial}>{initial}</span>
      ) : (
        <Image
          src={DEFAULT_AVATAR_SRC}
          alt=""
          fill
          className={styles.img}
        />
      )}
    </span>
  );
}
