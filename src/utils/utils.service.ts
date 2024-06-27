import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import {
  AccessTokenDto,
  IdTokenDto,
  RefreshTokenDto,
} from 'src/oidc/dto/oidc.token.dto';
import { KeyDto } from 'src/key/key.dto';

@Injectable()
export class UtilsService {
  private readonly logger: Logger;
  private readonly saltRounds = 10;
  constructor(private readonly prismaService: PrismaService) {
    this.logger = new Logger(UtilsService.name);
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  }

  async comparePasswords(
    password: string,
    savedPasswordInHash: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, savedPasswordInHash);
  }

  async checkValidityOfToken(token: string, verifier: string, type: string) {
    if (type === 'refresh') {
      const tokenData = await this.prismaService.refreshToken.findUnique({
        where: { token },
      });
      if (!tokenData) {
        return {
          active: false,
        };
      }
    } else if (type !== 'access' && type !== 'id') {
      return {
        active: false,
      };
    }
    try {
      const tokenVerify = jwt.verify(token, verifier);
      const now = Math.floor(Date.now() / 1000);
      if ((tokenVerify as jwt.JwtPayload).exp <= now) {
        return {
          active: false,
        };
      }
      return {
        ...(tokenVerify as jwt.JwtPayload),
      };
    } catch (error) {
      return {
        active: false,
      };
    }
  }

  private async signToken(
    payload: IdTokenDto | AccessTokenDto | RefreshTokenDto,
    signingKey: KeyDto,
  ) {
    try {
      const secret = signingKey.privateKey
        ? signingKey.privateKey
        : signingKey.secret;
      return jwt.sign(payload, secret, {
        algorithm: signingKey.algorithm as jwt.Algorithm,
        header: {
          typ: 'JWT',
          alg: signingKey.algorithm,
          kid: signingKey.kid,
        },
      });
    } catch (error) {
      this.logger.log(error);
      return null;
    }
  }

  async createToken(
    payload: AccessTokenDto | RefreshTokenDto | IdTokenDto,
    applicationId: string,
    tenantId: string,
    type: 'id' | 'access' | 'refresh',
  ) {
    const application = await this.prismaService.application.findUnique({
      where: { id: applicationId },
    });
    const accessTokenSigningKeyId = application.accessTokenSigningKeysId;
    const idTokenSigningKeysId = application.idTokenSigningKeysId;
    const accessTokenSigningKey = await this.prismaService.key.findUnique({
      where: { id: accessTokenSigningKeyId },
    });
    const idTokenSigningKey = await this.prismaService.key.findUnique({
      where: { id: idTokenSigningKeysId },
    });
    if (type === 'id') {
      return await this.signToken(payload as IdTokenDto, idTokenSigningKey);
    } else if (type === 'access') {
      return await this.signToken(
        payload as AccessTokenDto,
        accessTokenSigningKey,
      );
    } else if (type === 'refresh') {
      return await this.signToken(
        payload as RefreshTokenDto,
        accessTokenSigningKey,
      );
    }
  }

  async saveOrUpdateRefreshToken(
    applicationId: string,
    token: string,
    userId: string,
    tenantId: string,
    additionalData: string,
    startInstant: number,
    expiry: number,
  ) {
    const oldRefreshToken = await this.prismaService.refreshToken.findUnique({
      where: {
        unique_applications_users_uk_1: {
          applicationsId: applicationId,
          usersId: userId,
        },
      },
    });
    if (oldRefreshToken) {
      return await this.prismaService.refreshToken.update({
        where: {id: oldRefreshToken.id},
        data: {
          token,
          data: additionalData,
          startInstant,
          expiry,
        },
      });
    }
    return await this.prismaService.refreshToken.create({
      data: {
        applicationsId: applicationId,
        usersId: userId,
        token,
        tenantId,
        data: additionalData,
        expiry,
        startInstant,
      },
    });
  }
}
