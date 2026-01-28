import Image from "next/image";
import styles from "../../styles/navbar/NavbarLogo.module.css";

type NavbarLogoProps = Record<string, never>;

export function NavbarLogo({}: NavbarLogoProps) {
  return (
    <div className={styles.logoContainer}>
      <Image
        src="/brand/Livehub_logo.png"
        alt="LiveHub logo"
        width={300}
        height={60}
        className={styles.logoImage}
        priority
      />
    </div>
  );
}

