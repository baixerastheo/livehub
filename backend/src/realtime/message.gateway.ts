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
  ChannelMessageCreatedEvent,
  ChannelMessageUpdatedEvent,
  PrivateMessageUpdatedEvent,
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
  VoiceChannelPresenceEvent,
  MessageMentionEvent,
  FriendRequestReceivedEvent,
  FriendRequestAcceptedEvent,
  FriendRequestDeclinedEvent,
} from './realtime-events.types.js';
import { PrismaService } from '../prisma.service.js';
import { PresenceService } from './presence.service.js';
import { VoicePresenceService } from './voice-presence.service.js';
import { SupabaseStorageService } from '../supabase/supabase-storage.service.js';
import { TypeCanal } from '../../generated/prisma/enums.js';

export type AuthenticatedSocket = Socket & { data: { userId: string } };

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
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
    private readonly voicePresence: VoicePresenceService,
    private readonly supabaseStorage: SupabaseStorageService,
  ) {}

  handleConnection(client: Socket) {
    this.safe(
      async () => {
        const session = await getSessionFromHeaders(client.handshake.headers);
        if (!session?.user?.id) {
          client.disconnect(true);
          return;
        }

        const userId = session.user.id;
        (client as AuthenticatedSocket).data = { userId };
        void client.join('user:' + userId);

        if (this.presence.increment(userId)) {
          void this.broadcastPresence(userId, 'online');
        }
      },
      () => client.disconnect(true),
    );
  }

  handleDisconnect(client: Socket) {
    const userId = this.getUserId(client);
    if (!userId) return;
    this.broadcastVoiceLeave(client.id);
    if (this.presence.decrement(userId)) {
      void this.broadcastPresence(userId, 'offline');
    }
  }

  @SubscribeMessage('channel:subscribe')
  handleChannelSubscribe(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: Socket,
  ) {
    this.safe(async () => {
      const channelId = this.num(payload, 'channelId');
      if (channelId == null) return;
      const ctx = await this.resolveChannelMember(client, channelId);
      if (ctx) await client.join('channel:' + channelId);
    });
  }

  @SubscribeMessage('channel:unsubscribe')
  handleChannelUnsubscribe(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: Socket,
  ) {
    const channelId = this.num(payload, 'channelId');
    if (channelId != null) void client.leave('channel:' + channelId);
  }

  @SubscribeMessage('channel:typing')
  handleChannelTyping(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: Socket,
  ) {
    this.safe(async () => {
      const channelId = this.num(payload, 'channelId');
      const userName = this.str(payload, 'userName') ?? 'Someone';
      if (channelId == null) return;
      const ctx = await this.resolveChannelMember(client, channelId);
      if (!ctx) return;
      this.server
        .to('channel:' + channelId)
        .emit('channel:typing', { channelId, userId: ctx.userId, userName });
    });
  }

  @SubscribeMessage('channel:stop-typing')
  handleChannelStopTyping(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: Socket,
  ) {
    const channelId = this.num(payload, 'channelId');
    const userId = this.getUserId(client);
    if (userId == null || channelId == null) return;
    this.server
      .to('channel:' + channelId)
      .emit('channel:stop-typing', { channelId, userId });
  }

  @SubscribeMessage('server:subscribe')
  handleServerSubscribe(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: Socket,
  ) {
    this.safe(async () => {
      const serverId = this.num(payload, 'serverId');
      if (serverId == null) return;
      const ctx = await this.resolveServerMember(client, serverId);
      if (ctx) await client.join('server:' + serverId);
    });
  }

  @SubscribeMessage('server:unsubscribe')
  handleServerUnsubscribe(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: Socket,
  ) {
    const serverId = this.num(payload, 'serverId');
    if (serverId != null) void client.leave('server:' + serverId);
  }

  @SubscribeMessage('voice:join')
  handleVoiceJoin(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: Socket,
  ) {
    this.safe(async () => {
      const channelId = this.num(payload, 'channelId');
      const isMuted = (payload as { isMuted?: boolean })?.isMuted === true;
      if (channelId == null) return;

      const ctx = await this.resolveChannelMember(client, channelId);
      if (!ctx || ctx.channelType !== TypeCanal.VOCAL) return;

      const member = await this.prisma.membreServeur.findUnique({
        where: {
          userId_serveurId: { userId: ctx.userId, serveurId: ctx.serverId },
        },
        include: { user: { select: { name: true, avatarPath: true } } },
      });
      if (!member) return;

      let avatarUrl: string | null = null;
      if (member.user.avatarPath) {
        try {
          avatarUrl = await this.supabaseStorage.publicUrl(
            member.user.avatarPath,
          );
        } catch {
          /* keep null */
        }
      }

      this.voicePresence.join(channelId, ctx.serverId, client.id, {
        userId: ctx.userId,
        name: member.user.name ?? ctx.userId,
        avatarUrl,
        isMuted,
      });
      this.emitVoicePresence(channelId, ctx.serverId);
    });
  }

  @SubscribeMessage('voice:leave')
  handleVoiceLeave(@ConnectedSocket() client: Socket) {
    this.broadcastVoiceLeave(client.id);
  }

  @SubscribeMessage('voice:mute')
  handleVoiceMute(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: Socket,
  ) {
    const isMuted = (payload as { isMuted?: boolean })?.isMuted === true;
    const meta = this.voicePresence.setMuted(client.id, isMuted);
    if (meta) this.emitVoicePresence(meta.channelId, meta.serverId);
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
    this.server
      .to('user:' + recipientId)
      .emit('private-message:created', { ...rest, peerUserId: senderId });
    this.server
      .to('user:' + senderId)
      .emit('private-message:created', { ...rest, peerUserId: recipientId });
  }

  emitChannelMessageCreated(
    channelId: number,
    payload: Omit<ChannelMessageCreatedEvent, 'channelId'>,
  ) {
    this.server
      .to('channel:' + channelId)
      .emit('channel-message:created', { channelId, ...payload });
  }

  emitChannelMessageUpdated(
    channelId: number,
    payload: ChannelMessageUpdatedEvent,
  ) {
    this.server
      .to('channel:' + channelId)
      .emit('channel-message:updated', payload);
  }

  emitChannelMessageDeleted(channelId: number, messageId: number) {
    this.server
      .to('channel:' + channelId)
      .emit('channel-message:deleted', { channelId, messageId });
  }

  emitPrivateMessageUpdated(
    senderId: string,
    recipientId: string,
    payload: PrivateMessageUpdatedEvent,
  ) {
    this.server.to('user:' + senderId).emit('private-message:updated', payload);
    this.server
      .to('user:' + recipientId)
      .emit('private-message:updated', payload);
  }

  emitServerChannelCreated(
    serverId: number,
    payload: ServerChannelCreatedEvent['channel'],
  ) {
    this.server
      .to('server:' + serverId)
      .emit('server-channel:created', { serverId, channel: payload });
  }

  emitServerChannelUpdated(
    serverId: number,
    payload: ServerChannelUpdatedEvent['channel'],
  ) {
    this.server
      .to('server:' + serverId)
      .emit('server-channel:updated', { serverId, channel: payload });
  }

  emitServerChannelDeleted(serverId: number, channelId: number) {
    this.server.to('server:' + serverId).emit('server-channel:deleted', {
      serverId,
      channelId,
    } as ServerChannelDeletedEvent);
  }

  emitServerMemberJoined(
    serverId: number,
    payload: ServerMemberJoinedEvent['member'],
  ) {
    this.server
      .to('server:' + serverId)
      .emit('server-member:joined', { serverId, member: payload });
  }

  emitUserAddedToServer(userId: string, payload: UserAddedToServerEvent) {
    this.server.to('user:' + userId).emit('user:added-to-server', payload);
  }

  emitMessageMention(userId: string, payload: MessageMentionEvent) {
    this.server.to('user:' + userId).emit('message:mention', payload);
  }

  emitServerOwnershipTransferred(
    serverId: number,
    payload: Omit<ServerOwnershipTransferredEvent, 'serverId'>,
  ) {
    this.server
      .to('server:' + serverId)
      .emit('server-ownership:transferred', { serverId, ...payload });
  }

  emitServerMemberBanned(
    serverId: number,
    payload: Omit<ServerMemberBannedEvent, 'serverId'>,
  ) {
    const event: ServerMemberBannedEvent = { serverId, ...payload };
    this.server.to('server:' + serverId).emit('server-member:banned', event);
    this.server
      .to('user:' + payload.bannedUserId)
      .emit('server-member:banned', event);
  }

  emitServerMemberKicked(
    serverId: number,
    payload: Omit<ServerMemberKickedEvent, 'serverId'>,
  ) {
    const event: ServerMemberKickedEvent = { serverId, ...payload };
    this.server.to('server:' + serverId).emit('server-member:kicked', event);
    this.server
      .to('user:' + payload.kickedUserId)
      .emit('server-member:kicked', event);
  }

  emitServerMemberUnbanned(
    serverId: number,
    payload: Omit<ServerMemberUnbannedEvent, 'serverId'>,
  ) {
    this.server.to('server:' + serverId).emit('server-member:unbanned', {
      serverId,
      ...payload,
    } as ServerMemberUnbannedEvent);
  }

  emitFriendRequestReceived(
    toUserId: string,
    payload: FriendRequestReceivedEvent,
  ) {
    this.server.to('user:' + toUserId).emit('friend-request:received', payload);
  }

  emitFriendRequestAccepted(
    toUserId: string,
    payload: FriendRequestAcceptedEvent,
  ) {
    this.server.to('user:' + toUserId).emit('friend-request:accepted', payload);
  }

  emitFriendRequestDeclined(
    toUserId: string,
    payload: FriendRequestDeclinedEvent,
  ) {
    this.server.to('user:' + toUserId).emit('friend-request:declined', payload);
  }

  emitChannelReactionUpdated(
    channelId: number,
    messageId: number,
    reactions: MessageReactionUpdatedEvent['reactions'],
  ) {
    this.server
      .to('channel:' + channelId)
      .emit('message:reaction-updated', { messageId, reactions });
  }

  emitPrivateReactionUpdated(
    expediteurId: string,
    destinataireId: string,
    messageId: number,
    reactions: MessageReactionUpdatedEvent['reactions'],
  ) {
    this.server
      .to('user:' + expediteurId)
      .emit('message:reaction-updated', { messageId, reactions });
    this.server
      .to('user:' + destinataireId)
      .emit('message:reaction-updated', { messageId, reactions });
  }

  private safe(fn: () => Promise<void>, onError?: () => void) {
    void fn().catch(() => onError?.());
  }

  private getUserId(client: Socket): string | undefined {
    const data = (client as AuthenticatedSocket).data as
      | { userId: string }
      | undefined;
    return data?.userId;
  }

  private num(payload: unknown, key: string): number | null {
    const p = payload as Record<string, unknown> | null | undefined;
    return typeof p?.[key] === 'number' ? p[key] : null;
  }

  private str(payload: unknown, key: string): string | null {
    const p = payload as Record<string, unknown> | null | undefined;
    return typeof p?.[key] === 'string' ? p[key] : null;
  }

  private async resolveChannelMember(client: Socket, channelId: number) {
    const userId = this.getUserId(client);
    if (!userId) return null;

    const channel = await this.prisma.canal.findUnique({
      where: { id: channelId },
      select: { serveurId: true, type: true },
    });
    if (!channel) return null;

    const member = await this.prisma.membreServeur.findUnique({
      where: { userId_serveurId: { userId, serveurId: channel.serveurId } },
    });
    if (!member) return null;

    return { userId, serverId: channel.serveurId, channelType: channel.type };
  }

  private async resolveServerMember(client: Socket, serverId: number) {
    const userId = this.getUserId(client);
    if (!userId) return null;
    const member = await this.prisma.membreServeur.findUnique({
      where: { userId_serveurId: { userId, serveurId: serverId } },
    });
    return member ? { userId } : null;
  }

  private emitVoicePresence(channelId: number, serverId: number) {
    const payload: VoiceChannelPresenceEvent = {
      channelId,
      serverId,
      participants: this.voicePresence.getParticipants(channelId),
    };
    this.server
      .to('server:' + serverId)
      .emit('voice-channel:presence', payload);
  }

  private broadcastVoiceLeave(socketId: string) {
    const meta = this.voicePresence.leave(socketId);
    if (meta) this.emitVoicePresence(meta.channelId, meta.serverId);
  }

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
}
