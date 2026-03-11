import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard.js';
import type { RequestWithAuth } from '../lib/request-with-auth.js';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller()
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  /**
   * Récupère la liste des conversations privées de l'utilisateur connecté.
   * Retourne un pair par conversation avec la date du dernier message.
   * @param req - Requête authentifiée contenant l'utilisateur courant
   * @returns Liste des pairs de conversation triée par date décroissante
   */
  @Get('conversations/private')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ description: 'List of private conversation peers' })
  async listPrivateConversations(@Req() req: RequestWithAuth) {
    const result = await this.messageService.listPrivateConversations(
      req.user.id,
    );
    if (result.isErr()) {
      throw new BadRequestException(result.error);
    }
    return result.value.map(({ peer, lastMessageAt }) => ({
      peer: {
        id: peer.id,
        name: peer.name,
        email: peer.email,
        avatarUrl: peer.avatarUrl,
      },
      lastMessageAt: lastMessageAt?.toISOString() ?? null,
    }));
  }

  /**
   * Récupère l'historique d'une conversation privée entre l'utilisateur connecté et un pair.
   * @param peerUserId - Identifiant de l'utilisateur pair
   * @param req - Requête authentifiée contenant l'utilisateur courant
   * @returns Infos du pair et liste des messages triés par date croissante
   */
  @Get('messages/private/:peerUserId')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ description: 'Private conversation with peer user' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getPrivateConversation(
    @Param('peerUserId') peerUserId: string,
    @Req() req: RequestWithAuth,
  ) {
    const result = await this.messageService.getPrivateConversation(
      peerUserId,
      req.user.id,
    );
    if (result.isErr()) {
      if (result.error === 'User not found') {
        throw new NotFoundException(result.error);
      }
      throw new BadRequestException(result.error);
    }
    const { peer, messages } = result.value;
    return {
      peer: {
        id: peer.id,
        name: peer.name,
        email: peer.email,
      },
      messages: messages.map((m) => ({
        id: String(m.id),
        content: m.contenu,
        authorId: m.expediteurId,
        authorName: m.expediteur.name ?? m.expediteur.email,
        createdAtIso: m.creeLe.toISOString(),
        isMe: m.expediteurId === req.user.id,
        read: m.lu,
      })),
    };
  }

  /**
   * Envoie un message privé à un utilisateur.
   * @param peerUserId - Identifiant du destinataire
   * @param dto - Corps du message à envoyer
   * @param req - Requête authentifiée contenant l'expéditeur
   * @returns Le message créé ou erreur si l'utilisateur est introuvable
   */
  @Post('messages/private/:peerUserId')
  @UseGuards(AuthGuard)
  @ApiCreatedResponse({ description: 'Private message sent' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async sendPrivateMessage(
    @Param('peerUserId') peerUserId: string,
    @Body() dto: CreateMessageDto,
    @Req() req: RequestWithAuth,
  ) {
    const result = await this.messageService.createPrivateMessage(
      req.user.id,
      peerUserId,
      dto.content,
    );
    if (result.isErr()) {
      if (result.error === 'User not found') {
        throw new NotFoundException(result.error);
      }
      throw new BadRequestException(result.error);
    }
    const m = result.value;
    return {
      id: String(m.id),
      content: m.contenu,
      authorId: m.expediteurId,
      authorName: m.expediteur.name ?? m.expediteur.email,
      createdAtIso: m.creeLe.toISOString(),
      isMe: true,
      read: m.lu,
    };
  }

  /**
   * Récupère l'historique des messages d'un canal.
   * @param id - Identifiant du canal
   * @returns Liste des messages triés par date croissante ou 404 si le canal est introuvable
   */
  @Get('channels/:id/messages')
  @ApiOkResponse({ description: 'Channel message history' })
  @ApiNotFoundResponse({ description: 'Channel not found' })
  async getChannelMessages(@Param('id', ParseIntPipe) id: number) {
    const result = await this.messageService.getHistoryMessageByChannel(id);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

  /**
   * Envoie un message dans un canal.
   * L'utilisateur doit être membre du serveur auquel appartient le canal.
   * @param canalId - Identifiant du canal cible
   * @param dto - Corps du message à envoyer
   * @param req - Requête authentifiée contenant l'auteur
   * @returns Le message créé ou 404 si le canal est introuvable ou l'accès refusé
   */
  @Post('channels/:id/messages')
  @UseGuards(AuthGuard)
  @ApiCreatedResponse({ description: 'Message sent successfully' })
  @ApiNotFoundResponse({
    description: 'Channel not found or you are not a member of the server',
  })
  async sendMessage(
    @Param('id', ParseIntPipe) canalId: number,
    @Body() dto: CreateMessageDto,
    @Req() req: RequestWithAuth,
  ) {
    const result = await this.messageService.createMessage(
      dto.content,
      canalId,
      req.user.id,
    );
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

  /**
   * Supprime un message de canal.
   * Seuls le propriétaire et les administrateurs du serveur peuvent supprimer des messages.
   * @param id - Identifiant du message à supprimer
   * @param req - Requête authentifiée contenant l'utilisateur qui effectue l'action
   * @returns Le message supprimé ou erreur si introuvable / non autorisé
   */
  @Delete('messages/:id')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ description: 'Message deleted successfully' })
  @ApiNotFoundResponse({ description: 'Message not found' })
  @ApiForbiddenResponse({
    description:
      'Only the server owner and administrators can delete channel messages',
  })
  async deleteMessage(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithAuth,
  ) {
    const result = await this.messageService.deleteMessage(id, req.user.id);
    if (result.isErr()) {
      const msg = result.error;
      if (msg.startsWith('No message')) {
        throw new NotFoundException(msg);
      }
      throw new ForbiddenException(msg);
    }
    return result.value;
  }
}
