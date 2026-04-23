import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty({
    message: "The 'content' field is required.",
  })
  @IsString({
    message: "The 'content' field must be a string.",
  })
  @MinLength(1, {
    message: "The 'content' field must contain at least 1 character.",
  })
  @MaxLength(4000, {
    message: "The 'content' field must not exceed 4000 characters.",
  })
  content: string;
}
