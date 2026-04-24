import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { VoiceService } from '../../src/voice/voice.service';
import { PrismaService } from '../../src/prisma.service';
import { TypeCanal } from '../../generated/prisma/enums';

describe('VoiceService', () => {
  let service: VoiceService;

  const prismaMock = {
    canal: {
      findUnique: jest.fn(),
    },
    membreServeur: {
      findUnique: jest.fn(),
    },
  };

  const mockCanal = {
    id: 1,
    nom: 'vocal-général',
    type: TypeCanal.VOCAL,
    serveurId: 10,
    serveur: { id: 10, nom: 'Mon Serveur' },
  };

  const mockMember = {
    id: 1,
    userId: 'user-123',
    serveurId: 10,
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        VoiceService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<VoiceService>(VoiceService);

    process.env.LIVEKIT_API_KEY = 'test-api-key';
    process.env.LIVEKIT_API_SECRET = 'test-api-secret-that-is-long-enough';
    process.env.LIVEKIT_URL = 'wss://test.livekit.cloud';

    jest.clearAllMocks();
  });

  it('should throw NotFoundException if canal does not exist', async () => {
    prismaMock.canal.findUnique.mockResolvedValue(null);

    await expect(service.generateToken(99, 'user-123')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw ForbiddenException if canal is not VOCAL', async () => {
    prismaMock.canal.findUnique.mockResolvedValue({
      ...mockCanal,
      type: TypeCanal.TEXTE,
    });

    await expect(service.generateToken(1, 'user-123')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw ForbiddenException if user is not a server member', async () => {
    prismaMock.canal.findUnique.mockResolvedValue(mockCanal);
    prismaMock.membreServeur.findUnique.mockResolvedValue(null);

    await expect(service.generateToken(1, 'user-456')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw if LiveKit env vars are missing', async () => {
    prismaMock.canal.findUnique.mockResolvedValue(mockCanal);
    prismaMock.membreServeur.findUnique.mockResolvedValue(mockMember);
    delete process.env.LIVEKIT_API_KEY;

    await expect(service.generateToken(1, 'user-123')).rejects.toThrow(
      'LiveKit is not configured',
    );
  });

  it('should return a token and url for a valid request', async () => {
    prismaMock.canal.findUnique.mockResolvedValue(mockCanal);
    prismaMock.membreServeur.findUnique.mockResolvedValue(mockMember);

    const result = await service.generateToken(1, 'user-123');

    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('url', 'wss://test.livekit.cloud');
    expect(typeof result.token).toBe('string');
    expect(result.token.length).toBeGreaterThan(0);
  });
});
