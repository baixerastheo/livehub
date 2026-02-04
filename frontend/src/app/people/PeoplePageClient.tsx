"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { SocialMenu, type SocialTab } from "@/src/features/friends/components/SocialMenu";
import { UserDirectory } from "@/src/features/users/components/UserDirectory";
import { FriendsPanel } from "@/src/features/friends/components/FriendsPanel";
import { RequestsPanel } from "@/src/features/friends/components/RequestsPanel";
import { useFriendRelationships } from "@/src/features/friends/hooks/useFriendRelationships";
import { useSendFriendRequestMutation } from "@/src/features/friends/friends.hooks";
import { useToast } from "@/src/core/store/toast/useToastStore";
import type { UtilisateurDto } from "@/src/features/users/users.types";
import styles from "./people.module.css";

const TABS: SocialTab[] = ["users", "friends", "requests"];

function parseTab(value: string | null): SocialTab {
  if (value && TABS.includes(value as SocialTab)) return value as SocialTab;
  return "users";
}

export function PeoplePageClient() {
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));
  const { toast } = useToast();
  const sendRequest = useSendFriendRequestMutation();

  const {
    friendIds,
    outgoingRequestUserIds,
  } = useFriendRelationships();

  const handleAddFriend = React.useCallback(
    async (user: UtilisateurDto) => {
      try {
        await sendRequest.mutateAsync(user.id);
        toast.success("Demande d'ami envoyée.");
      } catch {
        toast.error("Impossible d'envoyer la demande.");
      }
    },
    [sendRequest, toast],
  );

  return (
    <main className={styles.page}>
      <SocialMenu active={tab} />
      <div className={styles.content}>
        {tab === "users" && (
          <UserDirectory
            hiddenUserIds={friendIds}
            prioritizeUserIds={outgoingRequestUserIds}
            pendingAddFriendUserIds={outgoingRequestUserIds}
            onAddFriend={handleAddFriend}
          />
        )}
        {tab === "friends" && <FriendsPanel />}
        {tab === "requests" && <RequestsPanel />}
      </div>
    </main>
  );
}
