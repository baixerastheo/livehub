import { UserService } from './user.service.js';
import {
  ApiTags,
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
  HttpCode,
  HttpStatus,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UpdateUser } from './dto/update-user.dto.js';
import { CreateUser } from './dto/create-user.dto.js';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'All users retrieved successfully',
  })
  async getAllUsers() {
    return await this.userService.getAllUsers();
  }

  @Get('/email/:email')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Users retrieved successfully',
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

  @Get('/username/:username')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'User retrieved successfully',
  })
  @ApiNotFoundResponse({
    description: 'User with this Username does not exist',
  })
  async GetUserByUsername(@Param('username') username: string) {
    const result = await this.userService.GetUserByUsername(username);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'User retrieved successfully',
  })
  @ApiNotFoundResponse({
    description: 'User with this ID does not exist',
  })
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    const result = await this.userService.getUserById(id);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'User deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'User with this ID does not exist',
  })
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    const result = await this.userService.deleteUser(id);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: CreateUser,
  })
  @ApiConflictResponse({
    description: 'Email or username already exists',
  })
  async createUser(@Body() data: CreateUser) {
    const result = await this.userService.createUser(data);
    if (result.isErr()) {
      throw new ConflictException(result.error);
    }
    return result.value;
  }

  @Put('/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'User updated successfully',
    type: UpdateUser,
  })
  @ApiNotFoundResponse({
    description: 'User with this ID does not exist',
  })
  @ApiConflictResponse({
    description: 'Username already exists',
  })
  async updateUser(
    @Body() data: UpdateUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.userService.updateUser(id, data);
    if (result.isErr()) {
      const msg = result.error;
      if (msg === 'Username already exists') {
        throw new ConflictException(msg);
      }
      throw new NotFoundException(msg);
    }
    return result.value;
  }
}
