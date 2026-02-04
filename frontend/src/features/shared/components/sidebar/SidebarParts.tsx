"use client";

import React from "react";
import emptyStateStyles from "../../styles/sidebar/SidebarEmptyState.module.css";
import startButtonStyles from "../../styles/sidebar/SidebarStartButton.module.css";

type SidebarEmptyStateProps = {
  title: string;
  subtitle: string;
};

export function SidebarEmptyState({ title, subtitle }: SidebarEmptyStateProps) {
  return (
    <div className={emptyStateStyles.emptyState}>
      <p className={emptyStateStyles.title}>{title}</p>
      <p className={emptyStateStyles.subtitle}>{subtitle}</p>
    </div>
  );
}

type SidebarStartButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
};

export function SidebarStartButton({ children, onClick }: SidebarStartButtonProps) {
  return (
    <button
      type="button"
      className={startButtonStyles.startButton}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
