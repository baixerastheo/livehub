import { All, Controller, Req, Res } from '@nestjs/common';
import { auth } from '../lib/auth';
import { toNodeHandler } from 'better-auth/node';

@Controller('api/auth')
export class AuthController {
  private handler = toNodeHandler(auth);

  @All('*path')
  async handleAuth(@Req() req: any, @Res() res: any) {
    return this.handler(req, res);
  }
}
