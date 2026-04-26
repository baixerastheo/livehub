import { Module } from '@nestjs/common';
import { FriendsController } from './friends.controller.js';
import { FriendsService } from './friends.service.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { NotificationModule } from '../notification/notification.module.js';
import { SupabaseModule } from '../supabase/supabase.module.js';

@Module({
  imports: [RealtimeModule, NotificationModule, SupabaseModule],
  controllers: [FriendsController],
  providers: [FriendsService],
})
export class FriendsModule {}
