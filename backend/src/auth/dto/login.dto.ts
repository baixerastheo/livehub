import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

@ApiSchema({ description: 'User login payload (identifier + password)' })
export class LoginDto {
  @ApiProperty({
    description: 'Identifier (email or username)',
    example: 'toby.garcia@gmail.com',
    type: String,
  })
  @IsNotEmpty({ message: "The 'identifier' field is required!" })
  @IsString({ message: "The 'identifier' field must be a string!" })
  identifier: string;

  @ApiProperty({
    description: 'User password',
    example: '12345Abc!@',
    type: String,
  })
  @IsNotEmpty({ message: "The 'password' field is required!" })
  @IsString({ message: "The 'password' field must be a string!" })
  password: string;
}

