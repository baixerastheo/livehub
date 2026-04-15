import {Injectable,NotFoundException,ForbiddenException,BadRequestException,} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { MessageGateway } from '../realtime/message.gateway.js';

export type ReactionAggregate = {
  emoji: string;
  count: number;
  userIds: string[];
};

/**
 * Regroupe une liste brute de réactions par emoji.
 * Ex: [{ emoji: '👍', userId: '1' }, { emoji: '👍', userId: '2' }, { emoji: '❤️', userId: '1' }]
 *  => [{ emoji: '👍', count: 2, userIds: ['1','2'] }, { emoji: '❤️', count: 1, userIds: ['1'] }]
 */
function aggregate(reactions: { emoji: string; userId: string }[]): ReactionAggregate[] {
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

/**
 * Service de gestion des réactions sur les messages de canal et privés.
 * Contient la logique métier pour ajouter/retirer une réaction (toggle) et agréger les réactions par emoji.
 */
@Injectable()
export class ReactionService {
  constructor(private readonly prisma: PrismaService, private readonly gateway: MessageGateway) {}

  /**
   * Ajoute ou retire une réaction sur un message de canal (serveur).
   * - Si l'emoji existe déjà pour cet utilisateur → on le supprime (toggle off)
   * - Sinon → on le crée (toggle on)
   * Émet ensuite l'événement temps réel à tous les membres du canal.
   */
  async toggleChannelReaction(messageId: number, userId: string, emoji: string): Promise<ReactionAggregate[]> {
    this.validateEmoji(emoji);

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, canalId: true, canal: { select: { serveurId: true } } },
    });
    if (!message) throw new NotFoundException('Message introuvable');
    if (!message.canal) throw new NotFoundException('Canal introuvable');

    const member = await this.prisma.membreServeur.findUnique({
      where: { userId_serveurId: { userId, serveurId: message.canal.serveurId } },
    });
    if (!member) throw new ForbiddenException('Non membre du serveur');

    await this.toggleChannelRecord(messageId, userId, emoji);
    return this.fetchChannelAggregateAndEmit(messageId, message.canalId);
  }

  /**
   * Ajoute ou retire une réaction sur un message privé.
   * Seuls l'expéditeur et le destinataire peuvent réagir.
   * Émet ensuite l'événement temps réel aux deux participants.
   */
  async togglePrivateReaction(messageId: number, userId: string, emoji: string): Promise<ReactionAggregate[]> {
    this.validateEmoji(emoji);

    const message = await this.prisma.messagePrive.findUnique({
      where: { id: messageId },
      select: { id: true, expediteurId: true, destinataireId: true },
    });
    if (!message) throw new NotFoundException('Message introuvable');

    if (message.expediteurId !== userId && message.destinataireId !== userId)
      throw new ForbiddenException('Non participant de la conversation');

    await this.togglePrivateRecord(messageId, userId, emoji);
    return this.fetchPrivateAggregateAndEmit(messageId, {
      expediteurId: message.expediteurId,
      destinataireId: message.destinataireId,
    });
  }

  /** Valide que l'emoji est non vide. */
  private validateEmoji(emoji: string): void {
    if (!emoji?.trim())
       throw new BadRequestException('Emoji requis');
  }

  /**
   * Récupère les réactions d'un message de canal, les agrège et émet l'événement temps réel.
   */
  private async fetchChannelAggregateAndEmit(messageId: number, canalId: number): Promise<ReactionAggregate[]> {
    const all = await this.prisma.reactionMessage.findMany({
      where: { messageId },
      select: { emoji: true, userId: true },
    });
    const aggregated = aggregate(all);
    this.gateway.emitReactionUpdated('channel', canalId, messageId, aggregated);
    return aggregated;
  }

  /**
   * Récupère les réactions d'un message privé, les agrège et émet l'événement temps réel.
   */
  private async fetchPrivateAggregateAndEmit(messageId: number,context: { expediteurId: string; destinataireId: string }): Promise<ReactionAggregate[]> {
    const all = await this.prisma.reactionMessagePrive.findMany({
      where: { messageId },
      select: { emoji: true, userId: true },
    });
    const aggregated = aggregate(all);
    this.gateway.emitReactionUpdated('private', context, messageId, aggregated);
    return aggregated;
  }

  /**
   * Toggle d'une réaction sur un message de canal.
   * Supprime la réaction si elle existe, la crée sinon.
   */
  private async toggleChannelRecord(messageId: number, userId: string, emoji: string): Promise<void> {
    const existing = await this.prisma.reactionMessage.findUnique({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
    });
    if (existing) {
      await this.prisma.reactionMessage.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.reactionMessage.create({ data: { messageId, userId, emoji } });
    }
  }

  /**
   * Toggle d'une réaction sur un message privé.
   * Supprime la réaction si elle existe, la crée sinon.
   */
  private async togglePrivateRecord(messageId: number, userId: string, emoji: string): Promise<void> {
    const existing = await this.prisma.reactionMessagePrive.findUnique({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
    });
    if (existing) {
      await this.prisma.reactionMessagePrive.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.reactionMessagePrive.create({ data: { messageId, userId, emoji } });
    }
  }
}
