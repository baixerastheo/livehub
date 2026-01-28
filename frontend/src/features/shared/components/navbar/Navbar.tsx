import styles from "../../styles/navbar/Navbar.module.css";
import { NavbarLogo } from "@/src/features/shared/components/navbar/NavbarLogo";
import { NavbarSearch } from "@/src/features/shared/components/navbar/NavbarSearch";
import { BiArrowFromLeft } from "react-icons/bi";
import { useAppStore } from "@/src/core/store/appStore";

export function Navbar() {
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);

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
      </div>
    </header>
  );
}


