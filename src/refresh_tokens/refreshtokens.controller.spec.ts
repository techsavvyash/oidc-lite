import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokensController } from './refreshtokens.controller';
import { RefreshTokensService } from './refreshtokens.service';
import { refreshCookiesDTO, refreshDTO } from './refreshToken.dto';
import { BadGatewayException } from '@nestjs/common';

describe('RefreshTokensController', () => {
  let controller: RefreshTokensController;
  let service: RefreshTokensService;

  const mockRefreshTokensService = {
    refreshToken: jest.fn(),
    retrieveByID: jest.fn(),
    retrieveByUserID: jest.fn(),
    deleteViaTokenID: jest.fn(),
    deleteViaUserAndAppID: jest.fn(),
    deleteViaAppID: jest.fn(),
    deleteViaUserID: jest.fn(),
    deleteViaToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RefreshTokensController],
      providers: [
        {
          provide: RefreshTokensService,
          useValue: mockRefreshTokensService,
        },
      ],
    }).compile();

    controller = module.get<RefreshTokensController>(RefreshTokensController);
    service = module.get<RefreshTokensService>(RefreshTokensService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  const cookie: refreshCookiesDTO = {
    refreshToken: 'refresh-token',
    token: 'token',
  };

  const mockResult = {
    success: true,
    message: 'Refresh token retrieved successfully',
    data: {
      id: '1',
      applicationsId: 'app-123',
      expiry: BigInt('1625097600000'),
      data: 'refresh-token-data',
      createdAt: new Date('2021-07-01T00:00:00.000Z'),
      startInstant: BigInt('1625001200000'),
      tenantId: 'tenant-456',
      token: 'token-string',
      tokenHash: 'token-hash-string',
      tokenText: 'token-text-string',
      usersId: 'user-789',
    },
  };

  describe('refreshToken', () => {
    it('should refresh token', async () => {
      const data: refreshDTO = {
        refreshToken: 'refresh-token',
        token: 'token',
      };
      const result = {
        ...mockResult,
        data: {
          refresh_token: 'newRefreshToken',
          refreshTokenId: mockResult.data.id,
          access_token: 'newAccessToken',
        },
      };

      jest.spyOn(service, 'refreshToken').mockResolvedValue(result);

      expect(await controller.refreshToken(cookie, data)).toBe(result);
    });
  });

  describe('retrieve', () => {
    it('should retrieve refresh token by ID', async () => {
      const uuid = 'some-uuid';
      const headers = { 'x-stencil-tenantid': 'tenant-id' };
      const result = mockResult;

      jest.spyOn(service, 'retrieveByID').mockResolvedValue(result);

      expect(await controller.retrieve(uuid, headers)).toBe(result);
    });
  });

  describe('retrieveByUserID', () => {
    it('should retrieve refresh tokens by user ID', async () => {
      const userId = 'some-user-id';
      const headers = { 'x-stencil-tenantid': 'tenant-id' };
      const result = {
        ...mockResult,
        data: [mockResult.data],
      };

      jest.spyOn(service, 'retrieveByUserID').mockResolvedValue(result);

      expect(await controller.retrieveByUserID(userId, headers)).toBe(result);
    });
  });

  describe('deleteViaTokenID', () => {
    it('should delete refresh token by token ID', async () => {
      const tokenId = 'some-token-id';
      const headers = { 'x-stencil-tenantid': 'tenant-id' };
      const result = mockResult;

      jest.spyOn(service, 'deleteViaTokenID').mockResolvedValue(result);

      expect(await controller.deleteViaTokenID(tokenId, headers)).toBe(result);
    });
  });

  describe('deletereftoken', () => {
    it('should delete refresh token by user and app ID', async () => {
      const appid = 'app-id';
      const userid = 'user-id';
      const headers = { 'x-stencil-tenantid': 'tenant-id' };
      const result = mockResult;

      jest.spyOn(service, 'deleteViaUserAndAppID').mockResolvedValue(result);

      expect(
        await controller.deletereftoken(appid, userid, null, headers),
      ).toBe(result);
    });

    it('should delete refresh token by app ID', async () => {
      const appid = 'app-id';
      const headers = { 'x-stencil-tenantid': 'tenant-id' };
      const result = mockResult;

      jest.spyOn(service, 'deleteViaAppID').mockResolvedValue(result);

      expect(await controller.deletereftoken(appid, null, null, headers)).toBe(
        result,
      );
    });

    it('should delete refresh token by user ID', async () => {
      const userid = 'user-id';
      const headers = { 'x-stencil-tenantid': 'tenant-id' };
      const result = mockResult;

      jest.spyOn(service, 'deleteViaUserID').mockResolvedValue(result);

      expect(await controller.deletereftoken(null, userid, null, headers)).toBe(
        result,
      );
    });

    it('should delete refresh token by token', async () => {
      const refreshToken = 'refresh-token';
      const headers = { 'x-stencil-tenantid': 'tenant-id' };
      const result = mockResult;

      jest.spyOn(service, 'deleteViaToken').mockResolvedValue(result);

      expect(
        await controller.deletereftoken(null, null, refreshToken, headers),
      ).toBe(result);
    });

    it('should throw an exception for invalid parameters', async () => {
      const headers = { 'x-stencil-tenantid': 'tenant-id' };

      await expect(
        controller.deletereftoken(null, null, null, headers),
      ).rejects.toThrow(
        new BadGatewayException({
          success: false,
          message: 'invalid parameters',
        }),
      );
    });
  });
});
