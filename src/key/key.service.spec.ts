// HAS FILE ERRORS

import { Test, TestingModule } from '@nestjs/testing';
import { KeyService } from './key.service';
import { PrismaService } from '../prisma/prisma.service';
import { HeaderAuthService } from '../header-auth/header-auth.service';
import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import * as jose from 'node-jose';
import * as jwkToPem from 'jwk-to-pem';

describe('KeyService', () => {
  let service: KeyService;
  let prismaService: PrismaService;
  let headerAuthService: HeaderAuthService;

  const mockHeaderKey = {
    id: 'id',
    createdAt: new Date(),
    updatedAt: new Date(),
    keyManager: false,
    keyValue: 'string',
    permissions: 'string',
    metaData: 'string',
    tenantsId: 'string',
  };
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
    data: 'exampleData',
  };

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
        // jose,
        // jwkToPem,
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
          data: 'exampleData',
        },
      ];
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({
          success: true,
          message: 'Authorized',
          data: mockHeaderKey,
        });
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

    it('should throw InternalServerException status if error occurs', async () => {
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({
          success: true,
          message: 'Authorized',
          data: mockHeaderKey,
        });
      jest.spyOn(prismaService.key, 'findMany').mockImplementation(() => {
        throw new InternalServerErrorException({
          success: false,
          message: 'error while retrieving keys',
        });
      });

      await expect(
        service.retrieveAllKey({ authorization: 'valid-token' }),
      ).rejects.toThrow(InternalServerErrorException);
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
        .mockResolvedValue({
          success: true,
          message: 'Authorized',
          data: mockHeaderKey,
        });

      await expect(
        service.retrieveUniqueKey('', { authorization: 'valid-token' }),
      ).rejects.toThrow(BadGatewayException);
    });

    it('should return key if found', async () => {
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({
          success: true,
          message: 'Authorized',
          data: mockHeaderKey,
        });
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
        .mockResolvedValue({
          success: true,
          message: 'Authorized',
          data: mockHeaderKey,
        });
      jest.spyOn(prismaService.key, 'findUnique').mockResolvedValue(null);

      await expect(
        service.retrieveUniqueKey('1', { authorization: 'valid-token' }),
      ).rejects.toThrow(HttpException);
    });

    it('should log error and throw InternalServerErrorException if error occurs', async () => {
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({
          success: true,
          message: 'Authorized',
          data: mockHeaderKey,
        });
      jest.spyOn(prismaService.key, 'findUnique').mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(
        service.retrieveUniqueKey('1', { authorization: 'valid-token' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('updateKey', () => {
    it('should throw UnauthorizedException if authorization header is invalid', async () => {
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({ success: false, message: 'Unauthorized' });

      await expect(
        service.updateKey(
          'uuid',
          { name: 'updatedKeyName' },
          {
            authorization: 'invalid-token',
          },
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if uuid is not provided', async () => {
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({
          success: true,
          message: 'Authorized',
          data: mockHeaderKey,
        });

      await expect(
        service.updateKey(
          null,
          { name: 'updatedKeyName' },
          {
            authorization: 'valid-token',
          },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if key is not found', async () => {
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({
          success: true,
          message: 'Authorized',
          data: mockHeaderKey,
        });
      jest.spyOn(prismaService.key, 'findUnique').mockResolvedValue(null);

      await expect(
        service.updateKey(
          'uuid',
          { name: 'updatedKeyName' },
          {
            authorization: 'valid-token',
          },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update key if valid data is provided', async () => {
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({
          success: true,
          message: 'Authorized',
          data: mockHeaderKey,
        });
      jest.spyOn(prismaService.key, 'findUnique').mockResolvedValue(mockKey);
      const mockUpdate = jest
        .spyOn(prismaService.key, 'update')
        .mockResolvedValue(mockKey);

      const result = await service.updateKey(
        'uuid',
        { name: 'updatedKeyName' },
        { authorization: 'valid-token' },
      );

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'uuid' },
        data: { name: 'updatedKeyName' },
      });
      expect(result).toEqual({
        success: true,
        message: 'Keyset updated',
        data: mockKey,
      });
    });
  });

  describe('deleteKey', () => {
    it('should throw UnauthorizedException if authorization header is invalid', async () => {
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({ success: false, message: 'Unauthorized' });

      await expect(
        service.deleteKey('uuid', { authorization: 'invalid-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if uuid is not provided', async () => {
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({
          success: true,
          message: 'Authorized',
          data: mockHeaderKey,
        });

      await expect(
        service.deleteKey('', { authorization: 'valid-token' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw HttpException if key is not found', async () => {
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({
          success: true,
          message: 'Authorized',
          data: mockHeaderKey,
        });
      jest.spyOn(prismaService.key, 'findUnique').mockResolvedValue(null);

      await expect(
        service.deleteKey('uuid', { authorization: 'valid-token' }),
      ).rejects.toThrow(HttpException);
    });

    it('should delete key if it exists', async () => {
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({
          success: true,
          message: 'Authorized',
          data: mockHeaderKey,
        });
      jest.spyOn(prismaService.key, 'findUnique').mockResolvedValue(mockKey);
      const mockDelete = jest
        .spyOn(prismaService.key, 'delete')
        .mockResolvedValue(mockKey);

      const result = await service.deleteKey('uuid', {
        authorization: 'valid-token',
      });

      expect(mockDelete).toHaveBeenCalledWith({
        where: { id: 'uuid' },
      });
      expect(result).toEqual({
        success: true,
        message: 'key deleted successfully',
        data: mockKey,
      });
    });
  });

  describe('generateKey', () => {
    const mockGenerateKeyDTO = {
      algorithm: 'RS256',
      issuer: 'issuer',
      name: 'keyName',
      length: 2048,
    };

    it('should throw UnauthorizedException if authorization header is invalid', async () => {
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({ success: false, message: 'Unauthorized' });

      await expect(
        service.generateKey('uuid', mockGenerateKeyDTO, {
          authorization: 'invalid-token',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if uuid is not provided', async () => {
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({
          success: true,
          message: 'Authorized',
          data: mockHeaderKey,
        });

      await expect(
        service.generateKey('', mockGenerateKeyDTO, {
          authorization: 'valid-token',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if algorithm or name is not provided', async () => {
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({
          success: true,
          message: 'Authorized',
          data: mockHeaderKey,
        });

      await expect(
        service.generateKey(
          'uuid',
          {
            algorithm: 'RS256',
            issuer: 'issuer',
            name: null,
            length: 2048,
          },
          {
            authorization: 'valid-token',
          },
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.generateKey(
          'uuid',
          {
            algorithm: null,
            issuer: 'issuer',
            name: 'keyName',
            length: 2048,
          },
          {
            authorization: 'valid-token',
          },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should generate RS256 / ES256 / HS256 key', async () => {
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({
          success: true,
          message: 'Authorized',
          data: mockHeaderKey,
        });

      const mockCreate = jest
        .spyOn(prismaService.key, 'create')
        .mockResolvedValue(mockKey);

      const result = await service.generateKey('uuid', mockGenerateKeyDTO, {
        authorization: 'valid-token',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          algorithm: expect.any(String),
          id: expect.any(String),
          issuer: expect.any(String),
          kid: expect.any(String),
          name: expect.any(String),
          privateKey: expect.any(String),
          publicKey: expect.any(String),
          type: expect.any(String),
        }),
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('key generated successfully');
      expect(result.key).toMatchObject(mockKey);
    });
  });
});

// UNIT TESTS : KEY SERVICE
// -------------------------
// Test 1: Retrieve all keys
//     - It should throw UnauthorizedException if authorization header is invalid
//     - It should return all keys retrieved
//     - It should throw InternalServerException status if error occurs
// Test 2: Retrieve unique key
//     - It should throw UnauthorizedException if authorization header is invalid
//     - It should throw BadGatewayException if uuid is not provided
//     - It should return key if found
//     - It should throw HttpException if key is not found
//     - It should log error and throw InternalServerErrorException if error occurs
// Test 3: Update key
//     - It should throw UnauthorizedException if authorization header is invalid
//     - It should throw BadRequestException if uuid is not provided
//     - It should throw BadRequestException if key is not found
//     - It should update key if valid data is provided
// Test 4: Delete key
//     - It should throw UnauthorizedException if authorization header is invalid
//     - It should throw BadRequestException if uuid is not provided
//     - It should throw HttpException if key is not found
//     - It should delete key if it exists
// Test 5: Generate key
//     - It should throw UnauthorizedException if authorization header is invalid
//     - It should throw BadRequestException if uuid is not provided
//     - It should throw BadRequestException if algorithm or name is not provided
//     - It should generate RS256 / ES256 / HS256 key
// -------------------------
