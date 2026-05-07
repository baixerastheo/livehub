import { Test } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ChannelMessageService } from '../../src/message/channel-message.service';
import { PrismaService } from '../../src/prisma.service';
import { SupabaseStorageService } from '../../src/supabase/supabase-storage.service';
import { NotificationService } from '../../src/notification/notification.service';
import { AiBotService } from '../../src/message/ai-bot.service';
import { ServerUtilsService } from '../../src/server/server-utils.service';
import { Role } from '../../generated/prisma/enums';

jest.mock('../../src/realtime/message.gateway', () => ({
  MessageGateway: class MessageGateway {},
}));

import { MessageGateway } from '../../src/realtime/message.gateway';

describe('ChannelMessageService', () => {
  let service: ChannelMessageService;

  const prismaMock = {
    canal: {
      findUnique: jest.fn(),
    },
    message: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    membreServeur: {
      findUnique: jest.fn(),
    },
  };

  const supabaseMock = {
    resolveAvatarUrl: jest.fn(),
  };

  const gatewayMock = {
    emitChannelMessageCreated: jest.fn(),
    emitChannelMessageUpdated: jest.fn(),
    emitChannelMessageDeleted: jest.fn(),
    emitMessageMention: jest.fn(),
  };

  const notificationMock = {
    create: jest.fn(),
  };

  const aiBotMock = {
    getBotUserId: jest.fn(),
    generateResponse: jest.fn(),
  };

  const serverUtilsMock = {
    isMember: jest.fn(),
  };

  const channelId = 10;
  const serverId = 5;
  const userId = 'user-123';
  const messageId = 42;
  const botId = 'bot-id';

  const mockChannel = {
    id: channelId,
    nom: 'general',
    serveurId: serverId,
    serveur: { id: serverId, nom: 'Mon Serveur' },
  };

  const mockMember = {
    id: 1,
    userId,
    serveurId: serverId,
    role: Role.MEMBRE,
  };

  const mockMessage = {
    id: messageId,
    contenu: 'Hello World',
    canalId: channelId,
    auteurId: userId,
    creeLe: new Date(),
    editeLe: null,
    auteur: { id: userId, name: 'Alice', email: 'alice@example.com', avatarPath: null },
    canal: { id: channelId, serveurId: serverId },
    reactions: [],
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ChannelMessageService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: SupabaseStorageService, useValue: supabaseMock },
        { provide: MessageGateway, useValue: gatewayMock },
        { provide: NotificationService, useValue: notificationMock },
        { provide: AiBotService, useValue: aiBotMock },
        { provide: ServerUtilsService, useValue: serverUtilsMock },
      ],
    }).compile();

    service = module.get<ChannelMessageService>(ChannelMessageService);
    jest.clearAllMocks();
    supabaseMock.resolveAvatarUrl.mockResolvedValue(null);
    aiBotMock.getBotUserId.mockReturnValue('bot-id');
    notificationMock.create.mockResolvedValue(undefined);
  });

  describe('getHistoryMessageByChannel', () => {
    it('should return messages with aggregated reactions and avatarUrl', async () => {
      prismaMock.canal.findUnique.mockResolvedValue(mockChannel);
      prismaMock.message.findMany.mockResolvedValue([
        {
          ...mockMessage,
          reactions: [{ emoji: '👍', userId: 'user-1' }],
        },
      ]);

      const result = await service.getHistoryMessageByChannel(channelId);

      expect(prismaMock.message.findMany).toHaveBeenCalledWith({
        where: { canalId: channelId },
        orderBy: { creeLe: 'asc' },
        include: {
          auteur: true,
          reactions: { select: { emoji: true, userId: true } },
        },
      });
      expect(result[0].auteur).toHaveProperty('avatarUrl');
      expect(result[0].auteur).not.toHaveProperty('avatarPath');
      expect(result[0].reactions).toEqual([{ emoji: '👍', count: 1, userIds: ['user-1'] }]);
    });

    it('should throw NotFoundException if channel does not exist', async () => {
      prismaMock.canal.findUnique.mockResolvedValue(null);

      await expect(service.getHistoryMessageByChannel(99)).rejects.toThrow(NotFoundException);
    });

    it('should return empty messages array for channel with no messages', async () => {
      prismaMock.canal.findUnique.mockResolvedValue(mockChannel);
      prismaMock.message.findMany.mockResolvedValue([]);

      const result = await service.getHistoryMessageByChannel(channelId);

      expect(result).toEqual([]);
    });
  });

  describe('createMessage', () => {
    it('should create message and emit WebSocket event', async () => {
      prismaMock.canal.findUnique.mockResolvedValue(mockChannel);
      prismaMock.membreServeur.findUnique.mockResolvedValue(mockMember);
      prismaMock.message.create.mockResolvedValue({
        ...mockMessage,
        auteur: { name: 'Alice' },
      });

      const result = await service.createMessage('Hello World', channelId, userId);

      expect(prismaMock.message.create).toHaveBeenCalledWith({
        data: { contenu: 'Hello World', canalId: channelId, auteurId: userId },
        include: { auteur: { select: { name: true } } },
      });
      expect(gatewayMock.emitChannelMessageCreated).toHaveBeenCalledWith(
        channelId,
        expect.objectContaining({ content: 'Hello World' }),
      );
      expect(result.contenu).toBe('Hello World');
    });

    it('should throw NotFoundException if channel does not exist', async () => {
      prismaMock.canal.findUnique.mockResolvedValue(null);

      await expect(
        service.createMessage('Hello', channelId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a server member', async () => {
      prismaMock.canal.findUnique.mockResolvedValue(mockChannel);
      prismaMock.membreServeur.findUnique.mockResolvedValue(null);

      await expect(
        service.createMessage('Hello', channelId, 'outsider'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should notify mentioned users (excluding author)', async () => {
      const mentionedUserId = 'user-456';
      const content = `@[${mentionedUserId}] check this`;
      prismaMock.canal.findUnique.mockResolvedValue(mockChannel);
      prismaMock.membreServeur.findUnique.mockResolvedValue(mockMember);
      prismaMock.message.create.mockResolvedValue({
        ...mockMessage,
        contenu: content,
        auteur: { name: 'Alice' },
      });

      await service.createMessage(content, channelId, userId);

      expect(gatewayMock.emitMessageMention).toHaveBeenCalledWith(
        mentionedUserId,
        expect.objectContaining({ channelId }),
      );
    });

    it('should not notify when author mentions themselves', async () => {
      const content = `@[${userId}] testing`;
      prismaMock.canal.findUnique.mockResolvedValue(mockChannel);
      prismaMock.membreServeur.findUnique.mockResolvedValue(mockMember);
      prismaMock.message.create.mockResolvedValue({
        ...mockMessage,
        contenu: content,
        auteur: { name: 'Alice' },
      });

      await service.createMessage(content, channelId, userId);

      expect(gatewayMock.emitMessageMention).not.toHaveBeenCalled();
    });

    it('should trigger bot response when bot is mentioned and is a server member', async () => {
      const content = `@[${botId}] help me`;
      prismaMock.canal.findUnique.mockResolvedValue(mockChannel);
      prismaMock.membreServeur.findUnique.mockResolvedValue(mockMember);
      prismaMock.message.create
        .mockResolvedValueOnce({ ...mockMessage, contenu: content, auteur: { name: 'Alice' } })
        .mockResolvedValueOnce({
          id: 99,
          contenu: `@[${userId}] réponse bot`,
          auteurId: botId,
          canalId: channelId,
          creeLe: new Date(),
          auteur: { name: 'BOBY' },
        });
      serverUtilsMock.isMember.mockResolvedValue(true);
      prismaMock.message.findMany.mockResolvedValue([]);
      aiBotMock.generateResponse.mockResolvedValue('réponse bot');

      await service.createMessage(content, channelId, userId);
      // Laisser la coroutine void se terminer
      await new Promise((r) => setImmediate(r));

      expect(serverUtilsMock.isMember).toHaveBeenCalledWith(botId, serverId);
      expect(aiBotMock.generateResponse).toHaveBeenCalled();
      expect(gatewayMock.emitChannelMessageCreated).toHaveBeenCalledTimes(2);
    });

    it('should not call generateResponse if bot is not a server member', async () => {
      const content = `@[${botId}] help me`;
      prismaMock.canal.findUnique.mockResolvedValue(mockChannel);
      prismaMock.membreServeur.findUnique.mockResolvedValue(mockMember);
      prismaMock.message.create.mockResolvedValue({
        ...mockMessage,
        contenu: content,
        auteur: { name: 'Alice' },
      });
      serverUtilsMock.isMember.mockResolvedValue(false);
      prismaMock.message.findMany.mockResolvedValue([]);

      await service.createMessage(content, channelId, userId);
      await new Promise((r) => setImmediate(r));

      expect(aiBotMock.generateResponse).not.toHaveBeenCalled();
    });
  });

  describe('deleteMessage', () => {
    it('should delete message when user is admin', async () => {
      const adminMember = { ...mockMember, role: Role.ADMINISTRATEUR };
      prismaMock.message.findUnique.mockResolvedValue(mockMessage);
      prismaMock.membreServeur.findUnique.mockResolvedValue(adminMember);
      prismaMock.message.delete.mockResolvedValue(mockMessage);

      const result = await service.deleteMessage(messageId, userId);

      expect(prismaMock.message.delete).toHaveBeenCalledWith({ where: { id: messageId } });
      expect(result).toEqual(mockMessage);
    });

    it('should delete message when user is server owner', async () => {
      const ownerMember = { ...mockMember, role: Role.PROPRIETAIRE };
      prismaMock.message.findUnique.mockResolvedValue(mockMessage);
      prismaMock.membreServeur.findUnique.mockResolvedValue(ownerMember);
      prismaMock.message.delete.mockResolvedValue(mockMessage);

      await service.deleteMessage(messageId, userId);

      expect(prismaMock.message.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if message does not exist', async () => {
      prismaMock.message.findUnique.mockResolvedValue(null);

      await expect(service.deleteMessage(99, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if message is not a channel message', async () => {
      prismaMock.message.findUnique.mockResolvedValue({ ...mockMessage, canal: null });

      await expect(service.deleteMessage(messageId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      prismaMock.message.findUnique.mockResolvedValue(mockMessage);
      prismaMock.membreServeur.findUnique.mockResolvedValue(null);

      await expect(service.deleteMessage(messageId, 'outsider')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if regular member tries to delete', async () => {
      prismaMock.message.findUnique.mockResolvedValue(mockMessage);
      prismaMock.membreServeur.findUnique.mockResolvedValue(mockMember);

      await expect(service.deleteMessage(messageId, userId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('editChannelMessage', () => {
    it('should edit message content and emit update event', async () => {
      const updatedMessage = { ...mockMessage, contenu: 'Updated content' };
      prismaMock.message.findUnique.mockResolvedValue(mockMessage);
      prismaMock.message.update.mockResolvedValue(updatedMessage);

      const result = await service.editChannelMessage(messageId, userId, 'Updated content');

      expect(prismaMock.message.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: messageId },
          data: expect.objectContaining({ contenu: 'Updated content' }),
        }),
      );
      expect(gatewayMock.emitChannelMessageUpdated).toHaveBeenCalledWith(
        channelId,
        expect.objectContaining({ content: 'Updated content' }),
      );
      expect(result.contenu).toBe('Updated content');
    });

    it('should throw NotFoundException if message does not exist', async () => {
      prismaMock.message.findUnique.mockResolvedValue(null);

      await expect(
        service.editChannelMessage(99, userId, 'content'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the author', async () => {
      prismaMock.message.findUnique.mockResolvedValue(mockMessage);

      await expect(
        service.editChannelMessage(messageId, 'other-user', 'content'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
