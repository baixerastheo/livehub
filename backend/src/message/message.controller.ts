import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { MessageService } from './message.service.js';
import { CreateMessageDto } from './dto/create-message.dto.js';

@Controller()
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

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
      dto.contenu,
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
