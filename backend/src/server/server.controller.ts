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
import { AuthGuard } from '../auth/auth.guard';
import type { RequestWithAuth } from '../lib/request-with-auth';

@Controller('servers')
export class ServerController {
  constructor(private readonly serverService: ServerService) {}

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

  @Get('/')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: "User's servers retrieved successfully",
  })
  async getUserServers(@Req() req: RequestWithAuth) {
    return this.serverService.getUserServers(req.user.id);
  }

  @Get('/:id')
  @ApiOkResponse({
    description: 'Server retrieved successfully',
  })
  @ApiNotFoundResponse({
    description: 'Server with this ID does not exist',
  })
  async getServerById(@Param('id', ParseIntPipe) id: number) {
    const result = await this.serverService.getServerById(id);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

  @Put('/:id')
  @ApiOkResponse({
    description: 'Server updated successfully',
    type: UpdateServer,
  })
  @ApiNotFoundResponse({
    description: 'Server with this ID does not exist',
  })
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

  @Delete('/:id')
  @ApiOkResponse({
    description: 'Server deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Server with this ID does not exist',
  })
  async deleteServer(@Param('id', ParseIntPipe) id: number) {
    const result = await this.serverService.deleteServer(id);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

  @Post('/:id/join')
  @UseGuards(AuthGuard)
  @ApiCreatedResponse({
    description: 'You have successfully joined the server',
  })
  @ApiNotFoundResponse({
    description: 'Server with this ID does not exist',
  })
  @ApiConflictResponse({
    description: 'You are already a member of this server',
  })
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

  @Delete('/:id/leave')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'You have successfully left the server',
  })
  @ApiNotFoundResponse({
    description: 'You are not a member of this server',
  })
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

  @Get('/:id/members')
  @ApiOkResponse({
    description: 'Server members retrieved successfully',
  })
  @ApiNotFoundResponse({
    description: 'Server with this ID does not exist',
  })
  async getServerMembers(@Param('id', ParseIntPipe) serverId: number) {
    const result = await this.serverService.getServerMembers(serverId);
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }

  @Put('/:id/members/:userId')
  @ApiOkResponse({
    description: 'Member role updated successfully',
    type: UpdateMemberRole,
  })
  @ApiNotFoundResponse({
    description: 'This user is not a member of this server',
  })
  async updateMemberRole(
    @Param('id', ParseIntPipe) serverId: number,
    @Param('userId') userId: string,
    @Body() data: UpdateMemberRole,
  ) {
    const result = await this.serverService.updateMemberRole(
      serverId,
      userId,
      data.role,
    );
    if (result.isErr()) {
      throw new NotFoundException(result.error);
    }
    return result.value;
  }
}
