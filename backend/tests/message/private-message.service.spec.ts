import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrivateMessageService } from '../../src/message/private-message.service';
import { PrismaService } from '../../src/prisma.service';
import { SupabaseStorageService } from '../../src/supabase/supabase-storage.service';
import { AiBotService } from '../../src/message/ai-bot.service';
import { NotificationService } from '../../src/notification/notification.service';

jest.mock('../../src/realtime/message.gateway', () => ({
  MessageGateway: class MessageGateway {},
}));

import { MessageGateway } from '../../src/realtime/message.gateway';

describe('PrivateMessageService', () => {
  let service: PrivateMessageService;

  const prismaMock = {
    messagePrive: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const supabaseMock = {
    resolveAvatarUrl: jest.fn(),
  };

  const gatewayMock = {
    emitPrivateMessageCreated: jest.fn(),
    emitPrivateMessageUpdated: jest.fn(),
  };

  const aiBotMock = {
    getBotUserId: jest.fn(),
    generateResponse: jest.fn(),
  };

  const notificationMock = {
    create: jest.fn(),
  };

  const senderId = 'user-sender';
  const recipientId = 'user-recipient';
  const botId = 'bot-id';

  const mockRecipient = {
    id: recipientId,
    name: 'Bob',
    email: 'bob@example.com',
    avatarPath: null,
  };

  const mockMessage = {
    id: 1,
    contenu: 'Hello!',
    expediteurId: senderId,
    destinataireId: recipientId,
    creeLe: new Date(),
    editeLe: null,
    lu: false,
    expediteur: { id: senderId, name: 'Alice', email: 'alice@example.com' },
    reactions: [],
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PrivateMessageService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: SupabaseStorageService, useValue: supabaseMock },
        { provide: MessageGateway, useValue: gatewayMock },
        { provide: AiBotService, useValue: aiBotMock },
        { provide: NotificationService, useValue: notificationMock },
      ],
    }).compile();

    service = module.get<PrivateMessageService>(PrivateMessageService);
    jest.clearAllMocks();
    supabaseMock.resolveAvatarUrl.mockResolvedValue(null);
    aiBotMock.getBotUserId.mockReturnValue(botId);
    notificationMock.create.mockResolvedValue(undefined);
  });

  describe('listPrivateConversations', () => {
    it('should return conversations deduplicated and sorted by last message date', async () => {
      const older = new Date(Date.now() - 10000);
      const newer = new Date();
      prismaMock.messagePrive.findMany.mockResolvedValue([
        { expediteurId: senderId, destinataireId: recipientId, creeLe: newer, contenu: 'Hi' },
        { expediteurId: senderId, destinataireId: recipientId, creeLe: older, contenu: 'Hey' },
      ]);
      prismaMock.user.findMany.mockResolvedValue([mockRecipient]);
      aiBotMock.getBotUserId.mockReturnValue(null);

      const result = await service.listPrivateConversations(senderId);

      expect(result).toHaveLength(1);
      expect(result[0].peer.id).toBe(recipientId);
      expect(result[0].lastMessageContent).toBe('Hi');
    });

    it('should prepend bot conversation when bot exists but no chat yet', async () => {
      prismaMock.messagePrive.findMany.mockResolvedValue([]);
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.user.findUnique.mockResolvedValue({
        id: botId,
        name: 'BOBY',
        email: 'bot@livehub.ai',
        avatarPath: null,
      });

      const result = await service.listPrivateConversations(senderId);

      expect(result[0].peer.id).toBe(botId);
    });

    it('should not duplicate bot when bot already has a conversation', async () => {
      prismaMock.messagePrive.findMany.mockResolvedValue([
        { expediteurId: senderId, destinataireId: botId, creeLe: new Date(), contenu: 'Hi bot' },
      ]);
      prismaMock.user.findMany.mockResolvedValue([
        { id: botId, name: 'BOBY', email: 'bot@livehub.ai', avatarPath: null },
      ]);

      const result = await service.listPrivateConversations(senderId);

      const botConversations = result.filter((r) => r.peer.id === botId);
      expect(botConversations).toHaveLength(1);
    });

    it('should return empty list when no conversations exist and no bot', async () => {
      prismaMock.messagePrive.findMany.mockResolvedValue([]);
      prismaMock.user.findMany.mockResolvedValue([]);
      aiBotMock.getBotUserId.mockReturnValue(null);

      const result = await service.listPrivateConversations(senderId);

      expect(result).toEqual([]);
    });
  });

  describe('getPrivateConversation', () => {
    it('should return peer info and messages with aggregated reactions', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockRecipient);
      prismaMock.messagePrive.findMany.mockResolvedValue([
        {
          ...mockMessage,
          reactions: [{ emoji: '❤️', userId: senderId }],
        },
      ]);

      const result = await service.getPrivateConversation(recipientId, senderId);

      expect(result.peer).toEqual(mockRecipient);
      expect(result.messages[0].reactions).toEqual([
        { emoji: '❤️', count: 1, userIds: [senderId] },
      ]);
    });

    it('should throw NotFoundException if peer user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getPrivateConversation('unknown', senderId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return messages ordered chronologically', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockRecipient);
      prismaMock.messagePrive.findMany.mockResolvedValue([mockMessage]);

      await service.getPrivateConversation(recipientId, senderId);

      expect(prismaMock.messagePrive.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { creeLe: 'asc' } }),
      );
    });
  });

  describe('createPrivateMessage', () => {
    it('should create message and emit WebSocket event', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockRecipient);
      prismaMock.messagePrive.create.mockResolvedValue(mockMessage);

      const result = await service.createPrivateMessage(senderId, recipientId, 'Hello!');

      expect(prismaMock.messagePrive.create).toHaveBeenCalledWith({
        data: {
          expediteurId: senderId,
          destinataireId: recipientId,
          contenu: 'Hello!',
        },
        include: { expediteur: { select: { id: true, name: true, email: true } } },
      });
      expect(gatewayMock.emitPrivateMessageCreated).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'Hello!', senderId, recipientId }),
      );
      expect(result).toEqual(mockMessage);
    });

    it('should throw BadRequestException when sending to self', async () => {
      await expect(
        service.createPrivateMessage(senderId, senderId, 'hello'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if recipient does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createPrivateMessage(senderId, 'unknown', 'hello'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create notification for the recipient', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockRecipient);
      prismaMock.messagePrive.create.mockResolvedValue(mockMessage);

      await service.createPrivateMessage(senderId, recipientId, 'Hello!');

      expect(notificationMock.create).toHaveBeenCalledWith(
        recipientId,
        expect.any(String),
        expect.objectContaining({ content: 'Hello!' }),
      );
    });

    it('should trigger bot response when recipient is the bot', async () => {
      const botMessage = {
        id: 2,
        contenu: 'réponse bot',
        expediteurId: botId,
        destinataireId: senderId,
        creeLe: new Date(),
        lu: false,
        expediteur: { id: botId, name: 'BOBY', email: 'bot@livehub.ai' },
      };
      prismaMock.user.findUnique
        .mockResolvedValueOnce({ id: botId, name: 'BOBY', email: 'bot@livehub.ai' })
        .mockResolvedValueOnce(undefined);
      prismaMock.messagePrive.create
        .mockResolvedValueOnce({ ...mockMessage, destinataireId: botId })
        .mockResolvedValueOnce(botMessage);
      prismaMock.messagePrive.findMany.mockResolvedValue([]);
      aiBotMock.generateResponse.mockResolvedValue('réponse bot');

      await service.createPrivateMessage(senderId, botId, 'Salut bot');
      await new Promise((r) => setImmediate(r));

      expect(aiBotMock.generateResponse).toHaveBeenCalled();
      expect(gatewayMock.emitPrivateMessageCreated).toHaveBeenCalledTimes(2);
    });
  });

  describe('editPrivateMessage', () => {
    it('should edit message content and emit update event', async () => {
      const updatedMessage = { ...mockMessage, contenu: 'Updated!' };
      prismaMock.messagePrive.findUnique.mockResolvedValue(mockMessage);
      prismaMock.messagePrive.update.mockResolvedValue(updatedMessage);

      const result = await service.editPrivateMessage(1, senderId, 'Updated!');

      expect(prismaMock.messagePrive.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ contenu: 'Updated!' }),
        }),
      );
      expect(gatewayMock.emitPrivateMessageUpdated).toHaveBeenCalledWith(
        senderId,
        recipientId,
        expect.objectContaining({ content: 'Updated!' }),
      );
      expect(result.contenu).toBe('Updated!');
    });

    it('should throw NotFoundException if message does not exist', async () => {
      prismaMock.messagePrive.findUnique.mockResolvedValue(null);

      await expect(
        service.editPrivateMessage(99, senderId, 'content'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the sender', async () => {
      prismaMock.messagePrive.findUnique.mockResolvedValue(mockMessage);

      await expect(
        service.editPrivateMessage(1, 'other-user', 'content'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
