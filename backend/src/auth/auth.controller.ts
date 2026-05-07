import type { IncomingMessage, ServerResponse } from 'node:http';
import { All, Controller, Req, Res } from '@nestjs/common';
import { auth } from '../lib/auth';
import { toNodeHandler } from 'better-auth/node';

@Controller('auth')
export class AuthController {
  private handler = toNodeHandler(auth);

  /**
   * Délègue toutes les requêtes d'authentification au handler better-auth.
   * Couvre les routes : login, logout, register, session, OAuth callbacks, etc.
   * @param req - Requête HTTP entrante
   * @param res - Réponse HTTP sortante
   */
  @All('*path')
  async handleAuth(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse<IncomingMessage>,
  ) {
    return this.handler(req, res);
  }
}
