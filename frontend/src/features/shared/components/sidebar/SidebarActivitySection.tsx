"use client";

import rootStyles from "../../styles/sidebar/SidebarRoot.module.css";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarEmptyState } from "./SidebarParts";

export function SidebarActivitySection() {
  return (
    <>
      <SidebarHeader>Notifications</SidebarHeader>
      <div className={rootStyles.sidebarContent}>
        <div className={rootStyles.sidebarContentInner}>
          <SidebarEmptyState
            title="No notification"
            subtitle="Your recent activity will appear here."
          />
        </div>
      </div>
    </>
  );
}
