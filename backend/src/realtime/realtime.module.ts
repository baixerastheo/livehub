import { Module } from '@nestjs/common';
import { MessageGateway } from './message.gateway.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  providers: [MessageGateway, PrismaService],
  exports: [MessageGateway],
})
export class RealtimeModule {}
