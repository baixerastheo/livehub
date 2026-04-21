import { Module } from '@nestjs/common';
import { CanalController } from './canal.controller';
import { CanalService } from './canal.service';
import { RealtimeModule } from '../realtime/realtime.module.js';

@Module({
  imports: [RealtimeModule],
  controllers: [CanalController],
  providers: [CanalService],
})
export class CanalModule {}
