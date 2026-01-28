import styles from "../styles/Home.module.css";

export function HomeHero() {
  return (
    <section className={styles.hero}>
      <h1 className={styles.heroTitle}>Welcome to LiveHub</h1>
      <p className={styles.heroSubtitle}>
        You&apos;re not logged in yet. Connect to your workspace to see your
        servers, channels and conversations in real time.
      </p>
    </section>
  );
}

