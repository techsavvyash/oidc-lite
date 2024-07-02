import {
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { GroupsService } from './groups.service';
import { HeaderAuthService } from '../header-auth/header-auth.service';
import { createGroupDTO, UpdateGroupDto } from './dtos/groups.dto';

describe('GroupsService', () => {
  let service: GroupsService;
  let prismaService: PrismaService;
  let headerAuthService: HeaderAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        {
          provide: PrismaService,
          useValue: {
            tenant: {
              findUnique: jest.fn(),
            },
            group: {
              findUnique: jest.fn(),
              create: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            groupApplicationRole: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            applicationRole: {
              findUnique: jest.fn(),
            },
            application: {
              findUnique: jest.fn(),
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

    service = module.get<GroupsService>(GroupsService);
    prismaService = module.get<PrismaService>(PrismaService);
    headerAuthService = module.get<HeaderAuthService>(HeaderAuthService);
  });

  describe('createGroup', () => {
    it('should throw BadRequestException if uuid is not provided', async () => {
      await expect(
        service.createGroup({} as createGroupDTO, null, {}),
      ).rejects.toThrow(
        new BadRequestException({
          success: false,
          message: 'please provide a valid id',
        }),
      );
    });

    it('should throw UnauthorizedException if validateRoute fails', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: false,
        message: 'unauthorized',
      });

      await expect(
        service.createGroup({} as createGroupDTO, 'some-uuid', {}),
      ).rejects.toThrow(
        new UnauthorizedException({
          success: false,
          message: 'unauthorized',
        }),
      );
    });

    it('should throw BadRequestException if tenantId is not found', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        message: 'authorized',
        data: { tenantsId: null },
      });
      const headers = { authorization: 'master' };

      await expect(
        service.createGroup({} as createGroupDTO, 'some-uuid', headers),
      ).rejects.toThrow(
        new BadRequestException({
          success: false,
          message:
            'x-stencil-tenantid header required when using tenant scoped key',
        }),
      );
    });

    it('should throw BadRequestException if no tenant exists', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        message: 'authorized',
        data: { tenantsId: null },
      });
      const headers = {
        authorization: 'master',
        'x-stencil-tenantid': 'some-non-existing-tenantid',
      };

      await expect(
        service.createGroup({} as createGroupDTO, 'some-uuid', headers),
      ).rejects.toThrow(
        new BadRequestException({
          success: false,
          message: 'No such tenant exists',
        }),
      );
    });

    it('should throw BadRequestException if group with given name in tenant exists', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        message: 'authorized',
        data: { tenantsId: null },
      });
      const headers = {
        authorization: 'master',
        'x-stencil-tenantid': 'minio-tenant',
      };
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue({
        data: {
          id: 'some tenant id',
        },
      });
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue({
        data: {
          id: 'some group exists',
        },
      });
      await expect(
        service.createGroup(
          { name: 'First group', roleIDs: ['some role'] } as createGroupDTO,
          'some-uuid',
          headers,
        ),
      ).rejects.toThrow(
        new BadRequestException({
          success: false,
          message: 'Group with the same name already exists for this tenant',
        }),
      );
    });

    it('should create a new group successfully', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        message: 'authorized',
        data: { tenantsId: null },
      });
      const headers = {
        authorization: 'master',
        'x-stencil-tenantid': 'minio-tenant',
      };
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue({
        data: {
          id: 'some tenant id',
        },
      });
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.group.create as jest.Mock).mockResolvedValue({
        id: 'groupId',
      });
      const response = await service.createGroup(
        { name: 'First group', roleIDs: ['some role'] } as createGroupDTO,
        'some-uuid',
        headers,
      );
      expect(response).toEqual({
        success: true,
        message: 'Group created successfully',
        data: { id: 'groupId' },
      });
    });
  });

  describe('retrieveAllGroups', () => {
    it('should throw UnauthorizedException if validateRoute fails', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: false,
        message: 'unauthorized',
      });

      await expect(service.retrieveAllGroups({})).rejects.toThrow(
        new UnauthorizedException({
          success: false,
          message: 'unauthorized',
        }),
      );
    });

    it('should return all groups if tenantId is not provided', async () => {
      const headers = { authorization: 'some-token' };
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: {},
      });
      const groups = [
        { id: '1', name: 'Group 1' },
        { id: '2', name: 'Group 2' },
      ];
      (prismaService.group.findMany as jest.Mock).mockResolvedValue(groups);

      const result = await service.retrieveAllGroups(headers);

      expect(result).toEqual({
        success: true,
        message: 'All groups found',
        data: groups,
      });
    });

    it('should return groups of the provided tenant', async () => {
      const headers = {
        authorization: 'some-token',
        'x-stencil-tenantid': 'tenant-1',
      };
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: { tenantsId: 'tenant-1' },
      });
      const groups = [{ id: '1', name: 'Group 1', tenantId: 'tenant-1' }];
      (prismaService.group.findMany as jest.Mock).mockResolvedValue(groups);

      const result = await service.retrieveAllGroups(headers);

      expect(result).toEqual({
        success: true,
        message: 'All groups of the provided tenant found',
        data: groups,
      });
    });

    it('should handle errors during group retrieval', async () => {
      const headers = { authorization: 'some-token' };
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: {},
      });
      const errorMessage = 'Database error';
      (prismaService.group.findMany as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(service.retrieveAllGroups(headers)).rejects.toThrow(
        new BadRequestException({
          success: false,
          message: 'error while finding groups',
        }),
      );
    });
  });

  describe('retrieveGpById', () => {
    it('should throw BadRequestException if id is not provided', async () => {
      const headers = { authorization: 'some-token' };
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        message: 'authorized',
        data: { tenantsId: 'sometenant' },
      });

      await expect(service.retrieveGpById(null, headers)).rejects.toThrow(
        new BadRequestException({
          success: false,
          message: 'please send group id while sending reqeust',
        }),
      );
    });

    it('should throw UnauthorizedException if validateRoute fails', async () => {
      const headers = { authorization: 'some-token' };
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: false,
        message: 'unauthorized',
      });

      await expect(service.retrieveGpById('group-id', headers)).rejects.toThrow(
        new UnauthorizedException({
          success: false,
          message: 'unauthorized',
        }),
      );
    });

    it('should throw BadRequestException if group is not found', async () => {
      const headers = { authorization: 'some-token' };
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: { tenantsId: 'tenant-1' },
      });
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.retrieveGpById('group-id', headers)).rejects.toThrow(
        new BadRequestException({
          success: false,
          message: 'group not found with given id',
        }),
      );
    });

    it('should throw BadRequestException if group.tenantId does not match tenantId', async () => {
      const headers = { authorization: 'some-token' };
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: { tenantsId: 'tenant-1' },
      });
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue({
        id: 'group-id',
        tenantId: 'tenant-2',
      });

      await expect(
        service.retrieveGpById('group-id', headers),
      ).resolves.toEqual({
        success: false,
        message: 'group not found with given id',
      });
    });

    it('should return group if tenantId matches', async () => {
      const headers = {
        authorization: 'some-token',
        'x-stencil-tenantid': 'tenant-1',
      };
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: { tenantsId: 'tenant-1' },
      });
      const group = { id: 'group-id', tenantId: 'tenant-1' };
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue(group);

      const result = await service.retrieveGpById('group-id', headers);

      expect(result).toEqual({
        success: true,
        message: 'group retrieved by given id',
        data: group,
      });
    });
  });

  describe('updateGp', () => {
    it('should throw BadRequestException if uuid is not provided', async () => {
      const headers = { authorization: 'some-token' };
      const data: UpdateGroupDto = { name: 'new name', roleIDs: ['role1'] };
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        message: 'authorized',
        data: { tenantsId: 'some id' },
      });
      await expect(service.updateGp(null, data, headers)).rejects.toThrow(
        new BadRequestException({
          success: false,
          message: 'please send id along with request',
        }),
      );
    });

    it('should throw UnauthorizedException if validateRoute fails', async () => {
      const headers = { authorization: 'some-token' };
      const data: UpdateGroupDto = { name: 'new name', roleIDs: ['role1'] };
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: false,
        message: 'unauthorized',
      });

      await expect(service.updateGp('group-id', data, headers)).rejects.toThrow(
        new UnauthorizedException({
          success: false,
          message: 'unauthorized',
        }),
      );
    });

    it('should throw BadRequestException if group is not found', async () => {
      const headers = { authorization: 'some-token' };
      const data: UpdateGroupDto = { name: 'new name', roleIDs: ['role1'] };
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: { tenantsId: 'tenant-1' },
      });
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateGp('group-id', data, headers)).rejects.toThrow(
        new BadRequestException({
          success: false,
          message: 'unable to find group with given id',
        }),
      );
    });

    it('should throw UnauthorizedException if tenantId does not match and tenantsId is null', async () => {
      const headers = { authorization: 'some-token' };
      const data: UpdateGroupDto = { name: 'new name', roleIDs: ['role1'] };
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: { tenantsId: null },
      });
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue({
        id: 'group-id',
        tenantId: 'tenant-2',
      });

      await expect(service.updateGp('group-id', data, headers)).rejects.toThrow(
        new UnauthorizedException({
          success: false,
          message: 'You are not authorized enough',
        }),
      );
    });

    it('should update group successfully if tenantId matches', async () => {
      const headers = {
        authorization: 'some-token',
        'x-stencil-tenantid': 'tenant-1',
      };
      const data: UpdateGroupDto = { name: 'new name', roleIDs: ['role1'] };
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: { tenantsId: 'tenant-1' },
      });
      const oldGroup = {
        id: 'group-id',
        name: 'old name',
        tenantId: 'tenant-1',
      };
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue(oldGroup);
      const updatedGroup = { ...oldGroup, name: data.name };
      (prismaService.group.update as jest.Mock).mockResolvedValue(updatedGroup);

      const result = await service.updateGp('group-id', data, headers);

      expect(result).toEqual({
        success: true,
        message: 'Group updated',
        data: updatedGroup,
      });
    });

    it('should handle errors during group update', async () => {
      const headers = { authorization: 'some-token' };
      const data: UpdateGroupDto = { name: 'new name', roleIDs: ['role1'] };
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: { tenantsId: 'tenant-1' },
      });
      const oldGroup = { id: 'group-id', tenantId: 'tenant-1' };
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue(oldGroup);
      const errorMessage = 'Database error';
      (prismaService.group.update as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(service.updateGp('group-id', data, headers)).rejects.toThrow(
        new BadRequestException({
          success: false,
          message: 'error while finding a gp',
        }),
      );
    });
  });

  describe('deleteGroup', () => {
    it('should throw BadRequestException if uuid is not provided', async () => {
      const headers = { authorization: 'some-token' };
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        message: 'authorized',
        data: { tenantsId: 'some tenant' },
      });
      await expect(service.deleteGroup('', headers)).rejects.toThrow(
        new BadRequestException({
          success: false,
          message: 'please send id along with request',
        }),
      );
    });

    it('should throw UnauthorizedException if validateRoute fails', async () => {
      const headers = { authorization: 'some-token' };
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: false,
        message: 'unauthorized',
      });

      await expect(service.deleteGroup('group-id', headers)).rejects.toThrow(
        new UnauthorizedException({
          success: false,
          message: 'unauthorized',
        }),
      );
    });

    it('should throw BadRequestException if group is not found', async () => {
      const headers = { authorization: 'some-token' };
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: { tenantsId: 'tenant-1' },
      });
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteGroup('group-id', headers)).rejects.toThrow(
        new BadRequestException({
          success: false,
          message: 'unable to find group with given id',
        }),
      );
    });

    it('should throw UnauthorizedException if tenantId does not match and tenantsId is not null', async () => {
      const headers = { authorization: 'some-token' };
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: { tenantsId: 'tenant-1' },
      });
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue({
        id: 'group-id',
        tenantId: 'tenant-2',
      });

      await expect(service.deleteGroup('group-id', headers)).rejects.toThrow(
        new UnauthorizedException({
          success: false,
          message: 'You are not authorized enough',
        }),
      );
    });

    it('should delete group successfully if tenantId matches', async () => {
      const headers = {
        authorization: 'some-token',
        'x-stencil-tenantid': 'tenant-1',
      };
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: { tenantsId: 'tenant-1' },
      });
      const group = { id: 'group-id', tenantId: 'tenant-1' };
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue(group);
      (prismaService.group.delete as jest.Mock).mockResolvedValue(group);

      const result = await service.deleteGroup('group-id', headers);

      expect(result).toEqual({
        success: true,
        message: 'group with given id deleted successfully',
        data: group,
      });
    });

    it('should handle errors during group deletion', async () => {
      const headers = { authorization: 'some-token' };
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: { tenantsId: 'tenant-1' },
      });
      const group = { id: 'group-id', tenantId: 'tenant-1' };
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue(group);
      const errorMessage = 'Database error';
      (prismaService.group.delete as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(service.deleteGroup('group-id', headers)).rejects.toThrow(
        new BadRequestException({
          success: false,
          message: 'error occured while searching for a gp id',
        }),
      );
    });
  });

  describe('saveGroupApplicationRole', () => {
    it('should return the existing role if it is found', async () => {
      const groupId = 'group-id';
      const applicationRoleId = 'application-role-id';
      const existingRole = {
        groupsId: groupId,
        applicationRolesId: applicationRoleId,
      };

      (
        prismaService.groupApplicationRole.findUnique as jest.Mock
      ).mockResolvedValue(existingRole);

      const result = await (service as any).saveGroupApplicationRole(
        groupId,
        applicationRoleId,
      );

      expect(result).toEqual(existingRole);
      expect(
        prismaService.groupApplicationRole.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          group_application_roles_uk_1: {
            applicationRolesId: applicationRoleId,
            groupsId: groupId,
          },
        },
      });
      expect(prismaService.groupApplicationRole.create).not.toHaveBeenCalled();
    });

    it('should create a new role if it is not found', async () => {
      const groupId = 'group-id';
      const applicationRoleId = 'application-role-id';
      const newRole = {
        groupsId: groupId,
        applicationRolesId: applicationRoleId,
      };

      (
        prismaService.groupApplicationRole.findUnique as jest.Mock
      ).mockResolvedValue(null);
      (
        prismaService.groupApplicationRole.create as jest.Mock
      ).mockResolvedValue(newRole);

      const result = await (service as any).saveGroupApplicationRole(
        groupId,
        applicationRoleId,
      );

      expect(result).toEqual(newRole);
      expect(
        prismaService.groupApplicationRole.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          group_application_roles_uk_1: {
            applicationRolesId: applicationRoleId,
            groupsId: groupId,
          },
        },
      });
      expect(prismaService.groupApplicationRole.create).toHaveBeenCalledWith({
        data: { groupsId: groupId, applicationRolesId: applicationRoleId },
      });
    });

    it('should handle errors during role creation', async () => {
      const groupId = 'group-id';
      const applicationRoleId = 'application-role-id';
      const errorMessage = 'Database error';

      (
        prismaService.groupApplicationRole.findUnique as jest.Mock
      ).mockResolvedValue(null);
      (
        prismaService.groupApplicationRole.create as jest.Mock
      ).mockRejectedValue(new Error(errorMessage));

      await expect(
        (service as any).saveGroupApplicationRole(groupId, applicationRoleId),
      ).rejects.toThrow(errorMessage);

      expect(
        prismaService.groupApplicationRole.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          group_application_roles_uk_1: {
            applicationRolesId: applicationRoleId,
            groupsId: groupId,
          },
        },
      });
      expect(prismaService.groupApplicationRole.create).toHaveBeenCalledWith({
        data: { groupsId: groupId, applicationRolesId: applicationRoleId },
      });
    });
  });

  describe('extractRolesFromRoleId', () => {
    it('should return null if roleIDs is null', async () => {
      const result = await (service as any).extractRolesFromRoleId(
        null,
        'tenant-id',
      );
      expect(result).toBeNull();
    });

    it('should return null if roleIDs is an empty array', async () => {
      const result = await (service as any).extractRolesFromRoleId(
        [],
        'tenant-id',
      );
      expect(result).toBeNull();
    });

    it('should filter out roles that do not exist', async () => {
      const roleIDs = ['role1', 'role2'];
      (prismaService.applicationRole.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'role2', applicationsId: 'app2' });
      (prismaService.application.findUnique as jest.Mock).mockResolvedValue({
        tenantId: 'tenant-id',
      });
      const result = await (service as any).extractRolesFromRoleId(
        roleIDs,
        'tenant-id',
      );

      expect(result).toEqual([
        {
          applicationId: 'app2',
          applicationRole: { id: 'role2', applicationsId: 'app2' },
        },
      ]);
    });

    it('should filter out roles from applications that do not belong to the tenant', async () => {
      const roleIDs = ['role1', 'role2'];
      (prismaService.applicationRole.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 'role1', applicationsId: 'app1' })
        .mockResolvedValueOnce({ id: 'role2', applicationsId: 'app2' });
      (prismaService.application.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 'app1', tenantId: 'different-tenant' })
        .mockResolvedValueOnce({ id: 'app2', tenantId: 'tenant-id' });

      const result = await (service as any).extractRolesFromRoleId(
        roleIDs,
        'tenant-id',
      );

      expect(result).toEqual([
        {
          applicationId: 'app2',
          applicationRole: { id: 'role2', applicationsId: 'app2' },
        },
      ]);
    });

    it('should return all valid roles for the tenant', async () => {
      const roleIDs = ['role1', 'role2'];
      (prismaService.applicationRole.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 'role1', applicationsId: 'app1' })
        .mockResolvedValueOnce({ id: 'role2', applicationsId: 'app2' });
      (prismaService.application.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 'app1', tenantId: 'tenant-id' })
        .mockResolvedValueOnce({ id: 'app2', tenantId: 'tenant-id' });

      const result = await (service as any).extractRolesFromRoleId(
        roleIDs,
        'tenant-id',
      );

      expect(result).toEqual([
        {
          applicationId: 'app1',
          applicationRole: { id: 'role1', applicationsId: 'app1' },
        },
        {
          applicationId: 'app2',
          applicationRole: { id: 'role2', applicationsId: 'app2' },
        },
      ]);
    });

    it('should handle errors during role or application lookup', async () => {
      const roleIDs = ['role1'];
      const errorMessage = 'Database error';

      (prismaService.applicationRole.findUnique as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(
        (service as any).extractRolesFromRoleId(roleIDs, 'tenant-id'),
      ).rejects.toThrow(errorMessage);

      expect(prismaService.applicationRole.findUnique).toHaveBeenCalledWith({
        where: { id: 'role1' },
      });
    });
  });
});
