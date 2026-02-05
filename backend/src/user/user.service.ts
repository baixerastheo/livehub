import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from 'src/prisma.service';
import { SupabaseStorageService } from '../supabase/supabase-storage.service';
import { CreateUser } from './dto/create-user.dto';
import { UpdateUser } from './dto/update-user.dto';
import { ok, err, Result } from '../result';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseStorage: SupabaseStorageService,
  ) {}

  /**
   * Enrichit un utilisateur avec l'URL publique de son avatar.
   * @param user - Utilisateur à enrichir
   * @returns Utilisateur avec avatarUrl ajouté (sans wrapper Result)
   */
  private async enrichWithAvatarUrl<T extends { avatarPath: string | null }>(
    user: T,
  ): Promise<T & { avatarUrl: string | null }> {
    if (!user.avatarPath) {
      return { ...user, avatarUrl: null };
    }

    const avatarUrlResult = await this.supabaseStorage.publicUrl(
      user.avatarPath,
    );
    if (avatarUrlResult.isErr()) {
      // En cas d'erreur de génération d'URL, on renvoie quand même l'utilisateur
      // avec avatarUrl à null pour ne pas casser les endpoints utilisateurs.
      return { ...user, avatarUrl: null };
    }

    return { ...user, avatarUrl: avatarUrlResult.value };
  }

  /**
   * Enrichit une liste d'utilisateurs avec les URLs de leurs avatars.
   * @param users - Liste d'utilisateurs à enrichir
   * @returns Liste d'utilisateurs avec avatarUrl ajouté
   */
  private async enrichUsersWithAvatarUrl<T extends { avatarPath: string | null }>(
    users: T[],
  ): Promise<Array<T & { avatarUrl: string | null }>> {
    return Promise.all(users.map((u) => this.enrichWithAvatarUrl(u)));
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
  async getUserById(id: string){
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return err('User with ID ' + id + ' not found');
    }
    return ok(await this.enrichWithAvatarUrl(user));
  }

  /**
   * Récupère un utilisateur par son email.
   * @param email - Email de l'utilisateur
   * @returns L'utilisateur ou erreur si non trouvé
   */
  async getUserByEmail(email: string){
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return err('User with email ' + email + ' not found');
    }
    return ok(await this.enrichWithAvatarUrl(user));
  }

  /**
   * Récupère un utilisateur par son nom.
   * @param name - Nom de l'utilisateur
   * @returns L'utilisateur ou erreur si non trouvé
   */
  async getUserByName(name: string){
    const user = await this.prisma.user.findFirst({
      where: { name },
    });
    if (!user) {
      return err('User with name ' + name + ' not found');
    }
    return ok(await this.enrichWithAvatarUrl(user));
  }

  /**
   * Crée un nouvel utilisateur avec son compte associé.
   * @param data - Données de l'utilisateur à créer
   * @returns L'utilisateur créé ou erreur si email/nom existe déjà
   */
  async createUser(data: CreateUser){
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

    const id = randomUUID();

    await this.prisma.$transaction([
      this.prisma.user.create({
        data: {
          id,
          name: data.name,
          email: data.email,
          statut: data.statut ?? 'EN_LIGNE',
        },
      }),
      this.prisma.account.create({
        data: {
          id: randomUUID(),
          accountId: id,
          providerId: 'credential',
          userId: id,
        },
      }),
    ]);

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      return err('User creation failed');
    }
    return ok(await this.enrichWithAvatarUrl(user));
  }

  /**
   * Supprime un utilisateur.
   * @param id - Identifiant de l'utilisateur à supprimer
   * @returns L'utilisateur supprimé ou erreur si non trouvé
   */
  async deleteUser(id: string){
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return err('User with ID ' + id + ' not found');
    }
    const deletedUser = await this.prisma.user.delete({
      where: { id },
    });
    return ok(await this.enrichWithAvatarUrl(deletedUser));
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
    if (newName !== undefined && newName !== user.name) {
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
        image: data.image,
        statut: data.statut,
      },
    });
    return ok(await this.enrichWithAvatarUrl(updatedUser));
  }

  /**
   * Met à jour le chemin de l'avatar d'un utilisateur.
   * @param userId - Identifiant de l'utilisateur
   * @param avatarPath - Nouveau chemin de l'avatar
   * @returns L'utilisateur mis à jour ou erreur si non trouvé
   */
  async updateAvatar(userId: string, avatarPath: string){
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return err('User with ID ' + userId + ' not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarPath,
        avatarUpdatedAt: new Date(),
      },
    });
    return ok(await this.enrichWithAvatarUrl(updatedUser));
  }

  /**
   * Remplace l'avatar d'un utilisateur.
   * Upload le nouveau fichier, supprime l'ancien et met à jour la base.
   * @param params - Paramètres contenant userId, buffer, contentType et extension
   * @returns Le chemin et l'URL du nouvel avatar ou erreur
   */
  async replaceAvatar(params: { userId: string; buffer: Buffer; contentType: string; ext: string }) {
    const { userId, buffer, contentType, ext } = params;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return err('User with ID ' + userId + ' not found');
    }

    const oldAvatarPath = user.avatarPath ?? null;

    const uploadResult = await this.supabaseStorage.uploadAvatar(
      userId,
      buffer,
      contentType,
      ext,
    );
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
      try {
        await this.supabaseStorage.removeObjects([oldAvatarPath]);
      } catch {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            avatarPath: oldAvatarPath,
            avatarUpdatedAt: new Date(),
          },
        });
        try {
          await this.supabaseStorage.removeObjects([newPath]);
        } catch {
          // Ignore cleanup error
        }
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
