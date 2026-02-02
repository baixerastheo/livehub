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
import { JwtAuthGuard } from '../auth/authGuard/jwt-auth.guard.js';
import { FriendsService } from './friends.service.js';
import { SendFriendRequestDto } from './dto/send-friend-request.dto.js';

type AuthedReq = { user: { id: number } };

@ApiTags('friends')
@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  @ApiOkResponse({ description: 'List friends' })
  async listFriends(@Req() req: AuthedReq) {
    return this.friendsService.listFriends(req.user.id);
  }

  @Get('requests')
  @ApiOkResponse({ description: 'List friend requests (incoming/outgoing)' })
  async listRequests(@Req() req: AuthedReq) {
    const rows = await this.friendsService.listRequests(req.user.id);
    return rows.map((r) => ({
      id: r.id,
      fromUser: r.de,
      toUser: r.a,
      status:
        r.statut === 'EN_ATTENTE'
          ? 'pending'
          : r.statut === 'ACCEPTEE'
            ? 'accepted'
            : 'declined',
      createdAt: r.creeLe.toISOString(),
    }));
  }

  @Post('requests')
  async sendRequest(@Req() req: AuthedReq, @Body() dto: SendFriendRequestDto) {
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
      if (e.code === 'SELF') throw new BadRequestException(e.message);
      throw new BadRequestException(e.message);
    }
    return { ok: true };
  }

  @Post('requests/:id/accept')
  async accept(@Req() req: AuthedReq, @Param('id') id: string) {
    const result = await this.friendsService.acceptRequest(id, req.user.id);
    if (result.isErr()) {
      const e = result.error;
      if (e.code === 'REQUEST_NOT_FOUND')
        throw new NotFoundException(e.message);
      if (e.code === 'NOT_ALLOWED') throw new ForbiddenException(e.message);
      if (e.code === 'REQUEST_NOT_PENDING')
        throw new BadRequestException(e.message);
      throw new BadRequestException(e.message);
    }
    return { ok: true };
  }

  @Post('requests/:id/decline')
  async decline(@Req() req: AuthedReq, @Param('id') id: string) {
    const result = await this.friendsService.declineRequest(id, req.user.id);
    if (result.isErr()) {
      const e = result.error;
      if (e.code === 'REQUEST_NOT_FOUND')
        throw new NotFoundException(e.message);
      if (e.code === 'NOT_ALLOWED') throw new ForbiddenException(e.message);
      if (e.code === 'REQUEST_NOT_PENDING')
        throw new BadRequestException(e.message);
      throw new BadRequestException(e.message);
    }
    return { ok: true };
  }
}
