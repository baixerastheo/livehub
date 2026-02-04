"use client";

import React from "react";
import rootStyles from "../../styles/sidebar/SidebarRoot.module.css";
import headerStyles from "../../styles/sidebar/SidebarHeader.module.css";
import {
  SidebarContext,
  useSidebarContext,
} from "@/src/features/shared/components/sidebar/SidebarContext";
import { useAppStore } from "@/src/core/store/appStore";
import { SidebarConversationsContent } from "@/src/features/shared/components/sidebar/SidebarConversationsContent";
import {
  SidebarEmptyState as SidebarEmptyStatePart,
  SidebarStartButton as SidebarStartButtonPart,
} from "@/src/features/shared/components/sidebar/SidebarParts";

type SidebarRootProps = {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
};

function SidebarRoot({ children, isOpen, onClose }: SidebarRootProps) {
  return (
    <SidebarContext.Provider value={{ onClose }}>
      <aside
        className={`${rootStyles.sidebar} ${isOpen ? rootStyles.sidebarOpen : ""}`}
      >
        {children}
      </aside>
      {isOpen && (
        <button
          type="button"
          className={rootStyles.sidebarBackdrop}
          aria-label="Close sidebar"
          onClick={onClose}
        />
      )}
    </SidebarContext.Provider>
  );
}

function SidebarCloseButton() {
  const { onClose } = useSidebarContext();
  return (
    <button
      type="button"
      className={rootStyles.closeButton}
      aria-label="Close conversation list"
      onClick={onClose}
    >
      ×
    </button>
  );
}

function SidebarHeader({ children }: { children: React.ReactNode }) {
  return <div className={headerStyles.header}>{children}</div>;
}

function getSectionHeader(section: "activity" | "conversation" | "teams") {
  switch (section) {
    case "activity":
      return "Notifications";
    case "teams":
      return "Servers";
    default:
      return "Conversations";
  }
}

export function Sidebar() {
  const isOpen = useAppStore((state) => state.isSidebarOpen);
  const section = useAppStore((state) => state.sidebarSection);
  const closeMobileSidebars = useAppStore((state) => state.closeMobileSidebars);

  const header = getSectionHeader(section);

  return (
    <SidebarRoot isOpen={isOpen} onClose={closeMobileSidebars}>
      <SidebarCloseButton />
      <SidebarHeader>{header}</SidebarHeader>
      {section === "conversation" && <SidebarConversationsContent />}
      {section === "activity" && (
        <SidebarEmptyStatePart
          title="No notification"
          subtitle="Your recent activity will appear here."
        />
      )}
      {section === "teams" && (
        <SidebarEmptyStatePart
          title="No server"
          subtitle="Join or create a server to see it here."
        />
      )}
    </SidebarRoot>
  );
}

Sidebar.Root = SidebarRoot;
Sidebar.CloseButton = SidebarCloseButton;
Sidebar.Header = SidebarHeader;
Sidebar.EmptyState = SidebarEmptyStatePart;
Sidebar.StartButton = SidebarStartButtonPart;
Sidebar.ConversationsContent = SidebarConversationsContent;
Sidebar.useContext = useSidebarContext;
