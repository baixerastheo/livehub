import styles from "../../styles/navbar/Navbar.module.css";
import { NavbarLogo } from "@/src/features/shared/components/navbar/NavbarLogo";
import { NavbarSearch } from "@/src/features/shared/components/navbar/NavbarSearch";
import { BiArrowFromLeft } from "react-icons/bi";
import { useAppStore } from "@/src/core/store/appStore";
import { useAuthStore } from "@/src/core/store/auth/useAuthStore";
import { useLogoutMutation } from "@/src/features/auth/api/useLogoutMutation";

export function Navbar() {
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const openAuthModal = useAppStore((state) => state.openAuthModal);
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogoutMutation();

  const isAuthenticated = status === "authenticated";

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.menuButton}
          aria-label="Toggle conversation list"
          onClick={toggleSidebar}
        >
          <span aria-hidden="true">
            <BiArrowFromLeft size={22} />
          </span>
        </button>
        <NavbarLogo />
      </div>
      <div className={styles.right}>
        <NavbarSearch />
        {isAuthenticated ? (
          <div className={styles.authArea}>
            <span className={styles.userInfo}>
              {user?.username ?? user?.email ?? "Logged in"}
            </span>
            <button
              type="button"
              onClick={() => logoutMutation.mutate()}
              className={styles.authButton}
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal("login")}
            className={styles.authButton}
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}

