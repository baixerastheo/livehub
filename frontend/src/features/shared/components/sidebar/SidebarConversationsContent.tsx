"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import styles from "../../styles/sidebar/SidebarConversations.module.css";
import { useAuth } from "@/src/core/store/auth/useAuth";
import { usePrivateConversationsQuery } from "@/src/features/messages/privateMessage.hooks";
import { useUserQuery } from "@/src/features/users/users.hooks";
import { ParticlesBackground } from "@/src/features/shared/components/particles/ParticlesBackground";
import { UserAvatar } from "@/src/features/shared/components/avatar/UserAvatar";
import { getDisplayName } from "@/src/features/shared/lib/displayName";
import { useSidebarContext } from "./SidebarContext";
import { SidebarEmptyState, SidebarStartButton } from "./SidebarParts";

export function SidebarConversationsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { onClose } = useSidebarContext();

  const activePeerId = pathname === "/messages" ? searchParams.get("with") : null;
  const activePeerNameFromUrl =
    pathname === "/messages" ? searchParams.get("name") : null;
  const decodedActivePeerName = activePeerNameFromUrl
    ? decodeURIComponent(activePeerNameFromUrl)
    : "";

  const currentPeerFromUrl =
    activePeerId
      ? {
          peer: {
            id: activePeerId,
            name: decodedActivePeerName || "User",
            email: "",
            avatarUrl: undefined as string | null | undefined,
          },
        }
      : null;

  const { data: conversations } = usePrivateConversationsQuery(
    isAuthenticated,
  );
  const { data: activePeerUser } = useUserQuery(activePeerId ?? undefined);

  const conversationItems = React.useMemo(() => {
    const fromApi = conversations ?? [];
    const apiIds = new Set(fromApi.map((c) => c.peer.id));
    if (currentPeerFromUrl && !apiIds.has(currentPeerFromUrl.peer.id)) {
      return [currentPeerFromUrl, ...fromApi];
    }
    if (fromApi.length > 0) return fromApi;
    if (currentPeerFromUrl) return [currentPeerFromUrl];
    return [];
  }, [conversations, currentPeerFromUrl]);

  const [hoveredPeerId, setHoveredPeerId] = React.useState<string | null>(null);
  const showList = conversationItems.length > 0;

  if (showList) {
    return (
      <ul className={styles.list} aria-label="Conversations">
        {conversationItems.map(({ peer }) => {
          const name = getDisplayName(peer);
          const isActive = activePeerId === peer.id;
          const isHovered = hoveredPeerId === peer.id;
          const params = new URLSearchParams({ with: peer.id });
          if (name) params.set("name", name);
          const avatarUrl =
            peer.id === activePeerId
              ? (activePeerUser?.avatarUrl ?? peer.avatarUrl)
              : peer.avatarUrl;
          return (
            <li key={peer.id}>
              <div
                className={styles.rowWrapper}
                onMouseEnter={() => setHoveredPeerId(peer.id)}
                onMouseLeave={() => setHoveredPeerId(null)}
              >
                {isHovered && (
                  <div className={styles.particlesLayer} aria-hidden="true">
                    <ParticlesBackground
                      tone="blue"
                      maxParticles={40}
                      intensity="subtle"
                      disablePointerRepel
                    />
                  </div>
                )}
                <Link
                  href={`/messages?${params.toString()}`}
                  className={`${styles.row} ${isActive ? styles.rowActive : ""}`}
                  onClick={onClose}
                  aria-current={isActive ? "true" : undefined}
                >
                  <span className={styles.avatar}>
                    <UserAvatar
                      avatarUrl={avatarUrl}
                      displayName={name}
                      size="md"
                      className={styles.avatarInner}
                      aria-hidden
                    />
                  </span>
                  <span className={styles.name}>{name}</span>
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className={styles.emptySection}>
      <SidebarEmptyState
        title="No conversation"
        subtitle="Start a new conversation to see it here."
      />
      <SidebarStartButton
        onClick={() => {
          if (isAuthenticated) {
            onClose();
            router.push("/people");
          }
        }}
      >
        Start conversation
      </SidebarStartButton>
    </div>
  );
}
