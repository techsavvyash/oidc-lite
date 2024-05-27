import {
  Controller,
  HttpStatus,
  Get,
  Res,
  Req,
  Logger,
  Body,
  Post,
} from '@nestjs/common';
import { AppService } from './app.service';
import axios from 'axios';
import { Request, Response } from 'express';

import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto, LoginDTO } from './dto/user.dto';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  constructor(
    private readonly appService: AppService,
    private readonly userService: UserService,
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('/')
  async getRoutesInfo() {
    return {
      error: 'Nothing on this route',
      error_description:
        'Nothing on this route, go to /login -> (username,password,scopes?,resources?), /jwt-verify -> (token), /opaque-verify -> (token), /signup -> (username,password,email,birthdate,gender) instead',
    };
  }

  @Post('/login')
  async loginRoute(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: LoginDTO,
  ) {
    const { username, password, scopes, resource, grant_type } = body;
    const jwtToken = req.cookies?.jwt;
    if (!jwtToken && (!username || !password)) {
      res.status(400).send({
        error: 'Invalid Credentials',
        error_description: 'username, password missing in body',
      });
      return;
    }
    if (resource && !resource.includes(':')) {
      res.status(401).send({
        error: 'Invalid resource type',
        error_description: 'Send the resource in xyz:abc format',
      });
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
      res.status(401).send({
        error: 'Invalid Credentials',
        error_description:
          "User with the given username and password doesn't exist",
      });
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
    return res.send({
      message: resource ? 'jwt token generated': 'opaque token generated',
      data: response.data
    });
  }

  // for verifying opaque tokens
  @Post('/opaque-verify')
  async opaque_verify(@Res() res: Response, @Body('token') token: string) {
    if (!token) {
      res.status(401).send({
        error: 'No token given',
        error_description: 'No token were given while calling the endpoint',
      });
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

    return res.send(response.data);
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
    @Req() req: Request,
    @Res() res: Response,
    @Body()
    body: CreateUserDto,
  ) {
    const { username, password, gender, birthdate, email } = body;
    if (!username || !password || !gender || !birthdate || !email) {
      res.status(400).send({
        error: 'Invalid fields',
        error_description:
          'username, password, gender, birthdate, email all in string format required',
      });
      return;
    }
    const user = await this.prismaService.user.findUnique({
      where: {
        username: username,
        email: email,
      },
    });
    if (user) {
      res.status(401).send({
        error: 'Duplicate entry',
        error_description: 'User already exists',
      });
      return;
    }
    const newUser = await this.prismaService.user.create({ data: body });
    this.logger.log('New user registered!', newUser);
    res.status(201).send({
      message: 'user created successfully',
      newUser,
    });
  }
}
