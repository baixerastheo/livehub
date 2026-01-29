import {
  IsString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';
import { StatutUtilisateur } from '../../../generated/prisma/enums.js';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({
  description:
    'User creation schema (user registration: username, email, password, status)',
})
export class CreateUser {
  @ApiProperty({
    description: 'Unique username',
    example: 'toby_garcia',
    type: String,
  })
  @IsNotEmpty({
    message: "The 'username' field is required!",
  })
  @IsString({
    message: "The 'username' field must be a string!",
  })
  @MinLength(3, {
    message: "The 'username' field must contain at least 3 characters!",
  })
  @MaxLength(50, {
    message: "The 'username' field must not exceed 50 characters!",
  })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message:
      "The 'username' field must only contain letters, numbers and underscores!",
  })
  nomUtilisateur: string;

  @ApiProperty({
    description: 'User email',
    example: 'toby.garcia@gmail.com',
    type: String,
  })
  @IsNotEmpty({
    message: "The 'email' field is required!",
  })
  @IsEmail(
    {},
    {
      message: "The 'email' field must be a valid email!",
    },
  )
  @MaxLength(150, {
    message: "The 'email' field must not exceed 150 characters!",
  })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: '12345abc!@',
    type: String,
  })
  @IsNotEmpty({
    message: "The 'password' field is required!",
  })
  @IsString({
    message: "The 'password' field must be a string!",
  })
  @MinLength(8, {
    message: "The 'password' field must contain at least 8 characters!",
  })
  @MaxLength(255, {
    message: "The 'password' field must not exceed 255 characters!",
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      "The 'password' field must contain at least one uppercase letter, one lowercase letter, one number and one special character (@$!%*?&)!",
  })
  motDePasse: string;

  @ApiProperty({
    description: 'User status',
    example: 'EN_LIGNE',
    enum: StatutUtilisateur,
    required: false,
    default: 'EN_LIGNE',
  })
  @IsOptional()
  @IsEnum(StatutUtilisateur, {
    message:
      "The 'status' field must be a valid value (EN_LIGNE, ABSENT, INVISIBLE, HORS_LIGNE)!",
  })
  statut?: StatutUtilisateur;
}
