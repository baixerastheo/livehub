"use client";

import React from "react";
import { FiUsers, FiPlus } from "react-icons/fi";
import rootStyles from "../../styles/sidebar/SidebarRoot.module.css";
import channelStyles from "../../styles/sidebar/SidebarChannels.module.css";
import headerStyles from "../../styles/sidebar/SidebarHeader.module.css";
import { useAppStore } from "@/src/core/store/appStore";
import { useUserServersQuery } from "@/src/features/server/server.hooks";
import { ModalAddMembers } from "@/src/features/server/components/modalAddMembers";
import { ModalAddChannel } from "@/src/features/server/components/modalAddChannel";
import { ServerHeaderMenu } from "@/src/features/server/components/ServerHeaderMenu";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarChannelsContent } from "./SidebarChannelsContent";

export function SidebarTeamsSection() {
  const selectedServerId = useAppStore((state) => state.selectedServerId);
  const [isAddMembersOpen, setIsAddMembersOpen] = React.useState(false);
  const [isAddChannelOpen, setIsAddChannelOpen] = React.useState(false);
  const { data: userServers } = useUserServersQuery();

  const selectedMembership =
    selectedServerId !== null
      ? userServers?.find((u) => u.server.id === selectedServerId)
      : undefined;
  const headerTitle =
    selectedMembership?.server.name ?? "Servers";

  return (
    <>
      <SidebarHeader>
        <div className={headerStyles.headerRow}>
          <span className={headerStyles.headerTitle}>{headerTitle}</span>
          {selectedServerId !== null && selectedMembership && (
            <ServerHeaderMenu
              serverId={selectedServerId}
              serverName={selectedMembership.server.name}
              currentUserRole={selectedMembership.role}
            />
          )}
        </div>
      </SidebarHeader>
      {selectedServerId !== null && (
        <div className={channelStyles.footer}>
          <button
            type="button"
            className={channelStyles.actionButton}
            aria-label="More members"
            onClick={() => setIsAddMembersOpen(true)}
          >
            <FiUsers size={14} aria-hidden className={channelStyles.actionIcon} />
            More members
          </button>
          <button
            type="button"
            className={channelStyles.actionButton}
            aria-label="Add a channel"
            onClick={() => setIsAddChannelOpen(true)}
          >
            <FiPlus size={14} aria-hidden className={channelStyles.actionIcon} />
            Add a channel
          </button>
        </div>
      )}
      <div className={rootStyles.sidebarContent}>
        <div className={rootStyles.sidebarContentInner}>
          <React.Suspense fallback={null}>
            <SidebarChannelsContent />
          </React.Suspense>
        </div>
      </div>
      <ModalAddMembers
        isOpen={isAddMembersOpen}
        onClose={() => setIsAddMembersOpen(false)}
        serverId={selectedServerId}
      />
      <ModalAddChannel
        isOpen={isAddChannelOpen}
        onClose={() => setIsAddChannelOpen(false)}
        serverId={selectedServerId}
      />
    </>
  );
}
