import { Test } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserService } from '../../src/user/user.service';
import { PrismaService } from '../../src/prisma.service';
import { SupabaseStorageService } from '../../src/supabase/supabase-storage.service';
import { PresenceService } from '../../src/realtime/presence.service';
import { StatutUtilisateur } from '../../generated/prisma/enums';

describe('UserService', () => {
  let service: UserService;

  const prismaMock = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    account: {
      create: jest.fn(),
    },
  };

  const supabaseMock = {
    resolveAvatarUrl: jest.fn(),
    buildPath: jest.fn(),
    upload: jest.fn(),
    removeObjects: jest.fn(),
    publicUrl: jest.fn(),
  };

  const presenceMock = {
    isOnline: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    name: 'Alice',
    email: 'alice@example.com',
    statut: 'EN_LIGNE',
    avatarPath: 'avatars/user-123.png',
    avatarUpdatedAt: new Date(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: SupabaseStorageService, useValue: supabaseMock },
        { provide: PresenceService, useValue: presenceMock },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    jest.clearAllMocks();
    supabaseMock.resolveAvatarUrl.mockResolvedValue('https://cdn.example.com/avatar.png');
  });

  describe('getAllUsers', () => {
    it('should return all users with avatar and presence status', async () => {
      prismaMock.user.findMany.mockResolvedValue([mockUser]);
      presenceMock.isOnline.mockReturnValue(true);

      const result = await service.getAllUsers();

      expect(prismaMock.user.findMany).toHaveBeenCalled();
      expect(result[0]).toHaveProperty('statut', 'EN_LIGNE');
      expect(result[0]).toHaveProperty('avatarUrl');
    });

    it('should mark offline users as HORS_LIGNE', async () => {
      prismaMock.user.findMany.mockResolvedValue([mockUser]);
      presenceMock.isOnline.mockReturnValue(false);

      const result = await service.getAllUsers();

      expect(result[0].statut).toBe('HORS_LIGNE');
    });

    it('should return empty array when no users exist', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);

      const result = await service.getAllUsers();

      expect(result).toEqual([]);
    });
  });

  describe('getUserById', () => {
    it('should return user with avatar and presence status', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      presenceMock.isOnline.mockReturnValue(true);

      const result = await service.getUserById('user-123');

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(result).toHaveProperty('statut', 'EN_LIGNE');
      expect(result).toHaveProperty('avatarUrl');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserById('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserByEmail', () => {
    it('should return user matching the email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserByEmail('alice@example.com');

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'alice@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if email not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserByEmail('unknown@example.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserByName', () => {
    it('should return user with avatar matching the name', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.getUserByName('Alice');

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { name: 'Alice' },
      });
      expect(result).toHaveProperty('avatarUrl');
    });

    it('should throw NotFoundException if name not found', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(service.getUserByName('Unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createUser', () => {
    const createData = { name: 'Bob', email: 'bob@example.com', statut: StatutUtilisateur.EN_LIGNE, password: 'Password1!' };

    it('should create user and account successfully', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({ ...mockUser, id: 'new-id' });
      prismaMock.account.create.mockResolvedValue({});

      const result = await service.createUser(createData);

      expect(prismaMock.user.create).toHaveBeenCalled();
      expect(prismaMock.account.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });

    it('should throw ConflictException if email already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.createUser(createData)).rejects.toThrow(ConflictException);
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if name already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.findFirst.mockResolvedValue(mockUser);

      await expect(service.createUser(createData)).rejects.toThrow(ConflictException);
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.delete.mockResolvedValue(mockUser);

      const result = await service.deleteUser('user-123');

      expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: 'user-123' } });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteUser('unknown')).rejects.toThrow(NotFoundException);
      expect(prismaMock.user.delete).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update user and return it with avatar', async () => {
      const updatedUser = { ...mockUser, name: 'AliceNew' };
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser('user-123', { name: 'AliceNew' });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { name: 'AliceNew', statut: undefined },
      });
      expect(result).toHaveProperty('avatarUrl');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.updateUser('unknown', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if new name is already taken', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.findFirst.mockResolvedValue({ ...mockUser, id: 'other-user' });

      await expect(service.updateUser('user-123', { name: 'OtherName' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should not check name uniqueness if name is unchanged', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue(mockUser);

      await service.updateUser('user-123', { name: 'Alice' });

      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('replaceAvatar', () => {
    const buffer = Buffer.from('img');
    const contentType = 'image/png';
    const ext = 'png';

    it('should upload new avatar and return path and url', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, avatarPath: null });
      supabaseMock.buildPath.mockReturnValue('user/user-123.png');
      supabaseMock.upload.mockResolvedValue(undefined);
      prismaMock.user.update.mockResolvedValue(mockUser);
      supabaseMock.publicUrl.mockResolvedValue('https://cdn.example.com/avatar.png');

      const result = await service.replaceAvatar('user-123', buffer, contentType, ext);

      expect(supabaseMock.upload).toHaveBeenCalled();
      expect(prismaMock.user.update).toHaveBeenCalled();
      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('avatarUrl');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.replaceAvatar('unknown', buffer, contentType, ext),
      ).rejects.toThrow(NotFoundException);
    });

    it('should delete old avatar when one exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      supabaseMock.buildPath.mockReturnValue('user/user-123.png');
      supabaseMock.upload.mockResolvedValue(undefined);
      prismaMock.user.update.mockResolvedValue(mockUser);
      supabaseMock.removeObjects.mockResolvedValue(undefined);
      supabaseMock.publicUrl.mockResolvedValue('https://cdn.example.com/avatar.png');

      await service.replaceAvatar('user-123', buffer, contentType, ext);

      expect(supabaseMock.removeObjects).toHaveBeenCalledWith([mockUser.avatarPath]);
    });

    it('should rollback and throw if deleting old avatar fails', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      supabaseMock.buildPath.mockReturnValue('user/user-123-new.png');
      supabaseMock.upload.mockResolvedValue(undefined);
      prismaMock.user.update.mockResolvedValue(mockUser);
      supabaseMock.removeObjects
        .mockRejectedValueOnce(new Error('Storage error'))
        .mockResolvedValue(undefined);

      await expect(
        service.replaceAvatar('user-123', buffer, contentType, ext),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
