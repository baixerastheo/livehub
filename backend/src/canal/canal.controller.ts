import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Req, UseGuards, NotFoundException } from '@nestjs/common';  
import { ApiOkResponse, ApiCreatedResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { CanalService } from './canal.service';
import { CreateCanal } from './dto/create-canal.dto';
import { UpdateCanal } from './dto/update-canal.dto';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestWithAuth } from '../lib/request-with-auth';
import { Canal } from 'generated/prisma/client';


/**
 * Contrôleur de gestion des canaux.
 * Gère les requêtes liées aux canaux.
 */
@Controller()
export class CanalController {
  constructor(private readonly canalService: CanalService) {}

  /**
   * Crée un nouveau canal.
   * @param serverId - Identifiant du serveur
   * @param data - Données du canal
   * @param req - Requête authentifiée
   * @returns Canal créé
   */
  @Post('/servers/:serverId/channels')
  @UseGuards(AuthGuard)
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
    @Req() req: RequestWithAuth): Promise<Canal> {
    const result = await this.canalService.createChannel(serverId, req.user.id, data);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

  /**
   * Récupère tous les canaux d'un serveur.
   * @param serverId - Identifiant du serveur
   * @returns Tous les canaux du serveur
   */
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
    const result = await this.canalService.getAllChannelsByServer(serverId);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }


  /**
   * Récupère les détails d'un canal spécifique.
   * @param id - Identifiant du canal
   * @returns Les détails du canal
   */
  @Get('/channels/:id')
  @ApiOkResponse({
    description: 'Channel retrieved successfully',
  })
  @ApiNotFoundResponse({
    description: 'Channel with this ID does not exist',
  })
  async getChannelById(@Param('id', ParseIntPipe) id: number) {
    const result = await this.canalService.getChannelDetails(id);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }


  /**
   * Met à jour un canal.
   * @param id - Identifiant du canal
   * @param data - Données du canal
   * @returns Canal mis à jour
   */
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
    const result = await this.canalService.updateChannel(id, data);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }


  /**
   * Supprime un canal.
   * @param id - Identifiant du canal
   * @returns Canal supprimé
   */
  @Delete('/channels/:id')
  @ApiOkResponse({
    description: 'Channel deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Channel with this ID does not exist',
  })
  async deleteChannel(@Param('id', ParseIntPipe) id: number) {
    const result = await this.canalService.deleteChannel(id);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }
}
