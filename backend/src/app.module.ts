import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module.js';
import { ServerModule } from './server/server.module.js';

@Module({
  imports: [UserModule, ServerModule],
})
export class AppModule {}
