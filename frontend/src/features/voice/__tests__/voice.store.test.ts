import { useVoiceStore } from "../voice.store";
import type { VoicePresenceParticipant } from "../voice.store";

const initialState = {
  room: null,
  isConnected: false,
  isMuted: false,
  isDeafened: false,
  currentChannelId: null,
  participants: [],
  voicePresence: {},
  activeSpeakerIds: new Set<string>(),
  userVolumes: {},
};

beforeEach(() => {
  useVoiceStore.setState(initialState);
});

describe("simple setters", () => {
  it("setConnected updates isConnected", () => {
    useVoiceStore.getState().setConnected(true);
    expect(useVoiceStore.getState().isConnected).toBe(true);
    useVoiceStore.getState().setConnected(false);
    expect(useVoiceStore.getState().isConnected).toBe(false);
  });

  it("setMuted updates isMuted", () => {
    useVoiceStore.getState().setMuted(true);
    expect(useVoiceStore.getState().isMuted).toBe(true);
  });

  it("setDeafened updates isDeafened", () => {
    useVoiceStore.getState().setDeafened(true);
    expect(useVoiceStore.getState().isDeafened).toBe(true);
  });

  it("setCurrentChannelId updates currentChannelId", () => {
    useVoiceStore.getState().setCurrentChannelId(42);
    expect(useVoiceStore.getState().currentChannelId).toBe(42);
  });

  it("setCurrentChannelId accepts null", () => {
    useVoiceStore.setState({ currentChannelId: 42 });
    useVoiceStore.getState().setCurrentChannelId(null);
    expect(useVoiceStore.getState().currentChannelId).toBeNull();
  });

  it("setRoom updates room", () => {
    const fakeRoom = {} as Parameters<typeof useVoiceStore.getState.call>[0];
    useVoiceStore.getState().setRoom(fakeRoom as never);
    expect(useVoiceStore.getState().room).toBe(fakeRoom);
  });

  it("setParticipants replaces participants array", () => {
    const fakeParticipant = { identity: "user-1" } as never;
    useVoiceStore.getState().setParticipants([fakeParticipant]);
    expect(useVoiceStore.getState().participants).toHaveLength(1);
  });

  it("setActiveSpeakerIds updates the set", () => {
    const ids = new Set(["user-1", "user-2"]);
    useVoiceStore.getState().setActiveSpeakerIds(ids);
    expect(useVoiceStore.getState().activeSpeakerIds).toBe(ids);
  });
});

describe("setVoicePresence", () => {
  const participants: VoicePresenceParticipant[] = [
    { userId: "u1", name: "Alice", avatarUrl: null, isMuted: false },
  ];

  it("sets presence for a channel", () => {
    useVoiceStore.getState().setVoicePresence(10, participants);
    expect(useVoiceStore.getState().voicePresence[10]).toEqual(participants);
  });

  it("preserves other channels when updating one", () => {
    useVoiceStore.setState({ voicePresence: { 5: participants } });
    useVoiceStore.getState().setVoicePresence(10, []);
    expect(useVoiceStore.getState().voicePresence[5]).toEqual(participants);
    expect(useVoiceStore.getState().voicePresence[10]).toEqual([]);
  });
});

describe("setUserVolume", () => {
  it("sets volume for a user", () => {
    useVoiceStore.getState().setUserVolume("user-1", 0.75);
    expect(useVoiceStore.getState().userVolumes["user-1"]).toBe(0.75);
  });

  it("preserves other user volumes", () => {
    useVoiceStore.setState({ userVolumes: { "user-1": 1 } });
    useVoiceStore.getState().setUserVolume("user-2", 0.5);
    expect(useVoiceStore.getState().userVolumes["user-1"]).toBe(1);
    expect(useVoiceStore.getState().userVolumes["user-2"]).toBe(0.5);
  });
});

describe("reset", () => {
  it("resets all voice state to defaults", () => {
    useVoiceStore.setState({
      isConnected: true,
      isMuted: true,
      isDeafened: true,
      currentChannelId: 5,
    });
    useVoiceStore.getState().reset();
    const state = useVoiceStore.getState();
    expect(state.isConnected).toBe(false);
    expect(state.isMuted).toBe(false);
    expect(state.isDeafened).toBe(false);
    expect(state.currentChannelId).toBeNull();
    expect(state.room).toBeNull();
    expect(state.participants).toEqual([]);
    expect(state.activeSpeakerIds.size).toBe(0);
  });
});
