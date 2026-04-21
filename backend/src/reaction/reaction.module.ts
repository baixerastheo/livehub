import { Module } from '@nestjs/common';
import { ReactionService } from './reaction.service.js';
import { ReactionController } from './reaction.controller.js';
import { RealtimeModule } from '../realtime/realtime.module.js';

@Module({
  imports: [RealtimeModule],
  providers: [ReactionService],
  controllers: [ReactionController],
})
export class ReactionModule {}
