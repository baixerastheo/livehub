import {
  Injectable,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SupabaseStorageService } from '../supabase/supabase-storage.service';
import { ServerUtilsService } from './server-utils.service';
import { CreateServer } from './dto/create-server.dto';
import { UpdateServer } from './dto/update-server.dto';
import { Role } from '../../generated/prisma/enums';

/**
 * Service de gestion des serveurs.
 * Gère la création, la suppression, la mise à jour et l'avatar des serveurs.
 */
@Injectable()
export class ServerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseStorage: SupabaseStorageService,
    private readonly utils: ServerUtilsService,
  ) {}

  /**
   * Récupère tous les serveurs auxquels appartient un utilisateur.
   * @param userId - Identifiant de l'utilisateur
   * @returns Liste des appartenances avec les infos du serveur
   */
  async getUserServers(userId: string) {
    const memberships = await this.prisma.membreServeur.findMany({
      where: { userId },
      include: { serveur: true },
    });

    return Promise.all(
      memberships.map(async (m) => {
        const avatarUrl = await this.supabaseStorage.resolveAvatarUrl(
          m.serveur.avatarPath,
        );
        const { avatarPath: _avatarPath, ...serveurRest } = m.serveur;
        return { ...m, serveur: { ...serveurRest, avatarUrl } };
      }),
    );
  }

  /**
   * Récupère un serveur par son ID.
   * @param id - Identifiant du serveur
   * @returns Le serveur correspondant avec son avatarUrl résolu
   * @throws NotFoundException si le serveur n'existe pas
   */
  async getServerById(id: number) {
    const server = await this.utils.assertServerExists(id);
    const avatarUrl = await this.supabaseStorage.resolveAvatarUrl(
      server.avatarPath,
    );
    const { avatarPath: _avatarPath, ...serverRest } = server;
    return { ...serverRest, avatarUrl };
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
    await this.utils.assertServerExists(id);
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
    await this.utils.assertServerExists(id);
    return this.prisma.serveur.delete({ where: { id } });
  }

  /**
   * Remplace l'avatar d'un serveur dans Supabase Storage.
   * En cas d'échec de la suppression de l'ancien avatar, effectue un rollback.
   * @param serverId - Identifiant du serveur
   * @param actingUserId - Identifiant du propriétaire qui effectue l'action
   * @param buffer - Contenu binaire du fichier image
   * @param contentType - Type MIME de l'image
   * @param ext - Extension du fichier (jpg, png, webp)
   * @returns Le nouveau path et l'URL publique de l'avatar
   * @throws ForbiddenException si l'utilisateur n'est pas propriétaire
   * @throws InternalServerErrorException si la suppression de l'ancien avatar échoue
   */
  async replaceServerAvatar(
    serverId: number,
    actingUserId: string,
    buffer: Buffer,
    contentType: string,
    ext: string,
  ) {
    const server = await this.utils.assertServerExists(serverId);

    const actingMember = await this.utils.assertServerMember(
      actingUserId,
      serverId,
    );
    if (actingMember.role !== Role.PROPRIETAIRE) {
      throw new ForbiddenException(
        'Only the server owner can change the server avatar',
      );
    }

    const oldAvatarPath = server.avatarPath ?? null;
    const newPath = this.supabaseStorage.buildPath(
      'server',
      serverId.toString(),
      ext,
    );

    await this.supabaseStorage.upload(newPath, buffer, contentType);

    await this.prisma.serveur.update({
      where: { id: serverId },
      data: { avatarPath: newPath },
    });

    if (oldAvatarPath) {
      try {
        await this.supabaseStorage.removeObjects([oldAvatarPath]);
      } catch {
        await this.prisma.serveur.update({
          where: { id: serverId },
          data: { avatarPath: oldAvatarPath },
        });
        await this.supabaseStorage.removeObjects([newPath]);
        throw new InternalServerErrorException(
          'Failed to remove old server avatar from storage',
        );
      }
    }

    const avatarUrl = await this.supabaseStorage.publicUrl(newPath);
    return { path: newPath, avatarUrl };
  }
}
