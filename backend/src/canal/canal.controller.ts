import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { CanalService } from './canal.service.js';
import { CreateCanal } from './dto/create-canal.dto.js';
import { UpdateCanal } from './dto/update-canal.dto.js';

@ApiTags('Channels')
@Controller()
export class CanalController {
  constructor(private readonly canalService: CanalService) {}

  @Post('/servers/:serverId/channels')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'Channel created successfully',
    type: CreateCanal,
  })
  @ApiNotFoundResponse({
    description: 'Server with this ID does not exist',
  })
  @ApiForbiddenResponse({
    description: "You don't have permission to create channels",
  })
  async createChannel(
    @Param('serverId', ParseIntPipe) serverId: number,
    @Body() data: CreateCanal,
  ) {
    const userId = 4;
    const result = await this.canalService.CreateChannel(
      serverId,
      userId,
      data,
    );
    if (result.isErr()) {
      const msg = result.error;
      if (
        msg === 'You are not a member of this server' ||
        msg === 'Only owners and administrators can create channels'
      ) {
        throw new ForbiddenException(msg);
      }
      throw new NotFoundException(msg);
    }
    return result.value;
  }

  @Get('/servers/:serverId/channels')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Server channels retrieved successfully',
  })
  @ApiNotFoundResponse({
    description: 'Server with this ID does not exist or has no channels',
  })
  async getAllChannelsByServer(
    @Param('serverId', ParseIntPipe) serverId: number,
  ) {
    const result = await this.canalService.GetAllChannelsByServer(serverId);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

  @Get('/channels/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Channel retrieved successfully',
  })
  @ApiNotFoundResponse({
    description: 'Channel with this ID does not exist',
  })
  async getChannelById(@Param('id', ParseIntPipe) id: number) {
    const result = await this.canalService.GetDetailsChannel(id);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

  @Put('/channels/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Channel updated successfully',
    type: UpdateCanal,
  })
  @ApiNotFoundResponse({
    description: 'Channel with this ID does not exist',
  })
  async updateChannel(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCanal,
  ) {
    const result = await this.canalService.UpdateChannel(id, data);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

  @Delete('/channels/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Channel deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Channel with this ID does not exist',
  })
  async deleteChannel(@Param('id', ParseIntPipe) id: number) {
    const result = await this.canalService.DeleteChannel(id);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }
}

