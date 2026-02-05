import {
  IsString,
  IsEnum,
  IsOptional,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { StatutUtilisateur } from '../../../generated/prisma/enums';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({
  description: 'Profile update schema for authenticated user (name, email, password, statut)',
})
export class UpdateProfileDto {
  @ApiProperty({
    description: 'Display name',
    example: 'Toby Garcia',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString({
    message: "The 'name' field must be a string!",
  })
  @MinLength(2, {
    message: "The 'name' field must contain at least 2 characters!",
  })
  @MaxLength(100, {
    message: "The 'name' field must not exceed 100 characters!",
  })
  name?: string;

  @ApiProperty({
    description: 'New email address (will require verification)',
    example: 'newemail@example.com',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: "The 'email' field must be a valid email address!" })
  @MaxLength(255, {
    message: "The 'email' field must not exceed 255 characters!",
  })
  email?: string;

  @ApiProperty({
    description: 'Current password (required when changing email or password)',
    example: 'currentPassword123!',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString({
    message: "The 'currentPassword' field must be a string!",
  })
  currentPassword?: string;

  @ApiProperty({
    description: 'New password',
    example: 'newPassword123!',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString({
    message: "The 'newPassword' field must be a string!",
  })
  @MinLength(8, {
    message: "The 'newPassword' field must contain at least 8 characters!",
  })
  @MaxLength(255, {
    message: "The 'newPassword' field must not exceed 255 characters!",
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      "The 'newPassword' field must contain at least one uppercase letter, one lowercase letter, one number and one special character (@$!%*?&)!",
  })
  newPassword?: string;

  @ApiProperty({
    description: 'User status',
    example: 'EN_LIGNE',
    enum: StatutUtilisateur,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutUtilisateur, {
    message:
      "The 'statut' field must be a valid value (EN_LIGNE, ABSENT, INVISIBLE, HORS_LIGNE)!",
  })
  statut?: StatutUtilisateur;
}
