import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { ok, err } from '../result.js';
import { CreateCanal } from './dto/create-canal.dto.js';
import { Role } from '../../generated/prisma/enums.js';
import { UpdateCanal } from './dto/update-canal.dto.js';

@Injectable()
export class CanalService {
  constructor(private readonly prisma: PrismaService) {}

  async GetAllChannelsByServer(ServerId: number) {
    const server = await this.prisma.serveur.findUnique({
      where: { id: ServerId },
    });
    if (!server) {
      return err('No server found for ID ' + ServerId);
    }
    const channels = await this.prisma.canal.findMany({
      where: { serveurId: ServerId },
    });
    if (!channels || channels.length === 0) {
      return err('No channels found for server with ID ' + ServerId);
    }
    return ok(channels);
  }

  async CreateChannel(ServerId: number, userId: number, data: CreateCanal) {
    const server = await this.prisma.serveur.findUnique({
      where: { id: ServerId },
    });
    if (!server) {
      return err('No server found for ID ' + ServerId);
    }

    const member = await this.prisma.membreServeur.findUnique({
      where: {
        utilisateurId_serveurId: {
          utilisateurId: userId,
          serveurId: ServerId,
        },
      },
    });

    if (!member) {
      return err('You are not a member of this server');
    }

    if (
      member.role !== Role.PROPRIETAIRE &&
      member.role !== Role.ADMINISTRATEUR
    ) {
      return err('Only owners and administrators can create channels');
    }

    const canal = await this.prisma.canal.create({
      data: {
        nom: data.name,
        serveurId: ServerId,
      },
    });
    return ok(canal);
  }

  async GetDetailsChannel(id: number) {
    const channel = await this.prisma.canal.findUnique({
      where: { id },
    });
    if (!channel) {
      return err('No channels found for ID ' + id);
    }
    return ok(channel);
  }

  async DeleteChannel(id: number) {
    const channel = await this.prisma.canal.findUnique({
      where: { id },
    });
    if (!channel) {
      return err('No channels found for ID ' + id);
    }
    const deletedChannel = await this.prisma.canal.delete({
      where: { id },
    });
    return ok(deletedChannel);
  }

  async UpdateChannel(id: number, data: UpdateCanal) {
    const channel = await this.prisma.canal.findUnique({
      where: { id },
    });
    if (!channel) {
      return err('No channels found for ID ' + id);
    }

    const updatedCanal = await this.prisma.canal.update({
      where: { id },
      data: {
        nom: data.name,
      },
    });
    return ok(updatedCanal);
  }
}
