import { Test } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FriendsService } from '../../src/friends/friends.service';
import { PrismaService } from '../../src/prisma.service';
import { PresenceService } from '../../src/realtime/presence.service';

describe('FriendsService', () => {
  let service: FriendsService;

  const prismaMock = {
    amitie: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    demandeAmitie: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const presenceMock = {
    isOnline: jest.fn(),
  };

  const userId = 'user-A';
  const otherId = 'user-B';

  const mockUser = { id: otherId, name: 'Bob', email: 'bob@example.com' };
  const mockRequest = {
    id: 'req-1',
    fromUserId: userId,
    toUserId: otherId,
    statut: 'EN_ATTENTE',
    creeLe: new Date(),
  };
  const mockFriendship = {
    id: 'amitie-1',
    userAId: userId,
    userBId: otherId,
    userA: { id: userId, name: 'Alice' },
    userB: { id: otherId, name: 'Bob' },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FriendsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: PresenceService, useValue: presenceMock },
      ],
    }).compile();

    service = module.get<FriendsService>(FriendsService);
    jest.clearAllMocks();
  });

  describe('listFriends', () => {
    it('should return friends with their presence status', async () => {
      prismaMock.amitie.findMany.mockResolvedValue([mockFriendship]);
      presenceMock.isOnline.mockReturnValue(true);

      const result = await service.listFriends(userId);

      expect(prismaMock.amitie.findMany).toHaveBeenCalledWith({
        where: { OR: [{ userAId: userId }, { userBId: userId }] },
        include: { userA: true, userB: true },
      });
      expect(result[0]).toHaveProperty('statut', 'EN_LIGNE');
    });

    it('should return the correct friend (not self) from the pair', async () => {
      const friendship = {
        userAId: otherId,
        userBId: userId,
        userA: { id: otherId, name: 'Bob' },
        userB: { id: userId, name: 'Alice' },
      };
      prismaMock.amitie.findMany.mockResolvedValue([friendship]);
      presenceMock.isOnline.mockReturnValue(false);

      const result = await service.listFriends(userId);

      expect(result[0].id).toBe(otherId);
      expect(result[0].statut).toBe('HORS_LIGNE');
    });

    it('should return empty array when user has no friends', async () => {
      prismaMock.amitie.findMany.mockResolvedValue([]);

      const result = await service.listFriends(userId);

      expect(result).toEqual([]);
    });
  });

  describe('listRequests', () => {
    it('should return pending friend requests', async () => {
      const requests = [mockRequest];
      prismaMock.demandeAmitie.findMany.mockResolvedValue(requests);

      const result = await service.listRequests(userId);

      expect(prismaMock.demandeAmitie.findMany).toHaveBeenCalledWith({
        where: {
          statut: 'EN_ATTENTE',
          OR: [{ fromUserId: userId }, { toUserId: userId }],
        },
        include: { fromUser: true, toUser: true },
        orderBy: { creeLe: 'desc' },
      });
      expect(result).toEqual(requests);
    });
  });

  describe('sendRequest', () => {
    it('should create a new friend request', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.amitie.findUnique.mockResolvedValue(null);
      prismaMock.demandeAmitie.findUnique.mockResolvedValue(null);
      prismaMock.demandeAmitie.create.mockResolvedValue(mockRequest);

      await service.sendRequest(userId, otherId);

      expect(prismaMock.demandeAmitie.create).toHaveBeenCalledWith({
        data: { fromUserId: userId, toUserId: otherId, statut: 'EN_ATTENTE' },
      });
    });

    it('should throw BadRequestException when sending request to self', async () => {
      await expect(service.sendRequest(userId, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if target user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.sendRequest(userId, 'unknown')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if users are already friends', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.amitie.findUnique.mockResolvedValue({ id: 'amitie-1' });

      await expect(service.sendRequest(userId, otherId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if request is already pending', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.amitie.findUnique.mockResolvedValue(null);
      prismaMock.demandeAmitie.findUnique.mockResolvedValue(mockRequest);

      await expect(service.sendRequest(userId, otherId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reactivate a previously declined request', async () => {
      const declinedRequest = { ...mockRequest, statut: 'REFUSEE' };
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.amitie.findUnique.mockResolvedValue(null);
      prismaMock.demandeAmitie.findUnique.mockResolvedValue(declinedRequest);
      prismaMock.demandeAmitie.update.mockResolvedValue(mockRequest);

      await service.sendRequest(userId, otherId);

      expect(prismaMock.demandeAmitie.update).toHaveBeenCalledWith({
        where: { id: declinedRequest.id },
        data: { statut: 'EN_ATTENTE' },
      });
    });
  });

  describe('acceptRequest', () => {
    it('should accept a pending request and create friendship', async () => {
      prismaMock.demandeAmitie.findUnique.mockResolvedValue(mockRequest);
      prismaMock.$transaction.mockResolvedValue([]);

      await service.acceptRequest('req-1', otherId);

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if request does not exist', async () => {
      prismaMock.demandeAmitie.findUnique.mockResolvedValue(null);

      await expect(service.acceptRequest('unknown', otherId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if request is not pending', async () => {
      prismaMock.demandeAmitie.findUnique.mockResolvedValue({
        ...mockRequest,
        statut: 'ACCEPTEE',
      });

      await expect(service.acceptRequest('req-1', otherId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException if user is not the recipient', async () => {
      prismaMock.demandeAmitie.findUnique.mockResolvedValue(mockRequest);

      await expect(service.acceptRequest('req-1', userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('declineRequest', () => {
    it('should decline a pending request', async () => {
      prismaMock.demandeAmitie.findUnique.mockResolvedValue(mockRequest);
      prismaMock.demandeAmitie.update.mockResolvedValue({
        ...mockRequest,
        statut: 'REFUSEE',
      });

      await service.declineRequest('req-1', otherId);

      expect(prismaMock.demandeAmitie.update).toHaveBeenCalledWith({
        where: { id: 'req-1' },
        data: { statut: 'REFUSEE' },
      });
    });

    it('should throw NotFoundException if request does not exist', async () => {
      prismaMock.demandeAmitie.findUnique.mockResolvedValue(null);

      await expect(service.declineRequest('unknown', otherId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if request is not pending', async () => {
      prismaMock.demandeAmitie.findUnique.mockResolvedValue({
        ...mockRequest,
        statut: 'REFUSEE',
      });

      await expect(service.declineRequest('req-1', otherId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException if user is not the recipient', async () => {
      prismaMock.demandeAmitie.findUnique.mockResolvedValue(mockRequest);

      await expect(service.declineRequest('req-1', userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
