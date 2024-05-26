import {
  Controller,
  HttpStatus,
  Get,
  Query,
  Render,
  Res,
  Req,
  Logger,
  Body,
  Post
} from '@nestjs/common';
import { AppService } from './app.service';
import axios from 'axios';
import { Request, Response } from 'express';
import * as qs from 'query-string';

import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { env } from 'process';
import { CreateApiDto, LoginDTO } from './dto/api.dto';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  constructor(
    private readonly appService: AppService,private readonly userService: UserService,
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}
  
  @Get('/')
  @Render('index')
  async getLoginPage(
    @Req() req: Request,
    @Res() res: Response,
    @Query('error') error: string,
    @Query('error_description') error_description: string,
  ) {
    const result: Record<string, any> = {
      query: { error, error_description },
      accountId: null,
      scopes: null,
      origin: process.env.LOCALHOST_URL
    };

    return result;
  }

  @Get('/callback')
  async test(
    @Query('code') code: string,
    @Query('error') error: string,
    @Query('error_description') error_description: string,
    @Res() res: Response,
    @Req() req: Request
  ) {
    this.logger.log("first ", code);
    if (error) {
      return res.redirect(
        `/?error=${error}&error_description=${error_description}`,
      );
    }

    if (!code) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send('Missing "code" parameter');
    }
    try {
      const result = await axios.post(
        'http://localhost:3000/oidc/token',
        qs.stringify({
          client_id: process.env.CLIENT_ID,
          grant_type: 'authorization_code',
          redirect_uris: 'http://localhost:3000/callback',
          code,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic' + process.env.AUTHORIZATION_TOKEN,
          },
        },
      );
      this.logger.log('This is result data', result.data) //using nestJS by deafult logger
      const refresh_token =  result.data.access_token
      const user = req.cookies?.user; //user will exist since code is generated
      this.logger.log('Hello User ', user?.username) 
      await this.userService.insertToken(user.id,refresh_token); // token getting appended
      this.logger.log("Token appended")
    } catch (error) {
      this.logger.log("Axios error happened")
      res
        .status(error.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR)
        .json(error.response?.data ?? error);
    }

    res.redirect('/');
  }

  @Post('/login')
  async loginRoute(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body : LoginDTO
  ) {
    const { username, password, scopes } = body;
    const jwtToken = req.cookies?.jwt;
    if (!jwtToken && (!username || !password)) {
      res.status(400).send({
        error: 'Invalid Credentials',
        error_description: 'username, password missing in body',
      });
      return;
    }
    const user = jwtToken
      ? await this.jwtService.verifyAsync(jwtToken, { secret: 'secret' })
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
    let headersList = {
      Accept: '*/*',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic YXBwOmFfc2VjcmV0',
    };

    let bodyContent = `grant_type=client_credentials&scope=${finalScope}`;

    let reqOptions = {
      url: 'http://localhost:3000/oidc/token',
      method: 'POST',
      headers: headersList,
      data: bodyContent,
    };

    let response = await axios.request(reqOptions);

    await this.userService.insertToken(
      user.id,
      response.data.access_token,
    );

    if (!jwtToken) {
      const token = await this.jwtService.signAsync(
        {
          id: user.id,
          sub: response.data.access_token,
        },
        { secret: process.env.JWT_SECRET },
      );
      res.cookie('jwt', token);
    } else {
      res.cookie('jwt', jwtToken);
    }
    return res.send(response.data);
  }

  @Post('/jwt-verify')
  async jwt_verify(
    @Req() req: Request,
    @Res() res: Response,
    @Body('token') token: string,
  ) {
    const jwtToken = req.cookies?.jwt;

    const user = jwtToken
      ? await this.jwtService.verifyAsync(jwtToken, { secret: 'secret' })
      : null;
    token = token ? token : user?.sub;

    if (!token) {
      res.status(401).send({
        error: 'No token given',
        error_description:
          "User with the given username and password doesn't exist",
      });
      return;
    }
    let headersList = {
      Accept: '*/*',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic YXBwOmFfc2VjcmV0',
    };

    let bodyContent = `token=${token}`;

    let reqOptions = {
      url: 'http://localhost:3000/oidc/token/introspection',
      method: 'POST',
      headers: headersList,
      data: bodyContent,
    };

    let response = await axios.request(reqOptions);
    return res.send(response.data);
  }

  @Post('/signup')
  async signupRoute(
    @Req() req: Request,
    @Res() res: Response,
    @Body()
    body: CreateApiDto
  ) {
    const { username, password, gender, birthdate, email } = body;
    if (!username || !password || !gender || !birthdate || !email) {
      res.status(401).send({
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

    res.status(201).send({
        message: "user created successfully",
        newUser
    })
    
  }
}

