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
      })
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
      if (algorithm === 'RS256') {
        await keyStore
          .generate('RSA', 2048, { alg: 'RS256', use: 'sig' })
          .then(() => {
            const rskey = JSON.stringify(keyStore.toJSON(true), null, 2);
            this.logger.log('RS key generated successfully');
          });
        const jwks = keyStore.toJSON(true);
        const publicKeyPem = jwkToPem(jwks.keys[0]);
        const privateKeyPem = jwkToPem(jwks.keys[0], { private: true });
        delete jwks.keys[0].d;
        delete jwks.keys[0].p;
        delete jwks.keys[0].q;
        delete jwks.keys[0].dp;
        delete jwks.keys[0].dq;
        delete jwks.keys[0].qi;
        const key = await this.prismaService.key.create({
          data: {
            id: uuid,
            algorithm,
            name,
            issuer,
            kid: jwks.keys[0].kid,
            privateKey: privateKeyPem,
            publicKey: publicKeyPem,
            type: 'RS',
            data: JSON.stringify(jwks.keys[0]),
          },
        });
        this.logger.log(
          'RS key generated successfully',
          publicKeyPem,
          privateKeyPem,
        );

        return {
          success: true,
          message: 'key generated successfully',
          data: jwks,
          key: key,
        };
      } else if (algorithm === 'ES256') {
        await keyStore
          .generate('EC', 'P-256', { alg: 'ES256', use: 'sig' })
          .then(() => {
            const eckey = JSON.stringify(keyStore.toJSON(true), null, 2);
          });
        const jwks = keyStore.toJSON(true);
        const publicKeyPem = jwkToPem(jwks.keys[0]);
        const privateKeyPem = jwkToPem(jwks.keys[0], { private: true });
        delete jwks.keys[0].d;
        const key = await this.prismaService.key.create({
          data: {
            id: uuid,
            algorithm,
            name,
            issuer,
            kid: jwks.keys[0].kid,
            privateKey: privateKeyPem,
            publicKey: publicKeyPem,
            type: 'EC',
            data: JSON.stringify(jwks.keys[0]),
          },
        });
        this.logger.log(
          'EC key generated successfully',
          publicKeyPem,
          privateKeyPem,
        );

        return {
          success: true,
          message: 'key generated successfully',
          data: jwks,
          key: key,
        };
      } else if (algorithm === 'HS256') { // gotta remove?
        await keyStore
          .generate('oct', 256, { alg: 'HS256', use: 'sig' })
          .then(() => {
            const hskey = JSON.stringify(keyStore.toJSON(true), null, 2);
            this.logger.log('HS key generated successfully');
          });
        const jwks = keyStore.toJSON(true);
        const key = await this.prismaService.key.create({
          data: {
            id: uuid,
            algorithm,
            name,
            issuer,
            kid: jwks.keys[0].kid,
            secret: jwks.keys[0].k,
            type: 'HS',
            data: JSON.stringify({
              kty: jwks.keys[0].kty,
              alg: jwks.keys[0].alg,
              kid: jwks.keys[0].kid,
              use: jwks.keys[0].sig,
            }),
          },
        });
        this.logger.log('HS key generated successfully', jwks.keys[0].k);
        return {
          success: true,
          message: 'key generated successfully',
          data: jwks,
          key: key,
        };
      } else {
        throw new BadRequestException({
          success: false,
          message: 'Unknown algorithm provided',
        });
      }
    } catch (error) {
      this.logger.log('Error from generateKey', error);
      throw new BadRequestException({
        success: false,
        message: 'error while generating key',
      });
    }
  }
}
