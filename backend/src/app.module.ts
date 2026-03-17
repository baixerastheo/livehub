import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserModule } from './user/user.module';
import { ServerModule } from './server/server.module';
import { CanalModule } from './canal/canal.module';
import { MessageModule } from './message/message.module';
import { AuthModule } from './auth/auth.module';
import { FriendsModule } from './friends/friends.module';
import { SupabaseModule } from './supabase/supabase.module';
import { RealtimeModule } from './realtime/realtime.module.js';
import { GifModule } from './gif/gif.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 1000 }]),
    AuthModule,
    UserModule,
    ServerModule,
    CanalModule,
    MessageModule,
    FriendsModule,
    SupabaseModule,
    RealtimeModule,
    GifModule,
  ],
  controllers: [],
})
export class AppModule {}
