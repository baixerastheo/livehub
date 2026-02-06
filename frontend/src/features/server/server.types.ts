export type ServerDto = {
  id: number;
  nom: string;
  creeLe: string;
  modifieLe: string;
};

export type UserServerMembershipDto = {
  id: number;
  serveurId: number;
  userId: string;
  role: string;
  rejointLe: string;
  serveur: ServerDto;
};

export type ListUserServersResponseDto = UserServerMembershipDto[];

export type CreateServerPayload = { name: string };

export type CreateServerResponseDto = ServerDto;

export type UpdateServerPayload = { name: string };

export type ChannelDto = {
  id: number;
  serveurId: number;
  nom: string;
  creeLe: string;
  modifieLe: string;
};

export type CreateChannelPayload = { name: string };

export type ListServerChannelsResponseDto = ChannelDto[];

export type ServerKeysInput = { userId?: string | null };

export const serverKeys = {
  all: ["servers"] as const,
  lists: () => [...serverKeys.all, "list"] as const,
  list: (input: ServerKeysInput) => [...serverKeys.lists(), input] as const,
  channels: (serverId: number) =>
    [...serverKeys.all, "channels", serverId] as const,
};
