import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { Utilisateur as User } from '../../../generated/prisma/client.js';
import { UserService } from '../../user/user.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET ?? 'changeme',
    });
  }

  async validate(payload: { sub: number; email: string }): Promise<User> {
    const result = await this.usersService.getUserById(payload.sub);

    if (result.isErr()) {
      throw new UnauthorizedException(result.error);
    }

    return result.unwrapOr(null as never);
  }
}

