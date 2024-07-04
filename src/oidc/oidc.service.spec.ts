import { Test, TestingModule } from '@nestjs/testing';
import { OidcService } from './oidc.service';
import { PrismaService } from '../prisma/prisma.service';
import { UtilsService } from '../utils/utils.service';
import {
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { OIDCAuthQuery } from './dto/oidc.auth.dto';
import { LoginDto } from '../login/login.dto';
import * as jwt from 'jsonwebtoken';

describe('OidcService', () => {
  let service: OidcService;
  let prismaService: PrismaService;
  let utilService: UtilsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OidcService,
        {
          provide: PrismaService,
          useValue: {
            application: { findUnique: jest.fn() },
            user: { findUnique: jest.fn() },
            userRegistration: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: UtilsService,
          useValue: {
            comparePasswords: jest.fn(),
            hashPassword: jest.fn(),
            returnScopesForAGivenApplicationId: jest.fn(),
            createToken: jest.fn(),
            saveOrUpdateRefreshToken: jest.fn(),
            returnRolesForAGivenUserIdAndApplicationId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OidcService>(OidcService);
    prismaService = module.get<PrismaService>(PrismaService);
    utilService = module.get<UtilsService>(UtilsService);
  });

  describe('authorize', () => {
    it('should throw a BadRequestException if client_id is not provided', async () => {
      const req = {} as Request;
      const res = {} as Response;
      const query = {} as OIDCAuthQuery;
      const headers = {};

      await expect(service.authorize(req, res, query, headers)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should render login page with correct parameters', async () => {
      const req = {} as Request;
      const res = {
        render: jest.fn(),
      } as any as Response;
      const query = {
        client_id: 'client123',
        redirect_uri: 'http://localhost:3000/callback',
        response_type: 'code',
        scope: 'openid profile',
        state: 'state123',
        code_challenge: 'challenge123',
        code_challenge_method: 'S256',
      } as OIDCAuthQuery;
      const headers = {};

      await service.authorize(req, res, query, headers);
      expect(res.render).toHaveBeenCalledWith('login', {
        host: `${process.env.FULL_URL}`,
        applicationId: query.client_id,
        redirect_uri: query.redirect_uri,
        state: query.state,
        scope: query.scope,
        response_type: query.response_type,
        code_challenge: query.code_challenge,
        code_challenge_method: query.code_challenge_method,
      });
    });
  });

  describe('postAuthorize', () => {
    it('should throw a BadRequestException if data is not provided', async () => {
      const data = {} as LoginDto;
      const query = {} as OIDCAuthQuery;
      const headers = {};
      const res = {} as Response;

      await expect(
        service.postAuthorize(data, query, headers, res),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw a BadRequestException if application does not exist', async () => {
      const data = {
        loginId: 'test@example.com',
        password: 'Password@123',
      } as LoginDto;
      const query = {
        client_id: 'client123',
      } as OIDCAuthQuery;
      const headers = {};
      const res = {} as Response;

      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValueOnce(null);

      await expect(
        service.postAuthorize(data, query, headers, res),
      ).rejects.toThrow(BadRequestException);
    });

    it('should redirect with code and state if user is successfully authenticated', async () => {
      const data = {
        loginId: 'test@example.com',
        password: 'Password@123',
      } as LoginDto;
      const query = {
        client_id: 'client123',
      } as OIDCAuthQuery;
      const headers = {};
      const res = {
        redirect: jest.fn(),
      } as any as Response;

      const application = {
        id: 'client123',
        data: JSON.stringify({
          oauthConfiguration: {
            authorizedRedirectURLs: ['http://localhost:3000/callback'],
          },
        }),
      };
      const user = {
        id: 'user123',
        data: JSON.stringify({
          userData: {
            password: 'hashedpassword',
          },
        }),
      };
      const userRegistration = {
        id: 'registration123',
        authenticationToken: 'authToken123',
      };

      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValueOnce(application);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(user);
      jest.spyOn(utilService, 'comparePasswords').mockResolvedValueOnce(true);
      jest
        .spyOn(prismaService.userRegistration, 'findUnique')
        .mockResolvedValueOnce(null);
      jest
        .spyOn(prismaService.userRegistration, 'create')
        .mockResolvedValueOnce(userRegistration);

      await service.postAuthorize(data, query, headers, res);
      expect(res.redirect).toHaveBeenCalledWith(
        `${data.redirect_uri}?code=${userRegistration.authenticationToken}&state=${data.state}`,
      );
    });
  });

  describe('returnToken', () => {
    it('should throw BadRequestException if content-type is not application/x-www-form-urlencoded', async () => {
      const data = {} as any;
      const headers = {
        'content-type': 'application/json',
      };

      await expect(service.returnToken(data, headers)).rejects.toThrow(
        BadRequestException,
      );
    });

    // Add more tests here for different scenarios in returnToken method
  });

  describe('returnAllPublicJwks', () => {
    it('should return all public JWKS', async () => {
      const mockKeys = [{ data: JSON.stringify({ key: 'value' }) }];
      jest.spyOn(prismaService.key, 'findMany').mockResolvedValue(mockKeys);

      const result = await service.returnAllPublicJwks();

      expect(result).toEqual({
        keys: [{ key: 'value' }],
      });
    });
  });

  describe('returnAPublicJwks', () => {
    it('should throw BadRequestException if tenant does not exist', async () => {
      const tenantId = 'testTenantId';
      jest.spyOn(prismaService.tenant, 'findUnique').mockResolvedValue(null);

      await expect(service.returnAPublicJwks(tenantId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return public JWKS for a given tenant', async () => {
      const tenantId = 'testTenantId';
      const mockTenant = {
        accessTokenSigningKeysId: 'accessKey',
        idTokenSigningKeysId: 'idKey',
      };
      const mockAccessTokenSigningKey = {
        data: JSON.stringify({ key: 'accessKey' }),
      };
      const mockIdTokenSigningKey = { data: JSON.stringify({ key: 'idKey' }) };

      jest
        .spyOn(prismaService.tenant, 'findUnique')
        .mockResolvedValue(mockTenant);
      jest.spyOn(prismaService.key, 'findUnique').mockImplementation((args) => {
        if (args.where.id === 'accessKey')
          return Promise.resolve(mockAccessTokenSigningKey);
        if (args.where.id === 'idKey')
          return Promise.resolve(mockIdTokenSigningKey);
        return null;
      });

      const result = await service.returnAPublicJwks(tenantId);

      expect(result).toEqual({
        keys: [{ key: 'accessKey' }, { key: 'idKey' }],
      });
    });
  });

  describe('introspect', () => {
    it('should throw BadRequestException if content-type is not application/x-www-form-urlencoded', async () => {
      const data = {} as any;
      const headers = {
        'content-type': 'application/json',
      };

      await expect(service.introspect(data, headers)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if client id is not provided', async () => {
      const data = { token: 'testToken' } as any;
      const headers = {
        'content-type': 'application/x-www-form-urlencoded',
        authorization: 'Basic ',
      };

      await expect(service.introspect(data, headers)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return token validity', async () => {
      const data = { token: 'testToken' } as any;
      const headers = {
        'content-type': 'application/x-www-form-urlencoded',
        authorization: 'Basic dGVzdENsaWVudElkOnRlc3RTZWNyZXQ=',
      };
      const mockApplication = {
        id: 'testClientId',
        accessTokenSigningKeysId: 'accessKey',
        data: JSON.stringify({
          oauthConfiguration: { clientSecret: 'testSecret' },
        }),
      };
      const mockSigningKey = { publicKey: 'testPublicKey' };

      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(mockApplication);
      jest
        .spyOn(prismaService.key, 'findUnique')
        .mockResolvedValue(mockSigningKey);
      jest
        .spyOn(utilService, 'checkValidityOfToken')
        .mockResolvedValue({ active: true });

      const result = await service.introspect(data, headers);

      expect(result).toEqual({ active: true });
    });
  });

  describe('returnClaimsOfEndUser', () => {
    it('should throw BadRequestException if authorization header is not provided', async () => {
      const headers = {};

      await expect(service.returnClaimsOfEndUser(headers)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return user claims', async () => {
      const token = 'Bearer testToken';
      const headers = { authorization: token };
      const mockPayload = {
        sub: 'userId',
        scope: 'openid profile email',
        applicationId: 'appId',
      };
      const mockUser = {
        id: 'userId',
        email: 'test@example.com',
        data: JSON.stringify({
          userData: {
            username: 'testuser',
            firstname: 'Test',
            lastname: 'User',
          },
        }),
      };
      const mockRoles = ['role1', 'role2'];

      jest.spyOn(jwt, 'decode').mockReturnValue(mockPayload);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(utilService, 'returnRolesForAGivenUserIdAndApplicationId')
        .mockResolvedValue(['roleId']);
      jest
        .spyOn(prismaService.applicationRole, 'findUnique')
        .mockResolvedValue({ name: 'role1' });
      jest
        .spyOn(prismaService.applicationRole, 'findUnique')
        .mockResolvedValue({ name: 'role2' });

      const result = await service.returnClaimsOfEndUser(headers);

      expect(result).toEqual({
        applicationId: 'appId',
        email: 'test@example.com',
        sub: 'userId',
        roles: mockRoles,
        firstname: 'Test',
        lastname: 'User',
        username: 'testuser',
      });
    });
  });
});
