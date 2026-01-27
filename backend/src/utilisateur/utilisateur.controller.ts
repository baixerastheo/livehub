import { UtilisateurService } from './utilisateur.service.js';
import { ApiCreatedResponse, ApiOkResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { UpdateUser } from './dto/update-user.dto.js';
import { CreateUser } from './dto/create-user.dto.js';


@Controller('utilisateur')
export class UtilisateurController {
    constructor(private readonly utilisateurService: UtilisateurService) {}

    @Get('/')
    @ApiOkResponse({ 
        description: "Liste de tous les utilisateurs récupérée avec succès"
    })
    getAllUsers(){
        return this.utilisateurService.GetAllUtilisateurs();
    }

    @Get('/:id')
    @ApiOkResponse({ 
        description: "L'utilisateur a été récupéré avec succès"
    })
    @ApiNotFoundResponse({ 
        description: "L'utilisateur avec cet ID n'existe pas"
    })
    GetUserById(@Param( 'id', ParseIntPipe) id: number){
        return this.utilisateurService.GetUtilisateurById(id);
    }

    @Delete('/:id')
    @ApiOkResponse({ 
        description: "L'utilisateur a été supprimé avec succès"
    })
    @ApiNotFoundResponse({ 
        description: "L'utilisateur avec cet ID n'existe pas"
    })
    DeleteUser(@Param('id', ParseIntPipe) id: number){
        return this.utilisateurService.DeleteUtilisateur(id);
    }

    @Post('/')
    @ApiCreatedResponse({ 
        description: "L'utilisateur a été créé avec succès",
        type: CreateUser
    })
    CreateUser(@Body() data: CreateUser){
        return this.utilisateurService.CreateUtilisateur(data);
    }

    @Put('/:id')
    @ApiOkResponse({ 
        description: "L'utilisateur a été modifié avec succès",
        type: UpdateUser
    })
    @ApiNotFoundResponse({ 
        description: "L'utilisateur avec cet ID n'existe pas"
    })
    UpdateUser(@Body() data: UpdateUser, @Param('id', ParseIntPipe) id: number){
        return this.utilisateurService.UpdateUtilisateur(id, data);
    }

}

