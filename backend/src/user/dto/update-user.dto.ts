import { IsString, IsEnum, IsOptional, MinLength, MaxLength, Matches } from "class-validator";
import { StatutUtilisateur } from "../../../generated/prisma/enums.js";
import { ApiProperty, ApiSchema } from "@nestjs/swagger";

@ApiSchema({ description: "User update schema (update user: username, password, status - email cannot be modified)" })
export class UpdateUser {

    @ApiProperty({
        description: "Unique username",
        example: "toby_garcia",
        type: String,
        required: false
    })
    @IsOptional()
    @IsString({
        message: "The 'username' field must be a string!"
    })
    @MinLength(3, {
        message: "The 'username' field must contain at least 3 characters!"
    })
    @MaxLength(50, {
        message: "The 'username' field must not exceed 50 characters!"
    })
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: "The 'username' field must only contain letters, numbers and underscores!"
    })
    username?: string;

    @ApiProperty({
        description: "User password",
        example: "12345abc!@",
        type: String,
        required: false
    })
    @IsOptional()
    @IsString({
        message: "The 'password' field must be a string!"
    })
    @MinLength(8, {
        message: "The 'password' field must contain at least 8 characters!"
    })
    @MaxLength(255, {
        message: "The 'password' field must not exceed 255 characters!"
    })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: "The 'password' field must contain at least one uppercase letter, one lowercase letter, one number and one special character (@$!%*?&)!"
    })
    password?: string;

    @ApiProperty({
        description: "User status",
        example: "EN_LIGNE",
        enum: StatutUtilisateur,
        required: false
    })
    @IsOptional()
    @IsEnum(StatutUtilisateur, {
        message: "The 'status' field must be a valid value (EN_LIGNE, ABSENT, INVISIBLE, HORS_LIGNE)!"
    })
    status?: StatutUtilisateur;
}
