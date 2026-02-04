import styles from "../styles/Home.module.css";

export function HomeHero() {
  return (
    <section className={styles.hero}>
      <h1 className={styles.heroTitle}>Welcome to LiveHub</h1>
      <p className={styles.heroSubtitle}>
        Your workspace: servers, channels and conversations in real time.
      </p>
    </section>
  );
}

