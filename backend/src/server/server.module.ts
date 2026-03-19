import { Module } from '@nestjs/common';
import { ServerController } from './server.controller';
import { ServerService } from './server.service';
import { ServerMemberService } from './server-member.service';
import { ServerBanService } from './server-ban.service';
import { ServerUtilsService } from './server-utils.service';
import { PrismaService } from '../prisma.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { RealtimeModule } from '../realtime/realtime.module.js';

@Module({
  imports: [SupabaseModule, RealtimeModule],
  controllers: [ServerController],
  providers: [
    ServerService,
    ServerMemberService,
    ServerBanService,
    ServerUtilsService,
    PrismaService,
  ],
})
export class ServerModule {}
