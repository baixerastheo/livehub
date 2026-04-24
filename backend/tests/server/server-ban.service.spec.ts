import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ServerBanService } from '../../src/server/server-ban.service';
import { PrismaService } from '../../src/prisma.service';
import { SupabaseStorageService } from '../../src/supabase/supabase-storage.service';
import { ServerUtilsService } from '../../src/server/server-utils.service';
import { NotificationService } from '../../src/notification/notification.service';
import { Role } from '../../generated/prisma/enums';

jest.mock('../../src/realtime/message.gateway', () => ({
  MessageGateway: class MessageGateway {},
}));

import { MessageGateway } from '../../src/realtime/message.gateway';

describe('ServerBanService', () => {
  let service: ServerBanService;

  const prismaMock = {
    membreServeur: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    banServeur: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const supabaseMock = {
    resolveAvatarUrl: jest.fn(),
  };

  const gatewayMock = {
    emitServerMemberBanned: jest.fn(),
    emitServerMemberUnbanned: jest.fn(),
    emitServerMemberKicked: jest.fn(),
  };

  const utilsMock = {
    assertServerMember: jest.fn(),
    assertAdminRole: jest.fn(),
  };

  const notificationMock = {
    create: jest.fn(),
  };

  const serverId = 1;
  const ownerId = 'user-owner';
  const adminId = 'user-admin';
  const memberId = 'user-member';

  const mockOwner = { id: 10, userId: ownerId, serveurId: serverId, role: Role.PROPRIETAIRE };
  const mockAdmin = { id: 11, userId: adminId, serveurId: serverId, role: Role.ADMINISTRATEUR };
  const mockMember = { id: 12, userId: memberId, serveurId: serverId, role: Role.MEMBRE };
  const mockBan = {
    id: 1,
    userId: memberId,
    serveurId: serverId,
    bannePar: ownerId,
    raison: 'Comportement inapproprié',
    expireLe: null,
  };
  const mockUser = { id: memberId, name: 'Alice', email: 'alice@example.com', avatarPath: null };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ServerBanService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: SupabaseStorageService, useValue: supabaseMock },
        { provide: MessageGateway, useValue: gatewayMock },
        { provide: ServerUtilsService, useValue: utilsMock },
        { provide: NotificationService, useValue: notificationMock },
      ],
    }).compile();

    service = module.get<ServerBanService>(ServerBanService);
    jest.clearAllMocks();
    supabaseMock.resolveAvatarUrl.mockResolvedValue(null);
    notificationMock.create.mockResolvedValue(undefined);
  });

  describe('banMember', () => {
    it('should ban a member and emit event', async () => {
      utilsMock.assertServerMember.mockResolvedValue(mockOwner);
      utilsMock.assertAdminRole.mockReturnValue(undefined);
      prismaMock.membreServeur.findUnique.mockResolvedValue(mockMember);
      prismaMock.banServeur.findUnique.mockResolvedValue(null);
      prismaMock.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => {
        const tx = {
          banServeur: { create: jest.fn().mockResolvedValue(mockBan) },
          membreServeur: { delete: jest.fn().mockResolvedValue({}) },
        };
        return cb(tx);
      });

      const result = await service.banMember(serverId, ownerId, { userId: memberId });

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(gatewayMock.emitServerMemberBanned).toHaveBeenCalledWith(
        serverId,
        expect.objectContaining({ bannedUserId: memberId }),
      );
      expect(result).toEqual(mockBan);
    });

    it('should throw BadRequestException when banning self', async () => {
      utilsMock.assertServerMember.mockResolvedValue(mockOwner);
      utilsMock.assertAdminRole.mockReturnValue(undefined);

      await expect(
        service.banMember(serverId, ownerId, { userId: ownerId }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if target is not in the server', async () => {
      utilsMock.assertServerMember.mockResolvedValue(mockOwner);
      utilsMock.assertAdminRole.mockReturnValue(undefined);
      prismaMock.membreServeur.findUnique.mockResolvedValue(null);

      await expect(
        service.banMember(serverId, ownerId, { userId: 'outsider' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when banning the server owner', async () => {
      utilsMock.assertServerMember.mockResolvedValue(mockAdmin);
      utilsMock.assertAdminRole.mockReturnValue(undefined);
      prismaMock.membreServeur.findUnique.mockResolvedValue({
        ...mockMember,
        role: Role.PROPRIETAIRE,
      });

      await expect(
        service.banMember(serverId, adminId, { userId: ownerId }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when admin tries to ban another admin', async () => {
      utilsMock.assertServerMember.mockResolvedValue(mockAdmin);
      utilsMock.assertAdminRole.mockReturnValue(undefined);
      prismaMock.membreServeur.findUnique.mockResolvedValue({
        ...mockMember,
        role: Role.ADMINISTRATEUR,
      });

      await expect(
        service.banMember(serverId, adminId, { userId: 'other-admin' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if user is already banned', async () => {
      utilsMock.assertServerMember.mockResolvedValue(mockOwner);
      utilsMock.assertAdminRole.mockReturnValue(undefined);
      prismaMock.membreServeur.findUnique.mockResolvedValue(mockMember);
      prismaMock.banServeur.findUnique.mockResolvedValue(mockBan);

      await expect(
        service.banMember(serverId, ownerId, { userId: memberId }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('unbanMember', () => {
    it('should unban user and emit event', async () => {
      utilsMock.assertServerMember.mockResolvedValue(mockOwner);
      utilsMock.assertAdminRole.mockReturnValue(undefined);
      prismaMock.banServeur.findUnique.mockResolvedValue(mockBan);
      prismaMock.banServeur.delete.mockResolvedValue(mockBan);

      const result = await service.unbanMember(serverId, ownerId, memberId);

      expect(prismaMock.banServeur.delete).toHaveBeenCalledWith({ where: { id: mockBan.id } });
      expect(gatewayMock.emitServerMemberUnbanned).toHaveBeenCalledWith(
        serverId,
        expect.objectContaining({ unbannedUserId: memberId }),
      );
      expect(result).toEqual(mockBan);
    });

    it('should throw NotFoundException if user is not banned', async () => {
      utilsMock.assertServerMember.mockResolvedValue(mockOwner);
      utilsMock.assertAdminRole.mockReturnValue(undefined);
      prismaMock.banServeur.findUnique.mockResolvedValue(null);

      await expect(
        service.unbanMember(serverId, ownerId, memberId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getBans', () => {
    it('should return bans with user avatarUrl', async () => {
      utilsMock.assertServerMember.mockResolvedValue(mockOwner);
      utilsMock.assertAdminRole.mockReturnValue(undefined);
      prismaMock.banServeur.findMany.mockResolvedValue([
        { ...mockBan, user: mockUser, banneur: { id: ownerId, name: 'Owner' } },
      ]);

      const result = await service.getBans(serverId, ownerId);

      expect(result[0].user).toHaveProperty('avatarUrl');
      expect(result[0].user).not.toHaveProperty('avatarPath');
    });

    it('should return empty array when no bans exist', async () => {
      utilsMock.assertServerMember.mockResolvedValue(mockOwner);
      utilsMock.assertAdminRole.mockReturnValue(undefined);
      prismaMock.banServeur.findMany.mockResolvedValue([]);

      const result = await service.getBans(serverId, ownerId);

      expect(result).toEqual([]);
    });
  });

  describe('kickMember', () => {
    it('should kick a member and emit event', async () => {
      utilsMock.assertServerMember.mockResolvedValue(mockOwner);
      utilsMock.assertAdminRole.mockReturnValue(undefined);
      prismaMock.membreServeur.findUnique.mockResolvedValue(mockMember);
      prismaMock.membreServeur.delete.mockResolvedValue(mockMember);

      await service.kickMember(serverId, ownerId, memberId);

      expect(prismaMock.membreServeur.delete).toHaveBeenCalledWith({
        where: { id: mockMember.id },
      });
      expect(gatewayMock.emitServerMemberKicked).toHaveBeenCalledWith(
        serverId,
        expect.objectContaining({ kickedUserId: memberId }),
      );
    });

    it('should throw BadRequestException when kicking self', async () => {
      utilsMock.assertServerMember.mockResolvedValue(mockOwner);
      utilsMock.assertAdminRole.mockReturnValue(undefined);

      await expect(
        service.kickMember(serverId, ownerId, ownerId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if target is not in the server', async () => {
      utilsMock.assertServerMember.mockResolvedValue(mockOwner);
      utilsMock.assertAdminRole.mockReturnValue(undefined);
      prismaMock.membreServeur.findUnique.mockResolvedValue(null);

      await expect(
        service.kickMember(serverId, ownerId, 'outsider'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when kicking the server owner', async () => {
      utilsMock.assertServerMember.mockResolvedValue(mockAdmin);
      utilsMock.assertAdminRole.mockReturnValue(undefined);
      prismaMock.membreServeur.findUnique.mockResolvedValue({
        ...mockMember,
        role: Role.PROPRIETAIRE,
      });

      await expect(
        service.kickMember(serverId, adminId, ownerId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
