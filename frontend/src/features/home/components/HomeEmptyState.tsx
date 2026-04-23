"use client";

import { useSyncExternalStore } from "react";
import styles from "../styles/Home.module.css";
import { useAuth } from "@/src/core/store/auth/useAuth";
import { HomeAuthCallToAction } from "@/src/features/home/components/HomeAuthCallToAction";
import { HomeHero } from "@/src/features/home/components/HomeHero";

const subscribe = () => () => {};

export function HomeEmptyState() {
  const { isAuthenticated, isLoading } = useAuth();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  if (!mounted || isLoading) return <main className={styles.root} />;

  return (
    <main className={styles.root}>
      {!isAuthenticated ? <HomeAuthCallToAction /> : <HomeHero />}
    </main>
  );
}

