import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module.js';
import { ServerModule } from './server/server.module.js';
import { CanalModule } from './canal/canal.module.js';
import { InvitationModule } from './invitation/invitation.module.js';

@Module({
  imports: [UserModule, ServerModule, CanalModule, InvitationModule],
  providers: [],
  controllers: [],
})
export class AppModule {}
