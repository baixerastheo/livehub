import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestWithAuth } from '../lib/request-with-auth';
import { VoiceService } from './voice.service';

@Controller('voice')
@UseGuards(AuthGuard)
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Post('token')
  async getToken(
    @Body() body: { channelId: number },
    @Req() req: RequestWithAuth,
  ) {
    return this.voiceService.generateToken(body.channelId, req.user.id);
  }
}
