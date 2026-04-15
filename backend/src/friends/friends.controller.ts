import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { RequestWithAuth } from '../lib/request-with-auth.js';
import { FriendsService } from './friends.service.js';
import { SendFriendRequestDto } from './dto/send-friend-request.dto.js';

const FRIEND_REQUEST_STATUS_MAP: Record<
  string,
  'pending' | 'accepted' | 'declined'
> = {
  EN_ATTENTE: 'pending',
  ACCEPTEE: 'accepted',
  REFUSEE: 'declined',
};

/**
 * Contrôleur de gestion des amis.
 * Gère les requêtes liées aux amis, telles que la liste des amis, les demandes d'amis, etc.
 */
@Controller('friends')
@UseGuards(AuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  /**
   * Récupère la liste des amis de l'utilisateur connecté.
   * @param req - Requête authentifiée contenant l'utilisateur courant
   * @returns Liste des amis avec leur statut en ligne ou hors ligne
   */
  @Get()
  async listFriends(@Req() req: RequestWithAuth) {
    return this.friendsService.listFriends(req.user.id);
  }

  /**
   * Récupère les demandes d'amis entrantes et sortantes de l'utilisateur connecté.
   * Les statuts sont normalisés en anglais : 'pending', 'accepted', 'declined'.
   * @param req - Requête authentifiée contenant l'utilisateur courant
   * @returns Liste des demandes d'amis avec informations des utilisateurs et statut
   */
  @Get('requests')
  async listRequests(@Req() req: RequestWithAuth) {
    const rows = await this.friendsService.listRequests(req.user.id);
    return rows.map((r) => ({
      id: r.id,
      fromUser: r.fromUser,
      toUser: r.toUser,
      status: FRIEND_REQUEST_STATUS_MAP[r.statut] ?? 'pending',
      createdAt: r.creeLe.toISOString(),
    }));
  }

  /**
   * Envoie une demande d'ami à un autre utilisateur.
   * @param req - Requête authentifiée contenant l'utilisateur courant
   * @param dto - Corps de la requête contenant l'identifiant du destinataire
   * @returns Confirmation d'envoi de la demande
   */
  @Post('requests')
  async sendRequest(
    @Req() req: RequestWithAuth,
    @Body() dto: SendFriendRequestDto,
  ) {
    await this.friendsService.sendRequest(req.user.id, dto.toUserId);
    return { ok: true };
  }

  /**
   * Accepte une demande d'ami.
   * @param req - Requête authentifiée contenant l'utilisateur courant
   * @param id - Identifiant de la demande d'ami à accepter
   * @returns Confirmation d'acceptation
   */
  @Post('requests/:id/accept')
  async accept(@Req() req: RequestWithAuth, @Param('id') id: string) {
    await this.friendsService.acceptRequest(id, req.user.id);
    return { ok: true };
  }

  /**
   * Refuse une demande d'ami.
   * @param req - Requête authentifiée contenant l'utilisateur courant
   * @param id - Identifiant de la demande d'ami à refuser
   * @returns Confirmation de refus
   */
  @Post('requests/:id/decline')
  async decline(@Req() req: RequestWithAuth, @Param('id') id: string) {
    await this.friendsService.declineRequest(id, req.user.id);
    return { ok: true };
  }
}
