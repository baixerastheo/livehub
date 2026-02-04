import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { auth } from '../lib/auth.js';
import { fromNodeHeaders } from 'better-auth/node';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });

      if (!session?.user) {
        throw new UnauthorizedException('Not authenticated');
      }

      // Attach user and session to request
      (request as any).user = session.user;
      (request as any).session = session.session;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid session');
    }
  }
}
