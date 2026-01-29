import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

@ApiSchema({ description: 'User login payload (login + password)' })
export class LoginDto {
  @ApiProperty({
    description: 'Login (email or username)',
    example: 'toby.garcia@gmail.com',
    type: String,
  })
  @IsNotEmpty({ message: "The 'login' field is required!" })
  @IsString({ message: "The 'login' field must be a string!" })
  login: string;

  @ApiProperty({
    description: 'User password',
    example: '12345Abc!@',
    type: String,
  })
  @IsNotEmpty({ message: "The 'password' field is required!" })
  @IsString({ message: "The 'password' field must be a string!" })
  password: string;
}
