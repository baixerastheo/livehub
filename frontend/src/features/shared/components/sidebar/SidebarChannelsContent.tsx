"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiTrash2 } from "react-icons/fi";
import styles from "../../styles/sidebar/SidebarConversations.module.css";
import channelStyles from "../../styles/sidebar/SidebarChannels.module.css";
import { useAppStore } from "@/src/core/store/appStore";
import {
  useChannelsByServerQuery,
  useDeleteChannelMutation,
} from "@/src/features/channel/channel.hooks";
import { useUserServersQuery } from "@/src/features/server/server.hooks";
import type { ServerRole } from "@/src/features/server/server.types";
import { SidebarEmptyState } from "./SidebarParts";

const ROLES_CAN_DELETE_CHANNEL: ServerRole[] = ["PROPRIETAIRE", "ADMINISTRATEUR"];

export function SidebarChannelsContent() {
  const pathname = usePathname();
  const router = useRouter();
  const selectedServerId = useAppStore((state) => state.selectedServerId);
  const { data: channels, isLoading, error } =
    useChannelsByServerQuery(selectedServerId);
  const { data: userServers } = useUserServersQuery();
  const deleteChannelMutation = useDeleteChannelMutation(selectedServerId);

  const selectedServer = React.useMemo(
    () => userServers?.find((u) => u.server.id === selectedServerId)?.server,
    [userServers, selectedServerId],
  );
  const currentUserRole = React.useMemo(
    () => userServers?.find((u) => u.server.id === selectedServerId)?.role,
    [userServers, selectedServerId],
  );
  const canDeleteChannels =
    currentUserRole != null &&
    ROLES_CAN_DELETE_CHANNEL.includes(currentUserRole);

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

  const handleDeleteChannel = async (
    e: React.MouseEvent,
    channelId: number,
    channelName: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      !canDeleteChannels ||
      !window.confirm(
        `Supprimer le canal « ${channelName} » ? Cette action est irréversible.`,
      )
    ) {
      return;
    }
    try {
      await deleteChannelMutation.mutateAsync(channelId);
      if (pathname === `/channels/${channelId}` && channels && channels.length > 1) {
        const remaining = channels.filter((c) => c.id !== channelId);
        router.push(`/channels/${remaining[0].id}`);
      } else if (pathname === `/channels/${channelId}`) {
        router.push(selectedServerId != null ? `/servers/${selectedServerId}` : "/");
      }
    } catch {
      // Error can be shown via toast if needed
    }
  };

  return (
    <div className={channelStyles.wrapper}>
      <ul className={styles.list} aria-label="Channels">
        {channels.map((channel) => {
          const href = `/channels/${channel.id}`;
          const isActive = pathname === href;
          return (
            <li key={channel.id}>
              <div className={styles.rowWrapper}>
                <div
                  className={`${styles.row} ${styles.rowChannel} ${isActive ? styles.rowActive : ""}`}
                  style={{ fontWeight: 500 }}
                >
                  <Link
                    href={href}
                    className={channelStyles.channelLink}
                  >
                    <span className={`${styles.avatar} ${styles.avatarChannel}`} aria-hidden>
                      #
                    </span>
                    <span className={styles.name}>{channel.name}</span>
                  </Link>
                  {canDeleteChannels && (
                    <button
                      type="button"
                      className={channelStyles.deleteChannelButton}
                      onClick={(e) => handleDeleteChannel(e, channel.id, channel.name)}
                      aria-label={`Supprimer le canal ${channel.name}`}
                      title="Supprimer le canal"
                    >
                      <FiTrash2 size={14} aria-hidden />
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
