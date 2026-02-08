import { Module } from '@nestjs/common';
import { MessageGateway } from './message.gateway.js';
import { PresenceService } from './presence.service.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  providers: [MessageGateway, PresenceService, PrismaService],
  exports: [MessageGateway, PresenceService],
})
export class RealtimeModule {}
