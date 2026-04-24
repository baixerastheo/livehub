import { Test } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseStorageService } from '../../src/supabase/supabase-storage.service';

const mockFrom = {
  upload: jest.fn(),
  remove: jest.fn(),
  createSignedUrl: jest.fn(),
};

const mockStorage = {
  from: jest.fn().mockReturnValue(mockFrom),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ storage: mockStorage })),
}));

describe('SupabaseStorageService', () => {
  let service: SupabaseStorageService;

  beforeEach(async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    process.env.SUPABASE_STORAGE_BUCKET = 'test-bucket';

    const module = await Test.createTestingModule({
      providers: [
        SupabaseStorageService,
        { provide: ConfigService, useValue: {} },
      ],
    }).compile();

    service = module.get<SupabaseStorageService>(SupabaseStorageService);
    jest.clearAllMocks();
    mockStorage.from.mockReturnValue(mockFrom);
  });

  describe('buildPath', () => {
    it('should build a path with prefix, id and extension', () => {
      const path = service.buildPath('user', 'user-123', 'png');
      expect(path).toMatch(/^user-user-123\/.+\.png$/);
    });

    it('should generate unique paths each call', () => {
      const path1 = service.buildPath('user', '1', 'jpg');
      const path2 = service.buildPath('user', '1', 'jpg');
      expect(path1).not.toBe(path2);
    });
  });

  describe('upload', () => {
    it('should upload file and return path', async () => {
      mockFrom.upload.mockResolvedValue({ data: { path: 'user/avatar.png' }, error: null });

      const result = await service.upload('user/avatar.png', Buffer.from('img'), 'image/png');

      expect(mockStorage.from).toHaveBeenCalledWith('test-bucket');
      expect(mockFrom.upload).toHaveBeenCalledWith(
        'user/avatar.png',
        expect.any(Buffer),
        { contentType: 'image/png', upsert: true },
      );
      expect(result).toBe('user/avatar.png');
    });

    it('should throw InternalServerErrorException on upload error', async () => {
      mockFrom.upload.mockResolvedValue({
        data: null,
        error: { message: 'upload failed' },
      });

      await expect(
        service.upload('path', Buffer.from('img'), 'image/png'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('removeObjects', () => {
    it('should remove files from storage', async () => {
      mockFrom.remove.mockResolvedValue({ data: {}, error: null });

      await service.removeObjects(['path/file1.png', 'path/file2.png']);

      expect(mockFrom.remove).toHaveBeenCalledWith(['path/file1.png', 'path/file2.png']);
    });

    it('should do nothing when paths array is empty', async () => {
      await service.removeObjects([]);
      expect(mockFrom.remove).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on remove error', async () => {
      mockFrom.remove.mockResolvedValue({
        data: null,
        error: { message: 'remove failed' },
      });

      await expect(service.removeObjects(['path/file.png'])).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('publicUrl', () => {
    it('should return signed URL', async () => {
      mockFrom.createSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://cdn.supabase.co/signed-url' },
        error: null,
      });

      const result = await service.publicUrl('user/avatar.png');

      expect(mockFrom.createSignedUrl).toHaveBeenCalledWith('user/avatar.png', 3600);
      expect(result).toBe('https://cdn.supabase.co/signed-url');
    });

    it('should use custom expiresIn when provided', async () => {
      mockFrom.createSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://cdn.supabase.co/signed-url' },
        error: null,
      });

      await service.publicUrl('user/avatar.png', 7200);

      expect(mockFrom.createSignedUrl).toHaveBeenCalledWith('user/avatar.png', 7200);
    });

    it('should throw InternalServerErrorException on error', async () => {
      mockFrom.createSignedUrl.mockResolvedValue({
        data: null,
        error: { message: 'signed url failed' },
      });

      await expect(service.publicUrl('path/file.png')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('resolveAvatarUrl', () => {
    it('should return null when avatarPath is null', async () => {
      const result = await service.resolveAvatarUrl(null);
      expect(result).toBeNull();
    });

    it('should return the signed URL when avatarPath is provided', async () => {
      mockFrom.createSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://cdn.supabase.co/avatar.png' },
        error: null,
      });

      const result = await service.resolveAvatarUrl('user/avatar.png');

      expect(result).toBe('https://cdn.supabase.co/avatar.png');
    });

    it('should return null when signed URL generation fails', async () => {
      mockFrom.createSignedUrl.mockResolvedValue({
        data: null,
        error: { message: 'error' },
      });

      const result = await service.resolveAvatarUrl('user/avatar.png');

      expect(result).toBeNull();
    });
  });

  describe('getClient (missing env vars)', () => {
    it('should throw InternalServerErrorException when SUPABASE_URL is missing', async () => {
      delete process.env.SUPABASE_URL;

      const moduleWithoutEnv = await Test.createTestingModule({
        providers: [
          SupabaseStorageService,
          { provide: ConfigService, useValue: {} },
        ],
      }).compile();

      const serviceWithoutEnv = moduleWithoutEnv.get<SupabaseStorageService>(
        SupabaseStorageService,
      );

      await expect(
        serviceWithoutEnv.upload('path', Buffer.from('img'), 'image/png'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
