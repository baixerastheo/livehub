import { Injectable, NotFoundException } from '@nestjs/common';
import { NotFoundError } from 'rxjs';
import { PrismaService } from 'src/prisma.service.js';

@Injectable()
export class ServeurService {
    constructor(private readonly prisma: PrismaService){}

    async GetAllServeur(){
        return this.prisma.serveur.findMany()
    }

    async GetServeurById(id: number){
        const ServeurExist = await this.prisma.serveur.findUnique({
            where:{id}
        })
        if (!ServeurExist){
            throw new NotFoundException("Le serveur associé à cet ID n'existe pas !")
        }
        return ServeurExist
        
    }
}
