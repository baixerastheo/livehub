import { Test } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CanalService } from '../../src/canal/canal.service';
import { PrismaService } from '../../src/prisma.service';
import { Role, TypeCanal } from '../../generated/prisma/enums';

jest.mock('../../src/realtime/message.gateway', () => ({
  MessageGateway: class MessageGateway {},
}));

import { MessageGateway } from '../../src/realtime/message.gateway';

describe('CanalService', () => {
  let service: CanalService;

  const prismaMock = {
    canal: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    serveur: {
      findUnique: jest.fn(),
    },
    membreServeur: {
      findUnique: jest.fn(),
    },
  };

  const gatewayMock = {
    emitServerChannelCreated: jest.fn(),
    emitServerChannelDeleted: jest.fn(),
    emitServerChannelUpdated: jest.fn(),
  };

  const serverId = 1;
  const adminId = 'user-admin';
  const memberId = 'user-member';

  const mockServer = { id: serverId, nom: 'Mon Serveur' };
  const mockAdminMember = { id: 10, userId: adminId, serveurId: serverId, role: Role.ADMINISTRATEUR };
  const mockRegularMember = { id: 11, userId: memberId, serveurId: serverId, role: Role.MEMBRE };
  const mockChannel = {
    id: 5,
    nom: 'general',
    serveurId: serverId,
    type: TypeCanal.TEXTE,
    creeLe: new Date(),
    modifieLe: new Date(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CanalService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: MessageGateway, useValue: gatewayMock },
      ],
    }).compile();

    service = module.get<CanalService>(CanalService);
    jest.clearAllMocks();
  });

  describe('getChannelById', () => {
    it('should return channel when it exists', async () => {
      prismaMock.canal.findUnique.mockResolvedValue(mockChannel);

      const result = await service.getChannelById(5);

      expect(prismaMock.canal.findUnique).toHaveBeenCalledWith({ where: { id: 5 } });
      expect(result).toEqual(mockChannel);
    });

    it('should throw NotFoundException when channel does not exist', async () => {
      prismaMock.canal.findUnique.mockResolvedValue(null);

      await expect(service.getChannelById(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAllChannelsByServer', () => {
    it('should return channels ordered by id ascending', async () => {
      prismaMock.serveur.findUnique.mockResolvedValue(mockServer);
      prismaMock.canal.findMany.mockResolvedValue([mockChannel]);

      const result = await service.getAllChannelsByServer(serverId);

      expect(prismaMock.canal.findMany).toHaveBeenCalledWith({
        where: { serveurId: serverId },
        orderBy: { id: 'asc' },
      });
      expect(result).toEqual([mockChannel]);
    });

    it('should throw NotFoundException if server does not exist', async () => {
      prismaMock.serveur.findUnique.mockResolvedValue(null);

      await expect(service.getAllChannelsByServer(99)).rejects.toThrow(NotFoundException);
    });

    it('should return empty array when server has no channels', async () => {
      prismaMock.serveur.findUnique.mockResolvedValue(mockServer);
      prismaMock.canal.findMany.mockResolvedValue([]);

      const result = await service.getAllChannelsByServer(serverId);

      expect(result).toEqual([]);
    });
  });

  describe('createChannel', () => {
    it('should create channel and emit event when user is admin', async () => {
      prismaMock.serveur.findUnique.mockResolvedValue(mockServer);
      prismaMock.membreServeur.findUnique.mockResolvedValue(mockAdminMember);
      prismaMock.canal.create.mockResolvedValue(mockChannel);

      const result = await service.createChannel(
        serverId,
        adminId,
        { name: 'general', type: TypeCanal.TEXTE },
      );

      expect(prismaMock.canal.create).toHaveBeenCalledWith({
        data: { nom: 'general', serveurId: serverId, type: TypeCanal.TEXTE },
      });
      expect(gatewayMock.emitServerChannelCreated).toHaveBeenCalledWith(
        serverId,
        expect.objectContaining({ name: 'general' }),
      );
      expect(result).toEqual(mockChannel);
    });

    it('should throw NotFoundException if server does not exist', async () => {
      prismaMock.serveur.findUnique.mockResolvedValue(null);

      await expect(
        service.createChannel(99, adminId, { name: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      prismaMock.serveur.findUnique.mockResolvedValue(mockServer);
      prismaMock.membreServeur.findUnique.mockResolvedValue(null);

      await expect(
        service.createChannel(serverId, 'outsider', { name: 'test' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user is just a regular member', async () => {
      prismaMock.serveur.findUnique.mockResolvedValue(mockServer);
      prismaMock.membreServeur.findUnique.mockResolvedValue(mockRegularMember);

      await expect(
        service.createChannel(serverId, memberId, { name: 'test' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteChannel', () => {
    it('should delete channel and emit event when user is admin', async () => {
      prismaMock.canal.findUnique.mockResolvedValue(mockChannel);
      prismaMock.membreServeur.findUnique.mockResolvedValue(mockAdminMember);
      prismaMock.canal.delete.mockResolvedValue(mockChannel);

      const result = await service.deleteChannel(5, adminId);

      expect(prismaMock.canal.delete).toHaveBeenCalledWith({ where: { id: 5 } });
      expect(gatewayMock.emitServerChannelDeleted).toHaveBeenCalledWith(serverId, 5);
      expect(result).toEqual(mockChannel);
    });

    it('should throw NotFoundException if channel does not exist', async () => {
      prismaMock.canal.findUnique.mockResolvedValue(null);

      await expect(service.deleteChannel(99, adminId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is just a member', async () => {
      prismaMock.canal.findUnique.mockResolvedValue(mockChannel);
      prismaMock.membreServeur.findUnique.mockResolvedValue(mockRegularMember);

      await expect(service.deleteChannel(5, memberId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateChannel', () => {
    it('should update channel name and emit event', async () => {
      const updatedChannel = { ...mockChannel, nom: 'annonces', modifieLe: new Date() };
      prismaMock.canal.findUnique.mockResolvedValue(mockChannel);
      prismaMock.membreServeur.findUnique.mockResolvedValue(mockAdminMember);
      prismaMock.canal.update.mockResolvedValue(updatedChannel);

      const result = await service.updateChannel(5, adminId, { name: 'annonces' });

      expect(prismaMock.canal.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { nom: 'annonces' },
      });
      expect(gatewayMock.emitServerChannelUpdated).toHaveBeenCalledWith(
        serverId,
        expect.objectContaining({ name: 'annonces' }),
      );
      expect(result.nom).toBe('annonces');
    });

    it('should throw NotFoundException if channel does not exist', async () => {
      prismaMock.canal.findUnique.mockResolvedValue(null);

      await expect(service.updateChannel(99, adminId, { name: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is just a member', async () => {
      prismaMock.canal.findUnique.mockResolvedValue(mockChannel);
      prismaMock.membreServeur.findUnique.mockResolvedValue(mockRegularMember);

      await expect(service.updateChannel(5, memberId, { name: 'x' })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
