import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SupabaseStorageService } from '../supabase/supabase-storage.service';
import { MessageGateway } from '../realtime/message.gateway.js';
import { PresenceService } from '../realtime/presence.service.js';
import { ServerUtilsService } from './server-utils.service';
import { AddMember } from './dto/add-member.dto';
import { Role, StatutUtilisateur } from '../../generated/prisma/enums';

/**
 * Service de gestion des membres d'un serveur.
 * Gère l'adhésion, le départ, les rôles et le transfert de propriété.
 */
@Injectable()
export class ServerMemberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseStorage: SupabaseStorageService,
    private readonly messageGateway: MessageGateway,
    private readonly presence: PresenceService,
    private readonly utils: ServerUtilsService,
  ) {}

  /**
   * Permet à un utilisateur de rejoindre un serveur.
   * Vérifie l'absence de ban actif avant d'autoriser l'accès.
   * @param serverId - Identifiant du serveur
   * @param userId - Identifiant de l'utilisateur
   * @returns Le nouveau membre
   * @throws NotFoundException si le serveur n'existe pas
   * @throws ConflictException si l'utilisateur est déjà membre
   * @throws ForbiddenException si l'utilisateur est banni
   */
  async joinServer(serverId: number, userId: string) {
    await this.utils.assertServerExists(serverId);

    const existingMember = await this.prisma.membreServeur.findUnique({
      where: { userId_serveurId: { userId, serveurId: serverId } },
    });
    if (existingMember) {
      throw new ConflictException('You are already a member of this server');
    }

    const ban = await this.prisma.banServeur.findUnique({
      where: { userId_serveurId: { userId, serveurId: serverId } },
    });
    if (ban) {
      if (!ban.expireLe || ban.expireLe > new Date()) {
        throw new ForbiddenException('You are banned from this server');
      }
      await this.prisma.banServeur.delete({ where: { id: ban.id } });
    }

    return this.prisma.membreServeur.create({
      data: { serveurId: serverId, userId, role: Role.MEMBRE },
      include: { serveur: true, user: true },
    });
  }

  /**
   * Ajoute un utilisateur à un serveur (action d'un admin/proprio).
   * Supprime un éventuel ban expiré avant d'ajouter le membre.
   * @param serverId - Identifiant du serveur
   * @param currentUserId - Utilisateur qui effectue l'action
   * @param payload - Données avec l'identifiant de l'utilisateur à ajouter
   * @returns Le nouveau membre
   * @throws NotFoundException si le serveur n'existe pas
   * @throws ForbiddenException si l'utilisateur n'est pas admin/propriétaire
   * @throws ConflictException si l'utilisateur cible est déjà membre
   */
  async addMember(serverId: number, currentUserId: string, payload: AddMember) {
    await this.utils.assertServerExists(serverId);

    const actingMember = await this.utils.assertServerMember(
      currentUserId,
      serverId,
    );
    this.utils.assertAdminRole(actingMember.role);

    const targetUserId = payload.userId;
    if (currentUserId === targetUserId) {
      throw new BadRequestException('You are already a member of this server');
    }

    const existingMember = await this.prisma.membreServeur.findUnique({
      where: {
        userId_serveurId: { userId: targetUserId, serveurId: serverId },
      },
    });
    if (existingMember) {
      throw new ConflictException(
        'This user is already a member of the server',
      );
    }

    await this.prisma.banServeur.deleteMany({
      where: { userId: targetUserId, serveurId: serverId },
    });

    const newMember = await this.prisma.membreServeur.create({
      data: { serveurId: serverId, userId: targetUserId, role: Role.MEMBRE },
      include: { user: true, serveur: true },
    });

    const avatarUrl = await this.supabaseStorage.resolveAvatarUrl(
      newMember.user.avatarPath,
    );
    const { avatarPath: _avatarPath, ...userRest } = newMember.user;

    this.messageGateway.emitServerMemberJoined(serverId, {
      id: newMember.id,
      serveurId: newMember.serveurId,
      userId: newMember.userId,
      role: newMember.role,
      rejointLe: newMember.rejointLe.toISOString(),
      user: {
        id: userRest.id,
        name: userRest.name ?? '',
        email: userRest.email,
        avatarUrl,
      },
    });

    this.messageGateway.emitUserAddedToServer(targetUserId, {
      serverId,
      serverName: newMember.serveur.nom,
      role: newMember.role,
    });

    return newMember;
  }

  /**
   * Permet à un utilisateur de quitter un serveur.
   * Si le propriétaire est le dernier membre, le serveur est supprimé.
   * @param serverId - Identifiant du serveur
   * @param userId - Identifiant de l'utilisateur
   * @returns Le membre supprimé ou le serveur supprimé
   * @throws ForbiddenException si l'utilisateur n'est pas membre
   * @throws BadRequestException si le propriétaire tente de quitter sans transférer
   */
  async leaveServer(serverId: number, userId: string) {
    const member = await this.utils.assertServerMember(userId, serverId);

    if (member.role === Role.PROPRIETAIRE) {
      const memberCount = await this.prisma.membreServeur.count({
        where: { serveurId: serverId },
      });

      if (memberCount === 1) {
        return this.prisma.serveur.delete({ where: { id: serverId } });
      }

      throw new BadRequestException(
        'You must transfer ownership to another member before leaving the server',
      );
    }

    return this.prisma.membreServeur.delete({ where: { id: member.id } });
  }

  /**
   * Récupère tous les membres d'un serveur avec leur statut de présence et avatar.
   * @param serverId - Identifiant du serveur
   * @returns Liste des membres avec leurs infos utilisateur
   * @throws NotFoundException si le serveur n'existe pas
   */
  async getServerMembers(serverId: number) {
    await this.utils.assertServerExists(serverId);

    const members = await this.prisma.membreServeur.findMany({
      where: { serveurId: serverId },
      include: { user: true },
    });

    return Promise.all(
      members.map(async (m) => {
        const avatarUrl = await this.supabaseStorage.resolveAvatarUrl(
          m.user.avatarPath,
        );
        const { avatarPath: _avatarPath, ...userRest } = m.user;
        const statut = this.presence.isOnline(m.userId)
          ? StatutUtilisateur.EN_LIGNE
          : StatutUtilisateur.HORS_LIGNE;
        return { ...m, user: { ...userRest, avatarUrl, statut } };
      }),
    );
  }

  /**
   * Met à jour le rôle d'un membre dans un serveur.
   * Seul le propriétaire peut modifier les rôles.
   * @param serverId - Identifiant du serveur
   * @param targetUserId - Identifiant du membre dont on change le rôle
   * @param newRole - Nouveau rôle à attribuer
   * @param actingUserId - Identifiant du propriétaire qui effectue l'action
   * @returns Le membre mis à jour
   * @throws ForbiddenException si l'utilisateur n'est pas propriétaire
   * @throws NotFoundException si le membre cible n'est pas dans le serveur
   * @throws ForbiddenException si on tente de changer le rôle du propriétaire
   */
  async updateMemberRole(
    serverId: number,
    targetUserId: string,
    newRole: Role,
    actingUserId: string,
  ) {
    const actingMember = await this.utils.assertServerMember(
      actingUserId,
      serverId,
    );
    if (actingMember.role !== Role.PROPRIETAIRE) {
      throw new ForbiddenException(
        'Only the server owner can change member roles',
      );
    }

    const targetMember = await this.prisma.membreServeur.findUnique({
      where: {
        userId_serveurId: { userId: targetUserId, serveurId: serverId },
      },
    });
    if (!targetMember) {
      throw new NotFoundException('This user is not a member of this server');
    }
    if (targetMember.role === Role.PROPRIETAIRE) {
      throw new ForbiddenException('Cannot change the owner role');
    }

    return this.prisma.membreServeur.update({
      where: { id: targetMember.id },
      data: { role: newRole },
      include: { user: true, serveur: true },
    });
  }

  /**
   * Transfère la propriété d'un serveur à un autre membre.
   * L'ancien propriétaire devient ADMINISTRATEUR, le nouveau devient PROPRIETAIRE.
   * @param serverId - Identifiant du serveur
   * @param newOwnerId - Identifiant du nouveau propriétaire
   * @param currentOwnerId - Identifiant de l'actuel propriétaire
   * @returns Les identifiants du nouveau et de l'ancien propriétaire
   * @throws ForbiddenException si l'utilisateur n'est pas propriétaire
   * @throws NotFoundException si le membre cible n'est pas dans le serveur
   * @throws BadRequestException si le transfert est vers soi-même
   */
  async transferOwnership(
    serverId: number,
    newOwnerId: string,
    currentOwnerId: string,
  ) {
    const actingMember = await this.utils.assertServerMember(
      currentOwnerId,
      serverId,
    );
    if (actingMember.role !== Role.PROPRIETAIRE) {
      throw new ForbiddenException(
        'Only the server owner can transfer ownership',
      );
    }

    if (newOwnerId === currentOwnerId) {
      throw new BadRequestException('Cannot transfer ownership to yourself');
    }

    const targetMember = await this.prisma.membreServeur.findUnique({
      where: { userId_serveurId: { userId: newOwnerId, serveurId: serverId } },
    });
    if (!targetMember) {
      throw new NotFoundException('Target user is not a member of this server');
    }

    await this.prisma.$transaction([
      this.prisma.membreServeur.update({
        where: { id: targetMember.id },
        data: { role: Role.PROPRIETAIRE },
      }),
      this.prisma.membreServeur.update({
        where: { id: actingMember.id },
        data: { role: Role.ADMINISTRATEUR },
      }),
    ]);

    this.messageGateway.emitServerOwnershipTransferred(serverId, {
      newOwnerId,
      previousOwnerId: currentOwnerId,
    });

    return { newOwnerId, previousOwnerId: currentOwnerId };
  }
}
