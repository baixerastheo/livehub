"use client";

import React from "react";
import { Navbar } from "@/src/features/shared/components/navbar/Navbar";
import { NavbarSearch } from "@/src/features/shared/components/navbar/NavbarSearch";
import { NavbarAuthSection } from "@/src/features/shared/components/navbar/NavbarAuthSection";
import { NavbarPeopleButton } from "@/src/features/shared/components/navbar/NavbarPeopleButton";
import { Sidebar } from "@/src/features/shared/components/sidebar/Sidebar";
import { SidebarRail } from "@/src/features/shared/components/sidebar/SidebarRail";
import { AuthModal } from "@/src/features/modalAuth/components/AuthModal";
import { useAuthBootstrap } from "@/src/features/auth/hooks/useAuthBootstrap";
import { useMeQuery } from "@/src/features/auth/auth.hooks";
import { ProfileDefaultPage } from "@/src/features/profilePage/components/ProfileDefaultPage";
import { ToastHost } from "@/src/features/shared/components/toast/ToastHost";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  useAuthBootstrap();
  useMeQuery();

  return (
    <>
      <Navbar>
        <NavbarSearch />
        <NavbarPeopleButton />
        <NavbarAuthSection />
      </Navbar>
      <div
        style={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <SidebarRail />
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

