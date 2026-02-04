import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateServer } from './dto/create-server.dto';
import { UpdateServer } from './dto/update-server.dto';
import { Role } from '../../generated/prisma/enums';
import { ok, err } from '../result';

@Injectable()
export class ServerService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllServers() {
    return await this.prisma.serveur.findMany();
  }

  async getServerById(id: number) {
    const server = await this.prisma.serveur.findUnique({
      where: { id },
    });
    if (!server) {
      return err('Server with ID ' + id + ' not found');
    }
    return ok(server);
  }

  async createServer(data: CreateServer, creatorId: string) {
    const server = await this.prisma.serveur.create({
      data: {
        nom: data.name,
      },
    });

    await this.prisma.membreServeur.create({
      data: {
        serveurId: server.id,
        userId: creatorId,
        role: Role.PROPRIETAIRE,
      },
    });
    return ok(server);
  }

  async updateServer(id: number, data: UpdateServer) {
    const server = await this.prisma.serveur.findUnique({
      where: { id },
    });
    if (!server) {
      return err('Server with ID ' + id + ' not found');
    }
    const updatedServer = await this.prisma.serveur.update({
      where: { id },
      data: {
        nom: data.name,
      },
    });
    return ok(updatedServer);
  }

  async deleteServer(id: number) {
    const server = await this.prisma.serveur.findUnique({
      where: { id },
    });
    if (!server) {
      return err('Server with ID ' + id + 'not found');
    }
    const deletedServer = await this.prisma.serveur.delete({
      where: { id },
    });
    return ok(deletedServer);
  }

  async getUserServers(userId: string) {
    const members = await this.prisma.membreServeur.findMany({
      where: { userId },
      include: {
        serveur: true,
      },
    });
    return members;
  }

  async joinServer(serverId: number, userId: string) {
    const server = await this.prisma.serveur.findUnique({
      where: { id: serverId },
    });
    if (!server) {
      return err('Server with ID' + serverId + 'not found');
    }

    const member = await this.prisma.membreServeur.findUnique({
      where: {
        userId_serveurId: {
          userId,
          serveurId: serverId,
        },
      },
    });
    if (member) {
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

  async leaveServer(serverId: number, userId: string) {
    const member = await this.prisma.membreServeur.findUnique({
      where: {
        userId_serveurId: {
          userId,
          serveurId: serverId,
        },
      },
    });
    if (!member) {
      return err('You are not a member of this server');
    }

    // a faire : gerer le cas ou le proprio part

    const deletedMember = await this.prisma.membreServeur.delete({
      where: {
        id: member.id,
      },
    });
    return ok(deletedMember);
  }

  async getServerMembers(serverId: number) {
    const server = await this.prisma.serveur.findUnique({
      where: { id: serverId },
    });
    if (!server) {
      return err('Server with ID' + serverId + 'not found');
    }

    const members = await this.prisma.membreServeur.findMany({
      where: { serveurId: serverId },
      include: {
        user: true,
      },
    });
    return ok(members);
  }

  async updateMemberRole(serverId: number, userId: string, newRole: Role) {
    const member = await this.prisma.membreServeur.findUnique({
      where: {
        userId_serveurId: {
          userId,
          serveurId: serverId,
        },
      },
    });
    if (!member) {
      return err('This user is not a member of this server');
    }

    const updatedMember = await this.prisma.membreServeur.update({
      where: {
        id: member.id,
      },
      data: {
        role: newRole,
      },
      include: {
        user: true,
        serveur: true,
      },
    });
    return ok(updatedMember);
  }
}
