import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { getJwtAccessSecret, getJwtDefaultExpiresIn } from './auth.config.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { UserModule } from '../user/user.module.js';
import { JwtStrategy } from './strategy/jwt-strategy.js';
import { LocalStrategy } from './strategy/local.strategy.js';

@Module({
  imports: [
    UserModule,
    JwtModule.register({
      secret: getJwtAccessSecret(),
      signOptions: { expiresIn: getJwtDefaultExpiresIn() },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
