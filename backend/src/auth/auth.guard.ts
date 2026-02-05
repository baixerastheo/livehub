import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import type { BetterAuthSession } from '../lib/session-from-headers.js';
import { getSessionFromHeaders } from '../lib/session-from-headers.js';

type Session = BetterAuthSession;
type RequestWithAuth = Request & {
  user: NonNullable<Session>['user'];
  session: NonNullable<Session>['session'];
};

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    try {
      const session = await getSessionFromHeaders(request.headers);

      if (!session?.user) {
        throw new UnauthorizedException('Not authenticated');
      }

      (request as RequestWithAuth).user = session.user;
      (request as RequestWithAuth).session = session.session;

      return true;
    } catch {
      throw new UnauthorizedException('Invalid session');
    }
  }
}
