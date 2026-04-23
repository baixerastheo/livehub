import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SupabaseStorageService } from '../supabase/supabase-storage.service';
import { MessageGateway } from '../realtime/message.gateway';
import { NotificationService } from '../notification/notification.service';
import { AiBotService } from './ai-bot.service';
import { ServerUtilsService } from '../server/server-utils.service';
import { Role, TypeNotification } from '../../generated/prisma/enums';
import { aggregateReactions } from './message.utils';

/** Vérifie qu'un rôle autorise la suppression de messages. */
function canDelete(role: string): boolean {
  return role === Role.ADMINISTRATEUR || role === Role.PROPRIETAIRE;
}

/** Service de gestion des messages de canal : historique, envoi, suppression, mentions et bot. */
@Injectable()
export class ChannelMessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseStorage: SupabaseStorageService,
    private readonly messageGateway: MessageGateway,
    private readonly notificationService: NotificationService,
    private readonly aiBotService: AiBotService,
    private readonly serverUtils: ServerUtilsService,
  ) {}

  /**
   * Récupère l'historique des messages d'un canal, triés par date croissante.
   * @param id - Identifiant du canal
   * @returns Liste des messages avec auteur, avatarUrl et réactions agrégées
   * @throws NotFoundException si le canal n'existe pas
   */
  async getHistoryMessageByChannel(id: number) {
    const channel = await this.prisma.canal.findUnique({ where: { id } });
    if (!channel) throw new NotFoundException('No channel found for ID ' + id);

    const messages = await this.prisma.message.findMany({
      where: { canalId: id },
      orderBy: { creeLe: 'asc' },
      include: {
        auteur: true,
        reactions: { select: { emoji: true, userId: true } },
      },
    });

    return Promise.all(
      messages.map(async (m) => {
        const { avatarPath: _avatarPath, ...auteurRest } = m.auteur;
        return {
          ...m,
          auteur: {
            ...auteurRest,
            avatarUrl: await this.supabaseStorage.resolveAvatarUrl(
              m.auteur.avatarPath,
            ),
          },
          reactions: aggregateReactions(m.reactions),
        };
      }),
    );
  }

  /**
   * Envoie un message dans un canal et notifie les abonnés via WebSocket.
   * Traite les mentions (@[userId]) et déclenche le bot si BOBY est mentionné.
   * @param content - Contenu du message
   * @param channelId - Identifiant du canal cible
   * @param userId - Identifiant de l'auteur
   * @returns Le message créé
   * @throws NotFoundException si le canal n'existe pas
   * @throws ForbiddenException si l'utilisateur n'est pas membre du serveur
   */
  async createMessage(content: string, channelId: number, userId: string) {
    const channel = await this.prisma.canal.findUnique({
      where: { id: channelId },
      include: { serveur: true },
    });
    if (!channel)
      throw new NotFoundException('No channel found for ID ' + channelId);

    const serverMember = await this.prisma.membreServeur.findUnique({
      where: { userId_serveurId: { userId, serveurId: channel.serveur.id } },
    });
    if (!serverMember)
      throw new ForbiddenException('You are not a member of this server');

    const message = await this.prisma.message.create({
      data: { contenu: content, canalId: channelId, auteurId: userId },
      include: { auteur: { select: { name: true } } },
    });

    const authorName = message.auteur.name ?? '';

    this.messageGateway.emitChannelMessageCreated(channelId, {
      id: String(message.id),
      content: message.contenu,
      authorId: userId,
      authorName,
      createdAtIso: message.creeLe.toISOString(),
    });

    const mentionedUserIds = this.processMentions(
      content,
      userId,
      channelId,
      channel.serveur.id,
      authorName,
    );

    // Si BOBY est mentionné et est membre du serveur, il répond dans le canal
    const botId = this.aiBotService.getBotUserId();
    if (botId && mentionedUserIds.has(botId)) {
      void this.sendBotChannelResponse(channelId, channel.serveur.id, userId);
    }

    return message;
  }

  /**
   * Supprime un message de canal.
   * Réservé aux propriétaires et administrateurs.
   * @param id - Identifiant du message à supprimer
   * @param userId - Identifiant de l'utilisateur qui effectue l'action
   * @returns Le message supprimé
   * @throws NotFoundException si le message n'existe pas ou n'est pas un message de canal
   * @throws ForbiddenException si l'utilisateur n'est pas membre ou n'a pas les droits
   */
  async deleteMessage(id: number, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id },
      include: { auteur: true, canal: true },
    });
    if (!message) throw new NotFoundException('No message found for ID ' + id);
    if (!message.canal)
      throw new NotFoundException('Message is not a channel message');

    const member = await this.prisma.membreServeur.findUnique({
      where: {
        userId_serveurId: { userId, serveurId: message.canal.serveurId },
      },
    });
    if (!member)
      throw new ForbiddenException('You are not a member of this server');
    if (!canDelete(String(member.role))) {
      throw new ForbiddenException(
        'Only the server owner and administrators can delete messages',
      );
    }

    return this.prisma.message.delete({ where: { id } });
  }

  /**
   * Modifie le contenu d'un message de canal.
   * Seul l'auteur du message peut le modifier.
   * @param id - Identifiant du message
   * @param userId - Identifiant de l'utilisateur effectuant la modification
   * @param content - Nouveau contenu du message
   */
  async editChannelMessage(id: number, userId: string, content: string) {
    const message = await this.prisma.message.findUnique({
      where: { id },
    });
    if (!message) throw new NotFoundException('No message found for ID ' + id);
    if (message.auteurId !== userId)
      throw new ForbiddenException('You can only edit your own messages');

    const editedAt = new Date();
    const updated = await this.prisma.message.update({
      where: { id },
      data: { contenu: content, editeLe: editedAt },
    });

    this.messageGateway.emitChannelMessageUpdated(message.canalId, {
      channelId: message.canalId,
      id: String(id),
      content: updated.contenu,
      editedAtIso: editedAt.toISOString(),
    });

    return updated;
  }

  /**
   * Extrait les mentions (@[userId]) du contenu, notifie chaque utilisateur mentionné
   * via WebSocket et notification persistante, et retourne l'ensemble des IDs mentionnés.
   * @param content - Contenu brut du message
   * @param authorId - ID de l'auteur (exclu des mentions)
   * @param channelId - Canal où le message a été posté
   * @param serverId - Serveur du canal
   * @param authorName - Nom de l'auteur affiché dans la notification
   * @returns Ensemble des IDs des utilisateurs mentionnés (hors auteur)
   */
  private processMentions(
    content: string,
    authorId: string,
    channelId: number,
    serverId: number,
    authorName: string,
  ): Set<string> {
    const mentionedUserIds = new Set(
      [...content.matchAll(/@\[([a-z0-9-]+)\]/gi)]
        .map((m) => m[1])
        .filter((id) => id !== authorId),
    );

    const mentionData = {
      channelId,
      serverId,
      authorName,
      messagePreview: content.slice(0, 100),
    };

    const botId = this.aiBotService.getBotUserId();
    for (const mentionedUserId of mentionedUserIds) {
      if (mentionedUserId === botId) continue;
      this.messageGateway.emitMessageMention(mentionedUserId, mentionData);
      void this.notificationService.create(
        mentionedUserId,
        TypeNotification.MENTION,
        mentionData,
      );
    }

    return mentionedUserIds;
  }

  /**
   * Génère et publie la réponse de BOBY dans un canal en tâche de fond.
   * Récupère les derniers messages du canal comme contexte, appelle l'IA,
   * persiste la réponse et la diffuse via WebSocket en mentionnant l'auteur déclencheur.
   * Ne fait rien si BOBY n'est pas membre du serveur.
   * @param channelId - Canal où BOBY doit répondre
   * @param serverId - Serveur du canal (pour vérifier l'appartenance)
   * @param UserId - ID de l'utilisateur qui a mentionné le bot
   */
  private async sendBotChannelResponse(
    channelId: number,
    serverId: number,
    UserId: string,
  ) {
    const botId = this.aiBotService.getBotUserId();

    if (!(await this.serverUtils.isMember(botId, serverId))) return;

    // Récupère lesderniers messages du canal comme contexte pour l'IA
    const recentMessages = await this.prisma.message.findMany({
      where: { canalId: channelId },
      orderBy: { creeLe: 'desc' },
      select: { contenu: true, auteurId: true },
    });

    // Remet dans l'ordre chronologique et mappe en format conversation IA
    // Les mentions @[userId] sont retirées pour ne pas polluer le contexte IA
    const chatMessages = recentMessages.reverse().map((m) => ({
      role: m.auteurId === botId ? ('assistant' as const) : ('user' as const),
      content: m.contenu.replace(/@\[[a-z0-9-]+\]/gi, '').trim(),
    }));

    const aiResponse = await this.aiBotService.generateResponse(chatMessages);

    const responseContent = '@[' + UserId + '] ' + aiResponse;

    const botMessage = await this.prisma.message.create({
      data: { contenu: responseContent, canalId: channelId, auteurId: botId },
      include: { auteur: { select: { name: true } } },
    });

    this.messageGateway.emitChannelMessageCreated(channelId, {
      id: String(botMessage.id),
      content: botMessage.contenu,
      authorId: botId,
      authorName: botMessage.auteur.name ?? 'BOBY',
      createdAtIso: botMessage.creeLe.toISOString(),
    });

    // Notifie l'utilisateur déclencheur que BOBY lui a répondu
    void this.notificationService.create(UserId, TypeNotification.MENTION, {
      channelId,
      serverId,
      authorName: botMessage.auteur.name ?? 'BOBY',
      messagePreview: aiResponse.slice(0, 100),
    });
  }
}
