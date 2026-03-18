// Mock the gateway before any imports to avoid pulling in better-auth (ESM)
jest.mock('../../src/realtime/message.gateway', () => ({
  MessageGateway: class MockMessageGateway {},
}));

import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ReactionService } from '../../src/reaction/reaction.service';
import { PrismaService } from '../../src/prisma.service';
import { MessageGateway } from '../../src/realtime/message.gateway';

describe('ReactionService', () => {
  let service: ReactionService;

  const prismaMock = {
    message: { findUnique: jest.fn() },
    canal: { findUnique: jest.fn() },
    membreServeur: { findUnique: jest.fn() },
    reactionMessage: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    messagePrive: { findUnique: jest.fn() },
    reactionMessagePrive: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const gatewayMock = {
    emitReactionUpdated: jest.fn(),
  };

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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── toggleChannelReaction ───────────────────────────────────────────────────

  describe('toggleChannelReaction', () => {
    const messageId = 1;
    const userId = 'user-1';
    const emoji = '👍';

    it('should throw BadRequestException when emoji is empty', async () => {
      await expect(
        service.toggleChannelReaction(messageId, userId, ''),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when emoji is only whitespace', async () => {
      await expect(
        service.toggleChannelReaction(messageId, userId, '   '),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when message does not exist', async () => {
      prismaMock.message.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleChannelReaction(messageId, userId, emoji),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when channel does not exist', async () => {
      prismaMock.message.findUnique.mockResolvedValue({
        id: messageId,
        canalId: 10,
      });
      prismaMock.canal.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleChannelReaction(messageId, userId, emoji),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not a server member', async () => {
      prismaMock.message.findUnique.mockResolvedValue({
        id: messageId,
        canalId: 10,
      });
      prismaMock.canal.findUnique.mockResolvedValue({ serveurId: 5 });
      prismaMock.membreServeur.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleChannelReaction(messageId, userId, emoji),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create the reaction when it does not exist yet', async () => {
      prismaMock.message.findUnique.mockResolvedValue({
        id: messageId,
        canalId: 10,
      });
      prismaMock.canal.findUnique.mockResolvedValue({ serveurId: 5 });
      prismaMock.membreServeur.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.reactionMessage.findUnique.mockResolvedValue(null);
      prismaMock.reactionMessage.create.mockResolvedValue({});
      prismaMock.reactionMessage.findMany.mockResolvedValue([
        { emoji, userId },
      ]);

      await service.toggleChannelReaction(messageId, userId, emoji);

      expect(prismaMock.reactionMessage.create).toHaveBeenCalledWith({
        data: { messageId, userId, emoji },
      });
      expect(prismaMock.reactionMessage.delete).not.toHaveBeenCalled();
    });

    it('should delete the reaction when it already exists (toggle off)', async () => {
      const existing = { id: 99 };
      prismaMock.message.findUnique.mockResolvedValue({
        id: messageId,
        canalId: 10,
      });
      prismaMock.canal.findUnique.mockResolvedValue({ serveurId: 5 });
      prismaMock.membreServeur.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.reactionMessage.findUnique.mockResolvedValue(existing);
      prismaMock.reactionMessage.delete.mockResolvedValue({});
      prismaMock.reactionMessage.findMany.mockResolvedValue([]);

      await service.toggleChannelReaction(messageId, userId, emoji);

      expect(prismaMock.reactionMessage.delete).toHaveBeenCalledWith({
        where: { id: existing.id },
      });
      expect(prismaMock.reactionMessage.create).not.toHaveBeenCalled();
    });

    it('should return aggregated reactions', async () => {
      prismaMock.message.findUnique.mockResolvedValue({
        id: messageId,
        canalId: 10,
      });
      prismaMock.canal.findUnique.mockResolvedValue({ serveurId: 5 });
      prismaMock.membreServeur.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.reactionMessage.findUnique.mockResolvedValue(null);
      prismaMock.reactionMessage.create.mockResolvedValue({});
      prismaMock.reactionMessage.findMany.mockResolvedValue([
        { emoji: '👍', userId: 'user-1' },
        { emoji: '👍', userId: 'user-2' },
        { emoji: '❤️', userId: 'user-1' },
      ]);

      const result = await service.toggleChannelReaction(
        messageId,
        userId,
        emoji,
      );

      expect(result).toEqual(
        expect.arrayContaining([
          { emoji: '👍', count: 2, userIds: ['user-1', 'user-2'] },
          { emoji: '❤️', count: 1, userIds: ['user-1'] },
        ]),
      );
    });

    it('should emit a realtime event after toggle', async () => {
      prismaMock.message.findUnique.mockResolvedValue({
        id: messageId,
        canalId: 10,
      });
      prismaMock.canal.findUnique.mockResolvedValue({ serveurId: 5 });
      prismaMock.membreServeur.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.reactionMessage.findUnique.mockResolvedValue(null);
      prismaMock.reactionMessage.create.mockResolvedValue({});
      prismaMock.reactionMessage.findMany.mockResolvedValue([
        { emoji, userId },
      ]);

      await service.toggleChannelReaction(messageId, userId, emoji);

      expect(gatewayMock.emitReactionUpdated).toHaveBeenCalledWith(
        'channel',
        10,
        messageId,
        expect.any(Array),
      );
    });
  });

  // ─── togglePrivateReaction ───────────────────────────────────────────────────

  describe('togglePrivateReaction', () => {
    const messageId = 2;
    const userId = 'user-1';
    const emoji = '😂';
    const baseMessage = {
      id: messageId,
      expediteurId: 'user-1',
      destinataireId: 'user-2',
    };

    it('should throw BadRequestException when emoji is empty', async () => {
      await expect(
        service.togglePrivateReaction(messageId, userId, ''),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when message does not exist', async () => {
      prismaMock.messagePrive.findUnique.mockResolvedValue(null);

      await expect(
        service.togglePrivateReaction(messageId, userId, emoji),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not a participant', async () => {
      prismaMock.messagePrive.findUnique.mockResolvedValue({
        ...baseMessage,
        expediteurId: 'other-1',
        destinataireId: 'other-2',
      });

      await expect(
        service.togglePrivateReaction(messageId, userId, emoji),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow the recipient to react', async () => {
      prismaMock.messagePrive.findUnique.mockResolvedValue({
        id: messageId,
        expediteurId: 'other-user',
        destinataireId: userId,
      });
      prismaMock.reactionMessagePrive.findUnique.mockResolvedValue(null);
      prismaMock.reactionMessagePrive.create.mockResolvedValue({});
      prismaMock.reactionMessagePrive.findMany.mockResolvedValue([]);

      await expect(
        service.togglePrivateReaction(messageId, userId, emoji),
      ).resolves.not.toThrow();
    });

    it('should create the reaction when it does not exist yet', async () => {
      prismaMock.messagePrive.findUnique.mockResolvedValue(baseMessage);
      prismaMock.reactionMessagePrive.findUnique.mockResolvedValue(null);
      prismaMock.reactionMessagePrive.create.mockResolvedValue({});
      prismaMock.reactionMessagePrive.findMany.mockResolvedValue([
        { emoji, userId },
      ]);

      await service.togglePrivateReaction(messageId, userId, emoji);

      expect(prismaMock.reactionMessagePrive.create).toHaveBeenCalledWith({
        data: { messageId, userId, emoji },
      });
      expect(prismaMock.reactionMessagePrive.delete).not.toHaveBeenCalled();
    });

    it('should delete the reaction when it already exists (toggle off)', async () => {
      const existing = { id: 55 };
      prismaMock.messagePrive.findUnique.mockResolvedValue(baseMessage);
      prismaMock.reactionMessagePrive.findUnique.mockResolvedValue(existing);
      prismaMock.reactionMessagePrive.delete.mockResolvedValue({});
      prismaMock.reactionMessagePrive.findMany.mockResolvedValue([]);

      await service.togglePrivateReaction(messageId, userId, emoji);

      expect(prismaMock.reactionMessagePrive.delete).toHaveBeenCalledWith({
        where: { id: existing.id },
      });
      expect(prismaMock.reactionMessagePrive.create).not.toHaveBeenCalled();
    });

    it('should return aggregated reactions', async () => {
      prismaMock.messagePrive.findUnique.mockResolvedValue(baseMessage);
      prismaMock.reactionMessagePrive.findUnique.mockResolvedValue(null);
      prismaMock.reactionMessagePrive.create.mockResolvedValue({});
      prismaMock.reactionMessagePrive.findMany.mockResolvedValue([
        { emoji: '😂', userId: 'user-1' },
        { emoji: '😂', userId: 'user-2' },
        { emoji: '🔥', userId: 'user-1' },
      ]);

      const result = await service.togglePrivateReaction(
        messageId,
        userId,
        emoji,
      );

      expect(result).toEqual(
        expect.arrayContaining([
          { emoji: '😂', count: 2, userIds: ['user-1', 'user-2'] },
          { emoji: '🔥', count: 1, userIds: ['user-1'] },
        ]),
      );
    });

    it('should emit a realtime event to both participants', async () => {
      prismaMock.messagePrive.findUnique.mockResolvedValue(baseMessage);
      prismaMock.reactionMessagePrive.findUnique.mockResolvedValue(null);
      prismaMock.reactionMessagePrive.create.mockResolvedValue({});
      prismaMock.reactionMessagePrive.findMany.mockResolvedValue([]);

      await service.togglePrivateReaction(messageId, userId, emoji);

      expect(gatewayMock.emitReactionUpdated).toHaveBeenCalledWith(
        'private',
        {
          expediteurId: baseMessage.expediteurId,
          destinataireId: baseMessage.destinataireId,
        },
        messageId,
        expect.any(Array),
      );
    });
  });
});
