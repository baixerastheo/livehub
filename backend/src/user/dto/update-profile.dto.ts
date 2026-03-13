import {IsString,IsEnum,IsOptional,IsEmail,MinLength,MaxLength,Matches,} from 'class-validator';
import { StatutUtilisateur } from '../../../generated/prisma/enums';



export class UpdateProfileDto {

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

  @IsOptional()
  @IsEmail({}, { message: "The 'email' field must be a valid email address!" })
  @MaxLength(255, {
    message: "The 'email' field must not exceed 255 characters!",
  })
  email?: string;

  @IsOptional()
  @IsString({
    message: "The 'currentPassword' field must be a string!",
  })
  currentPassword?: string;

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

  @IsOptional()
  @IsEnum(StatutUtilisateur, {
    message:
      "The 'statut' field must be a valid value (EN_LIGNE, ABSENT, INVISIBLE, HORS_LIGNE)!",
  })
  statut?: StatutUtilisateur;
}
