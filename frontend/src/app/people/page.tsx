import { Suspense } from "react";
import { PeoplePageClient } from "./PeoplePageClient";

export default function PeoplePage() {
  return (
    <Suspense fallback={<div />}>
      <PeoplePageClient />
    </Suspense>
  );
}
