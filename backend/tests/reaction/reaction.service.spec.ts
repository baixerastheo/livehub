import { Test } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ReactionService } from '../../src/reaction/reaction.service';
import { PrismaService } from '../../src/prisma.service';

jest.mock('../../src/realtime/message.gateway', () => ({
  MessageGateway: class MessageGateway {},
}));

import { MessageGateway } from '../../src/realtime/message.gateway';

describe('ReactionService', () => {
  let service: ReactionService;

  const prismaMock = {
    message: {
      findUnique: jest.fn(),
    },
    messagePrive: {
      findUnique: jest.fn(),
    },
    membreServeur: {
      findUnique: jest.fn(),
    },
    reactionMessage: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    reactionMessagePrive: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  const gatewayMock = {
    emitReactionUpdated: jest.fn(),
  };

  const userId = 'user-123';
  const messageId = 42;
  const canalId = 10;
  const serveurId = 5;

  const mockMessage = {
    id: messageId,
    canalId,
    canal: { serveurId },
  };

  const mockPrivateMessage = {
    id: messageId,
    expediteurId: userId,
    destinataireId: 'user-456',
  };

  const mockMember = { id: 1, userId, serveurId };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReactionService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: MessageGateway, useValue: gatewayMock },
      ],
    }).compile();

    service = module.get<ReactionService>(ReactionService);
    jest.clearAllMocks();
  });

  describe('toggleChannelReaction', () => {
    it('should add reaction when it does not exist yet', async () => {
      prismaMock.message.findUnique.mockResolvedValue(mockMessage);
      prismaMock.membreServeur.findUnique.mockResolvedValue(mockMember);
      prismaMock.reactionMessage.findUnique.mockResolvedValue(null);
      prismaMock.reactionMessage.create.mockResolvedValue({});
      prismaMock.reactionMessage.findMany.mockResolvedValue([
        { emoji: '👍', userId },
      ]);

      const result = await service.toggleChannelReaction(messageId, userId, '👍');

      expect(prismaMock.reactionMessage.create).toHaveBeenCalledWith({
        data: { messageId, userId, emoji: '👍' },
      });
      expect(result).toEqual([{ emoji: '👍', count: 1, userIds: [userId] }]);
      expect(gatewayMock.emitReactionUpdated).toHaveBeenCalledWith(
        'channel',
        canalId,
        messageId,
        expect.any(Array),
      );
    });

    it('should remove reaction when it already exists (toggle off)', async () => {
      const existing = { id: 99, messageId, userId, emoji: '👍' };
      prismaMock.message.findUnique.mockResolvedValue(mockMessage);
      prismaMock.membreServeur.findUnique.mockResolvedValue(mockMember);
      prismaMock.reactionMessage.findUnique.mockResolvedValue(existing);
      prismaMock.reactionMessage.delete.mockResolvedValue({});
      prismaMock.reactionMessage.findMany.mockResolvedValue([]);

      const result = await service.toggleChannelReaction(messageId, userId, '👍');

      expect(prismaMock.reactionMessage.delete).toHaveBeenCalledWith({
        where: { id: existing.id },
      });
      expect(result).toEqual([]);
    });

    it('should throw NotFoundException if message does not exist', async () => {
      prismaMock.message.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleChannelReaction(messageId, userId, '👍'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if message has no canal', async () => {
      prismaMock.message.findUnique.mockResolvedValue({ ...mockMessage, canal: null });

      await expect(
        service.toggleChannelReaction(messageId, userId, '👍'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a server member', async () => {
      prismaMock.message.findUnique.mockResolvedValue(mockMessage);
      prismaMock.membreServeur.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleChannelReaction(messageId, userId, '👍'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if emoji is empty', async () => {
      await expect(
        service.toggleChannelReaction(messageId, userId, ''),
      ).rejects.toThrow(BadRequestException);
    });

    it('should aggregate multiple reactions by emoji', async () => {
      prismaMock.message.findUnique.mockResolvedValue(mockMessage);
      prismaMock.membreServeur.findUnique.mockResolvedValue(mockMember);
      prismaMock.reactionMessage.findUnique.mockResolvedValue(null);
      prismaMock.reactionMessage.create.mockResolvedValue({});
      prismaMock.reactionMessage.findMany.mockResolvedValue([
        { emoji: '👍', userId: 'user-1' },
        { emoji: '👍', userId: 'user-2' },
        { emoji: '❤️', userId: 'user-1' },
      ]);

      const result = await service.toggleChannelReaction(messageId, userId, '👍');

      const thumbsUp = result.find((r) => r.emoji === '👍');
      expect(thumbsUp).toEqual({ emoji: '👍', count: 2, userIds: ['user-1', 'user-2'] });
      expect(result).toHaveLength(2);
    });
  });

  describe('togglePrivateReaction', () => {
    it('should add reaction on private message for sender', async () => {
      prismaMock.messagePrive.findUnique.mockResolvedValue(mockPrivateMessage);
      prismaMock.reactionMessagePrive.findUnique.mockResolvedValue(null);
      prismaMock.reactionMessagePrive.create.mockResolvedValue({});
      prismaMock.reactionMessagePrive.findMany.mockResolvedValue([
        { emoji: '❤️', userId },
      ]);

      const result = await service.togglePrivateReaction(messageId, userId, '❤️');

      expect(prismaMock.reactionMessagePrive.create).toHaveBeenCalledWith({
        data: { messageId, userId, emoji: '❤️' },
      });
      expect(result).toEqual([{ emoji: '❤️', count: 1, userIds: [userId] }]);
      expect(gatewayMock.emitReactionUpdated).toHaveBeenCalledWith(
        'private',
        expect.objectContaining({ expediteurId: userId }),
        messageId,
        expect.any(Array),
      );
    });

    it('should allow recipient to react', async () => {
      const recipientId = 'user-456';
      prismaMock.messagePrive.findUnique.mockResolvedValue(mockPrivateMessage);
      prismaMock.reactionMessagePrive.findUnique.mockResolvedValue(null);
      prismaMock.reactionMessagePrive.create.mockResolvedValue({});
      prismaMock.reactionMessagePrive.findMany.mockResolvedValue([]);

      await service.togglePrivateReaction(messageId, recipientId, '👍');

      expect(prismaMock.reactionMessagePrive.create).toHaveBeenCalled();
    });

    it('should remove reaction when it already exists (toggle off)', async () => {
      const existing = { id: 50, messageId, userId, emoji: '❤️' };
      prismaMock.messagePrive.findUnique.mockResolvedValue(mockPrivateMessage);
      prismaMock.reactionMessagePrive.findUnique.mockResolvedValue(existing);
      prismaMock.reactionMessagePrive.delete.mockResolvedValue({});
      prismaMock.reactionMessagePrive.findMany.mockResolvedValue([]);

      const result = await service.togglePrivateReaction(messageId, userId, '❤️');

      expect(prismaMock.reactionMessagePrive.delete).toHaveBeenCalledWith({
        where: { id: existing.id },
      });
      expect(result).toEqual([]);
    });

    it('should throw NotFoundException if private message does not exist', async () => {
      prismaMock.messagePrive.findUnique.mockResolvedValue(null);

      await expect(
        service.togglePrivateReaction(messageId, userId, '👍'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a participant', async () => {
      prismaMock.messagePrive.findUnique.mockResolvedValue(mockPrivateMessage);

      await expect(
        service.togglePrivateReaction(messageId, 'outsider', '👍'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if emoji is whitespace only', async () => {
      await expect(
        service.togglePrivateReaction(messageId, userId, '   '),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
