import { Module } from '@nestjs/common';
import { MessageGateway } from './message.gateway.js';
import { PresenceService } from './presence.service.js';
import { VoicePresenceService } from './voice-presence.service.js';
import { SupabaseModule } from '../supabase/supabase.module.js';

@Module({
  imports: [SupabaseModule],
  providers: [MessageGateway, PresenceService, VoicePresenceService],
  exports: [MessageGateway, PresenceService, VoicePresenceService],
})
export class RealtimeModule {}
