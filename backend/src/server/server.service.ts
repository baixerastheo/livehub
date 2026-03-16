import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SupabaseStorageService } from '../supabase/supabase-storage.service';
import { MessageGateway } from '../realtime/message.gateway.js';
import { PresenceService } from '../realtime/presence.service.js';
import { CreateServer } from './dto/create-server.dto';
import { UpdateServer } from './dto/update-server.dto';
import { AddMember } from './dto/add-member.dto';
import { Role, StatutUtilisateur } from '../../generated/prisma/enums';

/**
 * Service de gestion des serveurs.
 * Gère la création, la suppression, la mise à jour des serveurs et leurs membres.
 */
@Injectable()
export class ServerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseStorage: SupabaseStorageService,
    private readonly messageGateway: MessageGateway,
    private readonly presence: PresenceService,
  ) {}

  /**
   * Récupère un serveur par son ID ou lève une exception s'il n'existe pas.
   * @param id - Identifiant du serveur
   * @returns Le serveur correspondant
   * @throws NotFoundException si le serveur n'existe pas
   */
  private async assertServerExists(id: number) {
    const server = await this.prisma.serveur.findUnique({ where: { id } });
    if (!server) {
      throw new NotFoundException(`Server with ID ${id} not found`);
    }
    return server;
  }

  /**
   * Récupère un membre d'un serveur ou lève une exception s'il n'existe pas.
   * @param userId - Identifiant de l'utilisateur
   * @param serverId - Identifiant du serveur
   * @returns Le membre correspondant
   * @throws ForbiddenException si l'utilisateur n'est pas membre
   */
  private async assertServerMember(userId: string, serverId: number) {
    const member = await this.prisma.membreServeur.findUnique({
      where: { userId_serveurId: { userId, serveurId: serverId } },
    });
    if (!member) {
      throw new ForbiddenException('You are not a member of this server');
    }
    return member;
  }

  /**
   * Vérifie que le membre est propriétaire ou administrateur.
   * @param role - Rôle du membre
   * @throws ForbiddenException si le rôle est insuffisant
   */
  private assertAdminRole(role: Role) {
    if (role !== Role.PROPRIETAIRE && role !== Role.ADMINISTRATEUR) {
      throw new ForbiddenException(
        'Only owners and administrators can perform this action',
      );
    }
  }

  /**
   * Récupère tous les serveurs auxquels appartient un utilisateur.
   * @param userId - Identifiant de l'utilisateur
   * @returns Liste des appartenances avec les infos du serveur
   */
  async getUserServers(userId: string) {
    return this.prisma.membreServeur.findMany({
      where: { userId },
      include: { serveur: true },
    });
  }

  /**
   * Récupère un serveur par son ID.
   * @param id - Identifiant du serveur
   * @returns Le serveur correspondant
   * @throws NotFoundException si le serveur n'existe pas
   */
  async getServerById(id: number) {
    return this.assertServerExists(id);
  }

  /**
   * Crée un nouveau serveur avec le créateur comme propriétaire et un canal "general" par défaut.
   * @param data - Données du serveur à créer
   * @param creatorId - Identifiant du créateur
   * @returns Le serveur créé
   */
  async createServer(data: CreateServer, creatorId: string) {
    const server = await this.prisma.serveur.create({
      data: { nom: data.name },
    });

    await this.prisma.membreServeur.create({
      data: {
        serveurId: server.id,
        userId: creatorId,
        role: Role.PROPRIETAIRE,
      },
    });

    await this.prisma.canal.create({
      data: { serveurId: server.id, nom: 'general' },
    });

    return server;
  }

  /**
   * Met à jour les informations d'un serveur.
   * @param id - Identifiant du serveur
   * @param data - Nouvelles données du serveur
   * @returns Le serveur mis à jour
   * @throws NotFoundException si le serveur n'existe pas
   */
  async updateServer(id: number, data: UpdateServer) {
    await this.assertServerExists(id);

    return this.prisma.serveur.update({
      where: { id },
      data: { nom: data.name },
    });
  }

  /**
   * Supprime un serveur.
   * @param id - Identifiant du serveur à supprimer
   * @returns Le serveur supprimé
   * @throws NotFoundException si le serveur n'existe pas
   */
  async deleteServer(id: number) {
    await this.assertServerExists(id);
    return this.prisma.serveur.delete({ where: { id } });
  }

  /**
   * Permet à un utilisateur de rejoindre un serveur.
   * @param serverId - Identifiant du serveur
   * @param userId - Identifiant de l'utilisateur
   * @returns Le nouveau membre
   * @throws NotFoundException si le serveur n'existe pas
   * @throws ConflictException si l'utilisateur est déjà membre
   */
  async joinServer(serverId: number, userId: string) {
    await this.assertServerExists(serverId);

    const existingMember = await this.prisma.membreServeur.findUnique({
      where: { userId_serveurId: { userId, serveurId: serverId } },
    });
    if (existingMember) {
      throw new ConflictException('You are already a member of this server');
    }

    return this.prisma.membreServeur.create({
      data: { serveurId: serverId, userId, role: Role.MEMBRE },
      include: { serveur: true, user: true },
    });
  }

  /**
   * Ajoute un utilisateur à un serveur (action d'un admin/proprio).
   * @param serverId - Identifiant du serveur
   * @param currentUserId - Utilisateur qui effectue l'action
   * @param payload - Données avec l'identifiant de l'utilisateur à ajouter
   * @returns Le nouveau membre
   * @throws NotFoundException si le serveur n'existe pas
   * @throws ForbiddenException si l'utilisateur n'est pas admin/propriétaire
   * @throws ConflictException si l'utilisateur cible est déjà membre
   */
  async addMember(serverId: number, currentUserId: string, payload: AddMember) {
    await this.assertServerExists(serverId);

    const actingMember = await this.assertServerMember(currentUserId, serverId);
    this.assertAdminRole(actingMember.role);

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

    const newMember = await this.prisma.membreServeur.create({
      data: { serveurId: serverId, userId: targetUserId, role: Role.MEMBRE },
      include: { user: true, serveur: true },
    });

    let avatarUrl: string | null = null;
    if (newMember.user.avatarPath) {
      try {
        avatarUrl = await this.supabaseStorage.publicUrl(
          newMember.user.avatarPath,
        );
      } catch {
        avatarUrl = null;
      }
    }

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
    const actingMember = await this.assertServerMember(
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

  /**
   * Permet à un utilisateur de quitter un serveur.
   * @param serverId - Identifiant du serveur
   * @param userId - Identifiant de l'utilisateur
   * @returns Le membre supprimé
   * @throws ForbiddenException si l'utilisateur n'est pas membre
   */
  async leaveServer(serverId: number, userId: string) {
    const member = await this.assertServerMember(userId, serverId);

    // TODO: gérer le cas où le propriétaire quitte le serveur

    return this.prisma.membreServeur.delete({ where: { id: member.id } });
  }

  /**
   * Récupère tous les membres d'un serveur avec leur statut de présence et avatar.
   * @param serverId - Identifiant du serveur
   * @returns Liste des membres avec leurs infos utilisateur
   * @throws NotFoundException si le serveur n'existe pas
   */
  async getServerMembers(serverId: number) {
    await this.assertServerExists(serverId);

    const members = await this.prisma.membreServeur.findMany({
      where: { serveurId: serverId },
      include: { user: true },
    });

    return Promise.all(
      members.map(async (m) => {
        let avatarUrl: string | null = null;
        if (m.user.avatarPath) {
          try {
            avatarUrl = await this.supabaseStorage.publicUrl(m.user.avatarPath);
          } catch {
            avatarUrl = null;
          }
        }
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
    const actingMember = await this.assertServerMember(actingUserId, serverId);
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
}
