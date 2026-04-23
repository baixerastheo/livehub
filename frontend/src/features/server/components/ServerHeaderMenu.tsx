"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FiChevronDown } from "react-icons/fi";
import styles from "../styles/ServerHeaderMenu.module.css";
import type { ServerRole } from "../server.types";
import { useDeleteServerMutation, useLeaveServerMutation, useUploadServerAvatarMutation } from "../server.hooks";
import { ConfirmDeleteServerModal } from "./ConfirmDeleteServerModal";
import { BansModal } from "./BansModal";
import { AvatarCropModal } from "./AvatarCropModal";

const ROLE_PROPRIETAIRE: ServerRole = "PROPRIETAIRE";
const ROLE_ADMINISTRATEUR: ServerRole = "ADMINISTRATEUR";

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
  const [bansModalOpen, setBansModalOpen] = React.useState(false);
  const [cropSrc, setCropSrc] = React.useState<string | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const deleteMutation = useDeleteServerMutation();
  const leaveMutation = useLeaveServerMutation();
  const uploadAvatarMutation = useUploadServerAvatarMutation();
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  const isOwner = currentUserRole === ROLE_PROPRIETAIRE;
  const canManageBans =
    currentUserRole === ROLE_PROPRIETAIRE ||
    currentUserRole === ROLE_ADMINISTRATEUR;
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

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setCropSrc(URL.createObjectURL(file));
  };

  const handleCropConfirm = async (croppedFile: File) => {
    setCropSrc(null);
    try {
      await uploadAvatarMutation.mutateAsync({ serverId, file: croppedFile });
    } catch {
      // Error handled silently; toast can be added later
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
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={handleAvatarFileChange}
      />
      {menuOpen && (
        <div className={styles.dropdown} role="menu">
          {isOwner && (
            <button
              type="button"
              role="menuitem"
              className={styles.menuItem}
              onClick={() => {
                setMenuOpen(false);
                avatarInputRef.current?.click();
              }}
            >
              {t("changeAvatar")}
            </button>
          )}
          {canManageBans && (
            <button
              type="button"
              role="menuitem"
              className={styles.menuItem}
              onClick={() => {
                setMenuOpen(false);
                setBansModalOpen(true);
              }}
            >
              {t("bans")}
            </button>
          )}
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
      <BansModal
        isOpen={bansModalOpen}
        onClose={() => setBansModalOpen(false)}
        serverId={serverId}
      />
      {cropSrc && (
        <AvatarCropModal
          src={cropSrc}
          onConfirm={handleCropConfirm}
          onClose={() => setCropSrc(null)}
        />
      )}
    </div>
  );
}
