export type ServerId = number;

export type ServerRole = "PROPRIETAIRE" | "ADMINISTRATEUR" | "MEMBRE";

export type CreateServerBody = {
  name: string;
};

export type UpdateServerBody = {
  name?: string;
};

export type UpdateMemberRoleBody = {
  role: ServerRole;
};

export type ServerBackendDto = {
  id: ServerId;
  nom: string;
  creeLe: string;
  modifieLe: string;
};

export type UserServerBackendDto = {
  id: number;
  serveurId: ServerId;
  userId: string;
  role: ServerRole;
  rejointLe: string;
  serveur: ServerBackendDto;
};

export type ServerMemberBackendDto = {
  id: number;
  serveurId: ServerId;
  userId: string;
  role: ServerRole;
  rejointLe: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
};

export type ServerDto = {
  id: ServerId;
  name: string;
  createdAtIso: string;
  updatedAtIso: string;
};

export type UserServerDto = {
  membershipId: number;
  server: ServerDto;
  role: ServerRole;
  joinedAtIso: string;
};

export type ServerMemberUserDto = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
};

export type ServerMemberDto = {
  id: number;
  serverId: ServerId;
  userId: string;
  role: ServerRole;
  joinedAtIso: string;
  user: ServerMemberUserDto;
};

/* Types / clés de la refacto CRUD */
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
  members: (serverId: number) =>
    [...serverKeys.all, "members", serverId] as const,
};
