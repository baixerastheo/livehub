"use client";

import { FiVolume2, FiMicOff, FiPhoneOff, FiPhoneCall } from "react-icons/fi";
import { useTranslations } from "next-intl";
import { useVoiceStore } from "./voice.store";
import { useVoiceChannel } from "./voice.hooks";
import styles from "./VoiceChannelScreen.module.css";

type Props = {
  channelId: number;
  channelName: string;
};

export function VoiceChannelScreen({ channelId, channelName }: Props) {
  const t = useTranslations("voice");
  const isConnected = useVoiceStore((s) => s.isConnected);
  const currentChannelId = useVoiceStore((s) => s.currentChannelId);
  const voicePresence = useVoiceStore((s) => s.voicePresence);
  const activeSpeakerIds = useVoiceStore((s) => s.activeSpeakerIds);
  const { join, leave } = useVoiceChannel();

  const isInThisChannel = isConnected && currentChannelId === channelId;
  const participants = voicePresence[channelId] ?? [];

  const cols = participants.length <= 1 ? 1
    : participants.length <= 4 ? 2
    : participants.length <= 9 ? 3
    : 4;
  const rows = Math.ceil(participants.length / cols);

  return (
    <main className={styles.root}>
      <header className={styles.header}>
        <FiVolume2 size={16} className={styles.headerIcon} />
        <span className={styles.headerName}>{channelName}</span>
      </header>

      <div className={styles.body}>
        {participants.length === 0 ? (
          <p className={styles.empty}>{t("empty")}</p>
        ) : (
          <ul
            className={styles.grid}
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
            }}
          >
            {participants.map((p) => (
              <li
                key={p.userId}
                className={`${styles.tile} ${activeSpeakerIds.has(p.userId) ? styles.tileSpeaking : ""}`}
              >
                <span className={styles.tileAvatar}>
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt="" className={styles.tileAvatarImg} />
                  ) : (
                    <span className={styles.tileAvatarInitial}>
                      {p.name[0]?.toUpperCase() ?? "?"}
                    </span>
                  )}
                </span>
                <span className={styles.tileName}>{p.name}</span>
                {p.isMuted && (
                  <span className={styles.muteBadge} aria-label={t("mutedLabel")}>
                    <FiMicOff size={13} />
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.footer}>
        {isInThisChannel ? (
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.leaveBtn}`}
            onClick={leave}
          >
            <FiPhoneOff size={15} />
            {t("leave")}
          </button>
        ) : (
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.joinBtn}`}
            onClick={() => { void join(channelId); }}
          >
            <FiPhoneCall size={15} />
            {t("join")}
          </button>
        )}
      </div>
    </main>
  );
}
