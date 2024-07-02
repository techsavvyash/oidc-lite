import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './login.dto';
import { Request, Response } from 'express';
import { HeaderAuthService } from '../header-auth/header-auth.service';
import { ApplicationDataDto } from '../application/application.dto';
import { AccessTokenDto, RefreshTokenDto } from '../oidc/dto/oidc.token.dto';
import { UtilsService } from '../utils/utils.service';

@Injectable()
export class LoginService {
  private readonly logger: Logger;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly headerAuthService: HeaderAuthService,
    private readonly utilService: UtilsService,
  ) {
    this.logger = new Logger(LoginService.name);
  }

  async login(data: LoginDto, headers: object) {
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
    const valid = await this.headerAuthService.validateRoute(
      headers,
      '/login',
      'POST',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    const tenant_id = valid.data.tenantsId;
    if (application.tenantId !== tenant_id && tenant_id !== null) {
      throw new UnauthorizedException({
        success: false,
        message: 'You are not authorized to login with given authorization key',
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
      await this.prismaService.userRegistration.findUnique({
        where: {
          user_registrations_uk_1: {
            applicationsId: data.applicationId,
            usersId: user.id,
          },
        },
      });
    if (!userRegistration) {
      throw new BadRequestException({
        success: false,
        message: 'User not found',
      });
    }
    if (
      (await this.utilService.comparePasswords(
        password,
        userRegistration.password,
      )) === false
    ) {
      throw new UnauthorizedException({
        success: false,
        message: 'LoginId or password incorrect',
      });
    }

    const roleIds =
      await this.utilService.returnRolesForAGivenUserIdAndApplicationId(
        user.id,
        application.id,
      );
    const allRoles = await Promise.all(
      roleIds.map(async (roleId) => {
        const role = await this.prismaService.applicationRole.findUnique({
          where: { id: roleId },
        });
        if (role) return role.name;
      }),
    );
    const roles = allRoles.filter((i) => i);
    const now = Math.floor(Date.now() / 1000);
    const applicationData: ApplicationDataDto = JSON.parse(application.data);
    const refreshTokenSeconds =
      applicationData.jwtConfiguration.refreshTokenTimeToLiveInMinutes * 60;
    const accessTokenSeconds =
      applicationData.jwtConfiguration.timeToLiveInSeconds;

    const refreshTokenPayload: RefreshTokenDto = {
      active: true,
      applicationId: application.id,
      iat: now,
      iss: process.env.FULL_URL,
      exp: now + refreshTokenSeconds,
      sub: user.id,
    };
    const refreshToken = await this.utilService.createToken(
      refreshTokenPayload,
      application.id,
      application.tenantId,
      'refresh',
    );
    const accessTokenPayload: AccessTokenDto = {
      active: true,
      applicationId: application.id,
      sub: user.id,
      iat: now,
      iss: process.env.FULL_URL,
      aud: application.id,
      exp: now + accessTokenSeconds,
      roles: roles,
      scope: 'openid offline_access'
    };
    const accessToken = await this.utilService.createToken(
      accessTokenPayload,
      application.id,
      application.tenantId,
      'access',
    );
    const saveToken = await this.utilService.saveOrUpdateRefreshToken(
      application.id,
      refreshToken,
      user.id,
      application.tenantId,
      '',
      now,
      now + refreshTokenSeconds,
    );
    this.logger.log('A refresh token created', refreshToken);
    return {
      id_token: null, // id token comes here
      refresh_token: refreshToken,
      refreshTokenId: saveToken.id,
      access_token: accessToken,
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
