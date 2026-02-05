import { Module } from '@nestjs/common';
import { MessageGateway } from './message.gateway.js';

@Module({
  providers: [MessageGateway],
  exports: [MessageGateway],
})
export class RealtimeModule {}
