import {
  IsString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { StatutUtilisateur } from '../../../generated/prisma/enums.js';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({
  description:
    'User creation schema (name, email, password, optional image and status)',
})
export class CreateUser {
  @ApiProperty({
    description: 'Display name',
    example: 'Toby Garcia',
    type: String,
  })
  @IsNotEmpty({
    message: "The 'name' field is required!",
  })
  @IsString({
    message: "The 'name' field must be a string!",
  })
  @MinLength(2, {
    message: "The 'name' field must contain at least 2 characters!",
  })
  @MaxLength(100, {
    message: "The 'name' field must not exceed 100 characters!",
  })
  name: string;

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
  password: string;

  @ApiProperty({
    description: 'Profile image URL',
    example: 'https://example.com/avatar.png',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: "The 'image' field must be a valid URL!" })
  @MaxLength(500, {
    message: "The 'image' field must not exceed 500 characters!",
  })
  image?: string;

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
      "The 'statut' field must be a valid value (EN_LIGNE, ABSENT, INVISIBLE, HORS_LIGNE)!",
  })
  statut?: StatutUtilisateur;
}
