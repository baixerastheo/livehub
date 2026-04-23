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
import { ServerUtilsService } from './server-utils.service';
import { BanMember } from './dto/ban-member.dto';
import { Role, TypeNotification } from '../../generated/prisma/enums';
import { NotificationService } from '../notification/notification.service';

/**
 * Service de gestion des bans et kicks sur un serveur.
 * Gère le bannissement, le débannissement et la consultation des bans.
 */
@Injectable()
export class ServerBanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseStorage: SupabaseStorageService,
    private readonly messageGateway: MessageGateway,
    private readonly utils: ServerUtilsService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Bannit un membre d'un serveur.
   * Le membre est supprimé du serveur et un enregistrement de ban est créé.
   * @param serverId - Identifiant du serveur
   * @param actingUserId - Identifiant de l'admin/propriétaire qui effectue l'action
   * @param payload - Données du ban (userId cible, raison optionnelle, date d'expiration optionnelle)
   * @returns Le ban créé
   * @throws ForbiddenException si l'utilisateur n'est pas admin/propriétaire
   * @throws BadRequestException si l'utilisateur tente de se bannir lui-même
   * @throws NotFoundException si le membre cible n'est pas dans le serveur
   * @throws ForbiddenException si on tente de bannir le propriétaire
   * @throws ConflictException si l'utilisateur est déjà banni
   */
  async banMember(serverId: number, actingUserId: string, payload: BanMember) {
    const actingMember = await this.utils.assertServerMember(
      actingUserId,
      serverId,
    );
    this.utils.assertAdminRole(actingMember.role);

    if (actingUserId === payload.userId) {
      throw new BadRequestException('You cannot ban yourself');
    }

    const targetMember = await this.prisma.membreServeur.findUnique({
      where: {
        userId_serveurId: { userId: payload.userId, serveurId: serverId },
      },
    });
    if (!targetMember) {
      throw new NotFoundException('This user is not a member of this server');
    }
    if (targetMember.role === Role.PROPRIETAIRE) {
      throw new ForbiddenException('Cannot ban the server owner');
    }
    if (
      targetMember.role === Role.ADMINISTRATEUR &&
      actingMember.role !== Role.PROPRIETAIRE
    ) {
      throw new ForbiddenException(
        'Only the server owner can ban an administrator',
      );
    }

    const existingBan = await this.prisma.banServeur.findUnique({
      where: {
        userId_serveurId: { userId: payload.userId, serveurId: serverId },
      },
    });
    if (existingBan) {
      throw new ConflictException(
        'This user is already banned from this server',
      );
    }

    const ban = await this.prisma.$transaction(async (tx) => {
      const newBan = await tx.banServeur.create({
        data: {
          serveurId: serverId,
          userId: payload.userId,
          bannePar: actingUserId,
          raison: payload.raison ?? null,
          expireLe: payload.expireLe ? new Date(payload.expireLe) : null,
        },
      });
      await tx.membreServeur.delete({ where: { id: targetMember.id } });
      return newBan;
    });

    this.messageGateway.emitServerMemberBanned(serverId, {
      bannedUserId: payload.userId,
      bannedByUserId: actingUserId,
      raison: ban.raison,
      expireLe: ban.expireLe ? ban.expireLe.toISOString() : null,
    });

    void this.notificationService.create(
      payload.userId,
      TypeNotification.BANNED,
      {
        serverId,
        raison: ban.raison,
        expireLe: ban.expireLe ? ban.expireLe.toISOString() : null,
      },
    );

    return ban;
  }

  /**
   * Lève le ban d'un utilisateur sur un serveur.
   * @param serverId - Identifiant du serveur
   * @param actingUserId - Identifiant de l'admin/propriétaire qui effectue l'action
   * @param targetUserId - Identifiant de l'utilisateur à débannir
   * @returns Le ban supprimé
   * @throws ForbiddenException si l'utilisateur n'est pas admin/propriétaire
   * @throws NotFoundException si l'utilisateur n'est pas banni
   */
  async unbanMember(
    serverId: number,
    actingUserId: string,
    targetUserId: string,
  ) {
    const actingMember = await this.utils.assertServerMember(
      actingUserId,
      serverId,
    );
    this.utils.assertAdminRole(actingMember.role);

    const ban = await this.prisma.banServeur.findUnique({
      where: {
        userId_serveurId: { userId: targetUserId, serveurId: serverId },
      },
    });
    if (!ban) {
      throw new NotFoundException('This user is not banned from this server');
    }

    const deleted = await this.prisma.banServeur.delete({
      where: { id: ban.id },
    });

    this.messageGateway.emitServerMemberUnbanned(serverId, {
      unbannedUserId: targetUserId,
      unbannedByUserId: actingUserId,
    });

    return deleted;
  }

  /**
   * Récupère la liste des bans actifs d'un serveur.
   * @param serverId - Identifiant du serveur
   * @param actingUserId - Identifiant de l'admin/propriétaire qui effectue la requête
   * @returns Liste des bans avec les infos de l'utilisateur banni et du bannisseur
   * @throws ForbiddenException si l'utilisateur n'est pas admin/propriétaire
   */
  async getBans(serverId: number, actingUserId: string) {
    const actingMember = await this.utils.assertServerMember(
      actingUserId,
      serverId,
    );
    this.utils.assertAdminRole(actingMember.role);

    const bans = await this.prisma.banServeur.findMany({
      where: { serveurId: serverId },
      include: { user: true, banneur: true },
    });

    return Promise.all(
      bans.map(async (ban) => {
        const avatarUrl = await this.supabaseStorage.resolveAvatarUrl(
          ban.user.avatarPath,
        );
        const { avatarPath: _avatarPath, ...userRest } = ban.user;
        return { ...ban, user: { ...userRest, avatarUrl } };
      }),
    );
  }

  /**
   * Expulse un membre d'un serveur sans le bannir.
   * @param serverId - Identifiant du serveur
   * @param actingUserId - Identifiant de l'admin/propriétaire qui effectue l'action
   * @param targetUserId - Identifiant de l'utilisateur à expulser
   * @throws ForbiddenException si l'utilisateur n'est pas admin/propriétaire
   * @throws BadRequestException si l'utilisateur tente de se kick lui-même
   * @throws NotFoundException si le membre cible n'est pas dans le serveur
   * @throws ForbiddenException si on tente de kick le propriétaire
   */
  async kickMember(
    serverId: number,
    actingUserId: string,
    targetUserId: string,
  ) {
    const actingMember = await this.utils.assertServerMember(
      actingUserId,
      serverId,
    );
    this.utils.assertAdminRole(actingMember.role);

    if (actingUserId === targetUserId) {
      throw new BadRequestException('You cannot kick yourself');
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
      throw new ForbiddenException('Cannot kick the server owner');
    }
    if (
      targetMember.role === Role.ADMINISTRATEUR &&
      actingMember.role !== Role.PROPRIETAIRE
    ) {
      throw new ForbiddenException(
        'Only the server owner can kick an administrator',
      );
    }

    await this.prisma.membreServeur.delete({ where: { id: targetMember.id } });

    this.messageGateway.emitServerMemberKicked(serverId, {
      kickedUserId: targetUserId,
      kickedByUserId: actingUserId,
    });

    void this.notificationService.create(
      targetUserId,
      TypeNotification.KICKED,
      { serverId },
    );
  }
}
