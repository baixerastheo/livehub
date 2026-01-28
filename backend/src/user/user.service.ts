import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CreateUser } from './dto/create-user.dto.js';
import { UpdateUser } from './dto/update-user.dto.js';
import { ok, err } from '../result.js';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) {}

    async getAllUsers(){
        return await this.prisma.utilisateur.findMany();
    }

    async getUserById(id: number) {
        const user = await this.prisma.utilisateur.findUnique({
            where: {id}
        });
        if (!user){
            return err("User with ID " + id + " not found");
        }
        return ok(user);
    }

    async GetUserByEmail(email: string) {
        const user = await this.prisma.utilisateur.findUnique({
            where:{email}
        });
        if (!user){
            return err("User with Email " + email + " not found");
        }
        return ok(user);
    }

    async GetUserByUsername(username: string) {
        const user = await this.prisma.utilisateur.findUnique({
            where:{nomUtilisateur: username}
        });
        if (!user){
            return err("User with username " + username + " not found");
        }
        return ok(user);
    }

    async createUser(data: CreateUser) {
        const emailExist = await this.prisma.utilisateur.findUnique({
            where: { email: data.email }
        });
        if (emailExist) {
            return err('Email already exists');
        }

        const usernameExist = await this.prisma.utilisateur.findUnique({
            where: { nomUtilisateur: data.nomUtilisateur }
        });
        if (usernameExist) {
            return err('Username already exists');
        }

        const user = await this.prisma.utilisateur.create({
            data: {
                nomUtilisateur: data.nomUtilisateur,
                email: data.email,
                motDePasse: data.motDePasse,
                statut: data.statut
            }
        });
        return ok(user);
    }

    async deleteUser(id: number) {
        const user = await this.prisma.utilisateur.findUnique({
            where: {id}
        });
        if (!user){
            return err("User with ID " + id + " not found");
        }
        const deletedUser = await this.prisma.utilisateur.delete({
            where: {id}
        });
        return ok(deletedUser);
    }

    async updateUser(id: number, data: UpdateUser) {
        const user = await this.prisma.utilisateur.findUnique({
            where: {id}
        });
        if (!user){
            return err("User with ID " + id + " not found");
        }
        const newUsername = data.nomUtilisateur;
        if (newUsername !== user.nomUtilisateur) {
            const usernameExist = await this.prisma.utilisateur.findUnique({
                where: { nomUtilisateur: newUsername }
            });
            if (usernameExist) {
                return err('Username already exists');
            }
        }

        const updatedUser = await this.prisma.utilisateur.update({
            where: {id}, 
            data: {
                nomUtilisateur: data.nomUtilisateur,
                motDePasse: data.motDePasse,
                statut: data.statut
            }
        });
        return ok(updatedUser);
    }
}
