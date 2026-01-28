import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';

@ApiSchema({ description: 'User registration payload (username, email, password)' })
export class RegisterDto {
  @ApiProperty({
    description: 'Unique username',
    example: 'toby_garcia',
    type: String,
  })
  @IsNotEmpty({ message: "The 'username' field is required!" })
  @IsString({ message: "The 'username' field must be a string!" })
  @MinLength(3, { message: "The 'username' field must contain at least 3 characters!" })
  @MaxLength(50, { message: "The 'username' field must not exceed 50 characters!" })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: "The 'username' field must only contain letters, numbers and underscores!",
  })
  username: string;

  @ApiProperty({
    description: 'User email',
    example: 'toby.garcia@gmail.com',
    type: String,
  })
  @IsNotEmpty({ message: "The 'email' field is required!" })
  @IsEmail({}, { message: "The 'email' field must be a valid email!" })
  @MaxLength(150, { message: "The 'email' field must not exceed 150 characters!" })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: '12345Abc!@',
    type: String,
  })
  @IsNotEmpty({ message: "The 'password' field is required!" })
  @IsString({ message: "The 'password' field must be a string!" })
  @MinLength(8, { message: "The 'password' field must contain at least 8 characters!" })
  @MaxLength(255, { message: "The 'password' field must not exceed 255 characters!" })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      "The 'password' field must contain at least one uppercase letter, one lowercase letter, one number and one special character (@$!%*?&)!",
  })
  password: string;
}

