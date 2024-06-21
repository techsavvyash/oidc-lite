import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './login.dto';
import { ResponseDto } from 'src/dto/response.dto';
import * as jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { HeaderAuthService } from 'src/header-auth/header-auth.service';
import { ApplicationDataDto } from 'src/application/application.dto';
import { AccessTokenDto, RefreshTokenDto } from '../oidc/dto/oidc.token.dto';

@Injectable()
export class LoginService {
  private readonly logger: Logger;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly headerAuthService: HeaderAuthService,
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
    const tenant_id = valid.apiKey.tenantsId;
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
    // groupId.split() => groups => application_role_id => all roles
    const groups = user.groupId.split(' '); // splits all the groups
    const allRoles = await Promise.all(
      groups.map(async (group) => {
        return await this.prismaService.groupApplicationRole.findMany({
          where: { groupsId: group },
        });
      }),
    );
    const filterRolesBasedOnCurrentApplication = await Promise.all(
      allRoles.map(async (group) => {
        return await Promise.all(
          group.map(async (role) => {
            const actualRoleData =
              await this.prismaService.applicationRole.findUnique({
                where: { id: role.applicationRolesId },
              });
            if (actualRoleData.applicationsId === application.id)
              return actualRoleData.name;
            return;
          }),
        );
      }),
    );
    const flattenedRoles = filterRolesBasedOnCurrentApplication.flat();
    const filteredFlattenedRoles = flattenedRoles.filter(
      (role) => role !== undefined,
    );
    const roles = filteredFlattenedRoles; // for now
    const now = new Date().getTime();
    const applicationData: ApplicationDataDto = JSON.parse(application.data);
    const refreshTokenSeconds =
      applicationData.jwtConfiguration.refreshTokenTimeToLiveInMinutes *
      60 *
      1000;
    const accessTokenSeconds =
      applicationData.jwtConfiguration.timeToLiveInSeconds * 1000;

    const refreshTokenPayload: RefreshTokenDto = {
      active: true,
      applicationId: application.id,
      iat: now,
      iss: 'Stencil Service',
      exp: now + refreshTokenSeconds,
    };
    const refreshToken = jwt.sign(refreshTokenPayload, accessSecret, {
      algorithm: accessTokenSigningKey.algorithm as jwt.Algorithm,
    });
    const accessTokenPayload: AccessTokenDto = {
      active: true,
      applicationId: application.id,
      sub: user.id,
      iat: now,
      iss: 'Stencil Service',
      exp: now + accessTokenSeconds,
      roles: roles,
    };
    const accessToken = jwt.sign(accessTokenPayload, accessSecret, {
      algorithm: accessTokenSigningKey.algorithm as jwt.Algorithm,
    });
    const saveToken = await this.prismaService.refreshToken.create({
      data: {
        applicationsId: application.id,
        token: refreshToken,
        tenantId: application.tenantId,
        usersId: user.id,
        expiry: now + refreshTokenSeconds,
        startInstant: now,
        data: '',
      },
    });

    this.logger.log('A refresh token created', refreshToken);
    return {
      success: true,
      message: 'User logged in!',
      data: {
        user,
        refreshToken: {
          value: refreshToken,
          publicKey: accessTokenSigningKey.publicKey,
          id: saveToken.id,
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
