import { fetchJson } from "@/src/lib/apiClient";
import type {
  CreateServerBody,
  UpdateServerBody,
  UpdateMemberRoleBody,
  ServerDto,
  UserServerDto,
  ServerMemberDto,
  ServerBackendDto,
  UserServerBackendDto,
  ServerMemberBackendDto,
  ServerId,
  ListUserServersResponseDto,
  CreateServerPayload,
  CreateServerResponseDto,
  UpdateServerPayload,
  CreateChannelPayload,
  ListServerChannelsResponseDto,
  ChannelDto,
} from "./server.types";

function mapServer(dto: ServerBackendDto): ServerDto {
  return {
    id: dto.id,
    name: dto.nom,
    createdAtIso: dto.creeLe,
    updatedAtIso: dto.modifieLe,
  };
}

function mapUserServer(dto: UserServerBackendDto): UserServerDto {
  return {
    membershipId: dto.id,
    server: mapServer(dto.serveur),
    role: dto.role,
    joinedAtIso: dto.rejointLe,
  };
}

function mapServerMember(dto: ServerMemberBackendDto): ServerMemberDto {
  return {
    id: dto.id,
    serverId: dto.serveurId,
    userId: dto.userId,
    role: dto.role,
    joinedAtIso: dto.rejointLe,
    user: {
      id: dto.user.id,
      name: dto.user.name,
      email: dto.user.email,
      avatarUrl: dto.user.avatarUrl ?? null,
    },
  };
}

/* CRUD refacto : liste brute pour compatibilité */
export async function listUserServers(): Promise<ListUserServersResponseDto> {
  return fetchJson<ListUserServersResponseDto>("/servers", { method: "GET" });
}

export async function createServer(
  body: CreateServerBody | CreateServerPayload,
): Promise<ServerDto> {
  const server = await fetchJson<ServerBackendDto>("/servers", {
    method: "POST",
    body,
  });
  return mapServer(server);
}

export async function updateServer(
  id: ServerId,
  body: UpdateServerBody | UpdateServerPayload,
): Promise<ServerDto> {
  const server = await fetchJson<ServerBackendDto>(`/servers/${id}`, {
    method: "PUT",
    body,
  });
  return mapServer(server);
}

export async function deleteServer(id: ServerId): Promise<void> {
  await fetchJson<void>(`/servers/${id}`, {
    method: "DELETE",
  });
}

export async function getServerById(id: ServerId): Promise<ServerDto> {
  const server = await fetchJson<ServerBackendDto>(`/servers/${id}`, {
    method: "GET",
  });
  return mapServer(server);
}

export async function getUserServers(): Promise<UserServerDto[]> {
  const data = await fetchJson<UserServerBackendDto[]>("/servers", {
    method: "GET",
  });
  return data.map(mapUserServer);
}

export async function getServerMembers(
  id: ServerId,
): Promise<ServerMemberDto[]> {
  const data = await fetchJson<ServerMemberBackendDto[]>(
    `/servers/${id}/members`,
    { method: "GET" },
  );
  return data.map(mapServerMember);
}

export async function updateMemberRole(
  id: ServerId,
  userId: string,
  body: UpdateMemberRoleBody,
): Promise<ServerMemberDto> {
  const data = await fetchJson<ServerMemberBackendDto>(
    `/servers/${id}/members/${userId}`,
    { method: "PUT", body },
  );
  return mapServerMember(data);
}

export async function addServerMember(
  id: ServerId,
  userId: string,
): Promise<ServerMemberDto> {
  const data = await fetchJson<ServerMemberBackendDto>(`/servers/${id}/members`, {
    method: "POST",
    body: { userId },
  });
  return mapServerMember(data);
}

/* Refacto : canaux côté serveur */
export async function getServerChannels(
  serverId: number,
): Promise<ListServerChannelsResponseDto> {
  return fetchJson<ListServerChannelsResponseDto>(
    `/servers/${serverId}/channels`,
    { method: "GET" },
  );
}

export async function createChannel(
  serverId: number,
  payload: CreateChannelPayload,
): Promise<ChannelDto> {
  return fetchJson<ChannelDto>(`/servers/${serverId}/channels`, {
    method: "POST",
    body: payload,
  });
}

export const serverService = {
  listUserServers,
  createServer,
  updateServer,
  getServerChannels,
  createChannel,
};
