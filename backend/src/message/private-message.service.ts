import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SupabaseStorageService } from '../supabase/supabase-storage.service';
import { MessageGateway } from '../realtime/message.gateway';
import { AiBotService } from './ai-bot.service';
import { NotificationService } from '../notification/notification.service';
import { TypeNotification } from '../../generated/prisma/enums';
import { aggregateReactions } from './message.utils';

/** Service de gestion des messages privés : conversations, envoi, et intégration du bot BOBY. */
@Injectable()
export class PrivateMessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseStorage: SupabaseStorageService,
    private readonly messageGateway: MessageGateway,
    private readonly aiBotService: AiBotService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Récupère la liste des conversations privées de l'utilisateur courant.
   * Déduplique les pairs et trie par date du dernier message décroissante.
   * Le bot BOBY est toujours affiché en premier s'il n'a pas encore de conversation.
   * @param currentUserId - Identifiant de l'utilisateur courant
   * @returns Liste des pairs avec avatarUrl, date et contenu du dernier message
   */
  async listPrivateConversations(currentUserId: string) {
    const messages = await this.prisma.messagePrive.findMany({
      where: {
        OR: [
          { expediteurId: currentUserId },
          { destinataireId: currentUserId },
        ],
      },
      orderBy: { creeLe: 'desc' },
      select: {
        expediteurId: true,
        destinataireId: true,
        creeLe: true,
        contenu: true,
      },
    });

    const peerIdToLast = new Map<string, { at: Date; content: string }>();
    for (const m of messages) {
      const peerId =
        m.expediteurId === currentUserId ? m.destinataireId : m.expediteurId;
      if (!peerIdToLast.has(peerId)) {
        peerIdToLast.set(peerId, { at: m.creeLe, content: m.contenu });
      }
    }

    const peerIds = Array.from(peerIdToLast.keys());

    const users = await this.prisma.user.findMany({
      where: { id: { in: peerIds } },
      select: { id: true, name: true, email: true, avatarPath: true },
    });
    const userById = new Map(users.map((u) => [u.id, u]));

    const listWithAvatars = await Promise.all(
      peerIds
        .map((id) => ({
          id,
          user: userById.get(id),
          lastMessageAt: peerIdToLast.get(id)?.at,
          lastMessageContent: peerIdToLast.get(id)?.content,
        }))
        .filter(
          (
            x,
          ): x is {
            id: string;
            user: (typeof users)[number];
            lastMessageAt: Date | undefined;
            lastMessageContent: string | undefined;
          } => x.user != null,
        )
        .map(async ({ user, lastMessageAt, lastMessageContent }) => {
          const { avatarPath: _avatarPath, ...peer } = user;
          return {
            peer: {
              ...peer,
              avatarUrl: await this.supabaseStorage.resolveAvatarUrl(
                user.avatarPath,
              ),
            },
            lastMessageAt,
            lastMessageContent,
          };
        }),
    );

    const sorted = listWithAvatars.sort(
      (a, b) =>
        (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0),
    );

    const botId = this.aiBotService.getBotUserId();
    if (botId && !sorted.some((item) => item.peer.id === botId)) {
      const botUser = await this.prisma.user.findUnique({
        where: { id: botId },
        select: { id: true, name: true, email: true, avatarPath: true },
      });
      if (botUser) {
        const { avatarPath: _avatarPath, ...botPeer } = botUser;
        sorted.unshift({
          peer: { ...botPeer, avatarUrl: null },
          lastMessageAt: undefined,
          lastMessageContent: undefined,
        });
      }
    }

    return sorted;
  }

  /**
   * Récupère l'historique des messages privés entre l'utilisateur courant et un pair.
   * @param peerUserId - Identifiant du pair
   * @param currentUserId - Identifiant de l'utilisateur courant
   * @returns Infos du pair et liste des messages triés par date croissante avec réactions agrégées
   * @throws NotFoundException si le pair n'existe pas
   */
  async getPrivateConversation(peerUserId: string, currentUserId: string) {
    const peer = await this.prisma.user.findUnique({
      where: { id: peerUserId },
      select: { id: true, name: true, email: true },
    });
    if (!peer) throw new NotFoundException('User not found');

    const rawMessages = await this.prisma.messagePrive.findMany({
      where: {
        OR: [
          { expediteurId: currentUserId, destinataireId: peerUserId },
          { expediteurId: peerUserId, destinataireId: currentUserId },
        ],
      },
      orderBy: { creeLe: 'asc' },
      include: {
        expediteur: { select: { id: true, name: true, email: true } },
        reactions: { select: { emoji: true, userId: true } },
      },
    });

    const messages = rawMessages.map((m) => ({
      ...m,
      reactions: aggregateReactions(m.reactions),
    }));

    return { peer, messages };
  }

  /**
   * Envoie un message privé et notifie les deux parties via WebSocket.
   * Si le destinataire est le bot, déclenche une réponse IA en tâche de fond.
   * @param senderId - Identifiant de l'expéditeur
   * @param recipientId - Identifiant du destinataire
   * @param content - Contenu du message
   * @returns Le message créé
   * @throws BadRequestException si l'expéditeur et le destinataire sont identiques
   * @throws NotFoundException si le destinataire n'existe pas
   */
  async createPrivateMessage(
    senderId: string,
    recipientId: string,
    content: string,
  ) {
    if (senderId === recipientId) {
      throw new BadRequestException(
        'Cannot send a private message to yourself',
      );
    }

    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId },
    });
    if (!recipient) throw new NotFoundException('User not found');

    const message = await this.prisma.messagePrive.create({
      data: {
        expediteurId: senderId,
        destinataireId: recipientId,
        contenu: content,
      },
      include: {
        expediteur: { select: { id: true, name: true, email: true } },
      },
    });

    this.messageGateway.emitPrivateMessageCreated({
      id: String(message.id),
      content: message.contenu,
      authorId: message.expediteurId,
      authorName: message.expediteur.name ?? message.expediteur.email,
      createdAtIso: message.creeLe.toISOString(),
      read: message.lu,
      senderId,
      recipientId,
    });

    void this.notificationService.create(
      recipientId,
      TypeNotification.PRIVATE_MESSAGE,
      {
        authorId: message.expediteurId,
        authorName: message.expediteur.name ?? message.expediteur.email,
        content: content.slice(0, 100),
      },
    );

    if (recipientId === this.aiBotService.getBotUserId()) {
      void this.sendBotResponse(senderId);
    }

    return message;
  }

  /**
   * Génère et envoie la réponse du bot BOBY en tâche de fond.
   * Récupère l'historique complet, appelle l'IA, persiste la réponse et la diffuse via WebSocket.
   * @param userId - Identifiant de l'utilisateur qui a écrit au bot
   */
  private async sendBotResponse(userId: string): Promise<void> {
    const botId = this.aiBotService.getBotUserId();

    const history = await this.prisma.messagePrive.findMany({
      where: {
        OR: [
          { expediteurId: userId, destinataireId: botId },
          { expediteurId: botId, destinataireId: userId },
        ],
      },
      orderBy: { creeLe: 'asc' },
      select: { contenu: true, expediteurId: true },
    });

    const messages = history.map((m) => ({
      role:
        m.expediteurId === botId ? ('assistant' as const) : ('user' as const),
      content: m.contenu,
    }));

    const aiResponse = await this.aiBotService.generateResponse(messages);

    const botMessage = await this.prisma.messagePrive.create({
      data: {
        expediteurId: botId,
        destinataireId: userId,
        contenu: aiResponse,
      },
      include: {
        expediteur: { select: { id: true, name: true, email: true } },
      },
    });

    this.messageGateway.emitPrivateMessageCreated({
      id: String(botMessage.id),
      content: botMessage.contenu,
      authorId: botMessage.expediteurId,
      authorName: botMessage.expediteur.name ?? botMessage.expediteur.email,
      createdAtIso: botMessage.creeLe.toISOString(),
      read: botMessage.lu,
      senderId: botId,
      recipientId: userId,
    });
  }
}
