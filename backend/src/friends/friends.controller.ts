import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
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

@ApiTags('friends')
@Controller('friends')
@UseGuards(AuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  /**
   * Récupère la liste des amis de l'utilisateur connecté.
   * @param req - Requête authentifiée contenant l'utilisateur courant
   * @returns Liste des amis
   */
  @Get()
  @ApiOkResponse({ description: 'List friends' })
  async listFriends(@Req() req: RequestWithAuth) {
    return this.friendsService.listFriends(req.user.id);
  }

  /**
   * Récupère les demandes d'amis entrantes et sortantes de l'utilisateur connecté.
   * Les statuts sont normalisés en anglais (pending, accepted, declined).
   * @param req - Requête authentifiée contenant l'utilisateur courant
   * @returns Liste des demandes d'amis avec statut normalisé
   */
  @Get('requests')
  @ApiOkResponse({ description: 'List friend requests (incoming/outgoing)' })
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
   * @param dto - Corps de la requête avec l'identifiant du destinataire
   * @returns Confirmation d'envoi ou erreur métier
   */
  @Post('requests')
  async sendRequest(
    @Req() req: RequestWithAuth,
    @Body() dto: SendFriendRequestDto,
  ) {
    const result = await this.friendsService.sendRequest(
      req.user.id,
      dto.toUserId,
    );
    if (result.isErr()) {
      const e = result.error;
      if (e.code === 'USER_NOT_FOUND') throw new NotFoundException(e.message);
      if (e.code === 'ALREADY_FRIENDS' || e.code === 'REQUEST_PENDING') {
        throw new ConflictException(e.message);
      }
      throw new BadRequestException(e.message);
    }
    return { ok: true };
  }

  /**
   * Accepte une demande d'ami.
   * @param req - Requête authentifiée contenant l'utilisateur courant
   * @param id - Identifiant de la demande d'ami à accepter
   * @returns Confirmation d'acceptation ou erreur si non autorisé / introuvable
   */
  @Post('requests/:id/accept')
  async accept(@Req() req: RequestWithAuth, @Param('id') id: string) {
    const result = await this.friendsService.acceptRequest(id, req.user.id);
    if (result.isErr()) {
      const e = result.error;
      if (e.code === 'REQUEST_NOT_FOUND')
        throw new NotFoundException(e.message);
      if (e.code === 'NOT_ALLOWED') throw new ForbiddenException(e.message);
      throw new BadRequestException(e.message);
    }
    return { ok: true };
  }

  /**
   * Refuse une demande d'ami.
   * @param req - Requête authentifiée contenant l'utilisateur courant
   * @param id - Identifiant de la demande d'ami à refuser
   * @returns Confirmation de refus ou erreur si non autorisé / introuvable
   */
  @Post('requests/:id/decline')
  async decline(@Req() req: RequestWithAuth, @Param('id') id: string) {
    const result = await this.friendsService.declineRequest(id, req.user.id);
    if (result.isErr()) {
      const e = result.error;
      if (e.code === 'REQUEST_NOT_FOUND')
        throw new NotFoundException(e.message);
      if (e.code === 'NOT_ALLOWED') throw new ForbiddenException(e.message);
      throw new BadRequestException(e.message);
    }
    return { ok: true };
  }
}
