import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserModule } from './user/user.module';
import { ServerModule } from './server/server.module';
import { CanalModule } from './canal/canal.module';
import { InvitationModule } from './invitation/invitation.module';
import { MessageModule } from './message/message.module';
import { AuthModule } from './auth/auth.module';
import { FriendsModule } from './friends/friends.module';

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
