import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CreateUser } from './dto/create-user.dto.js';
import { UpdateUser } from './dto/update-user.dto.js';
import { Result, Ok, Err } from '../result.js';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) {}

    async getAllUsers(){
        return this.prisma.utilisateur.findMany()
    }

    async getUserById(id: number): Promise<Result<any, string>> {
        try {
            const user = await this.prisma.utilisateur.findUnique({
                where: {id}
            });
            if (!user){
                return Err("User with ID " + id + " not found");
            }
            return Ok(user);
        } catch (error) {
            throw error; 
        }
    }

    async GetUserByEmail(email: string): Promise<Result<any, string>> {
        try {
            const user = await this.prisma.utilisateur.findUnique({
                where:{email}
            })
            if (!user){
                return Err("User with Email " + email + " not found");
            }
            return Ok(user);
        } catch(error){
            throw error;
        }

    }

    async GetUserByUsername(username: string): Promise<Result<any, string>>{
        try {
            const user = await this.prisma.utilisateur.findUnique({
                where:{nomUtilisateur: username}
            })
        
            if (!user){
                return Err("User with username " + username + " not found");
            }
            return Ok(user);
        } catch(error){
            throw error;
        }
    }

    async createUser(data: CreateUser): Promise<Result<any, string>> {
        try {
            if (!data) {
                return Err('User data is required');
            }

            const emailExist = await this.prisma.utilisateur.findUnique({
                where: { email: data.email }
            });
            if (emailExist) {
                return Err('Email already exists');
            }

            const usernameExist = await this.prisma.utilisateur.findUnique({
                where: { nomUtilisateur: data.nomUtilisateur }
            });
            if (usernameExist) {
                return Err('Username already exists');
            }

            const user = await this.prisma.utilisateur.create({
                data: {
                    nomUtilisateur: data.nomUtilisateur,
                    email: data.email,
                    motDePasse: data.motDePasse,
                    statut: data.statut
                }
                 
            });
            return Ok(user);
        } catch (error: any) {
            if (error.code === 'P2002') {
                return Err('Unique constraint violation');
            }
            throw error;
        }
    }

    async deleteUser(id: number): Promise<Result<any, string>> {
        try {
            const user = await this.prisma.utilisateur.findUnique({
                where: {id}
            });
            if (!user){
                return Err("User with ID " + id + " not found");
            }
            const deletedUser = await this.prisma.utilisateur.delete({
                where: {id}
            });
            return Ok(deletedUser);
        } catch (error) {
            throw error;
        }
    }

    async updateUser(id: number, data: UpdateUser): Promise<Result<any, string>> {
        try {
            if (!data) {
                return Err('User data is required');
            }

            const user = await this.prisma.utilisateur.findUnique({
                where: {id}
            });
            if (!user){
                return Err("User with ID " + id + " not found");
            }
            const newUsername = data.nomUtilisateur;
            if (newUsername !== user.nomUtilisateur) {
                const usernameExist = await this.prisma.utilisateur.findUnique({
                    where: { nomUtilisateur: newUsername }
                });
                if (usernameExist) {
                    return Err('Username already exists');
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
            return Ok(updatedUser);
        } catch (error: any) {
            if (error.code === 'P2002') {
                return Err('Unique constraint violation');
            }
            throw error; 
        }
    }
}
