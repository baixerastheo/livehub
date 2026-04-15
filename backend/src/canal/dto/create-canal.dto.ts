import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { TypeCanal } from '../../../generated/prisma/enums';

export class CreateCanal {
  @IsNotEmpty({
    message: "The 'name' field is required!",
  })
  @IsString({
    message: "The 'name' field must be a string!",
  })
  @MinLength(1, {
    message: "The 'name' field must contain at least 1 character!",
  })
  @MaxLength(100, {
    message: "The 'name' field must not exceed 100 characters!",
  })
  name: string;

  @IsOptional()
  @IsEnum(TypeCanal)
  type?: TypeCanal;
}
