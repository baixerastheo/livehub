import styles from "../../styles/navbar/Navbar.module.css";
import { NavbarLogo } from "@/src/features/shared/components/navbar/NavbarLogo";
import { NavbarSearch } from "@/src/features/shared/components/navbar/NavbarSearch";

export function Navbar() {
  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <NavbarLogo />
      </div>
      <div className={styles.right}>
        <NavbarSearch />
      </div>
    </header>
  );
}

