import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { RequestWithAuth } from '../lib/request-with-auth.js';
import { ReactionService } from './reaction.service.js';
import { ToggleReactionDto } from './dto/toggle-reaction.dto.js';

@Controller()
@UseGuards(AuthGuard)
export class ReactionController {
  constructor(private readonly reactionService: ReactionService) {}

  /**
   * Toggles a reaction on a channel message.
   * @param messageId - Message ID
   * @param body - DTO containing the emoji
   * @param req - Authenticated request
   * @returns Aggregated reactions
   */
  @Post('messages/channel/:messageId/reactions')
  async toggleChannelReaction(
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body() body: ToggleReactionDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.reactionService.toggleChannelReaction(
      messageId,
      req.user.id,
      body.emoji,
    );
  }

  /**
   * Toggles a reaction on a private message.
   * @param messageId - Message ID
   * @param body - DTO containing the emoji
   * @param req - Authenticated request
   * @returns Aggregated reactions
   */
  @Post('messages/private/:messageId/reactions')
  async togglePrivateReaction(
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body() body: ToggleReactionDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.reactionService.togglePrivateReaction(
      messageId,
      req.user.id,
      body.emoji,
    );
  }
}
