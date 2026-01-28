import { UserService } from './user.service.js';
import { ApiCreatedResponse, ApiOkResponse, ApiNotFoundResponse, ApiConflictResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, NotFoundException, ConflictException,BadRequestException,InternalServerErrorException} from '@nestjs/common';
import { UpdateUser } from './dto/update-user.dto.js';
import { CreateUser } from './dto/create-user.dto.js';


@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get('/')
    @ApiOkResponse({ 
        description: "All users retrieved successfully"
    })
    async getAllUsers(): Promise<unknown[]> {
        return await this.userService.getAllUsers();
    }

    @Get('/email/:email')
    @ApiOkResponse({ 
        description: "Users retrieved successfully"
    })
    @ApiNotFoundResponse({ 
        description: "User with this Email does not exist"
    })
    async GetUserByEmail(@Param('email') email: string){
        const result = await this.userService.GetUserByEmail(email);
        if (result.isErr()) {
            throw new NotFoundException(result.unwrapErr());
        }
        return result.unwrap();
    }


    @Get('/username:username')
    @ApiOkResponse({ 
        description: "User retrieved successfully"
    })
    @ApiNotFoundResponse({ 
        description: "User with this Username does not exist"
    })
    async GetUserByUsername(@Param('username') username: string){
        const result = await this.userService.GetUserByUsername(username);
        if (result.isErr()) {
            throw new NotFoundException(result.unwrapErr());
        }
        return result.unwrap();
    }

    @Get('/:id')
    @ApiOkResponse({ 
        description: "User retrieved successfully"
    })
    @ApiNotFoundResponse({ 
        description: "User with this ID does not exist"
    })
    async getUserById(@Param('id', ParseIntPipe) id: number) {
        const result = await this.userService.getUserById(id);
        if (result.isErr()) {
            throw new NotFoundException(result.unwrapErr());
        }
        return result.unwrap();
    }

    @Delete('/:id')
    @ApiOkResponse({ 
        description: "User deleted successfully"
    })
    @ApiNotFoundResponse({ 
        description: "User with this ID does not exist"
    })
    async deleteUser(@Param('id', ParseIntPipe) id: number){
        const result = await this.userService.deleteUser(id);
        if (result.isErr()) {
            throw new NotFoundException(result.unwrapErr());
        }
        return result.unwrap();
    }

    @Post('/')
    @ApiCreatedResponse({ 
        description: "User created successfully",
        type: CreateUser
    })
    @ApiConflictResponse({ 
        description: "Email or username already exists"
    })
    @ApiBadRequestResponse({
        description: "Invalid user data"
    })
    async createUser(@Body() data: CreateUser){
        const result = await this.userService.createUser(data);
        if (result.isErr()) {
            const error = result.unwrapErr();
            if (error.includes('Email') || error.includes('Username') || error.includes('constraint')) {
                throw new ConflictException(error);
            }
            if (error.includes('required')) {
                throw new BadRequestException(error);
            }
            throw new InternalServerErrorException(error);
        }
        return result.unwrap();
    }

    @Put('/:id')
    @ApiOkResponse({ 
        description: "User updated successfully",
        type: UpdateUser
    })
    @ApiNotFoundResponse({ 
        description: "User with this ID does not exist"
    })
    @ApiConflictResponse({ 
        description: "Username already exists"
    })
    @ApiBadRequestResponse({
        description: "Invalid user data"
    })
    async updateUser(@Body() data: UpdateUser, @Param('id', ParseIntPipe) id: number){
        const result = await this.userService.updateUser(id, data);
        if (result.isErr()) {
            const error = result.unwrapErr();
            if (error.includes('Username') || error.includes('constraint')) {
                throw new ConflictException(error);
            }
            if (error.includes('not found')) {
                throw new NotFoundException(error);
            }
            if (error.includes('required')) {
                throw new BadRequestException(error);
            }
            throw new InternalServerErrorException(error);
        }
        return result.unwrap();
    }

    

}
