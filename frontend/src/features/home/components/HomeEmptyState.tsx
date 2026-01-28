import styles from "../styles/Home.module.css";
import { HomeHero } from "@/src/features/home/components/HomeHero";
import { HomeAuthCallToAction } from "@/src/features/home/components/HomeAuthCallToAction";

export function HomeEmptyState() {
  return (
    <main className={styles.root}>
      <HomeHero />
      <HomeAuthCallToAction />
    </main>
  );
}

