"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/src/core/store/auth/useAuth";
import { CurrentUserAvatar } from "@/src/features/shared/components/avatar/CurrentUserAvatar";
import footerStyles from "../../styles/sidebar/SidebarUserFooter.module.css";
import { getDisplayName } from "@/src/features/shared/lib/displayName";
import { IoSettingsOutline } from "react-icons/io5";
import { useAppStore } from "@/src/core/store/appStore";

export function SidebarUserFooter() {
  const t = useTranslations("sidebar");
  const tCommon = useTranslations("common");
  const { user } = useAuth();
  const openAccountModal = useAppStore((state) => state.openAccountModal);
  const displayName =
    user != null
      ? getDisplayName({
          name: user.name ?? undefined,
          email: user.email ?? undefined,
        })
      : t("guest");

  return (
    <div className={footerStyles.footer}>
      <div className={footerStyles.left}>
        <CurrentUserAvatar size="smMd" className={footerStyles.avatar} />
        <div className={footerStyles.texts}>
          <div className={footerStyles.name}>{displayName}</div>
          <div className={footerStyles.subtext}>
            {user ? (
              <>
                <span className={footerStyles.onlineDot} />
                {tCommon("online")}
              </>
            ) : tCommon("offline")}
          </div>
        </div>
      </div>
      <button
        type="button"
        className={footerStyles.actionButton}
        aria-label={t("openAccountSettings")}
        onClick={() => {
          openAccountModal("profile");
        }}
      >
        <IoSettingsOutline />
      </button>
    </div>
  );
}

