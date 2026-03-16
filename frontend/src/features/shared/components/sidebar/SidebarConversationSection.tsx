"use client";

import React from "react";
import rootStyles from "../../styles/sidebar/SidebarRoot.module.css";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarConversationsContent } from "./SidebarConversationsContent";
import { SidebarUserFooter } from "@/src/features/shared/components/sidebar/SidebarUserFooter";

export function SidebarConversationSection() {
  return (
    <>
      <SidebarHeader>Conversations</SidebarHeader>
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
