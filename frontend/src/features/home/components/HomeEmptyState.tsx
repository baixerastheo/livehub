"use client";

import styles from "../styles/Home.module.css";
import { useAuth } from "@/src/core/store/auth/useAuth";
import { HomeAuthCallToAction } from "@/src/features/home/components/HomeAuthCallToAction";
import { HomeHero } from "@/src/features/home/components/HomeHero";

export function HomeEmptyState() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <main className={styles.root}>
      {!isAuthenticated && !isLoading ? (
        <HomeAuthCallToAction />
      ) : (
        <HomeHero />
      )}
    </main>
  );
}

