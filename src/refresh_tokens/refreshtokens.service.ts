import {
  BadRequestException,
  Body,
  Headers,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { refreshCookiesDTO, refreshDTO } from './refreshToken.dto';
import { HeaderAuthService } from '../header-auth/header-auth.service';
import { ApplicationDataDto } from '../application/application.dto';
import * as jwt from 'jsonwebtoken';
import { AccessTokenDto, RefreshTokenDto } from '../oidc/dto/oidc.token.dto';
@Injectable()
export class RefreshTokensService {
  private readonly logger: Logger;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly headerAuthService: HeaderAuthService,
  ) {
    this.logger = new Logger(RefreshTokensService.name);
  }

  async refreshToken(
    @Headers() cookie: refreshCookiesDTO,
    @Body() data: refreshDTO,
  ) {
    if (!cookie || !data) {
      return {
        success: false,
        message: 'please provide refresh and access token via cookie or body',
      };
    }
    const refreshToken = cookie.refreshToken
      ? cookie.refreshToken
      : data.refreshToken;
    const accessToken = cookie.token ? cookie.token : data.token;
    if (!refreshToken || !accessToken) {
      throw new BadRequestException({
        success: false,
        message: 'No refresh or access token provided',
      });
    }
    const foundRefreshToken = await this.prismaService.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    if (!foundRefreshToken) {
      throw new BadRequestException({
        success: false,
        message: 'No refresh token found',
      });
    }

    const application = await this.prismaService.application.findUnique({
      where: { id: foundRefreshToken.applicationsId },
    });
    const refreshTokenSigningKey = await this.prismaService.key.findUnique({
      where: { id: application.accessTokenSigningKeysId },
    });
    const refreshSecret = refreshTokenSigningKey.privateKey
      ? refreshTokenSigningKey.privateKey
      : refreshTokenSigningKey.secret;
    const refreshTokenValue = foundRefreshToken.token;
    try {
      const refreshTokenDecoded = await jwt.verify(
        refreshTokenValue,
        refreshSecret,
      );
      const accessTokenDecoded = await jwt.verify(accessToken, refreshSecret);
      const applicationData: ApplicationDataDto = JSON.parse(application.data);
      const refreshTokenSeconds =
        applicationData.jwtConfiguration.refreshTokenTimeToLiveInMinutes * 60;
      const { exp, iss } = refreshTokenDecoded as RefreshTokenDto;
      const now = Math.floor(Date.now() / 1000);
      if (exp < now) {
        throw new BadRequestException({
          success: false,
          message: 'Invalid token',
        });
      }
      const refreshTokenPayload: RefreshTokenDto = {
        active: true,
        iat: now,
        exp: now + refreshTokenSeconds,
        iss,
        applicationId: application.id,
        sub: (refreshTokenDecoded as jwt.JwtPayload).sub,
      };
      const newRefreshToken = jwt.sign(refreshTokenPayload, refreshSecret, {
        algorithm: refreshTokenSigningKey.algorithm as jwt.Algorithm,
        header: {
          kid: refreshTokenSigningKey.kid,
          alg: refreshTokenSigningKey.algorithm,
          typ: 'JWT',
        },
      });
      const updateToken = await this.prismaService.refreshToken.update({
        where: { id: foundRefreshToken.id },
        data: { token: newRefreshToken },
      });

      const { sub, scope, roles } = accessTokenDecoded as AccessTokenDto;
      const accessTokenPayload: AccessTokenDto = {
        active: true,
        applicationId: application.id,
        iat: now,
        exp: now + applicationData.jwtConfiguration.timeToLiveInSeconds,
        iss,
        sub,
        scope,
        roles,
        aud: application.id,
      };
      const newAccessToken = jwt.sign(accessTokenPayload, refreshSecret, {
        algorithm: refreshTokenSigningKey.algorithm as jwt.Algorithm,
        header: {
          kid: refreshTokenSigningKey.kid,
          alg: refreshTokenSigningKey.algorithm,
          typ: 'JWT',
        },
      });
      return {
        success: true,
        message: 'Refresh token refreshed',
        data: {
          refresh_token: newRefreshToken,
          refreshTokenId: updateToken.id,
          access_token: newAccessToken,
        },
      };
    } catch (error) {
      this.logger.log('Error from refreshToken', error);
      throw new BadRequestException({
        success: false,
        message: 'Invalid token',
      });
    }
  }

  async retrieveByID(id: string, headers: object) {
    const valid = await this.headerAuthService.validateRoute(
      headers,
      '/jwt/refresh',
      'GET',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    const tenantId = valid.data.tenantsId
      ? valid.data.tenantsId
      : headers['x-stencil-tenantid'];
    if (!tenantId) {
      throw new BadRequestException({
        success: false,
        message: 'x-stencil-tenantid missing',
      });
    }
    const tenant = await this.prismaService.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new BadRequestException({
        success: false,
        message: 'No tenant with given id exists',
      });
    }
    if (!id) {
      throw new BadRequestException({
        success: false,
        message: 'please send uuid along with request',
      });
    }
    try {
      const refreshToken = await this.prismaService.refreshToken.findUnique({
        where: { id, tenantId: tenant.id },
      });
      if (!refreshToken) {
        throw new BadRequestException({
          success: false,
          message: 'refresh token is not found',
        });
      } else {
        delete refreshToken.expiry;
        delete refreshToken.startInstant; // giving errors since cant be serialized
        return {
          success: true,
          message: 'refresh token found successfully',
          data: refreshToken,
        };
      }
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException({
        success: false,
        message: 'error occures while retrieving refresh token from uuid',
      });
    }
  }

  async retrieveByUserID(usersId: string, headers: object) {
    const tenantId = headers['x-stencil-tenantid'];
    if (!tenantId) {
      throw new BadRequestException({
        success: false,
        message: 'x-stencil-tenantid header missing',
      });
    }
    const tenant = await this.prismaService.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new BadRequestException({
        success: false,
        message: 'no such tenant exists',
      });
    }
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      tenantId,
      '/jwt/refresh',
      'GET',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    if (!usersId) {
      throw new BadRequestException({
        success: false,
        message: 'please send userId along with request',
      });
    }
    const refreshToken = await this.prismaService.refreshToken.findMany({
      where: {
        usersId,
        tenantId,
      },
    });
    try {
      if (!refreshToken) {
        throw new BadRequestException({
          success: false,
          message: 'refresh token is not found',
        });
      } else {
        refreshToken.forEach((val) => {
          delete val.expiry;
          delete val.startInstant; // giving errors since cant be serialized
        });
        return {
          success: true,
          message: 'refresh tokens found successfully',
          data: refreshToken,
        };
      }
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException({
        success: false,
        message: 'error occures while retrieving refresh token from userID',
      });
    }
  }

  async deleteViaAppID(applicationId: string, headers: object) {
    if (!applicationId) {
      throw new BadRequestException({
        success: false,
        message: 'please send a valid application ID',
      });
    }
    const appId = await this.prismaService.application.findUnique({
      where: { id: applicationId },
    });
    if (!appId) {
      throw new BadRequestException({
        success: false,
        message: 'application id not found',
      });
    }
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      appId.tenantId,
      '/jwt/refresh',
      'DELETE',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    try {
      await this.prismaService.refreshToken.deleteMany({
        where: {
          applicationsId: applicationId,
        },
      });
      return {
        success: true,
        message:
          'all refresh tokens deleted successfully with the given application id',
      };
    } catch (error) {
      this.logger.log(error);
      throw new InternalServerErrorException({
        success: false,
        message:
          'error occured while deleting all refresh token from given application id',
      });
    }
  }

  async deleteViaUserID(usersId: string, headers: object) {
    if (!usersId) {
      throw new BadRequestException({
        success: false,
        message: 'please send a valid user id',
      });
    }
    const userId = await this.prismaService.user.findUnique({
      where: {
        id: usersId,
      },
    });
    if (!userId) {
      throw new BadRequestException({
        success: false,
        message: 'unable to find refresh token with provided credentials',
      });
    }
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      null,
      '/jwt/refresh',
      'DELETE',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    try {
      await this.prismaService.refreshToken.deleteMany({
        where: {
          usersId: usersId,
        },
      });
      return {
        success: true,
        message:
          'all refresh token is deleted successfully with the help of given user id',
      };
    } catch (error) {
      this.logger.log(error);
      throw new InternalServerErrorException({
        success: false,
        message:
          'error occured while deleting refresh token from given user id',
      });
    }
  }

  async deleteViaUserAndAppID(
    userId: string,
    applicationsId: string,
    headers: object,
  ) {
    if (!userId || !applicationsId) {
      throw new BadRequestException({
        success: false,
        message: 'please send userId and applicationId both',
      });
    }
    const userID = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    const appId = await this.prismaService.application.findUnique({
      where: { id: applicationsId },
    });
    if (!userID || !appId) {
      throw new BadRequestException({
        success: false,
        message: 'No such userid or appid exists',
      });
    }
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      appId.tenantId,
      '/jwt/refersh',
      'DELETE',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    try {
      await this.prismaService.refreshToken.deleteMany({
        where: {
          usersId: userId,
          applicationsId: applicationsId,
        },
      });
      return {
        success: true,
        message:
          'refresh token deleted with provided application ID and user ID',
      };
    } catch (error) {
      this.logger.log(error);
      throw new InternalServerErrorException({
        success: false,
        message:
          'error occured deleting refresh tokens while userId and applicationId both are given',
      });
    }
  }

  async deleteViaTokenID(id: string, headers: object) {
    if (!id) {
      throw new BadRequestException({
        success: false,
        message: 'please send a valid token id',
      });
    }
    const ref_token = await this.prismaService.refreshToken.findUnique({
      where: {
        id: id,
      },
    });
    if (!ref_token) {
      throw new BadRequestException({
        success: false,
        message: 'unable to find refresh token with provided credentials',
      });
    }
    const appid = ref_token.applicationsId;
    const application = await this.prismaService.application.findUnique({
      where: { id: appid },
    });
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      application.tenantId,
      '/jwt/refresh',
      'DELETE',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    try {
      const token = await this.prismaService.refreshToken.delete({
        where: { id },
      });
      return {
        success: true,
        message:
          'refresh token is deleted successfully with the help of given token id',
        data: token,
      };
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException({
        success: false,
        message:
          'error occured while deleting refresh token from given token id',
      });
    }
  }

  async deleteViaToken(token: string, headers: object) {
    if (!token) {
      throw new BadRequestException({
        success: false,
        message: 'please send a valid token',
      });
    }
    const ref_token = await this.prismaService.refreshToken.findUnique({
      where: {
        token: token,
      },
    });
    if (!ref_token) {
      throw new BadRequestException({
        success: false,
        message: 'unable to find refresh token with provided credentials',
      });
    }
    const appid = ref_token.applicationsId;
    const application = await this.prismaService.application.findUnique({
      where: { id: appid },
    });
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      application.tenantId,
      '/jwt/refresh',
      'DELETE',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: false,
        message: valid.message,
      });
    }
    try {
      await this.prismaService.refreshToken.delete({ where: { token } });
      return {
        success: true,
        message:
          'refresh token is deleted successfully with the help of given token',
      };
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException({
        success: false,
        message:
          'error occured while deleting refresh token from given token string',
      });
    }
  }
}
