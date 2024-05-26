import { Body, Controller,Get,Post, Res } from '@nestjs/common';
import { UserService } from './user.service';
import { Response } from 'express';
import { CreateUserDto } from 'src/dto/user.dto';
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService){}

    @Get('/all')
    async getAllUsers(){
        return this.userService.allUsers();
    }

    @Post('/signup')
    async register(
        @Body() userData: CreateUserDto
    ){
        return this.userService.createUser(userData);
    }
}
