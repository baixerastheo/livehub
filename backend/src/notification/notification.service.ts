import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TypeNotification } from '../../generated/prisma/enums';

export type NotificationData =
  | {
      channelId: number;
      serverId: number;
      authorName: string;
      messagePreview: string;
    }
  | { authorId: string; authorName: string; content: string }
  | { serverId: number }
  | { serverId: number; raison: string | null; expireLe: string | null };

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, type: TypeNotification, data: NotificationData) {
    const notif = await this.prisma.notification.create({
      data: { userId, type, data },
    });

    const count = await this.prisma.notification.count({ where: { userId } });
    if (count > 50) {
      const oldest = await this.prisma.notification.findMany({
        where: { userId },
        orderBy: { creeLe: 'asc' },
        take: count - 50,
        select: { id: true },
      });
      await this.prisma.notification.deleteMany({
        where: { id: { in: oldest.map((n) => n.id) } },
      });
    }

    return notif;
  }

  async list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { creeLe: 'desc' },
      take: 50,
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, lu: false },
      data: { lu: true },
    });
  }

  async countUnread(userId: string) {
    return this.prisma.notification.count({ where: { userId, lu: false } });
  }
}
