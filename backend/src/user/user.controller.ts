import { UserService } from './user.service';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
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
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateUser } from './dto/update-user.dto';
import { CreateUser } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestWithAuth } from '../lib/request-with-auth';
import {
  isAllowedAvatarMimeType,
  ALLOWED_AVATAR_MIME_TYPES,
} from '../supabase/supabase-storage.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/')
  @ApiOkResponse({
    description: 'All users retrieved successfully',
    type: [UserResponseDto],
  })
  async getAllUsers() {
    return await this.userService.getAllUsers();
  }

  @Get('/email/:email')
  @ApiOkResponse({
    description: 'Users retrieved successfully',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User with this Email does not exist',
  })
  async GetUserByEmail(@Param('email') email: string) {
    const result = await this.userService.GetUserByEmail(email);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

  @Get('/name/:name')
  @ApiOkResponse({
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User with this name does not exist',
  })
  async GetUserByName(@Param('name') name: string) {
    const result = await this.userService.GetUserByName(name);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

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
    @Req()
    req: RequestWithAuth & {
      file?: { buffer: Buffer; mimetype: string; originalname?: string };
    },
  ) {
    const file = req.file;
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!isAllowedAvatarMimeType(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${ALLOWED_AVATAR_MIME_TYPES.join(', ')}`,
      );
    }

    const userId = req.user.id;
    const ext = file.originalname?.split('.').pop()?.toLowerCase() ?? 'jpg';
    if (!['jpeg', 'jpg', 'png', 'webp'].includes(ext)) {
      throw new BadRequestException(
        'Invalid file extension. Use jpeg, png or webp.',
      );
    }

    const result = await this.userService.replaceAvatar({
      userId,
      buffer: file.buffer,
      contentType: file.mimetype,
      ext: ext === 'jpeg' ? 'jpg' : ext,
    });

    if (result.isErr()) {
      const message = String(result.error);
      if (message.includes('not found')) {
        throw new NotFoundException(result.error);
      }
      throw new InternalServerErrorException(result.error);
    }
    return result.value;
  }

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
