import {Body,Controller,Delete,Get,Param,ParseIntPipe,Patch,Post,Put,Req,UploadedFile,UseGuards,UseInterceptors,ParseFilePipe,FileTypeValidator,MaxFileSizeValidator} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ServerService } from './server.service';
import { ServerMemberService } from './server-member.service';
import { ServerBanService } from './server-ban.service';
import { UpdateServer } from './dto/update-server.dto';
import { UpdateMemberRole } from './dto/update-member-role.dto';
import { CreateServer } from './dto/create-server.dto';
import { AddMember } from './dto/add-member.dto';
import { BanMember } from './dto/ban-member.dto';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestWithAuth } from '../lib/request-with-auth';

/**
 * Contrôleur de gestion des serveurs.
 * Gère les requêtes liées aux serveurs et à leurs membres.
 */
@Controller('servers')
@UseGuards(AuthGuard)
export class ServerController {
  constructor(
    private readonly serverService: ServerService,
    private readonly serverMemberService: ServerMemberService,
    private readonly serverBanService: ServerBanService,
  ) {}


  /**
   * Crée un nouveau serveur avec l'utilisateur connecté comme propriétaire.
   * @param data - Données du serveur à créer
   * @param req - Requête authentifiée contenant le créateur
   * @returns Le serveur créé
   */
  @Post('/')
  async createServer(@Body() data: CreateServer, @Req() req: RequestWithAuth) {
    return this.serverService.createServer(data, req.user.id);
  }

  /**
   * Récupère tous les serveurs auxquels appartient l'utilisateur connecté.
   * @param req - Requête authentifiée contenant l'utilisateur courant
   * @returns Liste des appartenances avec les informations de chaque serveur
   */
  @Get('/')
  async getUserServers(@Req() req: RequestWithAuth) {
    return this.serverService.getUserServers(req.user.id);
  }

  /**
   * Récupère un serveur par son identifiant.
   * @param id - Identifiant du serveur
   * @returns Le serveur ou 404 s'il n'existe pas
   */
  @Get('/:id')
  async getServerById(@Param('id', ParseIntPipe) id: number) {
    return this.serverService.getServerById(id);
  }

  /**
   * Met à jour les informations d'un serveur.
   * @param data - Nouvelles données du serveur
   * @param id - Identifiant du serveur à modifier
   * @returns Le serveur mis à jour
   */
  @Put('/:id')
  async updateServer(@Body() data: UpdateServer,@Param('id', ParseIntPipe) id: number) {
    return this.serverService.updateServer(id, data);
  }

  /**
   * Supprime un serveur.
   * @param id - Identifiant du serveur à supprimer
   * @returns Le serveur supprimé
   */
  @Delete('/:id')
  async deleteServer(@Param('id', ParseIntPipe) id: number) {
    return this.serverService.deleteServer(id);
  }

  /**
   * Remplace l'avatar d'un serveur (propriétaire uniquement).
   * @param serverId - Identifiant du serveur
   * @param req - Requête authentifiée contenant le propriétaire
   * @param file - Fichier image uploadé (jpeg, png ou webp, max 5 Mo)
   * @returns Le nouveau path et l'URL publique de l'avatar
   */
  @Patch('/:id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadServerAvatar(
    @Param('id', ParseIntPipe) serverId: number,
    @Req() req: RequestWithAuth,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
      size: number;
    },
  ) {
    const ext = file.originalname.split('.').pop()?.toLowerCase() ?? 'jpg';
    const normalizedExt = ext === 'jpeg' ? 'jpg' : ext;
    return this.serverService.replaceServerAvatar(
      serverId,
      req.user.id,
      file.buffer,
      file.mimetype,
      normalizedExt,
    );
  }

  /**
   * Permet à l'utilisateur connecté de rejoindre un serveur.
   * @param serverId - Identifiant du serveur à rejoindre
   * @param req - Requête authentifiée contenant l'utilisateur courant
   * @returns Le nouveau membre
   */
  @Post('/:id/join')
  async joinServer(@Param('id', ParseIntPipe) serverId: number,@Req() req: RequestWithAuth) {
    return this.serverMemberService.joinServer(serverId, req.user.id);
  }

  /**
   * Ajoute un utilisateur à un serveur (action réservée aux admins/proprio).
   * @param serverId - Identifiant du serveur cible
   * @param data - Données contenant l'identifiant de l'utilisateur à ajouter
   * @param req - Requête authentifiée contenant l'utilisateur qui effectue l'action
   * @returns Le nouveau membre
   */
  @Post('/:id/members')
  async addMember(@Param('id', ParseIntPipe) serverId: number,@Body() data: AddMember,@Req() req: RequestWithAuth) {
    return this.serverMemberService.addMember(serverId, req.user.id, data);
  }

  /**
   * Permet à l'utilisateur connecté de quitter un serveur.
   * @param serverId - Identifiant du serveur à quitter
   * @param req - Requête authentifiée contenant l'utilisateur courant
   * @returns Le membre supprimé
   */
  @Delete('/:id/leave')
  async leaveServer(@Param('id', ParseIntPipe) serverId: number,@Req() req: RequestWithAuth) {
    return this.serverMemberService.leaveServer(serverId, req.user.id);
  }

  /**
   * Récupère tous les membres d'un serveur avec leur statut de présence.
   * @param serverId - Identifiant du serveur
   * @returns Liste des membres avec leurs infos utilisateur
   */
  @Get('/:id/members')
  async getServerMembers(@Param('id', ParseIntPipe) serverId: number) {
    return this.serverMemberService.getServerMembers(serverId);
  }

  /**
   * Transfère la propriété du serveur à un autre membre.
   * @param serverId - Identifiant du serveur
   * @param userId - Identifiant du futur propriétaire
   * @param req - Requête authentifiée contenant l'actuel propriétaire
   * @returns Les identifiants du nouveau et de l'ancien propriétaire
   */
  @Post('/:id/transfer-ownership/:userId')
  async transferOwnership(@Param('id', ParseIntPipe) serverId: number,@Param('userId') userId: string,@Req() req: RequestWithAuth) {
    return this.serverMemberService.transferOwnership(serverId, userId, req.user.id);
  }

  /**
   * Met à jour le rôle d'un membre dans un serveur.
   * Seul le propriétaire du serveur peut modifier les rôles.
   * @param serverId - Identifiant du serveur
   * @param userId - Identifiant du membre dont on change le rôle
   * @param data - Nouveau rôle à attribuer
   * @param req - Requête authentifiée contenant le propriétaire qui effectue l'action
   * @returns Le membre mis à jour
   */
  @Put('/:id/members/:userId')
  async updateMemberRole(@Param('id', ParseIntPipe) serverId: number,@Param('userId') userId: string,@Body() data: UpdateMemberRole,@Req() req: RequestWithAuth) {
    return this.serverMemberService.updateMemberRole(serverId, userId, data.role, req.user.id);
  }

  /**
   * Expulse un membre du serveur sans le bannir.
   * @param serverId - Identifiant du serveur
   * @param userId - Identifiant du membre à expulser
   * @param req - Requête authentifiée contenant l'admin/proprio qui effectue l'action
   */
  @Delete('/:id/members/:userId')
  async kickMember(@Param('id', ParseIntPipe) serverId: number,@Param('userId') userId: string,@Req() req: RequestWithAuth) {
    return this.serverBanService.kickMember(serverId, req.user.id, userId);
  }

  /**
   * Bannit un membre du serveur.
   * @param serverId - Identifiant du serveur
   * @param data - Données du ban (userId cible, raison, expiration)
   * @param req - Requête authentifiée contenant l'admin/proprio qui effectue l'action
   * @returns Le ban créé
   */
  @Post('/:id/bans')
  async banMember(@Param('id', ParseIntPipe) serverId: number,@Body() data: BanMember,@Req() req: RequestWithAuth) {
    return this.serverBanService.banMember(serverId, req.user.id, data);
  }

  /**
   * Lève le ban d'un utilisateur sur le serveur.
   * @param serverId - Identifiant du serveur
   * @param userId - Identifiant de l'utilisateur à débannir
   * @param req - Requête authentifiée contenant l'admin/proprio qui effectue l'action
   * @returns Le ban supprimé
   */
  @Delete('/:id/bans/:userId')
  async unbanMember(@Param('id', ParseIntPipe) serverId: number,@Param('userId') userId: string,@Req() req: RequestWithAuth) {
    return this.serverBanService.unbanMember(serverId, req.user.id, userId);
  }

  /**
   * Récupère la liste des bans actifs d'un serveur.
   * @param serverId - Identifiant du serveur
   * @param req - Requête authentifiée contenant l'admin/proprio qui effectue la requête
   * @returns Liste des bans avec les infos des utilisateurs bannis
   */
  @Get('/:id/bans')
  async getBans(@Param('id', ParseIntPipe) serverId: number,@Req() req: RequestWithAuth) {
    return this.serverBanService.getBans(serverId, req.user.id);
  }
}
