import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ description: 'Server creation schema' })
export class CreateServer {
  @ApiProperty({
    description: 'Server name',
    example: 'My Live Hub Server',
    type: String,
  })
  @IsNotEmpty({
    message: "The 'name' field is required!",
  })
  @IsString({
    message: "The 'name' field must be a string!",
  })
  @MinLength(1, {
    message: "The 'name' field must contain at least 1 character!",
  })
  @MaxLength(30, {
      message: "The 'name' field must not exceed 30 characters!",
  })
  name: string;
}
