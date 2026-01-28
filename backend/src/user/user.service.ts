import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CreateUser } from './dto/create-user.dto.js';
import { UpdateUser } from './dto/update-user.dto.js';
import { Result, ok, err } from '../result.js';


@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) {}

    async getAllUsers(){
        return this.prisma.utilisateur.findMany()
    }

    async getUserById(id: number): Promise<Result<any, string>> {
        const user = await this.prisma.utilisateur.findUnique({
            where: {id}
        });
        if (!user){
            return err("User with ID " + id + " not found");
        }
        return ok(user);
    }

    async GetUserByEmail(email: string): Promise<Result<any, string>> {
        const user = await this.prisma.utilisateur.findUnique({
            where:{email}
        })
        if (!user){
            return err("User with Email " + email + " not found");
        }
        return ok(user);
    }

    async GetUserByUsername(username: string): Promise<Result<any, string>>{
        const user = await this.prisma.utilisateur.findUnique({
            where:{nomUtilisateur: username}
        })
    
        if (!user){
            return err("User with username " + username + " not found");
        }
        return ok(user);
    }

    async createUser(data: CreateUser): Promise<Result<any, string>> {
        try {
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
        } catch (error) {
            if (error.code === 'P2002') {
                return err('Unique constraint violation');
            }
            throw error;
        }
    }

    async deleteUser(id: number): Promise<Result<any, string>> {
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

    async updateUser(id: number, data: UpdateUser): Promise<Result<any, string>> {
        try {
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
        } catch (error) {
            if (error.code === 'P2002') {
                return err('Unique constraint violation');
            }
            throw error; 
        }
    }
}
