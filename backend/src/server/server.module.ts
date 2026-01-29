import { Module } from '@nestjs/common';
import { ServerController } from './server.controller.js';
import { ServerService } from './server.service.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  controllers: [ServerController],
  providers: [ServerService, PrismaService],
})
export class ServerModule {}
