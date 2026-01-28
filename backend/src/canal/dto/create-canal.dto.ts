import { IsString, IsNotEmpty, MinLength, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCanal {
    @ApiProperty({
        description: "Channel name",
        example: "general",
        type: String
    })
    @IsNotEmpty({
        message: "The 'name' field is required!"
    })
    @IsString({
        message: "The 'name' field must be a string!"
    })
    @MinLength(1, {
        message: "The 'name' field must contain at least 1 character!"
    })
    @MaxLength(100, {
        message: "The 'name' field must not exceed 100 characters!"
    })
    name: string;
}
