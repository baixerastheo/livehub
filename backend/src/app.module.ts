import { Module } from '@nestjs/common';
import { UtilisateurModule } from './utilisateur/utilisateur.module.js';
import { ServerModule } from './server/server.module';
import { ServeurModule } from './serveur/serveur.module';
import { MembreServeurService } from './membre-serveur/membre-serveur.service';
import { MembreServeurController } from './membre-serveur/membre-serveur.controller';
import { MembreServeurModule } from './membre-serveur/membre-serveur.module';
import { CanalModule } from './canal/canal.module';
import { MessageModule } from './message/message.module';
import { InvitationModule } from './invitation/invitation.module';
import { MessagePriveModule } from './message-prive/message-prive.module';


@Module({
  imports: [UtilisateurModule, ServerModule, ServeurModule, MembreServeurModule, CanalModule, MessageModule, InvitationModule, MessagePriveModule],
  providers: [MembreServeurService],
  controllers: [MembreServeurController],
})
export class AppModule {}
