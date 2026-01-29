import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
    @ApiProperty({
        description: 'Message content',
        example: 'Hello everyone!',
        type: String,
    })
    @IsNotEmpty({
        message: "The 'contenu' field is required.",
    })
    @IsString({
        message: "The 'contenu' field must be a string.",
    })
    @MinLength(1, {
        message: "The 'contenu' field must contain at least 1 character.",
    })
    @MaxLength(4000, {
        message: "The 'contenu' field must not exceed 4000 characters.",
    })
    contenu: string;
}
