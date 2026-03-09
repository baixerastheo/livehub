import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SupabaseStorageService } from '../supabase/supabase-storage.service';
import { MessageGateway } from 'src/realtime/message.gateway';
import { ok, err } from '../result';

const ROLES_CAN_DELETE_MESSAGE = ['PROPRIETAIRE', 'ADMINISTRATEUR'] as const;

function canDeleteChannelMessage(role: string): boolean {
  return ROLES_CAN_DELETE_MESSAGE.includes(
    role as (typeof ROLES_CAN_DELETE_MESSAGE)[number],
  );
}

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseStorage: SupabaseStorageService,
    private readonly messageGateway: MessageGateway,
  ) {}

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
    const listWithAvatars = await Promise.all(
      peerIds
        .map((id) => ({
          id,
          user: userById.get(id),
          lastMessageAt: peerIdToLastAt.get(id),
        }))
        .filter(
          (
            x,
          ): x is {
            id: string;
            user: (typeof users)[number];
            lastMessageAt: Date | undefined;
          } => x.user != null,
        )
        .map(async ({ user, lastMessageAt }) => {
          let avatarUrl: string | null = null;
          if (user.avatarPath) {
            const result = await this.supabaseStorage.publicUrl(
              user.avatarPath,
            );
            if (result.isOk()) avatarUrl = result.value;
          }
          const { avatarPath: _avatarPath, ...peer } = user;
          return { peer: { ...peer, avatarUrl }, lastMessageAt };
        }),
    );
    const list = listWithAvatars.sort(
      (a, b) =>
        (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0),
    );
    return ok(list);
  }

  /** List private messages between current user and peer (both directions), ordered by date. */
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

  /** Send a private message to peerUserId. */
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

    return ok(message);
  }

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

  async createMessage(content: string, channelId: number, userId: string) {
    const channel = await this.prisma.canal.findUnique({
      where: { id: channelId },
      include: { serveur: true },
    });

    if (!channel) {
      return err('No channel found for ID ' + channelId);
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
      return err('No member of this server');
    }

    const message = await this.prisma.message.create({
      data: {
        contenu: content,
        canalId: channelId,
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

    this.messageGateway.emitChannelMessageCreated(channelId, {
      id: String(message.id),
      content: message.contenu,
      authorId: message.auteurId,
      authorName: message.auteur.name ?? '',
      createdAtIso: message.creeLe.toISOString(),
    });

    return ok(message);
  }

  async deleteMessage(id: number, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id },
      include: { auteur: true, canal: true },
    });
    if (!message) {
      return err('No message found for ID ' + id);
    }
    if (!message.canal) {
      return err('Message is not a channel message');
    }

    const serverId = message.canal.serveurId;
    const member = await this.prisma.membreServeur.findUnique({
      where: {
        userId_serveurId: { userId, serveurId: serverId },
      },
    });
    if (!member) {
      return err('You are not a member of this server');
    }
    const role = String(member.role);
    if (!canDeleteChannelMessage(role)) {
      return err(
        'Only the server owner and administrators can delete messages',
      );
    }

    const deletedMessage = await this.prisma.message.delete({
      where: { id },
    });
    return ok(deletedMessage);
  }
}
