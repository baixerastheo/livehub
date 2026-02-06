import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ok, err } from '../result';
import { CreateCanal } from './dto/create-canal.dto';
import { Role } from '../../generated/prisma/enums';
import { UpdateCanal } from './dto/update-canal.dto';


/**
 * Service de gestion des canaux.
 * Gère la création, la suppression et la mise à jour des canaux.
 */
@Injectable()
export class CanalService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupère un canal par son ID.
   * @param id - Identifiant du canal
   * @returns Le canal ou null si non trouvé
   */
  private async findChannelById(id: number) {
    return this.prisma.canal.findUnique({ 
      where: { id } });
  }

  /**
   * Récupère tous les canaux d'un serveur.
   * @param serverId - Identifiant du serveur
   * @returns Liste des canaux ou erreur si le serveur n'existe pas
   */
  async getAllChannelsByServer(serverId: number) {
    const server = await this.prisma.serveur.findUnique({
      where: { id: serverId },
    });
    if (!server) {
      return err('No server found for ID ' + serverId);
    }
    const channels = await this.prisma.canal.findMany({
      where: { serveurId: serverId },
    });
    return ok(channels ?? []);
  }

  /**
   * Crée un nouveau canal dans un serveur.
   * Seuls les propriétaires et administrateurs peuvent créer des canaux.
   * @param serverId - Identifiant du serveur
   * @param userId - Identifiant de l'utilisateur créateur
   * @param data - Données du canal à créer
   * @returns Le canal créé ou erreur si non autorisé
   */
  async createChannel(serverId: number, userId: string, data: CreateCanal) {
    const server = await this.prisma.serveur.findUnique({
      where: { id: serverId },
    });
    if (!server) {
      return err('No server found for ID ' + serverId);
    }

    const member = await this.prisma.membreServeur.findUnique({
      where: {
        userId_serveurId: {
          userId,
          serveurId: serverId,
        },
      },
    });

    if (!member) {
      return err('You are not a member of this server');
    }

    if (member.role !== Role.PROPRIETAIRE && member.role !== Role.ADMINISTRATEUR) {
      return err('Only owners and administrators can create channels');
    }

    const canal = await this.prisma.canal.create({
      data: {
        nom: data.name,
        serveurId: serverId,
      },
    });
    return ok(canal);
  }

  /**
   * Récupère les détails d'un canal spécifique.
   * @param id - Identifiant du canal
   * @returns Le canal ou erreur si non trouvé
   */
  async getChannelDetails(id: number) {
    const channel = await this.findChannelById(id);
    if (!channel) {
      return err('No channel found for ID ' + id);
    }
    return ok(channel);
  }

  /**
   * Supprime un canal.
   * @param id - Identifiant du canal à supprimer
   * @returns Le canal supprimé ou erreur si non trouvé
   */
  async deleteChannel(id: number) {
    const channel = await this.findChannelById(id);
    if (!channel) {
      return err('No channel found for ID ' + id);
    }
    const deletedChannel = await this.prisma.canal.delete({
      where: { id },
    });
    return ok(deletedChannel);
  }

  /**
   * Met à jour un canal.
   * @param id - Identifiant du canal à mettre à jour
   * @param data - Nouvelles données du canal
   * @returns Le canal mis à jour ou erreur si non trouvé
   */
  async updateChannel(id: number, data: UpdateCanal) {
    const channel = await this.findChannelById(id);
    if (!channel) {
      return err('No channel found for ID ' + id);
    }

    const updatedCanal = await this.prisma.canal.update({
      where: { id },
      data: {
        nom: data.name,
      },
    });
    return ok(updatedCanal);
  }
}
