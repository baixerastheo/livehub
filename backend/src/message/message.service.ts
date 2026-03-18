import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SupabaseStorageService } from '../supabase/supabase-storage.service';
import { MessageGateway } from 'src/realtime/message.gateway';

const ROLES_CAN_DELETE_MESSAGE = ['PROPRIETAIRE', 'ADMINISTRATEUR'] as const;

/**
 * Vérifie si un rôle donné autorise la suppression de messages de canal.
 * @param role - Rôle du membre sous forme de chaîne
 * @returns true si le rôle peut supprimer des messages
 */
function canDeleteChannelMessage(role: string): boolean {
  return ROLES_CAN_DELETE_MESSAGE.includes(
    role as (typeof ROLES_CAN_DELETE_MESSAGE)[number],
  );
}

/**
 * Service de gestion des messages.
 * Gère les messages privés et les messages de canal.
 */
@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseStorage: SupabaseStorageService,
    private readonly messageGateway: MessageGateway,
  ) {}

  /**
   * Récupère la liste des conversations privées de l'utilisateur courant.
   * Déduplique les pairs et trie par date du dernier message décroissante.
   * @param currentUserId - Identifiant de l'utilisateur courant
   * @returns Liste des pairs avec la date du dernier message et leur avatar
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
    if (peerIds.length === 0) return [];

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
          let avatarUrl: string | null = null;
          if (user.avatarPath) {
            try {
              avatarUrl = await this.supabaseStorage.publicUrl(user.avatarPath);
            } catch {
              avatarUrl = null;
            }
          }
          const { avatarPath: _avatarPath, ...peer } = user;
          return {
            peer: { ...peer, avatarUrl },
            lastMessageAt,
            lastMessageContent,
          };
        }),
    );

    return listWithAvatars.sort(
      (a, b) =>
        (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0),
    );
  }

  /**
   * Récupère l'historique des messages privés entre l'utilisateur courant et un pair.
   * @param peerUserId - Identifiant de l'utilisateur pair
   * @param currentUserId - Identifiant de l'utilisateur courant
   * @returns Infos du pair et liste des messages triés par date croissante
   * @throws NotFoundException si le pair n'existe pas
   */
  async getPrivateConversation(peerUserId: string, currentUserId: string) {
    const peer = await this.prisma.user.findUnique({
      where: { id: peerUserId },
      select: { id: true, name: true, email: true },
    });
    if (!peer) {
      throw new NotFoundException('User not found');
    }

    const messages = await this.prisma.messagePrive.findMany({
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

    return { peer, messages };
  }

  /**
   * Envoie un message privé à un utilisateur et notifie les deux parties via WebSocket.
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
    if (!recipient) {
      throw new NotFoundException('User not found');
    }

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

    return message;
  }

  /**
   * Récupère l'historique des messages d'un canal, triés par date croissante.
   * @param id - Identifiant du canal
   * @returns Liste des messages avec les infos auteur
   * @throws NotFoundException si le canal n'existe pas
   */
  async getHistoryMessageByChannel(id: number) {
    const channel = await this.prisma.canal.findUnique({ where: { id } });
    if (!channel) {
      throw new NotFoundException(`No channel found for ID ${id}`);
    }

    return this.prisma.message.findMany({
      where: { canalId: id },
      orderBy: { creeLe: 'asc' },
      include: {
        auteur: true,
        reactions: { select: { emoji: true, userId: true } },
      },
    });
  }

  /**
   * Envoie un message dans un canal et notifie les abonnés via WebSocket.
   * L'utilisateur doit être membre du serveur auquel appartient le canal.
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
    if (!channel) {
      throw new NotFoundException(`No channel found for ID ${channelId}`);
    }

    const serverMember = await this.prisma.membreServeur.findUnique({
      where: { userId_serveurId: { userId, serveurId: channel.serveur.id } },
    });
    if (!serverMember) {
      throw new ForbiddenException('You are not a member of this server');
    }

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

    return message;
  }

  /**
   * Supprime un message de canal.
   * Seuls le propriétaire et les administrateurs du serveur peuvent supprimer des messages.
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
    if (!message) {
      throw new NotFoundException(`No message found for ID ${id}`);
    }
    if (!message.canal) {
      throw new NotFoundException('Message is not a channel message');
    }

    const member = await this.prisma.membreServeur.findUnique({
      where: {
        userId_serveurId: { userId, serveurId: message.canal.serveurId },
      },
    });
    if (!member) {
      throw new ForbiddenException('You are not a member of this server');
    }
    if (!canDeleteChannelMessage(String(member.role))) {
      throw new ForbiddenException(
        'Only the server owner and administrators can delete messages',
      );
    }

    return this.prisma.message.delete({ where: { id } });
  }
}
