// backend/src/user/user.service.spec.ts
import { Test } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma.service';
import { SupabaseStorageService } from '../supabase/supabase-storage.service';

describe('UserService', () => {
  let service: UserService;

  const prismaMock = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const supabaseMock = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    getPublicUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: SupabaseStorageService, useValue: supabaseMock },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllUsers', () => {
    it('doit retourner tous les utilisateurs', async () => {
      const mockUsers = [
        { id: 1, email: 'user1@test.com', name: 'User 1', avatarPath: null },
        {
          id: 2,
          email: 'user2@test.com',
          name: 'User 2',
          avatarPath: 'avatar.jpg',
        },
      ];

      prismaMock.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getAllUsers();

      expect(prismaMock.user.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
    });

    it('doit retourner un tableau vide si aucun utilisateur', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);

      const result = await service.getAllUsers();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getUserById', () => {
    it('doit retourner un utilisateur par son ID', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        avatarPath: null,
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserById('1');

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockUser);
    });

    it('doit retourner null si utilisateur non trouvé', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await service.getUserById('999');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('doit créer un nouvel utilisateur', async () => {
      const createUserDto = {
        email: 'newuser@test.com',
        name: 'New User',
        password: 'password123',
      };

      const mockCreatedUser = {
        id: 1,
        ...createUserDto,
        avatarPath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.create.mockResolvedValue(mockCreatedUser);

      const result = await service.createUser(createUserDto);

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: createUserDto.email,
          name: createUserDto.name,
        }) as Record<string, unknown>,
      });
      expect(result).toEqual(mockCreatedUser);
    });
  });

  describe('deleteUser', () => {
    it('doit supprimer un utilisateur', async () => {
      const mockDeletedUser = {
        id: 1,
        email: 'user@test.com',
        name: 'User',
        avatarPath: null,
      };

      prismaMock.user.delete.mockResolvedValue(mockDeletedUser);

      const result = await service.deleteUser('1');

      expect(prismaMock.user.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockDeletedUser);
    });
  });
});
