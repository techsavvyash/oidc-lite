import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationRolesService } from './application-roles.service';
import { PrismaService } from '../../prisma/prisma.service';
import { HeaderAuthService } from '../../header-auth/header-auth.service';
import {
  BadRequestException,
  ConsoleLogger,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { RoleDto, UpdateRoleDto } from '../application.dto';
import { ResponseDto } from '../../dto/response.dto';
import { Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { updateDTO } from 'src/key/key.dto';

describe('ApplicationRolesService', () => {
  let service: ApplicationRolesService;
  let prismaService: PrismaService;
  let headerAuthService: HeaderAuthService;
  let mockLogger: jest.Mocked<Logger>;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationRolesService,
        {
          provide: PrismaService,
          useValue: {
            application: {
              findUnique: jest.fn(),
            },
            applicationRole: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: HeaderAuthService,
          useValue: {
            validateRoute: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ApplicationRolesService>(ApplicationRolesService);
    prismaService = module.get<PrismaService>(PrismaService);
    headerAuthService = module.get<HeaderAuthService>(HeaderAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRole', () => {
    const mockHeaders = { authorization: 'master' };
    const mockRoleDto: RoleDto = {
      id: 'role-id',
      description: 'Test role',
      name: randomUUID(),
      isDefault: false,
      isSuperRole: false,
    };
    const mockRoleDtoWithoutId: RoleDto = {
      description: 'Test role',
      name: randomUUID(),
      isDefault: false,
      isSuperRole: false,
    };
    const mockApplicationId = 'myminioadmin';
    const mockRoleId = 'role-id';
    const mockApplicationRes = {
      id: mockApplicationId,
      accessTokenSigningKeysId: 'accessTokenSignkeyId',
      active: true,
      data: 'data',
      idTokenSigningKeysId: 'signTokenId',
      createdAt: new Date(),
      updatedAt: new Date(),
      name: 'name',
      tenantId: 'minio-tenant',
    };
    const mockApplicationResponse = {
      id: mockRoleId,
      description: 'Test role',
      name: 'TestRole',
      isDefault: false,
      isSuperRole: false,
      applicationsId: mockApplicationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should create a new role successfully', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: true,
        data: {
          id: 'api-key-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'some-key-value',
          permissions: 'some-permissions',
          metaData: 'some-metadata',
          tenantsId: 'minio-tenant',
        },
        message: 'Valid',
      });
      jest.spyOn(prismaService.application, 'findUnique').mockResolvedValue(mockApplicationRes);
      jest.spyOn(prismaService.applicationRole, 'create').mockResolvedValue(mockApplicationResponse);

      const result = await service.createRole(mockRoleDto, mockApplicationId, mockRoleId, mockHeaders);

      expect(result).toEqual({
        success: true,
        message: 'successfully created a new role',
        data: {
          applicationsId: mockApplicationId,
          newRole: mockApplicationResponse
        }
      });
    });

    it('should use tenantsId from valid.data if present', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: true,
        data: {
          id: 'api-key-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'some-key-value',
          permissions: 'some-permissions',
          metaData: 'some-metadata',
          tenantsId: 'minio-tenant',
        },
        message: 'Valid',
      });
      jest.spyOn(prismaService.application, 'findUnique').mockResolvedValue(mockApplicationRes);
      jest.spyOn(prismaService.applicationRole, 'findUnique').mockResolvedValue(mockApplicationResponse);
      jest.spyOn(prismaService.applicationRole, 'create').mockResolvedValue(mockApplicationResponse);


      const result = await service.createRole(mockRoleDto, mockApplicationId, mockRoleId, mockHeaders);

      expect(result).toBeDefined();
    });

    it('should throw UnauthorizedException if validateRoute fails', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: false,
        message: 'Unauthorized',
      });

      await expect(
        service.createRole(
          mockRoleDto,
          mockApplicationId,
          mockRoleId,
          mockHeaders,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if no data is provided', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: true,
        data: {
          id: 'api-key-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'some-key-value',
          permissions: 'some-permissions',
          metaData: 'some-metadata',
          tenantsId: 'minio-tenant',
        },
        message: 'Valid',
      });

      await expect(
        service.createRole(null, mockApplicationId, mockRoleId, mockHeaders),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no applicationsId is provided', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValueOnce({
        success: true,
        data: {
          id: 'api-key-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'some-key-value',
          permissions: 'some-permissions',
          metaData: 'some-metadata',
          tenantsId: 'minio-tenant',
        },
        message: 'Valid'
      });

      await expect(
        service.createRole({} as RoleDto, null, 'roleId', {})
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if application is not found', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValueOnce({
        success: true,
        data: {
          id: 'api-key-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'some-key-value',
          permissions: 'some-permissions',
          metaData: 'some-metadata',
          tenantsId: 'minio-tenant',
        },
        message: 'Valid'
      });
      jest.spyOn(prismaService.application, 'findUnique').mockResolvedValueOnce(
        null
      );

      await expect(
        service.createRole(mockRoleDto, 'appId', mockRoleId, mockHeaders)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if tenant IDs do not match', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: true,
        message: 'Valid',
        data: {
          id: 'api-key-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'some-key-value',
          permissions: 'some-permissions',
          metaData: 'some-metadata',
          tenantsId: 'null',
        },
      });
      jest.spyOn(prismaService.application, 'findUnique').mockResolvedValue(mockApplicationRes);

      await expect(service.createRole(mockRoleDto, mockApplicationId, mockRoleId, mockHeaders)).rejects.toThrow(UnauthorizedException);
    });

    it('should return data.id when data.id is present', async () => {

      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: true,
        message: 'Valid',
        data: {
          id: 'api-key-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'some-key-value',
          permissions: 'some-permissions',
          metaData: 'some-metadata',
          tenantsId: 'minio-tenant',
        },
      });
      jest.spyOn(prismaService.application, 'findUnique').mockResolvedValue(mockApplicationRes);
      jest.spyOn(prismaService.applicationRole, 'create').mockResolvedValue(mockApplicationResponse);

      const result = await service.createRole(mockRoleDto, mockApplicationId, null, mockHeaders);
      expect(result.data.newRole.id).toBe(mockRoleDto.id);
    });

    it('should return roleId when roleId is present', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: true,
        message: 'Valid',
        data: {
          id: 'api-key-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'some-key-value',
          permissions: 'some-permissions',
          metaData: 'some-metadata',
          tenantsId: 'minio-tenant',
        },
      });
      jest.spyOn(prismaService.application, 'findUnique').mockResolvedValue(mockApplicationRes);
      jest.spyOn(prismaService.applicationRole, 'create').mockResolvedValue(mockApplicationResponse);
      const result = await service.createRole(mockRoleDtoWithoutId, mockApplicationId, mockRoleId, mockHeaders);
      expect(result.data.newRole.id).toBe(mockRoleId);
    });

    it('should return random id when no any id is given', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: true,
        message: 'Valid',
        data: {
          id: 'api-key-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'some-key-value',
          permissions: 'some-permissions',
          metaData: 'some-metadata',
          tenantsId: 'minio-tenant',
        },
      });
      jest.spyOn(prismaService.application, 'findUnique').mockResolvedValue(mockApplicationRes);
      jest.spyOn(prismaService.applicationRole, 'create').mockResolvedValue(mockApplicationResponse);
      const result = await service.createRole(mockRoleDtoWithoutId, mockApplicationId, null, mockHeaders);
      expect(result.data.newRole.id).toBeDefined();
    });


    it('should return internal server error creating a new role', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: true,
        message: 'Valid',
        data: {
          id: 'api-key-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'some-key-value',
          permissions: 'some-permissions',
          metaData: 'some-metadata',
          tenantsId: 'minio-tenant',
        },
      });
      jest.spyOn(prismaService.application, 'findUnique').mockResolvedValue(mockApplicationRes);

      const error = new Error('Unique constraint failed on the fields: (`name`,`applicationsId`)');
      jest.spyOn(prismaService.applicationRole, 'create').mockRejectedValue(error);

      await expect(service.createRole(mockRoleDto, mockApplicationId, mockRoleId, mockHeaders)).rejects.toThrow(
        InternalServerErrorException,
      );

    });
    // Add other test cases for different scenarios...
  });

  // describe('getRole', () => {
  //   const mockHeaders = { authorization : 'master' };
  //   const mockApplicationId = 'myminioadmin';
  //   const mockRoleId = 'role-id';
  //   const mockApplicationRes = {
  //     id: mockApplicationId,
  //     accessTokenSigningKeysId: 'access-token-id',
  //     active: true,
  //     data: 'data',
  //     idTokenSigningKeysId: 'token-signing-id',
  //     createdAt: new Date(),
  //     updatedAt: new Date(),
  //     name: 'name',
  //     tenantId: 'tenant-id',
  //   }
  //   const mockApplicationResponse = {
  //     id: mockRoleId,
  //     applicationsId: mockApplicationId,
  //     description: 'Test role',
  //     createdAt: new Date(),
  //     isDefault: false,
  //     isSuperRole: false,
  //     updatedAt: new Date(),
  //     name: 'TestRole',
  //   }
  //   it('should return role successfully', async () => {
  //     jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
  //       success: true,
  //       data: {
  //         id: 'api-key-id',
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //         keyManager: true,
  //         keyValue: 'some-key-value',
  //         permissions: 'some-permissions',
  //         metaData: 'some-metadata',
  //         tenantsId: null,
  //       },
  //       message: 'Valid',
  //     });
  //     jest.spyOn(prismaService.application, 'findUnique').mockResolvedValue(mockApplicationRes);
  //     jest
  //       .spyOn(prismaService.applicationRole, 'findUnique')
  //       .mockResolvedValue(mockApplicationResponse);

  //     const result = await service.getRole(mockApplicationId,mockRoleId,mockHeaders,);
  //     expect(result).toEqual({
  //       success: true,
  //       message: 'role found',
  //       data: mockApplicationResponse
  //     });
  //   });

  //   it('should throw UnauthorizedException if validateRoute fails', async () => {
  //     jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
  //       success: false,
  //       message: 'Unauthorized',
  //     });

  //     await expect(
  //       service.getRole(mockApplicationId, mockRoleId, mockHeaders),
  //     ).rejects.toThrow(UnauthorizedException);
  //   });

  //   it('should throw BadRequestException if no application id is provided', async () => {
  //     jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
  //       success: true,
  //       data: {
  //         id: 'api-key-id',
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //         keyManager: true,
  //         keyValue: 'some-key-value',
  //         permissions: 'some-permissions',
  //         metaData: 'some-metadata',
  //         tenantsId: null,
  //       },
  //       message: 'Valid',
  //     });

  //     await expect(
  //       service.getRole(null, mockRoleId, mockHeaders),
  //     ).rejects.toThrow(BadRequestException);
  //   });


  //   it('should throw BadRequestException if no id is provided', async () => {
  //     jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
  //       success: true,
  //       data: {
  //         id: 'api-key-id',
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //         keyManager: true,
  //         keyValue: 'some-key-value',
  //         permissions: 'some-permissions',
  //         metaData: 'some-metadata',
  //         tenantsId: null,
  //       },
  //       message: 'Valid',
  //     });

  //     await expect(
  //       service.getRole(mockApplicationId, null, mockHeaders),
  //     ).rejects.toThrow(BadRequestException);
  //   });

  //   it('should throw BadRequestException if application is not found', async () => {
  //     jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValueOnce({
  //       success: true,
  //       data: {
  //         id: 'api-key-id',
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //         keyManager: true,
  //         keyValue: 'some-key-value',
  //         permissions: 'some-permissions',
  //         metaData: 'some-metadata',
  //         tenantsId: 'minio-tenant',
  //       },
  //       message: 'Valid'
  //     });
  //     jest.spyOn(prismaService.application, 'findUnique').mockResolvedValueOnce(
  //       null
  //     );

  //     await expect(service.getRole('mockApplicationId', mockRoleId, mockHeaders)).rejects.toThrow(BadRequestException);
  //   });

  //   it('should throw UnauthorizedException if tenant IDs do not match', async () => {
  //     jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
  //       success: true,
  //       message: 'Valid',
  //       data: {
  //         id: 'api-key-id',
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //         keyManager: true,
  //         keyValue: 'some-key-value',
  //         permissions: 'some-permissions',
  //         metaData: 'some-metadata',
  //         tenantsId: 'null',
  //       },
  //     });
  //     jest.spyOn(prismaService.application, 'findUnique').mockResolvedValue(mockApplicationRes);

  //     await expect(service.getRole(mockApplicationId, mockRoleId, mockHeaders)).rejects.toThrow(UnauthorizedException);
  //   });
  //   it('should throw BadRequestException if role do not found', async () => {
  //     jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValueOnce({
  //       success: true,
  //       message: 'Valid',
  //       data: {
  //         id: 'api-key-id',
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //         keyManager: true,
  //         keyValue: 'some-key-value',
  //         permissions: 'some-permissions',
  //         metaData: 'some-metadata',
  //         tenantsId: 'minio-tenant',
  //       },
  //     });
  //     jest.spyOn(prismaService.application, 'findUnique').mockResolvedValueOnce(mockApplicationRes);
  //     await expect(service.getRole(mockApplicationId, 'mockRoleId', mockHeaders)).rejects.toThrow(BadRequestException);
  //   });


  //   // Add other test cases for different scenarios...
  // });

  describe('updateRole', () => {
    const mockHeaders = { authorizaiton: 'master' };
    const mockApplicationId = 'myminioadmin';
    const mockRoleId = 'role-id';
    const mockUpdateRoleDto: UpdateRoleDto = {
      description: 'Updated description',
    };
    const mockApplicationRes = {
      id: mockApplicationId,
      accessTokenSigningKeysId: 'access-token-id',
      active: true,
      data: 'data',
      idTokenSigningKeysId: 'token-signing-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      name: 'name',
      tenantId: 'tenant-id',
    }
    const mockApplicationResponse = {
      id: mockRoleId,
      applicationsId: mockApplicationId,
      description: 'Updated description',
      createdAt: new Date(),
      isDefault: false,
      isSuperRole: false,
      updatedAt: new Date(),
      name: 'TestRole',
    }
    it('should update role successfully', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: true,
        data: {
          id: 'api-key-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'some-key-value',
          permissions: 'some-permissions',
          metaData: 'some-metadata',
          tenantsId: null,
        },
        message: 'Valid',
      });
      jest.spyOn(prismaService.application, 'findUnique').mockResolvedValue(mockApplicationRes);
      jest.spyOn(prismaService.applicationRole, 'update').mockResolvedValue(mockApplicationResponse);

      const result = await service.updateRole(
        mockApplicationId,
        mockRoleId,
        mockUpdateRoleDto,
        mockHeaders,
      );

      expect(result).toEqual({
        success: true,
        message: 'role updated successfully',
        data: mockApplicationResponse
      });
    });

    it('should throw UnauthorizedException if validateRoute fails', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: false,
        message: 'Unauthorized',
      });

      await expect(
        service.updateRole(
          mockApplicationId,
          mockRoleId,
          mockUpdateRoleDto,
          mockHeaders,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if no data is provided', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: true,
        data: {
          id: 'api-key-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'some-key-value',
          permissions: 'some-permissions',
          metaData: 'some-metadata',
          tenantsId: null,
        },
        message: 'Valid',
      });

      await expect(
        service.updateRole(mockApplicationId, mockRoleId, null, mockHeaders),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no application Id is provided', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValueOnce({
        success: true,
        data: {
          id: 'api-key-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'some-key-value',
          permissions: 'some-permissions',
          metaData: 'some-metadata',
          tenantsId: 'minio-tenant',
        },
        message: 'Valid'
      });

      await expect(service.updateRole(null, mockRoleId, mockUpdateRoleDto, mockHeaders)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if application is not found', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValueOnce({
        success: true,
        data: {
          id: 'api-key-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'some-key-value',
          permissions: 'some-permissions',
          metaData: 'some-metadata',
          tenantsId: 'minio-tenant',
        },
        message: 'Valid'
      });
      jest.spyOn(prismaService.application, 'findUnique').mockResolvedValueOnce(
        null
      );

      await expect(service.updateRole('mockApplicationId', mockRoleId, mockUpdateRoleDto, mockHeaders)).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if tenant IDs do not match', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: true,
        message: 'Valid',
        data: {
          id: 'api-key-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'some-key-value',
          permissions: 'some-permissions',
          metaData: 'some-metadata',
          tenantsId: 'null',
        },
      });
      jest.spyOn(prismaService.application, 'findUnique').mockResolvedValue(mockApplicationRes);

      await expect(service.updateRole(mockApplicationId, mockRoleId, mockUpdateRoleDto, mockHeaders)).rejects.toThrow(UnauthorizedException);
    });

    it('should return internal server error creating a new role', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: true,
        message: 'Valid',
        data: {
          id: 'api-key-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'some-key-value',
          permissions: 'some-permissions',
          metaData: 'some-metadata',
          tenantsId: null,
        },
      });
      jest.spyOn(prismaService.application, 'findUnique').mockResolvedValue(mockApplicationRes);

      const error = new Error('Unique constraint failed on the fields: (`name`,`applicationsId`)');
      jest.spyOn(prismaService.applicationRole, 'update').mockRejectedValue(error);

      await expect(service.updateRole(mockApplicationId, mockRoleId, mockUpdateRoleDto, mockHeaders)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
    // Add other test cases for different scenarios...
  });

  describe('deleteRole', () => {
    const mockHeaders = { authorization: 'master' };
    const mockApplicationId = 'myminioadmin';
    const mockRoleId = 'role-id';
    const mockApplicationRes = {
      id: mockApplicationId,
      accessTokenSigningKeysId: 'access-token-id',
      active: true,
      data: 'data',
      idTokenSigningKeysId: 'token-signing-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      name: 'name',
      tenantId: 'tenant-id',
    }
    // type '{ id: string; applicationsId: string; description: string; createdAt: Date; isDefault: boolean; isSuperRole: boolean; updatedAt: Date; name: string; }': createdAt, updatedAt
    const mockApplicationResponse = {
      id: mockRoleId,
      applicationsId: mockApplicationId,
      description: 'Test role',
      createdAt: new Date(),
      isDefault: false,
      isSuperRole: false,
      updatedAt: new Date(),
      name: 'TestRole',
    }
    it('should delete role successfully', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: true,
        data: {
          id: 'api-key-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'some-key-value',
          permissions: 'some-permissions',
          metaData: 'some-metadata',
          tenantsId: null,
        },
        message: 'Valid',
      });
      jest.spyOn(prismaService.application, 'findUnique').mockResolvedValue(mockApplicationRes);
      jest.spyOn(prismaService.applicationRole, 'delete').mockResolvedValue(mockApplicationResponse);

      const result = await service.deleteRole(mockApplicationId, mockRoleId, mockHeaders);

      expect(result).toEqual({
        success: true,
        message: 'role deleted successfully',
        data: mockApplicationResponse
      });
    });

    it('should throw UnauthorizedException if validateRoute fails', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: false,
        message: 'Unauthorized',
      });

      await expect(
        service.deleteRole(mockApplicationId, mockRoleId, mockHeaders),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if no application id is provided', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: true,
        data: {
          id: 'api-key-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'some-key-value',
          permissions: 'some-permissions',
          metaData: 'some-metadata',
          tenantsId: null,
        },
        message: 'Valid',
      });

      await expect(
        service.deleteRole(null, mockRoleId, mockHeaders),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if application is not found', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValueOnce({
        success: true,
        data: {
          id: 'api-key-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'some-key-value',
          permissions: 'some-permissions',
          metaData: 'some-metadata',
          tenantsId: 'minio-tenant',
        },
        message: 'Valid'
      });
      jest.spyOn(prismaService.application, 'findUnique').mockResolvedValueOnce(
        null
      );

      await expect(service.deleteRole('mockApplicationId', mockRoleId, mockHeaders)).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if tenant IDs do not match', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: true,
        message: 'Valid',
        data: {
          id: 'api-key-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'some-key-value',
          permissions: 'some-permissions',
          metaData: 'some-metadata',
          tenantsId: 'null',
        },
      });
      jest.spyOn(prismaService.application, 'findUnique').mockResolvedValue(mockApplicationRes);

      await expect(service.deleteRole(mockApplicationId, mockRoleId, mockHeaders)).rejects.toThrow(UnauthorizedException);
    });

    it('should return internal server error creating a new role', async () => {
      jest.spyOn(headerAuthService, 'validateRoute').mockResolvedValue({
        success: true,
        message: 'Valid',
        data: {
          id: 'api-key-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          keyManager: true,
          keyValue: 'some-key-value',
          permissions: 'some-permissions',
          metaData: 'some-metadata',
          tenantsId: null,
        },
      });
      jest.spyOn(prismaService.application, 'findUnique').mockResolvedValue(mockApplicationRes);
      const error = new Error('Unique constraint failed on the fields: (`name`,`applicationsId`)');
      jest.spyOn(prismaService.applicationRole, 'delete').mockRejectedValue(error);

      await expect(service.deleteRole(mockApplicationId, mockRoleId, mockHeaders)).rejects.toThrow(
        InternalServerErrorException,
      );
    });


    // Add other test cases for different scenarios...
  });
});
