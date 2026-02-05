import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { Server } from 'socket.io';
import type { Socket } from 'socket.io';
import { getSessionFromHeaders } from '../lib/session-from-headers.js';
import type {
  PrivateMessageCreatedEvent,
  ChannelMessageCreatedEvent,
} from './realtime-events.types.js';

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

  emitChannelMessageCreated(
    channelId: number,
    payload: Omit<ChannelMessageCreatedEvent, 'channelId'>,
  ) {
    const eventPayload: ChannelMessageCreatedEvent = { channelId, ...payload };
    this.server
      .to('channel:' + channelId)
      .emit('channel-message:created', eventPayload);
  }
}
