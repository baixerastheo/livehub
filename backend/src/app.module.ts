import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env.schema';
import { UserModule } from './user/user.module';
import { ServerModule } from './server/server.module';
import { CanalModule } from './canal/canal.module';
import { InvitationModule } from './invitation/invitation.module';
import { MessageModule } from './message/message.module';
import { AuthModule } from './auth/auth.module';
import { FriendsModule } from './friends/friends.module';
import { SupabaseModule } from './supabase/supabase.module';
import { RealtimeModule } from './realtime/realtime.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => validateEnv(config),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    AuthModule,
    UserModule,
    ServerModule,
    CanalModule,
    InvitationModule,
    MessageModule,
    FriendsModule,
    SupabaseModule,
    RealtimeModule,
  ],
  controllers: [],
})
export class AppModule {}
