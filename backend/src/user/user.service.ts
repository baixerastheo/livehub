import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ok, err } from '../result';
import { PrismaService } from 'src/prisma.service';
import { SupabaseStorageService } from '../supabase/supabase-storage.service';
import { CreateUser } from './dto/create-user.dto';
import { UpdateUser } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseStorage: SupabaseStorageService,
  ) {}

  private async enrichWithAvatarUrl<T extends { avatarPath: string | null }>(
    user: T,
  ): Promise<T & { avatarUrl: string | null }> {
    if (!user.avatarPath) {
      return { ...user, avatarUrl: null };
    }
    try {
      const avatarUrl = await this.supabaseStorage.publicUrl(user.avatarPath);
      return { ...user, avatarUrl };
    } catch {
      return { ...user, avatarUrl: null };
    }
  }

  private async enrichUsersWithAvatarUrl<
    T extends { avatarPath: string | null },
  >(users: T[]): Promise<(T & { avatarUrl: string | null })[]> {
    return Promise.all(users.map((u) => this.enrichWithAvatarUrl(u)));
  }

  async getAllUsers() {
    const users = await this.prisma.user.findMany();
    return this.enrichUsersWithAvatarUrl(users);
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return err('User with ID ' + id + ' not found');
    }
    return ok(await this.enrichWithAvatarUrl(user));
  }

  async GetUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return err('User with Email ' + email + ' not found');
    }
    return ok(await this.enrichWithAvatarUrl(user));
  }

  async GetUserByName(name: string) {
    const user = await this.prisma.user.findFirst({
      where: { name },
    });
    if (!user) {
      return err('User with name ' + name + ' not found');
    }
    return ok(await this.enrichWithAvatarUrl(user));
  }

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
    return ok(await this.enrichWithAvatarUrl(user!));
  }

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
    return ok(await this.enrichWithAvatarUrl(deletedUser));
  }

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

  async updateAvatar(userId: string, avatarPath: string) {
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
   * Remplace l’avatar utilisateur de façon robuste avec compensation :
   * Lit oldAvatarPath depuis la BDD
   * Upload du nouveau fichier vers Supabase → newPath
   * Update BDD : avatarPath = newPath
   * Si oldAvatarPath existe : suppression dans le storage, en cas d’échec :
   * revert BDD vers oldAvatarPath, suppression de newPath, retourne err.
   */
  async replaceAvatar(params: {
    userId: string;
    buffer: Buffer;
    contentType: string;
    ext: string;
  }): Promise<
    | ReturnType<typeof ok<{ path: string; avatarUrl: string }>>
    | ReturnType<typeof err<string>>
  > {
    const { userId, buffer, contentType, ext } = params;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return err('User with ID ' + userId + ' not found');
    }

    const oldAvatarPath = user.avatarPath ?? null;

    const { path: newPath } = await this.supabaseStorage.uploadAvatar({
      userId,
      buffer,
      contentType,
      ext,
    });

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
          // Best-effort cleanup, the DB has already been reverted,
          // so we intentionally ignore failures when deleting the new avatar.
        }
        return err('Failed to remove old avatar from storage');
      }
    }

    const avatarUrl = await this.supabaseStorage.publicUrl(newPath);
    return ok({ path: newPath, avatarUrl });
  }
}
