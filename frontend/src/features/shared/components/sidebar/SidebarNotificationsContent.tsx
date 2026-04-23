"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import styles from "../../styles/sidebar/SidebarNotifications.module.css";
import { SidebarEmptyState } from "./SidebarParts";
import { useSidebarContext } from "./SidebarContext";
import type {
  NotificationDto,
  MentionData,
  PrivateMessageData,
  BannedData,
} from "@/src/features/notifications/notification.types";

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { weekday: "short" });
}

function NotificationItem({ notif }: { notif: NotificationDto }) {
  const t = useTranslations("notifications");
  const { onClose } = useSidebarContext();

  let icon = "🔔";
  let iconClass = styles.iconMention;
  let title = "";
  let preview: string | undefined;
  let href: string | undefined;

  if (notif.type === "MENTION") {
    const d = notif.data as MentionData;
    icon = "@";
    iconClass = styles.iconMention;
    title = t("mentionTitle", { author: d.authorName, channel: String(d.channelId) });
    preview = d.messagePreview;
    href = `/channels/${d.channelId}`;
  } else if (notif.type === "PRIVATE_MESSAGE") {
    const d = notif.data as PrivateMessageData;
    icon = "✉";
    iconClass = styles.iconDm;
    title = t("privateMessageTitle", { author: d.authorName });
    preview = d.content;
    href = `/messages?with=${d.authorId}&name=${encodeURIComponent(d.authorName)}`;
  } else if (notif.type === "KICKED") {
    icon = "🚪";
    iconClass = styles.iconKick;
    title = t("kickedTitle");
  } else if (notif.type === "BANNED") {
    const d = notif.data as BannedData;
    icon = "🔨";
    iconClass = styles.iconBan;
    title = t("bannedTitle");
    preview = d.raison ?? undefined;
  }

  const inner = (
    <>
      <span className={`${styles.iconWrapper} ${iconClass}`} aria-hidden>
        {icon}
      </span>
      <span className={styles.textBlock}>
        <span className={styles.title}>{title}</span>
        {preview && <span className={styles.preview}>{preview}</span>}
      </span>
      <span className={styles.time}>{formatTime(notif.creeLe)}</span>
      {!notif.lu && <span className={styles.unreadDot} aria-hidden />}
    </>
  );

  return (
    <li className={`${styles.item} ${!notif.lu ? styles.itemUnread : ""}`}>
      {href ? (
        <Link href={href} className={styles.itemLink} onClick={onClose}>
          {inner}
        </Link>
      ) : (
        inner
      )}
    </li>
  );
}

export function SidebarNotificationsContent({ notifications }: { notifications: NotificationDto[] }) {
  const t = useTranslations("sidebar");

  if (notifications.length === 0) {
    return (
      <SidebarEmptyState
        title={t("noNotification")}
        subtitle={t("noNotificationSubtitle")}
      />
    );
  }

  return (
    <div className={styles.scrollWrapper}>
      <ul className={styles.list} aria-label="Notifications">
        {notifications.map((notif) => (
          <NotificationItem key={notif.id} notif={notif} />
        ))}
      </ul>
    </div>
  );
}
