import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SupabaseStorageService } from '../supabase/supabase-storage.service';
import { ok, err } from '../result';

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseStorage: SupabaseStorageService,
  ) {}

  private async getUserAvatarUrl(avatarPath: string | null) {
    if (avatarPath === null) {
      return err('Avatar path is required');
    }

    const avatarUrlResult = await this.supabaseStorage.publicUrl(avatarPath);
    if (avatarUrlResult.isErr()) {
      return err(avatarUrlResult.error);
    }
    return ok(avatarUrlResult.value);
  }

  /**
   * Liste les conversations privées d'un utilisateur.
   * Retourne les pairs de conversation triés par date du dernier message.
   * @param currentUserId - Identifiant de l'utilisateur courant
   * @returns Liste des pairs avec leur dernier message
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
      },
    });
    const peerIdToLastAt = new Map<string, Date>();
    for (const m of messages) {
      const peerId =
        m.expediteurId === currentUserId ? m.destinataireId : m.expediteurId;
      if (!peerIdToLastAt.has(peerId)) {
        peerIdToLastAt.set(peerId, m.creeLe);
      }
    }
    const peerIds = Array.from(peerIdToLastAt.keys());
    if (peerIds.length === 0) {
      return ok([]);
    }
    const users = await this.prisma.user.findMany({
      where: { id: { in: peerIds } },
      select: { id: true, name: true, email: true, avatarPath: true },
    });
    const userById = new Map(users.map((u) => [u.id, u]));
    const list: Array<{
      peer: {
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
      };
      lastMessageAt: Date | undefined;
    }> = [];
    for (const id of peerIds) {
      const user = userById.get(id);
      if (!user) continue;

      const avatarUrlResult = await this.getUserAvatarUrl(user.avatarPath);
      let avatarUrl: string | null = null;
      if (avatarUrlResult.isOk()) {
        avatarUrl = avatarUrlResult.value;
      }

      list.push({
        peer: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl,
        },
        lastMessageAt: peerIdToLastAt.get(id),
      });
    }
    list.sort(
      (a, b) =>
        (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0),
    );
    return ok(list);
  }

  /**
   * Récupère la conversation privée entre deux utilisateurs.
   * @param peerUserId - Identifiant du pair
   * @param currentUserId - Identifiant de l'utilisateur courant
   * @returns Messages de la conversation ou erreur si utilisateur non trouvé
   */
  async getPrivateConversation(peerUserId: string, currentUserId: string) {
    const peer = await this.prisma.user.findUnique({
      where: { id: peerUserId },
      select: { id: true, name: true, email: true },
    });
    if (!peer) {
      return err('User not found');
    }
    const messages = await this.prisma.messagePrive.findMany({
      where: {
        OR: [
          {
            expediteurId: currentUserId,
            destinataireId: peerUserId,
          },
          {
            expediteurId: peerUserId,
            destinataireId: currentUserId,
          },
        ],
      },
      orderBy: { creeLe: 'asc' },
      include: {
        expediteur: { select: { id: true, name: true, email: true } },
      },
    });
    return ok({ peer, messages });
  }

  /**
   * Envoie un message privé à un utilisateur.
   * Empêche l'envoi de message à soi-même.
   * @param senderId - Identifiant de l'expéditeur
   * @param recipientId - Identifiant du destinataire
   * @param content - Contenu du message
   * @returns Le message créé ou erreur
   */
  async createPrivateMessage(
    senderId: string,
    recipientId: string,
    content: string,
  ) {
    if (senderId === recipientId) {
      return err('Cannot send a private message to yourself');
    }
    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId },
    });
    if (!recipient) {
      return err('User not found');
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
    return ok(message);
  }

  /**
   * Récupère l'historique des messages d'un canal.
   * @param id - Identifiant du canal
   * @returns Liste des messages avec leurs auteurs ou erreur si canal non trouvé
   */
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

  /**
   * Crée un message dans un canal.
   * Vérifie que l'utilisateur est membre du serveur.
   * @param content - Contenu du message
   * @param channelId - Identifiant du canal
   * @param userId - Identifiant de l'auteur
   * @returns Le message créé ou erreur si non autorisé
   */
  async createMessage(content: string, channelId: number, userId: string) {
    const channel = await this.prisma.canal.findUnique({
      where: { id: channelId },
      include: { serveur: true },
    });

    if (!channel) {
      return err(`No channel found for ID ${channelId}`);
    }

    const serverMember = await this.prisma.membreServeur.findUnique({
      where: {
        userId_serveurId: {
          userId,
          serveurId: channel.serveur.id,
        },
      },
    });

    if (!serverMember) {
      return err('You are not a member of this server');
    }

    const message = await this.prisma.message.create({
      data: {
        contenu: content,
        canalId: channelId,
        auteurId: userId,
      },
      include: {
        auteur: {
          select: { name: true },
        },
      },
    });
    return ok(message);
  }

  /**
   * Supprime un message.
   * Seul l'auteur du message peut le supprimer.
   * @param id - Identifiant du message
   * @param userId - Identifiant de l'utilisateur demandant la suppression
   * @returns Le message supprimé ou erreur si non autorisé
   */
  async deleteMessage(id: number, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id },
      include: { auteur: true },
    });
    if (!message) {
      return err(`No message found for ID ${id}`);
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
