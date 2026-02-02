"use client";

import React from "react";
import { UserDirectory } from "@/src/features/users/components/UserDirectory";
import styles from "./styles.module.css";
import { SocialMenu } from "@/src/features/friends/components/SocialMenu";
import { useSearchParams } from "next/navigation";
import { FriendsPanel } from "@/src/features/friends/components/FriendsPanel";
import { RequestsPanel } from "@/src/features/friends/components/RequestsPanel";
import {
  useSendFriendRequestMutation,
} from "@/src/features/friends/friends.hooks";
import { useFriendRelationships } from "@/src/features/friends/hooks/useFriendRelationships";
import { useToastStore } from "@/src/core/store/toast/useToastStore";

type PeopleTab = "users" | "requests" | "friends";

function normalizeTab(value: string | null): PeopleTab {
  if (value === "friends") return "friends";
  if (value === "requests") return "requests";
  return "users";
}

export default function PeoplePage() {
  const sp = useSearchParams();
  const tab = normalizeTab(sp?.get("tab") ?? null);
  const sendRequest = useSendFriendRequestMutation();
  const { friendIds, outgoingRequestUserIds } = useFriendRelationships();
  const pushToast = useToastStore((s) => s.push);
  const lastToastedErrorRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!sendRequest.isError) return;

    const message =
      sendRequest.error instanceof Error
        ? sendRequest.error.message
        : "Failed to send request.";

    if (lastToastedErrorRef.current === message) return;
    lastToastedErrorRef.current = message;

    pushToast({ type: "error", message });
  }, [pushToast, sendRequest.error, sendRequest.isError]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <SocialMenu />
      </div>
      {tab === "users" ? (
        <>
          <UserDirectory
            onAddFriend={(u) => sendRequest.mutate(u.id)}
            hiddenUserIds={friendIds}
            pendingAddFriendUserIds={outgoingRequestUserIds}
            prioritizeUserIds={outgoingRequestUserIds}
          />
        </>
      ) : null}
      {tab === "friends" ? <FriendsPanel /> : null}
      {tab === "requests" ? <RequestsPanel /> : null}
    </div>
  );
}

