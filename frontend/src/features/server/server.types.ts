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

