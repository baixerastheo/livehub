import { Module } from '@nestjs/common';
import { UtilisateurController } from './utilisateur.controller.js';
import { UtilisateurService } from './utilisateur.service.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  controllers: [UtilisateurController],
  providers: [UtilisateurService, PrismaService]
})
export class UtilisateurModule {}
