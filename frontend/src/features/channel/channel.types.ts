export type ChannelId = number;
export type ServerId = number;

export type ChannelType = "TEXTE" | "VOCAL";

export type ChannelBackendDto = {
  id: ChannelId;
  serveurId: ServerId;
  nom: string;
  type: ChannelType;
  creeLe: string;
  modifieLe: string;
};

export type ChannelDto = {
  id: ChannelId;
  serverId: ServerId;
  name: string;
  type: ChannelType;
  createdAtIso: string;
  updatedAtIso: string;
};
