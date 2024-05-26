import { Controller, Req, Res, Post, Body } from '@nestjs/common';
import axios from 'axios';
import { Response, Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';

@Controller('/api')
export class ApiController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}
  @Post('/login')
  async loginRoute(
    @Req() req: Request,
    @Res() res: Response,
    @Body('username') username: string,
    @Body('password') password: string,
    @Body('scopes') scopes: string,
  ) {
    const jwtToken = req.cookies?.jwt;
    if (!jwtToken && (!username || !password)) {
      res.status(400).send({
        error: 'Invalid Credentials',
        error_description: 'username, password missing in body',
      });
      return;
    }
    //console.log('2');
    const user = jwtToken
      ? await this.jwtService.verifyAsync(jwtToken, { secret: 'secret' })
      : await this.prismaService.user.findUnique({
          where: {
            username,
            password,
          },
        });
    //console.log('3');
    if (!user) {
      res.status(401).send({
        error: 'Invalid Credentials',
        error_description:
          "User with the given username and password doesn't exist",
      });
      return;
    }
    //console.log('4');

    const finalScope = scopes ? scopes : 'openid';
    //console.log(scopes);
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
    //console.log(response.data);

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
    //console.log(val);
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
    //console.log(response.data);
    return res.send(response.data);
  }

  @Post('/signup')
  async signupRoute(
    @Req() req: Request,
    @Res() res: Response,
    @Body()
    body: {
      username: string;
      password: string;
      gender: string;
      birthdate: string;
      email: string;
    },
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
    // //console.log('User created: ', newUser);

    res.status(201).send({
        message: "user created successfully",
        newUser
    })
    
  }
}
