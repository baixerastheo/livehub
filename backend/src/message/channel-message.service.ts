import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SupabaseStorageService } from '../supabase/supabase-storage.service';
import { MessageGateway } from '../realtime/message.gateway';
import { NotificationService } from '../notification/notification.service';
import { Role, TypeNotification } from '../../generated/prisma/enums';
import { aggregateReactions } from './message.utils';

/** Vérifie qu'un rôle autorise la suppression de messages. */
function canDelete(role: string): boolean {
  return role === Role.ADMINISTRATEUR || role === Role.PROPRIETAIRE;
}

/** Service de gestion des messages de canal : historique, envoi, suppression et mentions. */
@Injectable()
export class ChannelMessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseStorage: SupabaseStorageService,
    private readonly messageGateway: MessageGateway,
    private readonly notificationService: NotificationService,
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
   * Gère aussi les mentions (@[userId]).
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

    this.messageGateway.emitChannelMessageCreated(channelId, {
      id: String(message.id),
      content: message.contenu,
      authorId: message.auteurId,
      authorName: message.auteur.name ?? '',
      createdAtIso: message.creeLe.toISOString(),
    });

    this.processMentions(
      content,
      userId,
      channelId,
      channel.serveur.id,
      message.auteur.name ?? '',
    );

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
   * Extrait les mentions (@[userId]) du contenu et notifie chaque utilisateur mentionné
   * via WebSocket et notification persistante.
   * @param content - Contenu brut du message
   * @param authorId - ID de l'auteur (exclu des mentions)
   * @param channelId - Canal où le message a été posté
   * @param serverId - Serveur du canal
   * @param authorName - Nom de l'auteur affiché dans la notification
   */
  private processMentions(
    content: string,
    authorId: string,
    channelId: number,
    serverId: number,
    authorName: string,
  ): void {
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

    for (const mentionedUserId of mentionedUserIds) {
      this.messageGateway.emitMessageMention(mentionedUserId, mentionData);
      void this.notificationService.create(
        mentionedUserId,
        TypeNotification.MENTION,
        mentionData,
      );
    }
  }
}
