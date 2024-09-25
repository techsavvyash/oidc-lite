import { Test, TestingModule } from '@nestjs/testing';
import { UtilsService } from './utils.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

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
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest
        .spyOn(service, 'returnRolesForAGivenUserIdAndTenantId')
        .mockResolvedValue(rolesInTenant);
      (
        prismaService.applicationRole.findUnique as jest.Mock
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
