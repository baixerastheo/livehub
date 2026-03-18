// Mock auth guard and gateway (and their ESM deps) before any imports
jest.mock('../../src/auth/auth.guard', () => ({
  AuthGuard: class MockAuthGuard {
    canActivate() {
      return true;
    }
  },
}));
jest.mock('../../src/realtime/message.gateway', () => ({
  MessageGateway: class MockMessageGateway {},
}));

import { Test } from '@nestjs/testing';
import { ReactionController } from '../../src/reaction/reaction.controller';
import { ReactionService } from '../../src/reaction/reaction.service';
import { AuthGuard } from '../../src/auth/auth.guard';
import type { RequestWithAuth } from '../../src/lib/request-with-auth';

describe('ReactionController', () => {
  let controller: ReactionController;

  const reactionServiceMock = {
    toggleChannelReaction: jest.fn(),
    togglePrivateReaction: jest.fn(),
  };

  const mockRequest = {
    user: { id: 'user-1' },
  } as RequestWithAuth;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ReactionController],
      providers: [
        { provide: ReactionService, useValue: reactionServiceMock },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReactionController>(ReactionController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('toggleChannelReaction', () => {
    it('should call the service with the correct parameters', async () => {
      const aggregated = [{ emoji: '👍', count: 1, userIds: ['user-1'] }];
      reactionServiceMock.toggleChannelReaction.mockResolvedValue(aggregated);

      const result = await controller.toggleChannelReaction(
        42,
        { emoji: '👍' },
        mockRequest,
      );

      expect(reactionServiceMock.toggleChannelReaction).toHaveBeenCalledWith(
        42,
        'user-1',
        '👍',
      );
      expect(result).toEqual(aggregated);
    });

    it('should propagate service errors', async () => {
      reactionServiceMock.toggleChannelReaction.mockRejectedValue(
        new Error('Service error'),
      );

      await expect(
        controller.toggleChannelReaction(1, { emoji: '👍' }, mockRequest),
      ).rejects.toThrow('Service error');
    });

    it('should return an empty array when the message has no reactions', async () => {
      reactionServiceMock.toggleChannelReaction.mockResolvedValue([]);

      const result = await controller.toggleChannelReaction(
        5,
        { emoji: '👍' },
        mockRequest,
      );

      expect(result).toEqual([]);
    });
  });

  describe('togglePrivateReaction', () => {
    it('should call the service with the correct parameters', async () => {
      const aggregated = [
        { emoji: '❤️', count: 2, userIds: ['user-1', 'user-2'] },
      ];
      reactionServiceMock.togglePrivateReaction.mockResolvedValue(aggregated);

      const result = await controller.togglePrivateReaction(
        7,
        { emoji: '❤️' },
        mockRequest,
      );

      expect(reactionServiceMock.togglePrivateReaction).toHaveBeenCalledWith(
        7,
        'user-1',
        '❤️',
      );
      expect(result).toEqual(aggregated);
    });

    it('should propagate service errors', async () => {
      reactionServiceMock.togglePrivateReaction.mockRejectedValue(
        new Error('Forbidden'),
      );

      await expect(
        controller.togglePrivateReaction(1, { emoji: '😂' }, mockRequest),
      ).rejects.toThrow('Forbidden');
    });

    it('should return an empty array when the message has no reactions', async () => {
      reactionServiceMock.togglePrivateReaction.mockResolvedValue([]);

      const result = await controller.togglePrivateReaction(
        3,
        { emoji: '😂' },
        mockRequest,
      );

      expect(result).toEqual([]);
    });
  });
});
