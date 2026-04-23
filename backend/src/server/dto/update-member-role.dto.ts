import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '../../../generated/prisma/enums';

export class UpdateMemberRole {
  @IsNotEmpty({
    message: "The 'role' field is required!",
  })
  @IsEnum(Role, {
    message:
      "The 'role' field must be a valid value (PROPRIETAIRE, ADMINISTRATEUR, MEMBRE)!",
  })
  role: Role;
}
