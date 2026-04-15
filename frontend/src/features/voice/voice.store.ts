import { create } from "zustand";
import type { Room, RemoteParticipant } from "livekit-client";

export type VoicePresenceParticipant = { userId: string; name: string; avatarUrl: string | null; isMuted: boolean };

type VoiceState = {
  room: Room | null;
  isConnected: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  currentChannelId: number | null;
  participants: RemoteParticipant[];
  /** channelId → participants visible in the sidebar (set via Socket.IO presence) */
  voicePresence: Record<number, VoicePresenceParticipant[]>;
  /** userIds currently speaking (LiveKit active speakers) */
  activeSpeakerIds: Set<string>;
  /** userId → volume 0-1 (local override, 0 = muted for self) */
  userVolumes: Record<string, number>;

  setRoom: (room: Room | null) => void;
  setConnected: (connected: boolean) => void;
  setMuted: (muted: boolean) => void;
  setDeafened: (deafened: boolean) => void;
  setCurrentChannelId: (channelId: number | null) => void;
  setParticipants: (participants: RemoteParticipant[]) => void;
  setVoicePresence: (channelId: number, participants: VoicePresenceParticipant[]) => void;
  setActiveSpeakerIds: (ids: Set<string>) => void;
  setUserVolume: (userId: string, volume: number) => void;
  reset: () => void;
};

export const useVoiceStore = create<VoiceState>((set) => ({
  room: null,
  isConnected: false,
  isMuted: false,
  isDeafened: false,
  currentChannelId: null,
  participants: [],
  voicePresence: {},
  activeSpeakerIds: new Set<string>(),
  userVolumes: {},

  setRoom: (room) => set({ room }),
  setConnected: (isConnected) => set({ isConnected }),
  setMuted: (isMuted) => set({ isMuted }),
  setDeafened: (isDeafened) => set({ isDeafened }),
  setCurrentChannelId: (currentChannelId) => set({ currentChannelId }),
  setParticipants: (participants) => set({ participants }),
  setVoicePresence: (channelId, participants) =>
    set((state) => ({
      voicePresence: { ...state.voicePresence, [channelId]: participants },
    })),
  setActiveSpeakerIds: (activeSpeakerIds) => set({ activeSpeakerIds }),
  setUserVolume: (userId, volume) =>
    set((state) => ({ userVolumes: { ...state.userVolumes, [userId]: volume } })),
  reset: () =>
    set({
      room: null,
      isConnected: false,
      isMuted: false,
      isDeafened: false,
      currentChannelId: null,
      participants: [],
      activeSpeakerIds: new Set<string>(),
    }),
}));
