import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { AuthenticatedUser } from '../types.js';
import { UserService } from '../../user/user.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET
    });
  }

  async validate(payload: {
    sub: number;
    email: string;
  }): Promise<AuthenticatedUser> {
    const result = await this.usersService.getUserById(payload.sub);

    if (result.isErr()) {
      throw new UnauthorizedException(result.error);
    }

    const user = result.unwrapOr(null as never);
    const { motDePasse: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
