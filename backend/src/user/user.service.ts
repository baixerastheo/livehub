import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from 'src/prisma.service';
import { SupabaseStorageService } from '../supabase/supabase-storage.service';
import { CreateUser } from './dto/create-user.dto';
import { UpdateUser } from './dto/update-user.dto';
import { ok, err } from '../result';
import { User } from '../../generated/prisma/client';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseStorage: SupabaseStorageService,
  ) {}

  
  /**
   * Enrichit un utilisateur avec l'URL publique de son avatar.
   * @param user - Utilisateur à enrichir
   * @returns Utilisateur avec avatarUrl ajouté
   */
  private async addAvatarUrl(user: User) {
    if (!user.avatarPath) {
      return { ...user, avatarUrl: null };
    }

    const result = await this.supabaseStorage.publicUrl(user.avatarPath);
    if (result.isErr()) {
      return { ...user, avatarUrl: null };
    }
    return { ...user, avatarUrl: result.value };
  }

  /**
   * Enrichit une liste d'utilisateurs avec les URLs de leurs avatars.
   * @param users - Liste d'utilisateurs à enrichir
   * @returns Liste d'utilisateurs avec avatarUrl ajouté
   */
  private async enrichUsersWithAvatarUrl(users: User[]) {
    if (users.length === 0) {
      return [];
    }
    return Promise.all(users.map((user) => this.addAvatarUrl(user)));
  }

  /**
   * Récupère tous les utilisateurs avec leurs URLs d'avatar.
   * @returns Liste de tous les utilisateurs
   */
  async getAllUsers() {
    const users = await this.prisma.user.findMany();
    return this.enrichUsersWithAvatarUrl(users);
  }

  /**
   * Récupère un utilisateur par son ID.
   * @param id - Identifiant de l'utilisateur
   * @returns L'utilisateur ou erreur si non trouvé
   */
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return err('User with ID ' + id + ' not found');
    }
    return ok(await this.addAvatarUrl(user));
  }

  /**
   * Récupère un utilisateur par son email.
   * @param email - Email de l'utilisateur
   * @returns L'utilisateur ou erreur si non trouvé
   */
  async getUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return err('User with email ' + email + ' not found');
    }
    return ok(user);
  }

  /**
   * Récupère un utilisateur par son nom.
   * @param name - Nom de l'utilisateur
   * @returns L'utilisateur ou erreur si non trouvé
   */
  async getUserByName(name: string) {
    const user = await this.prisma.user.findFirst({
      where: { name },
    });
    if (!user) {
      return err('User with name ' + name + ' not found');
    }
    return ok(await this.addAvatarUrl(user));
  }

  /**
   * Crée un nouvel utilisateur avec son compte associé.
   * @param data - Données de l'utilisateur à créer
   * @returns L'utilisateur créé ou erreur si email/nom existe déjà
   */
  async createUser(data: CreateUser) {
    const emailExist = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (emailExist) {
      return err('Email already exists');
    }

    const nameExist = await this.prisma.user.findFirst({
      where: { name: data.name },
    });
    if (nameExist) {
      return err('Name already exists');
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
    return ok(createdUser);
  }

  /**
   * Supprime un utilisateur.
   * @param id - Identifiant de l'utilisateur à supprimer
   * @returns L'utilisateur supprimé ou erreur si non trouvé
   */
  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return err('User with ID ' + id + ' not found');
    }
    const deletedUser = await this.prisma.user.delete({
      where: { id },
    });
    return ok(deletedUser);
  }

  /**
   * Met à jour les informations d'un utilisateur.
   * @param id - Identifiant de l'utilisateur
   * @param data - Nouvelles données de l'utilisateur
   * @returns L'utilisateur mis à jour ou erreur si non trouvé/nom existant
   */
  async updateUser(id: string, data: UpdateUser) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return err('User with ID ' + id + ' not found');
    }
    const newName = data.name;
    if (newName == null || newName !== user.name) {
      const nameExist = await this.prisma.user.findFirst({
        where: { name: newName },
      });
      if (nameExist) {
        return err('Name already exists');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        statut: data.statut,
      },
    });
    return ok(await this.addAvatarUrl(updatedUser));
  }

  /**
   * Remplace l'avatar d'un utilisateur.
   * Upload le nouveau fichier, supprime l'ancien et met à jour la base.
   * @param params - Paramètres contenant userId, buffer, contentType et extension
   * @returns Le chemin et l'URL du nouvel avatar ou erreur
   */
  async replaceAvatar(userId: string, buffer: Buffer, contentType: string, ext: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return err('User with ID ' + userId + ' not found');
    }
    const oldAvatarPath = user.avatarPath ?? null;

    const uploadResult = await this.supabaseStorage.uploadAvatar(userId, buffer, contentType, ext);
    if (uploadResult.isErr()) {
      return err(uploadResult.error);
    }
    const newPath = uploadResult.value;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarPath: newPath,
        avatarUpdatedAt: new Date(),
      },
    });

    if (oldAvatarPath) {
      const removeResult = await this.supabaseStorage.removeObjects([oldAvatarPath]);
      if (removeResult?.isErr?.()) {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            avatarPath: oldAvatarPath,
            avatarUpdatedAt: new Date(),
          },
        });
        await this.supabaseStorage.removeObjects([newPath]);
        return err('Failed to remove old avatar from storage');
      }
    }

    const avatarUrlResult = await this.supabaseStorage.publicUrl(newPath);
    if (avatarUrlResult.isErr()) {
      return err(avatarUrlResult.error);
    }

    return ok({ path: newPath, avatarUrl: avatarUrlResult.value });
  }
}
