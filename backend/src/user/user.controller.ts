import { UserService } from './user.service.js';
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
  Post,
  Put,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UpdateUser } from './dto/update-user.dto.js';
import { CreateUser } from './dto/create-user.dto.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/')
  @ApiOkResponse({
    description: 'All users retrieved successfully',
  })
  async getAllUsers() {
    return await this.userService.getAllUsers();
  }

  @Get('/email/:email')
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

  @Get('/name/:name')
  @ApiOkResponse({
    description: 'User retrieved successfully',
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

  @Get('/:id')
  @ApiOkResponse({
    description: 'User retrieved successfully',
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
    type: CreateUser,
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
    type: UpdateUser,
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
