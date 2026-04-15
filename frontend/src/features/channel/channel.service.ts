import { fetchJson } from "@/src/lib/apiClient";
import type { ChannelBackendDto, ChannelDto } from "./channel.types";

function mapChannel(dto: ChannelBackendDto): ChannelDto {
  return {
    id: dto.id,
    serverId: dto.serveurId,
    name: dto.nom,
    type: dto.type ?? "TEXTE",
    createdAtIso: dto.creeLe,
    updatedAtIso: dto.modifieLe,
  };
}

export async function getChannelsByServer(
  serverId: number,
): Promise<ChannelDto[]> {
  const data = await fetchJson<ChannelBackendDto[]>(
    `/servers/${serverId}/channels`,
    { method: "GET" },
  );
  return data.map(mapChannel);
}

export async function getChannelById(channelId: number): Promise<ChannelDto> {
  const dto = await fetchJson<ChannelBackendDto>(`/channels/${channelId}`, {
    method: "GET",
  });
  return mapChannel(dto);
}

export async function deleteChannel(channelId: number): Promise<void> {
  await fetchJson<void>(`/channels/${channelId}`, {
    method: "DELETE",
  });
}

export type ChannelMessageBackendDto = {
  id: number;
  contenu: string;
  creeLe: string;
  auteurId: string;
  auteur: { id: string; name: string | null; email: string; avatarUrl?: string | null };
  reactions?: { emoji: string; count: number; userIds: string[] }[];
};

export async function getChannelMessages(
  channelId: number,
): Promise<ChannelMessageBackendDto[]> {
  return fetchJson<ChannelMessageBackendDto[]>(
    `/channels/${channelId}/messages`,
    { method: "GET" },
  );
}

export async function sendChannelMessage(
  channelId: number,
  content: string,
): Promise<ChannelMessageBackendDto> {
  return fetchJson<ChannelMessageBackendDto>(
    `/channels/${channelId}/messages`,
    { method: "POST", body: { content } },
  );
}

export async function deleteChannelMessage(messageId: number): Promise<void> {
  await fetchJson<void>(`/messages/${messageId}`, {
    method: "DELETE",
  });
}
