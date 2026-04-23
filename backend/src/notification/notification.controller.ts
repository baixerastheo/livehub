import { Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { RequestWithAuth } from '../lib/request-with-auth.js';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async list(@Req() req: RequestWithAuth) {
    return this.notificationService.list(req.user.id);
  }

  @Patch('read-all')
  async markAllRead(@Req() req: RequestWithAuth) {
    await this.notificationService.markAllRead(req.user.id);
    return { ok: true };
  }
}
