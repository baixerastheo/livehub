import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserModule } from './user/user.module.js';
import { ServerModule } from './server/server.module.js';
import { CanalModule } from './canal/canal.module.js';
import { InvitationModule } from './invitation/invitation.module.js';
import { MessageModule } from './message/message.module.js';
import { AuthModule } from './auth/auth.module.js';
import { FriendsModule } from './friends/friends.module.js';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    AuthModule,
    UserModule,
    ServerModule,
    CanalModule,
    InvitationModule,
    MessageModule,
    FriendsModule,
  ],
  controllers: [],
})
export class AppModule {}
