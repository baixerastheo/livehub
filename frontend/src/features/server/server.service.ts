import { fetchJson } from "@/src/lib/apiClient";
import type {
  ListUserServersResponseDto,
  CreateServerPayload,
  CreateServerResponseDto,
  ServerDto,
  UpdateServerPayload,
  CreateChannelPayload,
  ListServerChannelsResponseDto,
  ChannelDto,
} from "@/src/features/server/server.types";

export async function listUserServers(): Promise<ListUserServersResponseDto> {
  return fetchJson<ListUserServersResponseDto>("/servers", { method: "GET" });
}

export async function createServer(
  payload: CreateServerPayload,
): Promise<CreateServerResponseDto> {
  return fetchJson<CreateServerResponseDto>("/servers", {
    method: "POST",
    body: payload,
  });
}

export async function updateServer(
  serverId: number,
  payload: UpdateServerPayload,
): Promise<ServerDto> {
  return fetchJson<ServerDto>(`/servers/${serverId}`, {
    method: "PUT",
    body: payload,
  });
}

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
