import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
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
      if (result.error.includes('yourself')) {
        throw new BadRequestException(result.error);
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

  @Get('channels/:id/messages')
  @ApiOkResponse({
    description: 'Channel message history',
  })
  @ApiNotFoundResponse({
    description: 'Channel not found',
  })
  async getChannelMessages(@Param('id', ParseIntPipe) id: number) {
    const result = await this.messageService.getHistoryMessageByChannel(id);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

  @Post('channels/:id/messages')
  @ApiCreatedResponse({
    description: 'Message sent successfully',
  })
  @ApiNotFoundResponse({
    description: 'Channel not found or you are not a member of the server',
  })
  async SendMessage(
    @Param('id', ParseIntPipe) canalId: number,
    @Body() dto: CreateMessageDto,
  ) {
    //récupérer userId depuis la session Better Auth
    const userId = '';
    const result = await this.messageService.createMessage(
      dto.content,
      canalId,
      userId,
    );
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

  @Delete('messages/:id')
  @ApiOkResponse({
    description: 'Message deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Message not found',
  })
  @ApiForbiddenResponse({
    description: 'You can only delete your own messages',
  })
  async deleteMessage(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId') userId: string,
  ) {
    const result = await this.messageService.deleteMessage(id, userId);
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
