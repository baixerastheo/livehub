import { Test } from '@nestjs/testing';
import { NotificationService } from '../../src/notification/notification.service';
import { PrismaService } from '../../src/prisma.service';
import { TypeNotification } from '../../generated/prisma/enums';

describe('NotificationService', () => {
  let service: NotificationService;

  const prismaMock = {
    notification: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const userId = 'user-123';

  const mockNotif = {
    id: 1,
    userId,
    type: TypeNotification.MENTION,
    data: {
      channelId: 10,
      serverId: 5,
      authorName: 'Alice',
      messagePreview: 'hello',
    },
    lu: false,
    creeLe: new Date(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a notification and return it', async () => {
      prismaMock.notification.create.mockResolvedValue(mockNotif);
      prismaMock.notification.count.mockResolvedValue(1);

      const result = await service.create(
        userId,
        TypeNotification.MENTION,
        mockNotif.data,
      );

      expect(prismaMock.notification.create).toHaveBeenCalledWith({
        data: { userId, type: TypeNotification.MENTION, data: mockNotif.data },
      });
      expect(result).toEqual(mockNotif);
    });

    it('should not delete anything when count is below 50', async () => {
      prismaMock.notification.create.mockResolvedValue(mockNotif);
      prismaMock.notification.count.mockResolvedValue(49);

      await service.create(userId, TypeNotification.MENTION, mockNotif.data);

      expect(prismaMock.notification.deleteMany).not.toHaveBeenCalled();
    });

    it('should not delete anything when count equals 50', async () => {
      prismaMock.notification.create.mockResolvedValue(mockNotif);
      prismaMock.notification.count.mockResolvedValue(50);

      await service.create(userId, TypeNotification.MENTION, mockNotif.data);

      expect(prismaMock.notification.deleteMany).not.toHaveBeenCalled();
    });

    it('should delete the oldest notification when count exceeds 50', async () => {
      prismaMock.notification.create.mockResolvedValue(mockNotif);
      prismaMock.notification.count.mockResolvedValue(51);
      prismaMock.notification.findMany.mockResolvedValue([{ id: 99 }]);

      await service.create(userId, TypeNotification.MENTION, mockNotif.data);

      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { creeLe: 'asc' },
        take: 1,
        select: { id: true },
      });
      expect(prismaMock.notification.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [99] } },
      });
    });

    it('should delete multiple oldest notifications when count far exceeds 50', async () => {
      prismaMock.notification.create.mockResolvedValue(mockNotif);
      prismaMock.notification.count.mockResolvedValue(53);
      prismaMock.notification.findMany.mockResolvedValue([
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ]);

      await service.create(userId, TypeNotification.MENTION, mockNotif.data);

      expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 3 }),
      );
      expect(prismaMock.notification.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2, 3] } },
      });
    });
  });

  describe('list', () => {
    it('should return notifications sorted by date descending', async () => {
      const notifs = [mockNotif, { ...mockNotif, id: 2 }];
      prismaMock.notification.findMany.mockResolvedValue(notifs);

      const result = await service.list(userId);

      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { creeLe: 'desc' },
        take: 50,
      });
      expect(result).toEqual(notifs);
    });

    it('should return an empty array when user has no notifications', async () => {
      prismaMock.notification.findMany.mockResolvedValue([]);

      const result = await service.list(userId);

      expect(result).toEqual([]);
    });
  });

  describe('markAllRead', () => {
    it('should mark all unread notifications as read', async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 3 });

      await service.markAllRead(userId);

      expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
        where: { userId, lu: false },
        data: { lu: true },
      });
    });
  });

  describe('countUnread', () => {
    it('should return the number of unread notifications', async () => {
      prismaMock.notification.count.mockResolvedValue(5);

      const result = await service.countUnread(userId);

      expect(prismaMock.notification.count).toHaveBeenCalledWith({
        where: { userId, lu: false },
      });
      expect(result).toBe(5);
    });

    it('should return 0 when all notifications are read', async () => {
      prismaMock.notification.count.mockResolvedValue(0);

      const result = await service.countUnread(userId);

      expect(result).toBe(0);
    });
  });
});
