import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { NotFoundException } from '@nestjs/common';
import { CreateUser } from './dto/create-user.dto.js';
import { UpdateUser } from './dto/update-user.dto.js';

@Injectable()
export class UtilisateurService {
    constructor(private readonly prisma: PrismaService) {}

    async GetAllUtilisateurs(){
        return this.prisma.utilisateur.findMany()
    }

    async GetUtilisateurById(id: number){
        const UtilisateurExist = await this.prisma.utilisateur.findUnique({
            where: {id}
        })
        if (!UtilisateurExist){
            throw new NotFoundException("L'id associé à cet user n'existe pas ! ");
        }
        return UtilisateurExist
    }

    async CreateUtilisateur(data: CreateUser){
        if (!data) {
            throw new NotFoundException("Les données de l'utilisateur sont requises !");
        }

        const emailExist = await this.prisma.utilisateur.findUnique({
            where: { email: data.email }
        });
        if (emailExist) {
            throw new ConflictException("Cet email est déjà utilisé !");
        }

        const nomUtilisateurExist = await this.prisma.utilisateur.findUnique({
            where: { nomUtilisateur: data.nomUtilisateur }
        });
        if (nomUtilisateurExist) {
            throw new ConflictException("Ce nom d'utilisateur est déjà utilisé !");
        }

        return await this.prisma.utilisateur.create({
            data 
        });
    }

    async DeleteUtilisateur(id: number){
        const UtilisateurExist = await this.prisma.utilisateur.findUnique({
            where: {id}
        })
        if (!UtilisateurExist){
            throw new NotFoundException("L'id associé à cet user n'existe pas, il ne peut pas être supprimé ! ");
        }
        return this.prisma.utilisateur.delete({
            where: {id}
        })
    }

    async UpdateUtilisateur(id: number, data: UpdateUser){
        if (!data) {
            throw new NotFoundException("Les données de l'utilisateur sont requises !");
        }

        const UtilisateurExist = await this.prisma.utilisateur.findUnique({
            where: {id}
        });
        if (!UtilisateurExist){
            throw new NotFoundException("L'id associé à cet user n'existe pas, il ne peut pas être modifié ! ");
        }

        const nouveauNomUtilisateur = data.nomUtilisateur;
        
        if (nouveauNomUtilisateur && nouveauNomUtilisateur !== UtilisateurExist.nomUtilisateur) {
            const nomUtilisateurExist = await this.prisma.utilisateur.findUnique({
                where: { nomUtilisateur: nouveauNomUtilisateur }
            });
            if (nomUtilisateurExist) {
                throw new ConflictException("Ce nom d'utilisateur est déjà utilisé !");
            }
        }

        return await this.prisma.utilisateur.update({
            where: {id}, 
            data
        });
    }



}
