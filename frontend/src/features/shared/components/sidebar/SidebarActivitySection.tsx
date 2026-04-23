"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import rootStyles from "../../styles/sidebar/SidebarRoot.module.css";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarNotificationsContent } from "./SidebarNotificationsContent";
import { useAuth } from "@/src/core/store/auth/useAuth";
import {
  useNotificationsQuery,
  useMarkNotificationsReadMutation,
} from "@/src/features/notifications/notification.hooks";

export function SidebarActivitySection() {
  const t = useTranslations("sidebar");
  const { isAuthenticated } = useAuth();
  const { data: notifications = [] } = useNotificationsQuery(isAuthenticated);
  const { mutate: markAllRead } = useMarkNotificationsReadMutation();

  useEffect(() => {
    const unread = notifications.some((n) => !n.lu);
    if (unread) markAllRead();
  }, [notifications, markAllRead]);

  return (
    <>
      <SidebarHeader>{t("notifications")}</SidebarHeader>
      <div className={rootStyles.sidebarContent}>
        <div className={rootStyles.sidebarContentInner}>
          <SidebarNotificationsContent notifications={notifications} />
        </div>
      </div>
    </>
  );
}
