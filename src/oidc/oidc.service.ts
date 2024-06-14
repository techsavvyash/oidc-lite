import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotImplementedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { OIDCAuthQuery } from './oidc.auth.dto';
import { LoginDto } from 'src/login/login.dto';
import { randomUUID } from 'crypto';
import { IntrospectDto, TokenDto } from './oidc.token.dto';
import * as jwt from 'jsonwebtoken';
import { ResponseDto } from 'src/dto/response.dto';

@Injectable()
export class OidcService {
  private readonly logger: Logger;
  constructor(private readonly prismaService: PrismaService) {
    this.logger = new Logger(OidcService.name);
  }
  async authorize(
    req: Request,
    res: Response,
    query: OIDCAuthQuery,
    headers: object,
  ) {
    const { client_id, tenantId, redirect_uri, response_type, scope } = query;
    if (!client_id) {
      throw new BadRequestException({
        success: false,
        message: 'No client/application id given',
      });
    }
    if (!tenantId) {
      throw new BadRequestException({
        success: false,
        message: 'No tenant id given',
      });
    }
    if (!redirect_uri) {
      throw new BadRequestException({
        success: false,
        message: 'No redirect uri given',
      });
    }
    if (!scope) {
      // verify scopes in application, give only those scopes that are registered for the application
      throw new BadRequestException({
        success: false,
        message: 'Scopes not given',
      });
    }
    if (!response_type && response_type !== 'code') {
      throw new BadRequestException({
        success: false,
        message: 'No response type given',
      });
    }

    if (req.cookies['authorization_code']) {
      // user is logged in so no need for login page
    } else {
      res.render('login', {
        host: `${process.env.HOST_NAME}:${process.env.HOST_PORT}`,
        applicationId: client_id,
      });
    }
  }

  async postAuthorize(data: LoginDto, query: OIDCAuthQuery, headers: object) {
    if (!data || !data.loginId || !data.password) {
      throw new BadRequestException({
        success: false,
        message: 'No data given',
      });
    }
    const { loginId, password } = data;
    const { client_id } = query;
    const application = await this.prismaService.application.findUnique({
      where: { id: client_id },
    });
    if (!application) {
      throw new BadRequestException({
        success: false,
        message: 'No such application exists',
      });
    }
    const user = await this.prismaService.user.findUnique({
      where: { email: loginId },
    });
    if (!user) {
      throw new BadRequestException({
        success: false,
        message: 'No such user exists',
      });
    }
    const authenticationToken = randomUUID();
    try {
      // use axios instead of prisma?
      const alreadyRegisterd =
        await this.prismaService.userRegistration.findUnique({
          where: {
            user_registrations_uk_1: {
              usersId: user.id,
              applicationsId: application.id,
            },
          },
        });
      if (!alreadyRegisterd) {
        const userRegistration =
          await this.prismaService.userRegistration.create({
            data: {
              applicationsId: application.id,
              authenticationToken,
              password,
              usersId: user.id,
            },
          });
        return {
          success: true,
          message: 'Authentication successfull',
          data: userRegistration.authenticationToken,
        };
      }

      this.logger.log('A user authenticated', user);
      return {
        success: true,
        message: 'Authentication successfull',
        data: alreadyRegisterd.authenticationToken,
      };
    } catch (error) {
      this.logger.log('Error from postAuthorize', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'Error occured while registering',
      });
    }
  }

  async returnToken(data: TokenDto, headers: object): Promise<ResponseDto> {
    if (headers['content-type'] !== 'application/x-www-form-urlencoded') {
      throw new BadRequestException({
        success: false,
        message: 'content-type should be application/x-www-form-urlencoded',
      });
    }
    const authorization = headers['authorization']?.split('Basic')[1];
    let client_id: string | null = null,
      client_secret: string | null = null;
    if (authorization) {
      const credentials = Buffer.from(authorization, 'base64').toString(
        'utf-8',
      );
      [client_id, client_secret] = credentials.split(':');
    }
    const { code, grant_type, redirect_uri } = data;
    if (!code || !grant_type || !redirect_uri) {
      throw new BadRequestException({
        success: false,
        message: 'either of code,grant_type,redirect_uri missing',
      });
    }
    if (!data) {
      throw new BadRequestException({
        success: false,
        message: 'No data given',
      });
    }
    const clientId = client_id ? client_id : data?.client_id;
    const clientSecret = client_secret ? client_secret : data?.client_secret;
    if (!clientId) {
      throw new BadRequestException({
        success: false,
        message:
          'Client id should be provided either via authorization header or data.client_id',
      });
    }
    const application = await this.prismaService.application.findUnique({
      where: { id: clientId },
    });
    if (!application) {
      throw new BadRequestException({
        success: false,
        message: 'No such application exists',
      });
    }
    const applicationData = JSON.parse(application.data);
    const actualSecret = applicationData?.clientSecret;
    if (clientSecret !== actualSecret) {
      throw new BadRequestException({
        success: false,
        message: 'No such client with given id and secret exists',
      });
    }

    // now generate tokens
    if (grant_type === 'code') {
      // for now only, as we can use password as well here
      const userRegistration =
        await this.prismaService.userRegistration.findFirst({
          where: { authenticationToken: code },
        }); // convert to unique and make schema unique as well
      if (!userRegistration) {
        throw new NotImplementedException({
          success: false,
          message:
            'You must be redirected to login/signup page, how ever it will be implemented later',
        });
        // redirect to login/signup page
      }
      const user = await this.prismaService.user.findUnique({
        where: { id: userRegistration.usersId },
      });
      const idTokenSigningKeysId = application.idTokenSigningKeysId;
      const accessTokenSigningKeysId = application.accessTokenSigningKeysId;

      const idTokenSigningKey = await this.prismaService.key.findUnique({
        where: { id: idTokenSigningKeysId },
      });
      const accessTokenSigningKey = await this.prismaService.key.findUnique({
        where: { id: accessTokenSigningKeysId },
      });
      const idTokenSecret = idTokenSigningKey.privateKey
        ? idTokenSigningKey.privateKey
        : idTokenSigningKey.secret;
      const accessTokenSecret = accessTokenSigningKey.privateKey
        ? accessTokenSigningKey.privateKey
        : accessTokenSigningKey.secret;
      const now = new Date().getTime();
      const idToken = jwt.sign(
        {
          user: { ...JSON.parse(user.data) },
          createdAt: now,
          expiryAt: now + 36000,
        },
        idTokenSecret,
        { algorithm: idTokenSigningKey.algorithm as jwt.Algorithm },
      );
      const refreshToken = jwt.sign(
        {
          createdAt: now,
          iss: 'Stencil',
          expiryAt: now + 3600,
        },
        accessTokenSecret,
        { algorithm: accessTokenSigningKey.algorithm as jwt.Algorithm },
      );
      // save the refreshToken
      const accessToken = jwt.sign(
        {
          roles: 'roles will come here',
          scopes: 'scopes will come here',
          createdAt: now,
          expiryAt: now + 360,
          iss: 'Stencil',
        },
        accessTokenSecret,
        { algorithm: accessTokenSigningKey.algorithm as jwt.Algorithm },
      );
      return {
        success: true,
        message: 'oAuth Complete',
        data: {
          idToken,
          accessToken,
          refreshToken,
          refreshTokenId: 'will add later',
          userId: user.id,
          token_type: 'Bearer',
        },
      };
    }
  }

  async returnAllPublicJwks() {
    const results = await this.prismaService.key.findMany();
    const filteredResults = results.map((result, i) => {
      delete result.privateKey;
      delete result.secret;
      return result;
    });
    console.log(results);
    return filteredResults;
  }

  async introspect(data: IntrospectDto, headers: object) {
    const contentType = headers['content-type'];
    if (contentType !== 'application/x-www-form-urlencoded') {
      throw new BadRequestException({
        success: false,
        message:
          'content-type header should be application/x-www-form-urlencoded',
      });
    }
    const authorization = headers['authorization']?.split('Basic')[1];
    let client_id: string | null = null,
      client_secret: string | null = null;
    if (authorization) {
      const credentials = Buffer.from(authorization, 'base64').toString(
        'utf-8',
      );
      [client_id, client_secret] = credentials.split(':');
    }
    if (!data) {
      throw new BadRequestException({
        success: false,
        message: 'No data given',
      });
    }
    const clientId = client_id ? client_id : data?.client_id;
    const clientSecret = client_secret ? client_secret : data?.client_secret;
    if (!clientId) {
      throw new BadRequestException({
        success: false,
        message:
          'Client id should be provided either via authorization header or data.client_id',
      });
    }
    const application = await this.prismaService.application.findUnique({
      where: { id: clientId },
    });
    if (!application) {
      throw new BadRequestException({
        success: false,
        message: 'No such application exists',
      });
    }
    const applicationData = JSON.parse(application.data);
    const actualSecret = applicationData?.clientSecret;
    if (clientSecret !== actualSecret) {
      throw new BadRequestException({
        success: false,
        message: 'No such client with given id and secret exists',
      });
    }
    if (!data.token) {
      throw new BadRequestException({
        success: false,
        message: 'token not given',
      });
    }
    const accessTokenSigningKey = await this.prismaService.key.findUnique({
      where: { id: application.accessTokenSigningKeysId },
    });
    const accessTokenSecret = accessTokenSigningKey.publicKey
      ? accessTokenSigningKey.publicKey
      : accessTokenSigningKey.secret;
    try {
      const validSign: jwt.JwtPayload | string = jwt.verify(
        data.token,
        accessTokenSecret,
      );
      const now = new Date().getTime();
      if ((validSign as jwt.JwtPayload).exp <= now) {
        return {
          active: false,
        };
      }
      return {
        success: true,
        message: 'Token is valid',
        data: validSign,
      };
    } catch (error) {
      return {
        active: false,
      };
    }
  }
}
