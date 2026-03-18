import { Module } from '@nestjs/common';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { AiBotService } from './ai-bot.service';
import { PrismaService } from '../prisma.service';
import { RealtimeModule } from '../realtime/realtime.module.js';

@Module({
  imports: [RealtimeModule],
  controllers: [MessageController],
  providers: [MessageService, AiBotService, PrismaService],
})
export class MessageModule {}
