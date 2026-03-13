import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CreateServer {
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
