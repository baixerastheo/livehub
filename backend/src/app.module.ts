import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module.js';
import { ServerModule } from './server/server.module.js';
import { CanalModule } from './canal/canal.module.js';
import { InvitationService } from './invitation/invitation.service';
import { InvitationController } from './invitation/invitation.controller';
import { InvitationModule } from './invitation/invitation.module';

@Module({
  imports: [UserModule, ServerModule, CanalModule, InvitationModule],
  providers: [InvitationService],
  controllers: [InvitationController],
})
export class AppModule {}
