import { Suspense } from "react";
import { ChannelMessagesScreen } from "@/src/features/messages/components/ChannelMessagesScreen";

export default function ChannelPage() {
  return (
    <Suspense fallback={<div />}>
      <ChannelMessagesScreen />
    </Suspense>
  );
}
