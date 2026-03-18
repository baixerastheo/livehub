import { Module } from '@nestjs/common';
import { ReactionService } from './reaction.service.js';
import { ReactionController } from './reaction.controller.js';
import { PrismaService } from '../prisma.service.js';
import { RealtimeModule } from '../realtime/realtime.module.js';

@Module({
  imports: [RealtimeModule],
  providers: [ReactionService, PrismaService],
  controllers: [ReactionController],
})
export class ReactionModule {}
