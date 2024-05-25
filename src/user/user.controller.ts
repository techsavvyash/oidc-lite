import { Body, Controller,Get,Post, Res } from '@nestjs/common';
import { UserService } from './user.service';
import { Response } from 'express';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService){}

    @Get('/all')
    async getAllUsers(){
        return this.userService.allUsers();
    }

    @Post('/signup')
    async register(
        @Body() userData: {birthdate: string, gender: string, username: string, email: string, password: string,tokens?: string}
    ){
        return this.userService.createUser(userData);
    }
}
