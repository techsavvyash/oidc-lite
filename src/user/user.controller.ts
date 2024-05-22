import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  BadRequestException,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { user as userModel } from '@prisma/client';
import { JwtService, JwtModule } from '@nestjs/jwt';
import { Request, Response } from 'express';

@Controller('/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService,
  ) {}

  @Get('/all')
  async allUsers(): Promise<userModel[]> {
    return this.userService.allUsersInDB();
  }

  @Post('/signup')
  async createUser(
    @Body('username') username: string,
    @Body('password') password: string,
    @Body('is_superuser') is_superuser: boolean,
  ): Promise<userModel> {
    return this.userService.createUser({
      username: username,
      password: password,
      is_superuser: is_superuser,
    });
  }

  @Post('/login')
  async loginUser(
    @Body('username') username: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.userService.user({
      username: username,
      password: password,
    });
    if (!user) {
      throw new BadRequestException('Invalid user');
    }

    const jwt = await this.jwtService.signAsync(
      { id: user.id },
      { secret: 'secret' },
    );
    response.cookie('jwt', jwt, { httpOnly: true });

    return {
      message: 'success',
    };
  }

  @Get('/user')
  async user(@Req() request: Request) {
    try {
      const cookie = request.cookies['jwt'];

      const data: { id: number; iat: number } =
        await this.jwtService.verifyAsync(cookie, {
          secret: 'secret',
        });
      if (!data) {
        throw new UnauthorizedException();
      }

      const user = await this.userService.user({ id: data.id });

      return user;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  @Post('/logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('jwt');
    return {
      message: 'logout successfully',
    };
  }
}
