import {Injectable,NotFoundException,ConflictException,InternalServerErrorException} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma.service';
import { SupabaseStorageService } from '../supabase/supabase-storage.service';
import { PresenceService } from '../realtime/presence.service.js';
import { CreateUser } from './dto/create-user.dto';
import { UpdateUser } from './dto/update-user.dto';
import { User } from '../../generated/prisma/client';
import { StatutUtilisateur } from '../../generated/prisma/enums';

/**
 * Service de gestion des utilisateurs.
 * Gère la création, la récupération, la mise à jour et la suppression des utilisateurs.
 */
@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseStorage: SupabaseStorageService,
    private readonly presence: PresenceService,
  ) {}

  private async withAvatarUrl(user: User) {
    return { ...user, avatarUrl: await this.supabaseStorage.resolveAvatarUrl(user.avatarPath) };
  }

  /**
   * Récupère tous les utilisateurs avec leur avatar et statut de présence.
   * @returns Liste de tous les utilisateurs enrichis
   */
  async getAllUsers() {
    const users = await this.prisma.user.findMany();
    const enriched = await Promise.all(users.map((u) => this.withAvatarUrl(u)));
    return enriched.map((u) => ({
      ...u,statut: this.presence.isOnline(u.id)
    }));
  }

  /**
   * Récupère un utilisateur par son ID.
   * @param id - Identifiant de l'utilisateur
   * @returns L'utilisateur avec avatar et statut de présence
   * @throws NotFoundException si l'utilisateur n'existe pas
   */
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User with ID ' + id + ' not found');
    }
    const withAvatar = await this.withAvatarUrl(user);
    const statut = this.presence.isOnline(id)
    return { ...withAvatar, statut };
  }

  /**
   * Récupère un utilisateur par son email.
   * @param email - Email de l'utilisateur
   * @returns L'utilisateur correspondant
   * @throws NotFoundException si l'utilisateur n'existe pas
   */
  async getUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User with email ' + email + ' not found');
    }
    return user;
  }

  /**
   * Récupère un utilisateur par son nom.
   * @param name - Nom de l'utilisateur
   * @returns L'utilisateur avec son avatar
   * @throws NotFoundException si l'utilisateur n'existe pas
   */
  async getUserByName(name: string) {
    const user = await this.prisma.user.findFirst({ where: { name } });
    if (!user) {
      throw new NotFoundException('User with name ' + name + ' not found');
    }
    return this.withAvatarUrl(user);
  }

  /**
   * Crée un nouvel utilisateur avec son compte associé.
   * @param data - Données de l'utilisateur à créer
   * @returns L'utilisateur créé
   * @throws ConflictException si l'email ou le nom existe déjà
   */
  async createUser(data: CreateUser) {
    const emailExist = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (emailExist) {
      throw new ConflictException('Email already exists');
    }

    const nameExist = await this.prisma.user.findFirst({
      where: { name: data.name },
    });
    if (nameExist) {
      throw new ConflictException('Name already exists');
    }

    const createdUser = await this.prisma.user.create({
      data: {
        id: randomUUID(),
        name: data.name,
        email: data.email,
        statut: data.statut ?? 'EN_LIGNE',
      },
    });

    await this.prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: createdUser.id,
        providerId: 'credential',
        userId: createdUser.id,
      },
    });

    return createdUser;
  }

  /**
   * Supprime un utilisateur.
   * @param id - Identifiant de l'utilisateur à supprimer
   * @returns L'utilisateur supprimé
   * @throws NotFoundException si l'utilisateur n'existe pas
   */
  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User with ID ' + id + ' not found');
    }
    return this.prisma.user.delete({ where: { id } });
  }

  /**
   * Met à jour les informations d'un utilisateur.
   * @param id - Identifiant de l'utilisateur
   * @param data - Nouvelles données de l'utilisateur
   * @returns L'utilisateur mis à jour avec son avatar
   * @throws NotFoundException si l'utilisateur n'existe pas
   * @throws ConflictException si le nouveau nom est déjà pris
   */
  async updateUser(id: string, data: UpdateUser) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User with ID ' + id + ' not found');
    }

    if (data.name != null && data.name !== user.name) {
      const nameExist = await this.prisma.user.findFirst({
        where: { name: data.name },
      });
      if (nameExist) {
        throw new ConflictException('Name already exists');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { name: data.name, statut: data.statut },
    });

    return this.withAvatarUrl(updatedUser);
  }

  /**
   * Remplace l'avatar d'un utilisateur.
   * Upload le nouveau fichier, supprime l'ancien et met à jour la base.
   * En cas d'échec de la suppression de l'ancien avatar, effectue un rollback.
   * @param userId - Identifiant de l'utilisateur
   * @param buffer - Contenu du fichier
   * @param contentType - Type MIME du fichier
   * @param ext - Extension du fichier
   * @returns Le chemin et l'URL du nouvel avatar
   * @throws NotFoundException si l'utilisateur n'existe pas
   * @throws InternalServerErrorException si l'upload ou la suppression échoue
   */
  async replaceAvatar(
    userId: string,
    buffer: Buffer,
    contentType: string,
    ext: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User with ID ' + userId + ' not found');
    }

    const oldAvatarPath = user.avatarPath ?? null;
    const newPath = this.supabaseStorage.buildPath('user', userId, ext);
    await this.supabaseStorage.upload(newPath, buffer, contentType);

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarPath: newPath, avatarUpdatedAt: new Date() },
    });

    if (oldAvatarPath) {
      try {
        await this.supabaseStorage.removeObjects([oldAvatarPath]);
      } catch {
        await this.prisma.user.update({
          where: { id: userId },
          data: { avatarPath: oldAvatarPath, avatarUpdatedAt: new Date() },
        });
        await this.supabaseStorage.removeObjects([newPath]);
        throw new InternalServerErrorException(
          'Failed to remove old avatar from storage',
        );
      }
    }

    const avatarUrl = await this.supabaseStorage.publicUrl(newPath);
    return { path: newPath, avatarUrl };
  }
}
