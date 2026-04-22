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
import { PrivateMessageService } from './private-message.service';
import { ChannelMessageService } from './channel-message.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller()
@UseGuards(AuthGuard)
export class MessageController {
  constructor(
    private readonly privateMessageService: PrivateMessageService,
    private readonly channelMessageService: ChannelMessageService,
  ) {}

  /** Récupère la liste des conversations privées de l'utilisateur, avec le dernier message et sa date
   * @param req requête authentifiée contenant l'utilisateur courant
   * @return liste des conversations privées avec le pair, la date et le contenu du dernier message
   */
  @Get('conversations/private')
  async listPrivateConversations(@Req() req: RequestWithAuth) {
    const list = await this.privateMessageService.listPrivateConversations(
      req.user.id,
    );
    return list.map(({ peer, lastMessageAt, lastMessageContent }) => ({
      peer: {
        id: peer.id,
        name: peer.name,
        email: peer.email,
        avatarUrl: peer.avatarUrl,
      },
      lastMessageAt: lastMessageAt?.toISOString() ?? null,
      lastMessageContent: lastMessageContent ?? null,
    }));
  }

  /** Récupère l'historique d'une conversation privée avec un pair.
   * @param peerUserId identifiant de l'utilisateur pair
   * @param req requête authentifiée contenant l'utilisateur courant
   * @return historique de la conversation privée avec le pair, trié par date croissante
   */
  @Get('messages/private/:peerUserId')
  async getPrivateConversation(
    @Param('peerUserId') peerUserId: string,
    @Req() req: RequestWithAuth,
  ) {
    const { peer, messages } =
      await this.privateMessageService.getPrivateConversation(
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
        reactions: m.reactions,
      })),
    };
  }

  /** Envoie un message privé à un utilisateur.
   * @param peerUserId identifiant de l'utilisateur destinataire
   * @param dto contenu du message à envoyer
   * @param req requête authentifiée contenant l'utilisateur courant
   * @return le message privé créé avec son contenu, son auteur et sa date de création
   */
  @Post('messages/private/:peerUserId')
  async sendPrivateMessage(
    @Param('peerUserId') peerUserId: string,
    @Body() dto: CreateMessageDto,
    @Req() req: RequestWithAuth,
  ) {
    const m = await this.privateMessageService.createPrivateMessage(
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

  /** Récupère l'historique des messages d'un canal.
   * @param id identifiant du canal
   * @return liste des messages du canal avec leur auteur, leur contenu, leur date de création et leurs réactions, triés par date croissante
   * @throws NotFoundException si le canal n'existe pas
   */
  @Get('channels/:id/messages')
  async getChannelMessages(@Param('id', ParseIntPipe) id: number) {
    return this.channelMessageService.getHistoryMessageByChannel(id);
  }

  /** Envoie un message dans un canal.
   * @param id identifiant du canal
   * @param dto contenu du message à envoyer
   * @param req requête authentifiée contenant l'utilisateur courant
   * @return le message créé avec son contenu, son auteur et sa date de création
   * @throws NotFoundException si le canal n'existe pas
   * @throws ForbiddenException si l'utilisateur n'est pas membre du serveur
   */
  @Post('channels/:id/messages')
  async sendMessage(
    @Param('id', ParseIntPipe) canalId: number,
    @Body() dto: CreateMessageDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.channelMessageService.createMessage(
      dto.content,
      canalId,
      req.user.id,
    );
  }

  /** Supprime un message de canal (admin/propriétaire uniquement).
   * @param id identifiant du message à supprimer
   * @param req requête authentifiée contenant l'utilisateur courant
   * @return confirmation de suppression
   * @throws NotFoundException si le message n'existe pas ou n'est pas un message de canal
   * @throws ForbiddenException si l'utilisateur n'est pas admin/propriétaire du serveur
   */
  @Delete('messages/:id')
  async deleteMessage(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithAuth,
  ) {
    return this.channelMessageService.deleteMessage(id, req.user.id);
  }
}
