import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import type { Server } from 'socket.io';
import type { Socket } from 'socket.io';
import { getSessionFromHeaders } from '../lib/session-from-headers.js';
import type {
  PrivateMessageCreatedEvent,
  ChannelMessageCreatedEvent,
  ServerChannelCreatedEvent,
  ServerMemberJoinedEvent,
} from './realtime-events.types.js';
import { PrismaService } from '../prisma.service.js';

const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN ??
  process.env.FRONTEND_URL ??
  'http://localhost:3000';

/** Socket with authenticated user id attached by handleConnection. */
export type AuthenticatedSocket = Socket & { data: { userId: string } };

@WebSocketGateway({
  cors: {
    origin: FRONTEND_ORIGIN,
    credentials: true,
  },
  transports: ['websocket'],
})
export class MessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(private readonly prisma: PrismaService) {}

  async handleConnection(client: Socket) {
    try {
      const session = await getSessionFromHeaders(client.handshake.headers);

      if (!session?.user?.id) {
        client.disconnect(true);
        return;
      }

      (client as AuthenticatedSocket).data = { userId: session.user.id };
      client.join('user:' + session.user.id);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: Socket) {
    // Optional
  }

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

  @SubscribeMessage('channel:subscribe')
  async handleChannelSubscribe(
    @MessageBody() payload: { channelId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const socket = client as AuthenticatedSocket;
    const userId = socket.data?.userId;
    const channelId = payload?.channelId;
    if (userId == null || channelId == null || typeof channelId !== 'number') {
      return;
    }
    const channel = await this.prisma.canal.findUnique({
      where: { id: channelId },
      select: { serveurId: true },
    });
    if (!channel) return;
    const member = await this.prisma.membreServeur.findUnique({
      where: {
        userId_serveurId: { userId, serveurId: channel.serveurId },
      },
    });
    if (!member) return;
    client.join('channel:' + channelId);
  }

  @SubscribeMessage('channel:unsubscribe')
  handleChannelUnsubscribe(
    @MessageBody() payload: { channelId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const channelId = payload?.channelId;
    if (channelId != null && typeof channelId === 'number') {
      client.leave('channel:' + channelId);
    }
  }

  @SubscribeMessage('server:subscribe')
  async handleServerSubscribe(
    @MessageBody() payload: { serverId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const socket = client as AuthenticatedSocket;
    const userId = socket.data?.userId;
    const serverId = payload?.serverId;
    if (userId == null || serverId == null || typeof serverId !== 'number') {
      return;
    }
    const member = await this.prisma.membreServeur.findUnique({
      where: {
        userId_serveurId: { userId, serveurId: serverId },
      },
    });
    if (!member) return;
    client.join('server:' + serverId);
  }

  @SubscribeMessage('server:unsubscribe')
  handleServerUnsubscribe(
    @MessageBody() payload: { serverId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const serverId = payload?.serverId;
    if (serverId != null && typeof serverId === 'number') {
      client.leave('server:' + serverId);
    }
  }

  emitChannelMessageCreated(
    channelId: number,
    payload: Omit<ChannelMessageCreatedEvent, 'channelId'>,
  ) {
    const eventPayload: ChannelMessageCreatedEvent = { channelId, ...payload };
    this.server
      .to('channel:' + channelId)
      .emit('channel-message:created', eventPayload);
  }

  emitServerChannelCreated(
    serverId: number,
    payload: ServerChannelCreatedEvent['channel'],
  ) {
    const eventPayload: ServerChannelCreatedEvent = { serverId, channel: payload };
    this.server.to('server:' + serverId).emit('server-channel:created', eventPayload);
  }

  emitServerMemberJoined(
    serverId: number,
    payload: ServerMemberJoinedEvent['member'],
  ) {
    const eventPayload: ServerMemberJoinedEvent = { serverId, member: payload };
    this.server.to('server:' + serverId).emit('server-member:joined', eventPayload);
  }
}
