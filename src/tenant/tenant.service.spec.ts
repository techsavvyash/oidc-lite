import { Test, TestingModule } from '@nestjs/testing';
import { TenantService } from './tenant.service';
import { PrismaService } from '../prisma/prisma.service';
import { HeaderAuthService } from '../header-auth/header-auth.service';
import { KeyService } from '../key/key.service';
import {
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateTenantDto, UpdateTenantDto } from './tenant.dto';

describe('TenantService', () => {
  let service: TenantService;
  let prismaService: PrismaService;
  let headerAuthService: HeaderAuthService;

  const mockPrismaService = {
    tenant: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    key: {
      findUnique: jest.fn(),
    },
  };

  const mockHeaderAuthService = {
    authorizationHeaderVerifier: jest.fn(),
  };

  const mockKeyService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: HeaderAuthService, useValue: mockHeaderAuthService },
        { provide: KeyService, useValue: mockKeyService },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
    prismaService = module.get<PrismaService>(PrismaService);
    headerAuthService = module.get<HeaderAuthService>(HeaderAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createATenant', () => {
    it('should throw UnauthorizedException if authorization fails', async () => {
      mockHeaderAuthService.authorizationHeaderVerifier.mockResolvedValueOnce({
        success: false,
        message: 'Unauthorized',
      });
      const createTenantDto: CreateTenantDto = {
        name: 'TenantName',
        jwtConfiguration: {
          accessTokenSigningKeysID: 'access-key-id-123',
          refreshTokenTimeToLiveInMinutes: 1440,
          timeToLiveInSeconds: 3600,
          idTokenSigningKeysID: 'id-key-id-456',
        },
      };
      await expect(
        service.createATenant('random-id', createTenantDto, {}),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if id is not provided', async () => {
      mockHeaderAuthService.authorizationHeaderVerifier.mockResolvedValueOnce({
        success: true,
      });
      const createTenantDto: CreateTenantDto = {
        name: 'TenantName',
        jwtConfiguration: {
          accessTokenSigningKeysID: 'access-key-id-123',
          refreshTokenTimeToLiveInMinutes: 1440,
          timeToLiveInSeconds: 3600,
          idTokenSigningKeysID: 'id-key-id-456',
        },
      };
      await expect(
        service.createATenant(null, createTenantDto, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if tenant with given id already exists', async () => {
      mockHeaderAuthService.authorizationHeaderVerifier.mockResolvedValueOnce({
        success: true,
      });
      mockPrismaService.tenant.findUnique.mockResolvedValueOnce({
        id: 'random-id',
      });
      const createTenantDto: CreateTenantDto = {
        name: 'TenantName',
        jwtConfiguration: {
          accessTokenSigningKeysID: 'access-key-id-123',
          refreshTokenTimeToLiveInMinutes: 1440,
          timeToLiveInSeconds: 3600,
          idTokenSigningKeysID: 'id-key-id-456',
        },
      };
      await expect(
        service.createATenant('random-id', createTenantDto, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if data is incomplete', async () => {
      mockHeaderAuthService.authorizationHeaderVerifier.mockResolvedValueOnce({
        success: true,
      });
      mockPrismaService.tenant.findUnique.mockResolvedValueOnce(null);
      const createTenantDto: CreateTenantDto = {
        name: '',
        jwtConfiguration: null,
      };
      await expect(
        service.createATenant('random-id', createTenantDto, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a tenant successfully', async () => {
      mockHeaderAuthService.authorizationHeaderVerifier.mockResolvedValueOnce({
        success: true,
      });
      mockPrismaService.tenant.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.key.findUnique.mockResolvedValueOnce({});
      mockPrismaService.key.findUnique.mockResolvedValueOnce({});
      mockPrismaService.tenant.create.mockResolvedValueOnce({
        id: 'random-id',
        name: 'TenantName',
        data: '{"key": "value"}',
        accessTokenSigningKeysId: 'access-key-id-123',
        idTokenSigningKeysId: 'id-key-id-456',
      });

      const createTenantDto: CreateTenantDto = {
        name: 'TenantName',
        jwtConfiguration: {
          accessTokenSigningKeysID: 'access-key-id-123',
          refreshTokenTimeToLiveInMinutes: 1440,
          timeToLiveInSeconds: 3600,
          idTokenSigningKeysID: 'id-key-id-456',
        },
      };

      const result = await service.createATenant(
        'random-id',
        createTenantDto,
        {},
      );
      expect(result).toEqual({
        success: true,
        message: 'Tenant created successfully!',
        data: {
          id: 'random-id',
          name: 'TenantName',
          data: '{"key": "value"}',
          accessTokenSigningKeysId: 'access-key-id-123',
          idTokenSigningKeysId: 'id-key-id-456',
        },
      });
    });
  });

  describe('updateATenant', () => {
    it('should throw UnauthorizedException if authorization fails', async () => {
      mockHeaderAuthService.authorizationHeaderVerifier.mockResolvedValueOnce({
        success: false,
        message: 'Unauthorized',
      });
      const updateTenantDto: UpdateTenantDto = {
        name: 'UpdatedTenantName',
      };
      await expect(
        service.updateATenant('random-id', updateTenantDto, {}),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if id is not provided', async () => {
      mockHeaderAuthService.authorizationHeaderVerifier.mockResolvedValueOnce({
        success: true,
      });
      const updateTenantDto: UpdateTenantDto = {
        name: 'UpdatedTenantName',
      };
      await expect(
        service.updateATenant(null, updateTenantDto, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if tenant with given id does not exist', async () => {
      mockHeaderAuthService.authorizationHeaderVerifier.mockResolvedValueOnce({
        success: true,
      });
      mockPrismaService.tenant.findUnique.mockResolvedValueOnce(null);
      const updateTenantDto: UpdateTenantDto = {
        name: 'UpdatedTenantName',
      };
      await expect(
        service.updateATenant('random-id', updateTenantDto, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update a tenant successfully', async () => {
      mockHeaderAuthService.authorizationHeaderVerifier.mockResolvedValueOnce({
        success: true,
      });
      mockPrismaService.tenant.findUnique.mockResolvedValueOnce({
        id: 'random-id',
        name: 'OldTenantName',
        data: '{"key": "value"}',
      });
      mockPrismaService.tenant.update.mockResolvedValueOnce({
        id: 'random-id',
        name: 'UpdatedTenantName',
        data: '{"key": "value"}',
      });

      const updateTenantDto: UpdateTenantDto = {
        name: 'UpdatedTenantName',
      };

      const result = await service.updateATenant(
        'random-id',
        updateTenantDto,
        {},
      );
      expect(result).toEqual({
        success: true,
        message: 'Tenant updated successfully!',
        data: {
          id: 'random-id',
          name: 'UpdatedTenantName',
          data: '{"key": "value"}',
        },
      });
    });
  });

  describe('deleteATenant', () => {
    it('should throw UnauthorizedException if authorization fails', async () => {
      mockHeaderAuthService.authorizationHeaderVerifier.mockResolvedValueOnce({
        success: false,
        message: 'Unauthorized',
      });
      await expect(service.deleteATenant('random-id', {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException if id is not provided', async () => {
      mockHeaderAuthService.authorizationHeaderVerifier.mockResolvedValueOnce({
        success: true,
      });
      await expect(service.deleteATenant(null, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if tenant with given id does not exist', async () => {
      mockHeaderAuthService.authorizationHeaderVerifier.mockResolvedValueOnce({
        success: true,
      });
      mockPrismaService.tenant.findUnique.mockResolvedValueOnce(null);
      await expect(service.deleteATenant('random-id', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should delete a tenant successfully', async () => {
      mockHeaderAuthService.authorizationHeaderVerifier.mockResolvedValueOnce({
        success: true,
      });
      mockPrismaService.tenant.findUnique.mockResolvedValueOnce({
        id: 'random-id',
        name: 'TenantName',
        data: '{"key": "value"}',
      });
      mockPrismaService.tenant.delete.mockResolvedValueOnce({
        id: 'random-id',
        name: 'TenantName',
        data: '{"key": "value"}',
      });

      const result = await service.deleteATenant('random-id', {});
      expect(result).toEqual({
        success: true,
        message: 'Tenant deleted successfully!',
        data: {
          id: 'random-id',
          name: 'TenantName',
          data: '{"key": "value"}',
        },
      });
    });
  });

  describe('returnATenant', () => {
    it('should throw UnauthorizedException if authorization fails', async () => {
      mockHeaderAuthService.authorizationHeaderVerifier.mockResolvedValueOnce({
        success: false,
        message: 'Unauthorized',
      });
      await expect(service.returnATenant('random-id', {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException if id is not provided', async () => {
      mockHeaderAuthService.authorizationHeaderVerifier.mockResolvedValueOnce({
        success: true,
      });
      await expect(service.returnATenant(null, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if tenant with given id does not exist', async () => {
      mockHeaderAuthService.authorizationHeaderVerifier.mockResolvedValueOnce({
        success: true,
      });
      mockPrismaService.tenant.findUnique.mockResolvedValueOnce(null);
      await expect(service.returnATenant('random-id', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return a tenant successfully', async () => {
      mockHeaderAuthService.authorizationHeaderVerifier.mockResolvedValueOnce({
        success: true,
      });
      mockPrismaService.tenant.findUnique.mockResolvedValueOnce({
        id: 'random-id',
        name: 'TenantName',
        data: '{"key": "value"}',
      });

      const result = await service.returnATenant('random-id', {});
      expect(result).toEqual({
        success: true,
        message: 'Tenant found successfully',
        data: {
          id: 'random-id',
          name: 'TenantName',
          data: '{"key": "value"}',
        },
      });
    });
  });

  describe('returnAllTenants', () => {
    it('should throw UnauthorizedException if authorization fails', async () => {
      mockHeaderAuthService.authorizationHeaderVerifier.mockResolvedValueOnce({
        success: false,
        message: 'Unauthorized',
      });
      await expect(service.returnAllTenants({})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return all tenants successfully', async () => {
      mockHeaderAuthService.authorizationHeaderVerifier.mockResolvedValueOnce({
        success: true,
      });
      mockPrismaService.tenant.findMany.mockResolvedValueOnce([
        {
          id: 'random-id-1',
          name: 'TenantName1',
          data: '{"key": "value1"}',
        },
        {
          id: 'random-id-2',
          name: 'TenantName2',
          data: '{"key": "value2"}',
        },
      ]);

      const result = await service.returnAllTenants({});
      expect(result).toEqual({
        success: true,
        message: 'These are all the tenants',
        data: [
          {
            id: 'random-id-1',
            name: 'TenantName1',
            data: '{"key": "value1"}',
          },
          {
            id: 'random-id-2',
            name: 'TenantName2',
            data: '{"key": "value2"}',
          },
        ],
      });
    });
  });
});

// UNIT TESTING FOR KEY SERVICE
// ----------------------------
// Test 1: createATenant
//     - It should throw UnauthorizedException if authorization fails
//     - It should throw BadRequestException if id is not provided
//     - It should throw BadRequestException if tenant with given id already exists
//     - It should throw BadRequestException if data is incomplete
//     - It should create a tenant successfully
// Test 2: updateATenant
//     - It should throw UnauthorizedException if authorization fails
//     - It should throw BadRequestException if id is not provided
//     - It should throw BadRequestException if tenant with given id does not exist
//     - It should update a tenant successfully
// Test 3: deleteATenant
//     - It should throw UnauthorizedException if authorization fails
//     - It should throw BadRequestException if id is not provided
//     - It should throw BadRequestException if tenant with given id does not exist
//     - It should delete a tenant successfully
// Test 4: returnATenant
//     - It should throw UnauthorizedException if authorization fails
//     - It should throw BadRequestException if id is not provided
//     - It should throw BadRequestException if tenant with given id does not exist
//     - It should return a tenant successfully
// Test 5: returnAllTenants
//     - It should throw UnauthorizedException if authorization fails
//     - It should return all tenants successfully
