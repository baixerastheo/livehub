import { Test } from '@nestjs/testing';
import { AiBotService } from '../../src/message/ai-bot.service';
import { PrismaService } from '../../src/prisma.service';
import { PresenceService } from '../../src/realtime/presence.service';

describe('AiBotService', () => {
  let service: AiBotService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const presenceMock = {
    increment: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AiBotService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: PresenceService, useValue: presenceMock },
      ],
    }).compile();

    service = module.get<AiBotService>(AiBotService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('onModuleInit', () => {
    it('should set bot user ID and mark bot online when bot exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'bot-123' });

      await service.onModuleInit();

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'agent@gmail.com' },
        select: { id: true },
      });
      expect(presenceMock.increment).toHaveBeenCalledWith('bot-123');
      expect(service.getBotUserId()).toBe('bot-123');
    });

    it('should do nothing when bot user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await service.onModuleInit();

      expect(presenceMock.increment).not.toHaveBeenCalled();
    });
  });

  describe('getBotUserId', () => {
    it('should return the bot user ID after init', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'bot-abc' });
      await service.onModuleInit();

      expect(service.getBotUserId()).toBe('bot-abc');
    });
  });

  describe('generateResponse', () => {
    const messages = [{ role: 'user' as const, content: 'Hello bot!' }];

    it('should return the AI response on success', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: '  Bonjour !  ' } }],
        }),
      } as any);

      const result = await service.generateResponse(messages);

      expect(result).toBe('Bonjour !');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should return fallback message when API response is not ok', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
      } as any);

      const result = await service.generateResponse(messages);

      expect(result).toBe('Oops, je suis HS là');
    });

    it('should return fallback message on network error', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await service.generateResponse(messages);

      expect(result).toBe('Oops, je suis HS là');
    });

    it('should include system prompt and conversation history in request body', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'réponse' } }],
        }),
      } as any);

      await service.generateResponse(messages);

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.messages[0].role).toBe('system');
      expect(body.messages[1]).toEqual(messages[0]);
    });
  });
});
