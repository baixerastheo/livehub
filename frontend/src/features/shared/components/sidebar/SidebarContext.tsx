"use client";

import React from "react";

export type SidebarContextValue = {
  onClose: () => void;
};

export const SidebarContext = React.createContext<SidebarContextValue | null>(
  null,
);

export function useSidebarContext() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) {
    throw new Error("Sidebar compound components must be used within Sidebar.Root");
  }
  return ctx;
}
