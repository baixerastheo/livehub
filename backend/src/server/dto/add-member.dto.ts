import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ description: 'Add member to server schema' })
export class AddMember {
  @ApiProperty({
    description: 'ID of the user to add to the server',
    example: 'user-123',
    type: String,
  })
  @IsNotEmpty({
    message: "The 'userId' field is required!",
  })
  @IsString({
    message: "The 'userId' field must be a string!",
  })
  userId: string;
}

