import { ServerService } from './server.service';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { UpdateServer } from './dto/update-server.dto';
import { UpdateMemberRole } from './dto/update-member-role.dto';
import { CreateServer } from './dto/create-server.dto';
import { AddMember } from './dto/add-member.dto';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestWithAuth } from '../lib/request-with-auth';

@Controller('servers')
export class ServerController {
  constructor(private readonly serverService: ServerService) {}

  /**
   * Crée un nouveau serveur avec l'utilisateur connecté comme propriétaire.
   * @param data - Données du serveur à créer
   * @param req - Requête authentifiée contenant le créateur
   * @returns Le serveur créé
   */
  @Post('/')
  @UseGuards(AuthGuard)
  @ApiCreatedResponse({
    description: 'Server created successfully',
    type: CreateServer,
  })
  async createServer(@Body() data: CreateServer, @Req() req: RequestWithAuth) {
    const result = await this.serverService.createServer(data, req.user.id);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

  /**
   * Récupère tous les serveurs auxquels appartient l'utilisateur connecté.
   * @param req - Requête authentifiée contenant l'utilisateur courant
   * @returns Liste des appartenances avec les informations de chaque serveur
   */
  @Get('/')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ description: "User's servers retrieved successfully" })
  async getUserServers(@Req() req: RequestWithAuth) {
    return this.serverService.getUserServers(req.user.id);
  }

  /**
   * Récupère un serveur par son identifiant.
   * @param id - Identifiant du serveur
   * @returns Le serveur ou 404 s'il n'existe pas
   */
  @Get('/:id')
  @ApiOkResponse({ description: 'Server retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Server with this ID does not exist' })
  async getServerById(@Param('id', ParseIntPipe) id: number) {
    const result = await this.serverService.getServerById(id);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

  /**
   * Met à jour les informations d'un serveur.
   * @param data - Nouvelles données du serveur
   * @param id - Identifiant du serveur à modifier
   * @returns Le serveur mis à jour ou 404 s'il n'existe pas
   */
  @Put('/:id')
  @ApiOkResponse({ description: 'Server updated successfully', type: UpdateServer })
  @ApiNotFoundResponse({ description: 'Server with this ID does not exist' })
  async updateServer(
    @Body() data: UpdateServer,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.serverService.updateServer(id, data);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

  /**
   * Supprime un serveur.
   * @param id - Identifiant du serveur à supprimer
   * @returns Le serveur supprimé ou 404 s'il n'existe pas
   */
  @Delete('/:id')
  @ApiOkResponse({ description: 'Server deleted successfully' })
  @ApiNotFoundResponse({ description: 'Server with this ID does not exist' })
  async deleteServer(@Param('id', ParseIntPipe) id: number) {
    const result = await this.serverService.deleteServer(id);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

  /**
   * Permet à l'utilisateur connecté de rejoindre un serveur.
   * @param serverId - Identifiant du serveur à rejoindre
   * @param req - Requête authentifiée contenant l'utilisateur courant
   * @returns Le nouveau membre ou erreur si déjà membre / serveur introuvable
   */
  @Post('/:id/join')
  @UseGuards(AuthGuard)
  @ApiCreatedResponse({ description: 'You have successfully joined the server' })
  @ApiNotFoundResponse({ description: 'Server with this ID does not exist' })
  @ApiConflictResponse({ description: 'You are already a member of this server' })
  async joinServer(
    @Param('id', ParseIntPipe) serverId: number,
    @Req() req: RequestWithAuth,
  ) {
    const result = await this.serverService.joinServer(serverId, req.user.id);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

  /**
   * Ajoute un utilisateur à un serveur (action réservée aux admins/proprio).
   * @param serverId - Identifiant du serveur cible
   * @param data - Données contenant l'identifiant de l'utilisateur à ajouter
   * @param req - Requête authentifiée contenant l'utilisateur qui effectue l'action
   * @returns Le nouveau membre ou erreur si non autorisé / déjà membre
   */
  @Post('/:id/members')
  @UseGuards(AuthGuard)
  @ApiCreatedResponse({ description: 'Member added to server successfully', type: AddMember })
  @ApiConflictResponse({ description: 'User is already a member of the server' })
  @ApiNotFoundResponse({
    description:
      'Server with this ID does not exist, acting user is not a member, or user not found',
  })
  async addMember(
    @Param('id', ParseIntPipe) serverId: number,
    @Body() data: AddMember,
    @Req() req: RequestWithAuth,
  ) {
    const result = await this.serverService.addMember(
      serverId,
      req.user.id,
      data,
    );
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

  /**
   * Permet à l'utilisateur connecté de quitter un serveur.
   * @param serverId - Identifiant du serveur à quitter
   * @param req - Requête authentifiée contenant l'utilisateur courant
   * @returns Le membre supprimé ou 404 si non membre
   */
  @Delete('/:id/leave')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ description: 'You have successfully left the server' })
  @ApiNotFoundResponse({ description: 'You are not a member of this server' })
  async leaveServer(
    @Param('id', ParseIntPipe) serverId: number,
    @Req() req: RequestWithAuth,
  ) {
    const result = await this.serverService.leaveServer(serverId, req.user.id);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

  /**
   * Récupère tous les membres d'un serveur avec leur statut de présence.
   * @param serverId - Identifiant du serveur
   * @returns Liste des membres avec leurs infos utilisateur ou 404 si le serveur est introuvable
   */
  @Get('/:id/members')
  @ApiOkResponse({ description: 'Server members retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Server with this ID does not exist' })
  async getServerMembers(@Param('id', ParseIntPipe) serverId: number) {
    const result = await this.serverService.getServerMembers(serverId);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

  /**
   * Transfère la propriété du serveur à un autre membre.
   * L'ancien propriétaire passe ADMINISTRATEUR, le nouveau devient PROPRIETAIRE.
   * @param serverId - Identifiant du serveur
   * @param userId - Identifiant du futur propriétaire
   * @param req - Requête authentifiée contenant l'actuel propriétaire
   * @returns Les identifiants du nouveau et de l'ancien propriétaire
   */
  @Post('/:id/transfer-ownership/:userId')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ description: 'Ownership transferred successfully' })
  @ApiNotFoundResponse({
    description: 'Server or target member not found, or not authorized',
  })
  async transferOwnership(
    @Param('id', ParseIntPipe) serverId: number,
    @Param('userId') userId: string,
    @Req() req: RequestWithAuth,
  ) {
    const result = await this.serverService.transferOwnership(
      serverId,
      userId,
      req.user.id,
    );
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

  /**
   * Met à jour le rôle d'un membre dans un serveur.
   * Seul le propriétaire du serveur peut modifier les rôles.
   * @param serverId - Identifiant du serveur
   * @param userId - Identifiant du membre dont on change le rôle
   * @param data - Nouveau rôle à attribuer
   * @param req - Requête authentifiée contenant le propriétaire qui effectue l'action
   * @returns Le membre mis à jour ou erreur si non autorisé / introuvable
   */
  @Put('/:id/members/:userId')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ description: 'Member role updated successfully', type: UpdateMemberRole })
  @ApiNotFoundResponse({
    description:
      'This user is not a member of this server or only the owner can change roles',
  })
  async updateMemberRole(
    @Param('id', ParseIntPipe) serverId: number,
    @Param('userId') userId: string,
    @Body() data: UpdateMemberRole,
    @Req() req: RequestWithAuth,
  ) {
    const result = await this.serverService.updateMemberRole(
      serverId,
      userId,
      data.role,
      req.user.id,
    );
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }
}
