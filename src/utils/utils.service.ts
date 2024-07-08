import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as https from 'https';
import {
  AccessTokenDto,
  IdTokenDto,
  RefreshTokenDto,
} from '../oidc/dto/oidc.token.dto';
import { KeyDto } from '../key/key.dto';
import { ApplicationDataDto } from '../application/application.dto';

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
    refreshToken: string,
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
        where: { id: oldRefreshToken.id },
        data: {
          token: refreshToken,
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
        token: refreshToken,
        tenantId,
        data: additionalData,
        expiry,
        startInstant,
      },
    });
  }

  private async getPublicKey_private(hostname: string): Promise<string> {
    let pubKeyInPem = '';
    return new Promise((resolve, reject) => {
      const options = {
        hostname: hostname,
        port: 443,
        path: '/health',
        method: 'GET',
        agent: new https.Agent({
          checkServerIdentity: (hostname, cert) => {
            const rawCert = cert.raw.toString('base64');
            const pemCert = `-----BEGIN CERTIFICATE-----\n${rawCert.match(/.{1,64}/g).join('\n')}\n-----END CERTIFICATE-----`;
            const pubKey = crypto.createPublicKey(pemCert);
            const pubKeyPem = pubKey
              .export({ type: 'spki', format: 'pem' })
              .toString()
              .trim();
            pubKeyInPem = pubKeyPem;
            return undefined;
          },
        }),
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve(pubKeyInPem);
        });
      });

      req.on('error', (e) => {
        reject(e);
      });

      req.end();
    });
  }

  async getPublicKey(hostname: string) {
    try {
      const val = await this.getPublicKey_private(hostname);
      return {
        success: true,
        message: 'Public key extracted',
        data: val,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        success: false,
        message: 'Unable to extract public key',
      };
    }
  }

  async checkHostPublicKeyWithSavedPublicKeys(
    forwardedHost: string | string[],
    hostname: string,
    applicationId: string,
  ): Promise<boolean> {
    try {
      const application = await this.prismaService.application.findUnique({
        where: { id: applicationId },
      });
      const applicationData: ApplicationDataDto = JSON.parse(application.data);
      const urls = applicationData.oauthConfiguration.authorizedOriginURLs;
      if (urls.includes('*')) return true; // allowed from anywhere
      const hostsToCheck = forwardedHost
        ? Array.isArray(forwardedHost)
          ? forwardedHost
          : [forwardedHost]
        : [hostname];

      for (const host of hostsToCheck) {
        const data = await this.getPublicKey(host);
        if (data.success) {
          const publicKey = data.data;
          const pubKey = await this.prismaService.publicKeys.findFirst({
            where: { applicationId, publicKey },
          });
          if (pubKey) {
            return true;
          }
        }
      }

      throw new Error('Unauthorized access attempt');
    } catch (error) {
      this.logger.log(
        `Unauthorized access attempt on ${applicationId} by ${hostname}`,
      );
      return false;
    }
  }

  async returnRolesForAGivenUserIdAndTenantId(
    userId: string,
    tenantId: string,
  ) {
    const tenant = await this.prismaService.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) return null;
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) return null;
    const membership = await this.prismaService.groupMember.findMany({
      where: { userId },
    });
    const groupIds = membership.map((member) => member.groupId);
    const filterGroupIds = await Promise.all(
      groupIds.map(async (groupId) => {
        const group = await this.prismaService.group.findUnique({
          where: { id: groupId, tenantId },
        });
        if (group) return group.id;
        return null;
      }),
    );
    const removeNullGroupIds = filterGroupIds.filter((i) => i);
    const roleIds = await Promise.all(
      removeNullGroupIds.map(async (groupId) => {
        const groupApplicationRole =
          await this.prismaService.groupApplicationRole.findMany({
            where: { groupsId: groupId },
          });
        return groupApplicationRole.map((role) => role.applicationRolesId);
      }),
    );
    const flatRoleIds = roleIds.flat();
    return flatRoleIds;
  }

  async returnRolesForAGivenUserIdAndApplicationId(
    userId: string,
    applicationId: string,
  ) {
    const application = await this.prismaService.application.findUnique({
      where: { id: applicationId },
    });
    if (!application) return null;
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) return null;
    const rolesInTenant = await this.returnRolesForAGivenUserIdAndTenantId(
      userId,
      application.tenantId,
    );
    const roles = await Promise.all(
      rolesInTenant.map(async (roleId) => {
        const role = await this.prismaService.applicationRole.findUnique({
          where: { id: roleId, applicationsId: application.id },
        });
        if (role) return role.id;
        return null;
      }),
    );
    const filterRoles = roles.filter((i) => i);
    const defaultRoles = await this.prismaService.applicationRole.findMany({
      where: { applicationsId: applicationId, isDefault: true },
    });
    const defaultRoleIds = defaultRoles.map((role) => role.id);
    const combinedRoles = [...new Set([...filterRoles, ...defaultRoleIds])];
    return combinedRoles;
  }

  async returnScopesForAGivenApplicationId(applicationId: string) {
    const scopesData = await this.prismaService.applicationOauthScope.findMany({
      where: { applicationsId: applicationId },
    });
    const scope = scopesData.map((scope) => scope.name);
    return scope;
  }
}
