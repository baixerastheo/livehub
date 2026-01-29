import {Controller,Get,Post,Put,Delete,Body,Param,ParseIntPipe,NotFoundException,} from '@nestjs/common';
import {ApiOkResponse,ApiCreatedResponse,ApiNotFoundResponse,} from '@nestjs/swagger';
import { CanalService } from './canal.service.js';
import { CreateCanal } from './dto/create-canal.dto.js';
import { UpdateCanal } from './dto/update-canal.dto.js';

@Controller()
export class CanalController {
  constructor(private readonly canalService: CanalService) {}

  @Post('/servers/:serverId/channels')
  @ApiCreatedResponse({
    description: 'Channel created successfully',
    type: CreateCanal,
  })
  @ApiNotFoundResponse({
    description:
      "Server with this ID does not exist or you don't have permission",
  })
  async createChannel(
    @Param('serverId', ParseIntPipe) serverId: number,
    @Body() data: CreateCanal,
  ) {
    //Manque a recuperer l'id de l'user connecter avec le token donc 1 pour l'instant
    const userId = 4;
    const result = await this.canalService.CreateChannel(
      serverId,
      userId,
      data,
    );
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

  @Get('/servers/:serverId/channels')
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

