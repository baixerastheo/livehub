"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "../../styles/navbar/Navbar.module.css";
import { useAppStore } from "@/src/core/store/appStore";
import { useAuthStore } from "@/src/core/store/auth/useAuthStore";
import { useLogoutMutation } from "@/src/features/auth/auth.hooks";
import { NavbarModalProfile } from "./NavbarModalProfile";

export function NavbarAuthSection() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogoutMutation();
  const isOpen = useAppStore((state) => state.profileMenu.isOpen);
  const closeProfileMenu = useAppStore((state) => state.closeProfileMenu);
  const toggleProfileMenu = useAppStore((state) => state.toggleProfileMenu);
  const openAccountModal = useAppStore((state) => state.openAccountModal);

  const isAuthenticated = status === "authenticated";

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const username =
    user?.username?.trim() || user?.email?.trim() || "Logged in";

  useEffect(() => {
    if (!isOpen) return;

    const onMouseDown = (e: MouseEvent) => {
      const el = wrapperRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        closeProfileMenu();
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [closeProfileMenu, isOpen]);

  useEffect(() => {
    if (!isAuthenticated) closeProfileMenu();
  }, [closeProfileMenu, isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <div className={styles.authArea} ref={wrapperRef}>
      <div className={styles.profileWrapper}>
        <button
          type="button"
          className={styles.profileButton}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label="Open profile menu"
          onClick={toggleProfileMenu}
        >
          <span className={styles.profileAvatar} aria-hidden="true">
            <Image
              src="/icons/avatar-default.svg"
              alt=""
              width={28}
              height={28}
              className={styles.profileAvatarImage}
            />
          </span>
        </button>
        {isOpen ? (
          <NavbarModalProfile
            username={username}
            onMyAccount={() => {
              closeProfileMenu();
              openAccountModal("profile");
            }}
            onMyFriends={() => {
              closeProfileMenu();
              router.push("/people?tab=friends");
            }}
            onLogout={() => {
              closeProfileMenu();
              logoutMutation.mutate();
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

