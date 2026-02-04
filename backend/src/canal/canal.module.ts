import { Module } from '@nestjs/common';
import { CanalController } from './canal.controller';
import { CanalService } from './canal.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [CanalController],
  providers: [CanalService, PrismaService],
})
export class CanalModule {}
