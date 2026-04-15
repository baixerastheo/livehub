import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Role } from '../../generated/prisma/enums';

/**
 * Service utilitaire partagé entre les services du module serveur.
 */
@Injectable()
export class ServerUtilsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupère un serveur par son ID ou lève une exception s'il n'existe pas.
   * @param id - Identifiant du serveur
   * @returns Le serveur correspondant
   * @throws NotFoundException si le serveur n'existe pas
   */
  async assertServerExists(id: number) {
    const server = await this.prisma.serveur.findUnique({ where: { id } });
    if (!server) {
      throw new NotFoundException('Server with ID ' + id + ' not found');
    }
    return server;
  }

  /**
   * Récupère un membre d'un serveur ou lève une exception s'il n'existe pas.
   * @param userId - Identifiant de l'utilisateur
   * @param serverId - Identifiant du serveur
   * @returns Le membre correspondant
   * @throws ForbiddenException si l'utilisateur n'est pas membre
   */
  async assertServerMember(userId: string, serverId: number) {
    const member = await this.prisma.membreServeur.findUnique({
      where: { userId_serveurId: { userId, serveurId: serverId } },
    });
    if (!member) {
      throw new ForbiddenException('You are not a member of this server');
    }
    return member;
  }

  /**
   * Vérifie que le membre est propriétaire ou administrateur.
   * @param role - Rôle du membre
   * @throws ForbiddenException si le rôle est insuffisant
   */
  assertAdminRole(role: Role) {
    if (role !== Role.PROPRIETAIRE && role !== Role.ADMINISTRATEUR) {
      throw new ForbiddenException(
        'Only owners and administrators can perform this action',
      );
    }
  }
}
