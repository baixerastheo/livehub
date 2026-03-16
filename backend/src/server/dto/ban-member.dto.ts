import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BanMember {
  @IsNotEmpty({ message: "The 'userId' field is required!" })
  @IsString({ message: "The 'userId' field must be a string!" })
  userId: string;

  @IsOptional()
  @IsString({ message: "The 'raison' field must be a string!" })
  raison?: string;

  @IsOptional()
  @IsDateString({}, { message: "The 'expireLe' field must be a valid ISO date string!" })
  expireLe?: string;
}
