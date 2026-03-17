"use client";

import { useTranslations } from "next-intl";
import rootStyles from "../../styles/sidebar/SidebarRoot.module.css";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarEmptyState } from "./SidebarParts";

export function SidebarActivitySection() {
  const t = useTranslations("sidebar");
  return (
    <>
      <SidebarHeader>{t("notifications")}</SidebarHeader>
      <div className={rootStyles.sidebarContent}>
        <div className={rootStyles.sidebarContentInner}>
          <SidebarEmptyState
            title={t("noNotification")}
            subtitle={t("noNotificationSubtitle")}
          />
        </div>
      </div>
    </>
  );
}
