import {Injectable,NotFoundException,ForbiddenException} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MessageGateway } from '../realtime/message.gateway.js';
import { CreateCanal } from './dto/create-canal.dto';
import { Role } from '../../generated/prisma/enums';
import { UpdateCanal } from './dto/update-canal.dto';

/**
 * Service de gestion des canaux.
 * Gère la création, la récupération, la mise à jour et la suppression des canaux.
 */
@Injectable()
export class CanalService {
  constructor(private readonly prisma: PrismaService, private readonly messageGateway: MessageGateway) {}

  /**
   * Récupère un canal par son ID.
   * @param id - Identifiant du canal
   * @returns Le canal correspondant
   * @throws NotFoundException si le canal n'existe pas
   */
  async getChannelById(id: number) {
    const channel = await this.prisma.canal.findUnique({
      where: { id },
    });

    if (!channel) {
      throw new NotFoundException('Channel ' + id + ' not found');
    }
    return channel;
  }

  /**
   * Vérifie qu'un serveur existe, lève une exception sinon.
   * @param serverId - Identifiant du serveur
   * @returns Le serveur correspondant
   * @throws NotFoundException si le serveur n'existe pas
   */
  private async assertServerExists(serverId: number) {
    const server = await this.prisma.serveur.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException('Server ' + serverId + ' not found');
    }
    return server;
  }

  /**
   * Récupère un membre du serveur.
   * @param serverId - Identifiant du serveur
   * @param userId - Identifiant de l'utilisateur
   * @returns Le membre correspondant
   * @throws ForbiddenException si l'utilisateur n'est pas membre du serveur
   */
  private async getServerMember(serverId: number, userId: string) {
    const member = await this.prisma.membreServeur.findUnique({
      where: {
        userId_serveurId: {
          userId,
          serveurId: serverId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this server');
    }
    return member;
  }

  /**
   * Vérifie que le membre possède un rôle administrateur ou propriétaire.
   * @param role - Rôle du membre à vérifier
   * @throws ForbiddenException si le rôle est insuffisant
   */
  private assertAdminRole(role: Role) {
    if (role !== Role.PROPRIETAIRE && role !== Role.ADMINISTRATEUR) {
      throw new ForbiddenException('Only owners and administrators can perform this action');
    }
  }

  /**
   * Récupère tous les canaux d'un serveur, triés par ID croissant.
   * @param serverId - Identifiant du serveur
   * @returns Liste des canaux du serveur
   * @throws NotFoundException si le serveur n'existe pas
   */
  async getAllChannelsByServer(serverId: number) {
    await this.assertServerExists(serverId);

    return this.prisma.canal.findMany({
      where: { serveurId: serverId },
      orderBy: { id: 'asc' },
    });
  }

  /**
   * Crée un nouveau canal dans un serveur.
   * Réservé aux propriétaires et administrateurs.
   * @param serverId - Identifiant du serveur cible
   * @param userId - Identifiant de l'utilisateur créateur
   * @param data - Données du canal à créer
   * @returns Le canal créé
   * @throws NotFoundException si le serveur n'existe pas
   * @throws ForbiddenException si l'utilisateur n'est pas admin/propriétaire
   */
  async createChannel(serverId: number, userId: string, data: CreateCanal) {
    await this.assertServerExists(serverId);

    const member = await this.getServerMember(serverId, userId);
    this.assertAdminRole(member.role);

    const canal = await this.prisma.canal.create({
      data: {
        nom: data.name,
        serveurId: serverId,
      },
    });

    this.messageGateway.emitServerChannelCreated(serverId, {
      id: canal.id,
      serverId: canal.serveurId,
      name: canal.nom,
      createdAtIso: canal.creeLe.toISOString(),
      updatedAtIso: canal.modifieLe.toISOString(),
    });

    return canal;
  }

  /**
   * Supprime un canal.
   * Réservé aux propriétaires et administrateurs du serveur.
   * @param id - Identifiant du canal à supprimer
   * @param userId - Identifiant de l'utilisateur demandant la suppression
   * @returns Le canal supprimé
   * @throws NotFoundException si le canal n'existe pas
   * @throws ForbiddenException si l'utilisateur n'est pas admin/propriétaire
   */
  async deleteChannel(id: number, userId: string) {

    const channel = await this.getChannelById(id);
    const member = await this.getServerMember(channel.serveurId, userId);
    this.assertAdminRole(member.role);

    const deletedChannel = await this.prisma.canal.delete({
      where: { id },
    });

    this.messageGateway.emitServerChannelDeleted(channel.serveurId, id);
    return deletedChannel;
  }

  /**
   * Met à jour le nom d'un canal.
   * Réservé aux propriétaires et administrateurs du serveur.
   * @param id - Identifiant du canal à mettre à jour
   * @param userId - Identifiant de l'utilisateur demandant la mise à jour
   * @param data - Nouvelles données du canal
   * @returns Le canal mis à jour
   * @throws NotFoundException si le canal n'existe pas
   * @throws ForbiddenException si l'utilisateur n'est pas admin/propriétaire
   */
  async updateChannel(id: number, userId: string, data: UpdateCanal) {

    const channel = await this.getChannelById(id);
    const member = await this.getServerMember(channel.serveurId, userId);
    this.assertAdminRole(member.role);

    const updatedCanal = await this.prisma.canal.update({
      where: { id },
      data: {
        nom: data.name,
      },
    });

    this.messageGateway.emitServerChannelUpdated(channel.serveurId, {
      id: updatedCanal.id,
      serverId: updatedCanal.serveurId,
      name: updatedCanal.nom,
      createdAtIso: updatedCanal.creeLe.toISOString(),
      updatedAtIso: updatedCanal.modifieLe.toISOString(),
    });

    return updatedCanal;
  }
}
