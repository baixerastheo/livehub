import {Controller,Get,Post,Put,Delete,Body,Param,ParseIntPipe,Req,UseGuards,} from '@nestjs/common';
import { CanalService } from './canal.service';
import { CreateCanal } from './dto/create-canal.dto';
import { UpdateCanal } from './dto/update-canal.dto';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestWithAuth } from '../lib/request-with-auth';

/**
 * Contrôleur de gestion des canaux.
 * Gère les requêtes liées aux canaux.
 */
@Controller()
@UseGuards(AuthGuard)
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
  async createChannel(@Param('serverId', ParseIntPipe) serverId: number,@Body() data: CreateCanal,@Req() req: RequestWithAuth){
    return this.canalService.createChannel(
      serverId,
      req.user.id,
      data,
    );
  }

  /**
   * Récupère tous les canaux d'un serveur.
   * @param serverId - Identifiant du serveur
   * @returns Tous les canaux du serveur
   */
  @Get('/servers/:serverId/channels')
  async getAllChannelsByServer(
    @Param('serverId', ParseIntPipe) serverId: number,
  ) {
    return this.canalService.getAllChannelsByServer(serverId);
  }

  /**
   * Récupère les détails d'un canal spécifique.
   * @param id - Identifiant du canal
   * @returns Les détails du canal
   */
  @Get('/channels/:id')
  async getChannelById(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.canalService.getChannelById(id);
  }

  /**
   * Met à jour un canal.
   * @param id - Identifiant du canal
   * @param data - Données du canal
   * @returns Canal mis à jour
   */
  @Put('/channels/:id')
  async updateChannel(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCanal,
    @Req() req: RequestWithAuth,
  ) {
    return this.canalService.updateChannel(id, req.user.id, data);
  }

  /**
   * Supprime un canal.
   * Réservé au propriétaire et aux administrateurs du serveur.
   * @param id - Identifiant du canal
   * @param req - Requête authentifiée
   * @returns Canal supprimé
   */
  @Delete('/channels/:id')
  async deleteChannel(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithAuth,
  ) {
    return this.canalService.deleteChannel(id, req.user.id);
  }
}
