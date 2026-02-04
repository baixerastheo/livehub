import type { Request } from 'express';
import { auth } from './auth.js';

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

/** Express request with better-auth user and session attached by AuthGuard. */
export type RequestWithAuth = Request & {
  user: NonNullable<Session>['user'];
  session: NonNullable<Session>['session'];
};
