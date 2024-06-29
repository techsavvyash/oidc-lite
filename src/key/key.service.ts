import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { generateKeyDTO, updateDTO } from './key.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as jose from 'node-jose';
import * as jwkToPem from 'jwk-to-pem';
import { HeaderAuthService } from '../header-auth/header-auth.service';

@Injectable()
export class KeyService {
  private readonly logger: Logger;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly headerAuthService: HeaderAuthService,
  ) {
    this.logger = new Logger(KeyService.name);
  }

  async retrieveAllKey(headers: object) {
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      null,
      '/key',
      'GET',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    try {
      const item = await this.prismaService.key.findMany();
      if (!item) {
        return {
          success: false,
          message: 'no key is present',
        };
      } else {
        const result = item.map((key) => {
          delete key.secret;
          delete key.privateKey;
          return key;
        });
        return {
          success: true,
          message: 'all keys retrieved',
          data: result,
        };
      }
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'error while retrieving keys',
      });
    }
  }

  async retrieveUniqueKey(uuid: string, headers: object) {
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      null,
      '/key',
      'GET',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    if (!uuid) {
      throw new BadGatewayException({
        success: false,
        message: 'uuid  is not given',
      });
    }
    const id = uuid;
    try {
      const item = await this.prismaService.key.findUnique({ where: { id } });
      if (!item) {
        throw new HttpException(
          'key does not exist with provided id',
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        success: true,
        message: 'key id found',
        data: item,
      };
    } catch (error) {
      this.logger.log('error happened from retrieve key section ', error);
      HttpStatus.INTERNAL_SERVER_ERROR;
      throw new InternalServerErrorException({
        success: false,
        message: 'no such key exists',
      });
    }
  }

  async updateKey(uuid: string, data: updateDTO, headers: object) {
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      null,
      '/key',
      'GET',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    if (!uuid) {
      throw new BadRequestException({
        success: false,
        message: 'pls provide uuid and name with request',
      });
    }
    const id = uuid;
    const key = await this.prismaService.key.findUnique({ where: { id } });

    if (!key) {
      throw new BadRequestException({
        success: false,
        message: 'pls provide a valid id or ID does not exist ',
      });
    }

    const name = data.name ? data.name : key.name;

    const udpated_key = await this.prismaService.key.update({
      where: { id },
      data: {
        name,
      },
    });
    return {
      success: true,
      message: 'Keyset updated',
      data: udpated_key,
    };
  }

  async deleteKey(uuid: string, headers: object) {
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      null,
      '/key',
      'GET',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }
    if (!uuid) {
      throw new BadRequestException({
        success: false,
        message: 'uuid is either not given or is invalid',
      });
    }
    const id = uuid;
    const key = await this.prismaService.key.findUnique({ where: { id } });

    try {
      if (!key) {
        throw new HttpException(
          'key does not exist with given id',
          HttpStatus.NOT_FOUND,
        );
      }
      const deleted_key = await this.prismaService.key.delete({
        where: { id },
      });
      return {
        success: true,
        message: 'key deleted successfully',
        data: deleted_key,
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: 'error while deleting a key',
      });
    }
  }

  async generateKey(uuid: string, key: generateKeyDTO, headers: object) {
    const valid = await this.headerAuthService.authorizationHeaderVerifier(
      headers,
      null,
      '/key',
      'GET',
    );
    if (!valid.success) {
      throw new UnauthorizedException({
        success: valid.success,
        message: valid.message,
      });
    }

    if (!uuid) {
      throw new BadRequestException({
        success: false,
        message: 'uuid is either not given or is invalid',
      });
    }

    const { algorithm, name, length, issuer } = key;
    if (!algorithm || !name) {
      throw new BadRequestException({
        success: false,
        message: 'No algorithm and name provided for key',
      });
    }

    const keyStore = jose.JWK.createKeyStore();

    try {
      const keyData = await this.generateAndStoreKey(
        keyStore,
        algorithm,
        uuid,
        name,
        issuer,
      );
      return {
        success: true,
        message: 'key generated successfully',
        data: keyData.jwks,
        key: keyData.storedKey,
      };
    } catch (error) {
      this.logger.log('Error from generateKey', error);
      throw new BadRequestException({
        success: false,
        message: 'error while generating key',
      });
    }
  }

  private async generateAndStoreKey(
    keyStore: jose.JWK.KeyStore,
    algorithm: string,
    uuid: string,
    name: string,
    issuer: string,
  ) {
    let keyGenPromise;
    let keyType: string;
    let keyFields: any;

    switch (algorithm) {
      case 'RS256':
      case 'RS384':
      case 'RS512':
        const rsaBits = this.getRsaBits(algorithm);
        keyGenPromise = keyStore.generate('RSA', rsaBits, {
          alg: algorithm,
          use: 'sig',
        });
        keyType = 'RS';
        keyFields = (key: any) => ({
          privateKey: jwkToPem(key, { private: true }),
          publicKey: jwkToPem(key),
          data: JSON.stringify(this.removeSensitiveRSAFields(key)),
        });
        break;
      case 'ES256':
      case 'ES384':
      case 'ES512':
        const ecCurve = this.getEcCurve(algorithm);
        keyGenPromise = keyStore.generate('EC', ecCurve, {
          alg: algorithm,
          use: 'sig',
        });
        keyType = 'EC';
        keyFields = (key: any) => ({
          privateKey: jwkToPem(key, { private: true }),
          publicKey: jwkToPem(key),
          data: JSON.stringify(this.removeSensitiveECFields(key)),
        });
        break;
      default:
        throw new BadRequestException({
          success: false,
          message: 'Unknown algorithm provided',
        });
    }

    await keyGenPromise;
    const jwks = keyStore.toJSON(true);
    const key = jwks.keys[0];
    const fields = keyFields(key);

    const storedKey = await this.prismaService.key.create({
      data: {
        id: uuid,
        algorithm,
        name,
        issuer,
        kid: key.kid,
        ...fields,
        type: keyType,
      },
    });

    this.logger.log(
      `${keyType} key generated successfully`,
      fields.publicKey,
      fields.privateKey,
    );
    return { jwks, storedKey };
  }

  private getRsaBits(algorithm: string): number {
    switch (algorithm) {
      case 'RS256':
        return 2048;
      case 'RS384':
        return 3072;
      case 'RS512':
        return 4096;
      default:
        throw new BadRequestException({
          success: false,
          message: 'Unknown RSA algorithm provided',
        });
    }
  }

  private getEcCurve(algorithm: string): string {
    switch (algorithm) {
      case 'ES256':
        return 'P-256';
      case 'ES384':
        return 'P-384';
      case 'ES512':
        return 'P-521';
      default:
        throw new BadRequestException({
          success: false,
          message: 'Unknown EC algorithm provided',
        });
    }
  }

  private removeSensitiveRSAFields(key: any) {
    const { d, p, q, dp, dq, qi, ...publicFields } = key;
    return publicFields;
  }

  private removeSensitiveECFields(key: any) {
    const { d, ...publicFields } = key;
    return publicFields;
  }
}
