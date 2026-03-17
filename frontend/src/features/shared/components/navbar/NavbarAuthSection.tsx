"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import styles from "../../styles/navbar/Navbar.module.css";
import { useAppStore } from "@/src/core/store/appStore";
import { useAuth } from "@/src/core/store/auth/useAuth";
import { useLogoutMutation } from "@/src/features/auth/auth.hooks";
import { useToast } from "@/src/core/store/toast/useToastStore";
import { CurrentUserAvatar } from "../avatar/CurrentUserAvatar";
import { NavbarModalProfile } from "./NavbarModalProfile";

export function NavbarAuthSection() {
  const router = useRouter();
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const { user, isAuthenticated, isLoading } = useAuth();
  const logoutMutation = useLogoutMutation();
  const { toast } = useToast();

  const isOpen = useAppStore((state) => state.profileMenu.isOpen);
  const closeProfileMenu = useAppStore((state) => state.closeProfileMenu);
  const toggleProfileMenu = useAppStore((state) => state.toggleProfileMenu);
  const openAccountModal = useAppStore((state) => state.openAccountModal);

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const username = user?.name?.trim() || user?.email?.trim() || "Logged in";

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

  const handleLogout = () => {
    closeProfileMenu();
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast.info(t("loggedOutSuccess"));
        router.push("/");
        router.refresh();
      },
      onError: (err) => {
        toast.error(err.message || t("logoutFailed"));
      },
    });
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.authArea} ref={wrapperRef}>
      <div className={styles.profileWrapper}>
        <button
          type="button"
          className={styles.profileButton}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label={tNav("openProfileMenu")}
          onClick={toggleProfileMenu}
        >
          <span className={styles.profileAvatar} aria-hidden="true">
            <CurrentUserAvatar size="sm" />
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
            onLogout={handleLogout}
          />
        ) : null}
      </div>
    </div>
  );
}
