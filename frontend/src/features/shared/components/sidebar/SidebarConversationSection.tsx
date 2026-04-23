"use client";

import React from "react";
import { useTranslations } from "next-intl";
import rootStyles from "../../styles/sidebar/SidebarRoot.module.css";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarConversationsContent } from "./SidebarConversationsContent";
import { SidebarUserFooter } from "@/src/features/shared/components/sidebar/SidebarUserFooter";

export function SidebarConversationSection() {
  const t = useTranslations("sidebar");
  return (
    <>
      <SidebarHeader>{t("conversations")}</SidebarHeader>
      <div className={rootStyles.sidebarContent}>
        <div className={rootStyles.sidebarContentInner}>
          <React.Suspense fallback={null}>
            <SidebarConversationsContent />
          </React.Suspense>
        </div>
      </div>
      <SidebarUserFooter />
    </>
  );
}
