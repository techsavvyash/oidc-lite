import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { CreateUserDto, LoginDTO } from './dto/user.dto';
import { PrismaService } from './prisma/prisma.service';
import { UserService } from './user/user.service';

@Injectable()
export class AppService {
  private readonly logger: Logger;
  constructor(
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
  ) {
    this.logger = new Logger();
  }

  async loginService(headers: any, body: LoginDTO) {
    const { username, password, scopes, resource, grant_type } = body;
    const jwtToken = headers.cookies?.jwt;
    if (!jwtToken && (!username || !password)) {
      throw new BadRequestException({
        error: 'Invalid Credentials',
        error_description: 'username, password missing in body',
      });
    }
    if (resource && !resource.includes(':')) {
      throw new BadRequestException({
        error: 'Invalid resource type',
        error_description: 'Send the resource in xyz:abc format',
      });
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
      throw new UnauthorizedException({
        error: 'Invalid Credentials',
        error_description:
          "User with the given username and password doesn't exist",
      });
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
    return {
      message: resource ? 'jwt token generated' : 'opaque token generated',
      data: response.data,
    };
  }

  async jwtTokenVerifyService(token: string) {
    if (!token) {
      throw new BadRequestException({
        error: 'No token given',
        error_description: 'No token were given while calling the endpoint',
      });
    }

    const val = await this.jwtService.decode(token, { complete: true });

    return val;
  }

  async opaqueTokenVerifyService(token: string) {
    if (!token) {
      throw new BadRequestException({
        error: 'No token given',
        error_description: 'No token were given while calling the endpoint',
      });
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

    return response.data;
  }

  async signupService(body: CreateUserDto) {
    const { username, password, gender, birthdate, email } = body;
    if (!username || !password || !gender || !birthdate || !email) {
      throw new BadRequestException({
        error: 'Invalid fields',
        error_description:
          'username, password, gender, birthdate, email all in string format required',
      });
    }
    const user = await this.prismaService.user.findUnique({
      where: {
        username: username,
        email: email,
      },
    });
    if (user) {
      throw new ConflictException({
        error: 'Duplicate entry',
        error_description: 'User already exists',
      });
    }
    const newUser = await this.prismaService.user.create({ data: body });
    this.logger.log('New user registered!', newUser);
    return {
      message: 'user created successfully',
      newUser,
    };
  }
}
