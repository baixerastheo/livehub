import { Suspense } from "react";
import styles from "./styles.module.css";
import { PeoplePageClient } from "./PeoplePageClient";

export default function PeoplePage() {
  return (
    <Suspense fallback={<div className={styles.page} />}>
      <PeoplePageClient />
    </Suspense>
  );
}

