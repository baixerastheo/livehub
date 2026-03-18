import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { MessageGateway } from '../realtime/message.gateway.js';

export type ReactionAggregate = { emoji: string; count: number; userIds: string[] };

/**
 * Aggregates raw reactions by emoji into { emoji, count, userIds } entries.
 * @param reactions - Raw list of reactions
 * @returns Aggregated array grouped by emoji
 */
function aggregate(
  reactions: { emoji: string; userId: string }[],
): ReactionAggregate[] {
  const map = new Map<string, string[]>();
  for (const r of reactions) {
    if (!map.has(r.emoji)) map.set(r.emoji, []);
    map.get(r.emoji)!.push(r.userId);
  }
  return Array.from(map.entries()).map(([emoji, userIds]) => ({
    emoji,
    count: userIds.length,
    userIds,
  }));
}

@Injectable()
export class ReactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: MessageGateway,
  ) {}

  /**
   * Toggles (adds or removes) a reaction on a channel message.
   * Emits the `message:reaction-updated` event to all channel subscribers.
   * @param messageId - Channel message ID
   * @param userId - ID of the reacting user
   * @param emoji - Reaction emoji
   * @returns Updated aggregated reactions
   */
  async toggleChannelReaction(
    messageId: number,
    userId: string,
    emoji: string,
  ): Promise<ReactionAggregate[]> {
    if (!emoji || emoji.trim() === '') {
      throw new BadRequestException('Emoji requis');
    }

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, canalId: true },
    });
    if (!message) throw new NotFoundException('Message introuvable');

    const channel = await this.prisma.canal.findUnique({
      where: { id: message.canalId },
      select: { serveurId: true },
    });
    if (!channel) throw new NotFoundException('Canal introuvable');

    const member = await this.prisma.membreServeur.findUnique({
      where: {
        userId_serveurId: { userId, serveurId: channel.serveurId },
      },
    });
    if (!member) throw new ForbiddenException('Non membre du serveur');

    const existing = await this.prisma.reactionMessage.findUnique({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
    });

    if (existing) {
      await this.prisma.reactionMessage.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.reactionMessage.create({
        data: { messageId, userId, emoji },
      });
    }

    const all = await this.prisma.reactionMessage.findMany({
      where: { messageId },
      select: { emoji: true, userId: true },
    });

    const aggregated = aggregate(all);
    this.gateway.emitReactionUpdated('channel', message.canalId, messageId, aggregated);
    return aggregated;
  }

  /**
   * Toggles (adds or removes) a reaction on a private message.
   * Emits the `message:reaction-updated` event to both conversation participants.
   * @param messageId - Private message ID
   * @param userId - ID of the reacting user
   * @param emoji - Reaction emoji
   * @returns Updated aggregated reactions
   */
  async togglePrivateReaction(
    messageId: number,
    userId: string,
    emoji: string,
  ): Promise<ReactionAggregate[]> {
    if (!emoji || emoji.trim() === '') {
      throw new BadRequestException('Emoji requis');
    }

    const message = await this.prisma.messagePrive.findUnique({
      where: { id: messageId },
      select: { id: true, expediteurId: true, destinataireId: true },
    });
    if (!message) throw new NotFoundException('Message introuvable');

    const isParticipant =
      message.expediteurId === userId || message.destinataireId === userId;
    if (!isParticipant)
      throw new ForbiddenException('Non participant de la conversation');

    const existing = await this.prisma.reactionMessagePrive.findUnique({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
    });

    if (existing) {
      await this.prisma.reactionMessagePrive.delete({
        where: { id: existing.id },
      });
    } else {
      await this.prisma.reactionMessagePrive.create({
        data: { messageId, userId, emoji },
      });
    }

    const all = await this.prisma.reactionMessagePrive.findMany({
      where: { messageId },
      select: { emoji: true, userId: true },
    });

    const aggregated = aggregate(all);
    this.gateway.emitReactionUpdated(
      'private',
      { expediteurId: message.expediteurId, destinataireId: message.destinataireId },
      messageId,
      aggregated,
    );
    return aggregated;
  }
}
