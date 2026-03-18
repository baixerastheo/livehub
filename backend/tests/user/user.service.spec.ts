import { Test } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from '../../src/user/user.service';
import { PrismaService } from '../../src/prisma.service';
import { SupabaseStorageService } from '../../src/supabase/supabase-storage.service';
import { PresenceService } from '../../src/realtime/presence.service';

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
    publicUrl: jest.fn().mockResolvedValue(null),
    uploadAvatar: jest.fn(),
    removeObjects: jest.fn(),
  };

  const presenceMock = {
    increment: jest.fn(),
    decrement: jest.fn(),
    isOnline: jest.fn().mockReturnValue(false),
  };

  const baseUser = {
    id: 'uuid-1',
    name: 'User 1',
    email: 'user1@test.com',
    avatarPath: null,
    statut: 'EN_LIGNE',
    emailVerified: false,
    image: null,
    avatarUpdatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
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
    presenceMock.isOnline.mockReturnValue(false);
    supabaseMock.publicUrl.mockResolvedValue(null);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getAllUsers ─────────────────────────────────────────────────────────────

  describe('getAllUsers', () => {
    it('should return all users enriched with avatar and status', async () => {
      prismaMock.user.findMany.mockResolvedValue([baseUser]);

      const result = await service.getAllUsers();

      expect(prismaMock.user.findMany).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'uuid-1',
        avatarUrl: null,
        statut: 'HORS_LIGNE',
      });
    });

    it('should mark users as online when PresenceService returns true', async () => {
      prismaMock.user.findMany.mockResolvedValue([baseUser]);
      presenceMock.isOnline.mockReturnValue(true);

      const result = await service.getAllUsers();

      expect(result[0].statut).toBe('EN_LIGNE');
    });

    it('should return an empty array when no users exist', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);

      const result = await service.getAllUsers();

      expect(result).toEqual([]);
    });
  });

  // ─── getUserById ─────────────────────────────────────────────────────────────

  describe('getUserById', () => {
    it('should return a user with avatar url and status', async () => {
      prismaMock.user.findUnique.mockResolvedValue(baseUser);

      const result = await service.getUserById('uuid-1');

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
      expect(result).toMatchObject({
        id: 'uuid-1',
        avatarUrl: null,
        statut: 'HORS_LIGNE',
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserById('unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── createUser ──────────────────────────────────────────────────────────────

  describe('createUser', () => {
    const dto = { name: 'New User', email: 'new@test.com', password: 'secret', statut: undefined };

    it('should create a user when email and name are available', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null); // email check
      prismaMock.user.findFirst.mockResolvedValue(null);  // name check
      prismaMock.user.create.mockResolvedValue({ ...baseUser, ...dto });
      prismaMock.account.create.mockResolvedValue({});

      const result = await service.createUser(dto);

      expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.account.create).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({ email: dto.email, name: dto.name });
    });

    it('should throw ConflictException when email is already taken', async () => {
      prismaMock.user.findUnique.mockResolvedValue(baseUser);

      await expect(service.createUser(dto)).rejects.toThrow(ConflictException);
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when name is already taken', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.findFirst.mockResolvedValue(baseUser);

      await expect(service.createUser(dto)).rejects.toThrow(ConflictException);
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  // ─── deleteUser ──────────────────────────────────────────────────────────────

  describe('deleteUser', () => {
    it('should delete an existing user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(baseUser);
      prismaMock.user.delete.mockResolvedValue(baseUser);

      const result = await service.deleteUser('uuid-1');

      expect(prismaMock.user.delete).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
      expect(result).toEqual(baseUser);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteUser('unknown')).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaMock.user.delete).not.toHaveBeenCalled();
    });
  });
});
