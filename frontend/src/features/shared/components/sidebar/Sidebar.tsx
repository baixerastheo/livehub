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

const SIDEBAR_MIN = 220;
const SIDEBAR_MAX = 400;
const SIDEBAR_DEFAULT = 280;
const STORAGE_KEY = "sidebar-width";

function SidebarRoot({ children, isOpen, onClose }: SidebarRootProps) {
  const [width, setWidth] = React.useState<number>(() => {
    if (typeof window === "undefined") return SIDEBAR_DEFAULT;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, parseInt(stored, 10))) : SIDEBAR_DEFAULT;
  });
  const onHandleMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (window.innerWidth <= 768) return;
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;
    let latestWidth = startWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      latestWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startWidth + delta));
      setWidth(latestWidth);
    };

    const onMouseUp = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      localStorage.setItem(STORAGE_KEY, String(latestWidth));
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [width]);

  return (
    <SidebarContext.Provider value={{ onClose }}>
      <aside
        className={`${rootStyles.sidebar} ${isOpen ? rootStyles.sidebarOpen : ""}`}
        style={{ width, minWidth: width, maxWidth: width }}
      >
        {children}
        <div
          className={rootStyles.resizeHandle}
          onMouseDown={onHandleMouseDown}
          aria-hidden
        />
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

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        closeMobileSidebars();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [closeMobileSidebars]);

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
