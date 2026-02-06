import { UserService } from './user.service';
import {ApiCreatedResponse,ApiOkResponse,ApiNotFoundResponse,ApiConflictResponse,ApiBody,ApiConsumes} from '@nestjs/swagger';
import {Body,Controller,Delete,Get,Param,Post,Put,Req,UseGuards,UseInterceptors,UploadedFile,ParseFilePipe,FileTypeValidator,MaxFileSizeValidator,Logger,NotFoundException,ConflictException,InternalServerErrorException,} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateUser } from './dto/update-user.dto';
import { CreateUser } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestWithAuth } from '../lib/request-with-auth';




/**
 * Contrôleur de gestion des utilisateurs.
 * Gère les requêtes liées aux utilisateurs.
 */
@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}


  /**
   * Récupère tous les utilisateurs.
   * @returns Tous les utilisateurs.
   */
  @Get('/')
  @ApiOkResponse({
    description: 'All users retrieved successfully',
    type: [UserResponseDto],
  })
  async getAllUsers() {
    return await this.userService.getAllUsers();
  }


  /**
   * Récupère un utilisateur par email.
   * @param email - L'email de l'utilisateur à rechercher.
   * @returns L'utilisateur.
   */
  @Get('/email/:email')
  @ApiOkResponse({
    description: 'Users retrieved successfully',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User with this Email does not exist',
  })
  async getUserByEmail(@Param('email') email: string) {
    const result = await this.userService.getUserByEmail(email);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }


  /**
   * Récupère un utilisateur par nom.
   * @param name - Le nom de l'utilisateur à rechercher.
   * @returns L'utilisateur.
   */
  @Get('/name/:name')
  @ApiOkResponse({
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User with this name does not exist',
  })
  async getUserByName(@Param('name') name: string) {
    const result = await this.userService.getUserByName(name);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }


  /**
   * Upload un avatar pour l'utilisateur connecté.
   * @param req - La requête avec l'utilisateur connecté.
   * @param file - Le fichier uploadé.
   * @returns Le chemin et l'URL de l'avatar.
   */
  @Post('me/avatar')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({ description: 'Avatar uploaded successfully' })
  async uploadAvatar(
    @Req() req: RequestWithAuth,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB max
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
    const userId = req.user.id;
    const ext =
      file.originalname.split('.').pop()?.toLowerCase() ?? 'jpg';
    const normalizedExt = ext === 'jpeg' ? 'jpg' : ext;

    const result = await this.userService.replaceAvatar(
      userId,
      file.buffer,
      file.mimetype,
      normalizedExt,
    );

    if (result.isErr()) {
      const message = String(result.error);
      this.logger.error('Avatar upload failed', message);
      throw new InternalServerErrorException(message);
    }
    return result.value;
  }



  /**
   * Récupère un utilisateur par ID.
   * @param id - L'ID de l'utilisateur à rechercher.
   * @returns L'utilisateur.
   */
  @Get('/:id')
  @ApiOkResponse({
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User with this ID does not exist',
  })
  async getUserById(@Param('id') id: string) {
    const result = await this.userService.getUserById(id);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }



  /**
   * Supprime un utilisateur par ID.
   * @param id - L'ID de l'utilisateur à supprimer.
   * @returns L'utilisateur supprimé.
   */
  @Delete('/:id')
  @ApiOkResponse({
    description: 'User deleted successfully',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User with this ID does not exist',
  })
  async deleteUser(@Param('id') id: string) {
    const result = await this.userService.deleteUser(id);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }


  /**
   * Crée un nouvel utilisateur.
   * @param data - Les données de l'utilisateur à créer.
   * @returns L'utilisateur créé.
   */
  @Post('/')
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiConflictResponse({
    description: 'Email or name already exists',
  })
  async createUser(@Body() data: CreateUser) {
    const result = await this.userService.createUser(data);
    if (result.isErr()) {
      throw new ConflictException(result.error);
    }
    return result.value;
  }



  /**
   * Met à jour un utilisateur par ID.
   * @param data - Les données de l'utilisateur à mettre à jour.
   * @param id - L'ID de l'utilisateur à mettre à jour.
   * @returns L'utilisateur mis à jour.
   */
  @Put('/:id')
  @ApiOkResponse({
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User with this ID does not exist',
  })
  @ApiConflictResponse({
    description: 'Name already exists',
  })
  async updateUser(@Body() data: UpdateUser, @Param('id') id: string) {
    const result = await this.userService.updateUser(id, data);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }
}
