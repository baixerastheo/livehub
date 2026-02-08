import { Module } from '@nestjs/common';
import { FriendsController } from './friends.controller.js';
import { FriendsService } from './friends.service.js';
import { PrismaService } from '../prisma.service.js';
import { RealtimeModule } from '../realtime/realtime.module.js';

@Module({
  imports: [RealtimeModule],
  controllers: [FriendsController],
  providers: [FriendsService, PrismaService],
})
export class FriendsModule {}
