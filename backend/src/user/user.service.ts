import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service.js';
import { CreateUser } from './dto/create-user.dto.js';
import { UpdateUser } from './dto/update-user.dto.js';
import { ok, err } from '../result.js';

function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$/.test(value);
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers() {
    return await this.prisma.user.findMany();
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return err('User with ID ' + id + ' not found');
    }
    return ok(user);
  }

  async GetUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return err('User with Email ' + email + ' not found');
    }
    return ok(user);
  }

  async GetUserByName(name: string) {
    const user = await this.prisma.user.findFirst({
      where: { name },
    });
    if (!user) {
      return err('User with name ' + name + ' not found');
    }
    return ok(user);
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
    const hashedPassword =
      data.password && !isBcryptHash(data.password)
        ? await bcrypt.hash(data.password, 10)
        : data.password;

    await this.prisma.$transaction([
      this.prisma.user.create({
        data: {
          id,
          name: data.name,
          email: data.email,
          image: data.image,
          statut: data.statut ?? 'EN_LIGNE',
        },
      }),
      this.prisma.account.create({
        data: {
          id: randomUUID(),
          accountId: id,
          providerId: 'credential',
          userId: id,
          password: hashedPassword,
        },
      }),
    ]);

    const user = await this.prisma.user.findUnique({ where: { id } });
    return ok(user!);
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
    return ok(deletedUser);
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

    if (data.password !== undefined) {
      const hashed = isBcryptHash(data.password)
        ? data.password
        : await bcrypt.hash(data.password, 10);
      const account = await this.prisma.account.findFirst({
        where: { userId: id, providerId: 'credential' },
      });
      if (account) {
        await this.prisma.account.update({
          where: { id: account.id },
          data: { password: hashed },
        });
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
    return ok(updatedUser);
  }

  async updatePassword(id: string, motDePasse: string) {
    const hashed = isBcryptHash(motDePasse)
      ? motDePasse
      : await bcrypt.hash(motDePasse, 10);
    const account = await this.prisma.account.findFirst({
      where: { userId: id, providerId: 'credential' },
    });
    if (!account) {
      return err('No credential account for this user');
    }
    await this.prisma.account.update({
      where: { id: account.id },
      data: { password: hashed },
    });
    return ok(undefined);
  }
}
