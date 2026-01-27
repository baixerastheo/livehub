import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CreateServer } from './dto/create-server.dto.js';
import { UpdateServer } from './dto/update-server.dto.js';
import { Role } from '../../generated/prisma/enums.js';

@Injectable()
export class ServerService {
    constructor(private readonly prisma: PrismaService) {}

    async getAllServers() {
        return await this.prisma.serveur.findMany()
    }

    async getServerById(id: number) {
        const server = await this.prisma.serveur.findUnique({
            where: { id },
            include: {
                membres: {
                    include: {
                        utilisateur: true
                    }
                },
                canaux: true
            }
        });
        if (!server) {
            throw new NotFoundException("Server with this ID does not exist!");
        }
        return server;
    }

    async createServer(data: CreateServer, creatorId: number) {
        if (!data) {
            throw new NotFoundException("Server data is required!");
        }

        const server = await this.prisma.serveur.create({
            data: {
                nom: data.name
            }
        });

        await this.prisma.membreServeur.create({
            data: {
                serveurId: server.id,
                utilisateurId: creatorId,
                role: Role.PROPRIETAIRE
            }
        });
        return this.getServerById(server.id);
    }

    async updateServer(id: number, data: UpdateServer) {
        if (!data) {
            throw new NotFoundException("Server data is required!");
        }

        const server = await this.prisma.serveur.findUnique({
            where: { id }
        });
        if (!server) {
            throw new NotFoundException("Server with this ID does not exist, it cannot be updated!");
        }

        const updateData: any = {};
        if (data.name !== undefined) updateData.nom = data.name;

        return await this.prisma.serveur.update({
            where: { id },
            data: updateData
        });
    }

    async deleteServer(id: number) {
        const server = await this.prisma.serveur.findUnique({
            where: { id }
        });
        if (!server) {
            throw new NotFoundException("Server with this ID does not exist, it cannot be deleted!");
        }
        return await this.prisma.serveur.delete({
            where: { id }
        });
    }

    async getUserServers(userId: number) {
        const members = await this.prisma.membreServeur.findMany({
            where: { utilisateurId: userId },
            include: {
                serveur: {
                    include: {
                        membres: {
                            include: {
                                utilisateur: true
                            }
                        },
                        canaux: true
                    }
                }
            }
        });
        return members.map(m => m.serveur);
    }

    async joinServer(serverId: number, userId: number) {
        const server = await this.prisma.serveur.findUnique({
            where: { id: serverId }
        });
        if (!server) {
            throw new NotFoundException("Server with this ID does not exist!");
        }

        const member = await this.prisma.membreServeur.findUnique({
            where: {
                utilisateurId_serveurId: {
                    utilisateurId: userId,
                    serveurId: serverId
                }
            }
        });
        if (member) {
            throw new ConflictException("You are already a member of this server!");
        }

        return await this.prisma.membreServeur.create({
            data: {
                serveurId: serverId,
                utilisateurId: userId,
                role: Role.MEMBRE
            },
            include: {
                serveur: true,
                utilisateur: true
            }
        });
    }

    async leaveServer(serverId: number, userId: number) {
        const member = await this.prisma.membreServeur.findUnique({
            where: {
                utilisateurId_serveurId: {
                    utilisateurId: userId,
                    serveurId: serverId
                }
            }
        });
        if (!member) {
            throw new NotFoundException("You are not a member of this server!");
        }

        // a faire : gerer le cas ou le proprio part

        return await this.prisma.membreServeur.delete({
            where: {
                id: member.id
            }
        });
    }

    async getServerMembers(serverId: number) {
        const server = await this.prisma.serveur.findUnique({
            where: { id: serverId }
        });
        if (!server) {
            throw new NotFoundException("Server with this ID does not exist!");
        }

        return await this.prisma.membreServeur.findMany({
            where: { serveurId: serverId },
            include: {
                utilisateur: true
            }
        });
    }

    async updateMemberRole(serverId: number, userId: number, newRole: Role) {
        const member = await this.prisma.membreServeur.findUnique({
            where: {
                utilisateurId_serveurId: {
                    utilisateurId: userId,
                    serveurId: serverId
                }
            }
        });
        if (!member) {
            throw new NotFoundException("This user is not a member of this server!");
        }

        return await this.prisma.membreServeur.update({
            where: {
                id: member.id
            },
            data: {
                role: newRole
            },
            include: {
                utilisateur: true,
                serveur: true
            }
        });
    }
}
