"use client";

import React from "react";
import { Navbar } from "@/src/features/shared/components/navbar/Navbar";
import { NavbarSearch } from "@/src/features/shared/components/navbar/NavbarSearch";
import { NavbarPeopleButton } from "@/src/features/shared/components/navbar/NavbarPeopleButton";
import { NavbarAuthSection } from "@/src/features/shared/components/navbar/NavbarAuthSection";
import { Sidebar } from "@/src/features/shared/components/sidebar/Sidebar";
import { SidebarRail } from "@/src/features/shared/components/sidebar/SidebarRail";
import { ProfileDefaultPage } from "@/src/features/profilePage/components/ProfileDefaultPage";
import { ToastHost } from "@/src/features/shared/components/toast/ToastHost";
import { AuthModal } from "@/src/features/modalAuth/components/AuthModal";
import { PrivateConversationsRealtimeSync } from "@/src/features/messages/components/PrivateConversationsRealtimeSync";
import { ServerRealtimeSync } from "@/src/features/server/components/ServerRealtimeSync";
import { UserServerAddedRealtimeSync } from "@/src/features/server/components/UserServerAddedRealtimeSync";
import { PresenceRealtimeSync } from "@/src/lib/realtime/PresenceRealtimeSync";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <PrivateConversationsRealtimeSync />
      <ServerRealtimeSync />
      <UserServerAddedRealtimeSync />
      <PresenceRealtimeSync />
      <Navbar>
        <NavbarSearch />
        <NavbarPeopleButton />
        <NavbarAuthSection />
      </Navbar>
      <div
        style={{
          display: "flex",
          height: "calc(100vh - var(--app-navbar-height))",
          overflow: "visible",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "relative",
            zIndex: 20,
            flexShrink: 0,
            alignSelf: "stretch",
            display: "flex",
          }}
        >
          <SidebarRail />
        </div>
        <Sidebar />
        <div
          style={{
            flex: 1,
            overflowY: "auto",
          }}
        >
          {children}
        </div>
      </div>
      <AuthModal />
      <ProfileDefaultPage />
      <ToastHost />
    </>
  );
}
