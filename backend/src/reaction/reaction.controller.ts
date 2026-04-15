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

/**
 * Controller de gestion des réactions sur les messages de canal et privés.
 */
@Controller()
@UseGuards(AuthGuard)
export class ReactionController {
  constructor(private readonly reactionService: ReactionService) {}

  /**
   * Ajoute ou retire une réaction sur un message de canal.
   * @param messageId - Identifiant du message ciblé
   * @param body - DTO contenant l'emoji de la réaction
   * @param req - Requête authentifiée (contient l'utilisateur courant)
   * @returns Les réactions agrégées du message
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
   * Ajoute ou retire une réaction sur un message privé.
   * @param messageId - Identifiant du message ciblé
   * @param body - DTO contenant l'emoji de la réaction
   * @param req - Requête authentifiée (contient l'utilisateur courant)
   * @returns Les réactions agrégées du message
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
