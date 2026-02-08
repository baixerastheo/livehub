import { Module } from '@nestjs/common';
import { CanalController } from './canal.controller';
import { CanalService } from './canal.service';
import { PrismaService } from '../prisma.service';
import { RealtimeModule } from '../realtime/realtime.module.js';

@Module({
  imports: [RealtimeModule],
  controllers: [CanalController],
  providers: [CanalService, PrismaService],
})
export class CanalModule {}
