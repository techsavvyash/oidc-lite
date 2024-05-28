import {
  Controller,
  HttpStatus,
  Get,
  Res,
  Req,
  Logger,
  Body,
  Post,
  BadGatewayException,
  Headers,
  HttpException,
  Header,
} from '@nestjs/common';
import { AppService } from './app.service';
import axios from 'axios';
import { Request, Response } from 'express';

import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto, LoginDTO } from './dto/user.dto';
import { STATUS_CODES } from 'http';

@Controller()
export class AppController {
  private readonly logger: Logger;
  constructor(
    private readonly appService: AppService,
    private readonly userService: UserService,
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {this.logger = new Logger() }

  @Get('/health')
  async getRoutesInfo() {
    return {
      "status": "live"  
    };
  }

  @Post('/login')
  async loginRoute(
    @Headers() headers : any,
    @Body() body: LoginDTO,
  ) {
    const { username, password, scopes, resource, grant_type } = body;
    const jwtToken = headers.cookies?.jwt;
    if (!jwtToken && (!username || !password)) {
      throw new BadGatewayException({
        STATUS_CODES: 400,
        error: 'Invalid Credentials',
        error_description: 'username, password missing in body',
      })
      return;
    }
    if (resource && !resource.includes(':')) {
      throw new BadGatewayException({
        STATUS_CODES : 401,
        error: 'Invalid resource type',
        error_description: 'Send the resource in xyz:abc format',
      })
      return;
    }
    
    const user = jwtToken
      ? await this.jwtService.verifyAsync(jwtToken, {
          secret: `${process.env.JWT_SECRET}`,
        })
      : await this.prismaService.user.findUnique({
          where: {
            username,
            password,
          },
        });
    if (!user) {
      throw new BadGatewayException({
        STATUS_CODES : 401,
        error: 'Invalid Credentials',
        error_description:
          "User with the given username and password doesn't exist",
      })
      return;
    }

    const finalScope = scopes ? scopes : 'openid';

    const headersList = {
      Accept: '*/*',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${process.env.AUTHORIZATION_TOKEN}`,
    };
    const bodyContent = `grant_type=client_credentials&${resource ? `resource=${resource}` : ``}&scope=${finalScope}`;
    const reqOptions = {
      url: `${process.env.HOST_NAME}:${process.env.HOST_PORT}/oidc/token`,
      method: 'POST',
      headers: headersList,
      data: bodyContent,
    };
    const response = await axios.request(reqOptions);

    await this.userService.insertToken(user.id, response.data.access_token);

    if (!jwtToken) {
      const token = await this.jwtService.signAsync(
        {
          id: user.id,
          sub: response.data.access_token,
        },
        { secret: process.env.JWT_SECRET },
      );
      // res.cookie('jwt', token);
    } else {
      // res.cookie('jwt', jwtToken);
    }

    this.logger.log(`A user just login! uid: ${user.id}`);
    throw new HttpException({
      message: resource ? 'jwt token generated': 'opaque token generated',
      data: response.data
    }, HttpStatus.OK)
  }

  // for verifying opaque tokens
  @Post('/opaque-verify')
  async opaque_verify(
    @Headers() headers : any,
    @Body('token') token: string)
    {
    if (!token) {
      throw new BadGatewayException({
        STATUS_CODES : 401,
        error: 'No token given',
        error_description: 'No token were given while calling the endpoint',
      })
      return;
    }

    const headersList = {
      Accept: '*/*',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${process.env.AUTHORIZATION_TOKEN}`,
    };
    const bodyContent = `token=${token}`;
    const reqOptions = {
      url: `${process.env.HOST_NAME}:${process.env.HOST_PORT}/oidc/token/introspection`,
      method: 'POST',
      headers: headersList,
      data: bodyContent,
    };
    const response = await axios.request(reqOptions);

    return headers.send(response.data);
  }

  // to verify jwt created tokens, whose public keys are available
  @Post('/jwt-verify')
  async jwt_verify(@Body('token') token: string){
    if (!token) {
      return ({
        error: 'No token given',
        error_description: 'No token were given while calling the endpoint',
      });
    }

    const val = await this.jwtService.decode(token,{complete: true});

    return val;
  }

  @Post('/signup')
  async signupRoute(
    @Headers() headers : any,
    @Body()
    body: CreateUserDto,
  ) {
    const { username, password, gender, birthdate, email } = body;
    if (!username || !password || !gender || !birthdate || !email) {
      throw new BadGatewayException({
        STATUS_CODES : 400,
        error: 'Invalid fields',
        error_description:
          'username, password, gender, birthdate, email all in string format required',
      })
      return;
    }
    const user = await this.prismaService.user.findUnique({
      where: {
        username: username,
        email: email,
      },
    });
    if (user) {
      throw new BadGatewayException({
        STATUS_CODES : 401,
        error: 'Duplicate entry',
        error_description: 'User already exists',
      })
      return;
    }
    const newUser = await this.prismaService.user.create({ data: body });
    this.logger.log('New user registered!', newUser);
    throw new HttpException({
      message: 'user created successfully',
      newUser,
    }, HttpStatus.OK)
  }
}
