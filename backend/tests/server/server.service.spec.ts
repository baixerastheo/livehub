import { Test } from '@nestjs/testing';
import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { ServerService } from '../../src/server/server.service';
import { PrismaService } from '../../src/prisma.service';
import { SupabaseStorageService } from '../../src/supabase/supabase-storage.service';
import { ServerUtilsService } from '../../src/server/server-utils.service';
import { Role } from '../../generated/prisma/enums';

describe('ServerService', () => {
  let service: ServerService;

  const prismaMock = {
    membreServeur: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    serveur: {
      update: jest.fn(),
      delete: jest.fn(),
    },
    canal: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const supabaseMock = {
    resolveAvatarUrl: jest.fn(),
    buildPath: jest.fn(),
    upload: jest.fn(),
    removeObjects: jest.fn(),
    publicUrl: jest.fn(),
  };

  const utilsMock = {
    assertServerExists: jest.fn(),
    assertServerMember: jest.fn(),
  };

  const mockServer = { id: 1, nom: 'Serveur Alpha', avatarPath: null };
  const mockMember = { id: 10, userId: 'user-owner', serveurId: 1, role: Role.PROPRIETAIRE };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ServerService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: SupabaseStorageService, useValue: supabaseMock },
        { provide: ServerUtilsService, useValue: utilsMock },
      ],
    }).compile();

    service = module.get<ServerService>(ServerService);
    jest.clearAllMocks();
    supabaseMock.resolveAvatarUrl.mockResolvedValue('https://cdn.example.com/avatar.png');
  });

  describe('getUserServers', () => {
    it('should return servers with avatarUrl', async () => {
      const memberships = [
        {
          id: 1,
          serveur: { id: 1, nom: 'S1', avatarPath: 'path/to/img.png' },
        },
      ];
      prismaMock.membreServeur.findMany.mockResolvedValue(memberships);

      const result = await service.getUserServers('user-owner');

      expect(prismaMock.membreServeur.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-owner' },
        include: { serveur: true },
      });
      expect(result[0].serveur).toHaveProperty('avatarUrl');
      expect(result[0].serveur).not.toHaveProperty('avatarPath');
    });

    it('should return empty array when user has no servers', async () => {
      prismaMock.membreServeur.findMany.mockResolvedValue([]);

      const result = await service.getUserServers('user-owner');

      expect(result).toEqual([]);
    });
  });

  describe('getServerById', () => {
    it('should return server with avatarUrl and without avatarPath', async () => {
      utilsMock.assertServerExists.mockResolvedValue(mockServer);

      const result = await service.getServerById(1);

      expect(utilsMock.assertServerExists).toHaveBeenCalledWith(1);
      expect(result).toHaveProperty('avatarUrl');
      expect(result).not.toHaveProperty('avatarPath');
    });
  });

  describe('createServer', () => {
    it('should create server with owner member and general channel', async () => {
      const createdServer = { id: 1, nom: 'New Server' };
      prismaMock.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => {
        const tx = {
          serveur: { create: jest.fn().mockResolvedValue(createdServer) },
          membreServeur: { create: jest.fn().mockResolvedValue({}) },
          canal: { create: jest.fn().mockResolvedValue({}) },
        };
        return cb(tx);
      });

      const result = await service.createServer({ name: 'New Server' }, 'user-owner');

      expect(result).toEqual(createdServer);
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  describe('updateServer', () => {
    it('should update server name', async () => {
      utilsMock.assertServerExists.mockResolvedValue(mockServer);
      prismaMock.serveur.update.mockResolvedValue({ ...mockServer, nom: 'New Name' });

      const result = await service.updateServer(1, { name: 'New Name' });

      expect(prismaMock.serveur.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { nom: 'New Name' },
      });
      expect(result.nom).toBe('New Name');
    });
  });

  describe('deleteServer', () => {
    it('should delete server', async () => {
      utilsMock.assertServerExists.mockResolvedValue(mockServer);
      prismaMock.serveur.delete.mockResolvedValue(mockServer);

      const result = await service.deleteServer(1);

      expect(prismaMock.serveur.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockServer);
    });
  });

  describe('replaceServerAvatar', () => {
    const buffer = Buffer.from('img');
    const contentType = 'image/png';
    const ext = 'png';

    it('should upload avatar and return path and url', async () => {
      utilsMock.assertServerExists.mockResolvedValue({ ...mockServer, avatarPath: null });
      utilsMock.assertServerMember.mockResolvedValue(mockMember);
      supabaseMock.buildPath.mockReturnValue('server/1.png');
      supabaseMock.upload.mockResolvedValue(undefined);
      prismaMock.serveur.update.mockResolvedValue(mockServer);
      supabaseMock.publicUrl.mockResolvedValue('https://cdn.example.com/server.png');

      const result = await service.replaceServerAvatar(1, 'user-owner', buffer, contentType, ext);

      expect(supabaseMock.upload).toHaveBeenCalled();
      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('avatarUrl');
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      utilsMock.assertServerExists.mockResolvedValue(mockServer);
      utilsMock.assertServerMember.mockResolvedValue({
        ...mockMember,
        role: Role.ADMINISTRATEUR,
      });

      await expect(
        service.replaceServerAvatar(1, 'admin-user', buffer, contentType, ext),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should remove old avatar when one exists', async () => {
      utilsMock.assertServerExists.mockResolvedValue({ ...mockServer, avatarPath: 'old.png' });
      utilsMock.assertServerMember.mockResolvedValue(mockMember);
      supabaseMock.buildPath.mockReturnValue('server/1-new.png');
      supabaseMock.upload.mockResolvedValue(undefined);
      prismaMock.serveur.update.mockResolvedValue(mockServer);
      supabaseMock.removeObjects.mockResolvedValue(undefined);
      supabaseMock.publicUrl.mockResolvedValue('https://cdn.example.com/server.png');

      await service.replaceServerAvatar(1, 'user-owner', buffer, contentType, ext);

      expect(supabaseMock.removeObjects).toHaveBeenCalledWith(['old.png']);
    });

    it('should rollback and throw if removing old avatar fails', async () => {
      utilsMock.assertServerExists.mockResolvedValue({ ...mockServer, avatarPath: 'old.png' });
      utilsMock.assertServerMember.mockResolvedValue(mockMember);
      supabaseMock.buildPath.mockReturnValue('server/1-new.png');
      supabaseMock.upload.mockResolvedValue(undefined);
      prismaMock.serveur.update.mockResolvedValue(mockServer);
      supabaseMock.removeObjects
        .mockRejectedValueOnce(new Error('Storage error'))
        .mockResolvedValue(undefined);

      await expect(
        service.replaceServerAvatar(1, 'user-owner', buffer, contentType, ext),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
