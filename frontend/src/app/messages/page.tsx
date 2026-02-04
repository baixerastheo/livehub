import { Suspense } from "react";
import { MessagesScreen } from "@/src/features/messages/components/MessagesScreen";

export default function MessagesPage() {
  return (
    <Suspense fallback={<div />}>
      <MessagesScreen />
    </Suspense>
  );
}

