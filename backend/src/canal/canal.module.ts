import { Module } from '@nestjs/common';
import { CanalController } from './canal.controller';
import { CanalService } from './canal.service';

@Module({
  controllers: [CanalController],
  providers: [CanalService]
})
export class CanalModule {}
