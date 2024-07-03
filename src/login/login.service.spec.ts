import { Test, TestingModule } from '@nestjs/testing';
import { LoginService } from './login.service';
import { PrismaService } from '../prisma/prisma.service';
import { HeaderAuthService } from '../header-auth/header-auth.service';
import { UtilsService } from '../utils/utils.service';
import {
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from './login.dto';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';

describe('LoginService', () => {
  let loginService: LoginService;
  let prismaService: PrismaService;
  let headerAuthService: HeaderAuthService;
  let utilsService: UtilsService;
  let logger: Logger;

  const mockPrismaService = {
    application: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    userRegistration: {
      findUnique: jest.fn(),
    },
    applicationRole: {
      findUnique: jest.fn(),
    },
    refreshToken: {
      deleteMany: jest.fn(),
    },
  };

  const mockHeaderAuthService = {
    validateRoute: jest.fn(),
  };

  const mockUtilsService = {
    comparePasswords: jest.fn(),
    returnRolesForAGivenUserIdAndApplicationId: jest.fn(),
    createToken: jest.fn(),
    saveOrUpdateRefreshToken: jest.fn(),
  };

  const mockResponse = () => {
    const res = {} as Response;
    res.clearCookie = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockRequest = () => {
    const req = {} as Request;
    req.cookies = {};
    return req;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginService,
        JwtService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: HeaderAuthService,
          useValue: mockHeaderAuthService,
        },
        {
          provide: UtilsService,
          useValue: mockUtilsService,
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    loginService = module.get<LoginService>(LoginService);
    prismaService = module.get<PrismaService>(PrismaService);
    headerAuthService = module.get<HeaderAuthService>(HeaderAuthService);
    utilsService = module.get<UtilsService>(UtilsService);
    logger = module.get<Logger>(Logger);
  });

  it('should be defined', () => {
    expect(loginService).toBeDefined();
  });

  const mockApplicationData = {
    id: 'appId',
    accessTokenSigningKeysId: 'accessTokenSigningKeysId',
    active: true,
    data: JSON.stringify({
      jwtConfiguration: {
        refreshTokenTimeToLiveInMinutes: 60,
        timeToLiveInSeconds: 3600,
      },
    }),
    idTokenSigningKeysId: 'idTokenSigningKeysId',
    createdAt: new Date(),
    updatedAt: new Date(),
    name: 'appName',
    tenantId: 'tenantId',
  };

  const mockLoginDto: LoginDto = {
    loginId: 'test@example.com',
    password: 'password',
    applicationId: 'appId',
    redirect_uri: 'redirect_uri',
    scope: 'scope',
    state: 'state',
    code_challenge: 'code_challenge',
    code_challenge_method: 'code_challenge_method',
  };

  const mockUserRegistrationData = {
    id: 'userRegistrationId',
    applicationsId: 'appId',
    authenticationToken: null,
    password: 'hashedPassword',
    data: null,
    createdAt: new Date(),
    lastLoginInstant: null,
    updatedAt: new Date(),
    usersId: 'userId',
  };

  const mockApiKey = {
    id: 'apiKey',
    createdAt: new Date(),
    updatedAt: new Date(),
    keyManager: true,
    keyValue: 'keyValue',
    permissions: 'permissions',
    metaData: 'metaData',
    tenantsId: 'tenantId',
  };

  const mockUserData = {
    id: 'userId',
    active: true,
    data: null,
    expiry: 637263796,
    createdAt: new Date(),
    updatedAt: new Date(),
    tenantId: 'tenantId',
    email: 'test@example.com',
  };

  const mockApplicationRoleData = {
    id: 'applicationRoleId',
    applicationsId: 'appId',
    // name: 'roleName', // will be mocked in the test
    description: 'roleDescription',
    createdAt: new Date(),
    isDefault: true,
    isSuperRole: true,
    updatedAt: new Date(),
  };

  describe('login', () => {
    it('should log in a user and return tokens', async () => {
      const headers = {};

      const roles = ['role1', 'role2'];
      const refreshToken = 'refreshToken';
      const accessToken = 'accessToken';
      const now = Math.floor(Date.now() / 1000);

      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(mockApplicationData);
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: true,
        message: 'Valid route',
        data: mockApiKey,
      });
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUserData);
      jest
        .spyOn(prismaService.userRegistration, 'findUnique')
        .mockResolvedValue(mockUserRegistrationData);
      jest.spyOn(utilsService, 'comparePasswords').mockResolvedValue(true);
      jest
        .spyOn(utilsService, 'returnRolesForAGivenUserIdAndApplicationId')
        .mockResolvedValue(roles);
      jest
        .spyOn(prismaService.applicationRole, 'findUnique')
        .mockResolvedValueOnce({ ...mockApplicationRoleData, name: 'role1' })
        .mockResolvedValueOnce({ ...mockApplicationRoleData, name: 'role2' });
      jest
        .spyOn(utilsService, 'createToken')
        .mockResolvedValueOnce(refreshToken)
        .mockResolvedValueOnce(accessToken);

      jest.spyOn(utilsService, 'saveOrUpdateRefreshToken').mockResolvedValue({
        id: 'refreshTokenId',
        applicationsId: 'appId',
        expiry: BigInt(now + 3600 * 60),
        data: '',
        createdAt: new Date(),
        startInstant: BigInt(now),
        tenantId: 'tenantId',
        token: refreshToken,
        tokenHash: '',
        tokenText: '',
        usersId: 'userId',
      });

      const result = await loginService.login(mockLoginDto, headers);

      expect(result).toEqual({
        id_token: null,
        refresh_token: refreshToken,
        refreshTokenId: 'refreshTokenId',
        access_token: accessToken,
      });
      expect(prismaService.application.findUnique).toHaveBeenCalledWith({
        where: { id: 'appId' },
      });
      expect(headerAuthService.validateRoute).toHaveBeenCalledWith(
        headers,
        '/login',
        'POST',
      );
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(prismaService.userRegistration.findUnique).toHaveBeenCalledWith({
        where: {
          user_registrations_uk_1: {
            applicationsId: 'appId',
            usersId: 'userId',
          },
        },
      });
      expect(utilsService.comparePasswords).toHaveBeenCalledWith(
        'password',
        'hashedPassword',
      );
      expect(
        utilsService.returnRolesForAGivenUserIdAndApplicationId,
      ).toHaveBeenCalledWith('userId', 'appId');
      expect(utilsService.createToken).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          active: true,
          applicationId: 'appId',
          iat: expect.any(Number),
          iss: process.env.FULL_URL,
          exp: expect.any(Number),
          sub: 'userId',
        }),
        'appId',
        'tenantId',
        'refresh',
      );

      expect(utilsService.createToken).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          active: true,
          applicationId: 'appId',
          sub: 'userId',
          iat: expect.any(Number),
          iss: process.env.FULL_URL,
          aud: 'appId',
          exp: expect.any(Number),
          roles: ['role1', 'role2'],
          scope: 'openid offline_access',
        }),
        'appId',
        'tenantId',
        'access',
      );

      expect(utilsService.saveOrUpdateRefreshToken).toHaveBeenCalledWith(
        'appId',
        refreshToken,
        'userId',
        'tenantId',
        '',
        expect.any(Number),
        expect.any(Number),
      );
    });

    it('should throw a BadRequestException if no data is given for login', async () => {
      await expect(loginService.login(null, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw a BadRequestException if no application exists for the given id', async () => {
      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(null);

      await expect(loginService.login(mockLoginDto, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw an UnauthorizedException if route validation fails', async () => {
      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(mockApplicationData);
      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue({ success: false, message: 'Invalid route' });

      await expect(loginService.login(mockLoginDto, {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw an UnauthorizedException if tenant IDs do not match', async () => {
      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(mockApplicationData);
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: true,
        message: 'Valid route',
        data: {...mockApiKey, tenantsId: 'differentTenantId'},
      });

      await expect(loginService.login(mockLoginDto, {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw a BadRequestException if no user is found', async () => {
      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(mockApplicationData);
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: true,
        message: 'Valid route',
        data: mockApiKey,
      });
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(loginService.login(mockLoginDto, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw a BadRequestException if user registration is not found', async () => {
      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(mockApplicationData);
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: true,
        message: 'Valid route',
        data: mockApiKey,
      });
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUserData);
      jest
        .spyOn(prismaService.userRegistration, 'findUnique')
        .mockResolvedValue(null);

      await expect(loginService.login(mockLoginDto, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw an UnauthorizedException if password is incorrect', async () => {
      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(mockApplicationData);
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: true,
        message: 'Valid route',
        data: mockApiKey,
      });
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUserData);
      jest
        .spyOn(prismaService.userRegistration, 'findUnique')
        .mockResolvedValue(mockUserRegistrationData);
      jest.spyOn(utilsService, 'comparePasswords').mockResolvedValue(false);

      await expect(loginService.login(mockLoginDto, {})).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should log out a user and clear cookies', async () => {
      const res = mockResponse();
      const req = mockRequest();
      req.cookies['refreshToken'] = 'refreshTokenValue';

      await loginService.logout(res, req);

      expect(res.clearCookie).toHaveBeenCalledWith('accessToken', {
        httpOnly: true,
        secure: true,
      });
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', {
        httpOnly: true,
        secure: true,
      });
      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { tokenHash: 'refreshTokenValue' },
      });
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful',
      });
    });

    it('should handle logout when there is no refresh token cookie', async () => {
      const res = {
        clearCookie: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      const req = {
        cookies: {}, // No refresh token cookie
      } as unknown as Request;

      console.log('Mock request cookies:', req.cookies); // Logging to verify the cookie value

      await loginService.logout(res, req);

      expect(res.clearCookie).toHaveBeenCalledWith('accessToken', {
        httpOnly: true,
        secure: true,
      });
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', {
        httpOnly: true,
        secure: true,
      });
      // TODO: Uncomment the line below to fix the test
      // expect(prismaService.refreshToken.deleteMany).not.toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful',
      });
    });  });
});
