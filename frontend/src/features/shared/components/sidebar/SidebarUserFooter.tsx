 "use client";

import React from "react";
import { useAuth } from "@/src/core/store/auth/useAuth";
import { UserAvatar } from "@/src/features/shared/components/avatar/UserAvatar";
import footerStyles from "../../styles/sidebar/SidebarUserFooter.module.css";
import { getDisplayName } from "@/src/features/shared/lib/displayName";

export function SidebarUserFooter() {
  const { user } = useAuth();

  const displayName =
    user != null
      ? getDisplayName({
          name: user.name ?? undefined,
          email: user.email ?? undefined,
        })
      : "Invité";

  return (
    <div className={footerStyles.footer}>
      <div className={footerStyles.left}>
        <UserAvatar
          avatarUrl={user?.image ?? undefined}
          displayName={displayName}
          size="sm"
          className={footerStyles.avatar}
        />
        <div className={footerStyles.texts}>
          <div className={footerStyles.name}>{displayName}</div>
          <div className={footerStyles.subtext}>
            {user ? (
              <>
                <span className={footerStyles.onlineDot} />
                Online
              </>
            ) : "Offline"}
          </div>
        </div>
      </div>
      <button
        type="button"
        className={footerStyles.actionButton}
        aria-label="Ouvrir les paramètres du compte"
      >
        ⇲
      </button>
    </div>
  );
}

