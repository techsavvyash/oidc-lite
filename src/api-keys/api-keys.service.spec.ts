import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        { 
          provide: PrismaService, 
          useValue: {
            authenticationKey: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            tenant: {
              findUnique: jest.fn(),
            },
          }
        },
      ],
    }).compile();

    service = module.get<ApiKeysService>(ApiKeysService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('createAnApiKey', () => {
    it('should throw BadRequestException if authorization header is missing', async () => {
      await expect(
        service.createAnApiKey(
          'id',
          { key: 'key', permissions: { endpoints: [] } },
          {}, // missing authorization header
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedEnauthorized', async () => {
      jest.spyOn(prismaService.authenticationKey, 'findUnique').mockResolvedValue(null);

      await expect(
        service.createAnApiKey(
          'id',
          { key: 'key', permissions: { endpoints: [] } },
          { authorization: 'token' },
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if id is not provided', async () => {

      const mockFindUniqueRes = {
        id: "string",
        createdAt: new Date(),
        updatedAt: new Date(),
        keyManager: true,
        keyValue: "string",
        permissions: "string",
        metaData: "string",
        tenantsId: "string"
      }

      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue(mockFindUniqueRes);

      await expect(
        service.createAnApiKey(
          null,
          { key: 'key', permissions: { endpoints: [] } },
          { authorization: 'token' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if the key already exists', async () => {
      const mockFindUniqueRes = {
        id: 'id',
        createdAt: new Date(),
        updatedAt: new Date(),
        keyManager: true,
        keyValue: 'string',
        permissions: 'string',
        metaData: 'string',
        tenantsId: 'string',
      };
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue(mockFindUniqueRes);

      await expect(
        service.createAnApiKey(
          'id',
          { key: 'key', permissions: { endpoints: [] } },
          { authorization: 'token' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if data is not provided', async () => {
      const mockFindUniqueRes = {
        id: 'id',
        createdAt: new Date(),
        updatedAt: new Date(),
        keyManager: true,
        keyValue: 'string',
        permissions: 'string',
        metaData: 'string',
        tenantsId: 'string',
      };
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue(mockFindUniqueRes);

      await expect(
        service.createAnApiKey('id', null, { authorization: 'token' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if the key with the provided id already exists', async () => {
      const mockFindUniqueRes = {
        id: 'id',
        createdAt: new Date(),
        updatedAt: new Date(),
        keyManager: true,
        keyValue: 'string',
        permissions: 'string',
        metaData: 'string',
        tenantsId: 'string',
      };
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue(mockFindUniqueRes);

      await expect(
        service.createAnApiKey(
          'id',
          { key: 'key', permissions: { endpoints: [] } },
          { authorization: 'token' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if the tenant with the given tenant id does not exist', async () => {
      const mockFindUniqueRes = {
        id: 'id',
        createdAt: new Date(),
        updatedAt: new Date(),
        keyManager: true,
        keyValue: 'string',
        permissions: 'string',
        metaData: 'string',
        tenantsId: 'string',
      };
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue(mockFindUniqueRes);
      jest
        .spyOn(prismaService.tenant, 'findUnique')
        .mockResolvedValue(null);

      await expect(
        service.createAnApiKey(
          'id',
          { key: 'key', permissions: { endpoints: [] }, tenantId: 'id' },
          { authorization: 'token' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create an API key successfully', async () => {
      const mockFindUniqueRes = {
        id: 'id',
        createdAt: new Date(),
        updatedAt: new Date(),
        keyManager: true,
        keyValue: 'string',
        permissions: 'string',
        metaData: 'string',
        tenantsId: 'string',
      };
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValueOnce(mockFindUniqueRes);
      jest
        .spyOn(prismaService.authenticationKey, 'create')
        .mockResolvedValue(mockFindUniqueRes);

      const result = await service.createAnApiKey(
        'id',
        { key: 'key', permissions: { endpoints: [] } },
        { authorization: 'token' },
      );

      expect(result).toEqual({
        success: true,
        message: 'Api key successfully generated',
        data: mockFindUniqueRes,
      });
    });
  });

  describe('returnAnApiKey', () => {
    it('should throw BadRequestException if authorization header is missing', async () => {
      await expect(service.returnAnApiKey('id', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException if the key manager is not found or is unauthorized', async () => {
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue(null);

      await expect(
        service.returnAnApiKey('id', { authorization: 'token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if id is not provided', async () => {
      const mockFindUniqueRes = {
        id: 'id',
        createdAt: new Date(),
        updatedAt: new Date(),
        keyManager: true,
        keyValue: 'string',
        permissions: 'string',
        metaData: 'string',
        tenantsId: 'string',
      };
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue(mockFindUniqueRes);

      await expect(service.returnAnApiKey(null, { authorization: 'token' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return an API key successfully', async () => {
      const mockFindUniqueRes = {
        id: 'id',
        createdAt: new Date(),
        updatedAt: new Date(),
        keyManager: true,
        keyValue: 'string',
        permissions: 'string',
        metaData: 'string',
        tenantsId: 'string',
      };
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue(mockFindUniqueRes);
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue(mockFindUniqueRes);

      const result = await service.returnAnApiKey('id', {
        authorization: 'token',
      });

      expect(result).toEqual({
        success: true,
        message: 'Found the requested key',
        data: mockFindUniqueRes,
      });
    });
  });

  describe('updateAnApiKey', () => {
    it('should throw BadRequestException if authorization header is missing', async () => {
      await expect(service.updateAnApiKey('id', {}, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException if the headerKey is not found or is unauthorized', async () => {
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue(null);

      await expect(
        service.updateAnApiKey('id', {}, { authorization: 'token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if id is not provided', async () => {
      const mockFindUniqueRes = {
        id: 'id',
        createdAt: new Date(),
        updatedAt: new Date(),
        keyManager: true,
        keyValue: 'string',
        permissions: 'string',
        metaData: 'string',
        tenantsId: 'string',
      };
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue(mockFindUniqueRes);

      await expect(
        service.updateAnApiKey(null, {}, { authorization: 'token' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if data is not provided', async () => {
      const mockFindUniqueRes = {
        id: 'id',
        createdAt: new Date(),
        updatedAt: new Date(),
        keyManager: true,
        keyValue: 'string',
        permissions: 'string',
        metaData: 'string',
        tenantsId: 'string',
      };
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue(mockFindUniqueRes);

      await expect(
        service.updateAnApiKey('id', null, { authorization: 'token' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if the key with the provided id does not exist', async () => {
      const mockFindUniqueRes = {
        id: 'id',
        createdAt: new Date(),
        updatedAt: new Date(),
        keyManager: true,
        keyValue: 'string',
        permissions: 'string',
        metaData: 'string',
        tenantsId: 'string',
      };
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValueOnce(mockFindUniqueRes)
        .mockResolvedValue(null);

      await expect(
        service.updateAnApiKey('id', {}, { authorization: 'token' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update an API key successfully', async () => {
      const mockFindUniqueRes = {
        id: 'id',
        createdAt: new Date(),
        updatedAt: new Date(),
        keyManager: true,
        keyValue: 'string',
        permissions: 'string',
        metaData: 'string',
        tenantsId: 'string',
      };
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue(mockFindUniqueRes);
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue(mockFindUniqueRes);
      jest
        .spyOn(prismaService.authenticationKey, 'update')
        .mockResolvedValue(mockFindUniqueRes);

      const result = await service.updateAnApiKey(
        'id',
        {},
        { authorization: 'token' },
      );

      expect(result).toEqual({
        success: true,
        message: 'Key updated successfully',
        data: mockFindUniqueRes,
      });
    });
  });

  describe('deleteAnApiKey', () => {
    it('should throw BadRequestException if authorization header is missing', async () => {
      await expect(service.deleteAnApiKey('id', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException if the key manager is not found or is unauthorized', async () => {
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue(null);

      await expect(
        service.deleteAnApiKey('id', { authorization: 'token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should delete an API key successfully', async () => {
      const mockFindUniqueRes = {
        id: 'id',
        createdAt: new Date(),
        updatedAt: new Date(),
        keyManager: true,
        keyValue: 'string',
        permissions: 'string',
        metaData: 'string',
        tenantsId: 'string',
      };
      jest
        .spyOn(prismaService.authenticationKey, 'findUnique')
        .mockResolvedValue(mockFindUniqueRes);
      jest
        .spyOn(prismaService.authenticationKey, 'delete')
        .mockResolvedValue(mockFindUniqueRes);

      const result = await service.deleteAnApiKey('id', {
        authorization: 'token',
      });

      expect(result).toEqual({
        success: true,
        message: 'successfully deleted apiKey',
        data: mockFindUniqueRes,
      });
    });
  });
});


// API KEYS SERVICE : TESTS
// ------------------------
// - createAnApiKey
//  - should throw BadRequestException if authorization header is missing
//  - should throw UnauthorizedEnauthorized
//  - should throw BadRequestException if id is not provided
//  - should throw BadRequestException if the key already exists
//  - should throw BadRequestException if data is not provided
//  - should throw BadRequestException if the key with the provided id already exists
//  - should throw BadRequestException if the tenant with the given tenant id does not exist
//  - should create an API key successfully
// 
// - returnAnApiKey
//  - should throw BadRequestException if authorization header is missing
//  - should throw UnauthorizedException if the key manager is not found or is unauthorized
//  - should throw BadRequestException if id is not provided
//  - should return an API key successfully
//  
// - updateAnApiKey
//  - should throw BadRequestException if authorization header is missing
//  - should throw UnauthorizedException if the headerKey is not found or is unauthorized
//  - should throw BadRequestException if id is not provided
//  - should throw BadRequestException if data is not provided
//  - should throw BadRequestException if the key with the provided id does not exist
//  - should update an API key successfully
//
// - deleteAnApiKey
//  - should throw BadRequestException if authorization header is missing
//  - should throw UnauthorizedException if the key manager is not found or is unauthorized
//  - should delete an API key successfully