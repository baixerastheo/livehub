import styles from "../../styles/navbar/Navbar.module.css";
import { NavbarLogo } from "@/src/features/shared/components/navbar/NavbarLogo";
import { NavbarSearch } from "@/src/features/shared/components/navbar/NavbarSearch";
import { BiArrowFromLeft } from "react-icons/bi";

type NavbarProps = {
  onToggleSidebar?: () => void;
};

export function Navbar({ onToggleSidebar }: NavbarProps) {
  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.menuButton}
          aria-label="Afficher/masquer la liste des conversations"
          onClick={onToggleSidebar}
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


