import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { PresenceService } from '../realtime/presence.service.js';
import { err, ok, Result } from '../result.js';

/**
 * Ordonne une paire d'IDs utilisateurs de manière déterministe.
 * Utilisé pour garantir l'unicité des relations d'amitié bidirectionnelles.
 * @param a - Premier ID utilisateur
 * @param b - Second ID utilisateur
 * @returns Objet avec userAId (le plus petit) et userBId (le plus grand)
 */
function orderPair(a: string, b: string): { userAId: string; userBId: string } {
  return a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a };
}

export type FriendsErrorCode =
  | 'SELF'
  | 'USER_NOT_FOUND'
  | 'ALREADY_FRIENDS'
  | 'REQUEST_PENDING'
  | 'REQUEST_NOT_FOUND'
  | 'REQUEST_NOT_PENDING'
  | 'NOT_ALLOWED'
  | 'UNKNOWN';

export type FriendsError = { code: FriendsErrorCode; message: string };

@Injectable()
export class FriendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly presence: PresenceService,
  ) {}

  /**
   * Récupère la liste des amis d'un utilisateur.
   * @param userId - Identifiant de l'utilisateur
   * @returns Liste des amis avec leurs informations publiques
   */
  async listFriends(userId: string) {
    const rows = await this.prisma.amitie.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: true,
        userB: true,
      },
    });

    return rows.map((r) => {
      const friend = r.userAId === userId ? r.userB : r.userA;
      return {
        ...friend,
        statut: this.presence.isOnline(friend.id) ? 'EN_LIGNE' : 'HORS_LIGNE',
      };
    });
  }

  /**
   * Récupère les demandes d'amitié en attente (envoyées et reçues).
   * @param userId - Identifiant de l'utilisateur
   * @returns Liste des demandes avec les infos des utilisateurs concernés
   */
  async listRequests(userId: string) {
    return this.prisma.demandeAmitie.findMany({
      where: {
        statut: 'EN_ATTENTE',
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      include: {
        fromUser: true,
        toUser: true,
      },
      orderBy: { creeLe: 'desc' },
    });
  }

  /**
   * Envoie une demande d'amitié à un utilisateur.
   * Vérifie que la demande est valide (pas soi-même, utilisateur existe, pas déjà amis).
   * @param fromUserId - Identifiant de l'expéditeur
   * @param toUserId - Identifiant du destinataire
   * @returns Succès ou erreur avec code explicite
   */
  async sendRequest(
    fromUserId: string,
    toUserId: string,
  ): Promise<Result<void, FriendsError>> {
    if (fromUserId === toUserId) {
      return err({
        code: 'SELF',
        message: 'Cannot send a friend request to yourself',
      });
    }

    const toUser = await this.prisma.user.findUnique({
      where: { id: toUserId },
      select: { id: true },
    });
    if (!toUser) {
      return err({ code: 'USER_NOT_FOUND', message: 'User not found' });
    }

    const { userAId, userBId } = orderPair(fromUserId, toUserId);
    const existingFriendship = await this.prisma.amitie.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
      select: { id: true },
    });
    if (existingFriendship) {
      return err({ code: 'ALREADY_FRIENDS', message: 'Already friends' });
    }

    const existingRequest = await this.prisma.demandeAmitie.findUnique({
      where: { fromUserId_toUserId: { fromUserId, toUserId } },
    });
    if (existingRequest?.statut === 'EN_ATTENTE') {
      return err({
        code: 'REQUEST_PENDING',
        message: 'Friend request already pending',
      });
    }

    if (!existingRequest) {
      await this.prisma.demandeAmitie.create({
        data: {
          fromUserId,
          toUserId,
          statut: 'EN_ATTENTE',
        },
      });
    } else {
      if (existingRequest.statut === 'ACCEPTEE') {
        return err({ code: 'ALREADY_FRIENDS', message: 'Already friends' });
      }
      await this.prisma.demandeAmitie.update({
        where: { id: existingRequest.id },
        data: { statut: 'EN_ATTENTE' },
      });
    }

    return ok(undefined);
  }

  /**
   * Accepte une demande d'amitié.
   * Crée la relation d'amitié et met à jour le statut de la demande.
   * @param requestId - Identifiant de la demande
   * @param currentUserId - Identifiant de l'utilisateur acceptant (doit être le destinataire)
   * @returns Succès ou erreur avec code explicite
   */
  async acceptRequest(
    requestId: string,
    currentUserId: string,
  ): Promise<Result<void, FriendsError>> {
    const request = await this.prisma.demandeAmitie.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      return err({ code: 'REQUEST_NOT_FOUND', message: 'Request not found' });
    }
    if (request.statut !== 'EN_ATTENTE') {
      return err({
        code: 'REQUEST_NOT_PENDING',
        message: 'Request is not pending',
      });
    }
    if (request.toUserId !== currentUserId) {
      return err({ code: 'NOT_ALLOWED', message: 'Not allowed' });
    }

    const { userAId, userBId } = orderPair(
      request.fromUserId,
      request.toUserId,
    );

    try {
      await this.prisma.$transaction([
        this.prisma.demandeAmitie.update({
          where: { id: requestId },
          data: { statut: 'ACCEPTEE' },
        }),
        this.prisma.amitie.create({
          data: {
            id: randomUUID(),
            userAId,
            userBId,
          },
        }),
      ]);
    } catch {
      return err({ code: 'UNKNOWN', message: 'Unable to accept request' });
    }

    return ok(undefined);
  }

  /**
   * Refuse une demande d'amitié.
   * @param requestId - Identifiant de la demande
   * @param currentUserId - Identifiant de l'utilisateur refusant (doit être le destinataire)
   * @returns Succès ou erreur avec code explicite
   */
  async declineRequest(
    requestId: string,
    currentUserId: string,
  ): Promise<Result<void, FriendsError>> {
    const request = await this.prisma.demandeAmitie.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      return err({ code: 'REQUEST_NOT_FOUND', message: 'Request not found' });
    }
    if (request.statut !== 'EN_ATTENTE') {
      return err({
        code: 'REQUEST_NOT_PENDING',
        message: 'Request is not pending',
      });
    }
    if (request.toUserId !== currentUserId) {
      return err({ code: 'NOT_ALLOWED', message: 'Not allowed' });
    }

    await this.prisma.demandeAmitie.update({
      where: { id: requestId },
      data: { statut: 'REFUSEE' },
    });

    return ok(undefined);
  }
}
