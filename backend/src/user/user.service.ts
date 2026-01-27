import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { NotFoundException } from '@nestjs/common';
import { CreateUser } from './dto/create-user.dto.js';
import { UpdateUser } from './dto/update-user.dto.js';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) {}

    async getAllUsers(){
        return this.prisma.utilisateur.findMany()
    }

    async getUserById(id: number){
        const user = await this.prisma.utilisateur.findUnique({
            where: {id}
        })
        if (!user){
            throw new NotFoundException("User with this ID does not exist!");
        }
        return user
    }

    async createUser(data: CreateUser){
        if (!data) {
            throw new NotFoundException("User data is required!");
        }

        const emailExist = await this.prisma.utilisateur.findUnique({
            where: { email: data.email }
        });
        if (emailExist) {
            throw new ConflictException("This email is already in use!");
        }

        const usernameExist = await this.prisma.utilisateur.findUnique({
            where: { nomUtilisateur: data.username }
        });
        if (usernameExist) {
            throw new ConflictException("This username is already in use!");
        }

        return await this.prisma.utilisateur.create({
            data: {
                nomUtilisateur: data.username,
                email: data.email,
                motDePasse: data.password,
                statut: data.status
            }
        });
    }

    async deleteUser(id: number){
        const user = await this.prisma.utilisateur.findUnique({
            where: {id}
        })
        if (!user){
            throw new NotFoundException("User with this ID does not exist, it cannot be deleted!");
        }
        return this.prisma.utilisateur.delete({
            where: {id}
        })
    }

    async updateUser(id: number, data: UpdateUser){
        if (!data) {
            throw new NotFoundException("User data is required!");
        }

        const user = await this.prisma.utilisateur.findUnique({
            where: {id}
        });
        if (!user){
            throw new NotFoundException("User with this ID does not exist, it cannot be updated!");
        }

        const newUsername = data.username;
        
        if (newUsername && newUsername !== user.nomUtilisateur) {
            const usernameExist = await this.prisma.utilisateur.findUnique({
                where: { nomUtilisateur: newUsername }
            });
            if (usernameExist) {
                throw new ConflictException("This username is already in use!");
            }
        }

        const updateData: any = {};
        if (data.username !== undefined) updateData.nomUtilisateur = data.username;
        if (data.password !== undefined) updateData.motDePasse = data.password;
        if (data.status !== undefined) updateData.statut = data.status;

        return await this.prisma.utilisateur.update({
            where: {id}, 
            data: updateData
        });
    }
}
