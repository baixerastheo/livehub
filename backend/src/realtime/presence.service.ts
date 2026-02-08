import { Injectable } from '@nestjs/common';

/**
 * Présence en mémoire : qui a au moins une connexion WebSocket ouverte.
 * Source de vérité pour "en ligne" (vert) vs "hors ligne" (rouge).
 * Au redémarrage du serveur, tout le monde est considéré hors ligne.
 */
@Injectable()
export class PresenceService {
  private readonly connectionCountByUserId = new Map<string, number>();

  /** Appelé à chaque nouvelle connexion WebSocket. */
  increment(userId: string): boolean {
    const prev = this.connectionCountByUserId.get(userId) ?? 0;
    this.connectionCountByUserId.set(userId, prev + 1);
    return prev === 0;
  }

  /** Appelé à chaque déconnexion WebSocket. */
  decrement(userId: string): boolean {
    const count = (this.connectionCountByUserId.get(userId) ?? 1) - 1;
    if (count <= 0) {
      this.connectionCountByUserId.delete(userId);
      return true;
    }
    this.connectionCountByUserId.set(userId, count);
    return false;
  }

  /** True si l'utilisateur a au moins une connexion active. */
  isOnline(userId: string): boolean {
    return (this.connectionCountByUserId.get(userId) ?? 0) > 0;
  }
}
