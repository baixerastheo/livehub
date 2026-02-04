import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { ok, err } from '../result.js';

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) {}

  async getHistoryMessageByChannel(id: number) {
    const channel = await this.prisma.canal.findUnique({
      where: { id },
    });
    if (!channel) {
      return err('No channel found for ID ' + id);
    }
    const messages = await this.prisma.message.findMany({
      where: { canalId: id },
      orderBy: { creeLe: 'asc' },
      include: { auteur: true },
    });
    return ok(messages);
  }

  async createMessage(contenu: string, canalId: number, userId: string) {
    const canal = await this.prisma.canal.findUnique({
      where: { id: canalId },
      include: { serveur: true },
    });

    if (!canal) {
      return err('No channel found for ID ' + canalId);
    }
    const membreServeur = await this.prisma.membreServeur.findUnique({
      where: {
        userId_serveurId: {
          userId,
          serveurId: canal.serveur.id,
        },
      },
    });

    if (!membreServeur) {
      return err('No member of this server');
    }

    const message = await this.prisma.message.create({
      data: {
        contenu,
        canalId,
        auteurId: userId,
      },
      include: {
        auteur: {
          select: {
            name: true,
          },
        },
      },
    });
    return ok(message);
  }

  async deleteMessage(id: number, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id },
      include: { auteur: true },
    });
    if (!message) {
      return err('No message found for ID ' + id);
    }
    if (message.auteurId !== userId) {
      return err('You can only delete your own messages');
    }
    const deletedMessage = await this.prisma.message.delete({
      where: { id },
    });
    return ok(deletedMessage);
  }
}
