import { Test, TestingModule } from '@nestjs/testing';
import { GroupUserService } from './gpUser.service';
import { PrismaService } from '../prisma/prisma.service';
import { HeaderAuthService } from '../header-auth/header-auth.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { addUserDTO } from './dtos/gpUser.dto';

describe('GroupUserService', () => {
  let service: GroupUserService;
  let prismaService: PrismaService;
  let headerAuthService: HeaderAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupUserService,
        {
          provide: PrismaService,
          useValue: {
            group: {
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
            },
            groupMember: {
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
            },
            tenant: {
              findUnique: jest.fn(),
            },
            user: {
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

    service = module.get<GroupUserService>(GroupUserService);
    prismaService = module.get<PrismaService>(PrismaService);
    headerAuthService = module.get<HeaderAuthService>(HeaderAuthService);
  });

  describe('addUser', () => {
    it('should throw UnauthorizedException if route validation fails', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: false,
        message: 'Unauthorized',
      });

      await expect(
        service.addUser({ members: [] }, { 'x-stencil-tenantid': 'tenant-id' }),
      ).rejects.toThrow(
        new UnauthorizedException({
          success: false,
          message: 'Unauthorized',
        }),
      );
    });

    it('should throw BadRequestException if tenant does not exist', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: { tenantsId: 'tenant-id' },
      });
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.addUser({ members: [] }, { 'x-stencil-tenantid': 'tenant-id' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return success message if users are added successfully', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: { tenantsId: 'tenant-id' },
      });
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue({
        id: 'tenant-id',
      });
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue({
        id: 'group-id',
        tenantId: 'tenant-id',
      });
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-id',
        tenantId: 'tenant-id',
      });
      (prismaService.groupMember.create as jest.Mock).mockResolvedValue({
        id: 'membership-id',
      });

      const result = await service.addUser(
        { members: [{ groupId: 'group-id', userIds: ['user-id'] }] },
        { 'x-stencil-tenantid': 'tenant-id' },
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        'All given users added to their valid groups',
      );
    });

    it('should return error message if no valid userId and groupId given', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: { tenantsId: 'tenant-id' },
      });
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue({
        id: 'tenant-id',
      });

      const result = await service.addUser(
        { members: [{ groupId: null, userIds: [''] }] },
        { 'x-stencil-tenantid': 'tenant-id' },
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        'No valid userId and groupId given to add users to their given groups',
      );
    });

    it('should return error message if group id does not exist in db', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: { tenantsId: 'tenant-id' },
      });
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue({
        id: 'tenant-id',
      });
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.addUser(
        {
          members: [{ groupId: 'agroup', userIds: ['a user', 'another user'] }],
        } as addUserDTO,
        { 'x-stencil-tenantid': 'tenant-id' },
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        'No valid userId and groupId given to add users to their given groups',
      );
    });

    it('should return error message if user is not authorized', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: { tenantsId: 'tenant-id' },
      });
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue({
        id: 'tenant-id',
      });
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue({
        id: 'group-id',
        tenantId: 'another-tenant-id',
      });

      const result = await service.addUser(
        { members: [{ groupId: 'group-id', userIds: ['user-id'] }] },
        { 'x-stencil-tenantid': 'tenant-id' },
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        'No valid userId and groupId given to add users to their given groups',
      );
    });
  });

  describe('deleteByMemberId', () => {
    it('should throw UnauthorizedException if route validation fails', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: false,
        message: 'Unauthorized',
      });

      await expect(service.deleteByMemberId('uuid', {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException if uuid is not provided', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: {},
      });

      await expect(service.deleteByMemberId('', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if member does not exist', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: {},
      });
      (prismaService.groupMember.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(service.deleteByMemberId('uuid', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return success message if member is deleted successfully', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: { tenantsId: 'tenant-id' },
      });
      (prismaService.groupMember.findUnique as jest.Mock).mockResolvedValue({
        id: 'member-id',
        groupId: 'group-id',
      });
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue({
        tenantId: 'tenant-id',
      });
      (prismaService.groupMember.delete as jest.Mock).mockResolvedValue({
        id: 'member-id',
      });

      const result = await service.deleteByMemberId('uuid', {
        'x-stencil-tenantid': 'tenant-id',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Memeber deleted successfully');
    });

    it('should handle errors while deleting member by id', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: { tenantsId: null },
      });
      (prismaService.groupMember.findUnique as jest.Mock).mockResolvedValue({
        id: 'member-id',
        groupId: 'group-id',
      });
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue({
        tenantId: 'tenantid',
      });
      jest
        .spyOn(prismaService.groupMember, 'delete')
        .mockRejectedValue(new Error('Error'));

      await expect(
        service.deleteByMemberId('uuid', { authorization: 'master' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteViaUserAndGpId', () => {
    it('should throw UnauthorizedException if route validation fails', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: false,
        message: 'Unauthorized',
      });

      await expect(
        service.deleteViaUserAndGpId('user-id', 'gp-id', {}),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if userId or gpId is not provided', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: {},
      });

      await expect(
        service.deleteViaUserAndGpId('', 'gp-id', {}),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.deleteViaUserAndGpId('user-id', '', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if group does not exist', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: {},
      });
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.deleteViaUserAndGpId('user-id', 'gp-id', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return success message if user membership is deleted successfully', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: { tenantsId: 'tenant-id' },
      });
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue({
        tenantId: 'tenant-id',
      });
      (prismaService.groupMember.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-id',
        groupId: 'gp-id',
      });
      (prismaService.groupMember.delete as jest.Mock).mockResolvedValue({
        id: 'membership-id',
      });

      const result = await service.deleteViaUserAndGpId('user-id', 'gp-id', {
        'x-stencil-tenantid': 'tenant-id',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('user membership deleted successfully');
    });

    it('should handle errors while deleting user membership', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: { tenantsId: 'tenant-id' },
      });
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue({
        tenantId: 'tenant-id',
      });
      (prismaService.groupMember.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-id',
        groupId: 'gp-id',
      });
      jest
        .spyOn(prismaService.groupMember, 'delete')
        .mockRejectedValue(new Error('Error'));

      await expect(
        service.deleteViaUserAndGpId('user-id', 'gp-id', {
          authorization: 'masterkey',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteAllUser', () => {
    it('should throw UnauthorizedException if route validation fails', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: false,
        message: 'Unauthorized',
      });

      await expect(service.deleteAllUser('gp-id', {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException if gpId is not provided', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: {},
      });

      await expect(service.deleteAllUser('', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if group does not exist', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: {},
      });
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteAllUser('gp-id', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return success message if all users are removed from group', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: { tenantsId: 'tenant-id' },
      });
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue({
        tenantId: 'tenant-id',
      });
      (prismaService.groupMember.deleteMany as jest.Mock).mockResolvedValue({
        count: 5,
      });

      const result = await service.deleteAllUser('gp-id', {
        'x-stencil-tenantid': 'tenant-id',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('All users removed from group');
      expect(result.data).toEqual({ count: 5 });
    });

    it('should handle errors while deleting all users from group', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: {tenantsId: null},
      });
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue({
        tenantId: 'tenant-id',
      });
      jest
        .spyOn(prismaService.groupMember, 'deleteMany')
        .mockRejectedValue(new Error('Error'));

      await expect(service.deleteAllUser('gp-id', {authorization: 'key-value'})).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteMembers', () => {
    it('should throw UnauthorizedException if route validation fails', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: false,
        message: 'Unauthorized',
      });

      await expect(
        service.deleteMembers({ members: ['member-id'] }, {}),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return success message if members are deleted successfully', async () => {
      (headerAuthService.validateRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: { tenantsId: 'tenant-id' },
      });
      (prismaService.groupMember.findUnique as jest.Mock).mockResolvedValue({
        id: 'member-id',
        groupId: 'group-id',
      });
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue({
        tenantId: 'tenant-id',
      });
      (prismaService.groupMember.delete as jest.Mock).mockResolvedValue({
        id: 'member-id',
      });

      const result = await service.deleteMembers(
        { members: ['member-id'] },
        { 'x-stencil-tenantid': 'tenant-id' },
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('members deleted successfully');
    });
  });
});
