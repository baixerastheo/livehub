import { Module } from '@nestjs/common';
import { MessageController } from './message.controller';
import { PrivateMessageService } from './private-message.service';
import { ChannelMessageService } from './channel-message.service';
import { AiBotService } from './ai-bot.service';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { NotificationModule } from '../notification/notification.module';
import { ServerModule } from '../server/server.module';

@Module({
  imports: [RealtimeModule, NotificationModule, ServerModule],
  controllers: [MessageController],
  providers: [PrivateMessageService, ChannelMessageService, AiBotService],
})
export class MessageModule {}
