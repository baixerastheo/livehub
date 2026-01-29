import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module.js';
import { ServerModule } from './server/server.module.js';
import { CanalModule } from './canal/canal.module.js';
import { InvitationModule } from './invitation/invitation.module.js';
import { MessageModule } from './message/message.module.js';

@Module({
  imports: [UserModule, ServerModule, CanalModule, InvitationModule, MessageModule, MessageModule],
  providers: [],
  controllers: [],
})
export class AppModule {}
