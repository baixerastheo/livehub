"use client";

import React from "react";
import headerStyles from "../../styles/sidebar/SidebarHeader.module.css";

export function SidebarHeader({ children }: { children: React.ReactNode }) {
  return <div className={headerStyles.header}>{children}</div>;
}
