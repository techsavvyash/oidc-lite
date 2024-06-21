// HAS FILE ERRORS

import { Test, TestingModule } from '@nestjs/testing';
import { KeyService } from './key.service';
import { PrismaService } from '../prisma/prisma.service';
import { HeaderAuthService } from '../header-auth/header-auth.service';
import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import * as jose from 'node-jose';
import * as jwkToPem from 'jwk-to-pem';

describe('KeyService', () => {
  let service: KeyService;
  let prismaService: PrismaService;
  let headerAuthService: HeaderAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeyService,
        {
          provide: PrismaService,
          useValue: {
            key: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: HeaderAuthService,
          useValue: {
            authorizationHeaderVerifier: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<KeyService>(KeyService);
    prismaService = module.get<PrismaService>(PrismaService);
    headerAuthService = module.get<HeaderAuthService>(HeaderAuthService);
  });

  describe('retrieveAllKey', () => {
    it('should throw UnauthorizedException if authorization header is invalid', async () => {
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({ success: false, message: 'Unauthorized' });

      await expect(
        service.retrieveAllKey({ authorization: 'invalid-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return all keys retrieved', async () => {
      const mockKeys = [
        {
          id: '1',
          algorithm: 'RS256',
          certificate: 'mockCertificate1',
          expiry: 1681942800,
          createdAt: new Date(),
          issuer: 'Issuer1',
          kid: 'kid1',
          updatedAt: new Date(),
          name: 'KeyName1',
          privateKey: 'mockPrivateKey1',
          publicKey: 'mockPublicKey1',
          secret: 'mockSecret1',
          type: 'RSA',
        },
      ];
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({ success: true });
      jest.spyOn(prismaService.key, 'findMany').mockResolvedValue(mockKeys);

      const result = await service.retrieveAllKey({
        authorization: 'valid-token',
      });

      expect(result).toEqual({
        success: true,
        message: 'all keys retrieved',
        data: mockKeys.map((key) => {
          delete key.secret;
          delete key.privateKey;
          return key;
        }),
      });
    });

    it('should log error and return NOT_FOUND status if error occurs', async () => {
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({ success: true });
      jest.spyOn(prismaService.key, 'findMany').mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(
        service.retrieveAllKey({ authorization: 'valid-token' }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('retrieveUniqueKey', () => {
    it('should throw UnauthorizedException if authorization header is invalid', async () => {
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({ success: false, message: 'Unauthorized' });

      await expect(
        service.retrieveUniqueKey('uuid', { authorization: 'invalid-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadGatewayException if uuid is not provided', async () => {
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({ success: true });

      await expect(
        service.retrieveUniqueKey('', { authorization: 'valid-token' }),
      ).rejects.toThrow(BadGatewayException);
    });

    it('should return key if found', async () => {
      const mockKey = {
        id: '1',
        algorithm: 'RS256',
        certificate: 'mockCertificate1',
        expiry: 1681942800,
        createdAt: new Date(),
        issuer: 'Issuer1',
        kid: 'kid1',
        updatedAt: new Date(),
        name: 'KeyName1',
        privateKey: 'mockPrivateKey1',
        publicKey: 'mockPublicKey1',
        secret: 'mockSecret1',
        type: 'RSA',
      };
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({ success: true });
      jest.spyOn(prismaService.key, 'findUnique').mockResolvedValue(mockKey);

      const result = await service.retrieveUniqueKey('1', {
        authorization: 'valid-token',
      });

      expect(result).toEqual({
        success: true,
        message: 'key id found',
        data: mockKey,
      });
    });

    it('should throw HttpException if key is not found', async () => {
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({ success: true });
      jest.spyOn(prismaService.key, 'findUnique').mockResolvedValue(null);

      await expect(
        service.retrieveUniqueKey('1', { authorization: 'valid-token' }),
      ).rejects.toThrow(HttpException);
    });

    it('should log error and throw InternalServerErrorException if error occurs', async () => {
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({ success: true });
      jest.spyOn(prismaService.key, 'findUnique').mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(
        service.retrieveUniqueKey('1', { authorization: 'valid-token' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // Add similar tests for updateKey, deleteKey, generateKey methods
});
