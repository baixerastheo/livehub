import { Test } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ServerUtilsService } from '../../src/server/server-utils.service';
import { PrismaService } from '../../src/prisma.service';
import { Role } from '../../generated/prisma/enums';

describe('ServerUtilsService', () => {
  let service: ServerUtilsService;

  const prismaMock = {
    serveur: {
      findUnique: jest.fn(),
    },
    membreServeur: {
      findUnique: jest.fn(),
    },
  };

  const mockServer = { id: 1, nom: 'Mon Serveur', avatarPath: null };
  const mockMember = { id: 10, userId: 'user-123', serveurId: 1, role: Role.MEMBRE };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ServerUtilsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ServerUtilsService>(ServerUtilsService);
    jest.clearAllMocks();
  });

  describe('assertServerExists', () => {
    it('should return server when it exists', async () => {
      prismaMock.serveur.findUnique.mockResolvedValue(mockServer);

      const result = await service.assertServerExists(1);

      expect(prismaMock.serveur.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockServer);
    });

    it('should throw NotFoundException when server does not exist', async () => {
      prismaMock.serveur.findUnique.mockResolvedValue(null);

      await expect(service.assertServerExists(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('assertServerMember', () => {
    it('should return member when user is in the server', async () => {
      prismaMock.membreServeur.findUnique.mockResolvedValue(mockMember);

      const result = await service.assertServerMember('user-123', 1);

      expect(prismaMock.membreServeur.findUnique).toHaveBeenCalledWith({
        where: { userId_serveurId: { userId: 'user-123', serveurId: 1 } },
      });
      expect(result).toEqual(mockMember);
    });

    it('should throw ForbiddenException when user is not a member', async () => {
      prismaMock.membreServeur.findUnique.mockResolvedValue(null);

      await expect(service.assertServerMember('outsider', 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('isMember', () => {
    it('should return true when user is a member', async () => {
      prismaMock.membreServeur.findUnique.mockResolvedValue(mockMember);

      const result = await service.isMember('user-123', 1);

      expect(result).toBe(true);
    });

    it('should return false when user is not a member', async () => {
      prismaMock.membreServeur.findUnique.mockResolvedValue(null);

      const result = await service.isMember('outsider', 1);

      expect(result).toBe(false);
    });
  });

  describe('assertAdminRole', () => {
    it('should not throw for PROPRIETAIRE role', () => {
      expect(() => service.assertAdminRole(Role.PROPRIETAIRE)).not.toThrow();
    });

    it('should not throw for ADMINISTRATEUR role', () => {
      expect(() => service.assertAdminRole(Role.ADMINISTRATEUR)).not.toThrow();
    });

    it('should throw ForbiddenException for MEMBRE role', () => {
      expect(() => service.assertAdminRole(Role.MEMBRE)).toThrow(ForbiddenException);
    });
  });
});
