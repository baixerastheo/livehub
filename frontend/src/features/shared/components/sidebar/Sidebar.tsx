"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import rootStyles from "../../styles/sidebar/SidebarRoot.module.css";
import {
  SidebarContext,
  useSidebarContext,
} from "@/src/features/shared/components/sidebar/SidebarContext";
import { useAppStore } from "@/src/core/store/appStore";
import { useAuth } from "@/src/core/store/auth/useAuth";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarConversationSection } from "@/src/features/shared/components/sidebar/SidebarConversationSection";
import { SidebarActivitySection } from "@/src/features/shared/components/sidebar/SidebarActivitySection";
import { SidebarTeamsSection } from "@/src/features/shared/components/sidebar/SidebarTeamsSection";
import {
  SidebarEmptyState as SidebarEmptyStatePart,
  SidebarStartButton as SidebarStartButtonPart,
} from "@/src/features/shared/components/sidebar/SidebarParts";
import { SidebarConversationsContent } from "@/src/features/shared/components/sidebar/SidebarConversationsContent";

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
  const t = useTranslations("nav");
  return (
    <button
      type="button"
      className={rootStyles.closeButton}
      aria-label={t("closeConversationList")}
      onClick={onClose}
    >
      ×
    </button>
  );
}

export function Sidebar() {
  const isOpen = useAppStore((state) => state.isSidebarOpen);
  const section = useAppStore((state) => state.sidebarSection);
  const closeMobileSidebars = useAppStore((state) => state.closeMobileSidebars);
  const resetOnLogout = useAppStore((state) => state.resetOnLogout);
  const { isAuthenticated, isLoading } = useAuth();

  const pathname = usePathname();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      resetOnLogout();
    }
  }, [isAuthenticated, isLoading, resetOnLogout]);

  React.useEffect(() => {
    closeMobileSidebars();
  }, [pathname]);

  return (
    <SidebarRoot isOpen={isOpen} onClose={closeMobileSidebars}>
      <SidebarCloseButton />
      {section === "conversation" && <SidebarConversationSection />}
      {section === "activity" && <SidebarActivitySection />}
      {section === "teams" && isAuthenticated && <SidebarTeamsSection />}
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
