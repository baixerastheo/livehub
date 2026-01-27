import { IsString, IsEmail, IsEnum, IsNotEmpty, MinLength, MaxLength, Matches, IsOptional } from "class-validator";
import { StatutUtilisateur } from "../../../generated/prisma/enums.js";
import { ApiProperty, ApiSchema } from "@nestjs/swagger";

@ApiSchema({ description: "Schéma de création d'utilisateur (inscription d'un user : nom d'utilisateur, email, mot de passe, statut)" })
export class CreateUser {

    @ApiProperty({
        description: "Nom d'utilisateur unique",
        example: "toby_garcia",
        type: String
    })
    @IsNotEmpty({
        message: "Le champ 'nom d'utilisateur' est obligatoire !"
    })
    @IsString({
        message: "Le champ 'nom d'utilisateur' doit être une chaîne de caractères !"
    })
    @MinLength(3, {
        message: "Le champ 'nom d'utilisateur' doit contenir au moins 3 caractères !"
    })
    @MaxLength(50, {
        message: "Le champ 'nom d'utilisateur' ne doit pas dépasser 50 caractères !"
    })
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: "Le champ 'nom d'utilisateur' ne doit contenir que des lettres, chiffres et underscores !"
    })
    nomUtilisateur: string;

    @ApiProperty({
        description: "Email du user",
        example: "toby.garcia@gmail.com",
        type: String
    })
    @IsNotEmpty({
        message: "Le champ 'email' est obligatoire !"
    })
    @IsEmail({}, {
        message: "Le champ 'email' doit être de type email !"
    })
    @MaxLength(150, {
        message: "Le champ 'email' ne doit pas dépasser 150 caractères !"
    })
    email: string;

    @ApiProperty({
        description: "Mot de passe du user",
        example: "12345abc!@",
        type: String
    })
    @IsNotEmpty({
        message: "Le champ 'mot de passe' est obligatoire !"
    })
    @IsString({
        message: "Le champ 'mot de passe' doit être une chaîne de caractères !"
    })
    @MinLength(8, {
        message: "Le champ 'mot de passe' doit contenir au moins 8 caractères !"
    })
    @MaxLength(255, {
        message: "Le champ 'mot de passe' ne doit pas dépasser 255 caractères !"
    })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: "Le champ 'mot de passe' doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&) !"
    })
    motDePasse: string;

    @ApiProperty({
        description: "Statut de l'utilisateur",
        example: "EN_LIGNE",
        enum: StatutUtilisateur,
        required: false,
        default: "EN_LIGNE"
    })
    @IsOptional()
    @IsEnum(StatutUtilisateur, {
        message: "Le champ 'statut' doit être une valeur valide (EN_LIGNE, ABSENT, INVISIBLE, HORS_LIGNE) !"
    })
    statut?: StatutUtilisateur;
}