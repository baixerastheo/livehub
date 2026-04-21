import { Module } from '@nestjs/common';
import { ServerController } from './server.controller';
import { ServerService } from './server.service';
import { ServerMemberService } from './server-member.service';
import { ServerBanService } from './server-ban.service';
import { ServerUtilsService } from './server-utils.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [SupabaseModule, RealtimeModule, NotificationModule],
  controllers: [ServerController],
  providers: [
    ServerService,
    ServerMemberService,
    ServerBanService,
    ServerUtilsService,
  ],
})
export class ServerModule {}
