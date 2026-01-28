import type { Strategy as LocalStrategyBase } from 'passport-local';
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service.js';

@Injectable()
export class LocalStrategy extends PassportStrategy(
  Strategy as unknown as new (...args: any[]) => LocalStrategyBase,
) {
  constructor(private authService: AuthService) {
    // The `super` call is safe here; Passport local strategy expects this options object.
    // Types from `passport-local` are not precise enough, which triggers a false positive.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const result = await this.authService.validateUser(email, password);

    if (result.isErr()) {
      throw new UnauthorizedException();
    }

    return result.unwrapOr(null as never);
  }
}
