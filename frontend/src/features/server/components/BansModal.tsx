"use client";

import React from "react";
import { useTranslations } from "next-intl";
import styles from "../styles/BansModal.module.css";
import { useBansQuery, useUnbanMemberMutation } from "../server.hooks";
import { getDisplayName } from "@/src/features/shared/lib/displayName";
import { UserAvatar } from "@/src/features/shared/components/avatar/UserAvatar";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  serverId: number;
};

export function BansModal({ isOpen, onClose, serverId }: Props) {
  const t = useTranslations("server");
  const { data: bans, isLoading, error } = useBansQuery(isOpen ? serverId : null);
  const unbanMutation = useUnbanMemberMutation(serverId);

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bans-modal-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 id="bans-modal-title" className={styles.title}>
            {t("bans")}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t("cancel")}
          >
            ×
          </button>
        </div>

        <div className={styles.body}>
          {isLoading && (
            <p className={styles.state}>{t("loadingMembers")}</p>
          )}
          {!isLoading && error && (
            <p className={styles.state}>{t("cannotLoadMembers")}</p>
          )}
          {!isLoading && !error && (!bans || bans.length === 0) && (
            <p className={styles.state}>{t("noBans")}</p>
          )}
          {!isLoading && !error && bans && bans.length > 0 && (
            <ul className={styles.list}>
              {bans.map((ban) => (
                <li key={ban.id} className={styles.row}>
                  <UserAvatar
                    avatarUrl={ban.user.avatarUrl}
                    displayName={getDisplayName(ban.user)}
                    size="smMd"
                    aria-hidden
                  />
                  <div className={styles.info}>
                    <span className={styles.name}>
                      {getDisplayName(ban.user)}
                    </span>
                    <span className={styles.meta}>
                      {ban.raison && (
                        <span className={styles.reason}>{ban.raison}</span>
                      )}
                      <span className={`${styles.expiry} ${!ban.expireLe ? styles.expiryPermanent : ""}`}>
                        {ban.expireLe
                          ? t("banUntil", {
                              date: new Date(ban.expireLe).toLocaleDateString(
                                undefined,
                                { day: "numeric", month: "short", year: "numeric" },
                              ),
                            })
                          : t("banPermanent")}
                      </span>
                    </span>
                  </div>
                  <button
                    type="button"
                    className={styles.unbanButton}
                    onClick={() =>
                      unbanMutation.mutate(ban.user.id)
                    }
                    disabled={unbanMutation.isPending}
                  >
                    {t("unban")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
