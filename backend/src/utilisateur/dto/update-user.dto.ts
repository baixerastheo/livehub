import { IsString, IsEnum, IsOptional, MinLength, MaxLength, Matches } from "class-validator";
import { StatutUtilisateur } from "../../../generated/prisma/enums.js";
import { ApiProperty, ApiSchema } from "@nestjs/swagger";

@ApiSchema({ description: "Schéma de modification d'utilisateur (modification d'un user : nom d'utilisateur, mot de passe, statut - l'email ne peut pas être modifié)" })
export class UpdateUser {

    @ApiProperty({
        description: "Nom d'utilisateur unique",
        example: "toby_garcia",
        type: String,
        required: false
    })
    @IsOptional()
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
    nomUtilisateur?: string;

    @ApiProperty({
        description: "Mot de passe du user",
        example: "12345abc!@",
        type: String,
        required: false
    })
    @IsOptional()
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
    motDePasse?: string;

    @ApiProperty({
        description: "Statut de l'utilisateur",
        example: "EN_LIGNE",
        enum: StatutUtilisateur,
        required: false
    })
    @IsOptional()
    @IsEnum(StatutUtilisateur, {
        message: "Le champ 'statut' doit être une valeur valide (EN_LIGNE, ABSENT, INVISIBLE, HORS_LIGNE) !"
    })
    statut?: StatutUtilisateur;
}