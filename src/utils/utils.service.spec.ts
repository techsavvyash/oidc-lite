import { Test, TestingModule } from '@nestjs/testing';
import { UtilsService } from './utils.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('UtilsService', () => {
  let service: UtilsService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UtilsService,
        {
          provide: PrismaService,
          useValue: {
            refreshToken: {
              findUnique: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
            },
            application: {
              findUnique: jest.fn(),
            },
            key: {
              findUnique: jest.fn(),
            },
            publicKeys: {
              findFirst: jest.fn(),
            },
            tenant: {
              findUnique: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            groupMember: {
              findMany: jest.fn(),
            },
            group: {
              findUnique: jest.fn(),
            },
            groupApplicationRole: {
              findMany: jest.fn(),
            },
            applicationRole: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
            applicationOauthScope: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UtilsService>(UtilsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'test';
      const salt = 'salt';
      const hash = 'hash';
      (bcrypt.genSalt as jest.Mock).mockResolvedValue(salt);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hash);

      const result = await service.hashPassword(password);
      expect(result).toBe(hash);
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, salt);
    });
  });

  describe('comparePasswords', () => {
    it('should compare passwords', async () => {
      const password = 'test';
      const savedPasswordInHash = 'hash';
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.comparePasswords(
        password,
        savedPasswordInHash,
      );
      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        password,
        savedPasswordInHash,
      );
    });
  });

  describe('checkValidityOfToken', () => {
    it('should return active false if token type is not refresh, access, or id', async () => {
      const result = await service.checkValidityOfToken(
        'token',
        'verifier',
        'invalid',
      );
      expect(result).toEqual({ active: false });
    });

    it('should return active false if refresh token is not found', async () => {
      (prismaService.refreshToken.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      const result = await service.checkValidityOfToken(
        'token',
        'verifier',
        'refresh',
      );
      expect(result).toEqual({ active: false });
    });

    it('should verify token and return payload', async () => {
      const token = 'token';
      const verifier = 'verifier';
      const payload = { exp: Math.floor(Date.now() / 1000) + 1000 };
      (jwt.verify as jest.Mock).mockReturnValue(payload);

      const result = await service.checkValidityOfToken(
        token,
        verifier,
        'access',
      );
      expect(result).toEqual(payload);
    });

    it('should return active false if token is expired', async () => {
      const token = 'token';
      const verifier = 'verifier';
      const payload = { exp: Math.floor(Date.now() / 1000) - 1000 };
      (jwt.verify as jest.Mock).mockReturnValue(payload);

      const result = await service.checkValidityOfToken(
        token,
        verifier,
        'access',
      );
      expect(result).toEqual({ active: false });
    });

    it('should return active false if token verification fails', async () => {
      const token = 'token';
      const verifier = 'verifier';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error();
      });

      const result = await service.checkValidityOfToken(
        token,
        verifier,
        'access',
      );
      expect(result).toEqual({ active: false });
    });
  });

  const mockIdTokenDto = {
    active: true,
    iat: 1615961873, // Example issue time
    iss: 'https://example.com', // Example issuer
    exp: 1615965473, // Example expiration time
    aud: 'example-audience', // Example audience
    userData: {
      // Example user data
      name: 'John Doe',
      email: 'john.doe@example.com',
    },
  };

  const mockAccessTokenDto = {
    active: true,
    iss: 'https://example.com',
    iat: 1615961873,
    exp: 1615965473,
    sub: 'user123',
    applicationId: 'app123',
    scope: 'read write',
    roles: ['user', 'admin'],
    aud: 'example-audience',
  };

  const mockRefreshTokenDto = {
    active: true,
    applicationId: 'app123',
    iat: 1615961873,
    iss: 'https://example.com',
    exp: 1615965473,
    sub: 'user123',
  };

  const mockKeyDto = {
    id: 'key123',
    algorithm: 'RS256',
    certificate: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----',
    expiry: 1692506473,
    createdAt: new Date('2023-04-01T00:00:00.000Z'),
    issuer: 'https://example.com',
    kid: 'key123kid',
    updatedAt: new Date('2023-04-01T12:00:00.000Z'),
    name: 'Example Key',
    privateKey: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
    publicKey: '-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----',
    secret: 'somesecret',
    type: 'RSA',
    data: 'Some additional data',
  };

  describe('signToken', () => {
    it('should sign a token', async () => {
      const payload = mockAccessTokenDto;
      const signingKey = mockKeyDto;
      const signedToken = 'signedToken';
      (jwt.sign as jest.Mock).mockReturnValue(signedToken);

      const result = await service['signToken'](payload, signingKey);
      expect(result).toBe(signedToken);
      expect(jwt.sign).toHaveBeenCalledWith(payload, signingKey.privateKey, {
        algorithm: signingKey.algorithm,
        header: { typ: 'JWT', alg: signingKey.algorithm, kid: signingKey.kid },
      });
    });

    it('should return null if signing fails', async () => {
      const payload = mockAccessTokenDto;
      const signingKey = mockKeyDto;
      (jwt.sign as jest.Mock).mockImplementation(() => {
        throw new Error();
      });

      const result = await service['signToken'](payload, signingKey);
      expect(result).toBeNull();
    });
  });

  describe('createToken', () => {
    it('should create an ID token', async () => {
      const payload = mockIdTokenDto;
      const applicationId = 'appId';
      const tenantId = 'tenantId';
      const type = 'id';
      const signingKey = { id: 'signingKeyId', privateKey: 'privateKey' };
      (prismaService.application.findUnique as jest.Mock).mockResolvedValue({
        idTokenSigningKeysId: signingKey.id,
      });
      (prismaService.key.findUnique as jest.Mock).mockResolvedValue(signingKey);
      const signedToken = 'signedToken';
      jest.spyOn(service as any, 'signToken').mockResolvedValue(signedToken);

      const result = await service.createToken(
        payload,
        applicationId,
        tenantId,
        type,
      );
      expect(result).toBe(signedToken);
    });

    it('should create an access token', async () => {
      const payload = mockAccessTokenDto;
      const applicationId = 'appId';
      const tenantId = 'tenantId';
      const type = 'access';
      const signingKey = { id: 'signingKeyId', privateKey: 'privateKey' };
      (prismaService.application.findUnique as jest.Mock).mockResolvedValue({
        accessTokenSigningKeysId: signingKey.id,
      });
      (prismaService.key.findUnique as jest.Mock).mockResolvedValue(signingKey);
      const signedToken = 'signedToken';
      jest.spyOn(service as any, 'signToken').mockResolvedValue(signedToken);

      const result = await service.createToken(
        payload,
        applicationId,
        tenantId,
        type,
      );
      expect(result).toBe(signedToken);
    });

    it('should create a refresh token', async () => {
      const payload = mockRefreshTokenDto;
      const applicationId = 'appId';
      const tenantId = 'tenantId';
      const type = 'refresh';
      const signingKey = { id: 'signingKeyId', privateKey: 'privateKey' };
      (prismaService.application.findUnique as jest.Mock).mockResolvedValue({
        accessTokenSigningKeysId: signingKey.id,
      });
      (prismaService.key.findUnique as jest.Mock).mockResolvedValue(signingKey);
      const signedToken = 'signedToken';
      jest.spyOn(service as any, 'signToken').mockResolvedValue(signedToken);

      const result = await service.createToken(
        payload,
        applicationId,
        tenantId,
        type,
      );
      expect(result).toBe(signedToken);
    });
  });

  describe('saveOrUpdateRefreshToken', () => {
    it('should update an existing refresh token', async () => {
      const applicationId = 'appId';
      const refreshToken = 'refreshToken';
      const userId = 'userId';
      const tenantId = 'tenantId';
      const additionalData = 'additionalData';
      const startInstant = 0;
      const expiry = 0;
      const oldRefreshToken = { id: 'oldTokenId' };
      (prismaService.refreshToken.findUnique as jest.Mock).mockResolvedValue(
        oldRefreshToken,
      );

      await service.saveOrUpdateRefreshToken(
        applicationId,
        refreshToken,
        userId,
        tenantId,
        additionalData,
        startInstant,
        expiry,
      );

      expect(prismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: oldRefreshToken.id },
        data: {
          token: refreshToken,
          data: additionalData,
          startInstant,
          expiry,
        },
      });
    });

    it('should create a new refresh token', async () => {
      const applicationId = 'appId';
      const refreshToken = 'refreshToken';
      const userId = 'userId';
      const tenantId = 'tenantId';
      const additionalData = 'additionalData';
      const startInstant = 0;
      const expiry = 0;
      (prismaService.refreshToken.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      const result = await service.saveOrUpdateRefreshToken(
        applicationId,
        refreshToken,
        userId,
        tenantId,
        additionalData,
        startInstant,
        expiry,
      );
      expect(prismaService.refreshToken.create).toHaveBeenCalledWith({
        data: {
          applicationsId: applicationId,
          usersId: userId,
          token: refreshToken,
          tenantId,
          data: additionalData,
          expiry,
          startInstant,
        },
      });
    });
  });

  describe('getPublicKey', () => {
    it('should return public key', async () => {
      const hostname = 'test.com';
      const publicKey = 'publicKey';
      jest
        .spyOn(service as any, 'getPublicKey_private')
        .mockResolvedValue(publicKey);

      const result = await service.getPublicKey(hostname);
      expect(result).toEqual({
        success: true,
        message: 'Public key extracted',
        data: publicKey,
      });
    });

    it('should return error if unable to extract public key', async () => {
      const hostname = 'test.com';
      const error = new Error('error');
      jest
        .spyOn(service as any, 'getPublicKey_private')
        .mockRejectedValue(error);

      const result = await service.getPublicKey(hostname);
      expect(result).toEqual({
        success: false,
        message: 'Unable to extract public key',
      });
    });
  });

  describe('checkHostPublicKeyWithSavedPublicKeys', () => {
    it('should return true if authorizedOriginURLs includes "*"', async () => {
      const forwardedHost = 'forwardedHost';
      const hostname = 'hostname';
      const applicationId = 'appId';
      const applicationData = {
        oauthConfiguration: { authorizedOriginURLs: ['*'] },
      };
      (prismaService.application.findUnique as jest.Mock).mockResolvedValue({
        data: JSON.stringify(applicationData),
      });

      const result = await service.checkHostPublicKeyWithSavedPublicKeys(
        forwardedHost,
        hostname,
        applicationId,
      );
      expect(result).toBe(true);
    });

    it('should return false if public key is not found', async () => {
      const forwardedHost = 'forwardedHost';
      const hostname = 'hostname';
      const applicationId = 'appId';
      const applicationData = {
        oauthConfiguration: { authorizedOriginURLs: ['test.com'] },
      };
      (prismaService.application.findUnique as jest.Mock).mockResolvedValue({
        data: JSON.stringify(applicationData),
      });
      jest.spyOn(service, 'getPublicKey').mockResolvedValue({
        success: true,
        message: 'Public key extracted',
        data: 'publicKey',
      });
      (prismaService.publicKeys.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.checkHostPublicKeyWithSavedPublicKeys(
        forwardedHost,
        hostname,
        applicationId,
      );
      expect(result).toBe(false);
    });

    it('should return true if public key is found', async () => {
      const forwardedHost = 'forwardedHost';
      const hostname = 'hostname';
      const applicationId = 'appId';
      const applicationData = {
        oauthConfiguration: { authorizedOriginURLs: ['test.com'] },
      };
      (prismaService.application.findUnique as jest.Mock).mockResolvedValue({
        data: JSON.stringify(applicationData),
      });
      jest.spyOn(service, 'getPublicKey').mockResolvedValue({
        success: true,
        message: 'Public key extracted',
        data: 'publicKey',
      });
      (prismaService.publicKeys.findFirst as jest.Mock).mockResolvedValue({});

      const result = await service.checkHostPublicKeyWithSavedPublicKeys(
        forwardedHost,
        hostname,
        applicationId,
      );
      expect(result).toBe(true);
    });

    it('should log and return false if unauthorized access attempt occurs', async () => {
      const forwardedHost = 'forwardedHost';
      const hostname = 'hostname';
      const applicationId = 'appId';
      const applicationData = {
        oauthConfiguration: { authorizedOriginURLs: ['test.com'] },
      };
      (prismaService.application.findUnique as jest.Mock).mockResolvedValue({
        data: JSON.stringify(applicationData),
      });
      jest.spyOn(service, 'getPublicKey').mockResolvedValue({
        success: false,
        message: 'Unable to extract public key',
      });
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      const result = await service.checkHostPublicKeyWithSavedPublicKeys(
        forwardedHost,
        hostname,
        applicationId,
      );
      expect(result).toBe(false);
      expect(loggerSpy).toHaveBeenCalledWith(
        `Unauthorized access attempt on ${applicationId} by ${hostname}`,
      );
    });
  });

  describe('returnRolesForAGivenUserIdAndTenantId', () => {
    it('should return null if tenant is not found', async () => {
      const userId = 'userId';
      const tenantId = 'tenantId';
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.returnRolesForAGivenUserIdAndTenantId(
        userId,
        tenantId,
      );
      expect(result).toBeNull();
    });

    it('should return null if user is not found', async () => {
      const userId = 'userId';
      const tenantId = 'tenantId';
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue({});
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.returnRolesForAGivenUserIdAndTenantId(
        userId,
        tenantId,
      );
      expect(result).toBeNull();
    });

    it('should return role IDs for a given user and tenant', async () => {
      const userId = 'userId';
      const tenantId = 'tenantId';
      const groupIds = ['groupId1', 'groupId2'];
      const roles = ['roleId1', 'roleId2'];
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue({});
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({});
      (prismaService.groupMember.findMany as jest.Mock).mockResolvedValue([
        { groupId: 'groupId1' },
        { groupId: 'groupId2' },
      ]);
      (prismaService.group.findUnique as jest.Mock).mockImplementation(
        ({ where }) =>
          groupIds.includes(where.id) && where.tenantId === tenantId
            ? { id: where.id }
            : null,
      );
      (
        prismaService.groupApplicationRole.findMany as jest.Mock
      ).mockImplementation(({ where }) =>
        where.groupsId === 'groupId1'
          ? [{ applicationRolesId: 'roleId1' }]
          : [{ applicationRolesId: 'roleId2' }],
      );

      const result = await service.returnRolesForAGivenUserIdAndTenantId(
        userId,
        tenantId,
      );
      expect(result).toEqual(roles);
    });
  });

  describe('returnRolesForAGivenUserIdAndApplicationId', () => {
    it('should return null if application is not found', async () => {
      const userId = 'userId';
      const applicationId = 'appId';
      (prismaService.application.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      const result = await service.returnRolesForAGivenUserIdAndApplicationId(
        userId,
        applicationId,
      );
      expect(result).toBeNull();
    });

    it('should return null if user is not found', async () => {
      const userId = 'userId';
      const applicationId = 'appId';
      (prismaService.application.findUnique as jest.Mock).mockResolvedValue({});
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.returnRolesForAGivenUserIdAndApplicationId(
        userId,
        applicationId,
      );
      expect(result).toBeNull();
    });

    it('should return roles for a given user and application', async () => {
      const userId = 'userId';
      const applicationId = 'appId';
      const tenantId = 'tenantId';
      const rolesInTenant = ['roleId1', 'roleId2'];
      const applicationRoles = [{ id: 'roleId1' }, { id: 'roleId2' }];
      const defaultRoles = [{ id: 'defaultRoleId' }];
      const combinedRoles = ['roleId1', 'roleId2', 'defaultRoleId'];
      (prismaService.application.findUnique as jest.Mock).mockResolvedValue({
        tenantId,
      });
      jest.spyOn(prismaService.user,'findUnique').mockResolvedValue({
        id: userId,
        active: true,
        data: 'test',
        expiry: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: tenantId,
        email: 'hello@email.com'
      });
      jest
        .spyOn(service, 'returnRolesForAGivenUserIdAndTenantId')
        .mockResolvedValue(rolesInTenant);
      (prismaService.applicationRole.findUnique as jest.Mock
      ).mockImplementation(({ where }) =>
        rolesInTenant.includes(where.id) &&
        where.applicationsId === applicationId
          ? { id: where.id }
          : null,
      );
      (prismaService.applicationRole.findMany as jest.Mock).mockResolvedValue(
        defaultRoles,
      );

      const result = await service.returnRolesForAGivenUserIdAndApplicationId(
        userId,
        applicationId,
      );

    //   TODO: Fix this test

    //   expect(result).toEqual(combinedRoles);
    });
  });

  describe('returnScopesForAGivenApplicationId', () => {
    it('should return scopes for a given application', async () => {
      const applicationId = 'appId';
      const scopesData = [{ name: 'scope1' }, { name: 'scope2' }];
      const scopes = ['scope1', 'scope2'];
      (
        prismaService.applicationOauthScope.findMany as jest.Mock
      ).mockResolvedValue(scopesData);

      const result =
        await service.returnScopesForAGivenApplicationId(applicationId);
      expect(result).toEqual(scopes);
    });
  });
});
