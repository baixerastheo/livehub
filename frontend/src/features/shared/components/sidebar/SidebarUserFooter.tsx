"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/src/core/store/auth/useAuth";
import { CurrentUserAvatar } from "@/src/features/shared/components/avatar/CurrentUserAvatar";
import footerStyles from "../../styles/sidebar/SidebarUserFooter.module.css";
import { getDisplayName } from "@/src/features/shared/lib/displayName";
import { IoSettingsOutline } from "react-icons/io5";
import { FiMic, FiMicOff, FiPhoneOff, FiHeadphones } from "react-icons/fi";
import { useAppStore } from "@/src/core/store/appStore";
import { useVoiceStore } from "@/src/features/voice/voice.store";
import { useVoiceChannel } from "@/src/features/voice/voice.hooks";

export function SidebarUserFooter() {
  const t = useTranslations("sidebar");
  const tCommon = useTranslations("common");
  const { user } = useAuth();
  const openAccountModal = useAppStore((state) => state.openAccountModal);
  const isConnected = useVoiceStore((s) => s.isConnected);
  const isMuted = useVoiceStore((s) => s.isMuted);
  const isDeafened = useVoiceStore((s) => s.isDeafened);
  const { toggleMute, toggleDeafen, leave } = useVoiceChannel();

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
      <div className={footerStyles.actions}>
        <div className={footerStyles.voiceButtonGroup}>
          <button
            type="button"
            className={`${footerStyles.actionButton} ${isMuted ? footerStyles.actionButtonMuted : ""}`}
            aria-label={isMuted ? t("voiceUnmute") : t("voiceMute")}
            title={isMuted ? t("voiceUnmute") : t("voiceMute")}
            onClick={toggleMute}
            disabled={!isConnected}
          >
            {isMuted ? <FiMicOff size={14} /> : <FiMic size={14} />}
          </button>
          <button
            type="button"
            className={`${footerStyles.actionButton} ${isDeafened ? footerStyles.actionButtonMuted : ""}`}
            aria-label={isDeafened ? t("voiceUndeafen") : t("voiceDeafen")}
            title={isDeafened ? t("voiceUndeafen") : t("voiceDeafen")}
            onClick={toggleDeafen}
            disabled={!isConnected}
          >
            <FiHeadphones size={14} />
          </button>
        </div>
        {isConnected && (
          <button
            type="button"
            className={`${footerStyles.actionButton} ${footerStyles.actionButtonLeave}`}
            aria-label={t("voiceLeave")}
            title={t("voiceLeave")}
            onClick={leave}
          >
            <FiPhoneOff size={14} />
          </button>
        )}
        <button
          type="button"
          className={footerStyles.actionButton}
          aria-label={t("openAccountSettings")}
          onClick={() => openAccountModal("profile")}
        >
          <IoSettingsOutline />
        </button>
      </div>
    </div>
  );
}

