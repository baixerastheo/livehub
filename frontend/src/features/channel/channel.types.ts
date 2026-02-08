export type ChannelId = number;
export type ServerId = number;

export type ChannelBackendDto = {
  id: ChannelId;
  serveurId: ServerId;
  nom: string;
  creeLe: string;
  modifieLe: string;
};

export type ChannelDto = {
  id: ChannelId;
  serverId: ServerId;
  name: string;
  createdAtIso: string;
  updatedAtIso: string;
};
