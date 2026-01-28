import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CreateServer } from './dto/create-server.dto.js';
import { UpdateServer } from './dto/update-server.dto.js';
import { Role } from '../../generated/prisma/enums.js';
import { Result, ok, err } from '../result.js';


@Injectable()
export class ServerService {
    constructor(private readonly prisma: PrismaService) {}

    async getAllServers() {
        return await this.prisma.serveur.findMany()
    }

    async getServerById(id: number): Promise<Result<any, string>> {
        const server = await this.prisma.serveur.findUnique({
            where: { id }
        });
        if (!server) {
            return err(`Server with ID ${id} not found`);
        }
        return ok(server);
    }

    async createServer(data: CreateServer, creatorId: number): Promise<Result<any, string>> {
        try {

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
            
            return ok(server);
        } catch (error: any) {
            if (error?.code === 'P2002') {
                return err('Unique constraint violation');
            }
            throw error;
        }
    }

    async updateServer(id: number, data: UpdateServer): Promise<Result<any, string>> {
        try {
            const server = await this.prisma.serveur.findUnique({
                where: { id }
            });
            if (!server) {
                return err('Server with ID '+ id +' not found');
            }
            const updatedServer = await this.prisma.serveur.update({
                where: { id },
                data:{
                    nom: data.name
                }
            });
            return ok(updatedServer);
        } catch (error: any) {
            if (error?.code === 'P2002') {
                return err('Unique constraint violation');
            }
            throw error; 
        }
    }

    async deleteServer(id: number): Promise<Result<any, string>> {
        const server = await this.prisma.serveur.findUnique({
            where: { id }
        });
        if (!server) {
            return err(`Server with ID ${id} not found`);
        }
        const deletedServer = await this.prisma.serveur.delete({
            where: { id }
        });
        return ok(deletedServer);
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

    async joinServer(serverId: number, userId: number): Promise<Result<any, string>> {
        try {
            const server = await this.prisma.serveur.findUnique({
                where: { id: serverId }
            });
            if (!server) {
                return err(`Server with ID ${serverId} not found`);
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
                return err('You are already a member of this server');
            }

            const newMember = await this.prisma.membreServeur.create({
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
            return ok(newMember);
        } catch (error) {
            if (error.code === 'P2002') {
                return err('Unique constraint violation');
            }
            throw error; 
        }
    }

    async leaveServer(serverId: number, userId: number): Promise<Result<any, string>> {
        const member = await this.prisma.membreServeur.findUnique({
            where: {
                utilisateurId_serveurId: {
                    utilisateurId: userId,
                    serveurId: serverId
                }
            }
        });
        if (!member) {
            return err('You are not a member of this server');
        }

        // a faire : gerer le cas ou le proprio part

        const deletedMember = await this.prisma.membreServeur.delete({
            where: {
                id: member.id
            }
        });
        return ok(deletedMember);
    }

    async getServerMembers(serverId: number): Promise<Result<any[], string>> {
        const server = await this.prisma.serveur.findUnique({
            where: { id: serverId }
        });
        if (!server) {
            return err(`Server with ID ${serverId} not found`);
        }

        const members = await this.prisma.membreServeur.findMany({
            where: { serveurId: serverId },
            include: {
                utilisateur: true
            }
        });
        return ok(members);
    }

    async updateMemberRole(serverId: number, userId: number, newRole: Role): Promise<Result<any, string>> {
        const member = await this.prisma.membreServeur.findUnique({
            where: {
                utilisateurId_serveurId: {
                    utilisateurId: userId,
                    serveurId: serverId
                }
            }
        });
        if (!member) {
            return err('This user is not a member of this server');
        }

        const updatedMember = await this.prisma.membreServeur.update({
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
        return ok(updatedMember);
    }
}
