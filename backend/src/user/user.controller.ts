import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { UpdateUser } from './dto/update-user.dto';
import { CreateUser } from './dto/create-user.dto';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestWithAuth } from '../lib/request-with-auth';

/**
 * Contrôleur de gestion des utilisateurs.
 * Gère les requêtes liées aux utilisateurs.
 */
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Récupère tous les utilisateurs.
   * @returns Liste de tous les utilisateurs avec avatar et statut de présence
   */
  @Get('/')
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  /**
   * Récupère un utilisateur par email.
   * @param email - L'email de l'utilisateur à rechercher
   * @returns L'utilisateur correspondant
   */
  @Get('/email/:email')
  async getUserByEmail(@Param('email') email: string) {
    return this.userService.getUserByEmail(email);
  }

  /**
   * Récupère un utilisateur par nom.
   * @param name - Le nom de l'utilisateur à rechercher
   * @returns L'utilisateur correspondant avec son avatar
   */
  @Get('/name/:name')
  async getUserByName(@Param('name') name: string) {
    return this.userService.getUserByName(name);
  }

  /**
   * Upload un avatar pour l'utilisateur connecté.
   * @param req - La requête avec l'utilisateur connecté
   * @param file - Le fichier image uploadé (jpeg, png ou webp, max 5MB)
   * @returns Le chemin et l'URL du nouvel avatar
   */
  @Post('me/avatar')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
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
    return this.userService.replaceAvatar(req.user.id, file.buffer, file.mimetype, normalizedExt);
  }

  /**
   * Récupère un utilisateur par ID.
   * @param id - L'ID de l'utilisateur à rechercher
   * @returns L'utilisateur avec avatar et statut de présence
   */
  @Get('/:id')
  async getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  /**
   * Supprime un utilisateur par ID.
   * @param id - L'ID de l'utilisateur à supprimer
   * @returns L'utilisateur supprimé
   */
  @Delete('/:id')
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }

  /**
   * Crée un nouvel utilisateur.
   * @param data - Les données de l'utilisateur à créer
   * @returns L'utilisateur créé
   */
  @Post('/')
  async createUser(@Body() data: CreateUser) {
    return this.userService.createUser(data);
  }

  /**
   * Met à jour un utilisateur par ID.
   * @param data - Les données de l'utilisateur à mettre à jour
   * @param id - L'ID de l'utilisateur à mettre à jour
   * @returns L'utilisateur mis à jour
   */
  @Put('/:id')
  async updateUser(@Body() data: UpdateUser, @Param('id') id: string) {
    return this.userService.updateUser(id, data);
  }
}
