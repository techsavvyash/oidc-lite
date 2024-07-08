import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { HeaderAuthService } from '../header-auth/header-auth.service';
import { UtilsService } from '../utils/utils.service';
import { BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './user.dto';
import { UserRegistrationService } from './user-registration/user-registration.service';
import { permission } from 'process';

describe('UserService', () => {
  let service: UserService;
  let prismaService: PrismaService;
  let headerAuthService: HeaderAuthService;
  let utilsService: UtilsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            tenant: {
              findUnique: jest.fn(),
            },
            group: {
              findUnique: jest.fn(),
            },
            groupMember: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: HeaderAuthService,
          useValue: {
            validateRoute: jest.fn(),
          },
        },
        {
          provide: UtilsService,
          useValue: {
            hashPassword: jest.fn(),
          },
        },
        {
            provide: UserRegistrationService,
            useValue: {
              sendRegistrationEmail: jest.fn(),
            },
        }
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
    headerAuthService = module.get<HeaderAuthService>(HeaderAuthService);
    utilsService = module.get<UtilsService>(UtilsService);
  });

  const mockApiKey = {
    id: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    keyManager: true,
    keyValue: 'apiKey',
    permissions: 'permissions',
    tenantsId: '1',
    metaData: 'metaData',
  }

  const mockApiKeyResponse = {
    success: true,
    message: 'API key found successfully',
    data: mockApiKey,
  }

  const mockTenant = {
    id: '1',
    accessTokenSigningKeysId: '1',
    data: 'data',
    idTokenSigningKeysId: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    name: 'tenant',
    }
// Type '{ id: string; active: boolean; type '{ id: string; active: boolean; data: string; expiry: number; createdAt: Date; updatedAt: Date; tenantId: string; groupId: string; email: string; }'
    const mockUser = {
        id: '1',
        active: true,
        data: JSON.stringify({ username: 'testuser' }),
        expiry: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: '1',
        groupId : 'mockGpId',
        email: 'test@test.com',
    }

    const mockGroup = {
        id: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'group',
        tenantId: '1',
        permissions : 'mockPermission',
        attributes : 'mockAttributes' 
    }

    const mockCreateUserDto = {
        active: true,
        membership: ['group1'],
        userData: {
            username: 'testuser',
            password: 'Password@123',
        },
        email: 'test@test.com'
    }

  describe('createAUser', () => {
    it('should throw BadRequestException if no data is given', async () => {
      await expect(service.createAUser('1', null, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException if route validation fails', async () => {
      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue({ success: false, message: 'Unauthorized' });

      await expect(
        service.createAUser('1', new CreateUserDto(), {}),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if tenant id is missing', async () => {
      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue(mockApiKeyResponse);

      await expect(
        service.createAUser('1', new CreateUserDto(), {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if tenant does not exist', async () => {
      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue(mockApiKeyResponse);
      jest.spyOn(prismaService.tenant, 'findUnique').mockResolvedValue(null);

      await expect(
        service.createAUser('1', new CreateUserDto(), {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user already exists', async () => {
      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue(mockApiKeyResponse);
      jest.spyOn(prismaService.tenant, 'findUnique').mockResolvedValue(mockTenant);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      await expect(
        service.createAUser('1', new CreateUserDto(), {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a user successfully', async () => {

      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue(mockApiKeyResponse);
      jest.spyOn(prismaService.tenant, 'findUnique').mockResolvedValue(mockTenant);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest
        .spyOn(utilsService, 'hashPassword')
        .mockResolvedValue('hashedPassword');
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(mockUser);
      jest
        .spyOn(prismaService.group, 'findUnique')
        .mockResolvedValue(mockGroup);

      const result = await service.createAUser('1', mockCreateUserDto, {});
      expect(result.success).toBe(true);
      expect(result.message).toBe('New user created');
    });

    it('should throw InternalServerErrorException on create error', async () => {

      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue(mockApiKeyResponse);
      jest.spyOn(prismaService.tenant, 'findUnique').mockResolvedValue(mockTenant);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest
        .spyOn(utilsService, 'hashPassword')
        .mockResolvedValue('hashedPassword');
      jest.spyOn(prismaService.user, 'create').mockRejectedValue(new Error());

      await expect(service.createAUser('1', mockCreateUserDto, {})).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('returnAUser', () => {
    it('should throw UnauthorizedException if route validation fails', async () => {
      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue({ success: false, message: 'Unauthorized' });

      await expect(service.returnAUser('1', {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException if user id is not provided', async () => {
      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue(mockApiKeyResponse);

      await expect(service.returnAUser(null, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if user does not exist', async () => {
      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue(mockApiKeyResponse);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.returnAUser('1', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException if user is not authorized', async () => {
      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue({...mockApiKeyResponse, data: {...mockApiKeyResponse.data ,tenantsId: '2' }});
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser);

      await expect(service.returnAUser('1', {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return a user successfully', async () => {
      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue(mockApiKeyResponse);
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser);

      const result = await service.returnAUser('1', {});
      expect(result.success).toBe(true);
      expect(result.message).toBe('User found successfully');
    });
  });

  describe('updateAUser', () => {
    it('should throw UnauthorizedException if route validation fails', async () => {
      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue({ success: false, message: 'Unauthorized' });

      await expect(
        service.updateAUser('1', new UpdateUserDto(), {}),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if user id is not provided', async () => {
      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue(mockApiKeyResponse);

      await expect(
        service.updateAUser(null, new UpdateUserDto(), {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user does not exist', async () => {
      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue(mockApiKeyResponse);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.updateAUser('1', new UpdateUserDto(), {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if user is not authorized', async () => {
      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue({
          ...mockApiKeyResponse,
          data: { ...mockApiKeyResponse.data, tenantsId: '2' },
        });
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser);

      await expect(
        service.updateAUser('1', new UpdateUserDto(), {}),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should update a user successfully', async () => {
      const dto = new UpdateUserDto();
      dto.active = true;

      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue(mockApiKeyResponse);
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockUser);

      const result = await service.updateAUser('1', dto, {});
      expect(result.success).toBe(true);
      expect(result.message).toBe('User updated successfully');
    });

    it('should throw InternalServerErrorException on update error', async () => {
      const dto = new UpdateUserDto();
      dto.active = true;

      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue(mockApiKeyResponse);
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser);
      jest.spyOn(prismaService.user, 'update').mockRejectedValue(new Error());

      await expect(service.updateAUser('1', dto, {})).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('deleteAUser', () => {
    it('should throw UnauthorizedException if route validation fails', async () => {
      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue({ success: false, message: 'Unauthorized' });

      await expect(service.deleteAUser('1', {}, true)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException if user id is not provided', async () => {
      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue(mockApiKeyResponse);

      await expect(service.deleteAUser(null, {}, true)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if user does not exist', async () => {
      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue(mockApiKeyResponse);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.deleteAUser('1', {}, true)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException if user is not authorized', async () => {
      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue({
          ...mockApiKeyResponse,
          data: { ...mockApiKeyResponse.data, tenantsId: '2' },
        });
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser);

      await expect(service.deleteAUser('1', {}, true)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should delete a user permanently', async () => {
      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue(mockApiKeyResponse);
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser);
      jest.spyOn(prismaService.user, 'delete').mockResolvedValue(mockUser);

      const result = await service.deleteAUser('1', {}, true);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User deleted permanently');
    });

    it('should inactivate a user', async () => {
      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue(mockApiKeyResponse);
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockUser);

      const result = await service.deleteAUser('1', {}, false);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User inactivated');
    });

    it('should throw InternalServerErrorException on delete error', async () => {
      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue(mockApiKeyResponse);
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser);
      jest.spyOn(prismaService.user, 'delete').mockRejectedValue(new Error());

      await expect(service.deleteAUser('1', {}, true)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException on inactivate error', async () => {
      jest
        .spyOn(headerAuthService, 'validateRoute')
        .mockResolvedValue(mockApiKeyResponse);
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser);
      jest.spyOn(prismaService.user, 'update').mockRejectedValue(new Error());

      await expect(service.deleteAUser('1', {}, false)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
