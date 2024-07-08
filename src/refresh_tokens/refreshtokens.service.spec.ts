import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HeaderAuthService } from '../header-auth/header-auth.service';
import { RefreshTokensService } from './refreshtokens.service';
import * as jwt from 'jsonwebtoken';
import { refreshCookiesDTO, refreshDTO } from './refreshToken.dto';

jest.mock('jsonwebtoken');

describe('RefreshTokensService', () => {
  let service: RefreshTokensService;
  let prismaService: PrismaService;
  let headerAuthService: HeaderAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokensService,
        {
          provide: PrismaService,
          useValue: {
            refreshToken: {
              findUnique: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
              deleteMany: jest.fn(),
              delete: jest.fn(),
            },
            application: { findUnique: jest.fn() },
            key: { findUnique: jest.fn() },
            tenant: { findUnique: jest.fn() },
            user: { findUnique: jest.fn() },
          },
        },
        {
          provide: HeaderAuthService,
          useValue: {
            validateRoute: jest.fn(),
            authorizationHeaderVerifier: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RefreshTokensService>(RefreshTokensService);
    prismaService = module.get<PrismaService>(PrismaService);
    headerAuthService = module.get<HeaderAuthService>(HeaderAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const mockRefresh: refreshDTO = {
    refreshToken: 'refreshToken',
    token: 'token',
  };
  const mockRefreshCookies: refreshCookiesDTO = { ...mockRefresh };

  const mockToken = {
    id: '2',
    applicationsId: 'app-456',
    expiry: BigInt('1625197600000'),
    data: 'some-refresh-token-data',
    createdAt: new Date('2021-07-02T00:00:00.000Z'),
    startInstant: BigInt('6001200000'),
    tenantId: 'tenant-789',
    token: 'some-refresh-token',
    tokenHash: 'some-token-hash',
    tokenText: 'some-token-text',
    usersId: 'user-012',
  };

  const mockApplication = {
    id: '3',
    accessTokenSigningKeysId: 'key-123',
    active: true,
    data: 'application-data',
    idTokenSigningKeysId: 'key-456',
    createdAt: new Date('2021-07-03T00:00:00.000Z'),
    updatedAt: new Date('2021-07-04T00:00:00.000Z'),
    name: 'application-name',
    tenantId: 'tenant-321',
  };

  const mockKey = {
    id: '4',
    algorithm: 'RS256',
    certificate: 'certificate-string',
    expiry: 1625097600000, // Example timestamp
    createdAt: new Date('2021-07-01T00:00:00.000Z'),
    issuer: 'issuer-name',
    kid: 'key-id',
    updatedAt: new Date('2021-07-02T00:00:00.000Z'),
    name: 'key-name',
    privateKey: 'private-key-string',
    publicKey: 'public-key-string',
    secret: 'secret-string',
    type: 'RSA',
    data: 'data-string',
  };

  describe('refreshToken', () => {
    it('should throw BadRequestException if no refresh token or access token is provided', async () => {
      await expect(
        service.refreshToken(mockRefresh, mockRefreshCookies),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no refresh token is found', async () => {
      jest
        .spyOn(prismaService.refreshToken, 'findUnique')
        .mockResolvedValue(null);
      await expect(
        service.refreshToken(mockRefresh, mockRefreshCookies),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if invalid token is provided', async () => {
      jest
        .spyOn(prismaService.refreshToken, 'findUnique')
        .mockResolvedValue(mockToken);
      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(mockApplication);
      jest.spyOn(prismaService.key, 'findUnique').mockResolvedValue(mockKey);
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        service.refreshToken(mockRefresh, mockRefreshCookies),
      ).rejects.toThrow(BadRequestException);
    });

    // TODO
    // CHECK THIS TEST: ITS THROWING THE CATCH BLOCK ERROR

    // it('should return new tokens if valid token is provided', async () => {
    //   const refreshTokenDecoded = {
    //     exp: Math.floor(Date.now() / 1000) + 3600,
    //     iss: 'issuer',
    //     sub: 'subject',
    //   };
    //   const accessTokenDecoded = {
    //     sub: 'subject',
    //     scope: 'scope',
    //     roles: 'roles',
    //   };

    //   jest
    //     .spyOn(prismaService.refreshToken, 'findUnique')
    //     .mockResolvedValue(mockToken);
    //   jest
    //     .spyOn(prismaService.application, 'findUnique')
    //     .mockResolvedValue(mockApplication);
    //   jest.spyOn(prismaService.key, 'findUnique').mockResolvedValue(mockKey);

    //   jest.spyOn(jwt, 'verify').mockImplementation((token) => {
    //     if (token === 'token') return accessTokenDecoded;
    //     return refreshTokenDecoded;
    //   });

    //   jest
    //     .spyOn(prismaService.refreshToken, 'update')
    //     .mockResolvedValue(mockToken);

    //   jest.spyOn(jwt, 'sign').mockImplementation(() => 'token');

    //   const result = await service.refreshToken(
    //     {
    //       refreshToken: 'token',
    //       token: 'token',
    //     },
    //     {
    //       refreshToken: 'token',
    //       token: 'token',
    //     },
    //   );

    //   expect(result).toEqual({
    //     success: true,
    //     message: 'Refresh token refreshed',
    //     data: {
    //       refresh_token: 'token',
    //       refreshTokenId: 'refresh-token-id',
    //       access_token: 'token',
    //     },
    //   });
    // });
  });

  const mockApiKey = {
    id: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    keyManager: true,
    keyValue: 'key-value',
    permissions: 'permissions',
    metaData: 'meta-data',
    tenantsId: 'tenant-id',
  };

  const mockTenant = {
    id: 'tenant-id',
    accessTokenSigningKeysId: 'key-id',
    data: 'tenant-data',
    idTokenSigningKeysId: 'key-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    name: 'tenant-name',
  };

  describe('retrieveByID', () => {
    it('should throw UnauthorizedException if route validation fails', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: false,
        message: 'Unauthorized',
      });
      await expect(service.retrieveByID('some-id', {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException if tenant ID is missing', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: true,
        message: 'Authorized',
        data: mockApiKey,
      });
      await expect(service.retrieveByID('some-id', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if no tenant with given ID exists', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: true,
        message: 'Authorized',
        data: mockApiKey,
      });
      jest.spyOn(prismaService.tenant, `findUnique`).mockResolvedValue(null);
      await expect(
        service.retrieveByID('some-id', { 'x-stencil-tenantid': 'tenant-id' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no refresh token is found', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: true,
        message: 'Authorized',
        data: mockApiKey,
      });
      jest
        .spyOn(prismaService.tenant, 'findUnique')
        .mockResolvedValue(mockTenant);
      jest
        .spyOn(prismaService.refreshToken, 'findUnique')
        .mockResolvedValue(null);
      await expect(
        service.retrieveByID('some-id', { 'x-stencil-tenantid': 'tenant-id' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return refresh token if found', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: true,
        message: 'Authorized',
        data: mockApiKey,
      });
      jest
        .spyOn(prismaService.tenant, 'findUnique')
        .mockResolvedValue(mockTenant);
      jest
        .spyOn(prismaService.refreshToken, 'findUnique')
        .mockResolvedValue(mockToken);

      const result = await service.retrieveByID('some-id', {
        'x-stencil-tenantid': 'tenant-id',
      });

      expect(result).toEqual({
        success: true,
        message: 'refresh token found successfully',
        data: mockToken,
      });
    });
  });

  describe('retrieveByUserID', () => {
    it('should throw BadRequestException if tenant ID is missing', async () => {
      await expect(
        service.retrieveByUserID('some-user-id', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no tenant with given ID exists', async () => {
      jest.spyOn(prismaService.tenant, 'findUnique').mockResolvedValue(null);
      await expect(
        service.retrieveByUserID('some-user-id', {
          'x-stencil-tenantid': 'tenant-id',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if header validation fails', async () => {
      jest
        .spyOn(prismaService.tenant, 'findUnique')
        .mockResolvedValue(mockTenant);
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({
          success: false,
          message: 'Unauthorized',
        });
      await expect(
        service.retrieveByUserID('some-user-id', {
          'x-stencil-tenantid': 'tenant-id',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return refresh tokens if found', async () => {
      jest
        .spyOn(prismaService.tenant, 'findUnique')
        .mockResolvedValue(mockTenant);
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({
          success: true,
          message: 'Authorized',
        });
      jest
        .spyOn(prismaService.refreshToken, 'findMany')
        .mockResolvedValue([mockToken]);

      const result = await service.retrieveByUserID('some-user-id', {
        'x-stencil-tenantid': 'tenant-id',
      });

      expect(result).toEqual({
        success: true,
        message: 'refresh tokens found successfully',
        data: [mockToken],
      });
    });
  });

  describe('deleteViaAppID', () => {
    it('should throw BadRequestException if no application ID is provided', async () => {
      await expect(service.deleteViaAppID(null, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if no application with given ID exists', async () => {
      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(null);
      await expect(service.deleteViaAppID('app-id', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException if header validation fails', async () => {
      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(mockApplication);
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({
          success: false,
          message: 'Unauthorized',
        });
      await expect(service.deleteViaAppID('app-id', {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should delete refresh tokens by application ID', async () => {
      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(mockApplication);
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({
          success: true,
          message: 'Authorized',
        });

      const result = await service.deleteViaAppID('app-id', {});

      expect(result).toEqual({
        success: true,
        message:
          'all refresh tokens deleted successfully with the given application id',
      });
      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { applicationsId: 'app-id' },
      });
    });
  });

  const mockUser = {
    id: 'user-id',
    active: true,
    data: 'user-data',
    expiry: 1625097600000,
    createdAt: new Date('2021-07-01T00:00:00.000Z'),
    updatedAt: new Date('2021-07-02T00:00:00.000Z'),
    tenantId: 'tenant-id',
    groupId: 'group-id',
    email: 'user-email',
  };

  describe('deleteViaUserID', () => {
    it('should throw BadRequestException if no user ID is provided', async () => {
      await expect(service.deleteViaUserID(null, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if no user with given ID exists', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      await expect(service.deleteViaUserID('user-id', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException if header validation fails', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({
          success: false,
          message: 'Unauthorized',
        });
      await expect(service.deleteViaUserID('user-id', {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should delete refresh tokens by user ID', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({
          success: true,
          message: 'Authorized',
        });

      const result = await service.deleteViaUserID('user-id', {});

      expect(result).toEqual({
        success: true,
        message:
          'all refresh token is deleted successfully with the help of given user id',
      });
      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { usersId: 'user-id' },
      });
    });
  });

  describe('deleteViaUserAndAppID', () => {
    it('should throw BadRequestException if userId or applicationsId is missing', async () => {
      await expect(
        service.deleteViaUserAndAppID(null, 'app-id', {}),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.deleteViaUserAndAppID('user-id', null, {}),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.deleteViaUserAndAppID(null, null, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no user or application with given ID exists', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(null);
      await expect(
        service.deleteViaUserAndAppID('user-id', 'app-id', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if header validation fails', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(mockApplication);
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({ success: false, message: 'Unauthorized' });
      await expect(
        service.deleteViaUserAndAppID('user-id', 'app-id', {}),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should delete refresh tokens by user ID and application ID', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(mockApplication);
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({ success: true, message: 'Authorized' });

      const result = await service.deleteViaUserAndAppID(
        'user-id',
        'app-id',
        {},
      );

      expect(result).toEqual({
        success: true,
        message:
          'refresh token deleted with provided application ID and user ID',
      });
      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { usersId: 'user-id', applicationsId: 'app-id' },
      });
    });

    it('should throw InternalServerErrorException if an error occurs while deleting refresh tokens', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(mockApplication);
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({ success: true, message: 'Authorized' });
      jest
        .spyOn(prismaService.refreshToken, 'deleteMany')
        .mockRejectedValue(new Error('Database error'));

      await expect(
        service.deleteViaUserAndAppID('user-id', 'app-id', {}),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // deleteViaTokenID
  describe('deleteViaTokenID', () => {
    it('should throw BadRequestException if no token ID is provided', async () => {
      await expect(service.deleteViaTokenID('', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if no refresh token is found with the provided ID', async () => {
      jest
        .spyOn(prismaService.refreshToken, 'findUnique')
        .mockResolvedValue(null);

      await expect(service.deleteViaTokenID('token-id', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException if header validation fails', async () => {
      jest
        .spyOn(prismaService.refreshToken, 'findUnique')
        .mockResolvedValue(mockToken);
      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(mockApplication);
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({ success: false, message: 'Unauthorized' });

      await expect(service.deleteViaTokenID('token-id', {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should delete the refresh token with the provided ID and return success message', async () => {
      jest
        .spyOn(prismaService.refreshToken, 'findUnique')
        .mockResolvedValue(mockToken);
      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(mockApplication);
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({ success: true, message: 'Authorized' });
      jest
        .spyOn(prismaService.refreshToken, 'delete')
        .mockResolvedValue(mockToken);

      const result = await service.deleteViaTokenID('token-id', {});

      expect(result).toEqual({
        success: true,
        message:
          'refresh token is deleted successfully with the help of given token id',
        data: mockToken,
      });
      expect(prismaService.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: 'token-id' },
      });
    });

    it('should throw BadRequestException if an error occurs while deleting the refresh token', async () => {
      jest
        .spyOn(prismaService.refreshToken, 'findUnique')
        .mockResolvedValue(mockToken);
      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(mockApplication);
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({ success: true, message: 'Authorized' });
      jest
        .spyOn(prismaService.refreshToken, 'delete')
        .mockRejectedValue(new Error('Database error'));

      await expect(service.deleteViaTokenID('token-id', {})).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // deleteViaToken
  describe('deleteViaToken', () => {
    it('should throw BadRequestException if no token is provided', async () => {
      await expect(service.deleteViaToken('', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if no refresh token is found with the provided token', async () => {
      jest
        .spyOn(prismaService.refreshToken, 'findUnique')
        .mockResolvedValue(null);

      await expect(service.deleteViaToken('invalid-token', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException if header validation fails', async () => {
      jest
        .spyOn(prismaService.refreshToken, 'findUnique')
        .mockResolvedValue(mockToken);
      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(mockApplication);
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({ success: false, message: 'Unauthorized' });

      await expect(service.deleteViaToken('valid-token', {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should delete the refresh token with the provided token and return success message', async () => {
      jest
        .spyOn(prismaService.refreshToken, 'findUnique')
        .mockResolvedValue(mockToken);
      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(mockApplication);
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({ success: true, message: 'Authorized' });
      jest
        .spyOn(prismaService.refreshToken, 'delete')
        .mockResolvedValue(mockToken);

      const result = await service.deleteViaToken('valid-token', {});

      expect(result).toEqual({
        success: true,
        message:
          'refresh token is deleted successfully with the help of given token',
      });
      expect(prismaService.refreshToken.delete).toHaveBeenCalledWith({
        where: { token: 'valid-token' },
      });
    });

    it('should throw BadRequestException if an error occurs while deleting the refresh token', async () => {
      jest
        .spyOn(prismaService.refreshToken, 'findUnique')
        .mockResolvedValue(mockToken);
      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(mockApplication);
      jest
        .spyOn(headerAuthService, 'authorizationHeaderVerifier')
        .mockResolvedValue({ success: true, message: 'Authorized' });
      jest
        .spyOn(prismaService.refreshToken, 'delete')
        .mockRejectedValue(new Error('Database error'));

      await expect(service.deleteViaToken('valid-token', {})).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
