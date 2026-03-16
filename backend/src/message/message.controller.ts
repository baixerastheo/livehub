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
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { RequestWithAuth } from '../lib/request-with-auth.js';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';

/**
 * Contrôleur de gestion des messages.
 * Gère les messages privés et les messages de canal.
 */
@Controller()
@UseGuards(AuthGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  /**
   * Récupère la liste des conversations privées de l'utilisateur connecté.
   * @param req - Requête authentifiée contenant l'utilisateur courant
   * @returns Liste des pairs de conversation triée par date décroissante
   */
  @Get('conversations/private')
  async listPrivateConversations(@Req() req: RequestWithAuth) {
    const list = await this.messageService.listPrivateConversations(
      req.user.id,
    );
    return list.map(({ peer, lastMessageAt }) => ({
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
   * Récupère l'historique d'une conversation privée avec un pair.
   * @param peerUserId - Identifiant de l'utilisateur pair
   * @param req - Requête authentifiée contenant l'utilisateur courant
   * @returns Infos du pair et liste des messages triés par date croissante
   */
  @Get('messages/private/:peerUserId')
  async getPrivateConversation(
    @Param('peerUserId') peerUserId: string,
    @Req() req: RequestWithAuth,
  ) {
    const { peer, messages } = await this.messageService.getPrivateConversation(
      peerUserId,
      req.user.id,
    );
    return {
      peer: { id: peer.id, name: peer.name, email: peer.email },
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
   * @returns Le message créé
   */
  @Post('messages/private/:peerUserId')
  async sendPrivateMessage(
    @Param('peerUserId') peerUserId: string,
    @Body() dto: CreateMessageDto,
    @Req() req: RequestWithAuth,
  ) {
    const m = await this.messageService.createPrivateMessage(
      req.user.id,
      peerUserId,
      dto.content,
    );
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
   * @returns Liste des messages triés par date croissante
   */
  @Get('channels/:id/messages')
  async getChannelMessages(@Param('id', ParseIntPipe) id: number) {
    return this.messageService.getHistoryMessageByChannel(id);
  }

  /**
   * Envoie un message dans un canal.
   * @param canalId - Identifiant du canal cible
   * @param dto - Corps du message à envoyer
   * @param req - Requête authentifiée contenant l'auteur
   * @returns Le message créé
   */
  @Post('channels/:id/messages')
  async sendMessage(
    @Param('id', ParseIntPipe) canalId: number,
    @Body() dto: CreateMessageDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.messageService.createMessage(dto.content, canalId, req.user.id);
  }

  /**
   * Supprime un message de canal.
   * Seuls le propriétaire et les administrateurs du serveur peuvent supprimer des messages.
   * @param id - Identifiant du message à supprimer
   * @param req - Requête authentifiée contenant l'utilisateur qui effectue l'action
   * @returns Le message supprimé
   */
  @Delete('messages/:id')
  async deleteMessage(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithAuth,
  ) {
    return this.messageService.deleteMessage(id, req.user.id);
  }
}
