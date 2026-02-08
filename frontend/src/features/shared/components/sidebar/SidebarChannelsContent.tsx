"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "../../styles/sidebar/SidebarConversations.module.css";
import channelStyles from "../../styles/sidebar/SidebarChannels.module.css";
import { useAppStore } from "@/src/core/store/appStore";
import { useChannelsByServerQuery } from "@/src/features/channel/channel.hooks";
import { useUserServersQuery } from "@/src/features/server/server.hooks";
import { SidebarEmptyState } from "./SidebarParts";

export function SidebarChannelsContent() {
  const pathname = usePathname();
  const selectedServerId = useAppStore((state) => state.selectedServerId);
  const { data: channels, isLoading, error } =
    useChannelsByServerQuery(selectedServerId);
  const { data: userServers } = useUserServersQuery();

  const selectedServer = React.useMemo(
    () => userServers?.find((u) => u.server.id === selectedServerId)?.server,
    [userServers, selectedServerId],
  );

  if (selectedServerId === null) {
    return (
      <SidebarEmptyState
        title="Select a server"
        subtitle="Click a server in the rail to see its channels."
      />
    );
  }

  if (error) {
    return (
      <SidebarEmptyState
        title="Cannot load channels"
        subtitle="Try again later or select another server."
      />
    );
  }

  if (isLoading || channels === undefined) {
    return (
      <SidebarEmptyState
        title={selectedServer?.name ?? "Server"}
        subtitle="Loading channels…"
      />
    );
  }

  if (channels.length === 0) {
    return (
      <div className={channelStyles.wrapper}>
        <SidebarEmptyState
          title={selectedServer?.name ?? "Server"}
          subtitle="No channels yet. The default channel will appear here."
        />
      </div>
    );
  }

  return (
    <div className={channelStyles.wrapper}>
      <ul className={styles.list} aria-label="Channels">
        {channels.map((channel) => {
          const href = `/channels/${channel.id}`;
          const isActive = pathname === href;
          return (
            <li key={channel.id}>
              <div className={styles.rowWrapper}>
                <Link
                  href={href}
                  className={`${styles.row} ${styles.rowChannel} ${isActive ? styles.rowActive : ""}`}
                  style={{ fontWeight: 500 }}
                >
                  <span className={`${styles.avatar} ${styles.avatarChannel}`} aria-hidden>
                    #
                  </span>
                  <span className={styles.name}>{channel.name}</span>
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
