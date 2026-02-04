import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ok, err } from '../result';
import { PrismaService } from 'src/prisma.service';
import { CreateUser } from './dto/create-user.dto';
import { UpdateUser } from './dto/update-user.dto';

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
}
