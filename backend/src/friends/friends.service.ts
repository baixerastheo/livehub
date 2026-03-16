import { randomUUID } from 'node:crypto';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { PresenceService } from '../realtime/presence.service.js';

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

/**
 * Service de gestion des amis.
 * Gère les demandes d'amitié, les acceptations, les refus et la liste des amis.
 */
@Injectable()
export class FriendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly presence: PresenceService,
  ) {}

  /**
   * Récupère une demande d'amitié par son ID.
   * @param requestId - Identifiant de la demande
   * @returns La demande correspondante
   * @throws NotFoundException si la demande n'existe pas
   */
  private async findRequest(requestId: string) {
    const request = await this.prisma.demandeAmitie.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('Friend request not found');
    }
    return request;
  }

  /**
   * Vérifie qu'un utilisateur existe.
   * @param userId - Identifiant de l'utilisateur
   * @returns L'utilisateur correspondant
   * @throws NotFoundException si l'utilisateur n'existe pas
   */
  private async assertUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Vérifie qu'une relation d'amitié n'existe pas déjà entre deux utilisateurs.
   * @param a - Premier ID utilisateur
   * @param b - Second ID utilisateur
   * @throws BadRequestException si les utilisateurs sont déjà amis
   */
  private async assertNotAlreadyFriends(a: string, b: string) {
    const { userAId, userBId } = orderPair(a, b);
    const friendship = await this.prisma.amitie.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
      select: { id: true },
    });
    if (friendship) {
      throw new BadRequestException('Users are already friends');
    }
  }

  /**
   * Récupère la liste des amis d'un utilisateur avec leur statut de présence.
   * @param userId - Identifiant de l'utilisateur
   * @returns Liste des amis avec leur statut en ligne ou hors ligne
   */
  async listFriends(userId: string) {
    const rows = await this.prisma.amitie.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: { userA: true, userB: true },
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
      include: { fromUser: true, toUser: true },
      orderBy: { creeLe: 'desc' },
    });
  }

  /**
   * Envoie une demande d'amitié à un utilisateur.
   * @param fromUserId - Identifiant de l'expéditeur
   * @param toUserId - Identifiant du destinataire
   * @throws BadRequestException si l'envoi est à soi-même ou une demande existe déjà
   * @throws NotFoundException si le destinataire n'existe pas
   */
  async sendRequest(fromUserId: string, toUserId: string) {
    if (fromUserId === toUserId) {
      throw new BadRequestException('Cannot send a friend request to yourself');
    }

    await this.assertUserExists(toUserId);
    await this.assertNotAlreadyFriends(fromUserId, toUserId);

    const existingRequest = await this.prisma.demandeAmitie.findUnique({
      where: { fromUserId_toUserId: { fromUserId, toUserId } },
    });

    if (existingRequest?.statut === 'EN_ATTENTE') {
      throw new BadRequestException('Friend request already pending');
    }

    if (!existingRequest) {
      await this.prisma.demandeAmitie.create({
        data: { fromUserId, toUserId, statut: 'EN_ATTENTE' },
      });
    } else {
      await this.prisma.demandeAmitie.update({
        where: { id: existingRequest.id },
        data: { statut: 'EN_ATTENTE' },
      });
    }
  }

  /**
   * Accepte une demande d'amitié.
   * Crée la relation d'amitié et met à jour le statut de la demande.
   * @param requestId - Identifiant de la demande
   * @param currentUserId - Identifiant de l'utilisateur acceptant (doit être le destinataire)
   * @throws NotFoundException si la demande n'existe pas
   * @throws BadRequestException si la demande n'est pas en attente
   * @throws ForbiddenException si l'utilisateur n'est pas le destinataire
   */
  async acceptRequest(requestId: string, currentUserId: string) {
    const request = await this.findRequest(requestId);

    if (request.statut !== 'EN_ATTENTE') {
      throw new BadRequestException('Request is not pending');
    }
    if (request.toUserId !== currentUserId) {
      throw new ForbiddenException('Not allowed');
    }

    const { userAId, userBId } = orderPair(
      request.fromUserId,
      request.toUserId,
    );

    await this.prisma.$transaction([
      this.prisma.demandeAmitie.update({
        where: { id: requestId },
        data: { statut: 'ACCEPTEE' },
      }),
      this.prisma.amitie.create({
        data: { id: randomUUID(), userAId, userBId },
      }),
    ]);
  }

  /**
   * Refuse une demande d'amitié.
   * @param requestId - Identifiant de la demande
   * @param currentUserId - Identifiant de l'utilisateur refusant (doit être le destinataire)
   * @throws NotFoundException si la demande n'existe pas
   * @throws BadRequestException si la demande n'est pas en attente
   * @throws ForbiddenException si l'utilisateur n'est pas le destinataire
   */
  async declineRequest(requestId: string, currentUserId: string) {
    const request = await this.findRequest(requestId);

    if (request.statut !== 'EN_ATTENTE') {
      throw new BadRequestException('Request is not pending');
    }
    if (request.toUserId !== currentUserId) {
      throw new ForbiddenException('Not allowed');
    }

    await this.prisma.demandeAmitie.update({
      where: { id: requestId },
      data: { statut: 'REFUSEE' },
    });
  }
}
