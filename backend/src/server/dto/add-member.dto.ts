import { IsNotEmpty, IsString } from 'class-validator';

export class AddMember {
  @IsNotEmpty({
    message: "The 'userId' field is required!",
  })
  @IsString({
    message: "The 'userId' field must be a string!",
  })
  userId: string;
}
