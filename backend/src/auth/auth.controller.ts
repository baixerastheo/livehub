import type { IncomingMessage, ServerResponse } from 'node:http';
import { All, Controller, Req, Res } from '@nestjs/common';
import { auth } from '../lib/auth';
import { toNodeHandler } from 'better-auth/node';

@Controller('api/auth')
export class AuthController {
  private handler = toNodeHandler(auth);

  @All('*path')
  async handleAuth(
    @Req() req: IncomingMessage,
    @Res() res: ServerResponse<IncomingMessage>,
  ) {
    return this.handler(req, res);
  }
}
