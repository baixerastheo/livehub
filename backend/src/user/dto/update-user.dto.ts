import {IsString,IsEnum,IsOptional,IsUrl,MinLength,MaxLength,Matches,} from 'class-validator';
import { StatutUtilisateur } from '../../../generated/prisma/enums';

export class UpdateUser {
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
  password?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: "The 'image' field must be a valid URL!" })
  @MaxLength(500, {
    message: "The 'image' field must not exceed 500 characters!",
  })
  image?: string;

  @IsOptional()
  @IsEnum(StatutUtilisateur, {
    message:
      "The 'statut' field must be a valid value (EN_LIGNE, ABSENT, INVISIBLE, HORS_LIGNE)!",
  })
  statut?: StatutUtilisateur;
}
