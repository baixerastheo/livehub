"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FiTrash2, FiVolume2, FiMicOff, FiVolumeX, FiVolume1, FiPlus } from "react-icons/fi";
import styles from "../../styles/sidebar/SidebarConversations.module.css";
import channelStyles from "../../styles/sidebar/SidebarChannels.module.css";
import { useAppStore } from "@/src/core/store/appStore";
import {
  useChannelsByServerQuery,
  useDeleteChannelMutation,
} from "@/src/features/channel/channel.hooks";
import { useUserServersQuery } from "@/src/features/server/server.hooks";
import type { ServerRole } from "@/src/features/server/server.types";
import { useVoiceChannel } from "@/src/features/voice/voice.hooks";
import { useVoiceStore } from "@/src/features/voice/voice.store";
import { UserAvatar } from "@/src/features/shared/components/avatar/UserAvatar";
import { SidebarEmptyState } from "./SidebarParts";

type ContextMenu = { x: number; y: number; userId: string; name: string };

const ROLES_CAN_DELETE_CHANNEL: ServerRole[] = ["PROPRIETAIRE", "ADMINISTRATEUR"];

type Props = { onAddChannel?: () => void };

export function SidebarChannelsContent({ onAddChannel }: Props) {
  const t = useTranslations("sidebar");
  const pathname = usePathname();
  const router = useRouter();
  const selectedServerId = useAppStore((state) => state.selectedServerId);
  const { data: channels, isLoading, error } =
    useChannelsByServerQuery(selectedServerId);
  const { data: userServers } = useUserServersQuery();
  const deleteChannelMutation = useDeleteChannelMutation(selectedServerId);
  const { join, setParticipantVolume } = useVoiceChannel();
  const currentVoiceChannelId = useVoiceStore((s) => s.currentChannelId);
  const voicePresence = useVoiceStore((s) => s.voicePresence);
  const activeSpeakerIds = useVoiceStore((s) => s.activeSpeakerIds);
  const userVolumes = useVoiceStore((s) => s.userVolumes);

  const [contextMenu, setContextMenu] = React.useState<ContextMenu | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!contextMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [contextMenu]);

  const handlePresenceContextMenu = (e: React.MouseEvent, userId: string, name: string) => {
    e.preventDefault();
    const MENU_W = 220;
    const MENU_H = 190;
    const x = Math.max(8, Math.min(e.clientX, window.innerWidth - MENU_W - 8));
    const y = Math.max(8, Math.min(e.clientY, window.innerHeight - MENU_H - 8));
    setContextMenu({ x, y, userId, name });
  };

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
        title={t("selectServer")}
        subtitle={t("selectServerSubtitle")}
      />
    );
  }

  if (error) {
    return (
      <SidebarEmptyState
        title={t("cannotLoadChannels")}
        subtitle={t("cannotLoadChannelsSubtitle")}
      />
    );
  }

  if (isLoading || channels === undefined) {
    return (
      <SidebarEmptyState
        title={selectedServer?.name ?? t("channels")}
        subtitle={t("loadingChannels")}
      />
    );
  }

  if (channels.length === 0) {
    return (
      <div className={channelStyles.wrapper}>
        <SidebarEmptyState
          title={selectedServer?.name ?? t("channels")}
          subtitle={t("noChannels")}
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
      !window.confirm(t("deleteChannelConfirm", { name: channelName }))
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

  const textChannels = channels.filter((c) => c.type !== "VOCAL");
  const voiceChannels = channels.filter((c) => c.type === "VOCAL");

  return (
    <>
    <div className={channelStyles.wrapper}>
      {/* TEXT CHANNELS */}
      <div className={channelStyles.categoryHeader}>
        <span className={channelStyles.categoryLabel}>{t("channels")}</span>
        {canDeleteChannels && onAddChannel && (
          <button
            type="button"
            className={channelStyles.categoryAddButton}
            onClick={onAddChannel}
            aria-label={t("addChannel")}
            title={t("addChannel")}
          >
            <FiPlus size={12} aria-hidden />
          </button>
        )}
      </div>
      <ul className={`${styles.list} ${channelStyles.channelList}`} aria-label="Text channels">
        {textChannels.map((channel) => {
          const href = `/channels/${channel.id}`;
          const isActive = pathname === href;
          return (
            <li key={channel.id}>
              <div className={styles.rowWrapper}>
                <div className={`${styles.row} ${styles.rowChannel} ${isActive ? styles.rowActive : ""}`}>
                  <Link href={href} className={channelStyles.channelLink} data-testid="channel-item">
                    <span className={channelStyles.channelPrefix} aria-hidden>#</span>
                    <span className={styles.name}>{channel.name}</span>
                  </Link>
                  {canDeleteChannels && (
                    <button
                      type="button"
                      className={channelStyles.deleteChannelButton}
                      data-delete-btn
                      onClick={(e) => handleDeleteChannel(e, channel.id, channel.name)}
                      aria-label={t("deleteChannel", { name: channel.name })}
                      title={t("deleteChannelTitle")}
                    >
                      <FiTrash2 size={13} aria-hidden />
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* VOICE CHANNELS */}
      {(voiceChannels.length > 0 || canDeleteChannels) && (
        <div className={channelStyles.categoryHeader}>
          <span className={channelStyles.categoryLabel}>{t("voiceChannels")}</span>
          {canDeleteChannels && onAddChannel && (
            <button
              type="button"
              className={channelStyles.categoryAddButton}
              onClick={onAddChannel}
              aria-label={t("addChannel")}
              title={t("addChannel")}
            >
              <FiPlus size={12} aria-hidden />
            </button>
          )}
        </div>
      )}
      <ul className={`${styles.list} ${channelStyles.channelList}`} aria-label="Voice channels">
        {voiceChannels.map((channel) => {
          const isActive = currentVoiceChannelId === channel.id;
          const presenceList = voicePresence[channel.id] ?? [];
          return (
            <li key={channel.id}>
              <div className={styles.rowWrapper}>
                <div className={`${styles.row} ${styles.rowChannel} ${isActive ? styles.rowActive : ""}`}>
                  <Link
                    href={`/channels/${channel.id}`}
                    className={channelStyles.channelLink}
                    onClick={() => { void join(channel.id); }}
                  >
                    <span className={channelStyles.channelPrefix} aria-hidden>
                      <FiVolume2 size={13} />
                    </span>
                    <span className={styles.name}>{channel.name}</span>
                    {presenceList.length > 0 && (
                      <span className={channelStyles.voiceLiveBars} aria-hidden>
                        <span />
                        <span />
                        <span />
                      </span>
                    )}
                  </Link>
                  {canDeleteChannels && (
                    <button
                      type="button"
                      className={channelStyles.deleteChannelButton}
                      data-delete-btn
                      onClick={(e) => handleDeleteChannel(e, channel.id, channel.name)}
                      aria-label={t("deleteChannel", { name: channel.name })}
                      title={t("deleteChannelTitle")}
                    >
                      <FiTrash2 size={13} aria-hidden />
                    </button>
                  )}
                </div>
              </div>
              {presenceList.length > 0 && (
                <ul className={channelStyles.voicePresenceList} aria-label={t("voiceParticipantsLabel")}>
                  {presenceList.slice(0, 4).map((p) => (
                    <li
                      key={p.userId}
                      className={channelStyles.voicePresenceItem}
                      onContextMenu={(e) => handlePresenceContextMenu(e, p.userId, p.name)}
                    >
                      <span className={`${channelStyles.voicePresenceAvatarWrap} ${activeSpeakerIds.has(p.userId) ? channelStyles.voicePresenceAvatarSpeaking : ""}`}>
                        <UserAvatar
                          avatarUrl={p.avatarUrl}
                          displayName={p.name}
                          size="sm"
                          aria-hidden
                        />
                        {p.isMuted && (
                          <span className={channelStyles.muteBadge} aria-label={t("voiceMutedLabel")}>
                            <FiMicOff size={8} />
                          </span>
                        )}
                        {(userVolumes[p.userId] ?? 1) === 0 && (
                          <span className={channelStyles.localMuteBadge} aria-label={t("voiceLocalMuteLabel")}>
                            <FiVolumeX size={7} />
                          </span>
                        )}
                      </span>
                      <span className={channelStyles.voicePresenceName}>{p.name}</span>
                    </li>
                  ))}
                  {presenceList.length > 4 && (
                    <li className={channelStyles.voicePresenceOverflow}>
                      {t("voiceMoreMembers", { count: presenceList.length - 4 })}
                    </li>
                  )}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
    {contextMenu && (
      <div
        ref={menuRef}
        className={channelStyles.voiceContextMenu}
        style={{ top: contextMenu.y, left: contextMenu.x }}
      >
        <div className={channelStyles.voiceContextMenuTitle}>{contextMenu.name}</div>
        <button
          className={`${channelStyles.voiceContextMenuItem} ${(userVolumes[contextMenu.userId] ?? 1) !== 0 ? channelStyles.voiceContextMenuItemDanger : ""}`}
          onClick={() => {
            const isMuted = (userVolumes[contextMenu.userId] ?? 1) === 0;
            setParticipantVolume(contextMenu.userId, isMuted ? 1 : 0);
          }}
        >
          {(userVolumes[contextMenu.userId] ?? 1) === 0 ? (
            <><FiVolume1 size={14} /> {t("voiceUnmuteUser")}</>
          ) : (
            <><FiVolumeX size={14} /> {t("voiceMuteUser")}</>
          )}
        </button>
        <div className={channelStyles.voiceContextMenuDivider} />
        <div className={channelStyles.voiceContextMenuVolumeLabel}>{t("voiceVolume")}</div>
        <div className={channelStyles.voiceContextMenuSliderRow}>
          <FiVolumeX size={12} />
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round((userVolumes[contextMenu.userId] ?? 1) * 100)}
            onChange={(e) => setParticipantVolume(contextMenu.userId, Number(e.target.value) / 100)}
            className={channelStyles.voiceContextMenuSlider}
          />
          <FiVolume2 size={12} />
          <span className={channelStyles.voiceContextMenuSliderValue}>
            {Math.round((userVolumes[contextMenu.userId] ?? 1) * 100)}%
          </span>
        </div>
      </div>
    )}
    </>
  )
}
