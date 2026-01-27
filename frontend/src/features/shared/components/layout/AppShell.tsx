"use client";

import React, { useState } from "react";
import { Navbar } from "@/src/features/shared/components/navbar/Navbar";
import { Sidebar } from "@/src/features/shared/components/sidebar/Sidebar";
import { LoginModal } from "@/src/features/shared/components/modal/LoginModal";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev: boolean) => !prev);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleStartConversation = () => {
    setIsLoginModalOpen(true);
  };

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  return (
    <>
      <Navbar onToggleSidebar={handleToggleSidebar} />
      <div
        style={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
          onStartConversation={handleStartConversation}
        />
        <div
          style={{
            flex: 1,
            overflowY: "auto",
          }}
        >
          {children}
        </div>
      </div>
      <LoginModal open={isLoginModalOpen} onClose={handleCloseLoginModal} />
    </>
  );
}

