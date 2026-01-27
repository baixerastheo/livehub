import { Module } from '@nestjs/common';
import { ServeurController } from './serveur.controller';
import { ServeurService } from './serveur.service';

@Module({
  controllers: [ServeurController],
  providers: [ServeurService]
})
export class ServeurModule {}
