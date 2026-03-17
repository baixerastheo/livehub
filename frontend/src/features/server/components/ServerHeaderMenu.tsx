"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FiChevronDown } from "react-icons/fi";
import styles from "../styles/ServerHeaderMenu.module.css";
import type { ServerRole } from "../server.types";
import { useDeleteServerMutation, useLeaveServerMutation } from "../server.hooks";
import { ConfirmDeleteServerModal } from "./ConfirmDeleteServerModal";

const ROLE_PROPRIETAIRE: ServerRole = "PROPRIETAIRE";

type Props = {
  serverId: number;
  serverName: string;
  currentUserRole: ServerRole;
};

export function ServerHeaderMenu({
  serverId,
  serverName,
  currentUserRole,
}: Props) {
  const router = useRouter();
  const t = useTranslations("server");
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const deleteMutation = useDeleteServerMutation();
  const leaveMutation = useLeaveServerMutation();

  const isOwner = currentUserRole === ROLE_PROPRIETAIRE;
  const canLeave = !isOwner;

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  const handleLeave = async () => {
    setMenuOpen(false);
    try {
      await leaveMutation.mutateAsync(serverId);
      router.push("/");
    } catch {
      // Error with toast later
    }
  };

  return (
    <div className={styles.wrapper} ref={menuRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setMenuOpen((o) => !o)}
        aria-expanded={menuOpen}
        aria-haspopup="true"
        aria-label={t("serverOptions")}
      >
        <FiChevronDown size={18} aria-hidden />
      </button>
      {menuOpen && (
        <div className={styles.dropdown} role="menu">
          {isOwner && (
            <button
              type="button"
              role="menuitem"
              className={`${styles.menuItem} ${styles.menuItemDanger}`}
              onClick={() => {
                setMenuOpen(false);
                setDeleteModalOpen(true);
              }}
            >
              {t("deleteServerTitle")}
            </button>
          )}
          {canLeave && (
            <button
              type="button"
              role="menuitem"
              className={styles.menuItem}
              onClick={handleLeave}
              disabled={leaveMutation.isPending}
            >
              {leaveMutation.isPending ? t("deleting") : t("leaveServer")}
            </button>
          )}
        </div>
      )}
      <ConfirmDeleteServerModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        serverId={serverId}
        serverName={serverName}
      />
    </div>
  );
}
