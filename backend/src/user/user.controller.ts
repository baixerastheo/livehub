import { UserService } from './user.service.js';
import { ApiCreatedResponse, ApiOkResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { UpdateUser } from './dto/update-user.dto.js';
import { CreateUser } from './dto/create-user.dto.js';


@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get('/')
    @ApiOkResponse({ 
        description: "All users retrieved successfully"
    })
    getAllUsers(){
        return this.userService.getAllUsers();
    }

    @Get('/:id')
    @ApiOkResponse({ 
        description: "User retrieved successfully"
    })
    @ApiNotFoundResponse({ 
        description: "User with this ID does not exist"
    })
    getUserById(@Param( 'id', ParseIntPipe) id: number){
        return this.userService.getUserById(id);
    }

    @Delete('/:id')
    @ApiOkResponse({ 
        description: "User deleted successfully"
    })
    @ApiNotFoundResponse({ 
        description: "User with this ID does not exist"
    })
    deleteUser(@Param('id', ParseIntPipe) id: number){
        return this.userService.deleteUser(id);
    }

    @Post('/')
    @ApiCreatedResponse({ 
        description: "User created successfully",
        type: CreateUser
    })
    createUser(@Body() data: CreateUser){
        return this.userService.createUser(data);
    }

    @Put('/:id')
    @ApiOkResponse({ 
        description: "User updated successfully",
        type: UpdateUser
    })
    @ApiNotFoundResponse({ 
        description: "User with this ID does not exist"
    })
    updateUser(@Body() data: UpdateUser, @Param('id', ParseIntPipe) id: number){
        return this.userService.updateUser(id, data);
    }

}
