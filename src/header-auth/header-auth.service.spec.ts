// TODO

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { HeaderAuthService } from './header-auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { ResponseDto } from '../dto/response.dto';
import { ApiKeyResponseDto, Permissions } from '../api-keys/apiKey.dto';

describe('HeaderAuthService', () => {
  let service: HeaderAuthService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    authenticationKey: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HeaderAuthService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<HeaderAuthService>(HeaderAuthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authorizationHeaderVerifier', () => {
    it('should return unauthorized if authorization header is missing', async () => {
      const headers = {};
      const result: ResponseDto = await service.authorizationHeaderVerifier(
        headers,
        null,
        '/key',
        'GET',
      );
      expect(result).toEqual({
        success: false,
        message: 'authorization header required',
      });
    });

    it('should return unauthorized if header key is not found', async () => {
      const headers = { authorization: 'invalid-token' };
      mockPrismaService.authenticationKey.findUnique.mockResolvedValue(null);
      const result: ResponseDto = await service.authorizationHeaderVerifier(
        headers,
        null,
        '/key',
        'GET',
      );
      expect(result).toEqual({
        success: false,
        message: 'You are not authorized',
      });
    });

    it('should return unauthorized if the endpoint is not allowed', async () => {
      const headers = { authorization: 'valid-token' };
      const headerKey = {
        keyValue: 'valid-token',
        tenantsId: 'tenant-id',
        permissions: JSON.stringify({
          endpoints: [{ url: '/not-key', methods: 'GET' }],
        }),
      };
      mockPrismaService.authenticationKey.findUnique.mockResolvedValue(
        headerKey,
      );
      const result: ResponseDto = await service.authorizationHeaderVerifier(
        headers,
        'tenant-id',
        '/key',
        'GET',
      );
      expect(result).toEqual({
        success: false,
        message: 'Not authorized',
      });
    });

    it('should return authorized if the endpoint is allowed', async () => {
      const headers = { authorization: 'valid-token' };
      const headerKey = {
        keyValue: 'valid-token',
        tenantsId: 'tenant-id',
        permissions: JSON.stringify({
          endpoints: [{ url: '/key', methods: 'GET' }],
        }),
      };
      mockPrismaService.authenticationKey.findUnique.mockResolvedValue(
        headerKey,
      );
      const result: ResponseDto = await service.authorizationHeaderVerifier(
        headers,
        'tenant-id',
        '/key',
        'GET',
      );
      expect(result).toEqual({
        success: true,
        message: 'Authorized',
        data: headerKey,
      });
    });
  });

  describe('extractAuthorizationKeyFromHeader', () => {
    it('should return unauthorized if authorization header is missing', async () => {
      const headers = {};
      const result: ApiKeyResponseDto =
        await service['extractAuthorizationKeyFromHeader'](headers);
      expect(result).toEqual({
        success: false,
        message: 'authorization header required',
      });
    });

    it('should return unauthorized if header key is not found', async () => {
      const headers = { authorization: 'invalid-token' };
      mockPrismaService.authenticationKey.findUnique.mockResolvedValue(null);
      const result: ApiKeyResponseDto =
        await service['extractAuthorizationKeyFromHeader'](headers);
      expect(result).toEqual({
        success: false,
        message: 'You are not authorized',
      });
    });

    it('should return the extracted key if found', async () => {
      const headers = { authorization: 'valid-token' };
      const headerKey = {
        keyValue: 'valid-token',
        tenantsId: 'tenant-id',
        permissions: JSON.stringify({}),
      };
      mockPrismaService.authenticationKey.findUnique.mockResolvedValue(
        headerKey,
      );
      const result: ApiKeyResponseDto =
        await service['extractAuthorizationKeyFromHeader'](headers);
      expect(result).toEqual({
        success: true,
        message: 'Key extracted',
        data: {
          keyValue: 'valid-token',
          tenantsId: 'tenant-id',
          permissions: {},
        },
      });
    });
  });

  describe('validateRoute', () => {
    it('should return unauthorized if authorization key extraction fails', async () => {
      const headers = {};
      const result: ApiKeyResponseDto = await service.validateRoute(
        headers,
        '/key',
        'GET',
      );
      expect(result).toEqual({
        success: false,
        message: 'authorization header required',
      });
    });

    it('should return unauthorized if the endpoint is not allowed', async () => {
      const headers = { authorization: 'valid-token' };
      const headerKey = {
        keyValue: 'valid-token',
        tenantsId: 'tenant-id',
        permissions: JSON.stringify({
          endpoints: [{ url: '/not-key', methods: 'GET' }],
        }),
      };
      mockPrismaService.authenticationKey.findUnique.mockResolvedValue(
        headerKey,
      );
      const result: ApiKeyResponseDto = await service.validateRoute(
        headers,
        '/key',
        'GET',
      );
      expect(result).toEqual({
        success: false,
        message: 'Not authorized',
      });
    });

    it('should return authorized if the endpoint is allowed', async () => {
      const headers = { authorization: 'valid-token' };
      const headerKey = {
        keyValue: 'valid-token',
        tenantsId: 'tenant-id',
        permissions: JSON.stringify({
          endpoints: [{ url: '/key', methods: 'GET' }],
        }),
      };
      mockPrismaService.authenticationKey.findUnique.mockResolvedValue(
        headerKey,
      );
      const result: ApiKeyResponseDto = await service.validateRoute(
        headers,
        '/key',
        'GET',
      );
      expect(result).toEqual({
        success: true,
        message: 'Authorized',
        data: {
          keyValue: 'valid-token',
          tenantsId: 'tenant-id',
          permissions: {
            endpoints: [{ url: '/key', methods: 'GET' }],
          },
        },
      });
    });
  });
});

// UNIT TESTS: HEADER AUTH SERVICE
// ------------------------------
// Test 1: "authorizationHeaderVerifier"
//     - The function should return unauthorized if authorization header is missing
//     - The function should return unauthorized if header key is not found
//     - The function should return unauthorized if the endpoint is not allowed
//     - The function should return authorized if the endpoint is allowed
// Test 2: "extractAuthorizationKeyFromHeader"
//     - The function should return unauthorized if authorization header is missing
//     - The function should return unauthorized if header key is not found
//     - The function should return the extracted key if found
// Test 3: "validateRoute"
//     - The function should return unauthorized if authorization key extraction fails
//     - The function should return unauthorized if the endpoint is not allowed
//     - The function should return authorized if the endpoint is allowed
