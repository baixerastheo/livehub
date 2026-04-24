import { Test } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ServerMemberService } from '../../src/server/server-member.service';
import { PrismaService } from '../../src/prisma.service';
import { SupabaseStorageService } from '../../src/supabase/supabase-storage.service';
import { PresenceService } from '../../src/realtime/presence.service';
import { ServerUtilsService } from '../../src/server/server-utils.service';
import { Role } from '../../generated/prisma/enums';

jest.mock('../../src/realtime/message.gateway', () => ({
  MessageGateway: class MessageGateway {},
}));

import { MessageGateway } from '../../src/realtime/message.gateway';

describe('ServerMemberService', () => {
  let service: ServerMemberService;

  const prismaMock = {
    membreServeur: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    banServeur: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    serveur: {
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const supabaseMock = {
    resolveAvatarUrl: jest.fn(),
  };

  const gatewayMock = {
    emitServerMemberJoined: jest.fn(),
    emitUserAddedToServer: jest.fn(),
    emitServerOwnershipTransferred: jest.fn(),
  };

  const presenceMock = {
    isOnline: jest.fn(),
  };

  const utilsMock = {
    assertServerExists: jest.fn(),
    assertServerMember: jest.fn(),
    assertAdminRole: jest.fn(),
  };

  const serverId = 1;
  const ownerId = 'user-owner';
  const memberId = 'user-member';

  const mockOwner = { id: 10, userId: ownerId, serveurId: serverId, role: Role.PROPRIETAIRE };
  const mockMember = { id: 11, userId: memberId, serveurId: serverId, role: Role.MEMBRE };
  const mockUser = {
    id: memberId,
    name: 'Alice',
    email: 'alice@example.com',
    avatarPath: null,
  };
  const mockServer = { id: serverId, nom: 'Mon Serveur' };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ServerMemberService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: SupabaseStorageService, useValue: supabaseMock },
        { provide: MessageGateway, useValue: gatewayMock },
        { provide: PresenceService, useValue: presenceMock },
        { provide: ServerUtilsService, useValue: utilsMock },
      ],
    }).compile();

    service = module.get<ServerMemberService>(ServerMemberService);
    jest.clearAllMocks();
    supabaseMock.resolveAvatarUrl.mockResolvedValue(null);
    presenceMock.isOnline.mockReturnValue(false);
  });

  describe('joinServer', () => {
    it('should allow user to join server when not already a member', async () => {
      utilsMock.assertServerExists.mockResolvedValue(mockServer);
      prismaMock.membreServeur.findUnique.mockResolvedValue(null);
      prismaMock.banServeur.findUnique.mockResolvedValue(null);
      prismaMock.membreServeur.create.mockResolvedValue({
        ...mockMember,
        serveur: mockServer,
        user: mockUser,
      });

      const result = await service.joinServer(serverId, memberId);

      expect(prismaMock.membreServeur.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ role: Role.MEMBRE }) }),
      );
      expect(result).toHaveProperty('userId', memberId);
    });

    it('should throw ConflictException if user is already a member', async () => {
      utilsMock.assertServerExists.mockResolvedValue(mockServer);
      prismaMock.membreServeur.findUnique.mockResolvedValue(mockMember);

      await expect(service.joinServer(serverId, memberId)).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException if user is permanently banned', async () => {
      utilsMock.assertServerExists.mockResolvedValue(mockServer);
      prismaMock.membreServeur.findUnique.mockResolvedValue(null);
      prismaMock.banServeur.findUnique.mockResolvedValue({
        id: 1,
        userId: memberId,
        serveurId: serverId,
        expireLe: null,
      });

      await expect(service.joinServer(serverId, memberId)).rejects.toThrow(ForbiddenException);
    });

    it('should clean expired ban and allow join', async () => {
      utilsMock.assertServerExists.mockResolvedValue(mockServer);
      prismaMock.membreServeur.findUnique.mockResolvedValue(null);
      prismaMock.banServeur.findUnique.mockResolvedValue({
        id: 1,
        userId: memberId,
        serveurId: serverId,
        expireLe: new Date(Date.now() - 1000),
      });
      prismaMock.banServeur.delete.mockResolvedValue({});
      prismaMock.membreServeur.create.mockResolvedValue({
        ...mockMember,
        serveur: mockServer,
        user: mockUser,
      });

      await service.joinServer(serverId, memberId);

      expect(prismaMock.banServeur.delete).toHaveBeenCalled();
      expect(prismaMock.membreServeur.create).toHaveBeenCalled();
    });
  });

  describe('leaveServer', () => {
    it('should remove member from server', async () => {
      utilsMock.assertServerMember.mockResolvedValue(mockMember);
      prismaMock.membreServeur.delete.mockResolvedValue(mockMember);

      const result = await service.leaveServer(serverId, memberId);

      expect(prismaMock.membreServeur.delete).toHaveBeenCalledWith({
        where: { id: mockMember.id },
      });
      expect(result).toEqual(mockMember);
    });

    it('should delete server if owner is the last member', async () => {
      utilsMock.assertServerMember.mockResolvedValue(mockOwner);
      prismaMock.membreServeur.count.mockResolvedValue(1);
      prismaMock.serveur.delete.mockResolvedValue(mockServer);

      const result = await service.leaveServer(serverId, ownerId);

      expect(prismaMock.serveur.delete).toHaveBeenCalledWith({ where: { id: serverId } });
      expect(result).toEqual(mockServer);
    });

    it('should throw BadRequestException if owner tries to leave with other members', async () => {
      utilsMock.assertServerMember.mockResolvedValue(mockOwner);
      prismaMock.membreServeur.count.mockResolvedValue(3);

      await expect(service.leaveServer(serverId, ownerId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getServerMembers', () => {
    it('should return server members with avatarUrl and statut', async () => {
      utilsMock.assertServerExists.mockResolvedValue(mockServer);
      prismaMock.membreServeur.findMany.mockResolvedValue([
        { ...mockMember, user: mockUser },
      ]);
      presenceMock.isOnline.mockReturnValue(true);

      const result = await service.getServerMembers(serverId);

      expect(result[0].user).toHaveProperty('avatarUrl');
      expect(result[0].user).toHaveProperty('statut');
      expect(result[0].user).not.toHaveProperty('avatarPath');
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role when acting user is owner', async () => {
      utilsMock.assertServerMember.mockResolvedValue(mockOwner);
      prismaMock.membreServeur.findUnique.mockResolvedValue(mockMember);
      prismaMock.membreServeur.update.mockResolvedValue({
        ...mockMember,
        role: Role.ADMINISTRATEUR,
        user: mockUser,
        serveur: mockServer,
      });

      const result = await service.updateMemberRole(
        serverId,
        memberId,
        Role.ADMINISTRATEUR,
        ownerId,
      );

      expect(prismaMock.membreServeur.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { role: Role.ADMINISTRATEUR } }),
      );
      expect(result.role).toBe(Role.ADMINISTRATEUR);
    });

    it('should throw ForbiddenException if acting user is not owner', async () => {
      utilsMock.assertServerMember.mockResolvedValue({
        ...mockMember,
        role: Role.ADMINISTRATEUR,
      });

      await expect(
        service.updateMemberRole(serverId, memberId, Role.MEMBRE, memberId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if target member is not in the server', async () => {
      utilsMock.assertServerMember.mockResolvedValue(mockOwner);
      prismaMock.membreServeur.findUnique.mockResolvedValue(null);

      await expect(
        service.updateMemberRole(serverId, 'unknown', Role.MEMBRE, ownerId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if trying to change the owner role', async () => {
      utilsMock.assertServerMember.mockResolvedValue(mockOwner);
      prismaMock.membreServeur.findUnique.mockResolvedValue({
        ...mockMember,
        role: Role.PROPRIETAIRE,
      });

      await expect(
        service.updateMemberRole(serverId, ownerId, Role.MEMBRE, ownerId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('transferOwnership', () => {
    it('should transfer ownership to another member', async () => {
      utilsMock.assertServerMember.mockResolvedValue(mockOwner);
      prismaMock.membreServeur.findUnique.mockResolvedValue(mockMember);
      prismaMock.$transaction.mockResolvedValue([]);

      const result = await service.transferOwnership(serverId, memberId, ownerId);

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(gatewayMock.emitServerOwnershipTransferred).toHaveBeenCalledWith(serverId, {
        newOwnerId: memberId,
        previousOwnerId: ownerId,
      });
      expect(result).toEqual({ newOwnerId: memberId, previousOwnerId: ownerId });
    });

    it('should throw ForbiddenException if acting user is not owner', async () => {
      utilsMock.assertServerMember.mockResolvedValue(mockMember);

      await expect(
        service.transferOwnership(serverId, 'another-user', memberId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if transferring to self', async () => {
      utilsMock.assertServerMember.mockResolvedValue(mockOwner);

      await expect(
        service.transferOwnership(serverId, ownerId, ownerId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if target user is not a member', async () => {
      utilsMock.assertServerMember.mockResolvedValue(mockOwner);
      prismaMock.membreServeur.findUnique.mockResolvedValue(null);

      await expect(
        service.transferOwnership(serverId, 'outsider', ownerId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addMember', () => {
    const targetId = 'user-target';
    const newMemberData = {
      id: 20,
      userId: targetId,
      serveurId: serverId,
      role: Role.MEMBRE,
      rejointLe: new Date(),
      user: { id: targetId, name: 'Cible', email: 'cible@example.com', avatarPath: null },
      serveur: mockServer,
    };

    it('should add a member, emit events and return new member', async () => {
      utilsMock.assertServerExists.mockResolvedValue(mockServer);
      utilsMock.assertServerMember.mockResolvedValue(mockOwner);
      utilsMock.assertAdminRole.mockReturnValue(undefined);
      prismaMock.membreServeur.findUnique.mockResolvedValue(null);
      prismaMock.banServeur.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.membreServeur.create.mockResolvedValue(newMemberData);

      const result = await service.addMember(serverId, ownerId, { userId: targetId });

      expect(prismaMock.banServeur.deleteMany).toHaveBeenCalledWith({
        where: { userId: targetId, serveurId: serverId },
      });
      expect(prismaMock.membreServeur.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { serveurId: serverId, userId: targetId, role: Role.MEMBRE },
        }),
      );
      expect(gatewayMock.emitServerMemberJoined).toHaveBeenCalledWith(
        serverId,
        expect.objectContaining({ userId: targetId }),
      );
      expect(gatewayMock.emitUserAddedToServer).toHaveBeenCalledWith(
        targetId,
        expect.objectContaining({ serverId }),
      );
      expect(result).toEqual(newMemberData);
    });

    it('should throw BadRequestException if acting user tries to add themselves', async () => {
      utilsMock.assertServerExists.mockResolvedValue(mockServer);
      utilsMock.assertServerMember.mockResolvedValue(mockOwner);
      utilsMock.assertAdminRole.mockReturnValue(undefined);

      await expect(
        service.addMember(serverId, ownerId, { userId: ownerId }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if target is already a member', async () => {
      utilsMock.assertServerExists.mockResolvedValue(mockServer);
      utilsMock.assertServerMember.mockResolvedValue(mockOwner);
      utilsMock.assertAdminRole.mockReturnValue(undefined);
      prismaMock.membreServeur.findUnique.mockResolvedValue(mockMember);

      await expect(
        service.addMember(serverId, ownerId, { userId: targetId }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
