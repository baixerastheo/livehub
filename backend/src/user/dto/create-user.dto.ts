import {
  IsString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { StatutUtilisateur } from '../../../generated/prisma/enums';

export class CreateUser {
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

  @IsOptional()
  @IsEnum(StatutUtilisateur, {
    message:
      "The 'statut' field must be a valid value (EN_LIGNE, ABSENT, INVISIBLE, HORS_LIGNE)!",
  })
  statut?: StatutUtilisateur;
}
