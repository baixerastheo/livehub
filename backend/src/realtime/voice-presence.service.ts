import { Injectable } from '@nestjs/common';

export type VoiceParticipant = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  isMuted: boolean;
};

/**
 * Présence vocale en mémoire : qui est dans quel canal vocal.
 * Keyed par channelId → socketId → VoiceParticipant.
 * Au redémarrage du serveur, tous les canaux sont vides.
 */
@Injectable()
export class VoicePresenceService {
  /** channelId → socketId → participant */
  private readonly rooms = new Map<number, Map<string, VoiceParticipant>>();

  /** socketId → { channelId, serverId } pour le nettoyage au disconnect */
  private readonly socketMeta = new Map<
    string,
    { channelId: number; serverId: number }
  >();

  /**
   * Enregistre l'entrée d'un socket dans un canal vocal.
   * Si le socket était déjà dans un autre canal, il en est retiré.
   */
  join(
    channelId: number,
    serverId: number,
    socketId: string,
    participant: VoiceParticipant,
  ): void {
    const prev = this.socketMeta.get(socketId);
    if (prev) this.removeFromRoom(prev.channelId, socketId);

    if (!this.rooms.has(channelId)) {
      this.rooms.set(channelId, new Map());
    }
    this.rooms.get(channelId)!.set(socketId, participant);
    this.socketMeta.set(socketId, { channelId, serverId });
  }

  /**
   * Retire un socket du canal vocal qu'il occupe.
   * Retourne les métadonnées du canal quitté, ou null si le socket n'était dans aucun canal.
   */
  leave(socketId: string): { channelId: number; serverId: number } | null {
    const meta = this.socketMeta.get(socketId);
    if (!meta) return null;
    this.removeFromRoom(meta.channelId, socketId);
    this.socketMeta.delete(socketId);
    return meta;
  }

  /**
   * Met à jour l'état mute d'un socket dans son canal vocal.
   * Retourne les métadonnées du canal ou null si le socket n'est pas en voice.
   */
  setMuted(
    socketId: string,
    isMuted: boolean,
  ): { channelId: number; serverId: number } | null {
    const meta = this.socketMeta.get(socketId);
    if (!meta) return null;
    const room = this.rooms.get(meta.channelId);
    const participant = room?.get(socketId);
    if (participant) {
      room!.set(socketId, { ...participant, isMuted });
    }
    return meta;
  }

  /** Retourne la liste des participants d'un canal vocal. */
  getParticipants(channelId: number): VoiceParticipant[] {
    return [...(this.rooms.get(channelId)?.values() ?? [])];
  }

  private removeFromRoom(channelId: number, socketId: string): void {
    const room = this.rooms.get(channelId);
    if (!room) return;
    room.delete(socketId);
    if (room.size === 0) this.rooms.delete(channelId);
  }
}
