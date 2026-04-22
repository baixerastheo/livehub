import Image from "next/image";
import styles from "../../styles/navbar/NavbarLogo.module.css";

type NavbarLogoProps = Record<string, never>;

export function NavbarLogo({}: NavbarLogoProps) {
  return (
    <div className={styles.logoContainer}>
      <Image
        src="/brand/livehub_icon.svg"
        alt="LiveHub logo"
        width={40}
        height={40}
        className={styles.logoImage}
        priority
      />
    </div>
  );
}

