import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { UserController } from './user.controller';
import { UserService } from './user.service';
@Module({
  imports: [AuthModule, RealtimeModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
