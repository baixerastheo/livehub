import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SupabaseStorageService } from '../supabase/supabase-storage.service';
import { MessageGateway } from '../realtime/message.gateway.js';
import { CreateServer } from './dto/create-server.dto';
import { UpdateServer } from './dto/update-server.dto';
import { AddMember } from './dto/add-member.dto';
import { Role } from '../../generated/prisma/enums';
import { ok, err } from '../result';

@Injectable()
export class ServerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseStorage: SupabaseStorageService,
    private readonly messageGateway: MessageGateway,
  ) {}

  /**
   * Récupère un serveur par son ID.
   * @param id - Identifiant du serveur
   * @returns Le serveur ou null si non trouvé
   */
  private async findServerById(id: number) {
    return this.prisma.serveur.findUnique({ where: { id } });
  }

  /**
   * Récupère un membre d'un serveur.
   * @param userId - Identifiant de l'utilisateur
   * @param serverId - Identifiant du serveur
   * @returns Le membre ou null si non trouvé
   */
  private async findServerMember(userId: string, serverId: number) {
    return this.prisma.membreServeur.findUnique({
      where: { userId_serveurId: { userId, serveurId: serverId } },
    });
  }

  /**
   * Récupère tous les serveurs.
   * @returns Liste de tous les serveurs
   */
  async getAllServers() {
    return this.prisma.serveur.findMany();
  }

  /**
   * Récupère un serveur par son ID.
   * @param id - Identifiant du serveur
   * @returns Le serveur ou erreur si non trouvé
   */
  async getServerById(id: number) {
    const server = await this.findServerById(id);
    if (!server) {
      return err(`Server with ID ${id} not found`);
    }
    return ok(server);
  }

  /**
   * Crée un nouveau serveur et ajoute le créateur comme propriétaire.
   * @param data - Données du serveur à créer
   * @param creatorId - Identifiant du créateur
   * @returns Le serveur créé
   * create a default channel "general"
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
      data: {
        serveurId: server.id,
        nom: 'general',
      },
    });

    return ok(server);
  }

  /**
   * Met à jour les informations d'un serveur.
   * @param id - Identifiant du serveur
   * @param data - Nouvelles données du serveur
   * @returns Le serveur mis à jour ou erreur si non trouvé
   */
  async updateServer(id: number, data: UpdateServer) {
    const server = await this.findServerById(id);
    if (!server) {
      return err(`Server with ID ${id} not found`);
    }
    const updatedServer = await this.prisma.serveur.update({
      where: { id },
      data: { nom: data.name },
    });
    return ok(updatedServer);
  }

  /**
   * Supprime un serveur.
   * @param id - Identifiant du serveur à supprimer
   * @returns Le serveur supprimé ou erreur si non trouvé
   */
  async deleteServer(id: number) {
    const server = await this.findServerById(id);
    if (!server) {
      return err(`Server with ID ${id} not found`);
    }
    const deletedServer = await this.prisma.serveur.delete({
      where: { id },
    });
    return ok(deletedServer);
  }

  /**
   * Récupère tous les serveurs d'un utilisateur.
   * @param userId - Identifiant de l'utilisateur
   * @returns Liste des appartenances aux serveurs avec les infos du serveur
   */
  async getUserServers(userId: string) {
    return this.prisma.membreServeur.findMany({
      where: { userId },
      include: { serveur: true },
    });
  }

  /**
   * Permet à un utilisateur de rejoindre un serveur.
   * @param serverId - Identifiant du serveur
   * @param userId - Identifiant de l'utilisateur
   * @returns Le nouveau membre ou erreur si déjà membre/serveur non trouvé
   */
  async joinServer(serverId: number, userId: string) {
    const server = await this.findServerById(serverId);
    if (!server) {
      return err(`Server with ID ${serverId} not found`);
    }

    const existingMember = await this.findServerMember(userId, serverId);
    if (existingMember) {
      return err('You are already a member of this server');
    }

    const newMember = await this.prisma.membreServeur.create({
      data: {
        serveurId: serverId,
        userId,
        role: Role.MEMBRE,
      },
      include: {
        serveur: true,
        user: true,
      },
    });
    return ok(newMember);
  }

  /**
   * Ajoute un utilisateur à un serveur (action d'un admin/proprio).
   * @param serverId - Identifiant du serveur
   * @param currentUserId - Utilisateur qui effectue l'action
   * @param payload - Données avec l'identifiant de l'utilisateur à ajouter
   * @returns Le nouveau membre ou erreur si non autorisé / déjà membre
   */
  async addMember(serverId: number, currentUserId: string, payload: AddMember) {
    const server = await this.findServerById(serverId);
    if (!server) {
      return err(`Server with ID ${serverId} not found`);
    }

    const actingMember = await this.findServerMember(currentUserId, serverId);
    if (!actingMember) {
      return err('You are not a member of this server');
    }
    if (
      actingMember.role !== Role.PROPRIETAIRE &&
      actingMember.role !== Role.ADMINISTRATEUR
    ) {
      return err('Only owners and administrators can add members');
    }

    const targetUserId = payload.userId;
    if (currentUserId === targetUserId) {
      return err('You are already a member of this server');
    }

    const existingMember = await this.findServerMember(targetUserId, serverId);
    if (existingMember) {
      return err('This user is already a member of the server');
    }

    const newMember = await this.prisma.membreServeur.create({
      data: {
        serveurId: serverId,
        userId: targetUserId,
        role: Role.MEMBRE,
      },
      include: {
        user: true,
        serveur: true,
      },
    });

    let avatarUrl: string | null = null;
    if (newMember.user.avatarPath) {
      const result = await this.supabaseStorage.publicUrl(
        newMember.user.avatarPath,
      );
      if (result.isOk()) avatarUrl = result.value;
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

    return ok(newMember);
  }

  /**
   * Permet à un utilisateur de quitter un serveur.
   * @param serverId - Identifiant du serveur
   * @param userId - Identifiant de l'utilisateur
   * @returns Le membre supprimé ou erreur si non membre
   */
  async leaveServer(serverId: number, userId: string) {
    const member = await this.findServerMember(userId, serverId);
    if (!member) {
      return err('You are not a member of this server');
    }

    // TODO: gérer le cas où le propriétaire quitte le serveur

    const deletedMember = await this.prisma.membreServeur.delete({
      where: { id: member.id },
    });
    return ok(deletedMember);
  }

  /**
   * Récupère tous les membres d'un serveur.
   * @param serverId - Identifiant du serveur
   * @returns Liste des membres avec leurs infos utilisateur ou erreur
   */
  async getServerMembers(serverId: number) {
    const server = await this.findServerById(serverId);
    if (!server) {
      return err(`Server with ID ${serverId} not found`);
    }

    const members = await this.prisma.membreServeur.findMany({
      where: { serveurId: serverId },
      include: { user: true },
    });

    const membersWithAvatarUrl = await Promise.all(
      members.map(async (m) => {
        let avatarUrl: string | null = null;
        if (m.user.avatarPath) {
          const result = await this.supabaseStorage.publicUrl(
            m.user.avatarPath,
          );
          if (result.isOk()) {
            avatarUrl = result.value;
          }
        }
        const { avatarPath: _avatarPath, ...userRest } = m.user;
        return {
          ...m,
          user: { ...userRest, avatarUrl },
        };
      }),
    );

    return ok(membersWithAvatarUrl);
  }

  /**
   * Met à jour le rôle d'un membre dans un serveur.
   * @param serverId - Identifiant du serveur
   * @param userId - Identifiant de l'utilisateur
   * @param newRole - Nouveau rôle à attribuer
   * @returns Le membre mis à jour ou erreur si non membre
   */
  async updateMemberRole(serverId: number, userId: string, newRole: Role) {
    const member = await this.findServerMember(userId, serverId);
    if (!member) {
      return err('This user is not a member of this server');
    }

    const updatedMember = await this.prisma.membreServeur.update({
      where: { id: member.id },
      data: { role: newRole },
      include: {
        user: true,
        serveur: true,
      },
    });
    return ok(updatedMember);
  }
}
