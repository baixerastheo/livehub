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

type ChannelSubscribePayload = { channelId?: number };
type ChannelUnsubscribePayload = { channelId?: number };
type ServerSubscribePayload = { serverId?: number };
type ServerUnsubscribePayload = { serverId?: number };

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

  handleConnection(client: Socket) {
    void this.handleConnectionAsync(client).catch(() => {
      client.disconnect(true);
    });
  }

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
  handleChannelSubscribe(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: Socket,
  ) {
    void this.handleChannelSubscribeAsync(
      payload as ChannelSubscribePayload,
      client,
    ).catch(() => undefined);
  }

  private getAuthenticatedUserId(client: Socket): string | undefined {
    const data = (client as AuthenticatedSocket).data as
      | { userId: string }
      | undefined;
    return data?.userId;
  }

  private async handleChannelSubscribeAsync(
    payload: ChannelSubscribePayload,
    client: Socket,
  ) {
    const userId = this.getAuthenticatedUserId(client);
    const channelId =
      typeof payload?.channelId === 'number' ? payload.channelId : null;
    if (userId == null || channelId == null) {
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
    await client.join('channel:' + channelId);
  }

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

  private async handleServerSubscribeAsync(
    payload: ServerSubscribePayload,
    client: Socket,
  ) {
    const userId = this.getAuthenticatedUserId(client);
    const serverId =
      typeof payload?.serverId === 'number' ? payload.serverId : null;
    if (userId == null || serverId == null) {
      return;
    }
    const member = await this.prisma.membreServeur.findUnique({
      where: {
        userId_serveurId: { userId, serveurId: serverId },
      },
    });
    if (!member) return;
    await client.join('server:' + serverId);
  }

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
    const eventPayload: ServerChannelCreatedEvent = {
      serverId,
      channel: payload,
    };
    this.server
      .to('server:' + serverId)
      .emit('server-channel:created', eventPayload);
  }

  emitServerMemberJoined(
    serverId: number,
    payload: ServerMemberJoinedEvent['member'],
  ) {
    const eventPayload: ServerMemberJoinedEvent = { serverId, member: payload };
    this.server
      .to('server:' + serverId)
      .emit('server-member:joined', eventPayload);
  }
}
