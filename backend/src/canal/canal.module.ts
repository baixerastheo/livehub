import { Module } from '@nestjs/common';
import { CanalController } from './canal.controller.js';
import { CanalService } from './canal.service.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  controllers: [CanalController],
  providers: [CanalService, PrismaService],
})
export class CanalModule {}
