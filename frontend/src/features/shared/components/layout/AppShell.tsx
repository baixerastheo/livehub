"use client";

import React from "react";
import { Navbar } from "@/src/features/shared/components/navbar/Navbar";
import { Sidebar } from "@/src/features/shared/components/sidebar/Sidebar";
import { AuthModal } from "@/src/features/modalAuth/components/AuthModal";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <Navbar />
      <div
        style={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
        }}
      >
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
    </>
  );
}

