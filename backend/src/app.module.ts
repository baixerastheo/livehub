import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { UserModule } from './user/user.module.js';
import { ServerModule } from './server/server.module.js';
import { CanalModule } from './canal/canal.module.js';
import { InvitationModule } from './invitation/invitation.module.js';
import { MessageModule } from './message/message.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    UserModule,
    ServerModule,
    CanalModule,
    InvitationModule,
    MessageModule,
    MessageModule,
    AuthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
  controllers: [],
})
export class AppModule {}
