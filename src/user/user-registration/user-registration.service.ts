import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ResponseDto } from 'src/dto/response.dto';
import {
  CreateUserAndUserRegistration,
  CreateUserRegistrationDto,
  UpdateUserRegistrationDto,
} from '../user.dto';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from 'src/prisma/prisma.service';
import { randomUUID } from 'crypto';
import { HeaderAuthService } from 'src/header-auth/header-auth.service';
import { UserService } from '../user.service';
import { AccessTokenDto, RefreshTokenDto } from 'src/oidc/oidc.token.dto';
import { ApplicationDataDto } from 'src/application/application.dto';

@Injectable()
export class UserRegistrationService {
  private readonly logger: Logger;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly headerAuthService: HeaderAuthService,
    private readonly userService: UserService,
  ) {
    this.logger = new Logger(UserRegistrationService.name);
  }

  async createAUserRegistration(
    userId: string,
    data: CreateUserRegistrationDto,
    headers: object,
  ): Promise<ResponseDto> {
    if (!data || !data.applicationId || !userId) {
      throw new BadRequestException({
        success: false,
        message: 'No data given for registration',
      });
    }
    const application = await this.prismaService.application.findUnique({
      where: { id: data.applicationId },
    });
    if (!application) {
      throw new BadRequestException({
        success: false,
        message: 'No application with given id exists',
      });
    }
    const tenantId = application.tenantId;
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      tenantId,
      '/user/registration',
      'POST',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: false,
        message: valid.message,
      });
    }
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException({
        success: false,
        message: 'No such user exists',
      });
    }
    if (!data.roles || data.roles.length === 0) {
      throw new BadRequestException({
        success: false,
        message: 'No roles provided',
      });
    }
    const registrationId = data.registrationId
      ? data.registrationId
      : randomUUID();
    const authenticationToken = data.generateAuthenticationToken
      ? randomUUID()
      : null;
    const roles = await Promise.all(
      data.roles.map(async (role) => {
        const findRole = await this.prismaService.applicationRole.findUnique({
          where: {
            application_roles_uk_1: {
              applicationsId: application.id,
              name: role,
            },
          },
        });
        return findRole?.name;
      }),
    );
    const additionalData = data.data;
    const password: string | null = (await JSON.parse(user.data))?.userData
      ?.password;
    // const verified = false; //for now
    // const verifiedInstant = 0;
    try {
      const userRegistration = await this.prismaService.userRegistration.create(
        {
          data: {
            id: registrationId,
            authenticationToken,
            data: JSON.stringify(additionalData),
            usersId: userId,
            applicationsId: application.id,
            password,
          },
        },
      );
      this.logger.log('A new user registration is made!', userRegistration);
      const accessTokenSigningKeyId = application.accessTokenSigningKeysId;
      const accessToken = await this.prismaService.key.findUnique({
        where: { id: accessTokenSigningKeyId },
      });
      const accessSecret = accessToken.privateKey
        ? accessToken.privateKey
        : accessToken.secret;
      const now = new Date().getTime();
      const applicationData: ApplicationDataDto = JSON.parse(application.data);
      const accessTokenSeconds =
        applicationData.jwtConfiguration.timeToLiveInSeconds * 1000;
      const accessTokenPayload: AccessTokenDto = {
        active: true,
        applicationId: application.id,
        iat: now,
        iss: 'Stencil Service',
        exp: now + accessTokenSeconds,
        roles: roles,
        sub: user.id,
      };
      const token_acess_token = jwt.sign(accessTokenPayload, accessSecret, {
        algorithm: accessToken.algorithm as jwt.Algorithm,
      });
      return {
        success: true,
        message: 'User registered',
        data: { userRegistration, token: token_acess_token },
      };
    } catch (error) {
      this.logger.log('Error from createAUserRegistration', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'Error occured while creatin user registration',
      });
    }
  }

  async returnAUserRegistration(
    userId: string,
    applicationId: string,
    headers: object,
  ): Promise<ResponseDto> {
    const application = await this.prismaService.application.findUnique({
      where: { id: applicationId },
    });
    if (!application) {
      throw new BadRequestException({
        success: false,
        message: 'No application with given id exists',
      });
    }
    const tenantId = application.tenantId;
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      tenantId,
      '/user/registration',
      'POST',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: false,
        message: valid.message,
      });
    }
    if (!userId) {
      throw new BadRequestException({
        success: false,
        message: 'No user id given',
      });
    }
    try {
      const userRegistration =
        await this.prismaService.userRegistration.findFirst({
          where: { usersId: userId, applicationsId: applicationId },
        });
      if (!userRegistration) {
        throw new BadRequestException({
          success: false,
          message:
            'No user registration exists for the given user id on the application',
        });
      }
      return {
        success: true,
        message: 'User registration found successfully',
        data: userRegistration,
      };
    } catch (error) {
      this.logger.log('Error from returnAUserRegistration', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'Internal server error while returning the user Registration',
      });
    }
  }

  async updateAUserRegistration(
    userId: string,
    applicationId: string,
    data: UpdateUserRegistrationDto,
    headers: object,
  ): Promise<ResponseDto> {
    if (!data || applicationId || !userId) {
      throw new BadRequestException({
        success: false,
        message: 'No data given for registration',
      });
    }
    const application = await this.prismaService.application.findUnique({
      where: { id: applicationId },
    });
    if (!application) {
      throw new BadRequestException({
        success: false,
        message: 'No application with given id exists',
      });
    }
    const tenantId = application.tenantId;
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      tenantId,
      '/user/registration',
      'PATCH',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: false,
        message: valid.message,
      });
    }
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException({
        success: false,
        message: 'No such user exists',
      });
    }
    const oldUserRegistration =
      await this.prismaService.userRegistration.findFirst({
        where: { usersId: userId, applicationsId: applicationId },
      });
    const additionalData = data.data
      ? JSON.stringify(data.data)
      : oldUserRegistration.data;
    const token = data.roles ? randomUUID() : null; // genenrate a new token like jwks

    try {
      const userRegistration = await this.prismaService.userRegistration.update(
        {
          where: { ...oldUserRegistration },
          data: {
            data: additionalData,
          },
        },
      );
      this.logger.log('User registration updated', userRegistration);

      return {
        success: true,
        message: 'User registration updated',
        data: { userRegistration, token },
      };
    } catch (error) {
      this.logger.log('Error from updateAUserRegistration', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'Error while updatin user Registration',
      });
    }
  }

  async deleteAUserRegistration(
    usersId: string,
    applicationsId: string,
    headers: object,
  ): Promise<ResponseDto> {
    const application = await this.prismaService.application.findUnique({
      where: { id: applicationsId },
    });
    if (!application) {
      throw new BadRequestException({
        success: false,
        message: 'No application with given id exists',
      });
    }
    const tenantId = application.tenantId;
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      tenantId,
      '/user/registration',
      'POST',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: false,
        message: valid.message,
      });
    }
    if (!usersId) {
      throw new BadRequestException({
        success: false,
        message: 'No user id given',
      });
    }
    const oldUserRegistration =
      await this.prismaService.userRegistration.findFirst({
        where: { usersId, applicationsId },
      });
    if (!oldUserRegistration) {
      throw new BadRequestException({
        success: false,
        message: 'No such user registration exists',
      });
    }
    try {
      const userRegistration = await this.prismaService.userRegistration.delete(
        { where: { ...oldUserRegistration } },
      );
      this.logger.log('A user registration is deleted', userRegistration);
      return {
        success: true,
        message: 'User registration deleted successfully',
        data: userRegistration,
      };
    } catch (error) {
      this.logger.log('Error from deleteAUserRegistration', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'Internal server error while deleting a user registration',
      });
    }
  }

  async createAUserAndUserRegistration(
    userId: string,
    data: CreateUserAndUserRegistration,
    headers: object,
  ): Promise<ResponseDto> {
    const tenantId = headers['x-stencil-tenantid'];
    if (!tenantId) {
      throw new BadRequestException({
        success: false,
        message: 'x-stencil-tenantid header mission',
      });
    }
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      tenantId,
      '/user/registration',
      'POST',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: false,
        message: valid.message,
      });
    }
    if (!data || !data.userInfo || !data.registrationInfo) {
      throw new BadRequestException({
        success: false,
        message: 'Either data, data.userInfo or data.registrationInfo missing',
      });
    }
    const { userInfo, registrationInfo } = data;
    if (!registrationInfo.roles || registrationInfo.roles.length === 0) {
      throw new BadRequestException({
        success: false,
        message: 'No roles provided',
      });
    }
    if (
      !userInfo.active ||
      !userInfo.applicationId ||
      !userInfo.membership ||
      !userInfo.userData ||
      !userInfo.email
    ) {
      throw new BadRequestException({
        success: false,
        message:
          'Data missing active, applicationId, membership array, email or userData',
      });
    }
    try {
      const user = await this.userService.createAUser(
        userId,
        userInfo,
        headers,
      );
      try {
        const userRegistration = await this.createAUserRegistration(
          userId,
          registrationInfo,
          headers,
        );
        const applicationId = userInfo.applicationId;
        const application = await this.prismaService.application.findUnique({
          where: { id: applicationId },
        });
        const accessTokenSigningKeyId = application.accessTokenSigningKeysId;
        const accessToken = await this.prismaService.key.findUnique({
          where: { id: accessTokenSigningKeyId },
        });
        const accessSecret = accessToken.privateKey
          ? accessToken.privateKey
          : accessToken.secret;
        const now = new Date().getTime();
        const applicationData: ApplicationDataDto = JSON.parse(
          application.data,
        );
        const refreshTokenSeconds =
          applicationData.jwtConfiguration.refreshTokenTimeToLiveInMinutes * 60 * 1000;
        const refreshTokenPayload: RefreshTokenDto = {
          active: true,
          applicationId: application.id,
          iat: now,
          iss: 'Stencil service',
          exp: now + refreshTokenSeconds,
        };
        const refreshToken = jwt.sign(refreshTokenPayload, accessSecret, {
          algorithm: accessToken.algorithm as jwt.Algorithm,
        });
        const saveToken = await this.prismaService.refreshToken.create({
          data: {
            applicationsId: application.id,
            token: refreshToken,
            tenantId: application.tenantId,
            usersId: user.data.id,
            expiry: now + refreshTokenSeconds,
            startInstant: now,
            data: '',
          },
        });
        this.logger.log('A refersh token is saved!', saveToken);
        return {
          success: true,
          message: 'User and user registration created successfully!',
          data: {
            user,
            userRegistration,
            refreshToken,
            refreshTokenId: saveToken.id,
          },
        };
      } catch (error) {
        const delCreatedUser = await this.prismaService.user.delete({
          where: { id: userId },
        });
        this.logger.log(
          'Error occured while creating User registration',
          error,
        );
        throw new InternalServerErrorException({
          success: false,
          message: 'Error occured while creating user Registration',
        });
      }
    } catch (error) {
      this.logger.log('Error occured while creating a user', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'Error occured while creating a user',
      });
    }
  }
}
