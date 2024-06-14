import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './login.dto';
import { ResponseDto } from 'src/dto/response.dto';
import { Permissions } from 'src/api-keys/apiKey.dto';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { HeaderAuthService } from 'src/header-auth/header-auth.service';

@Injectable()
export class LoginService {
  private readonly logger: Logger;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly headerAuthService: HeaderAuthService
  ) {
    this.logger = new Logger(LoginService.name);
  }

  async login(data: LoginDto, headers: object): Promise<ResponseDto> {
    if (!data || !data.applicationId || !data.loginId || !data.password) {
      throw new BadRequestException({
        success: false,
        message: 'No data given for login',
      });
    }
    const application = await this.prismaService.application.findUnique({
      where: { id: data.applicationId },
    });
    if (!application) {
      throw new BadRequestException({
        success: false,
        message: 'NO application exists for the given id',
      });
    }
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      application.tenantId,
      '/login',
      'POST',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }

    const { loginId, password } = data;
    const user = await this.prismaService.user.findUnique({
      where: { email: loginId },
    });
    if (!user) {
      throw new BadRequestException({
        success: false,
        message: 'No such user exists',
      });
    }
    const userRegistration =
      await this.prismaService.userRegistration.findFirst({
        where: { applicationsId: application.id, usersId: user.id },
      });
    if (!userRegistration) {
      throw new BadRequestException({
        success: false,
        message: 'User not registered with the given application',
      });
    }
    if (userRegistration.password !== password) {
      throw new UnauthorizedException({
        success: false,
        message: 'LoginId or password incorrect',
      });
    }

    const accessTokenSigningKeyId = application.accessTokenSigningKeysId;
    const idTokenSigningKeysId = application.idTokenSigningKeysId;
    const accessTokenSigningKey = await this.prismaService.key.findUnique({
      where: { id: accessTokenSigningKeyId },
    });
    const idTokenSigningKey = await this.prismaService.key.findUnique({
      where: { id: idTokenSigningKeysId },
    });
    const accessSecret = accessTokenSigningKey.privateKey
      ? accessTokenSigningKey.privateKey
      : accessTokenSigningKey.secret;
    const idSecret = idTokenSigningKey.privateKey
      ? idTokenSigningKey.privateKey
      : idTokenSigningKey.secret; // will be needed in signup cases
    // const roles = uses groupId to find roles
    const roles = ['admin']; // for now
    const now = new Date().getTime();
    const refreshToken = jwt.sign(
      {
        applicationId: application.id,
        iat: now,
        iss: 'Take from application.data',
        exp: now + 36000, // take from application.data
      },
      accessSecret,
      { algorithm: accessTokenSigningKey.algorithm as jwt.Algorithm },
    );
    const accessToken = jwt.sign(
      {
        applicationId: application.id,
        iat: now,
        iss: 'Take from application.data',
        exp: now + 360, // take from application.data
        roles: roles,
      },
      accessSecret,
      { algorithm: accessTokenSigningKey.algorithm as jwt.Algorithm },
    );
    // const saveToken = await this.prismaService.refreshToken.create({data: {
    //     applicationsId: application.id,
    //     token: refreshToken,
    //     tenantId: application.tenantId,
    //     usersId: user.id, // foreign key constraint failed since some are removed
    //     expiry: now + 36000,
    //     startInstant: now,
    //     data: null
    // }})

    // this.logger.log("A refresh token created",refreshToken);
    return {
      success: true,
      message: 'User logged in!',
      data: {
        user,
        refreshToken: {
          value: refreshToken,
          publicKey: accessTokenSigningKey.publicKey,
        },
        accessToken: {
          value: accessToken,
          publicKey: accessTokenSigningKey.publicKey,
        },
      },
    };
  }

  async logout(res: Response, req: Request) {
    res.clearCookie('accessToken', { httpOnly: true, secure: true });
    res.clearCookie('refreshToken', { httpOnly: true, secure: true });

    const refreshTokenValue = req.cookies['refreshToken'];
    if (refreshTokenValue) {
      const token = await this.prismaService.refreshToken.deleteMany({
        where: { tokenHash: refreshTokenValue },
      });
      this.logger.log('Refresh tokens deleted', token);
    }

    res.send({ success: true, message: 'Logout successful' });
  }
}
