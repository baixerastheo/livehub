import { Module } from '@nestjs/common';
import { MessagePriveController } from './message-prive.controller';
import { MessagePriveService } from './message-prive.service';

@Module({
  controllers: [MessagePriveController],
  providers: [MessagePriveService]
})
export class MessagePriveModule {}
