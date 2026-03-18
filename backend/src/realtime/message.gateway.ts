import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { getSessionFromHeaders } from '../lib/session-from-headers.js';
import type {
  PrivateMessageCreatedEvent,
  ChannelMessageCreatedEvent,
  ServerChannelCreatedEvent,
  ServerChannelUpdatedEvent,
  ServerChannelDeletedEvent,
  ServerMemberJoinedEvent,
  UserAddedToServerEvent,
  ServerOwnershipTransferredEvent,
  ServerMemberBannedEvent,
  ServerMemberUnbannedEvent,
  ServerMemberKickedEvent,
  MessageReactionUpdatedEvent,
} from './realtime-events.types.js';
import { PrismaService } from '../prisma.service.js';
import { PresenceService } from './presence.service.js';

export type AuthenticatedSocket = Socket & { data: { userId: string } };

type ChannelSubscribePayload = { channelId?: number };
type ChannelUnsubscribePayload = { channelId?: number };
type ChannelTypingPayload = { channelId?: number; userName?: string };
type ServerSubscribePayload = { serverId?: number };
type ServerUnsubscribePayload = { serverId?: number };

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket'],
})
export class MessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly presence: PresenceService,
  ) {}

  /**
   * Point d'entrée synchrone requis par NestJS lors d'une nouvelle connexion.
   * Délègue à la version async et déconnecte le client en cas d'erreur.
   * @param client - Socket entrant
   */
  handleConnection(client: Socket) {
    void this.handleConnectionAsync(client).catch(() => {
      client.disconnect(true);
    });
  }

  /**
   * Authentifie le client via la session extraite des headers du handshake.
   * Attache l'userId au socket et met à jour la présence si c'est la première connexion.
   * @param client - Socket entrant
   */
  private async handleConnectionAsync(client: Socket) {
    try {
      const session = await getSessionFromHeaders(client.handshake.headers);

      if (!session?.user?.id) {
        client.disconnect(true);
        return;
      }

      const userId = session.user.id;
      (client as AuthenticatedSocket).data = { userId };
      void client.join('user:' + userId);

      const justWentOnline = this.presence.increment(userId);
      if (justWentOnline) {
        void this.broadcastPresence(userId, 'online');
      }
    } catch {
      client.disconnect(true);
    }
  }

  /**
   * Gère la déconnexion d'un client.
   * Décrémente le compteur de présence et diffuse le statut offline si nécessaire.
   * @param client - Socket qui se déconnecte
   */
  handleDisconnect(client: Socket) {
    const userId = this.getAuthenticatedUserId(client);
    if (!userId) return;

    const justWentOffline = this.presence.decrement(userId);
    if (justWentOffline) {
      void this.broadcastPresence(userId, 'offline');
    }
  }

  /**
   * Diffuse un changement de présence à toutes les rooms serveur de l'utilisateur
   * ainsi qu'aux rooms de ses amis.
   * @param userId - Identifiant de l'utilisateur dont le statut change
   * @param status - Nouveau statut à diffuser
   */
  private async broadcastPresence(
    userId: string,
    status: 'online' | 'offline',
  ) {
    const serverEvent =
      status === 'online' ? 'server-member:online' : 'server-member:offline';
    const friendEvent = status === 'online' ? 'user:online' : 'user:offline';

    const memberships = await this.prisma.membreServeur.findMany({
      where: { userId },
      select: { serveurId: true },
    });
    for (const { serveurId } of memberships) {
      this.server.to('server:' + serveurId).emit(serverEvent, { userId });
    }

    const recipientIds = new Set<string>();

    const friendships = await this.prisma.amitie.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      select: { userAId: true, userBId: true },
    });
    for (const { userAId, userBId } of friendships) {
      recipientIds.add(userAId === userId ? userBId : userAId);
    }

    const [sent, received] = await Promise.all([
      this.prisma.messagePrive.findMany({
        where: { expediteurId: userId },
        select: { destinataireId: true },
        distinct: ['destinataireId'],
      }),
      this.prisma.messagePrive.findMany({
        where: { destinataireId: userId },
        select: { expediteurId: true },
        distinct: ['expediteurId'],
      }),
    ]);
    for (const { destinataireId } of sent) recipientIds.add(destinataireId);
    for (const { expediteurId } of received) recipientIds.add(expediteurId);

    for (const recipientId of recipientIds) {
      this.server.to('user:' + recipientId).emit(friendEvent, { userId });
    }
  }

  /**
   * Extrait l'userId authentifié stocké dans les données du socket.
   * @param client - Socket dont on veut l'identifiant
   * @returns L'userId ou undefined si le socket n'est pas authentifié
   */
  private getAuthenticatedUserId(client: Socket): string | undefined {
    const data = (client as AuthenticatedSocket).data as
      | { userId: string }
      | undefined;
    return data?.userId;
  }

  /**
   * Gère l'abonnement d'un client à un canal (événement `channel:subscribe`).
   * @param payload - Corps du message contenant le channelId
   * @param client - Socket émetteur
   */
  @SubscribeMessage('channel:subscribe')
  handleChannelSubscribe(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: Socket,
  ) {
    void this.handleChannelSubscribeAsync(
      payload as ChannelSubscribePayload,
      client,
    ).catch(() => undefined);
  }

  /**
   * Vérifie que l'utilisateur est bien membre du serveur auquel appartient le canal,
   * puis le fait rejoindre la room `channel:<id>`.
   * @param payload - Payload contenant le channelId
   * @param client - Socket authentifié
   */
  private async handleChannelSubscribeAsync(
    payload: ChannelSubscribePayload,
    client: Socket,
  ) {
    const userId = this.getAuthenticatedUserId(client);
    const channelId =
      typeof payload?.channelId === 'number' ? payload.channelId : null;
    if (userId == null || channelId == null) return;

    const channel = await this.prisma.canal.findUnique({
      where: { id: channelId },
      select: { serveurId: true },
    });
    if (!channel) return;

    const member = await this.prisma.membreServeur.findUnique({
      where: { userId_serveurId: { userId, serveurId: channel.serveurId } },
    });
    if (!member) return;

    await client.join('channel:' + channelId);
  }

  /**
   * Gère le désabonnement d'un client d'un canal (événement `channel:unsubscribe`).
   * @param payload - Corps du message contenant le channelId
   * @param client - Socket émetteur
   */
  @SubscribeMessage('channel:unsubscribe')
  handleChannelUnsubscribe(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: Socket,
  ) {
    const body = payload as ChannelUnsubscribePayload;
    const channelId =
      typeof body?.channelId === 'number' ? body.channelId : null;
    if (channelId != null) {
      void client.leave('channel:' + channelId);
    }
  }

  /**
   * Gère l'événement de frappe en cours dans un canal (événement `channel:typing`).
   * @param payload - Corps du message contenant channelId et userName
   * @param client - Socket émetteur
   */
  @SubscribeMessage('channel:typing')
  handleChannelTyping(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: Socket,
  ) {
    void this.handleChannelTypingAsync(
      payload as ChannelTypingPayload,
      client,
    ).catch(() => undefined);
  }

  /**
   * Vérifie que l'utilisateur est membre du serveur avant de diffuser l'indicateur
   * de frappe à tous les abonnés du canal.
   * @param payload - Payload contenant channelId et userName
   * @param client - Socket authentifié
   */
  private async handleChannelTypingAsync(
    payload: ChannelTypingPayload,
    client: Socket,
  ) {
    const userId = this.getAuthenticatedUserId(client);
    const channelId =
      typeof payload?.channelId === 'number' ? payload.channelId : null;
    const userName =
      typeof payload?.userName === 'string' ? payload.userName : 'Someone';
    if (userId == null || channelId == null) return;

    const channel = await this.prisma.canal.findUnique({
      where: { id: channelId },
      select: { serveurId: true },
    });
    if (!channel) return;

    const member = await this.prisma.membreServeur.findUnique({
      where: { userId_serveurId: { userId, serveurId: channel.serveurId } },
    });
    if (!member) return;

    this.server
      .to('channel:' + channelId)
      .emit('channel:typing', { channelId, userId, userName });
  }

  /**
   * Gère l'arrêt de frappe dans un canal (événement `channel:stop-typing`).
   * @param payload - Corps du message contenant le channelId
   * @param client - Socket émetteur
   */
  @SubscribeMessage('channel:stop-typing')
  handleChannelStopTyping(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: Socket,
  ) {
    const body = payload as { channelId?: number };
    const userId = this.getAuthenticatedUserId(client);
    const channelId =
      typeof body?.channelId === 'number' ? body.channelId : null;
    if (userId == null || channelId == null) return;

    this.server
      .to('channel:' + channelId)
      .emit('channel:stop-typing', { channelId, userId });
  }

  /**
   * Gère l'abonnement d'un client à un serveur (événement `server:subscribe`).
   * @param payload - Corps du message contenant le serverId
   * @param client - Socket émetteur
   */
  @SubscribeMessage('server:subscribe')
  handleServerSubscribe(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: Socket,
  ) {
    void this.handleServerSubscribeAsync(
      payload as ServerSubscribePayload,
      client,
    ).catch(() => undefined);
  }

  /**
   * Vérifie que l'utilisateur est membre du serveur avant de le faire rejoindre
   * la room `server:<id>`.
   * @param payload - Payload contenant le serverId
   * @param client - Socket authentifié
   */
  private async handleServerSubscribeAsync(
    payload: ServerSubscribePayload,
    client: Socket,
  ) {
    const userId = this.getAuthenticatedUserId(client);
    const serverId =
      typeof payload?.serverId === 'number' ? payload.serverId : null;
    if (userId == null || serverId == null) return;

    const member = await this.prisma.membreServeur.findUnique({
      where: { userId_serveurId: { userId, serveurId: serverId } },
    });
    if (!member) return;

    await client.join('server:' + serverId);
  }

  /**
   * Gère le désabonnement d'un client d'un serveur (événement `server:unsubscribe`).
   * @param payload - Corps du message contenant le serverId
   * @param client - Socket émetteur
   */
  @SubscribeMessage('server:unsubscribe')
  handleServerUnsubscribe(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: Socket,
  ) {
    const body = payload as ServerUnsubscribePayload;
    const serverId = typeof body?.serverId === 'number' ? body.serverId : null;
    if (serverId != null) {
      void client.leave('server:' + serverId);
    }
  }

  /**
   * Émet l'événement `private-message:created` aux deux participants d'une conversation.
   * Chaque participant reçoit un payload avec le peerUserId de l'autre.
   * @param payload - Données du message privé incluant senderId et recipientId
   */
  emitPrivateMessageCreated(payload: {
    id: string;
    content: string;
    authorId: string;
    authorName: string;
    createdAtIso: string;
    read: boolean;
    senderId: string;
    recipientId: string;
  }) {
    const { senderId, recipientId, ...rest } = payload;

    const senderEvent: PrivateMessageCreatedEvent = {
      ...rest,
      peerUserId: recipientId,
    };
    const recipientEvent: PrivateMessageCreatedEvent = {
      ...rest,
      peerUserId: senderId,
    };

    this.server
      .to('user:' + recipientId)
      .emit('private-message:created', recipientEvent);
    this.server
      .to('user:' + senderId)
      .emit('private-message:created', senderEvent);
  }

  /**
   * Émet l'événement `channel-message:created` à tous les abonnés d'un canal.
   * @param channelId - Identifiant du canal cible
   * @param payload - Données du message (sans le channelId)
   */
  emitChannelMessageCreated(
    channelId: number,
    payload: Omit<ChannelMessageCreatedEvent, 'channelId'>,
  ) {
    const eventPayload: ChannelMessageCreatedEvent = { channelId, ...payload };
    this.server
      .to('channel:' + channelId)
      .emit('channel-message:created', eventPayload);
  }

  /**
   * Émet l'événement `server-channel:created` à tous les membres d'un serveur.
   * @param serverId - Identifiant du serveur cible
   * @param payload - Données du canal créé
   */
  emitServerChannelCreated(
    serverId: number,
    payload: ServerChannelCreatedEvent['channel'],
  ) {
    const eventPayload: ServerChannelCreatedEvent = {
      serverId,
      channel: payload,
    };
    this.server
      .to('server:' + serverId)
      .emit('server-channel:created', eventPayload);
  }

  /**
   * Émet l'événement `server-channel:updated` à tous les membres d'un serveur.
   * @param serverId - Identifiant du serveur cible
   * @param payload - Données du canal mis à jour
   */
  emitServerChannelUpdated(
    serverId: number,
    payload: ServerChannelUpdatedEvent['channel'],
  ) {
    const eventPayload: ServerChannelUpdatedEvent = {
      serverId,
      channel: payload,
    };
    this.server
      .to('server:' + serverId)
      .emit('server-channel:updated', eventPayload);
  }

  /**
   * Émet l'événement `server-channel:deleted` à tous les membres d'un serveur.
   * @param serverId - Identifiant du serveur cible
   * @param channelId - Identifiant du canal supprimé
   */
  emitServerChannelDeleted(serverId: number, channelId: number) {
    const eventPayload: ServerChannelDeletedEvent = { serverId, channelId };
    this.server
      .to('server:' + serverId)
      .emit('server-channel:deleted', eventPayload);
  }

  /**
   * Émet l'événement `server-member:joined` à tous les membres d'un serveur.
   * @param serverId - Identifiant du serveur cible
   * @param payload - Données du nouveau membre
   */
  emitServerMemberJoined(
    serverId: number,
    payload: ServerMemberJoinedEvent['member'],
  ) {
    const eventPayload: ServerMemberJoinedEvent = { serverId, member: payload };
    this.server
      .to('server:' + serverId)
      .emit('server-member:joined', eventPayload);
  }

  /**
   * Notifie l'utilisateur ajouté à un serveur via sa room personnelle.
   * Permet à son client de mettre à jour la liste des serveurs sans rechargement.
   * @param userId - Identifiant de l'utilisateur ajouté
   * @param payload - Informations du serveur rejoint
   */
  emitUserAddedToServer(userId: string, payload: UserAddedToServerEvent) {
    this.server.to('user:' + userId).emit('user:added-to-server', payload);
  }

  /**
   * Émet l'événement de transfert de propriété à tous les membres du serveur.
   * @param serverId - Identifiant du serveur
   * @param payload - Données du transfert (ancien et nouveau propriétaire)
   */
  emitServerOwnershipTransferred(
    serverId: number,
    payload: Omit<ServerOwnershipTransferredEvent, 'serverId'>,
  ) {
    const eventPayload: ServerOwnershipTransferredEvent = {
      serverId,
      ...payload,
    };
    this.server
      .to('server:' + serverId)
      .emit('server-ownership:transferred', eventPayload);
  }

  emitServerMemberBanned(
    serverId: number,
    payload: Omit<ServerMemberBannedEvent, 'serverId'>,
  ) {
    const eventPayload: ServerMemberBannedEvent = { serverId, ...payload };
    this.server
      .to('server:' + serverId)
      .emit('server-member:banned', eventPayload);
    this.server
      .to('user:' + payload.bannedUserId)
      .emit('server-member:banned', eventPayload);
  }

  emitServerMemberKicked(
    serverId: number,
    payload: Omit<ServerMemberKickedEvent, 'serverId'>,
  ) {
    const eventPayload: ServerMemberKickedEvent = { serverId, ...payload };
    this.server
      .to('server:' + serverId)
      .emit('server-member:kicked', eventPayload);
    this.server
      .to('user:' + payload.kickedUserId)
      .emit('server-member:kicked', eventPayload);
  }

  emitServerMemberUnbanned(
    serverId: number,
    payload: Omit<ServerMemberUnbannedEvent, 'serverId'>,
  ) {
    const eventPayload: ServerMemberUnbannedEvent = { serverId, ...payload };
    this.server
      .to('server:' + serverId)
      .emit('server-member:unbanned', eventPayload);
  }

  /**
   * Émet `message:reaction-updated` à la room appropriée selon le type de message.
   * Pour les messages de canal, émet à `channel:<channelId>`.
   * Pour les messages privés, émet aux rooms des deux participants.
   * @param type - Type de message : 'channel' ou 'private'
   * @param target - channelId pour les canaux, ou { expediteurId, destinataireId } pour les MP
   * @param messageId - Identifiant du message concerné
   * @param reactions - Réactions agrégées
   */
  emitReactionUpdated(
    type: 'channel',
    target: number,
    messageId: number,
    reactions: MessageReactionUpdatedEvent['reactions'],
  ): void;
  emitReactionUpdated(
    type: 'private',
    target: { expediteurId: string; destinataireId: string },
    messageId: number,
    reactions: MessageReactionUpdatedEvent['reactions'],
  ): void;
  emitReactionUpdated(
    type: 'channel' | 'private',
    target: number | { expediteurId: string; destinataireId: string },
    messageId: number,
    reactions: MessageReactionUpdatedEvent['reactions'],
  ) {
    const eventPayload: MessageReactionUpdatedEvent = { messageId, reactions };
    if (type === 'channel') {
      this.server
        .to('channel:' + (target as number))
        .emit('message:reaction-updated', eventPayload);
    } else {
      const { expediteurId, destinataireId } = target as {
        expediteurId: string;
        destinataireId: string;
      };
      this.server
        .to('user:' + expediteurId)
        .emit('message:reaction-updated', eventPayload);
      this.server
        .to('user:' + destinataireId)
        .emit('message:reaction-updated', eventPayload);
    }
  }
}
