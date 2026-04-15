import { useCallback } from "react";
import { Room, RoomEvent, RemoteAudioTrack } from "livekit-client";
import { useTranslations } from "next-intl";
import { getVoiceToken } from "./voice.service";
import { useVoiceStore } from "./voice.store";
import { getSocket } from "@/src/lib/realtime/socketClient";
import { useToastStore } from "@/src/core/store/toast/useToastStore";

export function useVoiceChannel() {
  const { setRoom, setConnected, setMuted, setDeafened, setCurrentChannelId, setParticipants, setActiveSpeakerIds, setUserVolume, reset } =
    useVoiceStore();
  const t = useTranslations("voice");

  const join = useCallback(
    async (channelId: number) => {
      const pushToast = useToastStore.getState().push;

      // Check microphone permission before attempting to connect
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        const isPermissionError =
          err instanceof Error &&
          (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
        pushToast({
          type: "error",
          message: isPermissionError ? t("micPermissionDenied") : t("connectionFailed"),
        });
        return;
      }

      const existing = useVoiceStore.getState().room;
      if (existing) {
        getSocket().emit("voice:leave");
        await existing.disconnect();
      }

      const room = new Room();

      try {
        const { token, url } = await getVoiceToken(channelId);

        room.on(RoomEvent.ParticipantConnected, () =>
          setParticipants([...room.remoteParticipants.values()]),
        );
        room.on(RoomEvent.ParticipantDisconnected, () =>
          setParticipants([...room.remoteParticipants.values()]),
        );
        room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
          if (!(track instanceof RemoteAudioTrack)) return;
          const { isDeafened, userVolumes } = useVoiceStore.getState();
          if (isDeafened) {
            track.setVolume(0);
          } else {
            const vol = userVolumes[participant.identity] ?? 1;
            track.setVolume(vol);
          }
        });
        room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
          setActiveSpeakerIds(new Set(speakers.map((s) => s.identity)));
        });
        room.on(RoomEvent.Disconnected, () => {
          getSocket().emit("voice:leave");
          reset();
        });

        await room.connect(url, token);

        const startMuted = useVoiceStore.getState().isMuted;
        await room.localParticipant.setMicrophoneEnabled(!startMuted);

        getSocket().emit("voice:join", { channelId, isMuted: startMuted });

        setRoom(room);
        setConnected(true);
        setCurrentChannelId(channelId);
      } catch {
        await room.disconnect().catch(() => undefined);
        pushToast({ type: "error", message: t("connectionFailed") });
      }
    },
    [t, setRoom, setConnected, setCurrentChannelId, setParticipants, setActiveSpeakerIds, reset],
  );

  const leave = useCallback(async () => {
    const room = useVoiceStore.getState().room;
    getSocket().emit("voice:leave");
    await room?.disconnect();
    reset();
  }, [reset]);

  const toggleMute = useCallback(async () => {
    const newMuted = !useVoiceStore.getState().isMuted;
    const room = useVoiceStore.getState().room;
    if (room) {
      await room.localParticipant.setMicrophoneEnabled(!newMuted);
    }
    setMuted(newMuted);
    getSocket().emit("voice:mute", { isMuted: newMuted });
  }, [setMuted]);

  const toggleDeafen = useCallback(async () => {
    const newDeafened = !useVoiceStore.getState().isDeafened;
    const room = useVoiceStore.getState().room;

    if (room) {
      const { userVolumes } = useVoiceStore.getState();
      for (const participant of room.remoteParticipants.values()) {
        for (const pub of participant.audioTrackPublications.values()) {
          if (pub.track instanceof RemoteAudioTrack) {
            pub.track.setVolume(newDeafened ? 0 : (userVolumes[participant.identity] ?? 1));
          }
        }
      }
      if (newDeafened && !useVoiceStore.getState().isMuted) {
        await room.localParticipant.setMicrophoneEnabled(false);
        setMuted(true);
        getSocket().emit("voice:mute", { isMuted: true });
      }
    }

    setDeafened(newDeafened);
  }, [setDeafened, setMuted]);

  const setParticipantVolume = useCallback(
    (userId: string, volume: number) => {
      const room = useVoiceStore.getState().room;
      if (room && !useVoiceStore.getState().isDeafened) {
        const participant = [...room.remoteParticipants.values()].find((p) => p.identity === userId);
        if (participant) {
          for (const pub of participant.audioTrackPublications.values()) {
            if (pub.track instanceof RemoteAudioTrack) {
              pub.track.setVolume(volume);
            }
          }
        }
      }
      setUserVolume(userId, volume);
    },
    [setUserVolume],
  );

  return { join, leave, toggleMute, toggleDeafen, setParticipantVolume };
}
