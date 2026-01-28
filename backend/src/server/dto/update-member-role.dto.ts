import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Role } from '../../../generated/prisma/enums.js';

@ApiSchema({ description: 'Member role update schema' })
export class UpdateMemberRole {
  @ApiProperty({
    description: 'Member role',
    example: 'ADMINISTRATEUR',
    enum: Role,
  })
  @IsNotEmpty({
    message: "The 'role' field is required!",
  })
  @IsEnum(Role, {
    message:
      "The 'role' field must be a valid value (PROPRIETAIRE, ADMINISTRATEUR, MEMBRE)!",
  })
  role: Role;
}
